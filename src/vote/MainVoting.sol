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
 *      - 배치 크기 제한: 최대 5000개
 *      - 유저당 배치 제한: 최대 50개
 */
contract MainVoting is Ownable2Step, EIP712 {
    // ========================================
    // Constants
    // ========================================
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;

    uint256 public constant MAX_RECORDS_PER_BATCH = 5000;
    uint256 public constant MAX_RECORDS_PER_USER_BATCH = 50;
    uint256 public constant MAX_QUERY_LIMIT = 100;
    uint256 public constant MAX_STRING_LENGTH = 100;

    // ========================================
    // EIP-712 Type Hashes
    // ========================================
    // recordNonce 제거 - 불필요한 복잡성 제거
    bytes32 private constant VOTE_RECORD_TYPEHASH =
        keccak256(
            "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,bytes32 userIdHash,bytes32 votingForHash,bytes32 votedOnHash,uint256 votingAmt,uint256 deadline)"
        );

    bytes32 private constant USER_BATCH_TYPEHASH =
        keccak256(
            "UserBatch(address user,uint256 userNonce,bytes32 recordsHash)"
        );

    // 백엔드는 batchNonce만 서명 (itemsHash, chainId 제거)
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

    // ========================================
    // Storage
    // ========================================
    mapping(bytes32 => VoteRecord) public votes;

    // (missionId, votingId) 조합으로 직접 조회하기 위한 전역 인덱스
    mapping(uint256 => mapping(uint256 => bytes32[]))
        private voteHashesByMissionVotingId;
    mapping(uint256 => uint256[]) private missionVotingIds;
    mapping(uint256 => mapping(uint256 => bool)) private missionVotingIdExists;

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
            revert InvalidSignature();
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
    // recordNonce 제거 - 단순화
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
                    keccak256(bytes(record.votingFor)),
                    keccak256(bytes(record.votedOn)),
                    record.votingAmt,
                    record.deadline
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

    // 백엔드는 batchNonce만 서명
    function _hashBatch(
        uint256 batchNonce
    ) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(abi.encode(BATCH_TYPEHASH, batchNonce))
            );
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
        if (bytes(record.userId).length > MAX_STRING_LENGTH) {
            revert StringTooLong();
        }
        if (bytes(record.votingFor).length > MAX_STRING_LENGTH) {
            revert StringTooLong();
        }
        if (bytes(record.votedOn).length > MAX_STRING_LENGTH) {
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

        // UserBatch 서명당 1개 이벤트 발생
        emit UserBatchProcessed(
            batchDigest,
            userBatch.user,
            userBatch.userNonce,
            indicesLen,
            indicesLen  // storedCount는 나중에 계산
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
            if (record.deadline <= block.timestamp) {
                unchecked {
                    ++i;
                }
                continue;
            }
            if (record.votingAmt == 0) {
                unchecked {
                    ++i;
                }
                continue;
            }

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

            // 미션/보팅ID 조합별 인덱스 (전역)
            voteHashesByMissionVotingId[record.missionId][record.votingId].push(
                voteHash
            );
            if (!missionVotingIdExists[record.missionId][record.votingId]) {
                missionVotingIdExists[record.missionId][record.votingId] = true;
                missionVotingIds[record.missionId].push(record.votingId);
            }

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

        // 1) 백엔드 서명 검증 (batchNonce만 사용)
        bytes32 batchDigest = _verifyBatchSignature(batchNonce, executorSig);

        // 2) 각 레코드 다이제스트 산출 + 문자열 길이 검증
        bytes32[] memory recordDigests = _buildRecordDigests(records);

        // 3) 유저 서명 검증(커버리지 강제)
        bool[] memory covered = new bool[](len);
        _verifyAllUserCoverage(records, userBatchSigs, covered, recordDigests, batchDigest);
        uint256 userBatchLen = userBatchSigs.length;

        // 4) 저장
        uint256 stored = _storeVoteRecords(records, batchDigest, recordDigests);
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

    function getVoteByHash(
        bytes32 voteHash
    ) external view returns (VoteRecord memory) {
        return votes[voteHash];
    }

    function getVoteCount(
        uint256 missionId
    ) external view returns (uint256 total) {
        uint256[] storage ids = missionVotingIds[missionId];
        for (uint256 i; i < ids.length; ) {
            total += voteHashesByMissionVotingId[missionId][ids[i]].length;
            unchecked {
                ++i;
            }
        }
    }

    function getVoteCountByVotingId(
        uint256 missionId,
        uint256 votingId
    ) external view returns (uint256) {
        return voteHashesByMissionVotingId[missionId][votingId].length;
    }

    function getUserVotingStat(
        address user,
        uint256 missionId,
        uint256 votingId
    ) external view returns (bool hasVoted, uint256 totalAmt, uint256 count) {
        bytes32[] storage allHashes = voteHashesByMissionVotingId[missionId][
            votingId
        ];
        for (uint256 i; i < allHashes.length; ) {
            VoteRecord storage record = votes[allHashes[i]];
            if (record.userAddress == user) {
                totalAmt += record.votingAmt;
                unchecked {
                    ++count;
                }
            }
            unchecked {
                ++i;
            }
        }
        hasVoted = count > 0;
    }

    function getUserVoteHashes(
        address user,
        uint256 missionId,
        uint256 votingId,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory) {
        if (limit > MAX_QUERY_LIMIT) revert QueryLimitExceeded();
        bytes32[] storage allHashes = voteHashesByMissionVotingId[missionId][
            votingId
        ];

        uint256 matchCount;
        for (uint256 i; i < allHashes.length; ) {
            if (votes[allHashes[i]].userAddress == user) {
                unchecked {
                    ++matchCount;
                }
            }
            unchecked {
                ++i;
            }
        }

        if (offset >= matchCount) {
            return new bytes32[](0);
        }

        uint256 end = offset + limit;
        if (end > matchCount) end = matchCount;
        uint256 resultLength = end - offset;
        bytes32[] memory result = new bytes32[](resultLength);

        uint256 matchIndex;
        uint256 writeIndex;
        for (uint256 i; i < allHashes.length && writeIndex < resultLength; ) {
            if (votes[allHashes[i]].userAddress == user) {
                if (matchIndex >= offset) {
                    result[writeIndex] = allHashes[i];
                    unchecked {
                        ++writeIndex;
                    }
                }
                unchecked {
                    ++matchIndex;
                }
            }
            unchecked {
                ++i;
            }
        }

        return result;
    }

    function getVotesByUserVotingId(
        address user,
        uint256 missionId,
        uint256 votingId
    ) external view returns (VoteRecord[] memory) {
        bytes32[] storage allHashes = voteHashesByMissionVotingId[missionId][
            votingId
        ];
        uint256 matchCount;
        for (uint256 i; i < allHashes.length; ) {
            if (votes[allHashes[i]].userAddress == user) {
                unchecked {
                    ++matchCount;
                }
            }
            unchecked {
                ++i;
            }
        }

        VoteRecord[] memory result = new VoteRecord[](matchCount);
        uint256 writeIndex;
        for (uint256 i; i < allHashes.length && writeIndex < matchCount; ) {
            VoteRecord storage record = votes[allHashes[i]];
            if (record.userAddress == user) {
                result[writeIndex] = record;
                unchecked {
                    ++writeIndex;
                }
            }
            unchecked {
                ++i;
            }
        }

        return result;
    }

    /**
     * @notice 유저 주소 없이 missionId + votingId 조합으로 모든 투표 기록 조회
     */
    function getVotesByMissionVotingId(
        uint256 missionId,
        uint256 votingId
    ) external view returns (VoteRecord[] memory) {
        bytes32[] storage allHashes = voteHashesByMissionVotingId[missionId][
            votingId
        ];
        uint256 totalCount = allHashes.length;
        VoteRecord[] memory result = new VoteRecord[](totalCount);

        for (uint256 i; i < totalCount; ) {
            bytes32 voteHash = allHashes[i];
            result[i] = votes[voteHash];
            unchecked {
                ++i;
            }
        }

        return result;
    }

    struct VoteRecordSummary {
        uint256 timestamp;
        uint256 missionId;
        uint256 votingId;
        string userId;
        string votingFor;
        string votedOn;
        uint256 votingAmt;
    }

    /**
     * @notice 개인정보 최소화를 위해 userAddress 없이 요약 데이터만 반환
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
            result[i] = VoteRecordSummary({
                timestamp: record.timestamp,
                missionId: record.missionId,
                votingId: record.votingId,
                userId: record.userId,
                votingFor: record.votingFor,
                votedOn: record.votedOn,
                votingAmt: record.votingAmt
            });
            unchecked {
                ++i;
            }
        }

        return result;
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

    // 실행자 배치 프리뷰 - batchNonce만 사용
    function hashBatchPreview(
        uint256 batchNonce
    ) external view returns (bytes32) {
        return _hashBatch(batchNonce);
    }
}
