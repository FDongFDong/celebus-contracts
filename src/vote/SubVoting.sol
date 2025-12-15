// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @dev ERC-1271: 스마트 컨트랙트 지갑의 서명 검증 표준
interface IERC1271 {
    function isValidSignature(
        bytes32 hash,
        bytes calldata signature
    ) external view returns (bytes4);
}

/**
 * @title SubVoting
 * @author Celebus Team
 * @notice 서브 투표 시스템 (질문-답변 형식의 투표)
 * @dev 2단계 서명 검증 구조:
 *      1) Executor 서명: 배치 전체의 유효성 보장
 *      2) User 서명: 개별 사용자의 투표 의사 확인
 *
 *      Nonce 시스템으로 리플레이 공격 방지:
 *      - batchNonce: Executor별 배치 순서 보장
 *      - userNonce: 사용자별 투표 중복 방지
 *
 *      MainVoting과 동일한 구조:
 *      - 단일 서명 + 다중 레코드 (1:N 방식)
 *      - Soft-fail 처리 (한 유저 실패해도 다른 유저 계속 처리)
 *      - UserVoteResult 이벤트로 votingId 단위 결과 추적
 */
contract SubVoting is Ownable2Step, EIP712 {
    // ============================================================
    //                         상수 (Constants)
    // ============================================================

    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;

    /// @notice 배치당 최대 투표 레코드 수
    uint256 public constant MAX_RECORDS_PER_BATCH = 2000;
    /// @notice 사용자당 최대 투표 레코드 수
    uint16 public constant MAX_RECORDS_PER_USER_BATCH = 20;
    /// @notice 문자열 필드 최대 길이
    uint16 public constant MAX_STRING_LENGTH = 100;
    /// @notice 선택지 ID 최대값 (1~10 범위)
    uint256 public constant MAX_OPTION_ID = 10;

    // UserBatchFailed / UserVoteResult 이벤트용 실패 사유 코드
    uint8 private constant REASON_USER_BATCH_TOO_LARGE = 1;      // 유저 배치 크기 초과 (레코드 0개 또는 MAX_RECORDS_PER_USER_BATCH 초과)
    uint8 private constant REASON_INVALID_USER_SIGNATURE = 2;    // 유저 서명 검증 실패 (EIP-712 서명 불일치)
    uint8 private constant REASON_USER_NONCE_INVALID = 3;        // 유저 nonce 중복 사용 (이미 사용된 nonce)
    uint8 private constant REASON_INVALID_OPTION_ID = 4;         // 잘못된 선택지 ID (0 또는 MAX_OPTION_ID 초과)
    uint8 private constant REASON_QUESTION_NOT_ALLOWED = 5;      // 허용되지 않은 질문 (비활성화된 질문에 투표 시도)
    uint8 private constant REASON_OPTION_NOT_ALLOWED = 6;        // 허용되지 않은 선택지 (비활성화된 선택지에 투표 시도)
    uint8 private constant REASON_STRING_TOO_LONG = 7;           // 문자열 길이 초과 (userId > 100자)

    // EIP-712 TypeHash: 서명 검증용 구조체 해시
    // recordId는 서명 데이터에 포함되지 않음 (백엔드 생성, 온체인 식별용)
    // userId도 서명 데이터에 포함되지 않음 (백엔드가 DB에서 주입)
    bytes32 private constant VOTE_RECORD_TYPEHASH =
        keccak256(
            "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 questionId,uint256 optionId,uint256 votingAmt,address user)"
        );
    bytes32 private constant USER_BATCH_TYPEHASH =
        keccak256(
            "UserBatch(address user,uint256 userNonce,bytes32 recordsHash)"
        );
    bytes32 private constant BATCH_TYPEHASH =
        keccak256("Batch(uint256 batchNonce)");

    // ============================================================
    //                         에러 (Errors)
    // ============================================================

    error ZeroAddress();
    error InvalidSignature();
    error BadChain();
    error BatchNonceAlreadyUsed();
    error UserNonceAlreadyUsed();
    error InvalidRecordIndices();
    error BatchTooLarge();
    error UserBatchTooLarge();
    error StringTooLong();
    error NotOwnerOrExecutor();
    error QuestionNotAllowed(uint256 missionId, uint256 questionId);
    error OptionNotAllowed(uint256 missionId, uint256 optionId);
    error InvalidOptionId(uint256 optionId);
    error NoSuccessfulUser();

    // ============================================================
    //                         구조체 (Structs)
    // ============================================================

    /// @notice 개별 투표 레코드
    struct VoteRecord {
        uint256 recordId; // 백엔드가 생성하는 유니크 ID (서명 데이터에는 포함 X)
        uint256 timestamp; // 투표 시각 (Unix timestamp)
        uint256 missionId; // 미션 ID
        uint256 votingId; // 투표 ID
        string userId; // 사용자 식별자 (off-chain, 서명에 포함 X)
        uint256 questionId; // 질문 ID
        uint256 optionId; // 선택한 답변 ID (1~10)
        uint256 votingAmt; // 투표 수량
    }

    /// @notice 사용자의 배치 서명 정보
    struct UserBatchSig {
        address user; // 서명자 주소
        uint256 userNonce; // 리플레이 방지용 고유 번호
        bytes signature; // EIP-712 서명
    }

    /// @notice 사용자별 투표 묶음 (레코드 + 서명)
    struct UserVoteBatch {
        VoteRecord[] records;
        UserBatchSig userBatchSig;
    }

    /// @notice 조회용 투표 요약
    struct VoteRecordSummary {
        uint256 timestamp;
        uint256 missionId;
        uint256 votingId;
        string userId;
        string questionText; // 질문 이름
        string optionText; // 선택지 이름
        uint256 votingAmt;
    }

    /// @notice 질문별 선택지 득표 통계
    struct QuestionStats {
        uint256[11] optionVotes; // optionVotes[1~10] 사용, 0번 인덱스 미사용
        uint256 total; // 전체 투표 포인트 합계
    }

    /// @notice 선택지 정보 구조체 (조회용)
    struct OptionInfo {
        uint256 optionId;
        string optionText;
        uint256 votes;
        bool allowed;
    }

    /// @notice 질문 정보 구조체 (조회용)
    struct QuestionInfo {
        string questionText;
        bool questionAllowed;
        OptionInfo[] options;
        uint256 totalVotes;
    }

    // ============================================================
    //                      상태 변수 (State Variables)
    // ============================================================

    /// @notice 투표 레코드 저장소 (recordDigest => VoteRecord)
    mapping(bytes32 => VoteRecord) public votes;

    /// @notice 미션/투표별 레코드 해시 목록 (조회용)
    mapping(uint256 => mapping(uint256 => bytes32[]))
        private voteHashesByMissionVotingId;

    /// @notice 사용자별 사용된 Nonce 추적 (중복 방지)
    mapping(address => mapping(uint256 => bool)) public usedUserNonces;

    /// @notice Executor별 사용된 배치 Nonce 추적 (중복 방지)
    mapping(address => mapping(uint256 => bool)) public usedBatchNonces;

    /// @notice 중복 투표 방지 (user => recordDigest => consumed)
    mapping(address => mapping(bytes32 => bool)) public consumed;

    /// @notice 배포 시 체인 ID (크로스체인 리플레이 방지)
    uint256 public immutable CHAIN_ID;

    /// @notice 배치 제출 권한을 가진 Executor 주소
    address public executorSigner;

    /// @notice 질문 이름 (missionId => questionId => name)
    mapping(uint256 => mapping(uint256 => string)) public questionName;

    /// @notice 질문 허용 여부 (missionId => questionId => allowed)
    mapping(uint256 => mapping(uint256 => bool)) public allowedQuestion;

    /// @notice 선택지 이름 (missionId => questionId => optionId => name)
    mapping(uint256 => mapping(uint256 => mapping(uint256 => string)))
        public optionName;

    /// @notice 선택지 허용 여부 (missionId => questionId => optionId => allowed)
    mapping(uint256 => mapping(uint256 => mapping(uint256 => bool)))
        public allowedOption;

    /// @notice 질문별 투표 통계 (missionId => questionId => stats)
    mapping(uint256 => mapping(uint256 => QuestionStats)) public questionStats;

    // ============================================================
    //                         이벤트 (Events)
    // ============================================================

    event ExecutorSignerChanged(
        address indexed oldSigner,
        address indexed newSigner
    );

    /// @notice 사용자 배치 처리 성공 (검증 기준)
    event UserBatchProcessed(
        bytes32 indexed batchDigest,
        address indexed user,
        uint256 userNonce,
        uint256 recordCount
    );

    /// @notice 사용자 배치 처리 실패 (검증 기준, 레코드 저장 전 단계)
    event UserBatchFailed(
        bytes32 indexed batchDigest,
        address indexed user,
        uint256 userNonce,
        uint8 reasonCode
    );

    /// @notice 전체 배치 처리 완료
    event BatchProcessed(
        bytes32 indexed batchDigest,
        address indexed executorSigner,
        uint256 batchNonce,
        uint256 recordCount,
        uint256 userCount,
        uint256 failedUserCount
    );

    /// @notice votingId 단위 유저 투표 결과 이벤트
    /// @dev 한 UserVoteBatch(=한 유저 서명)에 포함된 모든 레코드의 votingId는 동일하다는 전제를 사용
    /// @dev 일부 레코드만 실패해도 success는 false, 실패한 recordId만 배열에 포함
    event UserVoteResult(
        uint256 indexed votingId,
        bool success,
        uint256[] failedRecordIds,
        uint8 reasonCode
    );

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

    /// @notice 투표 스킵 이벤트 (중복 또는 0 수량)
    /// @param reason 1=duplicate, 2=zeroAmount
    event VoteSkipped(
        address indexed user,
        uint256 indexed votingId,
        uint256 recordId,
        uint8 reason
    );

    // ============================================================
    //                      생성자 & 관리 함수
    // ============================================================

    constructor(
        address initialOwner
    ) EIP712("SubVoting", "1") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        CHAIN_ID = block.chainid;
    }

    /// @notice Executor 주소 설정 (배치 제출 권한 부여)
    function setExecutorSigner(address s) external onlyOwner {
        if (s == address(0)) revert ZeroAddress();
        address oldSigner = executorSigner;
        executorSigner = s;
        emit ExecutorSignerChanged(oldSigner, s);
    }

    /// @notice 질문 등록/수정
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

    /// @notice 선택지 등록/수정
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

    // ============================================================
    //                      내부 함수 (Internal)
    // ============================================================

    /// @dev 개별 투표 레코드의 EIP-712 해시 생성
    ///      recordId, userId는 해시/서명에 포함되지 않음
    function _hashVoteRecord(
        VoteRecord calldata record,
        address user
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
                    record.votingAmt,
                    user
                )
            );
    }

    /// @dev 사용자 배치의 EIP-712 해시 생성 (서명 검증용)
    function _hashUserBatch(
        address user,
        uint256 nonce,
        bytes32 recordsHash
    ) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(USER_BATCH_TYPEHASH, user, nonce, recordsHash)
                )
            );
    }

    /// @dev 전체 배치의 EIP-712 해시 생성 (Executor 서명 검증용)
    function _hashBatch(uint256 nonce) internal view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(BATCH_TYPEHASH, nonce)));
    }

    /// @dev 서명 검증 (EOA: ECDSA, 컨트랙트: ERC-1271)
    function _isValidSig(
        address signer,
        bytes32 digest,
        bytes calldata sig
    ) internal view returns (bool) {
        if (signer.code.length == 0)
            return ECDSA.recover(digest, sig) == signer;
        (bool ok, bytes memory ret) = signer.staticcall(
            abi.encodeWithSelector(
                IERC1271.isValidSignature.selector,
                digest,
                sig
            )
        );
        return ok && ret.length == 4 && bytes4(ret) == ERC1271_MAGICVALUE;
    }

    /// @dev 문자열 검증 (soft-fail 버전) - 모든 레코드의 userId 길이 검증
    function _validateStringsSoft(VoteRecord[] calldata records) internal pure returns (bool) {
        uint256 len = records.length;
        for (uint256 j; j < len; ) {
            if (bytes(records[j].userId).length > MAX_STRING_LENGTH) {
                return false;
            }
            unchecked {
                ++j;
            }
        }
        return true;
    }

    /// @dev 사용자의 모든 레코드에 대해 해시 배열 생성
    function _buildRecordDigestsForUser(
        VoteRecord[] calldata records,
        address user
    ) internal pure returns (bytes32[] memory recordDigests) {
        uint256 len = records.length;
        recordDigests = new bytes32[](len);
        for (uint256 j; j < len; ) {
            recordDigests[j] = _hashVoteRecord(records[j], user);
            unchecked {
                ++j;
            }
        }
    }

    /// @dev 배치 Nonce 검증 및 사용 처리 (중복 방지)
    function _consumeBatchNonce(address signer, uint256 nonce_) internal {
        if (usedBatchNonces[signer][nonce_]) revert BatchNonceAlreadyUsed();
        usedBatchNonces[signer][nonce_] = true;
    }

    /**
     * @dev 사용자 배치 검증 (Soft-fail 방식)
     *      실패 시 revert 대신 (false, reasonCode) 반환 + 이벤트 발생
     *      → 다른 사용자의 투표는 계속 처리 가능
     *
     * 여기서는 "배치 수준" 검증만 수행:
     * 1) 레코드 개수
     * 2) 서명 검증
     * 3) userNonce 중복 검증
     *
     * per-record 검증(allowedQuestion, allowedOption)은 _storeVoteRecords에서 처리
     */
    function _verifyUserBatchSignatureSoft(
        UserVoteBatch calldata batch,
        bytes32[] memory userRecordDigests,
        bytes32 batchDigest
    ) internal returns (bool ok, uint8 reasonCode) {
        uint256 count = batch.records.length;
        UserBatchSig calldata userSig = batch.userBatchSig;
        address user = userSig.user;
        uint256 nonce_ = userSig.userNonce;

        // 1) 레코드 개수 검증
        if (count == 0 || count > MAX_RECORDS_PER_USER_BATCH) {
            reasonCode = REASON_USER_BATCH_TOO_LARGE;
            emit UserBatchFailed(batchDigest, user, nonce_, reasonCode);
            return (false, reasonCode);
        }

        // 2) 서명 검증
        bytes32 recordsHash = keccak256(abi.encodePacked(userRecordDigests));
        bytes32 userBatchDigest = _hashUserBatch(user, nonce_, recordsHash);

        if (!_isValidSig(user, userBatchDigest, userSig.signature)) {
            reasonCode = REASON_INVALID_USER_SIGNATURE;
            emit UserBatchFailed(batchDigest, user, nonce_, reasonCode);
            return (false, reasonCode);
        }

        // 3) Nonce 중복 검증
        if (usedUserNonces[user][nonce_]) {
            reasonCode = REASON_USER_NONCE_INVALID;
            emit UserBatchFailed(batchDigest, user, nonce_, reasonCode);
            return (false, reasonCode);
        }

        usedUserNonces[user][nonce_] = true;

        emit UserBatchProcessed(batchDigest, user, nonce_, count);
        return (true, 0);
    }

    /**
     * @dev 검증 통과한 사용자들의 투표 레코드 저장
     *      - 중복 방지: consumed 체크
     *      - votingAmt=0인 레코드 스킵
     *      - 질문/선택지별 통계 업데이트
     *      - votingId 단위 UserVoteResult 이벤트 발생
     *
     * 설계:
     * - userOk[i] == false:
     *     → 배치 수준에서 실패 (서명/nonce/개수)
     *     → 그 유저의 모든 recordId를 실패로 처리
     * - userOk[i] == true:
     *     → per-record 검증 수행
     *     → invalid optionId / question / option인 레코드만 failedRecordIds에 포함
     *     → 일부라도 실패가 있으면 success=false
     */
    function _storeVoteRecords(
        UserVoteBatch[] calldata batches,
        bytes32[][] memory recordDigests,
        bool[] memory userOk,
        uint8[] memory userReason
    ) internal returns (uint256 storedCount) {
        uint256 userCount = batches.length;

        for (uint256 i; i < userCount; ) {
            UserVoteBatch calldata ub = batches[i];
            VoteRecord[] calldata userRecords = ub.records;
            uint256 userRecordLen = userRecords.length;

            // 유저 배치가 검증 단계에서 실패한 경우
            if (!userOk[i]) {
                if (userRecordLen > 0) {
                    uint256 votingId_ = userRecords[0].votingId;

                    uint256[] memory failedRecordIds = new uint256[](
                        userRecordLen
                    );
                    for (uint256 j; j < userRecordLen; ) {
                        failedRecordIds[j] = userRecords[j].recordId;
                        unchecked {
                            ++j;
                        }
                    }

                    emit UserVoteResult(
                        votingId_,
                        false, // 배치 수준에서 실패 → 전체 실패
                        failedRecordIds,
                        userReason[i]
                    );
                }
                unchecked {
                    ++i;
                }
                continue;
            }

            // 여기부터는 유저 배치 검증 통과 → 실제 저장 로직 (per-record 검증 포함)
            address user = ub.userBatchSig.user;

            uint256 votingId = userRecordLen > 0 ? userRecords[0].votingId : 0;
            uint256 localStored; // 이 유저 배치에서 실제로 저장된 레코드 수
            uint256 failedCount;
            bool hasReason;
            uint8 localReason;

            // 최대 길이 배열 만들어두고, 실제 사용 개수만큼 잘라서 이벤트에 사용
            uint256[] memory tmpFailedRecordIds = new uint256[](userRecordLen);

            for (uint256 j; j < userRecordLen; ) {
                VoteRecord calldata record = userRecords[j];
                bytes32 recordDigest = recordDigests[i][j];

                // 중복 투표 스킵
                if (consumed[user][recordDigest]) {
                    emit VoteSkipped(user, record.votingId, record.recordId, 1);
                    unchecked {
                        ++j;
                    }
                    continue;
                }

                // 빈 투표 스킵
                if (record.votingAmt == 0) {
                    emit VoteSkipped(user, record.votingId, record.recordId, 2);
                    unchecked {
                        ++j;
                    }
                    continue;
                }

                // per-record 검증: optionId 범위
                if (record.optionId == 0 || record.optionId > MAX_OPTION_ID) {
                    tmpFailedRecordIds[failedCount] = record.recordId;
                    failedCount++;
                    if (!hasReason) {
                        hasReason = true;
                        localReason = REASON_INVALID_OPTION_ID;
                    }
                    unchecked {
                        ++j;
                    }
                    continue;
                }

                // per-record 검증: question allowed
                if (!allowedQuestion[record.missionId][record.questionId]) {
                    tmpFailedRecordIds[failedCount] = record.recordId;
                    failedCount++;
                    if (!hasReason) {
                        hasReason = true;
                        localReason = REASON_QUESTION_NOT_ALLOWED;
                    }
                    unchecked {
                        ++j;
                    }
                    continue;
                }

                // per-record 검증: option allowed
                if (
                    !allowedOption[record.missionId][record.questionId][
                        record.optionId
                    ]
                ) {
                    tmpFailedRecordIds[failedCount] = record.recordId;
                    failedCount++;
                    if (!hasReason) {
                        hasReason = true;
                        localReason = REASON_OPTION_NOT_ALLOWED;
                    }
                    unchecked {
                        ++j;
                    }
                    continue;
                }

                // 여기까지 왔다면 이 레코드는 온전히 유효 → 저장 + 통계 반영
                consumed[user][recordDigest] = true;
                votes[recordDigest] = record;
                voteHashesByMissionVotingId[record.missionId][record.votingId]
                    .push(recordDigest);

                QuestionStats storage stats = questionStats[record.missionId][
                    record.questionId
                ];
                stats.optionVotes[record.optionId] += record.votingAmt;
                stats.total += record.votingAmt;

                unchecked {
                    ++storedCount;
                    ++localStored;
                    ++j;
                }
            }

            // 이 유저 배치에 대한 UserVoteResult 이벤트 발행
            if (userRecordLen > 0) {
                // failedRecordIds 배열 사이즈 맞게 잘라서 생성
                uint256[] memory finalFailedIds;
                if (failedCount > 0) {
                    finalFailedIds = new uint256[](failedCount);
                    for (uint256 k; k < failedCount; ) {
                        finalFailedIds[k] = tmpFailedRecordIds[k];
                        unchecked {
                            ++k;
                        }
                    }
                } else {
                    finalFailedIds = new uint256[](0);
                }

                // 일부라도 실패가 있으면 success = false
                bool success = (failedCount == 0 && localStored > 0);
                uint8 reasonCode = success ? 0 : (hasReason ? localReason : 0);

                emit UserVoteResult(
                    votingId,
                    success,
                    finalFailedIds,
                    reasonCode
                );
            }

            unchecked {
                ++i;
            }
        }
    }

    // ============================================================
    //                   메인 진입점 (External)
    // ============================================================

    /**
     * @notice 다중 사용자 투표 배치 제출
     * @dev 처리 흐름:
     *      1. 입력 검증 (레코드 수, Executor 설정, 체인 ID)
     *      2. Executor 서명 검증 → 배치 Nonce 소비
     *      3. 각 사용자별 검증 (Soft-fail: 실패해도 다른 사용자 계속)
     *      4. 검증 통과한 레코드 저장 + 통계 업데이트
     *      5. votingId 단위 UserVoteResult 이벤트 발생
     *
     * @param batches 사용자별 투표 배치 배열
     * @param batchNonce_ 배치 순서 번호 (리플레이 방지)
     * @param executorSig Executor의 EIP-712 서명
     */
    function submitMultiUserBatch(
        UserVoteBatch[] calldata batches,
        uint256 batchNonce_,
        bytes calldata executorSig
    ) external {
        // === 1. 입력 검증 ===
        uint256 userCount = batches.length;
        if (userCount == 0) revert InvalidRecordIndices();

        uint256 totalRecords;
        for (uint256 i; i < userCount; ) {
            totalRecords += batches[i].records.length;
            unchecked {
                ++i;
            }
        }
        if (totalRecords > MAX_RECORDS_PER_BATCH) revert BatchTooLarge();
        if (executorSigner == address(0)) revert ZeroAddress();
        if (block.chainid != CHAIN_ID) revert BadChain();

        // === 2. Executor 서명 & Nonce 검증 ===
        bytes32 batchDigest = _hashBatch(batchNonce_);
        if (!_isValidSig(executorSigner, batchDigest, executorSig))
            revert InvalidSignature();
        _consumeBatchNonce(executorSigner, batchNonce_);

        // === 3. 각 사용자 배치 검증 ===
        bytes32[][] memory recordDigests = new bytes32[][](userCount);
        bool[] memory userOk = new bool[](userCount);
        uint8[] memory userReason = new uint8[](userCount);
        uint256 successUserCount;

        for (uint256 i; i < userCount; ) {
            address user = batches[i].userBatchSig.user;
            uint256 nonce_ = batches[i].userBatchSig.userNonce;

            // 문자열 검증 (soft-fail) - userId 길이 초과 시 해당 유저만 실패
            if (!_validateStringsSoft(batches[i].records)) {
                userOk[i] = false;
                userReason[i] = REASON_STRING_TOO_LONG;
                emit UserBatchFailed(batchDigest, user, nonce_, REASON_STRING_TOO_LONG);
                recordDigests[i] = new bytes32[](0);
                unchecked {
                    ++i;
                }
                continue;
            }

            recordDigests[i] = _buildRecordDigestsForUser(
                batches[i].records,
                user
            );

            (bool ok, uint8 reason) = _verifyUserBatchSignatureSoft(
                batches[i],
                recordDigests[i],
                batchDigest
            );

            if (ok) {
                userOk[i] = true;
                unchecked {
                    ++successUserCount;
                }
            }
            userReason[i] = reason; // 성공 시 0, 실패 시 > 0

            unchecked {
                ++i;
            }
        }

        if (successUserCount == 0) revert NoSuccessfulUser();

        // === 4. 레코드 저장 + UserVoteResult 이벤트 ===
        uint256 stored = _storeVoteRecords(
            batches,
            recordDigests,
            userOk,
            userReason
        );
        if (stored == 0) revert NoSuccessfulUser();

        emit BatchProcessed(
            batchDigest,
            executorSigner,
            batchNonce_,
            stored,
            userCount,
            userCount - successUserCount
        );
    }

    // ============================================================
    //                      조회 함수 (View)
    // ============================================================

    /// @notice EIP-712 도메인 구분자 반환
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /// @notice 미션/투표별 모든 투표 기록 조회 (요약 형태)
    function getVoteSummariesByMissionVotingId(
        uint256 missionId,
        uint256 votingId
    ) external view returns (VoteRecordSummary[] memory) {
        bytes32[] storage allHashes = voteHashesByMissionVotingId[missionId][
            votingId
        ];
        uint256 totalCount = allHashes.length;
        VoteRecordSummary[] memory result = new VoteRecordSummary[](totalCount);

        for (uint256 i; i < totalCount; ++i) {
            VoteRecord storage record = votes[allHashes[i]];
            result[i] = VoteRecordSummary({
                timestamp: record.timestamp,
                missionId: record.missionId,
                votingId: record.votingId,
                userId: record.userId,
                questionText: questionName[record.missionId][record.questionId],
                optionText: optionName[record.missionId][record.questionId][
                    record.optionId
                ],
                votingAmt: record.votingAmt
            });
        }
        return result;
    }

    /// @notice 질문별 선택지 득표 현황 조회
    function getQuestionAggregates(
        uint256 missionId,
        uint256 questionId
    ) external view returns (uint256[11] memory optionVotes, uint256 total) {
        QuestionStats storage s = questionStats[missionId][questionId];
        return (s.optionVotes, s.total);
    }

    /// @notice 특정 선택지의 득표 조회
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

    /// @notice 특정 질문과 모든 선택지 정보 조회
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

    /// @notice 선택지 목록만 간단히 조회
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

    /// @notice 특정 해시의 투표 레코드 조회
    function getVoteByHash(
        bytes32 voteHash
    ) external view returns (VoteRecord memory) {
        return votes[voteHash];
    }

    /// @notice 특정 미션/투표 세션의 모든 투표 레코드 조회
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
}
