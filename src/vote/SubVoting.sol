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
 * @notice 서브 투표 시스템 (MainVoting 기준 설계)
 * @dev 1트랜잭션 1서명 방식: 각 사용자가 자신의 레코드에 개별 서명
 *      이중 서명 검증: 사용자 서명 + Executor 서명
 *      MainVoting과 동일한 보안 수준 유지
 */
contract SubVoting is Ownable2Step, EIP712 {
    // ========================================
    // Constants
    // ========================================
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;

    uint256 public constant MAX_RECORDS_PER_BATCH = 2000;
    uint256 public constant MAX_STRING_LENGTH = 100;

    // 선택지 개수 제한 (1~10)
    uint256 public constant MAX_OPTION_ID = 10;

    // ========================================
    // EIP-712 Type Hashes
    // ========================================
    bytes32 private constant VOTE_RECORD_TYPEHASH =
        keccak256(
            "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 questionId,uint256 optionId,uint256 votingAmt)"
        );

    bytes32 private constant USER_SIG_TYPEHASH =
        keccak256("UserSig(address user,uint256 userNonce,bytes32 recordHash)");

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
    error BatchTooLarge();
    error StringTooLong();
    error NotOwnerOrExecutor();
    error QuestionNotAllowed(uint256 missionId, uint256 questionId);
    error OptionNotAllowed(uint256 missionId, uint256 optionId);
    error InvalidOptionId(uint256 optionId);

    // ========================================
    // Data Structures
    // ========================================
    struct VoteRecord {
        uint256 timestamp;
        uint256 missionId;
        uint256 votingId;
        string userId;
        uint256 questionId; // 질문 ID (사전 등록)
        uint256 optionId; // 선택지 ID (1~10)
        uint256 votingAmt;
    }

    struct UserSig {
        address user;
        uint256 userNonce;
        bytes signature;
    }

    struct UserVoteBatch {
        VoteRecord record;
        UserSig userSig;
    }

    // ========================================
    // Storage
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

    // === 메타데이터 (MainVoting 패턴) ===

    // 질문 이름: missionId => questionId => text
    mapping(uint256 => mapping(uint256 => string)) public questionName;

    // 질문 허용 여부: missionId => questionId => allowed
    mapping(uint256 => mapping(uint256 => bool)) public allowedQuestion;

    // 선택지 이름: missionId => questionId => optionId => text
    mapping(uint256 => mapping(uint256 => mapping(uint256 => string)))
        public optionName;

    // 선택지 허용 여부: missionId => questionId => optionId => allowed
    mapping(uint256 => mapping(uint256 => mapping(uint256 => bool)))
        public allowedOption;

    // === 실시간 집계 (MainVoting 패턴) ===

    /**
     * @notice 질문별 선택지 득표 통계
     * @dev optionId (1~10) → 총 투표 포인트
     */
    struct QuestionStats {
        uint256[11] optionVotes; // optionVotes[1~10] 사용 (0번 인덱스 미사용)
        uint256 total; // 전체 투표 포인트 합계
    }

    // 질문별 답변 득표 통계: missionId => questionId => QuestionStats
    mapping(uint256 => mapping(uint256 => QuestionStats)) public questionStats;

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
        uint256 userNonce
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

    // === 메타데이터 이벤트 ===
    event QuestionSet(
        uint256 indexed missionId,
        uint256 indexed questionId,
        string text,
        bool allowed
    );
    event OptionSet(
        uint256 indexed missionId,
        uint256 indexed questionId,
        uint256 indexed optionId,
        string text,
        bool allowed
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

    /**
     * @notice 질문 등록 및 활성화 관리
     * @dev MainVoting의 setCandidate와 동일 패턴
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @param text 질문 텍스트
     * @param allowed_ 투표 허용 여부
     */
    function setQuestion(
        uint256 missionId,
        uint256 questionId,
        string calldata text,
        bool allowed_
    ) external onlyOwner {
        questionName[missionId][questionId] = text;
        allowedQuestion[missionId][questionId] = allowed_;
        emit QuestionSet(missionId, questionId, text, allowed_);
    }

    /**
     * @notice 선택지 등록 및 활성화 관리
     * @dev optionId는 1~10만 허용
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @param optionId 선택지 ID (1~10)
     * @param text 선택지 텍스트
     * @param allowed_ 투표 허용 여부
     */
    function setOption(
        uint256 missionId,
        uint256 questionId,
        uint256 optionId,
        string calldata text,
        bool allowed_
    ) external onlyOwner {
        if (optionId == 0 || optionId > MAX_OPTION_ID) {
            revert InvalidOptionId(optionId);
        }

        optionName[missionId][questionId][optionId] = text;
        allowedOption[missionId][questionId][optionId] = allowed_;
        emit OptionSet(missionId, questionId, optionId, text, allowed_);
    }

    // ========================================
    // Admin: Executor & Nonce 관리
    // ========================================
    function setExecutorSigner(address s) external onlyOwner {
        if (s == address(0)) revert ZeroAddress();

        address oldSigner = executorSigner;
        uint256 oldMinNonce = minBatchNonce[oldSigner];

        if (oldSigner != address(0)) {
            minBatchNonce[oldSigner] = type(uint256).max;
        }

        executorSigner = s;
        // 새 executor의 minBatchNonce를 0으로 초기화 (재등록 시 uint256.max 방지)
        minBatchNonce[s] = 0;
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
                    record.questionId,
                    record.optionId,
                    record.votingAmt
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
                    abi.encode(USER_SIG_TYPEHASH, user, userNonce, recordHash)
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
    }

    function _validateRecordCommon(VoteRecord calldata record) internal view {
        if (record.optionId == 0 || record.optionId > MAX_OPTION_ID) {
            revert InvalidOptionId(record.optionId);
        }
        if (!allowedQuestion[record.missionId][record.questionId]) {
            revert QuestionNotAllowed(record.missionId, record.questionId);
        }
        if (
            !allowedOption[record.missionId][record.questionId][record.optionId]
        ) {
            revert OptionNotAllowed(record.missionId, record.optionId);
        }
    }

    // ========================================
    // Internal: User Signature Verification (1:1)
    // ========================================
    function _verifyUserSignature(
        UserSig calldata userSig,
        bytes32 recordHash,
        bytes32 batchDigest
    ) internal {
        if (userSig.user == address(0)) revert ZeroAddress();

        bytes32 userSigDigest = _hashUserSig(
            userSig.user,
            userSig.userNonce,
            recordHash
        );

        if (!_isValidSig(userSig.user, userSigDigest, userSig.signature)) {
            revert InvalidSignature();
        }

        _consumeUserNonce(userSig.user, userSig.userNonce);

        emit UserVoteProcessed(batchDigest, userSig.user, userSig.userNonce);
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

    // ========================================
    // Internal: Store + Aggregation (MainVoting 패턴)
    // ========================================

    /**
     * @notice 투표 저장 및 실시간 집계
     * @dev MainVoting의 _storeVoteRecords와 동일 패턴
     *      - 0포인트 투표 스킵
     *      - 중복 레코드 스킵
     *      - questionStats 실시간 업데이트
     */
    function _storeVoteRecords(
        UserVoteBatch[] calldata batches,
        bytes32[] memory recordDigests
    ) internal returns (uint256 storedCount) {
        uint256 len = batches.length;

        for (uint256 i; i < len; ) {
            VoteRecord calldata record = batches[i].record;

            // 0포인트 투표 스킵
            if (record.votingAmt == 0) {
                unchecked {
                    ++i;
                }
                continue;
            }

            // 공통 검증 (questionId, optionId 허용 여부)
            _validateRecordCommon(record);

            bytes32 recordDigest = recordDigests[i];

            // 중복 레코드 스킵
            if (consumed[recordDigest]) {
                unchecked {
                    ++i;
                }
                continue;
            }
            consumed[recordDigest] = true;

            bytes32 voteHash = recordDigest;

            // 레코드 저장
            votes[voteHash] = record;

            // 인덱싱 (조회 최적화)
            voteHashesByMissionVotingId[record.missionId][record.votingId].push(
                voteHash
            );

            // 실시간 집계 (MainVoting 패턴)
            QuestionStats storage stats = questionStats[record.missionId][
                record.questionId
            ];

            stats.optionVotes[record.optionId] += record.votingAmt;
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

    /**
     * @notice 다중 사용자 투표 배치 제출
     * @dev MainVoting과 유사한 구조: UserVoteBatch[] 형태로 record + userSig 묶음
     *      1레코드 = 1서명 방식 유지
     * @param batches 유저별 투표 배치 배열 (record + userSig 쌍)
     * @param batchNonce 배치 nonce
     * @param executorSig 실행자 서명
     */
    function submitMultiUserBatch(
        UserVoteBatch[] calldata batches,
        uint256 batchNonce,
        bytes calldata executorSig
    ) external {
        uint256 len = batches.length;
        if (len > MAX_RECORDS_PER_BATCH) revert BatchTooLarge();
        if (executorSigner == address(0)) revert ZeroAddress();
        if (block.chainid != CHAIN_ID) revert BadChain();

        // [1] Executor 서명 검증
        bytes32 batchDigest = _verifyBatchSignature(batchNonce, executorSig);

        // [2] 레코드 다이제스트 생성 및 유저 서명 검증
        bytes32[] memory recordDigests = new bytes32[](len);
        for (uint256 i; i < len; ) {
            VoteRecord calldata record = batches[i].record;
            _validateStrings(record);

            bytes32 recordHash = _hashVoteRecord(record);
            recordDigests[i] = recordHash;

            // 유저 서명 검증 (1:1)
            _verifyUserSignature(batches[i].userSig, recordHash, batchDigest);

            unchecked {
                ++i;
            }
        }

        // [3] 저장 및 집계
        uint256 stored = _storeVoteRecords(batches, recordDigests);

        emit BatchProcessed(
            batchDigest,
            executorSigner,
            batchNonce,
            stored,
            len
        );
    }

    // ========================================
    // View: 집계 조회 (MainVoting 패턴)
    // ========================================

    /**
     * @notice 질문별 선택지 득표 현황 조회
     * @dev MainVoting의 getArtistAggregates와 동일 패턴
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @return optionVotes 선택지별 득표 (1~10)
     * @return total 전체 투표 포인트 합계
     */
    function getQuestionAggregates(
        uint256 missionId,
        uint256 questionId
    ) external view returns (uint256[11] memory optionVotes, uint256 total) {
        QuestionStats storage s = questionStats[missionId][questionId];
        return (s.optionVotes, s.total);
    }

    /**
     * @notice 특정 선택지의 득표 조회
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @param optionId 선택지 ID (1~10)
     * @return 해당 선택지의 총 투표 포인트
     */
    function getOptionVotes(
        uint256 missionId,
        uint256 questionId,
        uint256 optionId
    ) external view returns (uint256) {
        if (optionId == 0 || optionId > MAX_OPTION_ID) {
            revert InvalidOptionId(optionId);
        }
        return questionStats[missionId][questionId].optionVotes[optionId];
    }

    // ========================================
    // View: 질문-답변 목록 조회
    // ========================================

    /**
     * @notice 선택지 정보 구조체
     */
    struct OptionInfo {
        uint256 optionId;
        string optionText;
        uint256 votes;
        bool allowed;
    }

    /**
     * @notice 질문 정보 구조체
     */
    struct QuestionInfo {
        string questionText;
        bool questionAllowed;
        OptionInfo[] options;
        uint256 totalVotes;
    }

    /**
     * @notice 특정 질문과 모든 선택지 정보 조회
     * @dev optionId 1~10을 순회하며 등록된 선택지만 반환
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @return QuestionInfo 질문 텍스트, 선택지 목록, 총 득표수
     */
    function getQuestionWithOptions(
        uint256 missionId,
        uint256 questionId
    ) external view returns (QuestionInfo memory) {
        string memory qText = questionName[missionId][questionId];
        bool qAllowed = allowedQuestion[missionId][questionId];
        QuestionStats storage stats = questionStats[missionId][questionId];

        // 등록된 선택지 개수 세기
        uint256 optionCount = 0;
        for (uint256 i = 1; i <= MAX_OPTION_ID; ) {
            if (bytes(optionName[missionId][questionId][i]).length > 0) {
                unchecked {
                    ++optionCount;
                }
            }
            unchecked {
                ++i;
            }
        }

        // 선택지 배열 생성
        OptionInfo[] memory options = new OptionInfo[](optionCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= MAX_OPTION_ID; ) {
            string memory oText = optionName[missionId][questionId][i];
            if (bytes(oText).length > 0) {
                options[index] = OptionInfo({
                    optionId: i,
                    optionText: oText,
                    votes: stats.optionVotes[i],
                    allowed: allowedOption[missionId][questionId][i]
                });
                unchecked {
                    ++index;
                }
            }
            unchecked {
                ++i;
            }
        }

        return
            QuestionInfo({
                questionText: qText,
                questionAllowed: qAllowed,
                options: options,
                totalVotes: stats.total
            });
    }

    /**
     * @notice 선택지 목록만 간단히 조회
     * @dev 질문 정보 없이 선택지 목록만 반환
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @return OptionInfo[] 선택지 배열
     */
    function getOptionList(
        uint256 missionId,
        uint256 questionId
    ) external view returns (OptionInfo[] memory) {
        QuestionStats storage stats = questionStats[missionId][questionId];

        // 등록된 선택지 개수 세기
        uint256 optionCount = 0;
        for (uint256 i = 1; i <= MAX_OPTION_ID; ) {
            if (bytes(optionName[missionId][questionId][i]).length > 0) {
                unchecked {
                    ++optionCount;
                }
            }
            unchecked {
                ++i;
            }
        }

        // 선택지 배열 생성
        OptionInfo[] memory options = new OptionInfo[](optionCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= MAX_OPTION_ID; ) {
            string memory oText = optionName[missionId][questionId][i];
            if (bytes(oText).length > 0) {
                options[index] = OptionInfo({
                    optionId: i,
                    optionText: oText,
                    votes: stats.optionVotes[i],
                    allowed: allowedOption[missionId][questionId][i]
                });
                unchecked {
                    ++index;
                }
            }
            unchecked {
                ++i;
            }
        }

        return options;
    }

    // ========================================
    // View: 기본 조회
    // ========================================
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function getVoteByHash(
        bytes32 voteHash
    ) external view returns (VoteRecord memory) {
        return votes[voteHash];
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
        string questionText; // questionName에서 조회
        string optionText; // optionName에서 조회
        uint256 votingAmt;
    }

    /**
     * @notice 투표 요약 조회 (문자열 변환)
     * @dev MainVoting의 getVoteSummariesByMissionVotingId와 동일 패턴
     *      questionId/optionId를 questionName/optionName으로 변환
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

            string memory question = questionName[record.missionId][
                record.questionId
            ];
            string memory option = optionName[record.missionId][
                record.questionId
            ][record.optionId];

            result[i] = VoteRecordSummary({
                timestamp: record.timestamp,
                missionId: record.missionId,
                votingId: record.votingId,
                userId: record.userId,
                questionText: question,
                optionText: option,
                votingAmt: record.votingAmt
            });
            unchecked {
                ++i;
            }
        }

        return result;
    }

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
