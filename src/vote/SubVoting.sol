// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IERC1271 {
    function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4);
}

/**
 * @title SubVoting
 * @notice 서브 투표 기록 저장 컨트랙트 (레코드별 유저 서명 + Executor 배치 서명)
 */
contract SubVoting is Ownable2Step, ReentrancyGuard, EIP712 {
    // NOTE: eventVotes 는 과거 하위호환용 '조회'만 유지. 쓰기 금지 (가스 DoS 방지)

    // ========================================
    // Constants
    // ========================================
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;

    uint256 private constant MAX_BATCH_SIZE = 500;       // DoS 방지
    uint256 private constant MAX_STRING_LENGTH = 100;    // 가스 그리핑 방지

    uint256 public constant MAX_VOTES_PER_VOTING = 100000; // votingId별 상한
    uint256 public constant MAX_QUERY_LIMIT = 100;          // 조회 상한

    // ========================================
    // EIP-712 Type Hashes
    // ========================================

    // 개별 투표 서명용 (한 사용자가 하나의 투표를 서명)
    bytes32 private constant VOTE_RECORD_TYPEHASH = keccak256(
        "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,bytes32 userIdHash,bytes32 votingForHash,bytes32 votedOnHash,uint256 votingAmt,uint256 nonce,uint256 deadline)"
    );

    // Executor 배치 서명용 (per-record digest들의 keccak)
    bytes32 private constant BATCH_TYPEHASH = keccak256(
        "Batch(uint256 chainId,bytes32 itemsHash,uint256 batchNonce)"
    );

    // ========================================
    // Errors
    // ========================================
    error ZeroAddress();
    error ExpiredSignature();
    error InvalidSignature();
    error BadChain();
    error ZeroVotingAmt();
    error UserNonceAlreadyUsed();
    error UserNonceTooLow();
    error BatchNonceAlreadyUsed();
    error BatchNonceTooLow();
    error LengthMismatch();
    error BatchTooLarge();
    error StringTooLong();
    error AlreadyProcessed();
    error QueryLimitExceeded();
    error VotingCapacityExceeded();

    // ========================================
    // Data Structures
    // ========================================

    struct VoteRecord {
        uint256 timestamp;
        uint256 missionId;
        uint256 votingId;
        address userAddress;
        string userId;
        string votingFor;
        string votedOn;
        uint256 votingAmt;
        uint256 deadline;
    }

    // ========================================
    // Storage
    // ========================================

    // [DEPRECATED] missionId => VoteRecord[] (하위 호환성 유지)
    mapping(uint256 => VoteRecord[]) public eventVotes;

    // 조회/인덱싱용
    mapping(bytes32 => VoteRecord) public votes;                               // voteHash => VoteRecord
    mapping(uint256 => mapping(uint256 => uint256)) public voteCount;          // missionId => votingId => count
    mapping(uint256 => uint256) public voteCountByMission;                     // missionId => total
    mapping(uint256 => mapping(uint256 => bytes32[])) private voteHashesByVotingId; // missionId => votingId => [voteHash]

    // 논스 관리
    mapping(address => mapping(uint256 => bool)) public userNonceUsed; // user => nonce => used
    mapping(address => uint256) public minUserNonce;                   // user => min nonce
    mapping(address => mapping(uint256 => bool)) public batchNonceUsed; // signer => nonce => used
    mapping(address => uint256) public minBatchNonce;                   // signer => min nonce

    // 리플레이 방지 (레코드 자체의 digest 소비)
    mapping(bytes32 => bool) public consumed; // recordDigest (EIP712) => consumed

    uint256 public immutable CHAIN_ID;
    address public executorSigner;

    // ========================================
    // Events
    // ========================================
    // 인덱싱 편의를 위해 단일 이벤트만 유지 (최초 설정 시 oldSigner = address(0))
    event ExecutorSignerChanged(address indexed oldSigner, address indexed newSigner, uint256 oldMinNonce);

    event VoteRecordAdded(
        bytes32 indexed voteHash,
        bytes32 indexed batchDigest,
        uint256 indexed missionId,
        uint256 votingId,
        address userAddress,
        string userId,
        string votingFor,
        string votedOn,
        uint256 votingAmt,
        uint256 timestamp
    );

    event BatchProcessed(
        bytes32 indexed batchDigest,
        address indexed executorSigner,
        uint256 batchNonce,
        uint256 recordCount
    );

    event CancelUserNonceUpTo(address indexed user, uint256 newMinUserNonce);
    event CancelBatchNonceUpTo(address indexed executorSigner, uint256 newMinBatchNonce);

    // ========================================
    // Constructor
    // ========================================
    constructor(address initialOwner) EIP712("SubVoting", "1") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        CHAIN_ID = block.chainid;
    }

    // ========================================
    // Admin
    // ========================================
    function setExecutorSigner(address s) external onlyOwner {
        if (s == address(0)) revert ZeroAddress();
        address oldSigner = executorSigner;
        uint256 oldMinNonce = minBatchNonce[oldSigner];
        if (oldSigner != address(0)) {
            // 이전 서명자 논스 전부 무효화 (mempool 공격 차단)
            minBatchNonce[oldSigner] = type(uint256).max;
        }
        executorSigner = s;
        emit ExecutorSignerChanged(oldSigner, s, oldMinNonce);
    }

    // ========================================
    // User / Executor: Nonce 취소
    // ========================================
    function cancelAllUserNonceUpTo(uint256 newMinUserNonce) external {
        if (newMinUserNonce <= minUserNonce[msg.sender]) revert UserNonceTooLow();
        minUserNonce[msg.sender] = newMinUserNonce;
        emit CancelUserNonceUpTo(msg.sender, newMinUserNonce);
    }

    function cancelAllBatchNonceUpTo(uint256 newMinBatchNonce) external {
        if (msg.sender != owner() && msg.sender != executorSigner) revert InvalidSignature();
        if (newMinBatchNonce <= minBatchNonce[executorSigner]) revert BatchNonceTooLow();
        minBatchNonce[executorSigner] = newMinBatchNonce;
        emit CancelBatchNonceUpTo(executorSigner, newMinBatchNonce);
    }

    // ========================================
    // Internal: Helpers
    // ========================================
    function _validateStringLength(string calldata s) internal pure {
        if (bytes(s).length > MAX_STRING_LENGTH) revert StringTooLong();
    }

    // 레코드별 유저 서명 다이제스트 (EIP-712)
    function _hashVoteRecord(VoteRecord calldata r, uint256 userNonce) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    VOTE_RECORD_TYPEHASH,
                    r.timestamp,
                    r.missionId,
                    r.votingId,
                    r.userAddress,
                    keccak256(bytes(r.userId)),
                    keccak256(bytes(r.votingFor)),
                    keccak256(bytes(r.votedOn)),
                    r.votingAmt,
                    userNonce,
                    r.deadline
                )
            )
        );
    }

    // 배치 다이제스트 (per-record digest들의 keccak을 itemsHash로 사용)
    function _hashBatch(bytes32 itemsHash, uint256 batchNonce) internal view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(BATCH_TYPEHASH, block.chainid, itemsHash, batchNonce)));
    }

    function _isValidUserSig(address user, bytes32 digest, bytes calldata sig) internal view returns (bool) {
        if (user.code.length == 0) {
            return ECDSA.recover(digest, sig) == user; // EOA
        } else {
            (bool ok, bytes memory ret) = user.staticcall(
                abi.encodeWithSelector(IERC1271.isValidSignature.selector, digest, sig)
            );
            return ok && ret.length == 4 && bytes4(ret) == ERC1271_MAGICVALUE; // ERC-1271
        }
    }

    function _consumeUserNonce(address user, uint256 nonce_) internal {
        if (nonce_ < minUserNonce[user]) revert UserNonceTooLow();
        if (userNonceUsed[user][nonce_]) revert UserNonceAlreadyUsed();
        userNonceUsed[user][nonce_] = true;
    }

    function _consumeBatchNonce(address signer, uint256 nonce_) internal {
        if (nonce_ < minBatchNonce[signer]) revert BatchNonceTooLow();
        if (batchNonceUsed[signer][nonce_]) revert BatchNonceAlreadyUsed();
        batchNonceUsed[signer][nonce_] = true;
    }

    // ========================================
    // Internal: Store
    // ========================================
    function _storeVoteRecords(
        VoteRecord[] calldata records,
        uint256[] calldata userNonces,
        bytes32 batchDigest
    ) internal {
        uint256 len = records.length;
        for (uint256 i; i < len; ) {
            VoteRecord calldata r = records[i];

            if (r.userAddress == address(0)) revert ZeroAddress();
            if (r.deadline < block.timestamp) revert ExpiredSignature();
            if (r.votingAmt == 0) revert ZeroVotingAmt();

            // votingId 상한 체크
            uint256 current = voteCount[r.missionId][r.votingId];
            if (current >= MAX_VOTES_PER_VOTING) revert VotingCapacityExceeded();

            // 레코드 리플레이 방지 (레코드 자체 다이제스트 소비)
            bytes32 recordDigest = _hashVoteRecord(r, userNonces[i]);
            if (consumed[recordDigest]) revert AlreadyProcessed();
            consumed[recordDigest] = true;

            // 조회 키 (하위 호환: 배치 인덱스 포함)
            bytes32 voteHash = keccak256(abi.encode(r.userAddress, r.missionId, r.votingId, r.timestamp, i));


            // 인덱싱
            votes[voteHash] = r;
            voteHashesByVotingId[r.missionId][r.votingId].push(voteHash);
            voteCount[r.missionId][r.votingId] = current + 1;
            voteCountByMission[r.missionId] += 1;

            emit VoteRecordAdded(
                voteHash,
                batchDigest,
                r.missionId,
                r.votingId,
                r.userAddress,
                r.userId,
                r.votingFor,
                r.votedOn,
                r.votingAmt,
                r.timestamp
            );

            unchecked { ++i; }
        }
    }

    // ========================================
    // External: Submit Sub Vote Batch
    // ========================================
    /**
     * @notice 서브 투표 기록 배치 제출
     * @dev 끼워넣기 방지:
     *  - Executor는 per-record digest들의 keccak(itemsHash)에 서명하고,
     *  - 온체인은 동일 배열을 재계산하여 일치 검증 → 레코드 추가/삭제/순서변경 불가.
     *  - 각 레코드는 유저 EIP-712 서명 및 개별 nonce로 검증되어 대체/중복 불가.
     */
    function submitSubVoteBatch(
        VoteRecord[] calldata records,
        uint256[] calldata userNonces,
        bytes[] calldata userSigs,
        uint256 batchNonce,
        bytes calldata executorSig
    ) external nonReentrant {
        if (records.length > MAX_BATCH_SIZE) revert BatchTooLarge();
        if (executorSigner == address(0)) revert ZeroAddress();
        if (block.chainid != CHAIN_ID) revert BadChain();
        if (records.length != userNonces.length || records.length != userSigs.length) revert LengthMismatch();

        // 1) 문자열 길이 선검증 (가스 그리핑 방지)
        uint256 n = records.length;
        for (uint256 i; i < n; ) {
            _validateStringLength(records[i].userId);
            _validateStringLength(records[i].votingFor);
            _validateStringLength(records[i].votedOn);
            unchecked { ++i; }
        }

        // 2) per-record digest 계산 (유저 서명용과 동일한 포맷)
        bytes32[] memory digests = new bytes32[](n);
        for (uint256 i; i < n; ) {
            digests[i] = _hashVoteRecord(records[i], userNonces[i]);
            unchecked { ++i; }
        }

        // 3) Executor 배치 서명 검증 (abi.encodePacked(digests))
        bytes32 itemsHash = keccak256(abi.encodePacked(digests));
        bytes32 batchDigest = _hashBatch(itemsHash, batchNonce);
        address recoveredExec = ECDSA.recover(batchDigest, executorSig);
        if (recoveredExec != executorSigner) revert InvalidSignature();
        _consumeBatchNonce(executorSigner, batchNonce);

        // 4) 각 레코드의 유저 서명/논스 검증
        for (uint256 i; i < n; ) {
            VoteRecord calldata r = records[i];
            uint256 nonce_ = userNonces[i];
            bytes calldata sig_ = userSigs[i];

            _consumeUserNonce(r.userAddress, nonce_);
            if (!_isValidUserSig(r.userAddress, digests[i], sig_)) revert InvalidSignature();
            unchecked { ++i; }
        }

        // 5) 저장 및 이벤트
        _storeVoteRecords(records, userNonces, batchDigest);
        emit BatchProcessed(batchDigest, executorSigner, batchNonce, records.length);
    }

    // ========================================
    // Views / Pagination
    // ========================================
    function getVoteByHash(bytes32 voteHash) external view returns (VoteRecord memory) {
        return votes[voteHash];
    }

    function getVoteCount(uint256 missionId) external view returns (uint256) {
        return voteCountByMission[missionId];
    }

    function getVoteCountByVotingId(uint256 missionId, uint256 votingId) external view returns (uint256) {
        return voteCount[missionId][votingId];
    }

    function getVoteHashesByVotingId(
        uint256 missionId,
        uint256 votingId,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory) {
        if (limit > MAX_QUERY_LIMIT) revert QueryLimitExceeded();
        bytes32[] storage allHashes = voteHashesByVotingId[missionId][votingId];
        uint256 total = allHashes.length;
        if (offset >= total) return new bytes32[](0);
        uint256 end = offset + limit; if (end > total) end = total;
        uint256 len = end - offset;
        bytes32[] memory out = new bytes32[](len);
        for (uint256 i; i < len; ) { out[i] = allHashes[offset + i]; unchecked { ++i; } }
        return out;
    }

    function getVoteHashesByVotingIdWithTotal(
        uint256 missionId,
        uint256 votingId,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory, uint256 totalCount) {
        if (limit > MAX_QUERY_LIMIT) revert QueryLimitExceeded();
        bytes32[] storage allHashes = voteHashesByVotingId[missionId][votingId];
        totalCount = allHashes.length;
        if (offset >= totalCount) return (new bytes32[](0), totalCount);
        uint256 end = offset + limit; if (end > totalCount) end = totalCount;
        uint256 len = end - offset;
        bytes32[] memory out = new bytes32[](len);
        for (uint256 i; i < len; ) { out[i] = allHashes[offset + i]; unchecked { ++i; } }
        return (out, totalCount);
    }

    function getVotesByVotingId(
        uint256 missionId,
        uint256 votingId,
        uint256 offset,
        uint256 limit
    ) external view returns (VoteRecord[] memory) {
        if (limit > MAX_QUERY_LIMIT) revert QueryLimitExceeded();
        bytes32[] storage allHashes = voteHashesByVotingId[missionId][votingId];
        uint256 total = allHashes.length;
        if (offset >= total) return new VoteRecord[](0);
        uint256 end = offset + limit; if (end > total) end = total;
        uint256 len = end - offset;
        VoteRecord[] memory out = new VoteRecord[](len);
        for (uint256 i; i < len; ) { out[i] = votes[allHashes[offset + i]]; unchecked { ++i; } }
        return out;
    }

    function getVotesByVotingIdWithTotal(
        uint256 missionId,
        uint256 votingId,
        uint256 offset,
        uint256 limit
    ) external view returns (VoteRecord[] memory, uint256 totalCount) {
        if (limit > MAX_QUERY_LIMIT) revert QueryLimitExceeded();
        bytes32[] storage allHashes = voteHashesByVotingId[missionId][votingId];
        totalCount = allHashes.length;
        if (offset >= totalCount) return (new VoteRecord[](0), totalCount);
        uint256 end = offset + limit; if (end > totalCount) end = totalCount;
        uint256 len = end - offset;
        VoteRecord[] memory out = new VoteRecord[](len);
        for (uint256 i; i < len; ) { out[i] = votes[allHashes[offset + i]]; unchecked { ++i; } }
        return (out, totalCount);
    }

    // 기타
    function getEventVotes(uint256 missionId) external view returns (VoteRecord[] memory) {
        return eventVotes[missionId];
    }

    function domainSeparator() external view returns (bytes32) { return _domainSeparatorV4(); }

    // 프리뷰
    function hashVoteRecordPreview(VoteRecord calldata r, uint256 nonce) external view returns (bytes32) {
        return _hashVoteRecord(r, nonce);
    }

    function hashBatchPreview(VoteRecord[] calldata records, uint256[] calldata userNonces, uint256 batchNonce)
        external
        view
        returns (bytes32)
    {
        if (records.length != userNonces.length) revert LengthMismatch();
        bytes32[] memory digests = new bytes32[](records.length);
        for (uint256 i; i < digests.length; ) { digests[i] = _hashVoteRecord(records[i], userNonces[i]); unchecked { ++i; } }
        return _hashBatch(keccak256(abi.encodePacked(digests)), batchNonce);
    }
}
