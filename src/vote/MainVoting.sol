// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IERC1271 {
    function isValidSignature(
        bytes32 hash,
        bytes calldata signature
    ) external view returns (bytes4);
}

/**
 * @title MainVoting
 * @notice EIP-712 서명 기반 배치 투표 시스템 (V1 - 단순화된 설계)
 * @dev 백엔드는 batchNonce만 서명, 모든 검증은 컨트랙트에서 수행
 *      - 이중 서명: 유저 서명 + 백엔드 서명
 *      - 문자열 해시 방식: 가스 최적화
 *      - 배치 크기 제한: 최대 5000개(실제 테스트 후 조정 예정)
 *      - 유저당 배치 제한: 최대 20개
 */
contract MainVoting is Ownable2Step, EIP712 {
    // ========================================
    // Constants
    // ========================================
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;

    uint256 public constant MAX_RECORDS_PER_BATCH = 5000;
    uint16 public constant MAX_RECORDS_PER_USER_BATCH = 20;
    uint16 public constant MAX_STRING_LENGTH = 100;
    uint8 public constant MAX_VOTE_TYPE = 1;

    uint8 public constant VOTE_TYPE_FORGET = 0;
    uint8 public constant VOTE_TYPE_REMEMBER = 1;

    // ========================================
    // EIP-712 Type Hashes
    // ========================================
    // 문자열 대신 candidateId + voteType만 포함
    bytes32 private constant VOTE_RECORD_TYPEHASH =
        keccak256(
            "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,bytes32 userIdHash,uint256 candidateId,uint8 voteType,uint256 votingAmt)"
        );

    bytes32 private constant USER_BATCH_TYPEHASH =
        keccak256(
            "UserBatch(address user,uint256 userNonce,bytes32 recordsHash)"
        );

    // 백엔드는 batchNonce만 서명
    bytes32 private constant BATCH_TYPEHASH =
        keccak256("Batch(uint256 batchNonce)");

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
    error StringTooLong();
    error NotOwnerOrExecutor();

    error UncoveredRecord(uint256 index);
    error DuplicateIndex(uint256 index);
    error CandidateNotAllowed(uint256 missionId, uint256 candidateId);
    error InvalidVoteType(uint8 value);

    // ========================================
    // Data Structures
    // ========================================
    struct VoteRecord {
        uint256 timestamp;
        uint256 missionId;
        uint256 votingId;
        address userAddress;
        uint256 candidateId;
        uint8 voteType; // 0 = Forget, 1 = Remember
        string userId;
        uint256 votingAmt;
    }

    struct UserBatchSig {
        address user;
        uint256 userNonce;
        uint256[] recordIndices;
        bytes signature;
    }

    struct VoteRecordSummary {
        uint256 timestamp;
        uint256 missionId;
        uint256 votingId;
        string userId;
        string votingFor; // 후보 이름 (candidateName)
        string votedOn; // 투표 타입 이름 (voteTypeName)
        uint256 votingAmt;
    }

    // ========================================
    // Storage
    // ========================================
    mapping(bytes32 => VoteRecord) public votes;

    // (missionId, votingId) 조합별 인덱스
    mapping(uint256 => mapping(uint256 => bytes32[]))
        private voteHashesByMissionVotingId;

    mapping(address => mapping(uint256 => bool)) public userNonceUsed;
    mapping(address => uint256) public minUserNonce;

    mapping(address => mapping(uint256 => bool)) public batchNonceUsed;
    mapping(address => uint256) public minBatchNonce;

    mapping(bytes32 => bool) public consumed;

    uint256 public immutable CHAIN_ID;
    address public executorSigner;

    // ----- 후보 / 타입 메타데이터 및 집계 -----

    // 후보 이름: missionId -> candidateId -> name
    mapping(uint256 => mapping(uint256 => string)) public candidateName;

    // 후보 허용 여부: missionId -> candidateId -> allowed
    mapping(uint256 => mapping(uint256 => bool)) public allowedCandidate;

    // voteType(0/1)에 대한 라벨: ex) 0="Forget", 1="Remember"
    mapping(uint8 => string) public voteTypeName;

    struct CandidateStats {
        uint256 remember;
        uint256 forget;
        uint256 total;
    }

    mapping(uint256 => mapping(uint256 => CandidateStats))
        public candidateStats;

    // ========================================
    // Events
    // ========================================
    event ExecutorSignerChanged(
        address indexed oldSigner,
        address indexed newSigner,
        uint256 oldMinNonce
    );
    event UserBatchProcessed(
        bytes32 indexed batchDigest,
        address indexed user,
        uint256 userNonce,
        uint256 recordCount,
        uint256 storedCount
    );
    event BatchProcessed(
        bytes32 indexed batchDigest,
        address indexed executorSigner,
        uint256 batchNonce,
        uint256 recordCount,
        uint256 userCount
    );
    event CancelUserNonceUpTo(address indexed user, uint256 newMinUserNonce);
    event CancelBatchNonceUpTo(
        address indexed executorSigner,
        uint256 newMinBatchNonce
    );

    event CandidateSet(
        uint256 indexed missionId,
        uint256 indexed candidateId,
        string name,
        bool allowed
    );

    event VoteTypeSet(uint8 indexed voteType, string name);

    // ========================================
    // Constructor
    // ========================================
    constructor(
        address initialOwner
    ) EIP712("MainVoting", "1") Ownable(initialOwner) {
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

    /**
     * @notice 특정 미션 내 후보(아티스트)를 등록/수정 + 허용 여부 설정
     * @dev 후보는 missionId에만 종속, votingId에는 종속되지 않음
     */
    function setCandidate(
        uint256 missionId,
        uint256 candidateId,
        string calldata name,
        bool allowed_
    ) external onlyOwner {
        candidateName[missionId][candidateId] = name;
        allowedCandidate[missionId][candidateId] = allowed_;
        emit CandidateSet(missionId, candidateId, name, allowed_);
    }

    /**
     * @notice voteType(0/1)에 대한 라벨 설정 (예: 0="Forget", 1="Remember")
     */
    function setVoteTypeName(
        uint8 voteType,
        string calldata name
    ) external onlyOwner {
        if (voteType > MAX_VOTE_TYPE) revert InvalidVoteType(voteType);
        voteTypeName[voteType] = name;
        emit VoteTypeSet(voteType, name);
    }

    // ========================================
    // User: Nonce 취소
    // ========================================
    function cancelAllUserNonceUpTo(
        address user,
        uint256 newMinUserNonce
    ) external onlyOwner {
        if (newMinUserNonce <= minUserNonce[user]) revert UserNonceTooLow();
        minUserNonce[user] = newMinUserNonce;
        emit CancelUserNonceUpTo(user, newMinUserNonce);
    }

    function cancelAllBatchNonceUpTo(uint256 newMinBatchNonce) external {
        if (msg.sender != owner() && msg.sender != executorSigner) {
            revert NotOwnerOrExecutor();
        }
        if (newMinBatchNonce <= minBatchNonce[executorSigner]) {
            revert BatchNonceTooLow();
        }
        minBatchNonce[executorSigner] = newMinBatchNonce;
        emit CancelBatchNonceUpTo(executorSigner, newMinBatchNonce);
    }

    // ========================================
    // Internal: Hashers
    // ========================================
    function _hashVoteRecord(
        VoteRecord calldata record
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    VOTE_RECORD_TYPEHASH,
                    record.timestamp,
                    record.missionId,
                    record.votingId,
                    record.userAddress,
                    keccak256(bytes(record.userId)),
                    record.candidateId,
                    record.voteType,
                    record.votingAmt
                )
            );
    }

    function _hashUserBatch(
        address user,
        uint256 userNonce,
        bytes32 recordsHash
    ) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        USER_BATCH_TYPEHASH,
                        user,
                        userNonce,
                        recordsHash
                    )
                )
            );
    }

    function _hashBatch(uint256 batchNonce) internal view returns (bytes32) {
        return
            _hashTypedDataV4(keccak256(abi.encode(BATCH_TYPEHASH, batchNonce)));
    }

    // ========================================
    // Internal: Signature Verification
    // ========================================
    function _isValidSig(
        address signer,
        bytes32 digest,
        bytes calldata sig
    ) internal view returns (bool) {
        if (signer.code.length == 0) {
            return ECDSA.recover(digest, sig) == signer;
        }

        (bool ok, bytes memory ret) = signer.staticcall(
            abi.encodeWithSelector(
                IERC1271.isValidSignature.selector,
                digest,
                sig
            )
        );
        return ok && ret.length == 4 && bytes4(ret) == ERC1271_MAGICVALUE;
    }

    function _isValidUserSig(
        address user,
        bytes32 digest,
        bytes calldata sig
    ) internal view returns (bool) {
        return _isValidSig(user, digest, sig);
    }

    function _isValidExecSig(
        address signer,
        bytes32 digest,
        bytes calldata sig
    ) internal view returns (bool) {
        return _isValidSig(signer, digest, sig);
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

    function _validateStrings(VoteRecord calldata record) internal pure {
        // 이제 문자열은 userId만 체크
        if (bytes(record.userId).length > MAX_STRING_LENGTH) {
            revert StringTooLong();
        }
    }

    function _buildRecordDigests(
        VoteRecord[] calldata records
    ) internal pure returns (bytes32[] memory recordDigests) {
        uint256 len = records.length;

        recordDigests = new bytes32[](len);
        for (uint256 i; i < len; ) {
            _validateStrings(records[i]);
            recordDigests[i] = _hashVoteRecord(records[i]);
            unchecked {
                ++i;
            }
        }
    }

    // ========================================
    // Internal: User Batch Verification (Coverage 강제)
    // ========================================
    function _verifyUserBatchSignature(
        VoteRecord[] calldata records,
        UserBatchSig calldata userBatch,
        bool[] memory covered,
        bytes32[] memory recordDigests,
        bytes32 batchDigest
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
            unchecked {
                ++j;
            }
        }

        bytes32 recordsHash = keccak256(abi.encodePacked(userHashes));
        bytes32 userBatchDigest = _hashUserBatch(
            userBatch.user,
            userBatch.userNonce,
            recordsHash
        );

        if (
            !_isValidUserSig(
                userBatch.user,
                userBatchDigest,
                userBatch.signature
            )
        ) {
            revert InvalidSignature();
        }

        _consumeUserNonce(userBatch.user, userBatch.userNonce);

        emit UserBatchProcessed(
            batchDigest,
            userBatch.user,
            userBatch.userNonce,
            indicesLen,
            indicesLen
        );
    }

    // 백엔드 서명 검증 - batchNonce만 사용
    function _verifyBatchSignature(
        uint256 batchNonce,
        bytes calldata executorSig
    ) internal returns (bytes32 batchDigest) {
        batchDigest = _hashBatch(batchNonce);
        if (!_isValidExecSig(executorSigner, batchDigest, executorSig)) {
            revert InvalidSignature();
        }

        _consumeBatchNonce(executorSigner, batchNonce);
    }

    function _verifyAllUserCoverage(
        VoteRecord[] calldata records,
        UserBatchSig[] calldata userBatchSigs,
        bool[] memory covered,
        bytes32[] memory recordDigests,
        bytes32 batchDigest
    ) internal {
        uint256 userBatchLen = userBatchSigs.length;
        for (uint256 i; i < userBatchLen; ) {
            _verifyUserBatchSignature(
                records,
                userBatchSigs[i],
                covered,
                recordDigests,
                batchDigest
            );
            unchecked {
                ++i;
            }
        }

        uint256 len = records.length;
        for (uint256 k; k < len; ) {
            if (!covered[k]) revert UncoveredRecord(k);
            unchecked {
                ++k;
            }
        }
    }
    function _validateRecordCommon(VoteRecord calldata record) internal view {
        if (record.voteType > MAX_VOTE_TYPE) {
            revert InvalidVoteType(record.voteType);
        }
        if (record.userAddress == address(0)) {
            revert ZeroAddress();
        }
        if (!allowedCandidate[record.missionId][record.candidateId]) {
            revert CandidateNotAllowed(record.missionId, record.candidateId);
        }
    }

    // ========================================
    // Internal: Store (부분 처리 + 집계)
    // ========================================
    function _storeVoteRecords(
        VoteRecord[] calldata records,
        bytes32[] memory recordDigests
    ) internal returns (uint256 storedCount) {
        uint256 len = records.length;

        for (uint256 i; i < len; ) {
            VoteRecord calldata record = records[i];

            if (record.votingAmt == 0) {
                unchecked {
                    ++i;
                }
                continue;
            }
            _validateRecordCommon(record);

            bytes32 recordDigest = recordDigests[i];
            if (consumed[recordDigest]) {
                unchecked {
                    ++i;
                }
                continue;
            }
            consumed[recordDigest] = true;

            bytes32 voteHash = recordDigest;

            votes[voteHash] = record;

            // (missionId, votingId) 조합별 인덱스
            voteHashesByMissionVotingId[record.missionId][record.votingId].push(
                voteHash
            );

            // 집계: voteType에 따라 Remember/Forget 카운팅
            CandidateStats storage stats = candidateStats[record.missionId][
                record.candidateId
            ];
            if (record.voteType == VOTE_TYPE_REMEMBER) {
                stats.remember += record.votingAmt;
            } else {
                stats.forget += record.votingAmt;
            }
            stats.total += record.votingAmt;

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
        VoteRecord[] calldata records,
        UserBatchSig[] calldata userBatchSigs,
        uint256 batchNonce,
        bytes calldata executorSig
    ) external {
        uint256 len = records.length;
        if (len > MAX_RECORDS_PER_BATCH) revert BatchTooLarge();
        if (executorSigner == address(0)) revert ZeroAddress();
        if (block.chainid != CHAIN_ID) revert BadChain();

        bytes32 batchDigest = _verifyBatchSignature(batchNonce, executorSig);

        bytes32[] memory recordDigests = _buildRecordDigests(records);

        bool[] memory covered = new bool[](len);
        _verifyAllUserCoverage(
            records,
            userBatchSigs,
            covered,
            recordDigests,
            batchDigest
        );
        uint256 userBatchLen = userBatchSigs.length;

        uint256 stored = _storeVoteRecords(records, recordDigests);
        emit BatchProcessed(
            batchDigest,
            executorSigner,
            batchNonce,
            stored,
            userBatchLen
        );
    }

    // ========================================
    // View / Utils
    // ========================================
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function getVoteCountByVotingId(
        uint256 missionId,
        uint256 votingId
    ) external view returns (uint256) {
        return voteHashesByMissionVotingId[missionId][votingId].length;
    }

    /**
     * @notice missionId + votingId 기준 상세 요약 (문자열 변환 포함)
     */
    function getVoteSummariesByMissionVotingId(
        uint256 missionId,
        uint256 votingId
    ) external view returns (VoteRecordSummary[] memory) {
        bytes32[] storage allHashes = voteHashesByMissionVotingId[missionId][
            votingId
        ];
        uint256 totalCount = allHashes.length;
        VoteRecordSummary[] memory result = new VoteRecordSummary[](totalCount);

        for (uint256 i; i < totalCount; ) {
            VoteRecord storage record = votes[allHashes[i]];

            string memory candidate = candidateName[record.missionId][
                record.candidateId
            ];
            string memory voteTypeLabel = voteTypeName[record.voteType];

            result[i] = VoteRecordSummary({
                timestamp: record.timestamp,
                missionId: record.missionId,
                votingId: record.votingId,
                userId: record.userId,
                votingFor: candidate,
                votedOn: voteTypeLabel,
                votingAmt: record.votingAmt
            });
            unchecked {
                ++i;
            }
        }

        return result;
    }

    /**
     * @notice 특정 후보에 대한 Remember/Forget/Total 집계 조회
     */
    function getCandidateAggregates(
        uint256 missionId,
        uint256 candidateId
    ) external view returns (uint256 remember, uint256 forget, uint256 total) {
        CandidateStats storage s = candidateStats[missionId][candidateId];
        return (s.remember, s.forget, s.total);
    }

    // === 프리뷰 유틸 ===
    function hashVoteRecord(
        VoteRecord calldata record
    ) external pure returns (bytes32) {
        return _hashVoteRecord(record);
    }

    function hashUserBatchPreview(
        address user,
        uint256 userNonce,
        VoteRecord[] calldata userRecords
    ) external view returns (bytes32) {
        bytes32[] memory hashes = new bytes32[](userRecords.length);
        for (uint256 i; i < hashes.length; ) {
            _validateStrings(userRecords[i]);
            hashes[i] = _hashVoteRecord(userRecords[i]);
            unchecked {
                ++i;
            }
        }
        return
            _hashUserBatch(
                user,
                userNonce,
                keccak256(abi.encodePacked(hashes))
            );
    }

    function hashBatchPreview(
        uint256 batchNonce
    ) external view returns (bytes32) {
        return _hashBatch(batchNonce);
    }
}
