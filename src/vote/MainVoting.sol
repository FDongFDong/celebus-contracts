// SPDX-License-Identifier: MIT
// 라이센스: MIT 오픈소스 라이센스 (자유롭게 사용, 수정, 배포 가능)
pragma solidity ^0.8.20;

// ========================================
// 외부 라이브러리 임포트
// ========================================
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
 * @title MainVoting - 투표 시스템 (Nested Array Version)
 * @notice VoteRecord[][] 구조를 사용하여 유저별 투표 묶음을 직관적으로 처리
 */
contract MainVoting is Ownable2Step, EIP712 {
    // ========================================
    // 상수 정의 (Constants)
    // ========================================

    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;

    // 한 트랜잭션에 포함 가능한 최대 투표 레코드 수 (전체 합)
    uint256 public constant MAX_RECORDS_PER_BATCH = 5000;

    // 한 사용자가 한 배치에서 서명할 수 있는 최대 레코드 수
    uint16 public constant MAX_RECORDS_PER_USER_BATCH = 20;

    // 문자열 필드 최대 길이
    uint16 public constant MAX_STRING_LENGTH = 100;

    // 투표 타입 상수
    uint8 public constant MAX_VOTE_TYPE = 1;
    uint8 public constant VOTE_TYPE_FORGET = 0;
    uint8 public constant VOTE_TYPE_REMEMBER = 1;

    // ========================================
    // EIP-712 타입 해시
    // ========================================

    bytes32 private constant VOTE_RECORD_TYPEHASH =
        keccak256(
            "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,uint256 candidateId,uint8 voteType,uint256 votingAmt)"
        );

    bytes32 private constant USER_BATCH_TYPEHASH =
        keccak256(
            "UserBatch(address user,uint256 userNonce,bytes32 recordsHash)"
        );

    bytes32 private constant BATCH_TYPEHASH =
        keccak256("Batch(uint256 batchNonce)");

    // ========================================
    // 커스텀 에러
    // ========================================

    error ZeroAddress();
    error InvalidSignature();
    error BadChain();
    error UserNonceAlreadyUsed();
    error UserNonceTooLow();
    error BatchNonceAlreadyUsed();
    error BatchNonceTooLow();
    error InvalidRecordIndices(); // 배열 길이 불일치 등
    error BatchTooLarge();
    error UserBatchTooLarge();
    error StringTooLong();
    error NotOwnerOrExecutor();
    error CandidateNotAllowed(uint256 missionId, uint256 candidateId);
    error InvalidVoteType(uint8 value);

    // ========================================
    // 데이터 구조체
    // ========================================

    struct VoteRecord {
        uint256 timestamp;
        uint256 missionId;
        uint256 votingId;
        address userAddress;
        uint256 candidateId;
        uint8 voteType;
        string userId;
        uint256 votingAmt;
    }

    struct UserBatchSig {
        address user;
        uint256 userNonce;
        bytes signature;
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

    struct CandidateStats {
        uint256 remember;
        uint256 forget;
        uint256 total;
    }

    // ========================================
    // 상태 변수
    // ========================================

    mapping(bytes32 => VoteRecord) public votes;
    mapping(uint256 => mapping(uint256 => bytes32[]))
        private voteHashesByMissionVotingId;

    mapping(address => mapping(uint256 => bool)) public userNonceUsed;
    mapping(address => uint256) public minUserNonce;

    mapping(address => mapping(uint256 => bool)) public batchNonceUsed;
    mapping(address => uint256) public minBatchNonce;

    mapping(bytes32 => bool) public consumed;

    uint256 public immutable CHAIN_ID;
    address public executorSigner;

    mapping(uint256 => mapping(uint256 => string)) public candidateName;
    mapping(uint256 => mapping(uint256 => bool)) public allowedCandidate;
    mapping(uint8 => string) public voteTypeName;

    mapping(uint256 => mapping(uint256 => CandidateStats))
        public candidateStats;

    // ========================================
    // 이벤트
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
    // 생성자
    // ========================================
    constructor(
        address initialOwner
    ) EIP712("MainVoting", "1") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        CHAIN_ID = block.chainid;
    }

    // ========================================
    // 관리자 함수
    // ========================================

    function setExecutorSigner(address s) external onlyOwner {
        if (s == address(0)) revert ZeroAddress();

        address oldSigner = executorSigner;
        uint256 oldMinNonce = minBatchNonce[oldSigner];

        if (oldSigner != address(0)) {
            minBatchNonce[oldSigner] = type(uint256).max;
        }

        // [수정 완료] 새 서명자의 Nonce를 0으로 초기화하여 재고용 시 DoS 방지
        minBatchNonce[s] = 0;

        executorSigner = s;
        emit ExecutorSignerChanged(oldSigner, s, oldMinNonce);
    }

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

    function setVoteTypeName(
        uint8 voteType,
        string calldata name
    ) external onlyOwner {
        if (voteType > MAX_VOTE_TYPE) revert InvalidVoteType(voteType);
        voteTypeName[voteType] = name;
        emit VoteTypeSet(voteType, name);
    }

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
    // 내부 유틸 함수
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
    }

    /**
     * @notice 2차원 레코드 배열을 순회하며 해시 생성 (Nested)
     */
    function _buildRecordDigests(
        VoteRecord[][] calldata records
    ) internal pure returns (bytes32[][] memory recordDigests) {
        uint256 userCount = records.length;
        recordDigests = new bytes32[][](userCount);

        for (uint256 i; i < userCount; ) {
            uint256 userRecordLen = records[i].length;
            recordDigests[i] = new bytes32[](userRecordLen);

            for (uint256 j; j < userRecordLen; ) {
                _validateStrings(records[i][j]);
                recordDigests[i][j] = _hashVoteRecord(records[i][j]);
                unchecked {
                    ++j;
                }
            }
            unchecked {
                ++i;
            }
        }
    }

    // ========================================
    // 사용자 배치 검증 (수정됨)
    // ========================================

    /**
     * @notice 단일 유저의 레코드 배열 전체 검증
     * @dev records[i] 전체가 한 유저의 것임이 보장됨 (구조적)
     */
    function _verifyUserBatchSignature(
        VoteRecord[] calldata userRecords, // 해당 유저의 레코드들
        UserBatchSig calldata userBatch,
        bytes32[] memory userRecordDigests, // 미리 계산된 해시들
        bytes32 batchDigest
    ) internal {
        uint256 count = userRecords.length;

        // [1단계] 유저 배치 크기 검증
        if (count > MAX_RECORDS_PER_USER_BATCH) revert UserBatchTooLarge();

        // [2단계] 소유권 확인 (모든 레코드가 userBatch.user의 것인지)
        for (uint256 j; j < count; ) {
            if (userRecords[j].userAddress != userBatch.user) {
                revert InvalidSignature();
            }
            unchecked {
                ++j;
            }
        }

        // [3단계] recordsHash 계산
        bytes32 recordsHash = keccak256(abi.encodePacked(userRecordDigests));

        // [4단계] 서명 검증
        bytes32 userBatchDigest = _hashUserBatch(
            userBatch.user,
            userBatch.userNonce,
            recordsHash
        );

        if (
            !_isValidSig(userBatch.user, userBatchDigest, userBatch.signature)
        ) {
            revert InvalidSignature();
        }

        // [5단계] nonce 소비
        _consumeUserNonce(userBatch.user, userBatch.userNonce);

        // [6단계] 이벤트 발생
        emit UserBatchProcessed(
            batchDigest,
            userBatch.user,
            userBatch.userNonce,
            count,
            count
        );
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

    /**
     * @notice 투표 저장 (Nested 구조 지원)
     */
    function _storeVoteRecords(
        VoteRecord[][] calldata records,
        bytes32[][] memory recordDigests
    ) internal returns (uint256 storedCount) {
        uint256 userCount = records.length;

        for (uint256 i; i < userCount; ) {
            uint256 userRecordLen = records[i].length;

            for (uint256 j; j < userRecordLen; ) {
                VoteRecord calldata record = records[i][j];
                bytes32 recordDigest = recordDigests[i][j];

                // 스킵 로직 (0포인트, 중복)
                if (record.votingAmt == 0 || consumed[recordDigest]) {
                    unchecked {
                        ++j;
                    }
                    continue;
                }

                _validateRecordCommon(record);

                // 저장 및 인덱싱
                consumed[recordDigest] = true;
                votes[recordDigest] = record;
                voteHashesByMissionVotingId[record.missionId][record.votingId]
                    .push(recordDigest);

                // 집계
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
                    ++j;
                }
            }
            unchecked {
                ++i;
            }
        }
    }

    // ========================================
    // 메인 엔트리 포인트 (수정됨)
    // ========================================

    /**
     * @notice 배치 제출 함수 (Nested Array 방식)
     * @param records 유저별로 그룹화된 투표 레코드 (2차원 배열) [[A,A], [B,B]]
     * @param userBatchSigs 유저별 서명 [SigA, SigB]
     * @param batchNonce 배치 nonce
     * @param executorSig 실행자 서명
     */
    function submitMultiUserBatch(
        VoteRecord[][] calldata records,
        UserBatchSig[] calldata userBatchSigs,
        // recordCounts 삭제됨!
        uint256 batchNonce,
        bytes calldata executorSig
    ) external {
        // [1단계] 배열 길이 일치 및 전체 크기 검증
        uint256 userCount = records.length;
        if (userCount != userBatchSigs.length) revert InvalidRecordIndices();

        uint256 totalRecords = 0;
        for (uint256 i; i < userCount; ) {
            totalRecords += records[i].length;
            unchecked {
                ++i;
            }
        }
        if (totalRecords > MAX_RECORDS_PER_BATCH) revert BatchTooLarge();

        if (executorSigner == address(0)) revert ZeroAddress();
        if (block.chainid != CHAIN_ID) revert BadChain();

        // [2단계] 백엔드 서명 검증
        bytes32 batchDigest = _hashBatch(batchNonce);
        if (!_isValidSig(executorSigner, batchDigest, executorSig)) {
            revert InvalidSignature();
        }
        _consumeBatchNonce(executorSigner, batchNonce);

        // [3단계] 레코드 다이제스트 생성 (Nested)
        bytes32[][] memory recordDigests = _buildRecordDigests(records);

        // [4단계] 유저 서명 검증
        for (uint256 i; i < userCount; ) {
            _verifyUserBatchSignature(
                records[i], // 이 유저의 레코드 배열 통째로 전달
                userBatchSigs[i],
                recordDigests[i],
                batchDigest
            );
            unchecked {
                ++i;
            }
        }

        // [5단계] 저장 및 집계
        uint256 stored = _storeVoteRecords(records, recordDigests);

        emit BatchProcessed(
            batchDigest,
            executorSigner,
            batchNonce,
            stored,
            userCount
        );
    }

    // ========================================
    // View / Utils (기존 유지)
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

    function getCandidateAggregates(
        uint256 missionId,
        uint256 candidateId
    ) external view returns (uint256 remember, uint256 forget, uint256 total) {
        CandidateStats storage s = candidateStats[missionId][candidateId];
        return (s.remember, s.forget, s.total);
    }
}
