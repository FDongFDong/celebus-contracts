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
 * @title SubVoting
 * @notice EIP-712 서명 기반 서브 투표 시스템 (1 서명 = 1 레코드)
 * @dev MainVoting과 유사하지만 각 사용자가 레코드당 1개 서명
 *      - 이중 서명: 유저 서명(1:1) + 백엔드 서명
 *      - 문자열 해시 방식: 가스 최적화
 *      - 배치 크기 제한: 최대 5000개
 */
contract SubVoting is Ownable2Step, EIP712 {
    // ========================================
    // Constants
    // ========================================
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;

    uint256 public constant MAX_RECORDS_PER_BATCH = 5000;
    uint256 public constant MAX_QUERY_LIMIT = 100;
    uint256 public constant MAX_STRING_LENGTH = 100;

    // ========================================
    // EIP-712 Type Hashes
    // ========================================
    bytes32 private constant VOTE_RECORD_TYPEHASH =
        keccak256(
            "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,bytes32 userIdHash,bytes32 votingForHash,bytes32 votedOnHash,uint256 votingAmt,uint256 deadline)"
        );

    // 1:1 서명 구조 - recordIndices 제거
    bytes32 private constant USER_SIG_TYPEHASH =
        keccak256(
            "UserSig(address user,uint256 userNonce,bytes32 recordHash)"
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
    error InvalidRecordIndex();
    error BatchTooLarge();
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

    // 1:1 서명 구조
    struct UserSig {
        address user;
        uint256 userNonce;
        uint256 recordIndex;  // 단일 인덱스
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
    event UserVoteProcessed(
        bytes32 indexed batchDigest,
        address indexed user,
        uint256 userNonce,
        uint256 recordIndex
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
    ) EIP712("SubVoting", "1") Ownable(initialOwner) {
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

    function _hashUserSig(
        address user,
        uint256 userNonce,
        bytes32 recordHash
    ) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        USER_SIG_TYPEHASH,
                        user,
                        userNonce,
                        recordHash
                    )
                )
            );
    }

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
    // Internal: User Signature Verification (1:1)
    // ========================================
    function _verifyUserSignature(
        VoteRecord[] calldata records,
        UserSig calldata userSig,
        bool[] memory covered,
        bytes32[] memory recordDigests,
        bytes32 batchDigest
    ) internal {
        uint256 idx = userSig.recordIndex;

        // 인덱스 유효성 검증
        if (idx >= records.length) revert InvalidRecordIndex();
        if (covered[idx]) revert DuplicateIndex(idx);
        covered[idx] = true;

        VoteRecord calldata record = records[idx];
        if (record.userAddress != userSig.user) revert InvalidSignature();

        // 1:1 서명 검증
        bytes32 recordHash = recordDigests[idx];
        bytes32 userSigDigest = _hashUserSig(
            userSig.user,
            userSig.userNonce,
            recordHash
        );

        if (!_isValidSig(userSig.user, userSigDigest, userSig.signature)) {
            revert InvalidSignature();
        }

        _consumeUserNonce(userSig.user, userSig.userNonce);

        emit UserVoteProcessed(
            batchDigest,
            userSig.user,
            userSig.userNonce,
            idx
        );
    }

    function _verifyBatchSignature(
        uint256 batchNonce,
        bytes calldata executorSig
    ) internal returns (bytes32 batchDigest) {
        batchDigest = _hashBatch(batchNonce);
        if (!_isValidSig(executorSigner, batchDigest, executorSig)) {
            revert InvalidSignature();
        }

        _consumeBatchNonce(executorSigner, batchNonce);
    }

    function _verifyAllUserCoverage(
        VoteRecord[] calldata records,
        UserSig[] calldata userSigs,
        bool[] memory covered,
        bytes32[] memory recordDigests,
        bytes32 batchDigest
    ) internal {
        uint256 userSigLen = userSigs.length;
        if (userSigLen != records.length) revert LengthMismatch();

        for (uint256 i; i < userSigLen; ) {
            _verifyUserSignature(
                records,
                userSigs[i],
                covered,
                recordDigests,
                batchDigest
            );
            unchecked {
                ++i;
            }
        }

        // 모든 레코드가 커버되었는지 확인
        uint256 len = records.length;
        for (uint256 k; k < len; ) {
            if (!covered[k]) revert UncoveredRecord(k);
            unchecked {
                ++k;
            }
        }
    }

    // ========================================
    // Internal: Store
    // ========================================
    function _storeVoteRecords(
        VoteRecord[] calldata records,
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

            // 미션/보팅ID 조합별 인덱스
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
        UserSig[] calldata userSigs,
        uint256 batchNonce,
        bytes calldata executorSig
    ) external {
        uint256 len = records.length;
        if (len > MAX_RECORDS_PER_BATCH) revert BatchTooLarge();
        if (executorSigner == address(0)) revert ZeroAddress();
        if (block.chainid != CHAIN_ID) revert BadChain();

        // 1) 백엔드 서명 검증
        bytes32 batchDigest = _verifyBatchSignature(batchNonce, executorSig);

        // 2) 레코드 다이제스트 산출
        bytes32[] memory recordDigests = _buildRecordDigests(records);

        // 3) 유저 서명 검증 (1:1 매칭)
        bool[] memory covered = new bool[](len);
        _verifyAllUserCoverage(records, userSigs, covered, recordDigests, batchDigest);
        uint256 userSigLen = userSigs.length;

        // 4) 저장
        uint256 stored = _storeVoteRecords(records, recordDigests);
        emit BatchProcessed(
            batchDigest,
            executorSigner,
            batchNonce,
            stored,
            userSigLen
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

    function hashUserSigPreview(
        address user,
        uint256 userNonce,
        VoteRecord calldata record
    ) external view returns (bytes32) {
        _validateStrings(record);
        bytes32 recordHash = _hashVoteRecord(record);
        return _hashUserSig(user, userNonce, recordHash);
    }

    function hashBatchPreview(
        uint256 batchNonce
    ) external view returns (bytes32) {
        return _hashBatch(batchNonce);
    }
}
