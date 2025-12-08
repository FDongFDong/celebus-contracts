// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev ERC-1271 스마트 컨트랙트 지갑 서명 검증 인터페이스
 *      Safe, Argent 등 스마트 계정에서 서명을 검증할 때 사용됩니다.
 */
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
 *
 * @dev 이 컨트랙트는 "1트랜잭션 N레코드" 구조를 사용합니다.
 *      - 각 사용자가 자신의 레코드에 개별 서명 (1:1 서명 방식)
 *      - 여러 유저의 배치를 하나의 트랜잭션으로 묶어서 처리
 *      - MainVoting과 동일한 보안 수준 유지
 *
 * 보안 특징:
 *      - EIP-712 구조화 서명으로 피싱 방지
 *      - 이중 서명 검증: 사용자 서명 + Executor 서명
 *      - Nonce 시스템으로 리플레이 공격 방지
 *      - Chain ID 검증으로 크로스체인 리플레이 방지
 *
 * 데이터 흐름:
 *      1. 유저가 오프체인에서 투표 레코드에 서명
 *      2. 백엔드(executorSigner)가 여러 유저의 배치를 수집
 *      3. executorSigner가 배치 전체에 서명 후 submitMultiUserBatch 호출
 *      4. 컨트랙트가 모든 서명 검증 후 투표 저장
 */
