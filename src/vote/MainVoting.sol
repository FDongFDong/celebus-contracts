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
 * @title MainVoting
 * @notice 다중 사용자 투표를 배치 처리하는 컨트랙트
 * @dev 2단계 서명 검증 구조:
 *      1) Executor 서명: 배치 전체의 유효성 보장
 *      2) User 서명: 개별 사용자의 투표 의사 확인
 *
 *      Nonce 시스템으로 리플레이 공격 방지:
 *      - batchNonce: Executor별 배치 순서 보장
 *      - userNonce: 사용자별 투표 순서 보장
 */
contract MainVoting is Ownable2Step, EIP712 {
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

    /// @notice 투표 타입: 0=Forget, 1=Remember
    uint8 public constant MAX_VOTE_TYPE = 1;
    uint8 public constant VOTE_TYPE_FORGET = 0;
    uint8 public constant VOTE_TYPE_REMEMBER = 1;

    // UserBatchFailed / UserVoteResult 이벤트용 실패 사유 코드
    uint8 private constant REASON_USER_BATCH_TOO_LARGE = 1;
    uint8 private constant REASON_INVALID_USER_SIGNATURE = 2;
    uint8 private constant REASON_USER_NONCE_INVALID = 3;
    uint8 private constant REASON_INVALID_VOTE_TYPE = 4;
    uint8 private constant REASON_ARTIST_NOT_ALLOWED = 5;

    // EIP-712 TypeHash: 서명 검증용 구조체 해시
    bytes32 private constant VOTE_RECORD_TYPEHASH =
        keccak256(
            "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 optionId,uint8 voteType,uint256 votingAmt,address user)"
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
    error BatchNonceInvalid();
    error UserNonceTooLow();
    error BatchNonceTooLow();
    error InvalidRecordIndices();
    error BatchTooLarge();
    error UserBatchTooLarge();
    error StringTooLong();
    error NotOwnerOrExecutor();
    error ArtistNotAllowed(uint256 missionId, uint256 optionId);
    error InvalidVoteType(uint8 value);
    error NoSuccessfulUser();

    // ============================================================
    //                         구조체 (Structs)
    // ============================================================

    /// @notice 개별 투표 레코드
    struct VoteRecord {
        uint256 timestamp; // 투표 시각 (Unix timestamp)
        uint256 missionId; // 미션 ID
        uint256 votingId; // 투표 ID
        uint256 optionId; // 선택한 아티스트 ID
        uint8 voteType; // 0=Forget, 1=Remember
        string userId; // 사용자 식별자 (off-chain)
        uint256 votingAmt; // 투표 수량
    }

    /// @notice 사용자의 배치 서명 정보
    struct UserBatchSig {
        address user; // 서명자 주소
        uint256 userNonce; // 리플레이 방지용 순차 번호
        bytes signature; // EIP-712 서명
    }

    /// @notice 사용자별 투표 묶음 (레코드 + 서명)
    struct UserVoteBatch {
        VoteRecord[] records;
        UserBatchSig userBatchSig;
    }

    /// @notice 조회용 투표 요약 (artistName, voteTypeName 포함)
    struct VoteRecordSummary {
        uint256 timestamp;
        uint256 missionId;
        uint256 votingId;
        string userId;
        string votingFor; // 아티스트 이름
        string votedOn; // 투표 타입 이름
        uint256 votingAmt;
    }

    /// @notice 아티스트별 투표 통계
    struct ArtistStats {
        uint256 remember; // Remember 투표 총량
        uint256 forget; // Forget 투표 총량
        uint256 total; // 전체 투표 총량
    }

    // ============================================================
    //                      상태 변수 (State Variables)
    // ============================================================

    /// @notice 투표 레코드 저장소 (recordDigest => VoteRecord)
    mapping(bytes32 => VoteRecord) public votes;

    /// @notice 미션/투표별 레코드 해시 목록 (조회용)
    mapping(uint256 => mapping(uint256 => bytes32[]))
        private voteHashesByMissionVotingId;

    /// @notice 사용자별 다음 예상 Nonce (순차 카운터, 0부터 시작)
    mapping(address => uint256) public userNonce;

    /// @notice Executor별 다음 예상 배치 Nonce (순차 카운터)
    mapping(address => uint256) public batchNonce;

    /// @notice 중복 투표 방지 (user => recordDigest => consumed)
    mapping(address => mapping(bytes32 => bool)) public consumed;

    /// @notice 배포 시 체인 ID (크로스체인 리플레이 방지)
    uint256 public immutable CHAIN_ID;

    /// @notice 배치 제출 권한을 가진 Executor 주소
    address public executorSigner;

    /// @notice 아티스트 이름 (missionId => optionId => name)
    mapping(uint256 => mapping(uint256 => string)) public artistName;

    /// @notice 아티스트 투표 허용 여부 (missionId => optionId => allowed)
    mapping(uint256 => mapping(uint256 => bool)) public allowedArtist;

    /// @notice 투표 타입 이름 (0 => "Forget", 1 => "Remember")
    mapping(uint8 => string) public voteTypeName;

    /// @notice 아티스트별 투표 통계 (missionId => optionId => stats)
    mapping(uint256 => mapping(uint256 => ArtistStats)) public artistStats;

    // ============================================================
    //                         이벤트 (Events)
    // ============================================================

    event ExecutorSignerChanged(
        address indexed oldSigner,
        address indexed newSigner
    );

    /// @notice 사용자 배치 처리 성공
    event UserBatchProcessed(
        bytes32 indexed batchDigest,
        address indexed user,
        uint256 userNonce,
        uint256 recordCount
    );

    /// @notice 사용자 배치 처리 실패 (reasonCode로 원인 파악)
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
    event UserVoteResult(
        uint256 indexed votingId,
        bool success,
        uint256[] failedOptionIds,
        uint8 reasonCode
    );

    event SetUserNonce(address indexed user, uint256 newNonce);
    event SetBatchNonce(address indexed executorSigner, uint256 newNonce);
    event ArtistSet(
        uint256 indexed missionId,
        uint256 indexed optionId,
        string name,
        bool allowed
    );
    event VoteTypeSet(uint8 indexed voteType, string name);

    // ============================================================
    //                      생성자 & 관리 함수
    // ============================================================

    constructor(
        address initialOwner
    ) EIP712("MainVoting", "1") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        CHAIN_ID = block.chainid;
    }

    /// @notice Executor 주소 설정 (배치 제출 권한 부여)
    function setExecutorSigner(address s) external onlyOwner {
        if (s == address(0)) revert ZeroAddress();
        address oldSigner = executorSigner;
        batchNonce[s] = 0;
        executorSigner = s;
        emit ExecutorSignerChanged(oldSigner, s);
    }

    /// @notice 아티스트 등록/수정
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

    /// @notice 투표 타입 이름 설정
    function setVoteTypeName(
        uint8 voteType,
        string calldata name
    ) external onlyOwner {
        if (voteType > MAX_VOTE_TYPE) revert InvalidVoteType(voteType);
        voteTypeName[voteType] = name;
        emit VoteTypeSet(voteType, name);
    }

    /// @notice 사용자 Nonce 강제 설정 (증가 방향만 허용, 리플레이 방지)
    function setUserNonce(address user, uint256 newNonce) external onlyOwner {
        if (newNonce < userNonce[user]) revert UserNonceTooLow();
        userNonce[user] = newNonce;
        emit SetUserNonce(user, newNonce);
    }

    /// @notice 배치 Nonce 강제 설정 (Owner 또는 Executor만 가능)
    function setBatchNonce(uint256 newNonce) external {
        if (msg.sender != owner() && msg.sender != executorSigner)
            revert NotOwnerOrExecutor();
        if (newNonce < batchNonce[executorSigner]) revert BatchNonceTooLow();
        batchNonce[executorSigner] = newNonce;
        emit SetBatchNonce(executorSigner, newNonce);
    }

    // ============================================================
    //                      내부 함수 (Internal)
    // ============================================================

    /// @dev 개별 투표 레코드의 EIP-712 해시 생성
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

    function _validateStrings(VoteRecord calldata record) internal pure {
        if (bytes(record.userId).length > MAX_STRING_LENGTH)
            revert StringTooLong();
    }

    /// @dev 사용자의 모든 레코드에 대해 해시 배열 생성
    function _buildRecordDigestsForUser(
        VoteRecord[] calldata records,
        address user
    ) internal pure returns (bytes32[] memory recordDigests) {
        uint256 len = records.length;
        recordDigests = new bytes32[](len);
        for (uint256 j; j < len; ) {
            _validateStrings(records[j]);
            recordDigests[j] = _hashVoteRecord(records[j], user);
            unchecked {
                ++j;
            }
        }
    }

    /// @dev 배치 Nonce 검증 및 증가 (순차 처리 보장)
    function _consumeBatchNonce(address signer, uint256 nonce_) internal {
        uint256 expected = batchNonce[signer];
        if (nonce_ != expected) revert BatchNonceInvalid();

        unchecked {
            batchNonce[signer] = expected + 1;
        }
    }

    /**
     * @dev 사용자 배치 검증 (Soft-fail 방식)
     *      실패 시 revert 대신 (false, reasonCode) 반환 + 이벤트 발생
     *      → 다른 사용자의 투표는 계속 처리 가능
     *
     * 검증 순서:
     * 1) 레코드 개수 검증
     * 2) 각 레코드의 voteType, 아티스트 허용 여부
     * 3) EIP-712 서명 검증
     * 4) userNonce 순차 검증
     *
     * @return ok         배치 검증 성공 여부
     * @return reasonCode 실패 시 실패 사유 코드 (성공 시 0)
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

        // 2) 각 레코드 검증
        for (uint256 j; j < count; ) {
            VoteRecord calldata record = batch.records[j];
            if (record.voteType > MAX_VOTE_TYPE) {
                reasonCode = REASON_INVALID_VOTE_TYPE;
                emit UserBatchFailed(batchDigest, user, nonce_, reasonCode);
                return (false, reasonCode);
            }
            if (!allowedArtist[record.missionId][record.optionId]) {
                reasonCode = REASON_ARTIST_NOT_ALLOWED;
                emit UserBatchFailed(batchDigest, user, nonce_, reasonCode);
                return (false, reasonCode);
            }
            unchecked {
                ++j;
            }
        }

        // 3) 서명 검증
        bytes32 recordsHash = keccak256(abi.encodePacked(userRecordDigests));
        bytes32 userBatchDigest = _hashUserBatch(user, nonce_, recordsHash);

        if (!_isValidSig(user, userBatchDigest, userSig.signature)) {
            reasonCode = REASON_INVALID_USER_SIGNATURE;
            emit UserBatchFailed(batchDigest, user, nonce_, reasonCode);
            return (false, reasonCode);
        }

        // 4) Nonce 순차 검증
        uint256 expected = userNonce[user];
        if (nonce_ != expected) {
            reasonCode = REASON_USER_NONCE_INVALID;
            emit UserBatchFailed(batchDigest, user, nonce_, reasonCode);
            return (false, reasonCode);
        }

        unchecked {
            userNonce[user] = expected + 1;
        }

        emit UserBatchProcessed(batchDigest, user, nonce_, count);
        return (true, 0);
    }

    /**
     * @dev 검증 통과한 사용자들의 투표 레코드 저장
     *      - 중복 방지: consumed 체크
     *      - votingAmt=0인 레코드 스킵
     *      - 아티스트별 통계 업데이트
     *      - votingId 단위 UserVoteResult 이벤트 발생
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
                    // 전제: 유저 배치의 모든 레코드는 동일한 votingId
                    uint256 votingId_ = userRecords[0].votingId;

                    // 실패한 옵션ID 목록 (이번 배치에 포함된 전체 옵션ID)
                    uint256[] memory failedOptionIds = new uint256[](
                        userRecordLen
                    );
                    for (uint256 j; j < userRecordLen; ) {
                        failedOptionIds[j] = userRecords[j].optionId;
                        unchecked {
                            ++j;
                        }
                    }

                    emit UserVoteResult(
                        votingId_,
                        false, // 하나라도 실패 → 전체 실패
                        failedOptionIds,
                        userReason[i] // 검증 단계에서 설정된 실패 코드
                    );
                }
                unchecked {
                    ++i;
                }
                continue;
            }

            // 여기부터는 유저 배치 검증 통과 → 실제 저장 로직
            address user = ub.userBatchSig.user;

            // 전제: 유저의 모든 레코드는 동일한 votingId
            uint256 votingId = userRecordLen > 0 ? userRecords[0].votingId : 0;

            for (uint256 j; j < userRecordLen; ) {
                VoteRecord calldata record = userRecords[j];
                bytes32 recordDigest = recordDigests[i][j];

                // 중복 또는 빈 투표 스킵
                if (record.votingAmt == 0 || consumed[user][recordDigest]) {
                    unchecked {
                        ++j;
                    }
                    continue;
                }

                // 저장
                consumed[user][recordDigest] = true;
                votes[recordDigest] = record;
                voteHashesByMissionVotingId[record.missionId][record.votingId]
                    .push(recordDigest);

                // 통계 업데이트
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

            // 검증 + 저장까지 완료된 votingId에 대한 결과 이벤트
            if (userRecordLen > 0) {
                emit UserVoteResult(
                    votingId,
                    true, // 검증에 통과했고, 저장 시 치명 오류는 없음
                    new uint256[](0), // 실패 옵션 없음
                    0 // 성공이므로 실패 코드 0
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
            // 성공 시 reason=0, 실패 시 reason>0
            userReason[i] = reason;

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
                votingFor: artistName[record.missionId][record.optionId],
                votedOn: voteTypeName[record.voteType],
                votingAmt: record.votingAmt
            });
        }
        return result;
    }

    /// @notice 아티스트별 투표 집계 조회
    /// @return remember Remember 투표량
    /// @return forget Forget 투표량
    /// @return total 전체 투표량
    function getArtistAggregates(
        uint256 missionId,
        uint256 optionId
    ) external view returns (uint256, uint256, uint256) {
        ArtistStats storage s = artistStats[missionId][optionId];
        return (s.remember, s.forget, s.total);
    }
}
