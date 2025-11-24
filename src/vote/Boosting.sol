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
 * @title Boosting
 * @notice 부스팅 기록 저장 컨트랙트
 * @dev 1트랜잭션 1서명 방식: 각 사용자가 자신의 레코드에 개별 서명
 *      이중 서명 검증: 사용자 서명 + Executor 서명
 */
contract Boosting is Ownable2Step, EIP712 {
    // ========================================
    // Constants
    // ========================================
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;

    uint256 public constant MAX_RECORDS_PER_BATCH = 5000;
    uint256 public constant MAX_STRING_LENGTH = 100;

    // 부스팅 타입 상수 (0=BP, 1=CELB)
    uint8 public constant MAX_BOOST_TYPE = 1;  // 0=BP, 1=CELB

    // ========================================
    // EIP-712 Type Hashes
    // ========================================
    bytes32 private constant BOOST_RECORD_TYPEHASH =
        keccak256(
            "BoostRecord(uint256 timestamp,uint256 missionId,uint256 boostingId,address userAddress,uint256 artistId,uint8 boostingWith,uint256 amt)"
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
    error ZeroAmt();
    error UserNonceAlreadyUsed();
    error UserNonceTooLow();
    error BatchNonceAlreadyUsed();
    error BatchNonceTooLow();
    error BatchTooLarge();
    error StringTooLong();
    error LengthMismatch();
    error NotOwnerOrExecutor();
    error ArtistNotAllowed(uint256 missionId, uint256 artistId);
    error InvalidBoostType(uint8 boostType);

    // ========================================
    // Data Structures
    // ========================================
    struct BoostRecord {
        uint256 timestamp;
        uint256 missionId;
        uint256 boostingId;
        address userAddress;
        string userId;
        uint256 artistId;
        uint8 boostingWith;
        uint256 amt;
    }

    struct UserSig {
        address user;
        uint256 userNonce;
        bytes signature;
    }

    // ========================================
    // Storage
    // ========================================
    mapping(bytes32 => BoostRecord) public boosts;
    mapping(uint256 => mapping(uint256 => bytes32[]))
        private boostHashesByBoostingId;

    mapping(address => mapping(uint256 => bool)) public userNonceUsed;
    mapping(address => uint256) public minUserNonce;

    mapping(address => mapping(uint256 => bool)) public batchNonceUsed;
    mapping(address => uint256) public minBatchNonce;

    mapping(bytes32 => bool) public consumed;

    uint256 public immutable CHAIN_ID;
    address public executorSigner;

    mapping(uint256 => mapping(uint256 => uint256)) public boostCount;
    mapping(uint256 => uint256) public boostCountByMission;

    // === 아티스트 관리 (MainVoting 패턴) ===

    // 아티스트 이름: missionId => artistId => name
    mapping(uint256 => mapping(uint256 => string)) public artistName;

    // 아티스트 허용 여부: missionId => artistId => allowed
    mapping(uint256 => mapping(uint256 => bool)) public allowedArtist;

    // 부스팅 타입 이름: typeId => name (0=Like, 1=Share, 2=Comment 등)
    mapping(uint8 => string) public boostingTypeName;

    // === 실시간 집계 ===

    // 아티스트별 총 부스팅 포인트: missionId => artistId => totalAmt
    mapping(uint256 => mapping(uint256 => uint256)) public artistTotalAmt;

    // ========================================
    // Events
    // ========================================
    event ExecutorSignerChanged(
        address indexed oldSigner,
        address indexed newSigner,
        uint256 oldMinNonce
    );

    event UserBoostProcessed(
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

    // === 아티스트 관리 이벤트 ===
    event ArtistSet(
        uint256 indexed missionId,
        uint256 indexed artistId,
        string name,
        bool allowed
    );
    event BoostingTypeSet(uint8 indexed typeId, string name);

    // ========================================
    // Constructor
    // ========================================
    constructor(
        address initialOwner
    ) EIP712("Boosting", "1") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        CHAIN_ID = block.chainid;
    }

    // ========================================
    // Admin Functions
    // ========================================
    function setExecutorSigner(address s) external onlyOwner {
        if (s == address(0)) revert ZeroAddress();

        address oldSigner = executorSigner;
        uint256 oldMinNonce = minBatchNonce[oldSigner];

        if (oldSigner != address(0)) {
            minBatchNonce[oldSigner] = type(uint256).max;
        }

        executorSigner = s;
        // 새 서명자의 minBatchNonce를 0으로 초기화 (재등록 시 DoS 방지)
        minBatchNonce[s] = 0;
        emit ExecutorSignerChanged(oldSigner, s, oldMinNonce);
    }

    /**
     * @notice 아티스트 등록 및 활성화 관리
     * @dev MainVoting의 setCandidate와 동일 패턴
     * @param missionId 미션 ID
     * @param artistId 아티스트 ID
     * @param name 아티스트 이름
     * @param allowed_ 부스팅 허용 여부
     */
    function setArtist(
        uint256 missionId,
        uint256 artistId,
        string calldata name,
        bool allowed_
    ) external onlyOwner {
        artistName[missionId][artistId] = name;
        allowedArtist[missionId][artistId] = allowed_;
        emit ArtistSet(missionId, artistId, name, allowed_);
    }

    /**
     * @notice 부스팅 타입 이름 설정
     * @dev MainVoting의 setVoteTypeName과 동일 패턴
     * @param typeId 부스팅 타입 ID (0~MAX_BOOST_TYPE)
     * @param name 부스팅 타입 이름
     */
    function setBoostingTypeName(
        uint8 typeId,
        string calldata name
    ) external onlyOwner {
        if (typeId > MAX_BOOST_TYPE) revert InvalidBoostType(typeId);
        boostingTypeName[typeId] = name;
        emit BoostingTypeSet(typeId, name);
    }

    // ========================================
    // Nonce Management
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
    // Internal: Hash Functions
    // ========================================
    function _hashBoostRecord(
        BoostRecord calldata record
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    BOOST_RECORD_TYPEHASH,
                    record.timestamp,
                    record.missionId,
                    record.boostingId,
                    record.userAddress,
                    record.artistId,
                    record.boostingWith,
                    record.amt
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

    // ========================================
    // Internal: Data Validation
    // ========================================
    function _validateStrings(BoostRecord calldata record) internal pure {
        if (bytes(record.userId).length > MAX_STRING_LENGTH) {
            revert StringTooLong();
        }
    }

    function _validateRecordCommon(BoostRecord calldata record) internal view {
        if (record.userAddress == address(0)) revert ZeroAddress();
        if (record.boostingWith > MAX_BOOST_TYPE) {
            revert InvalidBoostType(record.boostingWith);
        }
        if (!allowedArtist[record.missionId][record.artistId]) {
            revert ArtistNotAllowed(record.missionId, record.artistId);
        }
    }

    function _buildRecordDigests(
        BoostRecord[] calldata records
    ) internal pure returns (bytes32[] memory recordDigests) {
        uint256 len = records.length;
        recordDigests = new bytes32[](len);

        for (uint256 i; i < len; ) {
            _validateStrings(records[i]);
            recordDigests[i] = _hashBoostRecord(records[i]);
            unchecked {
                ++i;
            }
        }
    }

    // ========================================
    // Internal: User Signature Verification (1:1)
    // ========================================
    function _verifyUserSignature(
        BoostRecord calldata record,
        UserSig calldata userSig,
        bytes32 recordHash,
        bytes32 batchDigest
    ) internal {
        if (record.userAddress != userSig.user) revert InvalidSignature();

        bytes32 userSigDigest = _hashUserSig(
            userSig.user,
            userSig.userNonce,
            recordHash
        );

        if (!_isValidSig(userSig.user, userSigDigest, userSig.signature)) {
            revert InvalidSignature();
        }

        _consumeUserNonce(userSig.user, userSig.userNonce);

        emit UserBoostProcessed(batchDigest, userSig.user, userSig.userNonce);
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
        BoostRecord[] calldata records,
        UserSig[] calldata userSigs,
        bytes32[] memory recordDigests,
        bytes32 batchDigest
    ) internal {
        uint256 len = records.length;
        if (len != userSigs.length) revert LengthMismatch();

        for (uint256 i; i < len; ) {
            _verifyUserSignature(
                records[i],
                userSigs[i],
                recordDigests[i],
                batchDigest
            );
            unchecked {
                ++i;
            }
        }
    }

    // ========================================
    // Internal: Store
    // ========================================
    function _storeBoostRecords(
        BoostRecord[] calldata records,
        bytes32[] memory recordDigests
    ) internal returns (uint256 storedCount) {
        uint256 len = records.length;

        for (uint256 i; i < len; ) {
            BoostRecord calldata record = records[i];

            // 0포인트 부스팅 스킵
            if (record.amt == 0) {
                unchecked {
                    ++i;
                }
                continue;
            }

            // 공통 검증 (아티스트 허용 여부)
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

            bytes32 boostHash = recordDigest;
            boosts[boostHash] = record;

            boostHashesByBoostingId[record.missionId][record.boostingId].push(
                boostHash
            );

            boostCount[record.missionId][record.boostingId] += 1;
            boostCountByMission[record.missionId] += 1;

            // 실시간 집계 (아티스트별 총 amt)
            artistTotalAmt[record.missionId][record.artistId] += record.amt;

            unchecked {
                ++storedCount;
                ++i;
            }
        }
    }

    // ========================================
    // Main: Submit Batch
    // ========================================
    function submitBoostBatch(
        BoostRecord[] calldata records,
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

        _verifyAllUserCoverage(records, userSigs, recordDigests, batchDigest);
        uint256 userSigLen = userSigs.length;

        uint256 stored = _storeBoostRecords(records, recordDigests);

        emit BatchProcessed(
            batchDigest,
            executorSigner,
            batchNonce,
            stored,
            userSigLen
        );
    }

    // ========================================
    // View Functions
    // ========================================
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function getBoostByHash(
        bytes32 boostHash
    ) external view returns (BoostRecord memory) {
        return boosts[boostHash];
    }

    struct BoostRecordSummary {
        uint256 timestamp;
        uint256 missionId;
        uint256 boostingId;
        string userId;
        string boostingFor; // artistName[missionId][artistId]
        string boostingWith; // boostingTypeName[boostingWith]
        uint256 amt;
    }

    /**
     * @notice 부스팅 요약 조회 (문자열 변환)
     * @dev SubVoting의 getVoteSummariesByMissionVotingId와 동일 패턴
     *      artistId를 artistName으로, boostingWith를 boostingTypeName으로 변환
     * @param missionId 미션 ID
     * @param boostingId 부스팅 ID
     * @return BoostRecordSummary[] 부스팅 요약 배열
     */
    function getBoostSummariesByBoostingId(
        uint256 missionId,
        uint256 boostingId
    ) external view returns (BoostRecordSummary[] memory) {
        bytes32[] storage allHashes = boostHashesByBoostingId[missionId][
            boostingId
        ];
        uint256 totalCount = allHashes.length;
        BoostRecordSummary[] memory result = new BoostRecordSummary[](
            totalCount
        );

        for (uint256 i; i < totalCount; ) {
            BoostRecord storage record = boosts[allHashes[i]];

            string memory artistNameStr = artistName[record.missionId][
                record.artistId
            ];
            string memory boostingTypeStr = boostingTypeName[
                record.boostingWith
            ];

            result[i] = BoostRecordSummary({
                timestamp: record.timestamp,
                missionId: record.missionId,
                boostingId: record.boostingId,
                userId: record.userId,
                boostingFor: artistNameStr,
                boostingWith: boostingTypeStr,
                amt: record.amt
            });
            unchecked {
                ++i;
            }
        }

        return result;
    }

    // ========================================
    // View: 아티스트 집계 조회
    // ========================================

    /**
     * @notice 아티스트별 총 부스팅 포인트 조회
     * @param missionId 미션 ID
     * @param artistId 아티스트 ID
     * @return 해당 아티스트의 총 부스팅 포인트
     */
    function getArtistTotalAmt(
        uint256 missionId,
        uint256 artistId
    ) external view returns (uint256) {
        return artistTotalAmt[missionId][artistId];
    }

    /**
     * @notice 아티스트 정보 구조체
     */
    struct ArtistInfo {
        string artistName;
        bool allowed;
        uint256 totalAmt;
    }

    /**
     * @notice 아티스트 정보 조회 (이름, 허용 여부, 총 amt)
     * @param missionId 미션 ID
     * @param artistId 아티스트 ID
     * @return ArtistInfo 아티스트 정보
     */
    function getArtistInfo(
        uint256 missionId,
        uint256 artistId
    ) external view returns (ArtistInfo memory) {
        return
            ArtistInfo({
                artistName: artistName[missionId][artistId],
                allowed: allowedArtist[missionId][artistId],
                totalAmt: artistTotalAmt[missionId][artistId]
            });
    }

    // ========================================
    // View: Hash Preview Functions
    // ========================================

    function hashBoostRecord(
        BoostRecord calldata record
    ) external pure returns (bytes32) {
        return _hashBoostRecord(record);
    }

    function hashUserSigPreview(
        address user,
        uint256 userNonce,
        bytes32 recordHash
    ) external view returns (bytes32) {
        return _hashUserSig(user, userNonce, recordHash);
    }

    function hashBatchPreview(
        uint256 batchNonce
    ) external view returns (bytes32) {
        return _hashBatch(batchNonce);
    }
}