contract SubVoting is Ownable2Step, EIP712 {
    // ========================================
    // 상수 (Constants)
    // ========================================

    /**
     * @dev ERC-1271 서명 검증 성공 시 반환되는 매직 값
     *      bytes4(keccak256("isValidSignature(bytes32,bytes)"))
     */
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;

    /**
     * @dev 한 트랜잭션에서 처리할 수 있는 최대 투표 레코드 수
     *      가스 한도 초과 방지 및 DoS 공격 방지 목적
     */
    uint256 public constant MAX_RECORDS_PER_BATCH = 2000;

    /**
     * @dev userId 등 문자열 필드의 최대 길이
     *      과도한 스토리지 사용 방지
     */
    uint256 public constant MAX_STRING_LENGTH = 100;

    /**
     * @dev 선택지 ID의 최대값 (1~10 범위만 허용)
     *      0은 사용하지 않으며, 1부터 시작합니다.
     */
    uint256 public constant MAX_OPTION_ID = 10;

    // ========================================
    // EIP-712 타입 해시 (Type Hashes)
    // ========================================

    /**
     * @dev 개별 투표 레코드의 EIP-712 타입 해시
     *
     * 참고: userId는 서명 대상에서 제외됩니다.
     *      - 프론트엔드에서 userId를 모르는 상태로 서명 가능
     *      - 백엔드가 DB에서 userId를 조회하여 VoteRecord에 주입
     */
    bytes32 private constant VOTE_RECORD_TYPEHASH =
        keccak256(
            "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 questionId,uint256 optionId,uint256 votingAmt)"
        );

    /**
     * @dev 유저 서명의 EIP-712 타입 해시
     *
     * 구조: 유저 주소 + 유저 nonce + 레코드 해시
     * 유저가 자신의 투표 레코드를 서명으로 승인합니다.
     */
    bytes32 private constant USER_SIG_TYPEHASH =
        keccak256("UserSig(address user,uint256 userNonce,bytes32 recordHash)");

    /**
     * @dev 전체 배치의 EIP-712 타입 해시
     *
     * executorSigner가 배치를 묶어서 서명할 때 사용됩니다.
     * batchNonce로 리플레이 공격을 방지합니다.
     */
    bytes32 private constant BATCH_TYPEHASH =
        keccak256("Batch(uint256 batchNonce)");

    // ========================================
    // 커스텀 에러 (Custom Errors)
    // ========================================

    /// @dev 주소가 zero address일 때
    error ZeroAddress();

    /// @dev 서명 검증 실패
    error InvalidSignature();

    /// @dev 배포 시 체인과 현재 체인이 다를 때 (크로스체인 리플레이 방지)
    error BadChain();

    /// @dev 유저 nonce가 이미 사용됨
    error UserNonceAlreadyUsed();

    /// @dev 유저 nonce가 최소값보다 낮음 (취소된 nonce 범위)
    error UserNonceTooLow();

    /// @dev 배치 nonce가 이미 사용됨
    error BatchNonceAlreadyUsed();

    /// @dev 배치 nonce가 최소값보다 낮음
    error BatchNonceTooLow();

    /// @dev 전체 배치가 MAX_RECORDS_PER_BATCH 초과
    error BatchTooLarge();

    /// @dev 문자열이 MAX_STRING_LENGTH 초과
    error StringTooLong();

    /// @dev 호출자가 owner도 executorSigner도 아님
    error NotOwnerOrExecutor();

    /// @dev 해당 missionId/questionId의 질문이 허용되지 않음
    error QuestionNotAllowed(uint256 missionId, uint256 questionId);

    /// @dev 해당 missionId/optionId의 선택지가 허용되지 않음
    error OptionNotAllowed(uint256 missionId, uint256 optionId);

    /// @dev 선택지 ID가 유효하지 않음 (0 또는 MAX_OPTION_ID 초과)
    error InvalidOptionId(uint256 optionId);

    // ========================================
    // 구조체 (Structs)
    // ========================================

    /**
     * @dev 개별 투표 레코드
     * @param timestamp 투표 생성 시간 (오프체인에서 설정)
     * @param missionId 미션(캠페인) ID
     * @param votingId 투표 세션 ID
     * @param userId 유저 식별자 (오프체인 시스템의 유저 ID)
     * @param questionId 질문 ID (사전 등록 필요)
     * @param optionId 선택지 ID (1~10 범위)
     * @param votingAmt 투표 수량 (가중치)
     */
    struct VoteRecord {
        uint256 timestamp;
        uint256 missionId;
        uint256 votingId;
        string userId;
        uint256 questionId;
        uint256 optionId;
        uint256 votingAmt;
    }

    /**
     * @dev 유저의 서명 정보
     * @param user 유저의 지갑 주소
     * @param userNonce 유저의 nonce (리플레이 방지)
     * @param signature 유저의 EIP-712 서명
     */
    struct UserSig {
        address user;
        uint256 userNonce;
        bytes signature;
    }

    /**
     * @dev 한 유저의 투표 배치
     *      유저는 하나의 레코드에 하나의 서명을 제출합니다. (1:1 방식)
     * @param record 유저의 투표 레코드
     * @param userSig 유저의 서명 정보
     */
    struct UserVoteBatch {
        VoteRecord record;
        UserSig userSig;
    }

    // ========================================
    // 상태 변수 (State Variables)
    // ========================================

    /**
     * @dev 투표 레코드 저장소
     *      key: 레코드 해시 (recordDigest)
     *      value: 투표 레코드 데이터
     */
    mapping(bytes32 => VoteRecord) public votes;

    /**
     * @dev 미션/투표 세션별 투표 해시 목록
     *      조회 시 특정 missionId + votingId의 모든 투표를 찾을 때 사용
     *
     * 구조: missionId => votingId => recordDigest[]
     *
     * 주의: votingId당 레코드 수 제한이 없으므로 대량 데이터 시
     *       조회 가스비에 주의하세요.
     */
    mapping(uint256 => mapping(uint256 => bytes32[]))
        private voteHashesByMissionVotingId;

    /**
     * @dev 유저별 nonce 사용 여부
     *      리플레이 공격 방지용
     *
     * 구조: user => nonce => used
     */
    mapping(address => mapping(uint256 => bool)) public userNonceUsed;

    /**
     * @dev 유저별 최소 유효 nonce
     *      이 값 미만의 nonce는 모두 무효 처리됨
     *      cancelAllUserNonceUpTo로 일괄 취소 시 사용
     */
    mapping(address => uint256) public minUserNonce;

    /**
     * @dev executorSigner별 배치 nonce 사용 여부
     *
     * 구조: signer => nonce => used
     */
    mapping(address => mapping(uint256 => bool)) public batchNonceUsed;

    /**
     * @dev executorSigner별 최소 유효 배치 nonce
     */
    mapping(address => uint256) public minBatchNonce;

    /**
     * @dev 레코드 소비 여부
     *      동일한 레코드를 중복 제출하는 것을 방지
     *
     * 구조: recordDigest => consumed
     */
    mapping(bytes32 => bool) public consumed;

    /**
     * @dev 배포 시점의 체인 ID (immutable)
     *      크로스체인 리플레이 공격 방지용
     */
    uint256 public immutable CHAIN_ID;

    /**
     * @dev 배치 제출 권한이 있는 서명자 주소
     *      백엔드 서버의 핫월렛 주소가 설정됩니다.
     */
    address public executorSigner;

    /**
     * @dev 질문 이름 저장소
     *
     * 구조: missionId => questionId => questionName
     */
    mapping(uint256 => mapping(uint256 => string)) public questionName;

    /**
     * @dev 질문 허용 여부
     *      false인 질문에는 투표할 수 없습니다.
     *
     * 구조: missionId => questionId => allowed
     */
    mapping(uint256 => mapping(uint256 => bool)) public allowedQuestion;

    /**
     * @dev 선택지 이름 저장소
     *
     * 구조: missionId => questionId => optionId => optionName
     */
    mapping(uint256 => mapping(uint256 => mapping(uint256 => string)))
        public optionName;

    /**
     * @dev 선택지 허용 여부
     *      false인 선택지에는 투표할 수 없습니다.
     *
     * 구조: missionId => questionId => optionId => allowed
     */
    mapping(uint256 => mapping(uint256 => mapping(uint256 => bool)))
        public allowedOption;

    /**
     * @dev 질문별 선택지 득표 통계
     * @param optionVotes 선택지별 득표 수 (optionVotes[1~10] 사용, 0번 인덱스 미사용)
     * @param total 전체 투표 포인트 합계
     */
    struct QuestionStats {
        uint256[11] optionVotes;
        uint256 total;
    }

    /**
     * @dev 질문별 답변 득표 통계
     *
     * 구조: missionId => questionId => QuestionStats
     */
    mapping(uint256 => mapping(uint256 => QuestionStats)) public questionStats;

    // ========================================
    // 이벤트 (Events)
    // ========================================

    /**
     * @dev executorSigner가 변경되었을 때 발생
     * @param oldSigner 이전 서명자 주소
     * @param newSigner 새로운 서명자 주소
     * @param oldMinNonce 이전 서명자의 minBatchNonce (참고용)
     */
    event ExecutorSignerChanged(
        address indexed oldSigner,
        address indexed newSigner,
        uint256 oldMinNonce
    );

    /**
     * @dev 유저의 투표가 처리되었을 때 발생
     * @param batchDigest 전체 배치의 해시
     * @param user 유저 주소
     * @param userNonce 사용된 유저 nonce
     */
    event UserVoteProcessed(
        bytes32 indexed batchDigest,
        address indexed user,
        uint256 userNonce
    );

    /**
     * @dev 전체 배치가 처리 완료되었을 때 발생
     * @param batchDigest 배치 해시
     * @param executorSigner 실행한 서명자
     * @param batchNonce 사용된 배치 nonce
     * @param recordCount 실제 저장된 레코드 수 (중복 제외)
     * @param userCount 참여한 유저 수
     */
    event BatchProcessed(
        bytes32 indexed batchDigest,
        address indexed executorSigner,
        uint256 batchNonce,
        uint256 recordCount,
        uint256 userCount
    );

    /**
     * @dev 유저의 nonce가 일괄 취소되었을 때 발생
     * @param user 유저 주소
     * @param newMinUserNonce 새로운 최소 nonce (이 값 미만은 모두 무효)
     */
    event CancelUserNonceUpTo(address indexed user, uint256 newMinUserNonce);

    /**
     * @dev 배치 nonce가 일괄 취소되었을 때 발생
     * @param executorSigner 서명자 주소
     * @param newMinBatchNonce 새로운 최소 nonce
     */
    event CancelBatchNonceUpTo(
        address indexed executorSigner,
        uint256 newMinBatchNonce
    );

    /**
     * @dev 질문 정보가 설정되었을 때 발생
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @param text 질문 텍스트
     * @param allowed 투표 허용 여부
     */
    event QuestionSet(
        uint256 indexed missionId,
        uint256 indexed questionId,
        string text,
        bool allowed
    );

    /**
     * @dev 선택지 정보가 설정되었을 때 발생
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @param optionId 선택지 ID (1~10)
     * @param text 선택지 텍스트
     * @param allowed 투표 허용 여부
     */
    event OptionSet(
        uint256 indexed missionId,
        uint256 indexed questionId,
        uint256 indexed optionId,
        string text,
        bool allowed
    );

    // ========================================
    // 생성자 및 관리자 함수 (Constructor & Admin)
    // ========================================

    /**
     * @dev 컨트랙트 생성자
     * @param initialOwner 초기 소유자 주소
     *
     * EIP712 도메인:
     *   - name: "SubVoting"
     *   - version: "1"
     *
     * 체인 ID가 immutable로 저장되어 크로스체인 리플레이를 방지합니다.
     */
    constructor(
        address initialOwner
    ) EIP712("SubVoting", "1") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        CHAIN_ID = block.chainid;
    }

    /**
     * @dev 질문 정보 설정
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @param text 질문 텍스트
     * @param allowed_ 투표 허용 여부 (false면 해당 질문에 투표 불가)
     *
     * 사용 예:
     *   setQuestion(1, 1, "좋아하는 색상은?", true)
     *   setQuestion(1, 1, "좋아하는 색상은?", false) // 질문 비활성화
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
     * @dev 선택지 정보 설정
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @param optionId 선택지 ID (1~10만 허용)
     * @param text 선택지 텍스트
     * @param allowed_ 투표 허용 여부
     *
     * 사용 예:
     *   setOption(1, 1, 1, "빨간색", true)
     *   setOption(1, 1, 2, "파란색", true)
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

    /**
     * @dev 배치 실행 서명자 설정
     * @param s 새로운 서명자 주소
     *
     * 기존 서명자가 있으면 모든 nonce를 무효화하고,
     * 새 서명자의 minBatchNonce를 0으로 초기화합니다.
     */
    function setExecutorSigner(address s) external onlyOwner {
        if (s == address(0)) revert ZeroAddress();

        address oldSigner = executorSigner;
        uint256 oldMinNonce = minBatchNonce[oldSigner];

        // 기존 서명자가 있으면 모든 nonce 무효화
        if (oldSigner != address(0)) {
            minBatchNonce[oldSigner] = type(uint256).max;
        }

        executorSigner = s;
        // 새 서명자의 minBatchNonce를 0으로 초기화 (재등록 시 DoS 방지)
        minBatchNonce[s] = 0;
        emit ExecutorSignerChanged(oldSigner, s, oldMinNonce);
    }

    /**
     * @dev 특정 유저의 nonce를 일괄 취소
     * @param user 대상 유저 주소
     * @param newMinUserNonce 새로운 최소 nonce
     *
     * 사용 시나리오:
     *   - 유저가 서명한 배치를 취소하고 싶을 때
     *   - 유저의 개인키가 유출되었을 때 긴급 조치
     *
     * 예: newMinUserNonce=100이면 nonce 0~99는 모두 무효
     */
    function cancelAllUserNonceUpTo(
        address user,
        uint256 newMinUserNonce
    ) external onlyOwner {
        if (newMinUserNonce <= minUserNonce[user]) revert UserNonceTooLow();
        minUserNonce[user] = newMinUserNonce;
        emit CancelUserNonceUpTo(user, newMinUserNonce);
    }

    /**
     * @dev 배치 nonce를 일괄 취소
     * @param newMinBatchNonce 새로운 최소 nonce
     *
     * 호출 권한: owner 또는 executorSigner
     *
     * 사용 시나리오:
     *   - 백엔드에서 생성한 배치를 취소하고 싶을 때
     *   - executorSigner의 핫월렛이 위험에 노출되었을 때
     */
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
    // 내부 함수: 해시 로직 (Internal: Hash Logic)
    // ========================================

    /**
     * @dev 개별 투표 레코드의 EIP-712 구조체 해시 생성
     * @param record 투표 레코드
     * @return 레코드의 해시값
     *
     * 참고: userId는 서명 검증에 포함되지 않습니다.
     *   프론트엔드에서 userId 없이 서명하고,
     *   백엔드가 나중에 userId를 주입합니다.
     */
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

    /**
     * @dev 유저 서명의 EIP-712 다이제스트 생성
     * @param user 유저 주소
     * @param userNonce 유저 nonce
     * @param recordHash 레코드 해시
     * @return EIP-712 서명용 다이제스트
     *
     * 유저는 이 다이제스트에 서명하여 레코드를 승인합니다.
     */
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

    /**
     * @dev 전체 배치의 EIP-712 다이제스트 생성
     * @param batchNonce 배치 nonce
     * @return EIP-712 서명용 다이제스트
     *
     * executorSigner가 이 다이제스트에 서명하여 배치 제출을 승인합니다.
     */
    function _hashBatch(uint256 batchNonce) internal view returns (bytes32) {
        return
            _hashTypedDataV4(keccak256(abi.encode(BATCH_TYPEHASH, batchNonce)));
    }

    /**
     * @dev 서명 검증 (EOA + 스마트 컨트랙트 지갑 모두 지원)
     * @param signer 예상 서명자 주소
     * @param digest 서명된 메시지 해시
     * @param sig 서명 데이터
     * @return 서명이 유효하면 true
     *
     * 동작 방식:
     *   1. signer가 EOA인 경우 (code.length == 0):
     *      -> ECDSA.recover로 복구한 주소와 비교
     *   2. signer가 컨트랙트인 경우 (Safe, Argent 등):
     *      -> ERC-1271의 isValidSignature 호출
     */
    function _isValidSig(
        address signer,
        bytes32 digest,
        bytes calldata sig
    ) internal view returns (bool) {
        // EOA 지갑인 경우
        if (signer.code.length == 0) {
            return ECDSA.recover(digest, sig) == signer;
        }

        // 스마트 컨트랙트 지갑인 경우 (ERC-1271)
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
    // 내부 함수: Nonce 관리 (Internal: Nonce Management)
    // ========================================

    /**
     * @dev 유저 nonce 소비 (사용 처리)
     * @param user 유저 주소
     * @param nonce_ 사용할 nonce
     *
     * 검증:
     *   1. nonce가 minUserNonce 이상인지 확인
     *   2. nonce가 이미 사용되지 않았는지 확인
     */
    function _consumeUserNonce(address user, uint256 nonce_) internal {
        if (nonce_ < minUserNonce[user]) revert UserNonceTooLow();
        if (userNonceUsed[user][nonce_]) revert UserNonceAlreadyUsed();
        userNonceUsed[user][nonce_] = true;
    }

    /**
     * @dev 배치 nonce 소비 (사용 처리)
     * @param signer 서명자 주소
     * @param nonce_ 사용할 nonce
     */
    function _consumeBatchNonce(address signer, uint256 nonce_) internal {
        if (nonce_ < minBatchNonce[signer]) revert BatchNonceTooLow();
        if (batchNonceUsed[signer][nonce_]) revert BatchNonceAlreadyUsed();
        batchNonceUsed[signer][nonce_] = true;
    }

    // ========================================
    // 내부 함수: 검증 로직 (Internal: Validation)
    // ========================================

    /**
     * @dev 문자열 필드 길이 검증
     * @param record 검증할 레코드
     *
     * 과도한 스토리지 사용 방지
     */
    function _validateStrings(VoteRecord calldata record) internal pure {
        if (bytes(record.userId).length > MAX_STRING_LENGTH) {
            revert StringTooLong();
        }
    }

    /**
     * @dev 레코드 공통 검증 (저장 직전에 호출)
     * @param record 검증할 레코드
     *
     * 검증 항목:
     *   1. optionId가 유효한 범위(1~10)인지
     *   2. 해당 질문이 투표 허용되어 있는지
     *   3. 해당 선택지가 투표 허용되어 있는지
     */
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
    // 내부 함수: 서명 검증 (Internal: Signature Verification)
    // ========================================

    /**
     * @dev 유저 서명 검증 (1:1 방식)
     * @param userSig 유저 서명 정보
     * @param recordHash 레코드 해시
     * @param batchDigest 배치 다이제스트 (이벤트용)
     *
     * 검증 과정:
     *   1. 유저 주소가 zero가 아닌지 확인
     *   2. EIP-712 다이제스트 생성
     *   3. 서명 검증
     *   4. nonce 소비
     */
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

    /**
     * @dev 배치 서명 검증
     * @param batchNonce 배치 nonce
     * @param executorSig 실행자 서명
     * @return batchDigest 배치 다이제스트
     */
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
    // 내부 함수: 저장 로직 (Internal: Storage)
    // ========================================

    /**
     * @dev 투표 레코드들을 스토리지에 저장
     * @param batches 배치 배열
     * @param recordDigests 레코드 해시 배열
     * @return storedCount 실제 저장된 레코드 수
     *
     * 저장 로직:
     *   1. votingAmt가 0이면 스킵 (무효 투표)
     *   2. 질문/선택지 허용 여부 검증
     *   3. 이미 consumed된 레코드면 스킵 (중복 방지)
     *   4. consumed 표시
     *   5. votes 매핑에 저장
     *   6. voteHashesByMissionVotingId에 해시 추가
     *   7. questionStats 집계 업데이트
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

            // 실시간 집계
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
    // 메인 진입점 (Main Entry Point)
    // ========================================

    /**
     * @notice 여러 유저의 투표 배치를 한 번에 제출
     * @param batches 유저별 투표 배치 배열 (record + userSig 쌍)
     * @param batchNonce 이 배치의 고유 nonce (리플레이 방지)
     * @param executorSig executorSigner의 서명
     *
     * @dev 이 함수는 누구나 호출할 수 있습니다.
     *      유효한 서명이 있다면 제3자도 제출 가능합니다.
     *      (가스비를 대신 내주는 메타트랜잭션 패턴)
     *
     * 처리 순서:
     *   1. 기본 검증 (크기 제한, executorSigner 설정, 체인 ID)
     *   2. executorSigner 서명 검증 및 nonce 소비
     *   3. 각 레코드의 해시 계산 및 유저 서명 검증
     *   4. 투표 레코드 저장 및 집계 업데이트
     *   5. 완료 이벤트 발생
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
    // 조회 함수: 집계 (View: Aggregation)
    // ========================================

    /**
     * @notice 질문별 선택지 득표 현황 조회
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @return optionVotes 선택지별 득표 (1~10)
     * @return total 전체 투표 포인트 합계
     *
     * 사용 예:
     *   (uint256[11] memory votes, uint256 total) = getQuestionAggregates(1, 1);
     *   // votes[1]: 선택지 1의 득표
     *   // votes[2]: 선택지 2의 득표
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
    // 조회 함수: 질문-답변 목록 (View: Question-Option List)
    // ========================================

    /**
     * @dev 선택지 정보 구조체
     * @param optionId 선택지 ID
     * @param optionText 선택지 텍스트
     * @param votes 득표 수
     * @param allowed 투표 허용 여부
     */
    struct OptionInfo {
        uint256 optionId;
        string optionText;
        uint256 votes;
        bool allowed;
    }

    /**
     * @dev 질문 정보 구조체
     * @param questionText 질문 텍스트
     * @param questionAllowed 질문 허용 여부
     * @param options 선택지 배열
     * @param totalVotes 총 득표 수
     */
    struct QuestionInfo {
        string questionText;
        bool questionAllowed;
        OptionInfo[] options;
        uint256 totalVotes;
    }

    /**
     * @notice 특정 질문과 모든 선택지 정보 조회
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @return QuestionInfo 질문 텍스트, 선택지 목록, 총 득표수
     *
     * @dev optionId 1~10을 순회하며 등록된 선택지만 반환합니다.
     *      (선택지 텍스트가 빈 문자열이면 미등록으로 간주)
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
     * @param missionId 미션 ID
     * @param questionId 질문 ID
     * @return OptionInfo[] 선택지 배열
     *
     * @dev 질문 정보 없이 선택지 목록만 반환합니다.
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
    // 조회 함수: 기본 (View: Basic)
    // ========================================

    /**
     * @notice EIP-712 도메인 구분자 조회
     * @return EIP-712 도메인 구분자 해시
     *
     * 오프체인에서 서명 생성 시 이 값이 필요합니다.
     */
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @notice 특정 해시의 투표 레코드 조회
     * @param voteHash 레코드 해시
     * @return 투표 레코드
     */
    function getVoteByHash(
        bytes32 voteHash
    ) external view returns (VoteRecord memory) {
        return votes[voteHash];
    }

    /**
     * @notice 특정 미션/투표 세션의 모든 투표 레코드 조회
     * @param missionId 미션 ID
     * @param votingId 투표 세션 ID
     * @return 투표 레코드 배열
     *
     * @dev 주의: votingId당 레코드 수 제한이 없으므로 대량 데이터 시
     *      가스 비용이 높아질 수 있습니다. 필요 시 오프체인 조회를 권장합니다.
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

    /**
     * @dev 투표 조회용 요약 구조체
     * @param timestamp 투표 시간
     * @param missionId 미션 ID
     * @param votingId 투표 세션 ID
     * @param userId 유저 식별자
     * @param questionText 질문 텍스트
     * @param optionText 선택지 텍스트
     * @param votingAmt 투표 수량
     */
    struct VoteRecordSummary {
        uint256 timestamp;
        uint256 missionId;
        uint256 votingId;
        string userId;
        string questionText;
        string optionText;
        uint256 votingAmt;
    }

    /**
     * @notice 특정 미션/투표 세션의 모든 투표 요약 조회
     * @param missionId 미션 ID
     * @param votingId 투표 세션 ID
     * @return 투표 요약 배열
     *
     * @dev questionId/optionId를 questionName/optionName으로 변환하여 반환합니다.
     *      주의: votingId당 레코드 수 제한이 없으므로 대량 데이터 시
     *      가스 비용이 높아질 수 있습니다.
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

    // ========================================
    // 해시 미리보기 함수 (Hash Preview Functions)
    // ========================================

    /**
     * @notice 투표 레코드 해시 미리보기
     * @param record 투표 레코드
     * @return 레코드 해시
     *
     * 오프체인에서 서명 생성 시 참고용
     */
    function hashVoteRecord(
        VoteRecord calldata record
    ) external pure returns (bytes32) {
        return _hashVoteRecord(record);
    }

    /**
     * @notice 유저 서명 다이제스트 미리보기
     * @param user 유저 주소
     * @param userNonce 유저 nonce
     * @param record 투표 레코드
     * @return 서명할 다이제스트
     */
    function hashUserSigPreview(
        address user,
        uint256 userNonce,
        VoteRecord calldata record
    ) external view returns (bytes32) {
        _validateStrings(record);
        bytes32 recordHash = _hashVoteRecord(record);
        return _hashUserSig(user, userNonce, recordHash);
    }

    /**
     * @notice 배치 다이제스트 미리보기
     * @param batchNonce 배치 nonce
     * @return 서명할 다이제스트
     */
    function hashBatchPreview(
        uint256 batchNonce
    ) external view returns (bytes32) {
        return _hashBatch(batchNonce);
    }
}
