// SPDX-License-Identifier: MIT
// 라이센스: MIT 오픈소스 라이센스 (자유롭게 사용, 수정, 배포 가능)
pragma solidity ^0.8.20;

// ========================================
// 외부 라이브러리 임포트
// ========================================
// ECDSA: 타원곡선 전자서명 알고리즘 (EOA 서명 검증용)
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
// EIP712: 구조화된 데이터 서명 표준 (사람이 읽을 수 있는 서명)
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
// Ownable2Step: 2단계 소유권 이전 (안전한 소유권 관리)
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
// Ownable: 기본 소유권 관리
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// ========================================
// ERC-1271: 스마트 컨트랙트 서명 검증 표준
// ========================================
// 목적: 스마트 컨트랙트 지갑(Account Abstraction)도 서명할 수 있도록 지원
// 예시: Gnosis Safe, Argent 등의 멀티시그 지갑
interface IERC1271 {
    // 매직 값: 0x1626ba7e (유효한 서명일 때 반환)
    function isValidSignature(
        bytes32 hash, // 서명할 메시지 해시
        bytes calldata signature // 서명 데이터
    ) external view returns (bytes4); // 매직 값 또는 0x00000000
}

/**
 * @title MainVoting - 투표 시스템
 * @notice 여러 사용자의 투표를 배치 방식으로 처리하는 컨트랙트
 * @dev 동작 방식:
 *      1. 사용자는 자신의 투표 레코드에 서명
 *      2. 실행자(백엔드)는 배치 전체에 대해 승인 서명
 *      3. 컨트랙트에서 모든 서명과 데이터를 검증 후 저장
 *
 *      주요 기능:
 *      - 이중 서명 검증: 사용자 서명 + 실행자 서명
 *      - Nonce 시스템: 동일한 서명 재사용 방지
 *      - 배치 처리: 여러 투표를 한 트랜잭션에서 처리
 *      - 실시간 통계: 후보별 득표 현황 자동 집계
 */
