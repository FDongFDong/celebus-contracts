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

    uint256 public constant MAX_RECORDS_PER_BATCH = 5000;
    uint256 public constant MAX_STRING_LENGTH = 100;

    // 답변 개수 제한 (1~10)
    uint256 public constant MAX_ANSWER_ID = 10;

    // ========================================
    // EIP-712 Type Hashes
    // ========================================
    bytes32 private constant VOTE_RECORD_TYPEHASH =
        keccak256(
            "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,bytes32 userIdHash,uint256 questionId,uint256 answerId,uint256 votingAmt)"
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
    error InvalidRecordIndex();
    error BatchTooLarge();
    error QueryLimitExceeded();
    error StringTooLong();
    error UncoveredRecord(uint256 index);
    error DuplicateIndex(uint256 index);
    error LengthMismatch();
    error NotOwnerOrExecutor();
    error QuestionNotAllowed(uint256 missionId, uint256 questionId);
    error AnswerNotAllowed(uint256 missionId, uint256 answerId);
    error InvalidAnswerId(uint256 answerId);

    // ========================================
    // Data Structures
    // ========================================
    struct VoteRecord {
        uint256 timestamp;
        uint256 missionId;
        uint256 votingId;
        address userAddress;
        string userId;
        uint256 questionId; // 질문 ID (사전 등록)
        uint256 answerId; // 답변 ID (1~10)
        uint256 votingAmt;
    }

    struct UserSig {
        address user;
        uint256 userNonce;
        uint256 recordIndex;
        bytes signature;
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

    // 답변 이름: missionId => questionId => answerId => text
    mapping(uint256 => mapping(uint256 => mapping(uint256 => string))) public answerName;

    // 답변 허용 여부: missionId => questionId => answerId => allowed
    mapping(uint256 => mapping(uint256 => mapping(uint256 => bool))) public allowedAnswer;

    // === 실시간 집계 (MainVoting 패턴) ===

    /**
     * @notice 질문별 답변 득표 통계
     * @dev answerId (1~10) → 총 투표 포인트
     */
    struct QuestionStats {
        uint256[11] answerVotes; // answerVotes[1~10] 사용 (0번 인덱스 미사용)
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

    // === 메타데이터 이벤트 ===
    event QuestionSet(
        uint256 indexed missionId,
        uint256 indexed questionId,
        string text,
        bool allowed
    );
    event AnswerSet(
        uint256 indexed missionId,
        uint256 indexed questionId,
        uint256 indexed answerId,
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
        // 덮어쓰기 방지: 질문이 이미 설정된 경우 수정 불가
        require(bytes(questionName[missionId][questionId]).length == 0, "Question already exists");
        
        questionName[missionId][questionId] = text;
        allowedQuestion[missionId][questionId] = allowed_;
        emit QuestionSet(missionId, questionId, text, allowed_);
    }

    /**
     * @notice 답변 등록 및 활성화 관리
     * @dev answerId는 1~10만 허용
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @param answerId 답변 ID (1~10)
     * @param text 답변 텍스트
     * @param allowed_ 투표 허용 여부
     */
    function setAnswer(
        uint256 missionId,
        uint256 questionId,
        uint256 answerId,
        string calldata text,
        bool allowed_
    ) external onlyOwner {
        if (answerId == 0 || answerId > MAX_ANSWER_ID) {
            revert InvalidAnswerId(answerId);
        }
        
        // 덮어쓰기 방지: 답변이 이미 설정된 경우 수정 불가
        require(bytes(answerName[missionId][questionId][answerId]).length == 0, "Answer already exists");
        
        answerName[missionId][questionId][answerId] = text;
        allowedAnswer[missionId][questionId][answerId] = allowed_;
        emit AnswerSet(missionId, questionId, answerId, text, allowed_);
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
                    record.userAddress,
                    keccak256(bytes(record.userId)),
                    record.questionId,
                    record.answerId,
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
        if (record.answerId == 0 || record.answerId > MAX_ANSWER_ID) {
            revert InvalidAnswerId(record.answerId);
        }
        if (record.userAddress == address(0)) {
            revert ZeroAddress();
        }
        if (!allowedQuestion[record.missionId][record.questionId]) {
            revert QuestionNotAllowed(record.missionId, record.questionId);
        }
        if (!allowedAnswer[record.missionId][record.questionId][record.answerId]) {
            revert AnswerNotAllowed(record.missionId, record.answerId);
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

        if (idx >= records.length) revert InvalidRecordIndex();
        if (covered[idx]) revert DuplicateIndex(idx);
        covered[idx] = true;

        VoteRecord calldata record = records[idx];
        if (record.userAddress != userSig.user) revert InvalidSignature();

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

        uint256 len = records.length;
        for (uint256 k; k < len; ) {
            if (!covered[k]) revert UncoveredRecord(k);
            unchecked {
                ++k;
            }
        }
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
        VoteRecord[] calldata records,
        bytes32[] memory recordDigests
    ) internal returns (uint256 storedCount) {
        uint256 len = records.length;
        if (len > MAX_RECORDS_PER_BATCH) revert BatchTooLarge();

        for (uint256 i; i < len; ) {
            VoteRecord calldata record = records[i];

            // 0포인트 투표 스킵
            if (record.votingAmt == 0) {
                unchecked {
                    ++i;
                }
                continue;
            }

            // 공통 검증 (questionId, answerId 허용 여부)
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

            stats.answerVotes[record.answerId] += record.votingAmt;
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
        UserSig[] calldata userSigs,
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
            userSigs,
            covered,
            recordDigests,
            batchDigest
        );
        uint256 userSigLen = userSigs.length;

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
    // View: 집계 조회 (MainVoting 패턴)
    // ========================================

    /**
     * @notice 질문별 답변 득표 현황 조회
     * @dev MainVoting의 getCandidateAggregates와 동일 패턴
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @return answerVotes 답변별 득표 (1~10)
     * @return total 전체 투표 포인트 합계
     */
    function getQuestionAggregates(
        uint256 missionId,
        uint256 questionId
    ) external view returns (uint256[11] memory answerVotes, uint256 total) {
        QuestionStats storage s = questionStats[missionId][questionId];
        return (s.answerVotes, s.total);
    }

    /**
     * @notice 특정 답변의 득표 조회
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @param answerId 답변 ID (1~10)
     * @return 해당 답변의 총 투표 포인트
     */
    function getAnswerVotes(
        uint256 missionId,
        uint256 questionId,
        uint256 answerId
    ) external view returns (uint256) {
        if (answerId == 0 || answerId > MAX_ANSWER_ID) {
            revert InvalidAnswerId(answerId);
        }
        return questionStats[missionId][questionId].answerVotes[answerId];
    }

    // ========================================
    // View: 질문-답변 목록 조회
    // ========================================

    /**
     * @notice 답변 정보 구조체
     */
    struct AnswerInfo {
        uint256 answerId;
        string answerText;
        uint256 votes;
        bool allowed;
    }

    /**
     * @notice 질문 정보 구조체
     */
    struct QuestionInfo {
        string questionText;
        bool questionAllowed;
        AnswerInfo[] answers;
        uint256 totalVotes;
    }

    /**
     * @notice 특정 질문과 모든 답변 정보 조회
     * @dev answerId 1~10을 순회하며 등록된 답변만 반환
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @return QuestionInfo 질문 텍스트, 답변 목록, 총 득표수
     */
    function getQuestionWithAnswers(
        uint256 missionId,
        uint256 questionId
    ) external view returns (QuestionInfo memory) {
        string memory qText = questionName[missionId][questionId];
        bool qAllowed = allowedQuestion[missionId][questionId];
        QuestionStats storage stats = questionStats[missionId][questionId];

        // 등록된 답변 개수 세기
        uint256 answerCount = 0;
        for (uint256 i = 1; i <= MAX_ANSWER_ID; ) {
            if (bytes(answerName[missionId][questionId][i]).length > 0) {
                unchecked {
                    ++answerCount;
                }
            }
            unchecked {
                ++i;
            }
        }

        // 답변 배열 생성
        AnswerInfo[] memory answers = new AnswerInfo[](answerCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= MAX_ANSWER_ID; ) {
            string memory aText = answerName[missionId][questionId][i];
            if (bytes(aText).length > 0) {
                answers[index] = AnswerInfo({
                    answerId: i,
                    answerText: aText,
                    votes: stats.answerVotes[i],
                    allowed: allowedAnswer[missionId][questionId][i]
                });
                unchecked {
                    ++index;
                }
            }
            unchecked {
                ++i;
            }
        }

        return QuestionInfo({
            questionText: qText,
            questionAllowed: qAllowed,
            answers: answers,
            totalVotes: stats.total
        });
    }

    /**
     * @notice 답변 목록만 간단히 조회
     * @dev 질문 정보 없이 답변 목록만 반환
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @return AnswerInfo[] 답변 배열
     */
    function getAnswerList(
        uint256 missionId,
        uint256 questionId
    ) external view returns (AnswerInfo[] memory) {
        QuestionStats storage stats = questionStats[missionId][questionId];

        // 등록된 답변 개수 세기
        uint256 answerCount = 0;
        for (uint256 i = 1; i <= MAX_ANSWER_ID; ) {
            if (bytes(answerName[missionId][questionId][i]).length > 0) {
                unchecked {
                    ++answerCount;
                }
            }
            unchecked {
                ++i;
            }
        }

        // 답변 배열 생성
        AnswerInfo[] memory answers = new AnswerInfo[](answerCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= MAX_ANSWER_ID; ) {
            string memory aText = answerName[missionId][questionId][i];
            if (bytes(aText).length > 0) {
                answers[index] = AnswerInfo({
                    answerId: i,
                    answerText: aText,
                    votes: stats.answerVotes[i],
                    allowed: allowedAnswer[missionId][questionId][i]
                });
                unchecked {
                    ++index;
                }
            }
            unchecked {
                ++i;
            }
        }

        return answers;
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

    function getVoteCountByVotingId(
        uint256 missionId,
        uint256 votingId
    ) external view returns (uint256) {
        return voteHashesByMissionVotingId[missionId][votingId].length;
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
        string answerText; // answerName에서 조회
        uint256 votingAmt;
    }

    /**
     * @notice 투표 요약 조회 (문자열 변환)
     * @dev MainVoting의 getVoteSummariesByMissionVotingId와 동일 패턴
     *      questionId/answerId를 questionName/answerName으로 변환
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
            string memory answer = answerName[record.missionId][
                record.questionId
            ][record.answerId];

            result[i] = VoteRecordSummary({
                timestamp: record.timestamp,
                missionId: record.missionId,
                votingId: record.votingId,
                userId: record.userId,
                questionText: question,
                answerText: answer,
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
