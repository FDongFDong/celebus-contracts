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
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                           MainVoting 컨트랙트                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  ┌─────────────────────────────────────────────────────────────────────┐    ║
 * ║  │                        전체 데이터 흐름                               │    ║
 * ║  └─────────────────────────────────────────────────────────────────────┘    ║
 * ║                                                                              ║
 * ║  [프론트엔드]                    [백엔드]                    [컨트랙트]       ║
 * ║       │                            │                            │           ║
 * ║       │  1. 유저가 N개 레코드에     │                            │           ║
 * ║       │     1개 서명 생성          │                            │           ║
 * ║       │ ─────────────────────────► │                            │           ║
 * ║       │                            │                            │           ║
 * ║       │                    2. 여러 유저의 배치 수집               │           ║
 * ║       │                            │                            │           ║
 * ║       │                    3. executor 서명 추가                 │           ║
 * ║       │                            │                            │           ║
 * ║       │                            │  submitMultiUserBatch()    │           ║
 * ║       │                            │ ─────────────────────────► │           ║
 * ║       │                            │                            │           ║
 * ║       │                            │                    4. 검증 & 저장      ║
 * ║       │                            │                            │           ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  ┌─────────────────────────────────────────────────────────────────────┐    ║
 * ║  │                    조건부 스킵 패턴 (Soft Fail)                      │    ║
 * ║  └─────────────────────────────────────────────────────────────────────┘    ║
 * ║                                                                              ║
 * ║  10명의 유저가 배치로 제출될 때:                                             ║
 * ║                                                                              ║
 * ║  유저A ✅ 통과  ──┐                                                         ║
 * ║  유저B ❌ 서명오류 │ → UserBatchFailed 이벤트 발생, 스킵                      ║
 * ║  유저C ✅ 통과  ──┼──► 유효한 유저들만 저장                                  ║
 * ║  유저D ❌ nonce  │ → UserBatchFailed 이벤트 발생, 스킵                      ║
 * ║  유저E ✅ 통과  ──┘                                                         ║
 * ║                                                                              ║
 * ║  결과: 유저 A, C, E의 투표만 저장됨                                          ║
 * ║        유저 B, D는 이벤트로 실패 사유 기록                                    ║
 * ║                                                                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  ┌─────────────────────────────────────────────────────────────────────┐    ║
 * ║  │                         보안 특징                                    │    ║
 * ║  └─────────────────────────────────────────────────────────────────────┘    ║
 * ║                                                                              ║
 * ║  • EIP-712 구조화 서명 → 피싱 방지 (사용자가 서명 내용 확인 가능)              ║
 * ║  • Nonce 시스템 → 리플레이 공격 방지 (같은 서명 재사용 불가)                   ║
 * ║  • consumed 맵핑 → 중복 투표 방지 (동일 레코드 재제출 불가)                   ║
 * ║  • Chain ID 검증 → 크로스체인 리플레이 방지                                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */
contract MainVoting is Ownable2Step, EIP712 {
    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                              상수 (Constants)                              ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    /**
     * @dev ERC-1271 서명 검증 성공 시 반환되는 매직 값
     *      스마트 컨트랙트 지갑(Safe, Argent 등)에서 서명 검증 성공을 나타냄
     *      bytes4(keccak256("isValidSignature(bytes32,bytes)"))
     */
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;

    /**
     * @dev 한 트랜잭션에서 처리할 수 있는 최대 투표 레코드 수
     *
     *      ┌────────────────────────────────────────┐
     *      │ 목적:                                   │
     *      │ • 가스 한도 초과 방지                    │
     *      │ • DoS 공격 방지 (대량 데이터 제출)       │
     *      │ • 블록 가스 리밋 내에서 안전하게 처리    │
     *      └────────────────────────────────────────┘
     */
    uint256 public constant MAX_RECORDS_PER_BATCH = 2000;

    /**
     * @dev 한 유저가 하나의 배치에서 제출할 수 있는 최대 레코드 수
     *
     *      예시: 유저가 20개 아티스트에게 각각 투표 가능
     */
    uint16 public constant MAX_RECORDS_PER_USER_BATCH = 20;

    /**
     * @dev userId 등 문자열 필드의 최대 길이
     *      과도한 스토리지 사용 방지
     */
    uint16 public constant MAX_STRING_LENGTH = 100;

    /**
     * @dev 투표 타입의 최대값
     *
     *      ┌─────────────────┐
     *      │ 0 = Forget      │ → 잊기 투표
     *      │ 1 = Remember    │ → 기억하기 투표
     *      └─────────────────┘
     */
    uint8 public constant MAX_VOTE_TYPE = 1;
    uint8 public constant VOTE_TYPE_FORGET = 0;
    uint8 public constant VOTE_TYPE_REMEMBER = 1;

    /**
     * @dev 유저 배치 실패 사유 코드 (UserBatchFailed 이벤트에서 사용)
     *
     *      ┌─────┬─────────────────────────────────────────┐
     *      │ 코드 │ 설명                                    │
     *      ├─────┼─────────────────────────────────────────┤
     *      │  1  │ 레코드 수가 0이거나 20개 초과             │
     *      │  2  │ 유저 서명이 유효하지 않음                 │
     *      │  3  │ nonce가 최소값보다 낮음 (취소된 범위)     │
     *      │  4  │ nonce가 이미 사용됨 (리플레이 시도)       │
     *      │  5  │ voteType이 유효하지 않음 (0,1 외의 값)    │
     *      │  6  │ 허용되지 않은 아티스트에게 투표           │
     *      └─────┴─────────────────────────────────────────┘
     */
    uint8 private constant REASON_USER_BATCH_TOO_LARGE = 1;
    uint8 private constant REASON_INVALID_USER_SIGNATURE = 2;
    uint8 private constant REASON_USER_NONCE_TOO_LOW = 3;
    uint8 private constant REASON_USER_NONCE_ALREADY_USED = 4;
    uint8 private constant REASON_INVALID_VOTE_TYPE = 5;
    uint8 private constant REASON_ARTIST_NOT_ALLOWED = 6;

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                       EIP-712 타입 해시 (Type Hashes)                       ║
    // ╠═══════════════════════════════════════════════════════════════════════════╣
    // ║                                                                           ║
    // ║  EIP-712는 구조화된 데이터 서명 표준입니다.                                  ║
    // ║  사용자가 지갑에서 "무엇에 서명하는지" 명확하게 볼 수 있어 피싱 방지에 효과적   ║
    // ║                                                                           ║
    // ║  서명 구조 (3단계 계층):                                                    ║
    // ║                                                                           ║
    // ║  ┌─────────────────────────────────────────────────────────────────┐      ║
    // ║  │ Level 3: Batch (백엔드 서명)                                     │      ║
    // ║  │   └── batchNonce: 배치 고유 번호                                 │      ║
    // ║  │                                                                 │      ║
    // ║  │ Level 2: UserBatch (유저 서명)                                   │      ║
    // ║  │   ├── user: 유저 지갑 주소                                      │      ║
    // ║  │   ├── userNonce: 유저별 고유 번호                                │      ║
    // ║  │   └── recordsHash: 아래 레코드들의 해시                          │      ║
    // ║  │                                                                 │      ║
    // ║  │ Level 1: VoteRecord[] (개별 투표)                                │      ║
    // ║  │   ├── timestamp, missionId, votingId                           │      ║
    // ║  │   ├── optionId, voteType, votingAmt                            │      ║
    // ║  │   └── user (서명자 주소 포함)                                    │      ║
    // ║  └─────────────────────────────────────────────────────────────────┘      ║
    // ║                                                                           ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    /**
     * @dev 개별 투표 레코드의 EIP-712 타입 해시
     *
     *      중요: user(address)가 해시에 포함됨
     *      → 다른 유저가 동일한 레코드를 재사용하는 것을 방지
     *
     *      참고: userId는 서명 대상에서 제외
     *      → 프론트엔드에서 userId 없이 서명 가능
     *      → 백엔드가 DB에서 userId를 조회하여 주입
     */
    bytes32 private constant VOTE_RECORD_TYPEHASH =
        keccak256(
            "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 optionId,uint8 voteType,uint256 votingAmt,address user)"
        );

    /**
     * @dev 유저 배치의 EIP-712 타입 해시
     *
     *      유저가 자신의 모든 투표 레코드를 하나의 서명으로 승인
     *      recordsHash = keccak256(record1 || record2 || ... || recordN)
     */
    bytes32 private constant USER_BATCH_TYPEHASH =
        keccak256(
            "UserBatch(address user,uint256 userNonce,bytes32 recordsHash)"
        );

    /**
     * @dev 전체 배치의 EIP-712 타입 해시
     *
     *      executorSigner(백엔드)가 여러 유저의 배치를 묶어서 서명
     *      batchNonce로 리플레이 공격 방지
     */
    bytes32 private constant BATCH_TYPEHASH =
        keccak256("Batch(uint256 batchNonce)");

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                          커스텀 에러 (Custom Errors)                        ║
    // ╠═══════════════════════════════════════════════════════════════════════════╣
    // ║  가스 효율적인 에러 처리를 위해 require 대신 custom error 사용                ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    /// @dev 주소가 zero address일 때
    error ZeroAddress();

    /// @dev 서명 검증 실패 (executor 서명에 사용, 유저 서명은 soft fail)
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

    /// @dev 레코드 인덱스가 유효하지 않음 (빈 배치 등)
    error InvalidRecordIndices();

    /// @dev 전체 배치가 MAX_RECORDS_PER_BATCH(2000) 초과
    error BatchTooLarge();

    /// @dev 유저 배치가 MAX_RECORDS_PER_USER_BATCH(20) 초과
    error UserBatchTooLarge();

    /// @dev 문자열이 MAX_STRING_LENGTH(100) 초과
    error StringTooLong();

    /// @dev 호출자가 owner도 executorSigner도 아님
    error NotOwnerOrExecutor();

    /// @dev 해당 missionId/optionId의 아티스트가 허용되지 않음
    error ArtistNotAllowed(uint256 missionId, uint256 optionId);

    /// @dev 투표 타입이 유효하지 않음 (0,1 외의 값)
    error InvalidVoteType(uint8 value);

    /// @dev 조건부 스킵 후, 유효한 유저/레코드가 하나도 없을 때
    error NoSuccessfulUser();

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                            구조체 (Structs)                                ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    /**
     * @dev 개별 투표 레코드
     *
     *      ┌────────────────────────────────────────────────────────┐
     *      │ 필드          │ 설명                                   │
     *      ├────────────────────────────────────────────────────────┤
     *      │ timestamp    │ 투표 생성 시간 (오프체인에서 설정)       │
     *      │ missionId    │ 미션(캠페인) ID                         │
     *      │ votingId     │ 투표 세션 ID (같은 미션 내 여러 투표)    │
     *      │ optionId     │ 투표 대상 아티스트 ID                   │
     *      │ voteType     │ 0=Forget, 1=Remember                   │
     *      │ userId       │ 오프체인 시스템의 유저 ID               │
     *      │ votingAmt    │ 투표 수량 (가중치)                      │
     *      └────────────────────────────────────────────────────────┘
     */
    struct VoteRecord {
        uint256 timestamp;
        uint256 missionId;
        uint256 votingId;
        uint256 optionId;
        uint8 voteType;
        string userId;
        uint256 votingAmt;
    }

    /**
     * @dev 유저의 배치 서명 정보
     *
     *      유저가 N개의 레코드를 1개의 서명으로 승인할 때 사용
     */
    struct UserBatchSig {
        address user; // 유저 지갑 주소
        uint256 userNonce; // 리플레이 방지용 nonce
        bytes signature; // EIP-712 서명
    }

    /**
     * @dev 한 유저의 투표 배치
     *
     *      records[]와 userBatchSig를 묶어서 전달
     */
    struct UserVoteBatch {
        VoteRecord[] records; // 유저의 투표 레코드 배열
        UserBatchSig userBatchSig; // 유저 서명 정보
    }

    /**
     * @dev 투표 조회용 요약 구조체
     *
     *      getVoteSummariesByMissionVotingId()에서 반환
     *      optionId 대신 아티스트 이름, voteType 대신 라벨 반환
     */
    struct VoteRecordSummary {
        uint256 timestamp;
        uint256 missionId;
        uint256 votingId;
        string userId;
        string votingFor; // 아티스트 이름
        string votedOn; // "Forget" 또는 "Remember"
        uint256 votingAmt;
    }

    /**
     * @dev 아티스트별 투표 집계
     */
    struct ArtistStats {
        uint256 remember; // Remember 투표 합계
        uint256 forget; // Forget 투표 합계
        uint256 total; // 전체 투표 합계
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                         상태 변수 (State Variables)                        ║
    // ╠═══════════════════════════════════════════════════════════════════════════╣
    // ║                                                                           ║
    // ║  ┌─────────────────────────────────────────────────────────────────┐      ║
    // ║  │                    스토리지 구조 다이어그램                       │      ║
    // ║  └─────────────────────────────────────────────────────────────────┘      ║
    // ║                                                                           ║
    // ║  votes[recordDigest] ──────────────────► VoteRecord                       ║
    // ║                                                                           ║
    // ║  voteHashesByMissionVotingId[missionId][votingId] ──► bytes32[]           ║
    // ║                                                                           ║
    // ║  userNonceUsed[user][nonce] ───────────► bool (사용 여부)                  ║
    // ║                                                                           ║
    // ║  minUserNonce[user] ───────────────────► uint256 (최소 유효 nonce)         ║
    // ║                                                                           ║
    // ║  consumed[user][recordDigest] ─────────► bool (중복 투표 방지)             ║
    // ║                                                                           ║
    // ║  artistStats[missionId][optionId] ─────► ArtistStats                      ║
    // ║                                                                           ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    /// @dev 투표 레코드 저장소 (recordDigest → VoteRecord)
    mapping(bytes32 => VoteRecord) public votes;

    /// @dev 미션/투표별 레코드 해시 목록 (조회용)
    mapping(uint256 => mapping(uint256 => bytes32[]))
        private voteHashesByMissionVotingId;

    /// @dev 유저별 nonce 사용 여부 (리플레이 방지)
    mapping(address => mapping(uint256 => bool)) public userNonceUsed;

    /// @dev 유저별 최소 유효 nonce (이 값 미만은 모두 무효 처리)
    mapping(address => uint256) public minUserNonce;

    /// @dev 백엔드(executorSigner)별 배치 nonce 사용 여부
    mapping(address => mapping(uint256 => bool)) public batchNonceUsed;

    /// @dev 백엔드별 최소 유효 배치 nonce
    mapping(address => uint256) public minBatchNonce;

    /// @dev 유저별 레코드 소비 여부 (중복 투표 방지)
    ///      consumed[user][recordDigest] = true면 이미 처리됨
    mapping(address => mapping(bytes32 => bool)) public consumed;

    /// @dev 배포 시 체인 ID (크로스체인 리플레이 방지)
    uint256 public immutable CHAIN_ID;

    /// @dev 백엔드 서명자 주소
    ///      이 주소만 submitMultiUserBatch 호출 가능 (서명 검증)
    address public executorSigner;

    /// @dev 아티스트 이름 매핑 (조회용)
    mapping(uint256 => mapping(uint256 => string)) public artistName;

    /// @dev 허용된 아티스트 매핑 (투표 가능 여부)
    mapping(uint256 => mapping(uint256 => bool)) public allowedArtist;

    /// @dev 투표 타입 이름 (0 → "Forget", 1 → "Remember")
    mapping(uint8 => string) public voteTypeName;

    /// @dev 아티스트별 투표 통계
    mapping(uint256 => mapping(uint256 => ArtistStats)) public artistStats;

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                              이벤트 (Events)                               ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    /// @dev executorSigner가 변경되었을 때
    event ExecutorSignerChanged(
        address indexed oldSigner,
        address indexed newSigner,
        uint256 oldMinNonce
    );

    /// @dev 유저 배치가 성공적으로 처리되었을 때 (soft fail 통과)
    event UserBatchProcessed(
        bytes32 indexed batchDigest,
        address indexed user,
        uint256 userNonce,
        uint256 recordCount
    );

    /**
     * @dev 유저 배치 처리 실패 (soft fail, 조건부 스킵)
     *
     *      이 이벤트가 발생해도 트랜잭션은 계속 진행됨
     *      다른 유저들의 투표는 정상 처리됨
     */
    event UserBatchFailed(
        bytes32 indexed batchDigest,
        address indexed user,
        uint256 userNonce,
        uint8 reasonCode // 위의 REASON_* 상수 참조
    );

    /// @dev 전체 배치가 완료되었을 때
    event BatchProcessed(
        bytes32 indexed batchDigest,
        address indexed executorSigner,
        uint256 batchNonce,
        uint256 recordCount, // 실제 저장된 레코드 수
        uint256 userCount, // 전체 유저 수
        uint256 failedUserCount // 실패한 유저 수
    );

    /// @dev 유저 nonce 일괄 취소
    event CancelUserNonceUpTo(address indexed user, uint256 newMinUserNonce);

    /// @dev 배치 nonce 일괄 취소
    event CancelBatchNonceUpTo(
        address indexed executorSigner,
        uint256 newMinBatchNonce
    );

    /// @dev 아티스트 설정 변경
    event ArtistSet(
        uint256 indexed missionId,
        uint256 indexed optionId,
        string name,
        bool allowed
    );

    /// @dev 투표 타입 이름 설정
    event VoteTypeSet(uint8 indexed voteType, string name);

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                    생성자 및 관리자 함수 (Constructor & Admin)              ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    /**
     * @dev 컨트랙트 생성자
     *
     *      EIP712 도메인: name="MainVoting", version="1"
     *      Ownable2Step: 2단계 소유권 이전 (실수 방지)
     */
    constructor(
        address initialOwner
    ) EIP712("MainVoting", "1") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        // 배포 시 체인 ID 저장 (크로스체인 리플레이 방지)
        CHAIN_ID = block.chainid;
    }

    /**
     * @dev executorSigner(백엔드 서명자) 설정
     *
     *      ┌─────────────────────────────────────────────────────────┐
     *      │ 동작:                                                   │
     *      │ 1. 기존 signer의 minBatchNonce를 max로 설정 (무효화)    │
     *      │ 2. 새 signer의 minBatchNonce를 0으로 초기화             │
     *      │ 3. executorSigner 주소 업데이트                         │
     *      └─────────────────────────────────────────────────────────┘
     */
    function setExecutorSigner(address s) external onlyOwner {
        if (s == address(0)) revert ZeroAddress();

        address oldSigner = executorSigner;
        uint256 oldMinNonce = minBatchNonce[oldSigner];

        // 기존 signer가 있다면 모든 nonce 무효화
        if (oldSigner != address(0)) {
            minBatchNonce[oldSigner] = type(uint256).max;
        }

        // 새 signer 설정
        minBatchNonce[s] = 0;
        executorSigner = s;

        emit ExecutorSignerChanged(oldSigner, s, oldMinNonce);
    }

    /**
     * @dev 아티스트 설정 (투표 대상)
     *
     *      @param missionId 미션 ID
     *      @param optionId 아티스트 ID
     *      @param name 아티스트 이름
     *      @param allowed_ 투표 허용 여부
     */
    function setArtist(
        uint256 missionId,
        uint256 optionId,
        string calldata name,
        bool allowed_
    ) external onlyOwner {
        artistName[missionId][optionId] = name;
        allowedArtist[missionId][optionId] = allowed_;
        emit ArtistSet(missionId, optionId, name, allowed_);
    }

    /**
     * @dev 투표 타입 이름 설정
     *
     *      예: setVoteTypeName(0, "Forget")
     *          setVoteTypeName(1, "Remember")
     */
    function setVoteTypeName(
        uint8 voteType,
        string calldata name
    ) external onlyOwner {
        if (voteType > MAX_VOTE_TYPE) revert InvalidVoteType(voteType);
        voteTypeName[voteType] = name;
        emit VoteTypeSet(voteType, name);
    }

    /**
     * @dev 특정 유저의 nonce를 일괄 취소
     *
     *      용도: 유저가 서명한 투표를 제출 전에 취소하고 싶을 때
     *      newMinUserNonce 미만의 모든 nonce가 무효화됨
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
     *
     *      owner 또는 executorSigner가 호출 가능
     *      용도: 서명된 배치를 제출 전에 취소
     */
    function cancelAllBatchNonceUpTo(uint256 newMinBatchNonce) external {
        if (msg.sender != owner() && msg.sender != executorSigner)
            revert NotOwnerOrExecutor();
        if (newMinBatchNonce <= minBatchNonce[executorSigner])
            revert BatchNonceTooLow();
        minBatchNonce[executorSigner] = newMinBatchNonce;
        emit CancelBatchNonceUpTo(executorSigner, newMinBatchNonce);
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                     내부 함수: 해시 로직 (Hash Logic)                       ║
    // ╠═══════════════════════════════════════════════════════════════════════════╣
    // ║                                                                           ║
    // ║  해시 계산 흐름:                                                           ║
    // ║                                                                           ║
    // ║  VoteRecord ──► _hashVoteRecord() ──► recordDigest                        ║
    // ║       │                                    │                              ║
    // ║       │                                    ▼                              ║
    // ║       │              keccak256(recordDigest1 || recordDigest2 || ...)     ║
    // ║       │                                    │                              ║
    // ║       │                                    ▼                              ║
    // ║       └────────────────────► _hashUserBatch() ──► userBatchDigest         ║
    // ║                                                        │                  ║
    // ║                              _hashBatch() ──► batchDigest                 ║
    // ║                                                                           ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    /**
     * @dev 개별 투표 레코드의 해시 계산
     *
     *      중요: user 주소가 해시에 포함됨
     *      → 다른 유저가 같은 레코드를 재사용 불가
     *      → userId는 서명 대상에서 제외 (백엔드가 주입)
     */
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
                    record.optionId,
                    record.voteType,
                    record.votingAmt,
                    user
                )
            );
    }

    /**
     * @dev 유저 배치의 EIP-712 다이제스트 계산
     *
     *      recordsHash = keccak256(abi.encodePacked(recordDigest1, recordDigest2, ...))
     */
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

    /**
     * @dev 전체 배치의 EIP-712 다이제스트 계산
     *
     *      executorSigner가 이 값에 서명함
     */
    function _hashBatch(uint256 batchNonce) internal view returns (bytes32) {
        return
            _hashTypedDataV4(keccak256(abi.encode(BATCH_TYPEHASH, batchNonce)));
    }

    /**
     * @dev 서명 검증 (EOA + 스마트 컨트랙트 지갑 지원)
     *
     *      ┌─────────────────────────────────────────────────────────┐
     *      │ EOA (일반 지갑):                                        │
     *      │   ECDSA.recover()로 서명자 주소 복원 후 비교             │
     *      │                                                        │
     *      │ 스마트 컨트랙트 지갑 (Safe, Argent 등):                  │
     *      │   ERC-1271 표준의 isValidSignature() 호출               │
     *      │   매직 값 0x1626ba7e 반환 시 유효                        │
     *      └─────────────────────────────────────────────────────────┘
     */
    function _isValidSig(
        address signer,
        bytes32 digest,
        bytes calldata sig
    ) internal view returns (bool) {
        // EOA인 경우 (코드가 없음)
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

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                내부 함수: 검증/처리 로직 (Validation & Processing)          ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    /**
     * @dev 배치 nonce 소비 (사용 처리)
     *
     *      호출 시점: 모든 유저 검증이 완료된 후
     *      실패 시: hard revert (배치 전체 무효)
     */
    function _consumeBatchNonce(address signer, uint256 nonce_) internal {
        if (nonce_ < minBatchNonce[signer]) revert BatchNonceTooLow();
        if (batchNonceUsed[signer][nonce_]) revert BatchNonceAlreadyUsed();
        batchNonceUsed[signer][nonce_] = true;
    }

    /**
     * @dev 문자열 길이 검증 (userId)
     *
     *      100자 초과 시 전체 배치 revert (데이터 품질 보장)
     */
    function _validateStrings(VoteRecord calldata record) internal pure {
        if (bytes(record.userId).length > MAX_STRING_LENGTH)
            revert StringTooLong();
    }

    /**
     * @dev 유저의 모든 레코드 해시 계산
     *
     *      ┌─────────────────────────────────────────────────────────┐
     *      │ 동작:                                                   │
     *      │ 1. 각 레코드의 userId 길이 검증 (hard fail)             │
     *      │ 2. 각 레코드의 해시 계산                                 │
     *      │ 3. 해시 배열 반환                                        │
     *      └─────────────────────────────────────────────────────────┘
     */
    function _buildRecordDigestsForUser(
        VoteRecord[] calldata records,
        address user
    ) internal pure returns (bytes32[] memory recordDigests) {
        uint256 len = records.length;
        recordDigests = new bytes32[](len);

        for (uint256 j; j < len; ) {
            // userId 길이 초과는 전체 배치를 하드 실패로 처리
            _validateStrings(records[j]);
            recordDigests[j] = _hashVoteRecord(records[j], user);
            unchecked {
                ++j;
            }
        }
    }

    /**
     * @dev 유저 배치 soft 검증 (조건부 스킵 패턴의 핵심)
     *
     *      ╔═══════════════════════════════════════════════════════════════╗
     *      ║                    검증 순서 (5단계)                           ║
     *      ╠═══════════════════════════════════════════════════════════════╣
     *      ║                                                               ║
     *      ║  1. 레코드 수 검증 ──► 0개 또는 20개 초과 시 실패              ║
     *      ║         │                                                    ║
     *      ║         ▼                                                    ║
     *      ║  2. 레코드 내용 검증 ──► voteType, allowedArtist 체크         ║
     *      ║         │                                                    ║
     *      ║         ▼                                                    ║
     *      ║  3. 해시 계산 ──► recordsHash 생성                            ║
     *      ║         │                                                    ║
     *      ║         ▼                                                    ║
     *      ║  4. 서명 검증 ──► 유저 서명이 유효한지 확인                    ║
     *      ║         │                                                    ║
     *      ║         ▼                                                    ║
     *      ║  5. Nonce 검증 ──► 사용 가능한 nonce인지 확인                  ║
     *      ║         │                                                    ║
     *      ║         ▼                                                    ║
     *      ║     ✅ 성공: nonce 소비 + UserBatchProcessed 이벤트           ║
     *      ║     ❌ 실패: UserBatchFailed 이벤트 + return false            ║
     *      ║                                                               ║
     *      ╚═══════════════════════════════════════════════════════════════╝
     *
     *      중요: 실패해도 revert하지 않고 false 반환 (soft fail)
     *            → 다른 유저들의 투표는 계속 처리됨
     */
    function _verifyUserBatchSignatureSoft(
        UserVoteBatch calldata batch,
        bytes32[] memory userRecordDigests,
        bytes32 batchDigest
    ) internal returns (bool ok) {
        uint256 count = batch.records.length;
        UserBatchSig calldata userSig = batch.userBatchSig;
        address user = userSig.user;
        uint256 nonce_ = userSig.userNonce;

        // ═══════════════════════════════════════════════════════════════
        // STEP 1: 레코드 수 검증
        // ═══════════════════════════════════════════════════════════════
        if (count == 0 || count > MAX_RECORDS_PER_USER_BATCH) {
            emit UserBatchFailed(
                batchDigest,
                user,
                nonce_,
                REASON_USER_BATCH_TOO_LARGE
            );
            return false;
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 2: 레코드 내용 사전 검증
        // ═══════════════════════════════════════════════════════════════
        // 레코드 중 하나라도 문제가 있으면 해당 유저 전체 스킵
        // (유저가 N개 레코드에 1개 서명 → 부분 처리 불가)
        for (uint256 j; j < count; ) {
            VoteRecord calldata record = batch.records[j];

            // voteType 범위 검증 (0 또는 1만 허용)
            if (record.voteType > MAX_VOTE_TYPE) {
                emit UserBatchFailed(
                    batchDigest,
                    user,
                    nonce_,
                    REASON_INVALID_VOTE_TYPE
                );
                return false;
            }

            // 허용된 아티스트인지 검증
            if (!allowedArtist[record.missionId][record.optionId]) {
                emit UserBatchFailed(
                    batchDigest,
                    user,
                    nonce_,
                    REASON_ARTIST_NOT_ALLOWED
                );
                return false;
            }

            unchecked {
                ++j;
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 3: 레코드 해시 합산
        // ═══════════════════════════════════════════════════════════════
        bytes32 recordsHash = keccak256(abi.encodePacked(userRecordDigests));
        bytes32 userBatchDigest = _hashUserBatch(user, nonce_, recordsHash);

        // ═══════════════════════════════════════════════════════════════
        // STEP 4: 서명 검증
        // ═══════════════════════════════════════════════════════════════
        if (!_isValidSig(user, userBatchDigest, userSig.signature)) {
            emit UserBatchFailed(
                batchDigest,
                user,
                nonce_,
                REASON_INVALID_USER_SIGNATURE
            );
            return false;
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 5: Nonce 검증
        // ═══════════════════════════════════════════════════════════════
        // 5a. 최소 nonce 미만인지 (취소된 범위)
        if (nonce_ < minUserNonce[user]) {
            emit UserBatchFailed(
                batchDigest,
                user,
                nonce_,
                REASON_USER_NONCE_TOO_LOW
            );
            return false;
        }

        // 5b. 이미 사용된 nonce인지 (리플레이 방지)
        if (userNonceUsed[user][nonce_]) {
            emit UserBatchFailed(
                batchDigest,
                user,
                nonce_,
                REASON_USER_NONCE_ALREADY_USED
            );
            return false;
        }

        // ═══════════════════════════════════════════════════════════════
        // 모든 검증 통과 → nonce 소비 및 성공 이벤트
        // ═══════════════════════════════════════════════════════════════
        userNonceUsed[user][nonce_] = true;
        emit UserBatchProcessed(batchDigest, user, nonce_, count);

        return true;
    }

    /**
     * @dev 투표 레코드들을 스토리지에 저장
     *
     *      ┌─────────────────────────────────────────────────────────┐
     *      │ 전제조건:                                                │
     *      │ • voteType, allowedArtist 검증은 이미 완료               │
     *      │ • userOk[i] == true인 유저만 처리                        │
     *      │                                                         │
     *      │ 추가 필터링:                                             │
     *      │ • votingAmt == 0 → 스킵 (의미 없는 투표)                 │
     *      │ • consumed[user][recordDigest] == true → 스킵 (중복)     │
     *      └─────────────────────────────────────────────────────────┘
     */
    function _storeVoteRecords(
        UserVoteBatch[] calldata batches,
        bytes32[][] memory recordDigests,
        bool[] memory userOk
    ) internal returns (uint256 storedCount) {
        uint256 userCount = batches.length;

        // 각 유저별로 처리
        for (uint256 i; i < userCount; ) {
            // 검증 실패한 유저는 스킵
            if (!userOk[i]) {
                unchecked {
                    ++i;
                }
                continue;
            }

            address user = batches[i].userBatchSig.user;
            VoteRecord[] calldata userRecords = batches[i].records;
            uint256 userRecordLen = userRecords.length;

            // 유저의 각 레코드 처리
            for (uint256 j; j < userRecordLen; ) {
                VoteRecord calldata record = userRecords[j];
                bytes32 recordDigest = recordDigests[i][j];

                // ─────────────────────────────────────────────────────
                // 필터링: 0 투표 또는 이미 처리된 레코드는 스킵
                // ─────────────────────────────────────────────────────
                if (record.votingAmt == 0 || consumed[user][recordDigest]) {
                    unchecked {
                        ++j;
                    }
                    continue;
                }

                // ─────────────────────────────────────────────────────
                // 스토리지 저장
                // ─────────────────────────────────────────────────────
                // 1. 중복 방지 마킹
                consumed[user][recordDigest] = true;

                // 2. 투표 레코드 저장
                votes[recordDigest] = record;

                // 3. 조회용 인덱스에 추가
                voteHashesByMissionVotingId[record.missionId][record.votingId]
                    .push(recordDigest);

                // 4. 아티스트 통계 업데이트
                ArtistStats storage stats = artistStats[record.missionId][
                    record.optionId
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

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                       메인 진입점 (Main Entry Point)                       ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    /**
     * @notice 여러 유저의 투표 배치를 한 번에 제출
     *
     * ╔═════════════════════════════════════════════════════════════════════════╗
     * ║                         전체 처리 흐름                                   ║
     * ╠═════════════════════════════════════════════════════════════════════════╣
     * ║                                                                         ║
     * ║  ┌─────────────────────────────────────────────────────────────────┐   ║
     * ║  │ PHASE 1: 글로벌 검증 (실패 시 전체 revert)                       │   ║
     * ║  │   • 빈 배치 체크                                                 │   ║
     * ║  │   • 레코드 수 제한 (2000개)                                      │   ║
     * ║  │   • executorSigner 설정 여부                                     │   ║
     * ║  │   • Chain ID 일치 여부                                           │   ║
     * ║  │   • executor 서명 검증                                           │   ║
     * ║  └─────────────────────────────────────────────────────────────────┘   ║
     * ║                              │                                         ║
     * ║                              ▼                                         ║
     * ║  ┌─────────────────────────────────────────────────────────────────┐   ║
     * ║  │ PHASE 2: 유저별 soft 검증 (실패 시 해당 유저만 스킵)             │   ║
     * ║  │   • userId 길이 검증 (hard fail - 데이터 품질)                   │   ║
     * ║  │   • 레코드 해시 계산                                             │   ║
     * ║  │   • 레코드 내용 검증 (voteType, allowedArtist)                   │   ║
     * ║  │   • 서명 검증                                                    │   ║
     * ║  │   • Nonce 검증                                                   │   ║
     * ║  │   • 실패 시 UserBatchFailed 이벤트 + 스킵                        │   ║
     * ║  └─────────────────────────────────────────────────────────────────┘   ║
     * ║                              │                                         ║
     * ║                              ▼                                         ║
     * ║  ┌─────────────────────────────────────────────────────────────────┐   ║
     * ║  │ PHASE 3: 최종 검증                                               │   ║
     * ║  │   • 유효한 유저가 0명이면 revert                                  │   ║
     * ║  │   • 배치 nonce 소비                                              │   ║
     * ║  └─────────────────────────────────────────────────────────────────┘   ║
     * ║                              │                                         ║
     * ║                              ▼                                         ║
     * ║  ┌─────────────────────────────────────────────────────────────────┐   ║
     * ║  │ PHASE 4: 스토리지 저장                                           │   ║
     * ║  │   • 유효한 유저들의 레코드만 저장                                  │   ║
     * ║  │   • votingAmt=0, 중복 레코드 스킵                                 │   ║
     * ║  │   • 저장된 레코드가 0개면 revert                                  │   ║
     * ║  └─────────────────────────────────────────────────────────────────┘   ║
     * ║                              │                                         ║
     * ║                              ▼                                         ║
     * ║  ┌─────────────────────────────────────────────────────────────────┐   ║
     * ║  │ PHASE 5: 완료                                                    │   ║
     * ║  │   • BatchProcessed 이벤트 발생                                   │   ║
     * ║  └─────────────────────────────────────────────────────────────────┘   ║
     * ║                                                                         ║
     * ╚═════════════════════════════════════════════════════════════════════════╝
     *
     * @param batches 유저별 투표 배치 배열
     * @param batchNonce 이 배치의 고유 nonce (리플레이 방지)
     * @param executorSig executorSigner의 서명
     */
    function submitMultiUserBatch(
        UserVoteBatch[] calldata batches,
        uint256 batchNonce,
        bytes calldata executorSig
    ) external {
        // 서명 개수
        uint256 userCount = batches.length;

        // ═══════════════════════════════════════════════════════════════
        // PHASE 1: 글로벌 검증 (hard fail)
        // ═══════════════════════════════════════════════════════════════

        // 빈 배치(서명) 체크
        if (userCount == 0) revert InvalidRecordIndices();

        // 전체 레코드 수 제한 (2000개)
        uint256 totalRecords;
        for (uint256 i; i < userCount; ) {
            // 각 배치를 순회하며 레코드 수를 합산
            totalRecords += batches[i].records.length;
            unchecked {
                ++i;
            }
        }
        // 전체 레코드 수 제한 (2000개) 초과 시 에러
        if (totalRecords > MAX_RECORDS_PER_BATCH) revert BatchTooLarge();

        // executorSigner 설정 여부
        if (executorSigner == address(0)) revert ZeroAddress();

        // Chain ID 검증 (크로스체인 리플레이 방지)
        if (block.chainid != CHAIN_ID) revert BadChain();

        // executor 서명 검증
        bytes32 batchDigest = _hashBatch(batchNonce);
        // 검증을 위한 배치 다이제스트 생성
        // executorSigner가 제출한 서명과 비교하기 위해 생성
        if (!_isValidSig(executorSigner, batchDigest, executorSig))
            revert InvalidSignature();

        // ═══════════════════════════════════════════════════════════════
        // PHASE 2: 유저별 soft 검증
        // ═══════════════════════════════════════════════════════════════

        // 결과 저장용 배열
        bytes32[][] memory recordDigests = new bytes32[][](userCount);
        bool[] memory userOk = new bool[](userCount);
        uint256 successUserCount;

        for (uint256 i; i < userCount; ) {
            address user = batches[i].userBatchSig.user;

            // 2a. 레코드 해시 계산 (userId 길이 초과 시 전체 revert)
            recordDigests[i] = _buildRecordDigestsForUser(
                batches[i].records,
                user
            );

            // 2b. soft 검증 (실패해도 계속 진행)
            bool ok = _verifyUserBatchSignatureSoft(
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

            unchecked {
                ++i;
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // PHASE 3: 최종 검증
        // ═══════════════════════════════════════════════════════════════

        // 모든 유저가 실패했다면 배치 자체를 실패 처리
        if (successUserCount == 0) {
            revert NoSuccessfulUser();
        }

        // 배치 nonce 소비 (이제 이 배치는 재사용 불가)
        _consumeBatchNonce(executorSigner, batchNonce);

        // ═══════════════════════════════════════════════════════════════
        // PHASE 4: 스토리지 저장
        // ═══════════════════════════════════════════════════════════════

        uint256 stored = _storeVoteRecords(batches, recordDigests, userOk);

        // 저장된 레코드가 0개면 실패
        // (모두 votingAmt=0 또는 이미 consumed인 경우)
        if (stored == 0) {
            revert NoSuccessfulUser();
        }

        // ═══════════════════════════════════════════════════════════════
        // PHASE 5: 완료 이벤트
        // ═══════════════════════════════════════════════════════════════

        uint256 failedUserCount = userCount - successUserCount;

        emit BatchProcessed(
            batchDigest,
            executorSigner,
            batchNonce,
            stored, // 실제 저장된 레코드 수
            userCount, // 전체 유저 수
            failedUserCount // 실패한 유저 수
        );
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                          조회 함수 (View Functions)                        ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    /**
     * @dev EIP-712 도메인 구분자 반환
     *
     *      프론트엔드에서 서명 생성 시 필요
     */
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @dev 특정 미션/투표의 모든 투표 기록 조회
     *
     *      @param missionId 미션 ID
     *      @param votingId 투표 세션 ID
     *      @return 투표 요약 정보 배열
     *
     *      주의: 대량의 데이터가 있는 경우 가스 비용이 높을 수 있음
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

            // optionId → 아티스트 이름으로 변환
            string memory artist = artistName[record.missionId][
                record.optionId
            ];

            // voteType → 라벨로 변환 ("Forget" 또는 "Remember")
            string memory voteTypeLabel = voteTypeName[record.voteType];

            result[i] = VoteRecordSummary({
                timestamp: record.timestamp,
                missionId: record.missionId,
                votingId: record.votingId,
                userId: record.userId,
                votingFor: artist,
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
     * @dev 특정 아티스트의 투표 집계 조회
     *
     *      @param missionId 미션 ID
     *      @param optionId 아티스트 ID
     *      @return remember Remember 투표 합계
     *      @return forget Forget 투표 합계
     *      @return total 전체 투표 합계
     */
    function getArtistAggregates(
        uint256 missionId,
        uint256 optionId
    ) external view returns (uint256 remember, uint256 forget, uint256 total) {
        ArtistStats storage s = artistStats[missionId][optionId];
        return (s.remember, s.forget, s.total);
    }
}