contract MainVoting is Ownable2Step, EIP712 {
    // ========================================
    // 상수 정의 (Constants)
    // ========================================

    // ERC-1271 매직 값: 스마트 컨트랙트 서명 검증 시 반환되는 값
    // 값: bytes4(keccak256("isValidSignature(bytes32,bytes)"))
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;

    // === 배치 크기 제한 (DoS 공격 방지) ===

    // 한 트랜잭션에 포함 가능한 최대 투표 레코드 수
    uint256 public constant MAX_RECORDS_PER_BATCH = 5000;

    // 한 사용자가 한 배치에서 서명할 수 있는 최대 레코드 수
    uint16 public constant MAX_RECORDS_PER_USER_BATCH = 20;

    // 문자열 필드(userId 등)의 최대 길이 (bytes 단위)
    // 이유: 가스 폭탄 공격 방지 (문자열 길이 무제한 시 가스 소모 급증)
    uint16 public constant MAX_STRING_LENGTH = 100;

    // === 투표 타입 정의 ===

    // 최대 투표 타입 값 (0 또는 1만 허용)
    uint8 public constant MAX_VOTE_TYPE = 1;

    // 투표 타입: Forget (아티스트를 잊기 위한 투표)
    uint8 public constant VOTE_TYPE_FORGET = 0;

    // 투표 타입: Remember (아티스트를 기억하기 위한 투표)
    uint8 public constant VOTE_TYPE_REMEMBER = 1;

    // ========================================
    // EIP-712 타입 해시 (Type Hashes)
    // ========================================
    // 목적: 구조화된 데이터 서명을 위한 타입 정의
    // EIP-712: 사람이 읽을 수 있는 형태로 서명 데이터를 표시하는 표준

    // === 1. VoteRecord 타입 해시 ===
    // 역할: 개별 투표 레코드의 구조를 정의
    // 동작: 사용자가 투표할 때 이 구조로 서명을 생성
    // 참고: userId는 서명 시 해시로 변환 (keccak256), 저장 시 원본 문자열 사용
    bytes32 private constant VOTE_RECORD_TYPEHASH =
        keccak256(
            "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,bytes32 userIdHash,uint256 candidateId,uint8 voteType,uint256 votingAmt)"
        );

    // === 2. UserBatch 타입 해시 ===
    // 역할: 사용자가 자신의 여러 투표를 묶어서 서명할 때 사용
    // 동작: recordsHash = 사용자의 모든 투표 레코드 해시를 연결한 해시
    // 목적: 사용자가 서명한 투표만 제출되었는지 검증
    bytes32 private constant USER_BATCH_TYPEHASH =
        keccak256(
            "UserBatch(address user,uint256 userNonce,bytes32 recordsHash)"
        );

    // === 3. Batch 타입 해시 (실행자 서명용) ===
    // 역할: 실행자(백엔드)가 배치 전체를 승인할 때 사용
    // 동작: batchNonce만 서명하여 배치 실행 권한 부여
    // 장점: 서명 생성이 간단하고 빠름
    bytes32 private constant BATCH_TYPEHASH =
        keccak256("Batch(uint256 batchNonce)");

    // ========================================
    // 커스텀 에러 (Custom Errors)
    // ========================================
    // 목적: 가스 최적화 (revert string 대비 ~99% 절감)
    // Solidity 0.8.4+: Custom error는 4바이트 선택자만 저장

    // === 보안 관련 에러 ===

    // 제로 주소 사용 시도 (executorSigner, userAddress 등)
    // 발생: 초기화 시 또는 주소 변경 시 address(0) 감지
    error ZeroAddress();

    // 서명 검증 실패 (EOA 또는 ERC-1271)
    // 발생: 사용자 서명 또는 백엔드 서명이 유효하지 않을 때
    error InvalidSignature();

    // 체인 ID 불일치 (Replay 공격 방지)
    // 발생: 배포된 체인이 아닌 다른 체인에서 트랜잭션 실행 시도
    error BadChain();

    // === Nonce 관련 에러 (재사용 공격 방지) ===

    // 사용자 nonce 이미 사용됨
    // 발생: 동일한 userNonce로 두 번 서명 시도
    error UserNonceAlreadyUsed();

    // 사용자 nonce가 minUserNonce보다 낮음
    // 발생: 취소된 nonce 범위 내의 nonce 사용 시도
    error UserNonceTooLow();

    // 배치 nonce 이미 사용됨
    // 발생: 동일한 batchNonce로 두 번 제출 시도
    error BatchNonceAlreadyUsed();

    // 배치 nonce가 minBatchNonce보다 낮음
    // 발생: executorSigner 변경 후 구 서명자의 nonce 사용 시도
    error BatchNonceTooLow();

    // === 데이터 검증 에러 ===

    // 레코드 인덱스가 범위를 벗어남
    // 발생: UserBatchSig.recordIndices에 유효하지 않은 인덱스 포함
    error InvalidRecordIndices();

    // 배치 크기 초과 (전체)
    // 발생: records.length > MAX_RECORDS_PER_BATCH
    error BatchTooLarge();

    // 사용자 배치 크기 초과
    // 발생: UserBatchSig.recordIndices.length > MAX_RECORDS_PER_USER_BATCH
    error UserBatchTooLarge();

    // 문자열 길이 초과 (가스 공격 방지)
    // 발생: userId 등의 길이가 MAX_STRING_LENGTH 초과
    error StringTooLong();

    // Owner 또는 Executor가 아님
    // 발생: cancelAllBatchNonceUpTo 호출 시 권한 부족
    error NotOwnerOrExecutor();

    // === 비즈니스 로직 에러 ===

    // 커버리지 누락 (레코드가 어떤 사용자 서명에도 포함되지 않음)
    // 발생: 모든 레코드가 반드시 사용자 서명에 포함되어야 하는데 빠진 경우
    // 보안: 백엔드가 임의의 레코드를 추가하는 것 방지
    error UncoveredRecord(uint256 index);

    // 중복 인덱스 (같은 레코드를 여러 사용자 배치에 포함)
    // 발생: UserBatchSig.recordIndices에 중복된 인덱스 존재
    error DuplicateIndex(uint256 index);

    // 허용되지 않은 후보 (후보자가 등록되지 않았거나 비활성화됨)
    // 발생: allowedCandidate[missionId][candidateId] == false
    error CandidateNotAllowed(uint256 missionId, uint256 candidateId);

    // 유효하지 않은 투표 타입 (0 또는 1만 허용)
    // 발생: voteType > MAX_VOTE_TYPE
    error InvalidVoteType(uint8 value);

    // ========================================
    // 데이터 구조체 (Data Structures)
    // ========================================

    /**
     * @notice 개별 투표 레코드 구조체
     * @dev 역할: 한 사용자의 한 번의 투표 정보를 저장
     *      동작: 컨트랙트 저장소에 해시를 키로 하여 저장됨
     *      참고: userId는 저장 시 원본 문자열, 서명 시 해시로 변환
     */
    struct VoteRecord {
        uint256 timestamp; // 투표가 생성된 시각 (Unix timestamp, 초 단위)
        uint256 missionId; // 미션 식별자
        uint256 votingId; // 투표 식별자
        address userAddress; // 투표한 사용자의 지갑 주소
        uint256 candidateId; // 투표 대상 후보자 ID (후보자 번호)
        uint8 voteType; // 투표 종류: 0=Forget, 1=Remember(정의하기 나름임)
        string userId; // 사용자 식별자 (문자열)
        uint256 votingAmt; // 투표에 사용된 포인트 (가중치)
    }

    /**
     * @notice 사용자 배치 서명 데이터
     * @dev 역할: 한 사용자가 여러 투표를 묶어서 서명한 정보
     *      동작: recordIndices로 어떤 투표에 서명했는지 지정
     *      목적: 사용자가 승인하지 않은 투표가 포함되는 것을 방지
     */
    struct UserBatchSig {
        address user; // 서명한 사용자의 지갑 주소
        uint256 userNonce; // 사용자별 nonce (서명 재사용 방지)
        uint256[] recordIndices; // 이 사용자가 서명한 레코드들의 인덱스 (records 배열 내)
        bytes signature; // EIP-712 서명 데이터 (65 bytes: r, s, v)
    }

    /**
     * @notice 투표 레코드 요약 구조체 (조회 전용)
     * @dev 역할: 저장된 투표 정보를 사람이 읽기 쉬운 형태로 변환
     *      동작: candidateId → 후보 이름, voteType → 투표 타입 이름으로 변환
     *      목적: 프론트엔드에서 별도 매핑 없이 바로 표시 가능
     */
    struct VoteRecordSummary {
        uint256 timestamp; // 투표 시각
        uint256 missionId; // 미션 ID
        uint256 votingId; // 투표 ID
        string userId; // 사용자 ID
        string votingFor; // 투표한 후보 이름 (candidateName에서 조회)
        string votedOn; // 투표 타입 이름 (voteTypeName에서 조회)
        uint256 votingAmt; // 투표 포인트
    }

    // ========================================
    // 상태 변수 (Storage Variables)
    // ========================================

    // === 투표 레코드 저장소 ===

    // 투표 레코드 메인 저장소: 해시 → VoteRecord
    // 키: keccak256(abi.encode(VOTE_RECORD_TYPEHASH, ...))
    // 목적: 중복 제출 방지 및 빠른 조회
    mapping(bytes32 => VoteRecord) public votes;

    // (missionId, votingId) 조합별 투표 해시 인덱스
    // 목적: 특정 votingId의 모든 투표를 효율적으로 조회
    // 예: voteHashesByMissionVotingId[1][100] = [hash1, hash2, ...]
    mapping(uint256 => mapping(uint256 => bytes32[]))
        private voteHashesByMissionVotingId;

    // === Nonce 관리 (재사용 공격 방지) ===

    // 사용자 nonce 사용 여부: user → nonce → used
    // 목적: 동일한 서명을 두 번 제출하는 것 방지
    mapping(address => mapping(uint256 => bool)) public userNonceUsed;

    // 사용자별 최소 유효 nonce
    // 목적: nonce 일괄 취소 (이 값 미만은 모두 무효)
    // 사용: cancelAllUserNonceUpTo() 함수
    mapping(address => uint256) public minUserNonce;

    // 배치 nonce 사용 여부: executorSigner → nonce → used
    // 목적: 백엔드 서명 재사용 방지
    mapping(address => mapping(uint256 => bool)) public batchNonceUsed;

    // Executor별 최소 유효 배치 nonce
    // 목적: executorSigner 변경 시 이전 서명자의 nonce 모두 무효화
    mapping(address => uint256) public minBatchNonce;

    // === 중복 방지 ===

    // 레코드 다이제스트 소비 여부: digest → consumed
    // 목적: 동일한 레코드가 여러 배치에 중복 제출되는 것 방지
    // 체크: _storeVoteRecords()에서 consumed[recordDigest] 확인
    mapping(bytes32 => bool) public consumed;

    // === 체인 및 백엔드 설정 ===

    // 배포 시 고정된 체인 ID (Replay 공격 방지)
    // 값: 생성자에서 block.chainid로 고정
    // 체크: submitMultiUserBatch()에서 검증
    uint256 public immutable CHAIN_ID;

    // 백엔드 서명자 주소 (Batch 서명 검증용)
    // 설정: setExecutorSigner()로 변경 가능 (Owner만)
    address public executorSigner;

    // === 후보 및 투표 타입 메타데이터 ===

    // 후보 이름: missionId → candidateId → name
    // 예: candidateName[1][5] = "아티스트A"
    mapping(uint256 => mapping(uint256 => string)) public candidateName;

    // 후보 허용 여부: missionId → candidateId → allowed
    // 목적: 등록되지 않은 후보에 대한 투표 차단
    mapping(uint256 => mapping(uint256 => bool)) public allowedCandidate;

    // 투표 타입 이름: voteType → name
    // 예: voteTypeName[0] = "Forget", voteTypeName[1] = "Remember"
    mapping(uint8 => string) public voteTypeName;

    // === 실시간 집계 ===

    /**
     * @notice 후보별 투표 집계 구조체
     * @dev 투표 제출 시 실시간으로 업데이트 (_storeVoteRecords)
     */
    struct CandidateStats {
        uint256 remember; // Remember 투표 포인트 합계
        uint256 forget; // Forget 투표 포인트 합계
        uint256 total; // 전체 투표 포인트 합계 (remember + forget)
    }

    // 후보별 집계: missionId → candidateId → CandidateStats
    // 조회: getCandidateAggregates(missionId, candidateId)
    mapping(uint256 => mapping(uint256 => CandidateStats))
        public candidateStats;

    // ========================================
    // 이벤트 (Events)
    // ========================================
    // 목적: 블록체인 외부(프론트엔드, 백엔드)에서 상태 변경 추적

    /**
     * @notice Executor 서명자 변경 이벤트
     * @dev 백엔드 서명자 교체 시 발생
     *      oldMinNonce: 이전 서명자의 모든 nonce 무효화 증거
     */
    event ExecutorSignerChanged(
        address indexed oldSigner, // 이전 서명자 (null 가능)
        address indexed newSigner, // 새 서명자
        uint256 oldMinNonce // 이전 서명자의 최소 nonce (무효화 증거)
    );

    /**
     * @notice 개별 사용자 배치 처리 완료 이벤트
     * @dev 각 사용자의 서명 검증 완료 시 발생
     *      recordCount: 서명한 레코드 수
     *      storedCount: 실제 저장된 레코드 수 (중복/0포인트 제외)
     */
    event UserBatchProcessed(
        bytes32 indexed batchDigest, // 배치 해시 (그룹화용)
        address indexed user, // 사용자 주소
        uint256 userNonce, // 사용된 nonce
        uint256 recordCount, // 서명한 레코드 수
        uint256 storedCount // 실제 저장된 수
    );

    /**
     * @notice 전체 배치 처리 완료 이벤트
     * @dev submitMultiUserBatch() 완료 시 발생
     *      모든 사용자 배치가 성공적으로 처리됨
     */
    event BatchProcessed(
        bytes32 indexed batchDigest, // 배치 해시
        address indexed executorSigner, // 백엔드 서명자
        uint256 batchNonce, // 사용된 배치 nonce
        uint256 recordCount, // 저장된 레코드 수
        uint256 userCount // 참여한 사용자 수
    );

    /**
     * @notice 사용자 nonce 일괄 취소 이벤트
     * @dev newMinUserNonce 미만의 모든 nonce 무효화
     */
    event CancelUserNonceUpTo(
        address indexed user, // 대상 사용자
        uint256 newMinUserNonce // 새로운 최소 유효 nonce
    );

    /**
     * @notice 배치 nonce 일괄 취소 이벤트
     * @dev executorSigner 변경 시 또는 명시적 취소 시 발생
     */
    event CancelBatchNonceUpTo(
        address indexed executorSigner, // 대상 Executor
        uint256 newMinBatchNonce // 새로운 최소 유효 배치 nonce
    );

    /**
     * @notice 후보 등록/수정 이벤트
     * @dev 후보 메타데이터 및 허용 여부 변경 시 발생
     */
    event CandidateSet(
        uint256 indexed missionId, // 미션 ID
        uint256 indexed candidateId, // 후보 ID
        string name, // 후보 이름
        bool allowed // 허용 여부
    );

    /**
     * @notice 투표 타입 이름 설정 이벤트
     * @dev voteType(0/1)에 대한 라벨 설정 시 발생
     */
    event VoteTypeSet(
        uint8 indexed voteType, // 투표 타입 (0 또는 1)
        string name // 라벨 (예: "Forget", "Remember")
    );

    // ========================================
    // 생성자 (Constructor)
    // ========================================
    /**
     * @notice 컨트랙트 초기화
     * @dev EIP712 도메인 설정: "MainVoting", 버전 "1"
     *      CHAIN_ID 고정: 배포 체인에서만 동작 (Replay 공격 방지)
     * @param initialOwner 최초 소유자 주소 (Ownable2Step)
     */
    constructor(
        address initialOwner
    ) EIP712("MainVoting", "1") Ownable(initialOwner) {
        // 제로 주소 체크: 소유자 없는 컨트랙트 방지
        if (initialOwner == address(0)) revert ZeroAddress();

        // 체인 ID 고정: 다른 체인에서 서명 재사용 방지
        // 예: Mainnet 서명을 Testnet에서 사용하는 것 차단
        CHAIN_ID = block.chainid;
    }

    // ========================================
    // 관리자 함수 (Admin Functions)
    // ========================================

    /**
     * @notice 백엔드 서명자(Executor) 변경
     * @dev Owner만 호출 가능 (onlyOwner modifier)
     *      보안: 이전 서명자의 모든 nonce 무효화 (type(uint256).max 설정)
     * @param s 새로운 executor 주소
     *
     * 프로세스:
     * 1. 제로 주소 체크
     * 2. 이전 서명자의 모든 nonce 무효화 (minBatchNonce = max)
     * 3. 새 서명자 설정
     * 4. 이벤트 발생
     */
    function setExecutorSigner(address s) external onlyOwner {
        // [1단계] 제로 주소 방지
        if (s == address(0)) revert ZeroAddress();

        address oldSigner = executorSigner;
        uint256 oldMinNonce = minBatchNonce[oldSigner];

        // [2단계] 보안: 이전 서명자의 모든 서명 무효화
        // 이유: 키 유출 시 이전 서명으로 공격 방지
        // type(uint256).max: 모든 nonce가 이 값보다 작아서 무효화됨
        if (oldSigner != address(0)) {
            minBatchNonce[oldSigner] = type(uint256).max;
        }

        // [3단계] 새 서명자 설정
        executorSigner = s;

        // [4단계] 이벤트 발생: 투명성 보장
        emit ExecutorSignerChanged(oldSigner, s, oldMinNonce);
    }

    /**
     * @notice 후보(아티스트) 등록 및 활성화 관리
     * @dev 역할: 후보 정보를 등록하고 투표 가능 여부를 설정
     *      권한: Owner만 호출 가능
     *      범위: 특정 missionId 내에서 후보 관리
     *
     * @param missionId 미션 식별자
     * @param candidateId 후보 ID (아티스트 번호)
     * @param name 후보 이름 (예: "Artist-1", "NewArtist")
     * @param allowed_ 투표 허용 여부
     *                 - true: 이 후보에게 투표 가능
     *                 - false: 투표 시도 시 거부됨
     *
     * 사용 예:
     * - 신규 후보 등록: setCandidate(1, 10, "Artist-10", true)
     * - 후보 비활성화: setCandidate(1, 5, "Artist-5", false)
     * - 후보 이름 변경: setCandidate(1, 10, "New-Name", true)
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
     * @notice 투표 타입 이름 설정
     * @dev 역할: voteType 번호에 대응하는 사람이 읽기 쉬운 이름 지정
     *      권한: Owner만 호출 가능
     *      목적: 조회 시 0/1 대신 문자열로 표시하기 위함
     *
     * @param voteType 투표 타입 번호 (0 또는 1)
     * @param name 표시될 이름 (예: "Forget", "Remember")
     *
     * 초기 설정 예:
     * - setVoteTypeName(0, "Forget")   // 0번 타입을 "Forget"으로 표시
     * - setVoteTypeName(1, "Remember") // 1번 타입을 "Remember"로 표시
     */
    function setVoteTypeName(
        uint8 voteType,
        string calldata name
    ) external onlyOwner {
        // 범위 체크: 0 또는 1만 허용
        if (voteType > MAX_VOTE_TYPE) revert InvalidVoteType(voteType);
        voteTypeName[voteType] = name;
        emit VoteTypeSet(voteType, name);
    }

    // ========================================
    // Nonce 관리 (Nonce Cancellation)
    // ========================================

    /**
     * @notice 사용자 nonce 일괄 취소
     * @dev Owner만 호출 가능
     *      newMinUserNonce 미만의 모든 nonce를 무효화
     * @param user 대상 사용자 주소
     * @param newMinUserNonce 새로운 최소 유효 nonce
     *
     * 사용 시나리오:
     * - 사용자가 개인키 유출 의심 시
     * - 비정상적인 서명 활동 감지 시
     * - 사용자 요청으로 모든 보류 중인 서명 취소 시
     */
    function cancelAllUserNonceUpTo(
        address user,
        uint256 newMinUserNonce
    ) external onlyOwner {
        // 현재 minUserNonce보다 낮은 값으로 변경 불가 (보안)
        if (newMinUserNonce <= minUserNonce[user]) revert UserNonceTooLow();

        minUserNonce[user] = newMinUserNonce;
        emit CancelUserNonceUpTo(user, newMinUserNonce);
    }

    /**
     * @notice 배치 nonce 일괄 취소
     * @dev Owner 또는 ExecutorSigner만 호출 가능
     *      newMinBatchNonce 미만의 모든 배치 nonce를 무효화
     * @param newMinBatchNonce 새로운 최소 유효 배치 nonce
     *
     * 사용 시나리오:
     * - 백엔드 서명 로직 변경 시
     * - 보류 중인 배치 전체 취소 시
     * - 비정상적인 배치 활동 감지 시
     */
    function cancelAllBatchNonceUpTo(uint256 newMinBatchNonce) external {
        // 권한 체크: Owner 또는 ExecutorSigner만
        if (msg.sender != owner() && msg.sender != executorSigner) {
            revert NotOwnerOrExecutor();
        }

        // 현재 minBatchNonce보다 낮은 값으로 변경 불가 (보안)
        if (newMinBatchNonce <= minBatchNonce[executorSigner]) {
            revert BatchNonceTooLow();
        }

        minBatchNonce[executorSigner] = newMinBatchNonce;
        emit CancelBatchNonceUpTo(executorSigner, newMinBatchNonce);
    }

    // ========================================
    // EIP-712 해시 생성 함수 (Internal Hashers)
    // ========================================
    // 목적: 구조화된 데이터를 EIP-712 표준에 맞게 해시화
    // 핵심: 사람이 읽을 수 있는 서명 + 가스 최적화

    /**
     * @notice 개별 투표 레코드 해시 생성
     * @dev V1 설계: userId를 bytes32 해시로 변환하여 가스 최적화
     *      서명 시: keccak256(bytes(userId)) 사용
     *      저장 시: 원본 문자열 사용 (이벤트 및 조회용)
     * @param record 투표 레코드
     * @return bytes32 레코드의 구조화된 해시
     *
     * 해시 구조:
     * keccak256(abi.encode(
     *   VOTE_RECORD_TYPEHASH,
     *   timestamp, missionId, votingId, userAddress,
     *   keccak256(bytes(userId)), // ← 문자열을 해시로 변환
     *   candidateId, voteType, votingAmt
     * ))
     *
     * 가스 최적화 효과:
     * - 긴 문자열 → 32바이트 해시 (저장 비용 절감)
     * - 프라이버시: 원본 문자열 노출 없이 서명 검증
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
                    record.userAddress,
                    keccak256(bytes(record.userId)), // 문자열 → 해시 변환
                    record.candidateId,
                    record.voteType,
                    record.votingAmt
                )
            );
    }

    /**
     * @notice 사용자 배치 해시 생성 (EIP-712 Typed Data)
     * @dev 사용자가 서명할 최종 해시 생성
     *      recordsHash: 사용자가 서명한 모든 레코드의 packed 해시
     * @param user 사용자 주소
     * @param userNonce 사용자 nonce
     * @param recordsHash 레코드 해시 배열의 packed 해시
     * @return bytes32 EIP-712 표준 해시
     *
     * 해시 구조:
     * _hashTypedDataV4(
     *   keccak256(abi.encode(
     *     USER_BATCH_TYPEHASH,
     *     user,
     *     userNonce,
     *     keccak256(abi.encodePacked(recordHashes))
     *   ))
     * )
     *
     * 목적:
     * - 사용자는 자신의 투표만 서명했음을 증명
     * - recordsHash를 통해 레코드 위변조 방지
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
                        recordsHash // keccak256(abi.encodePacked(userHashes))
                    )
                )
            );
    }

    /**
     * @notice 백엔드 배치 해시 생성
     * @dev batchNonce만 서명
     * @param batchNonce 배치 nonce
     * @return bytes32 EIP-712 표준 해시
     *
     * 해시 구조:
     * _hashTypedDataV4(
     *   keccak256(abi.encode(
     *     BATCH_TYPEHASH,
     *     batchNonce
     *   ))
     * )
     *
     */
    function _hashBatch(uint256 batchNonce) internal view returns (bytes32) {
        return
            _hashTypedDataV4(keccak256(abi.encode(BATCH_TYPEHASH, batchNonce)));
    }

    // ========================================
    // 서명 검증 (Signature Verification)
    // ========================================
    // 목적: EOA와 스마트 컨트랙트 지갑 모두 지원

    /**
     * @notice 범용 서명 검증 (EOA + ERC-1271)
     * @dev 서명자가 EOA인지 스마트 컨트랙트인지 자동 판별
     *      EOA: ECDSA 서명 검증
     *      CA(Contract Account): ERC-1271 표준 사용
     * @param signer 서명자 주소
     * @param digest 서명된 메시지 해시 (EIP-712)
     * @param sig 서명 데이터 (65 bytes for EOA)
     * @return bool 서명 유효 여부
     *
     * 동작 방식:
     * 1. signer.code.length == 0 → EOA
     *    - ECDSA.recover(digest, sig) == signer 확인
     * 2. signer.code.length > 0 → Smart Contract
     *    - signer.isValidSignature(digest, sig) 호출
     *    - 반환값이 ERC1271_MAGICVALUE(0x1626ba7e)인지 확인
     *
     * 지원 지갑:
     * - EOA: MetaMask, Coinbase Wallet 등
     * - CA: Gnosis Safe, Argent, Account Abstraction 지갑
     */
    function _isValidSig(
        address signer,
        bytes32 digest,
        bytes calldata sig
    ) internal view returns (bool) {
        // EOA 체크: 코드 길이가 0이면 EOA
        if (signer.code.length == 0) {
            // ECDSA 서명 검증: recover한 주소와 signer 비교
            return ECDSA.recover(digest, sig) == signer;
        }

        // 스마트 컨트랙트 서명 검증 (ERC-1271)
        // staticcall: 상태 변경 없이 호출 (가스 절약 + 보안)
        (bool ok, bytes memory ret) = signer.staticcall(
            abi.encodeWithSelector(
                IERC1271.isValidSignature.selector,
                digest,
                sig
            )
        );

        // 검증 성공 조건:
        // 1. staticcall 성공 (ok == true)
        // 2. 반환값 길이 4바이트 (bytes4)
        // 3. 반환값이 매직 값(0x1626ba7e)
        return ok && ret.length == 4 && bytes4(ret) == ERC1271_MAGICVALUE;
    }

    /**
     * @notice 사용자 서명 검증 (Wrapper)
     * @dev _isValidSig의 명시적 래퍼 (가독성 향상)
     */
    function _isValidUserSig(
        address user,
        bytes32 digest,
        bytes calldata sig
    ) internal view returns (bool) {
        return _isValidSig(user, digest, sig);
    }

    /**
     * @notice Executor 서명 검증 (Wrapper)
     * @dev _isValidSig의 명시적 래퍼 (가독성 향상)
     */
    function _isValidExecSig(
        address signer,
        bytes32 digest,
        bytes calldata sig
    ) internal view returns (bool) {
        return _isValidSig(signer, digest, sig);
    }

    // ========================================
    // Nonce 관리 (Nonce Management)
    // ========================================
    // 목적: 서명 재사용 공격(Replay Attack) 방지

    /**
     * @notice 사용자 nonce 소비 (재사용 방지)
     * @dev nonce가 유효한지 확인하고 사용 표시
     * @param user 사용자 주소
     * @param nonce_ 사용할 nonce
     *
     * 검증 로직:
     * 1. nonce >= minUserNonce[user] (취소되지 않은 nonce)
     * 2. userNonceUsed[user][nonce] == false (미사용 nonce)
     * 3. 검증 통과 시 사용 표시
     *
     * 보안:
     * - 동일한 nonce로 두 번 서명 제출 방지
     * - minUserNonce 메커니즘으로 일괄 취소 지원
     */
    function _consumeUserNonce(address user, uint256 nonce_) internal {
        // [1단계] 취소된 nonce 체크
        if (nonce_ < minUserNonce[user]) revert UserNonceTooLow();

        // [2단계] 이미 사용된 nonce 체크
        if (userNonceUsed[user][nonce_]) revert UserNonceAlreadyUsed();

        // [3단계] nonce 사용 표시
        userNonceUsed[user][nonce_] = true;
    }

    /**
     * @notice 배치 nonce 소비 (백엔드 서명 재사용 방지)
     * @dev 사용자 nonce와 동일한 로직, executor에 적용
     * @param signer Executor 주소
     * @param nonce_ 사용할 배치 nonce
     */
    function _consumeBatchNonce(address signer, uint256 nonce_) internal {
        // [1단계] 취소된 nonce 체크
        if (nonce_ < minBatchNonce[signer]) revert BatchNonceTooLow();

        // [2단계] 이미 사용된 nonce 체크
        if (batchNonceUsed[signer][nonce_]) revert BatchNonceAlreadyUsed();

        // [3단계] nonce 사용 표시
        batchNonceUsed[signer][nonce_] = true;
    }

    // ========================================
    // 데이터 검증 (Data Validation)
    // ========================================

    /**
     * @notice 문자열 길이 검증 (가스 공격 방지)
     * @dev MAX_STRING_LENGTH(100) 이하만 허용
     * @param record 검증할 투표 레코드
     *
     * 목적:
     * - 가스 폭탄 공격 방지 (긴 문자열 → 높은 가스 비용)
     * - 블록 가스 한도 초과 방지
     *
     * V1 변경사항:
     * - 이전: votingFor, votedOn, userId 모두 체크
     * - 현재: userId만 체크 (나머지는 uint256으로 대체)
     */
    function _validateStrings(VoteRecord calldata record) internal pure {
        // userId만 문자열로 유지 (앱 내 식별자)
        if (bytes(record.userId).length > MAX_STRING_LENGTH) {
            revert StringTooLong();
        }
    }

    /**
     * @notice 레코드 다이제스트 배열 생성
     * @dev 모든 레코드를 검증하고 해시 생성
     * @param records 투표 레코드 배열
     * @return recordDigests 레코드 해시 배열
     *
     * 프로세스:
     * 1. 각 레코드의 문자열 길이 검증
     * 2. 각 레코드의 EIP-712 해시 생성
     * 3. 해시 배열 반환
     *
     * 용도:
     * - 사용자 서명 검증 시 recordDigests 재사용
     * - 중복 방지 체크 (consumed mapping)
     */
    function _buildRecordDigests(
        VoteRecord[] calldata records
    ) internal pure returns (bytes32[] memory recordDigests) {
        uint256 len = records.length;

        // 메모리에 해시 배열 생성
        recordDigests = new bytes32[](len);

        // 각 레코드 처리
        for (uint256 i; i < len; ) {
            // [1단계] 문자열 길이 검증
            _validateStrings(records[i]);

            // [2단계] EIP-712 해시 생성
            recordDigests[i] = _hashVoteRecord(records[i]);

            // 가스 최적화: unchecked (오버플로우 불가능)
            unchecked {
                ++i;
            }
        }
    }

    // ========================================
    // 사용자 배치 서명 검증 (User Batch Verification + Coverage)
    // ========================================
    // 핵심 보안 메커니즘: 커버리지 강제 + 인덱스 검증

    /**
     * @notice 개별 사용자 배치 서명 검증 및 커버리지 추적
     * @dev 핵심 보안 함수 - 3가지 검증 수행
     *      1. 인덱스 유효성: 범위, 중복, 소유권 확인
     *      2. 서명 검증: EIP-712 사용자 서명 확인
     *      3. 커버리지 추적: covered[] 배열에 표시
     * @param records 전체 투표 레코드 배열
     * @param userBatch 사용자 배치 서명 데이터
     * @param covered 커버리지 추적 배열 (참조로 전달, 수정됨)
     * @param recordDigests 레코드 해시 배열 (재사용)
     * @param batchDigest 배치 해시 (이벤트용)
     *
     * 보안 메커니즘:
     * - 커버리지 강제: 모든 레코드가 반드시 어떤 사용자의 서명에 포함되어야 함
     * - 중복 방지: 같은 레코드를 여러 사용자가 서명할 수 없음
     * - 소유권 확인: 레코드의 userAddress와 서명자 일치 확인
     *
     * 프로세스:
     * [1단계] 배치 크기 검증 (최대 20개)
     * [2단계] 인덱스 유효성 검증
     * [3단계] recordsHash 계산
     * [4단계] 사용자 서명 검증
     * [5단계] nonce 소비
     * [6단계] 이벤트 발생
     */
    function _verifyUserBatchSignature(
        VoteRecord[] calldata records,
        UserBatchSig calldata userBatch,
        bool[] memory covered,
        bytes32[] memory recordDigests,
        bytes32 batchDigest
    ) internal {
        // [1단계] 배치 크기 검증
        uint256 indicesLen = userBatch.recordIndices.length;
        if (indicesLen > MAX_RECORDS_PER_USER_BATCH) revert UserBatchTooLarge();

        // 사용자 배치의 레코드 해시 배열 (서명 검증용)
        bytes32[] memory userHashes = new bytes32[](indicesLen);

        // [2단계] 인덱스 유효성 검증 + 커버리지 추적
        for (uint256 j; j < indicesLen; ) {
            uint256 idx = userBatch.recordIndices[j];

            // 인덱스 범위 체크
            if (idx >= records.length) revert InvalidRecordIndices();

            // 중복 인덱스 체크: 이미 다른 사용자가 서명했는지 확인
            if (covered[idx]) revert DuplicateIndex(idx);

            // 커버리지 표시: 이 레코드는 검증됨
            covered[idx] = true;

            VoteRecord calldata record = records[idx];

            // 소유권 확인: 레코드의 userAddress와 서명자 일치
            // 보안: 다른 사용자의 투표를 대신 서명하는 것 방지
            if (record.userAddress != userBatch.user) revert InvalidSignature();

            // 레코드 해시 수집
            userHashes[j] = recordDigests[idx];

            unchecked {
                ++j;
            }
        }

        // [3단계] recordsHash 계산
        // packed 해시: abi.encodePacked(hash1, hash2, ...) → keccak256
        bytes32 recordsHash = keccak256(abi.encodePacked(userHashes));

        // [4단계] 사용자 배치 해시 생성 (EIP-712)
        bytes32 userBatchDigest = _hashUserBatch(
            userBatch.user,
            userBatch.userNonce,
            recordsHash
        );

        // [5단계] EIP-712 서명 검증 (EOA 또는 ERC-1271)
        if (
            !_isValidUserSig(
                userBatch.user,
                userBatchDigest,
                userBatch.signature
            )
        ) {
            revert InvalidSignature();
        }

        // [6단계] nonce 소비 (재사용 방지)
        _consumeUserNonce(userBatch.user, userBatch.userNonce);

        // [7단계] 이벤트 발생
        emit UserBatchProcessed(
            batchDigest,
            userBatch.user,
            userBatch.userNonce,
            indicesLen, // 서명한 레코드 수
            indicesLen // 실제 저장될 수 (동일, 중복 없음)
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
    // 투표 저장 및 집계 (Store + Aggregation)
    // ========================================
    // 핵심 기능: 부분 처리 + 실시간 집계

    /**
     * @notice 투표 레코드 저장 및 실시간 집계
     * @dev 부분 처리 로직: 0포인트와 중복 레코드는 스킵
     *      실시간 집계: candidateStats 업데이트
     * @param records 투표 레코드 배열
     * @param recordDigests 레코드 해시 배열
     * @return storedCount 실제 저장된 레코드 수
     *
     * 프로세스:
     * [1단계] 0포인트 투표 스킵 (가스 절약)
     * [2단계] 공통 검증 (voteType, 후보 허용 여부)
     * [3단계] 중복 레코드 스킵 (consumed mapping)
     * [4단계] 레코드 저장 (votes mapping)
     * [5단계] 인덱싱 (voteHashesByMissionVotingId)
     * [6단계] 실시간 집계 (candidateStats)
     *
     * 부분 처리 로직:
     * - 0포인트: continue (저장하지 않음)
     * - 중복 레코드: continue (이미 저장됨)
     * - 정상 레코드: 저장 + 집계
     *
     * 집계 알고리즘:
     * - Remember (voteType=1): stats.remember += votingAmt
     * - Forget (voteType=0): stats.forget += votingAmt
     * - Total: stats.total += votingAmt
     */
    function _storeVoteRecords(
        VoteRecord[] calldata records,
        bytes32[] memory recordDigests
    ) internal returns (uint256 storedCount) {
        uint256 len = records.length;

        for (uint256 i; i < len; ) {
            VoteRecord calldata record = records[i];

            // [1단계] 0포인트 투표 스킵
            // 이유: 의미 없는 투표, 가스 절약
            if (record.votingAmt == 0) {
                unchecked {
                    ++i;
                }
                continue; // 저장하지 않고 다음 레코드로
            }

            // [2단계] 공통 검증 (voteType, 후보 허용 여부)
            _validateRecordCommon(record);

            bytes32 recordDigest = recordDigests[i];

            // [3단계] 중복 레코드 스킵
            // consumed mapping: 동일한 레코드가 여러 배치에 제출되는 것 방지
            if (consumed[recordDigest]) {
                unchecked {
                    ++i;
                }
                continue; // 이미 저장됨, 스킵
            }

            // 중복 방지 플래그 설정
            consumed[recordDigest] = true;

            bytes32 voteHash = recordDigest;

            // [4단계] 레코드 저장 (메인 저장소)
            votes[voteHash] = record;

            // [5단계] 인덱싱 (조회 최적화)
            // (missionId, votingId) 조합으로 빠른 조회 가능
            voteHashesByMissionVotingId[record.missionId][record.votingId].push(
                voteHash
            );

            // [6단계] 실시간 집계 (후보별 통계)
            CandidateStats storage stats = candidateStats[record.missionId][
                record.candidateId
            ];

            // voteType에 따라 Remember 또는 Forget 카운팅
            if (record.voteType == VOTE_TYPE_REMEMBER) {
                stats.remember += record.votingAmt;
            } else {
                // VOTE_TYPE_FORGET
                stats.forget += record.votingAmt;
            }

            // 전체 투표 포인트 합계
            stats.total += record.votingAmt;

            // 저장 카운터 증가 (가스 최적화: unchecked)
            unchecked {
                ++storedCount;
                ++i;
            }
        }
    }

    // ========================================
    // 메인 엔트리 포인트 (Main Entry Point)
    // ========================================
    // 다중 사용자 배치 투표 제출 함수

    /**
     * @notice 여러 사용자의 투표를 배치로 제출하는 메인 함수
     * @dev 역할: 다수의 투표를 한 트랜잭션에서 검증하고 저장
     *      권한: 누구나 호출 가능 (서명 검증으로 보안 확보)
     *      용량: 최대 5000개 레코드까지 처리 가능
     *
     * @param records 투표 레코드 배열 (각 사용자의 투표 정보)
     * @param userBatchSigs 사용자 서명 배열 (각 사용자가 자신의 투표에 대해 서명)
     * @param batchNonce 배치 식별 번호 (실행자가 관리)
     * @param executorSig 실행자 서명 (배치 전체에 대한 승인)
     *
     * 처리 단계:
     * [1] 사전 검증
     *     - 배치 크기 확인 (DoS 공격 방지)
     *     - 체인 ID 확인 (다른 네트워크에서 재사용 방지)
     *     - 실행자 설정 확인
     *
     * [2] 실행자 서명 검증
     *     - 실행자가 이 배치를 승인했는지 확인
     *     - batchNonce에 대한 EIP-712 서명 검증
     *
     * [3] 투표 레코드 해시 계산
     *     - 모든 레코드의 EIP-712 해시 생성
     *     - 사용자 서명 검증에 사용됨
     *
     * [4] 사용자 서명 검증
     *     - 각 사용자의 서명 검증
     *     - 모든 레코드가 사용자 서명에 포함되었는지 확인 (커버리지)
     *     - 승인되지 않은 레코드가 포함되는 것 방지
     *
     * [5] 저장 및 통계 업데이트
     *     - 투표 저장 (중복 제거)
     *     - 후보별 득표 통계 실시간 집계
     *     - 이벤트 발생 (BatchProcessed)
     *
     * 보안 메커니즘:
     * - 이중 서명: 사용자 + 실행자 모두 서명 필요
     * - Nonce 시스템: 같은 서명 재사용 불가
     * - 커버리지 검증: 사용자가 승인한 투표만 처리
     * - 중복 방지: 같은 투표를 두 번 저장할 수 없음
     */
    function submitMultiUserBatch(
        VoteRecord[] calldata records,
        UserBatchSig[] calldata userBatchSigs,
        uint256 batchNonce,
        bytes calldata executorSig
    ) external {
        // [1단계] 사전 검증
        uint256 len = records.length;

        // 배치 크기 체크: DoS 공격 방지
        if (len > MAX_RECORDS_PER_BATCH) revert BatchTooLarge();

        // Executor 설정 확인
        if (executorSigner == address(0)) revert ZeroAddress();

        // 체인 ID 검증: Replay 공격 방지
        // 예: Mainnet 서명을 Testnet에서 사용하는 것 차단
        if (block.chainid != CHAIN_ID) revert BadChain();

        // [2단계] 백엔드 서명 검증 (V1: batchNonce만 서명)
        // 백엔드는 "나는 이 배치를 승인한다"만 서명
        // 모든 검증은 컨트랙트에서 수행 → 탈중앙화
        bytes32 batchDigest = _verifyBatchSignature(batchNonce, executorSig);

        // [3단계] 레코드 다이제스트 생성
        // 모든 레코드의 EIP-712 해시 계산 (재사용 위해 배열 저장)
        bytes32[] memory recordDigests = _buildRecordDigests(records);

        // [4단계] 사용자 서명 검증 + 커버리지 강제
        // covered 배열: 모든 레코드가 사용자 서명에 포함되었는지 추적
        bool[] memory covered = new bool[](len);
        _verifyAllUserCoverage(
            records,
            userBatchSigs,
            covered,
            recordDigests,
            batchDigest
        );
        uint256 userBatchLen = userBatchSigs.length;

        // [5단계] 투표 저장 + 집계
        // 부분 처리: 0포인트, 중복 레코드 스킵
        // 실시간 집계: candidateStats 업데이트
        uint256 stored = _storeVoteRecords(records, recordDigests);

        // 배치 처리 완료 이벤트 발생
        emit BatchProcessed(
            batchDigest,
            executorSigner,
            batchNonce,
            stored, // 실제 저장된 레코드 수
            userBatchLen // 참여한 사용자 수
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
     * @notice 특정 투표 라운드의 모든 투표를 조회 (사람이 읽기 쉬운 형태로)
     * @dev 역할: missionId와 votingId로 투표 목록 조회
     *      동작: 저장된 정수 ID를 문자열로 변환하여 반환
     *           - candidateId → 후보 이름 (candidateName에서 조회)
     *           - voteType → 투표 타입 이름 (voteTypeName에서 조회)
     *      목적: 프론트엔드에서 추가 변환 없이 바로 표시 가능
     *
     * @param missionId 미션 식별자
     * @param votingId 투표 라운드 식별자
     * @return VoteRecordSummary 배열 (각 투표의 상세 정보, 문자열 포함)
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
     * @notice 특정 후보의 득표 현황 조회
     * @dev 역할: 후보별 Remember/Forget 투표 집계 조회
     *      동작: candidateStats에서 실시간 집계된 값 반환
     *      목적: 후보별 득표 현황을 빠르게 확인
     *
     * @param missionId 미션 식별자
     * @param candidateId 후보자 ID
     * @return remember Remember 투표 총합
     * @return forget Forget 투표 총합
     * @return total 전체 투표 총합 (remember + forget)
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
