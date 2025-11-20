// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IERC1271 {
    function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4);
}

/**
 * @title Boosting
 * @notice 부스팅 기록 저장 컨트랙트 (MainVoting 기준 설계)
 * @dev 1트랜잭션 1서명 방식: 각 사용자가 자신의 레코드에 개별 서명
 *      이중 서명 검증: 사용자 서명 + Executor 서명
 *      MainVoting과 동일한 보안 수준 유지
 */
contract Boosting is Ownable2Step, EIP712 {
    // ========================================
    // Constants
    // ========================================
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;

    uint256 public constant MAX_RECORDS_PER_BATCH = 5000;
    uint256 public constant MAX_STRING_LENGTH = 100;
    uint256 public constant MAX_QUERY_LIMIT = 100;

    // ========================================
    // EIP-712 Type Hashes
    // ========================================
    bytes32 private constant BOOST_RECORD_TYPEHASH = keccak256(
        "BoostRecord(uint256 timestamp,uint256 missionId,uint256 boostingId,address userAddress,bytes32 userIdHash,bytes32 boostingForHash,bytes32 boostingWithHash,uint256 amt)"
    );

    bytes32 private constant USER_SIG_TYPEHASH = keccak256(
        "UserSig(address user,uint256 userNonce,bytes32 recordHash)"
    );

    bytes32 private constant BATCH_TYPEHASH = keccak256(
        "Batch(uint256 batchNonce)"
    );

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
    error InvalidRecordIndex();
    error BatchTooLarge();
    error StringTooLong();
    error UncoveredRecord(uint256 index);
    error DuplicateIndex(uint256 index);
    error LengthMismatch();
    error NotOwnerOrExecutor();

    // ========================================
    // Data Structures
    // ========================================
    struct BoostRecord {
        uint256 timestamp;
        uint256 missionId;
        uint256 boostingId;
        address userAddress;
        string userId;
        string boostingFor;
        string boostingWith;
        uint256 amt;
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
    mapping(bytes32 => BoostRecord) public boosts;
    mapping(uint256 => mapping(uint256 => bytes32[])) private boostHashesByBoostingId;

    mapping(address => mapping(uint256 => bool)) public userNonceUsed;
    mapping(address => uint256) public minUserNonce;

    mapping(address => mapping(uint256 => bool)) public batchNonceUsed;
    mapping(address => uint256) public minBatchNonce;

    mapping(bytes32 => bool) public consumed;

    uint256 public immutable CHAIN_ID;
    address public executorSigner;

    mapping(uint256 => mapping(uint256 => uint256)) public boostCount;
    mapping(uint256 => uint256) public boostCountByMission;

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

    event CancelUserNonceUpTo(
        address indexed user,
        uint256 newMinUserNonce
    );

    event CancelBatchNonceUpTo(
        address indexed executorSigner,
        uint256 newMinBatchNonce
    );

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
        emit ExecutorSignerChanged(oldSigner, s, oldMinNonce);
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
        return keccak256(
            abi.encode(
                BOOST_RECORD_TYPEHASH,
                record.timestamp,
                record.missionId,
                record.boostingId,
                record.userAddress,
                keccak256(bytes(record.userId)),
                keccak256(bytes(record.boostingFor)),
                keccak256(bytes(record.boostingWith)),
                record.amt
            )
        );
    }

    function _hashUserSig(
        address user,
        uint256 userNonce,
        bytes32 recordHash
    ) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    USER_SIG_TYPEHASH,
                    user,
                    userNonce,
                    recordHash
                )
            )
        );
    }

    function _hashBatch(
        uint256 batchNonce
    ) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(abi.encode(BATCH_TYPEHASH, batchNonce))
        );
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
        if (bytes(record.boostingFor).length > MAX_STRING_LENGTH) {
            revert StringTooLong();
        }
        if (bytes(record.boostingWith).length > MAX_STRING_LENGTH) {
            revert StringTooLong();
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
    // Internal: User Signature Verification
    // ========================================
    function _verifyUserSignature(
        BoostRecord[] calldata records,
        UserSig calldata userSig,
        bool[] memory covered,
        bytes32[] memory recordDigests,
        bytes32 batchDigest
    ) internal {
        uint256 idx = userSig.recordIndex;

        if (idx >= records.length) revert InvalidRecordIndex();
        if (covered[idx]) revert DuplicateIndex(idx);
        covered[idx] = true;

        BoostRecord calldata record = records[idx];
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

        emit UserBoostProcessed(
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
        BoostRecord[] calldata records,
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
    // Internal: Store
    // ========================================
    function _storeBoostRecords(
        BoostRecord[] calldata records,
        bytes32[] memory recordDigests
    ) internal returns (uint256 storedCount) {
        uint256 len = records.length;

        for (uint256 i; i < len; ) {
            BoostRecord calldata record = records[i];

            if (record.amt == 0) {
                unchecked {
                    ++i;
                }
                continue;
            }

            if (record.userAddress == address(0)) revert ZeroAddress();

            bytes32 recordDigest = recordDigests[i];

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

        bool[] memory covered = new bool[](len);
        _verifyAllUserCoverage(
            records,
            userSigs,
            covered,
            recordDigests,
            batchDigest
        );
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

    function getBoostCount(uint256 missionId) external view returns (uint256) {
        return boostCountByMission[missionId];
    }

    function getBoostCountByBoostingId(
        uint256 missionId,
        uint256 boostingId
    ) external view returns (uint256) {
        return boostCount[missionId][boostingId];
    }

    function getBoostHashesByBoostingId(
        uint256 missionId,
        uint256 boostingId,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory) {
        if (limit > MAX_QUERY_LIMIT) revert BatchTooLarge();

        bytes32[] storage allHashes = boostHashesByBoostingId[missionId][
            boostingId
        ];
        uint256 total = allHashes.length;

        if (offset >= total) {
            return new bytes32[](0);
        }

        uint256 end = offset + limit;
        if (end > total) end = total;

        uint256 n = end - offset;
        bytes32[] memory out = new bytes32[](n);
        for (uint256 i; i < n; ) {
            out[i] = allHashes[offset + i];
            unchecked {
                ++i;
            }
        }
        return out;
    }

    function getBoostsByBoostingId(
        uint256 missionId,
        uint256 boostingId,
        uint256 offset,
        uint256 limit
    ) external view returns (BoostRecord[] memory) {
        if (limit > MAX_QUERY_LIMIT) revert BatchTooLarge();

        bytes32[] storage allHashes = boostHashesByBoostingId[missionId][
            boostingId
        ];
        uint256 total = allHashes.length;

        if (offset >= total) {
            return new BoostRecord[](0);
        }

        uint256 end = offset + limit;
        if (end > total) end = total;

        uint256 n = end - offset;
        BoostRecord[] memory out = new BoostRecord[](n);
        for (uint256 i; i < n; ) {
            out[i] = boosts[allHashes[offset + i]];
            unchecked {
                ++i;
            }
        }
        return out;
    }

    function hashBoostRecordPreview(
        BoostRecord calldata record
    ) external pure returns (bytes32) {
        return _hashBoostRecord(record);
    }

    function hashUserSigPreview(
        address user,
        uint256 userNonce,
        BoostRecord calldata record
    ) external view returns (bytes32) {
        _validateStrings(record);
        bytes32 recordHash = _hashBoostRecord(record);
        return _hashUserSig(user, userNonce, recordHash);
    }

    function hashBatchPreview(
        uint256 batchNonce
    ) external view returns (bytes32) {
        return _hashBatch(batchNonce);
    }
}
