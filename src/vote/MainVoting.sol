// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IERC1271 {
    function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4);
}

/**
 * @title MainVoting
 * @notice 유저별 투표 여부/총량만 추적하는 생존 투표 컨트랙트
 * @dev (1) voteHash 충돌 제거, (2) AlreadyProcessed 스킵, (3) Executor ERC-1271 지원,
 *      (4) 배치 서명에 itemsHash 포함(무결성 강제)
 */
contract MainVoting is Ownable2Step, EIP712 {
    // ========================================
    // Constants
    // ========================================
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;

    uint256 public constant MAX_RECORDS_PER_BATCH = 500;
    uint256 public constant MAX_RECORDS_PER_USER_BATCH = 50;
    uint256 public constant MAX_QUERY_LIMIT = 100;
    uint256 public constant MAX_STRING_LENGTH = 100;

    // ========================================
    // EIP-712 Type Hashes
    // ========================================
    bytes32 private constant VOTE_RECORD_TYPEHASH = keccak256(
        "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,bytes32 userIdHash,bytes32 votingForHash,bytes32 votedOnHash,uint256 votingAmt,uint256 deadline,uint256 recordNonce)"
    );

    bytes32 private constant USER_BATCH_TYPEHASH = keccak256(
        "UserBatch(address user,uint256 userNonce,bytes32 recordsHash)"
    );

    // itemsHash 포함
    bytes32 private constant BATCH_TYPEHASH = keccak256(
        "Batch(uint256 chainId,bytes32 itemsHash,uint256 batchNonce)"
    );

    // ========================================
    // Errors
    // ========================================
    error ZeroAddress();
    error InvalidSignature();
    error BadChain();
    error UserNonceAlreadyUsed();
    error UserNonceTooLow();
    error BatchNonceAlreadyUsed();
    error BatchNonceTooLow();
    error InvalidRecordIndices();
    error BatchTooLarge();
    error UserBatchTooLarge();
    error QueryLimitExceeded();
    error StringTooLong();
    error UncoveredRecord(uint256 index);
    error DuplicateIndex(uint256 index);
    error LengthMismatch();

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

    struct UserBatchSig {
        address user;
        uint256 userNonce;
        uint256[] recordIndices;
        bytes signature;
    }

    struct UserAgg {
        uint256 totalAmt;
        uint256 count;
    }

    // ========================================
    // Storage
    // ========================================
    mapping(bytes32 => VoteRecord) public votes;
    mapping(address => mapping(uint256 => mapping(uint256 => UserAgg))) public userAgg;
    mapping(address => mapping(uint256 => mapping(uint256 => bytes32[]))) private userVoteHashes;

    mapping(uint256 => mapping(uint256 => uint256)) public voteCount;
    mapping(uint256 => uint256) public voteCountByMission;

    mapping(address => mapping(uint256 => bool)) public userNonceUsed;
    mapping(address => uint256) public minUserNonce;

    mapping(address => mapping(uint256 => bool)) public batchNonceUsed;
    mapping(address => uint256) public minBatchNonce;

    mapping(bytes32 => bool) public consumed;

    uint256 public immutable CHAIN_ID;
    address public executorSigner;

    // ========================================
    // Events
    // ========================================
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
        uint256 recordCount,
        uint256 userCount
    );
    event CancelUserNonceUpTo(address indexed user, uint256 newMinUserNonce);
    event CancelBatchNonceUpTo(address indexed executorSigner, uint256 newMinBatchNonce);

    // ========================================
    // Constructor
    // ========================================
    constructor(address initialOwner) EIP712("MainVoting", "1") Ownable(initialOwner) {
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
            minBatchNonce[oldSigner] = type(uint256).max;
        }

        executorSigner = s;
        emit ExecutorSignerChanged(oldSigner, s, oldMinNonce);
    }

    // ========================================
    // User: Nonce 취소
    // ========================================
    function cancelAllUserNonceUpTo(address user, uint256 newMinUserNonce) external onlyOwner {
        if (newMinUserNonce <= minUserNonce[user]) revert UserNonceTooLow();
        minUserNonce[user] = newMinUserNonce;
        emit CancelUserNonceUpTo(user, newMinUserNonce);
    }

    function cancelAllBatchNonceUpTo(uint256 newMinBatchNonce) external {
        if (msg.sender != owner() && msg.sender != executorSigner) revert InvalidSignature();
        if (newMinBatchNonce <= minBatchNonce[executorSigner]) revert BatchNonceTooLow();
        minBatchNonce[executorSigner] = newMinBatchNonce;
        emit CancelBatchNonceUpTo(executorSigner, newMinBatchNonce);
    }

    // ========================================
    // Internal: Hashers
    // ========================================
    function _hashVoteRecord(
        VoteRecord calldata record,
        uint256 recordNonce
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                VOTE_RECORD_TYPEHASH,
                record.timestamp,
                record.missionId,
                record.votingId,
                record.userAddress,
                keccak256(bytes(record.userId)),
                keccak256(bytes(record.votingFor)),
                keccak256(bytes(record.votedOn)),
                record.votingAmt,
                record.deadline,
                recordNonce
            )
        );
    }

    function _hashUserBatch(
        address user,
        uint256 userNonce,
        bytes32 recordsHash
    ) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(abi.encode(USER_BATCH_TYPEHASH, user, userNonce, recordsHash))
        );
    }

    // itemsHash 포함 배치 다이제스트
    function _hashBatch(bytes32 itemsHash, uint256 batchNonce) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(abi.encode(BATCH_TYPEHASH, block.chainid, itemsHash, batchNonce))
        );
    }

    // ========================================
    // Internal: Signature Verification
    // ========================================
    function _isValidUserSig(
        address user,
        bytes32 digest,
        bytes calldata sig
    ) internal view returns (bool) {
        if (user.code.length == 0) {
            return ECDSA.recover(digest, sig) == user;
        } else {
            (bool ok, bytes memory ret) = user.staticcall(
                abi.encodeWithSelector(IERC1271.isValidSignature.selector, digest, sig)
            );
            return ok && ret.length == 4 && bytes4(ret) == ERC1271_MAGICVALUE;
        }
    }

    function _isValidExecSig(
        address signer,
        bytes32 digest,
        bytes calldata sig
    ) internal view returns (bool) {
        if (signer.code.length == 0) {
            return ECDSA.recover(digest, sig) == signer;
        } else {
            (bool ok, bytes memory ret) = signer.staticcall(
                abi.encodeWithSelector(IERC1271.isValidSignature.selector, digest, sig)
            );
            return ok && ret.length == 4 && bytes4(ret) == ERC1271_MAGICVALUE;
        }
    }

    // ========================================
    // Internal: Nonce Management
    // ========================================
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
    // Internal: User Batch Verification (Coverage 강제)
    // ========================================
    function _verifyUserBatchSignature(
        VoteRecord[] calldata records,
        UserBatchSig calldata userBatch,
        bool[] memory covered,
        bytes32[] memory recordDigests
    ) internal {
        uint256 indicesLen = userBatch.recordIndices.length;
        if (indicesLen > MAX_RECORDS_PER_USER_BATCH) revert UserBatchTooLarge();

        bytes32[] memory userHashes = new bytes32[](indicesLen);

        for (uint256 j; j < indicesLen; ) {
            uint256 idx = userBatch.recordIndices[j];

            if (idx >= records.length) revert InvalidRecordIndices();
            if (covered[idx]) revert DuplicateIndex(idx);
            covered[idx] = true;

            VoteRecord calldata record = records[idx];
            if (record.userAddress != userBatch.user) revert InvalidSignature();

            userHashes[j] = recordDigests[idx];
            unchecked { ++j; }
        }

        bytes32 recordsHash = keccak256(abi.encodePacked(userHashes));
        bytes32 userBatchDigest = _hashUserBatch(userBatch.user, userBatch.userNonce, recordsHash);

        if (!_isValidUserSig(userBatch.user, userBatchDigest, userBatch.signature)) {
            revert InvalidSignature();
        }

        _consumeUserNonce(userBatch.user, userBatch.userNonce);
    }

    // ========================================
    // Internal: Store (부분 처리 지원)
    // ========================================
    function _storeVoteRecords(
        VoteRecord[] calldata records,
        bytes32 batchDigest,
        bytes32[] memory recordDigests
    ) internal returns (uint256 storedCount) {
        uint256 len = records.length;
        if (len > MAX_RECORDS_PER_BATCH) revert BatchTooLarge();

        for (uint256 i; i < len; ) {
            VoteRecord calldata record = records[i];

            if (record.userAddress == address(0)) revert ZeroAddress();
            if (record.deadline <= block.timestamp) { unchecked { ++i; } continue; }
            if (record.votingAmt == 0) { unchecked { ++i; } continue; }

            bytes32 recordDigest = recordDigests[i];
            if (consumed[recordDigest]) { unchecked { ++i; } continue; }
            consumed[recordDigest] = true;

            bytes32 voteHash = recordDigest;

            votes[voteHash] = record;

            UserAgg storage agg = userAgg[record.userAddress][record.missionId][record.votingId];
            unchecked {
                agg.totalAmt += record.votingAmt;
                agg.count += 1;
            }
            userVoteHashes[record.userAddress][record.missionId][record.votingId].push(voteHash);

            voteCount[record.missionId][record.votingId] += 1;
            voteCountByMission[record.missionId] += 1;

            emit VoteRecordAdded(
                voteHash,
                batchDigest,
                record.missionId,
                record.votingId,
                record.userAddress,
                record.userId,
                record.votingFor,
                record.votedOn,
                record.votingAmt,
                record.timestamp
            );

            unchecked {
                ++storedCount;
                ++i;
            }
        }
    }

    // ========================================
    // Main: Submit Multi-User Batch
    // ========================================
    function submitMultiUserBatch(
        VoteRecord[] calldata records, // ① 이번에 올릴 모든 투표 레코드 원본
        UserBatchSig[] calldata userBatchSigs,// ② 유저별 "내 표 묶음"에 대한 서명 패킷들
        uint256 batchNonce,// ③ 배치 재사용(리플레이) 방지용 논스
        bytes calldata executorSig,// ④ 백엔드(Executor) 서명
        uint256[] calldata recordNonces// ⑤ 레코드별 고유 논스(레코드 식별 강제)
    ) external {
        uint256 len = records.length; // 배치 레코드 개수
        if (len > MAX_RECORDS_PER_BATCH) revert BatchTooLarge();// 과대 배치 방어(DoS 가드)
        if (len != recordNonces.length) revert InvalidRecordIndices(); // 레코드:논스 개수 1:1 검증
        if (executorSigner == address(0)) revert ZeroAddress();// executorSigner 미설정 방지
        if (block.chainid != CHAIN_ID) revert BadChain(); // 체인 고정(리플레이 방지)

        // 1) 각 레코드 다이제스트 산출 + 문자열 길이 검증
        bytes32[] memory recordDigests = new bytes32[](len); // 온체인에서 재계산할 다이제스트 배열
        for (uint256 i; i < len; ) {
    if (bytes(records[i].userId).length > MAX_STRING_LENGTH) revert StringTooLong();
if (bytes(records[i].votingFor).length > MAX_STRING_LENGTH) revert StringTooLong();
if (bytes(records[i].votedOn).length > MAX_STRING_LENGTH) revert StringTooLong();
            recordDigests[i] = _hashVoteRecord(records[i], recordNonces[i]); // EIP-712 타입 고정 + 문자열 해시 + recordNonce 포함
            unchecked { ++i; }// 가스 미세 최적화
        }

        // 2) itemsHash 계산 → 배치 서명 검증
        bytes32 itemsHash = keccak256(abi.encodePacked(recordDigests)); // 모든 레코드 해시를 순서대로 이어붙여 요약
        bytes32 batchDigest = _hashBatch(itemsHash, batchNonce); // (chainId, itemsHash, batchNonce)로 EIP-712 다이제스트
        if (!_isValidExecSig(executorSigner, batchDigest, executorSig)) revert InvalidSignature(); // executor 서명 진짜인지 확인(EOA/1271 지원)
        
        _consumeBatchNonce(executorSigner, batchNonce); // 배치 논스 소모(재사용 금지)

        // 3) 유저 서명 검증(커버리지 강제)
        bool[] memory covered = new bool[](len); // 레코드별 “유저 서명으로 커버됐는지” 체크 플래그
        uint256 userBatchLen = userBatchSigs.length; // 유저 패킷 개수
        for (uint256 i; i < userBatchLen; ) {
            // 유저별로: 인덱스 유효성, 소유자 일치, EIP-712 서명, userNonce 소모
            _verifyUserBatchSignature(records, userBatchSigs[i], covered, recordDigests);
            unchecked { ++i; }
        }
        for (uint256 k; k < len; ) {
            // 커버리지 강제: 한 개라도 미커버면 전체 revert
            if (!covered[k]) revert UncoveredRecord(k);
            unchecked { ++k; }
        }

        // 4) 저장
        
        uint256 stored = _storeVoteRecords(records, batchDigest, recordDigests);// 만료/0/이미 처리된 건 스킵, 유효분만 상태 반영
        emit BatchProcessed(batchDigest, executorSigner, batchNonce, stored, userBatchLen);
    }

    // ========================================
    // View / Utils
    // ========================================
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function getUserVotingStat(
        address user,
        uint256 missionId,
        uint256 votingId
    ) external view returns (bool hasVoted, uint256 totalAmt, uint256 count) {
        UserAgg memory agg = userAgg[user][missionId][votingId];
        hasVoted = (agg.count > 0);
        totalAmt = agg.totalAmt;
        count = agg.count;
    }

    function getUserVoteHashes(
        address user,
        uint256 missionId,
        uint256 votingId,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory) {
        if (limit > MAX_QUERY_LIMIT) revert QueryLimitExceeded();

        bytes32[] storage allHashes = userVoteHashes[user][missionId][votingId];
        uint256 totalCount = allHashes.length;

        if (offset >= totalCount) {
            return new bytes32[](0);
        }

        uint256 end = offset + limit;
        if (end > totalCount) end = totalCount;

        uint256 resultLength = end - offset;
        bytes32[] memory result = new bytes32[](resultLength);
        for (uint256 i; i < resultLength; ) {
            result[i] = allHashes[offset + i];
            unchecked { ++i; }
        }
        return result;
    }

    function getVoteByHash(bytes32 voteHash) external view returns (VoteRecord memory) {
        return votes[voteHash];
    }

    function getVoteCount(uint256 missionId) external view returns (uint256) {
        return voteCountByMission[missionId];
    }

    function getVoteCountByVotingId(uint256 missionId, uint256 votingId) external view returns (uint256) {
        return voteCount[missionId][votingId];
    }

    // === 프리뷰 유틸 ===
    function hashVoteRecord(
        VoteRecord calldata record,
        uint256 recordNonce
    ) external pure returns (bytes32) {
        return _hashVoteRecord(record, recordNonce);
    }

    function hashUserBatchPreview(
        address user,
        uint256 userNonce,
        VoteRecord[] calldata userRecords,
        uint256[] calldata userRecordNonces
    ) external view returns (bytes32) {
        if (userRecords.length != userRecordNonces.length) revert LengthMismatch();
        bytes32[] memory hashes = new bytes32[](userRecords.length);
        for (uint256 i; i < hashes.length; ) {
            hashes[i] = _hashVoteRecord(userRecords[i], userRecordNonces[i]);
            unchecked { ++i; }
        }
        return _hashUserBatch(user, userNonce, keccak256(abi.encodePacked(hashes)));
    }

    // 실행자 배치 프리뷰 — itemsHash 포함
    function hashBatchPreview(
        VoteRecord[] calldata records,
        uint256[] calldata recordNonces,
        uint256 batchNonce
    ) external view returns (bytes32) {
        if (records.length != recordNonces.length) revert LengthMismatch();
        bytes32[] memory hashes = new bytes32[](records.length);
        for (uint256 i; i < hashes.length; ) {
            hashes[i] = _hashVoteRecord(records[i], recordNonces[i]);
            unchecked { ++i; }
        }
        bytes32 itemsHash = keccak256(abi.encodePacked(hashes));
        return _hashBatch(itemsHash, batchNonce);
    }
}
