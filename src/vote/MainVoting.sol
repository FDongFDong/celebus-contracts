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
 * @title MainVoting
 * @author Celebus Team
 * @notice 팬 투표 시스템의 메인 컨트랙트
 *
 * @dev 이 컨트랙트는 "1투표 N레코드" 구조를 사용합니다.
 *      - 한 명의 유저가 여러 개의 투표 레코드를 하나의 서명으로 제출할 수 있습니다.
 *      - 여러 유저의 배치를 하나의 트랜잭션으로 묶어서 처리합니다.
 *
 * 보안 특징:
 *      - EIP-712 구조화 서명으로 피싱 방지
 *      - Nonce 시스템으로 리플레이 공격 방지
 *      - 유저별 consumed 맵핑으로 중복 투표 방지
 *      - Chain ID 검증으로 크로스체인 리플레이 방지
 *
 * 데이터 흐름:
 *      1. 유저가 오프체인에서 투표 레코드들에 서명
 *      2. 백엔드(executorSigner)가 여러 유저의 배치를 수집
 *      3. executorSigner가 배치 전체에 서명 후 submitMultiUserBatch 호출
 *      4. 컨트랙트가 모든 서명 검증 후 투표 저장
 */
contract MainVoting is Ownable2Step, EIP712 {
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
     * @dev 한 유저가 하나의 배치에서 제출할 수 있는 최대 레코드 수
     *      votingId당 투표 수를 제한하여 조회 성능 보장
     */
    uint16 public constant MAX_RECORDS_PER_USER_BATCH = 20;

    /**
     * @dev userId 등 문자열 필드의 최대 길이
     *      과도한 스토리지 사용 방지
     */
    uint16 public constant MAX_STRING_LENGTH = 100;

    /**
     * @dev 투표 타입의 최대값 (0부터 시작하므로 1이면 0,1 두 가지)
     */
    uint8 public constant MAX_VOTE_TYPE = 1;

    uint8 public constant VOTE_TYPE_FORGET = 0;
    uint8 public constant VOTE_TYPE_REMEMBER = 1;

    // ========================================
    // EIP-712 타입 해시 (Type Hashes)
    // ========================================

    /**
     * @dev 개별 투표 레코드의 EIP-712 타입 해시
     *
     * 보안 핵심:
     *      - user(address): 지갑 주소가 해시에 포함되어
     *        다른 유저가 동일한 레코드를 재사용하는 것을 방지합니다.
     *
     * 참고: userId는 서명 대상에서 제외됩니다.
     *      - 프론트엔드에서 userId를 모르는 상태로 서명 가능
     *      - 백엔드가 DB에서 userId를 조회하여 VoteRecord에 주입
     *      - 온체인 저장 및 조회 시에만 userId 사용
     */
    bytes32 private constant VOTE_RECORD_TYPEHASH =
        keccak256(
            "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 optionId,uint8 voteType,uint256 votingAmt,address user)"
        );

    /**
     * @dev 유저 배치의 EIP-712 타입 해시
     *
     * 구조: 유저 주소 + 유저 nonce + 레코드들의 해시
     * 유저가 자신의 모든 투표 레코드를 하나의 서명으로 승인합니다.
     */
    bytes32 private constant USER_BATCH_TYPEHASH =
        keccak256(
            "UserBatch(address user,uint256 userNonce,bytes32 recordsHash)"
        );

    /**
     * @dev 전체 배치의 EIP-712 타입 해시
     *
     * executorSigner가 여러 유저의 배치를 묶어서 서명할 때 사용됩니다.
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

    /// @dev 레코드 인덱스가 유효하지 않음 (빈 배치 등)
    error InvalidRecordIndices();

    /// @dev 전체 배치가 MAX_RECORDS_PER_BATCH 초과
    error BatchTooLarge();

    /// @dev 유저 배치가 MAX_RECORDS_PER_USER_BATCH 초과
    error UserBatchTooLarge();

    /// @dev 문자열이 MAX_STRING_LENGTH 초과
    error StringTooLong();

    /// @dev 호출자가 owner도 executorSigner도 아님
    error NotOwnerOrExecutor();

    /// @dev 해당 missionId/optionId의 아티스트가 허용되지 않음
    error ArtistNotAllowed(uint256 missionId, uint256 optionId);

    /// @dev 투표 타입이 유효하지 않음 (MAX_VOTE_TYPE 초과)
    error InvalidVoteType(uint8 value);

    // ========================================
    // 구조체 (Structs)
    // ========================================

    /**
     * @dev 개별 투표 레코드
     * @param timestamp 투표 생성 시간 (오프체인에서 설정)
     * @param missionId 미션(캠페인) ID
     * @param votingId 투표 세션 ID (같은 미션 내 여러 투표 가능)
     * @param optionId 투표 대상 아티스트 ID
     * @param voteType 투표 타입 (0: Forget, 1: Remember)
     * @param userId 유저 식별자 (오프체인 시스템의 유저 ID)
     * @param votingAmt 투표 수량 (가중치)
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
     * @param user 유저의 지갑 주소
     * @param userNonce 유저의 nonce (리플레이 방지)
     * @param signature 유저의 EIP-712 서명
     */
    struct UserBatchSig {
        address user;
        uint256 userNonce;
        bytes signature;
    }

    /**
     * @dev 한 유저의 투표 배치
     *      유저는 여러 레코드를 하나의 서명으로 제출합니다.
     * @param records 유저의 투표 레코드 배열
     * @param userBatchSig 유저의 서명 정보
     */
    struct UserVoteBatch {
        VoteRecord[] records;
        UserBatchSig userBatchSig;
    }

    /**
     * @dev 투표 조회용 요약 구조체
     *      getVoteSummariesByMissionVotingId에서 반환됩니다.
     * @param timestamp 투표 시간
     * @param missionId 미션 ID
     * @param votingId 투표 세션 ID
     * @param userId 유저 식별자
     * @param votingFor 투표 대상 아티스트 이름
     * @param votedOn 투표 타입 이름 ("Remember" 또는 "Forget")
     * @param votingAmt 투표 수량
     */
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
     * @dev 아티스트별 투표 집계
     * @param remember Remember 투표 총합
     * @param forget Forget 투표 총합
     * @param total 전체 투표 총합
     */
    struct ArtistStats {
        uint256 remember;
        uint256 forget;
        uint256 total;
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
     * 참고: votingId당 최대 20개로 제한되어 가스비 부담 없음
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
     * @dev 유저별 레코드 소비 여부
     *      동일한 유저가 같은 레코드를 중복 제출하는 것을 방지
     *
     * 구조: user => recordDigest => consumed
     *
     * 중요: user 주소가 recordDigest 계산에 포함되어 있어서,
     *       다른 유저는 같은 레코드를 사용할 수 없습니다.
     */
    mapping(address => mapping(bytes32 => bool)) public consumed;

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
     * @dev 아티스트 이름 저장소
     *
     * 구조: missionId => optionId => artistName
     */
    mapping(uint256 => mapping(uint256 => string)) public artistName;

    /**
     * @dev 아티스트 투표 허용 여부
     *      false인 아티스트에게는 투표할 수 없습니다.
     *
     * 구조: missionId => optionId => allowed
     */
    mapping(uint256 => mapping(uint256 => bool)) public allowedArtist;

    /**
     * @dev 투표 타입별 이름
     *      0 => "Forget", 1 => "Remember"
     */
    mapping(uint8 => string) public voteTypeName;

    /**
     * @dev 아티스트별 투표 집계 데이터
     *
     * 구조: missionId => optionId => ArtistStats
     */
    mapping(uint256 => mapping(uint256 => ArtistStats)) public artistStats;

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
     * @dev 유저의 투표 배치가 처리되었을 때 발생
     * @param batchDigest 전체 배치의 해시
     * @param user 유저 주소
     * @param userNonce 사용된 유저 nonce
     * @param recordCount 처리된 레코드 수
     */
    event UserBatchProcessed(
        bytes32 indexed batchDigest,
        address indexed user,
        uint256 userNonce,
        uint256 recordCount
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
     * @dev 아티스트 정보가 설정되었을 때 발생
     * @param missionId 미션 ID
     * @param optionId 아티스트 옵션 ID
     * @param name 아티스트 이름
     * @param allowed 투표 허용 여부
     */
    event ArtistSet(
        uint256 indexed missionId,
        uint256 indexed optionId,
        string name,
        bool allowed
    );

    /**
     * @dev 투표 타입 이름이 설정되었을 때 발생
     * @param voteType 투표 타입 (0 또는 1)
     * @param name 타입 이름 ("Forget" 또는 "Remember")
     */
    event VoteTypeSet(uint8 indexed voteType, string name);

    // ========================================
    // 생성자 및 관리자 함수 (Constructor & Admin)
    // ========================================

    /**
     * @dev 컨트랙트 생성자
     * @param initialOwner 초기 소유자 주소
     *
     * EIP712 도메인:
     *   - name: "MainVoting"
     *   - version: "1"
     *
     * 체인 ID가 immutable로 저장되어 크로스체인 리플레이를 방지합니다.
     */
    constructor(
        address initialOwner
    ) EIP712("MainVoting", "1") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        CHAIN_ID = block.chainid;
    }

    /**
     * @dev 배치 실행 서명자 설정
     * @param s 새로운 서명자 주소
     */
    function setExecutorSigner(address s) external onlyOwner {
        if (s == address(0)) revert ZeroAddress();
        address oldSigner = executorSigner;
        uint256 oldMinNonce = minBatchNonce[oldSigner];

        // 기존 서명자가 있으면 모든 nonce 무효화
        if (oldSigner != address(0)) {
            minBatchNonce[oldSigner] = type(uint256).max;
        }

        // 새 서명자 설정
        minBatchNonce[s] = 0;
        executorSigner = s;

        emit ExecutorSignerChanged(oldSigner, s, oldMinNonce);
    }

    /**
     * @dev 아티스트 정보 설정
     * @param missionId 미션 ID
     * @param optionId 아티스트 옵션 ID
     * @param name 아티스트 이름 (조회 시 표시용)
     * @param allowed_ 투표 허용 여부 (false면 해당 아티스트에게 투표 불가)
     *
     * 사용 예:
     *   setArtist(1, 1, "BTS", true)  // 미션1의 옵션1로 BTS 등록
     *   setArtist(1, 1, "BTS", false) // BTS 투표 비활성화
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
     * @param voteType 투표 타입 (0: Forget, 1: Remember)
     * @param name 타입 이름
     *
     * 초기 설정 예:
     *   setVoteTypeName(0, "Forget")
     *   setVoteTypeName(1, "Remember")
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
        if (msg.sender != owner() && msg.sender != executorSigner)
            revert NotOwnerOrExecutor();
        if (newMinBatchNonce <= minBatchNonce[executorSigner])
            revert BatchNonceTooLow();
        minBatchNonce[executorSigner] = newMinBatchNonce;
        emit CancelBatchNonceUpTo(executorSigner, newMinBatchNonce);
    }

    // ========================================
    // 내부 함수: 해시 로직 (Internal: Hash Logic)
    // ========================================

    /**
     * @dev 개별 투표 레코드의 EIP-712 구조체 해시 생성
     * @param record 투표 레코드
     * @param user 레코드 소유자 주소
     * @return 레코드의 해시값
     *
     * 보안 핵심:
     *   user 주소가 해시에 포함되어 있어서,
     *   다른 유저가 이 레코드를 재사용할 수 없습니다.
     *   (데이터 충돌 및 덮어쓰기 공격 방지)
     *
     * 참고: userId는 서명 검증에 포함되지 않습니다.
     *   프론트엔드에서 userId 없이 서명하고,
     *   백엔드가 나중에 userId를 주입합니다.
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
                    user // address 충돌 방지
                )
            );
    }

    /**
     * @dev 유저 배치의 EIP-712 다이제스트 생성
     * @param user 유저 주소
     * @param userNonce 유저 nonce
     * @param recordsHash 레코드 해시들의 해시
     * @return EIP-712 서명용 다이제스트
     *
     * 유저는 이 다이제스트에 서명하여 모든 레코드를 승인합니다.
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
     *      → ECDSA.recover로 복구한 주소와 비교
     *   2. signer가 컨트랙트인 경우 (Safe, Argent 등):
     *      → ERC-1271의 isValidSignature 호출
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
    // 내부 함수: 처리 로직 (Internal: Processing)
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

    /**
     * @dev 문자열 필드 길이 검증
     * @param record 검증할 레코드
     *
     * 과도한 스토리지 사용 방지
     */
    function _validateStrings(VoteRecord calldata record) internal pure {
        if (bytes(record.userId).length > MAX_STRING_LENGTH)
            revert StringTooLong();
    }

    /**
     * @dev 레코드 공통 검증 (저장 직전에 호출)
     * @param record 검증할 레코드
     *
     * 검증 항목:
     *   1. voteType이 유효한 범위인지
     *   2. 해당 아티스트가 투표 허용되어 있는지
     */
    function _validateRecordCommon(VoteRecord calldata record) internal view {
        if (record.voteType > MAX_VOTE_TYPE)
            revert InvalidVoteType(record.voteType);
        if (!allowedArtist[record.missionId][record.optionId])
            revert ArtistNotAllowed(record.missionId, record.optionId);
    }

    /**
     * @dev 유저의 모든 레코드에 대한 해시 배열 생성
     * @param records 레코드 배열
     * @param user 레코드 소유자 주소
     * @return recordDigests 각 레코드의 해시 배열
     *
     * 처리 과정:
     *   1. 각 레코드의 문자열 길이 검증
     *   2. 유저 주소를 포함하여 해시 생성
     */
    function _buildRecordDigestsForUser(
        VoteRecord[] calldata records,
        address user
    ) internal pure returns (bytes32[] memory recordDigests) {
        uint256 len = records.length;
        recordDigests = new bytes32[](len);
        for (uint256 j; j < len; ) {
            _validateStrings(records[j]);
            // 해시 생성 시 유저 주소 주입 (보안 핵심)
            recordDigests[j] = _hashVoteRecord(records[j], user);
            unchecked {
                ++j;
            }
        }
    }

    /**
     * @dev 유저 배치 서명 검증
     * @param batch 유저의 투표 배치
     * @param userRecordDigests 미리 계산된 레코드 해시 배열
     * @param batchDigest 전체 배치 해시 (이벤트용)
     *
     * 검증 과정:
     *   1. 레코드 수가 MAX_RECORDS_PER_USER_BATCH 이하인지 확인
     *   2. 레코드 해시들을 하나의 해시로 합침 (recordsHash)
     *   3. EIP-712 다이제스트 생성
     *   4. 유저 서명 검증
     *   5. 유저 nonce 소비
     */
    function _verifyUserBatchSignature(
        UserVoteBatch calldata batch,
        bytes32[] memory userRecordDigests,
        bytes32 batchDigest
    ) internal {
        uint256 count = batch.records.length;
        UserBatchSig calldata userSig = batch.userBatchSig;

        if (count > MAX_RECORDS_PER_USER_BATCH) revert UserBatchTooLarge();

        // 모든 레코드 해시를 하나로 합침
        bytes32 recordsHash = keccak256(abi.encodePacked(userRecordDigests));

        // EIP-712 다이제스트 생성
        bytes32 userBatchDigest = _hashUserBatch(
            userSig.user,
            userSig.userNonce,
            recordsHash
        );

        // 서명 검증
        if (!_isValidSig(userSig.user, userBatchDigest, userSig.signature))
            revert InvalidSignature();

        // nonce 소비 (리플레이 방지)
        _consumeUserNonce(userSig.user, userSig.userNonce);

        emit UserBatchProcessed(
            batchDigest,
            userSig.user,
            userSig.userNonce,
            count
        );
    }

    /**
     * @dev 투표 레코드들을 스토리지에 저장
     * @param batches 모든 유저의 배치 배열
     * @param recordDigests 미리 계산된 레코드 해시 2차원 배열
     * @return storedCount 실제 저장된 레코드 수
     *
     * 저장 로직:
     *   1. votingAmt가 0이면 스킵 (무효 투표)
     *   2. 이미 consumed된 레코드면 스킵 (중복 방지)
     *   3. 아티스트 허용 여부 검증
     *   4. consumed 표시
     *   5. votes 매핑에 저장
     *   6. voteHashesByMissionVotingId에 해시 추가
     *   7. artistStats 집계 업데이트
     */
    function _storeVoteRecords(
        UserVoteBatch[] calldata batches,
        bytes32[][] memory recordDigests
    ) internal returns (uint256 storedCount) {
        uint256 userCount = batches.length;

        for (uint256 i; i < userCount; ) {
            address user = batches[i].userBatchSig.user;
            VoteRecord[] calldata userRecords = batches[i].records;
            uint256 userRecordLen = userRecords.length;

            for (uint256 j; j < userRecordLen; ) {
                VoteRecord calldata record = userRecords[j];
                bytes32 recordDigest = recordDigests[i][j];

                // 무효 투표(amount=0) 또는 이미 처리된 레코드는 스킵
                if (record.votingAmt == 0 || consumed[user][recordDigest]) {
                    unchecked {
                        ++j;
                    }
                    continue;
                }

                // 아티스트 허용 여부 등 검증
                _validateRecordCommon(record);

                // 중복 방지 표시
                consumed[user][recordDigest] = true;

                // 레코드 저장
                votes[recordDigest] = record;

                // 조회용 인덱스에 추가
                voteHashesByMissionVotingId[record.missionId][record.votingId]
                    .push(recordDigest);

                // 집계 업데이트
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

    // ========================================
    // 메인 진입점 (Main Entry Point)
    // ========================================

    /**
     * @notice 여러 유저의 투표 배치를 한 번에 제출
     * @param batches 유저별 투표 배치 배열
     * @param batchNonce 이 배치의 고유 nonce (리플레이 방지)
     * @param executorSig executorSigner의 서명
     *
     * @dev 이 함수는 누구나 호출할 수 있습니다.
     *      유효한 서명이 있다면 제3자도 제출 가능합니다.
     *      (가스비를 대신 내주는 메타트랜잭션 패턴)
     *
     * 처리 순서:
     *   1. 기본 검증 (빈 배치, 크기 제한, 체인 ID)
     *   2. executorSigner 서명 검증 및 nonce 소비
     *   3. 모든 레코드의 해시 계산 (유저 주소 포함)
     *   4. 각 유저의 서명 검증 및 nonce 소비
     *   5. 투표 레코드 저장 및 집계 업데이트
     *   6. 완료 이벤트 발생
     *
     * 가스 최적화:
     *   - unchecked 블록으로 오버플로우 체크 생략 (안전한 범위)
     *   - calldata 사용으로 메모리 복사 최소화
     *
     * 보안 고려사항:
     *   - Front-running: 제3자가 먼저 제출해도 결과는 동일
     *   - Replay: nonce와 chainId로 방지
     *   - 데이터 조작: EIP-712 서명으로 방지
     */
    function submitMultiUserBatch(
        UserVoteBatch[] calldata batches,
        uint256 batchNonce,
        bytes calldata executorSig
    ) external {
        uint256 userCount = batches.length;

        // 빈 배치 방지
        if (userCount == 0) revert InvalidRecordIndices();

        // 전체 레코드 수 계산 및 제한 검사
        uint256 totalRecords;
        for (uint256 i; i < userCount; ) {
            totalRecords += batches[i].records.length;
            unchecked {
                ++i;
            }
        }
        if (totalRecords > MAX_RECORDS_PER_BATCH) revert BatchTooLarge();

        // executorSigner 설정 확인
        if (executorSigner == address(0)) revert ZeroAddress();

        // 크로스체인 리플레이 방지
        if (block.chainid != CHAIN_ID) revert BadChain();

        // executor 서명 검증
        bytes32 batchDigest = _hashBatch(batchNonce);
        if (!_isValidSig(executorSigner, batchDigest, executorSig))
            revert InvalidSignature();
        _consumeBatchNonce(executorSigner, batchNonce);

        // 모든 레코드의 해시 미리 계산 (유저 주소 포함)
        bytes32[][] memory recordDigests = new bytes32[][](userCount);
        for (uint256 i; i < userCount; ) {
            address user = batches[i].userBatchSig.user;
            recordDigests[i] = _buildRecordDigestsForUser(
                batches[i].records,
                user
            );
            unchecked {
                ++i;
            }
        }

        // 각 유저의 서명 검증
        for (uint256 i; i < userCount; ) {
            _verifyUserBatchSignature(
                batches[i],
                recordDigests[i],
                batchDigest
            );
            unchecked {
                ++i;
            }
        }

        // 투표 저장
        uint256 stored = _storeVoteRecords(batches, recordDigests);

        emit BatchProcessed(
            batchDigest,
            executorSigner,
            batchNonce,
            stored,
            userCount
        );
    }

    // ========================================
    // 조회 함수 (View Functions)
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
     * @notice 특정 미션/투표 세션의 모든 투표 요약 조회
     * @param missionId 미션 ID
     * @param votingId 투표 세션 ID
     * @return 투표 요약 배열
     *
     * @dev votingId당 최대 20개 레코드로 제한되어 있어서
     *      페이지네이션 없이 전체 반환합니다.
     *
     * 반환 데이터:
     *   - timestamp: 투표 시간
     *   - missionId, votingId: 투표 세션 정보
     *   - userId: 유저 식별자
     *   - votingFor: 아티스트 이름
     *   - votedOn: 투표 타입 ("Remember" 또는 "Forget")
     *   - votingAmt: 투표 수량
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
            string memory artist = artistName[record.missionId][
                record.optionId
            ];
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
     * @notice 특정 아티스트의 투표 집계 조회
     * @param missionId 미션 ID
     * @param optionId 아티스트 옵션 ID
     * @return remember Remember 투표 총합
     * @return forget Forget 투표 총합
     * @return total 전체 투표 총합
     *
     * 사용 예:
     *   (uint256 r, uint256 f, uint256 t) = getArtistAggregates(1, 1);
     *   // r: BTS의 Remember 투표 수
     *   // f: BTS의 Forget 투표 수
     *   // t: BTS의 총 투표 수
     */
    function getArtistAggregates(
        uint256 missionId,
        uint256 optionId
    ) external view returns (uint256 remember, uint256 forget, uint256 total) {
        ArtistStats storage s = artistStats[missionId][optionId];
        return (s.remember, s.forget, s.total);
    }
}
