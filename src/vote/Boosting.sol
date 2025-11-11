// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IERC1271 {
    function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4);
}

/**
 * @title Boosting
 * @notice 부스팅 기록 저장 컨트랙트
 * @dev (유저 개별 서명 + 실행자 배치 서명) 이중 검증, 리플레이/끼워넣기 방지, O(1) 페이지네이션
 */
contract Boosting is Ownable2Step, ReentrancyGuard, EIP712 {
    // ========================================
    // Constants
    // ========================================
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;

    uint256 private constant MAX_BATCH_SIZE = 500;
    uint256 private constant MAX_STRING_LENGTH = 100;

    uint256 public constant MAX_BOOSTS_PER_BOOSTING = 100_000;
    uint256 public constant MAX_QUERY_LIMIT = 100;

    // ========================================
    // EIP-712 Type Hashes
    // ========================================
    bytes32 private constant BOOST_RECORD_TYPEHASH = keccak256(
        "BoostRecord(uint256 timestamp,uint256 missionId,uint256 boostingId,address userAddress,string userId,string boostingFor,string boostingWith,uint256 amt,uint256 nonce,uint256 deadline)"
    );

    bytes32 private constant BATCH_TYPEHASH = keccak256(
        "Batch(uint256 chainId,bytes32 itemsHash,uint256 batchNonce)"
    );

    // ========================================
    // Errors
    // ========================================
    error ZeroAddress();
    error ExpiredSignature();
    error InvalidSignature();
    error BadChain();
    error ZeroAmt();
    error UserNonceAlreadyUsed();
    error UserNonceTooLow();
    error BatchNonceAlreadyUsed();
    error BatchNonceTooLow();
    error LengthMismatch();
    error BatchTooLarge();
    error StringTooLong();
    error AlreadyProcessed();
    error QueryLimitExceeded();
    error BoostingCapacityExceeded();

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

    // ========================================
    // Storage
    // ========================================
    // (구) 하위호환 배열은 더 이상 push 하지 않음 — 가스 DoS 방지
    mapping(uint256 => BoostRecord[]) public eventBoosts;

    mapping(bytes32 => BoostRecord) public boosts; // boostHash => record

    mapping(uint256 => mapping(uint256 => uint256)) public boostCount;        // missionId => boostingId => count
    mapping(uint256 => uint256) public boostCountByMission;                   // missionId => total

    mapping(uint256 => mapping(uint256 => bytes32[])) private boostHashesByBoostingId; // for pagination

    mapping(address => mapping(uint256 => bool)) public userNonceUsed;
    mapping(address => uint256) public minUserNonce;

    mapping(address => mapping(uint256 => bool)) public batchNonceUsed;
    mapping(address => uint256) public minBatchNonce;

    mapping(bytes32 => bool) public consumed; // recordDigest 사용 여부

    uint256 public immutable CHAIN_ID;
    address public executorSigner;

    // ========================================
    // Events
    // ========================================
    event ExecutorSignerChanged(address indexed oldSigner, address indexed newSigner, uint256 oldMinNonce);

    event BoostRecordAdded(
        bytes32 indexed boostHash,
        bytes32 indexed batchDigest,
        uint256 indexed missionId,
        uint256 boostingId,
        address userAddress,
        string userId,
        string boostingFor,
        string boostingWith,
        uint256 amt,
        uint256 timestamp
    );

    event BatchProcessed(
        bytes32 indexed batchDigest,
        address indexed executorSigner,
        uint256 batchNonce,
        uint256 recordCount
    );

    event CancelUserNonceUpTo(address indexed user, uint256 newMinUserNonce);
    event CancelBatchNonceUpTo(address indexed executorSigner, uint256 newMinBatchNonce);

    // ========================================
    // Constructor
    // ========================================
    constructor(address initialOwner) EIP712("Boosting", "1") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        CHAIN_ID = block.chainid;
    }

    // ========================================
    // Admin
    // ========================================
    function setExecutorSigner(address s) external onlyOwner {
        if (s == address(0)) revert ZeroAddress();

        address oldSigner = executorSigner;
        uint256 oldMin = minBatchNonce[oldSigner];

        // 이전 서명자의 논스 전부 무효화
        if (oldSigner != address(0)) {
            minBatchNonce[oldSigner] = type(uint256).max;
        }

        executorSigner = s;
        emit ExecutorSignerChanged(oldSigner, s, oldMin);
    }

    function cancelAllUserNonceUpTo(uint256 newMinUserNonce) external {
        if (newMinUserNonce <= minUserNonce[msg.sender]) revert UserNonceTooLow();
        minUserNonce[msg.sender] = newMinUserNonce;
        emit CancelUserNonceUpTo(msg.sender, newMinUserNonce);
    }

    function cancelAllBatchNonceUpTo(uint256 newMinBatchNonce) external {
        if (msg.sender != owner() && msg.sender != executorSigner) revert InvalidSignature();
        if (newMinBatchNonce <= minBatchNonce[executorSigner]) revert BatchNonceTooLow();
        minBatchNonce[executorSigner] = newMinBatchNonce;
        emit CancelBatchNonceUpTo(executorSigner, newMinBatchNonce);
    }

    // ========================================
    // Internal: utils
    // ========================================
    function _validateStringLength(string calldata s) internal pure {
        if (bytes(s).length > MAX_STRING_LENGTH) revert StringTooLong();
    }

    function _hashBoostRecord(
        BoostRecord calldata record,
        uint256 nonce,
        uint256 deadline
    ) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    BOOST_RECORD_TYPEHASH,
                    record.timestamp,
                    record.missionId,
                    record.boostingId,
                    record.userAddress,
                    keccak256(bytes(record.userId)),
                    keccak256(bytes(record.boostingFor)),
                    keccak256(bytes(record.boostingWith)),
                    record.amt,
                    nonce,
                    deadline
                )
            )
        );
    }

    function _hashBatch(bytes32 itemsHash, uint256 batchNonce) internal view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(BATCH_TYPEHASH, block.chainid, itemsHash, batchNonce)));
    }

    function _isValidUserSig(address user, bytes32 digest, bytes calldata sig) internal view returns (bool) {
        if (user.code.length == 0) {
            return ECDSA.recover(digest, sig) == user;
        } else {
            (bool ok, bytes memory ret) = user.staticcall(
                abi.encodeWithSelector(IERC1271.isValidSignature.selector, digest, sig)
            );
            return ok && ret.length == 4 && bytes4(ret) == ERC1271_MAGICVALUE;
        }
    }

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
    // Submit
    // ========================================
    function submitBoostBatch(
        BoostRecord[] calldata records,
        uint256[] calldata userNonces,
        uint256[] calldata deadlines,
        bytes[] calldata userSigs,
        uint256 batchNonce,
        bytes calldata executorSig
    ) external nonReentrant {
        if (records.length > MAX_BATCH_SIZE) revert BatchTooLarge();
        if (executorSigner == address(0)) revert ZeroAddress();
        if (block.chainid != CHAIN_ID) revert BadChain();
        if (records.length != userNonces.length || records.length != deadlines.length || records.length != userSigs.length) {
            revert LengthMismatch();
        }

        uint256 len = records.length;

        // 1) 가장 싸고 위험한 것부터 차단: 문자열 길이/만료 체크 + itemDigests 생성
        bytes32[] memory itemDigests = new bytes32[](len);
        for (uint256 i; i < len; ) {
            _validateStringLength(records[i].userId);
            _validateStringLength(records[i].boostingFor);
            _validateStringLength(records[i].boostingWith);

            if (deadlines[i] < block.timestamp) revert ExpiredSignature();

            itemDigests[i] = _hashBoostRecord(records[i], userNonces[i], deadlines[i]);
            unchecked { ++i; }
        }

        // 2) 실행자 서명은 "itemDigests" 묶음에 대해
        bytes32 itemsHash = keccak256(abi.encodePacked(itemDigests));
        bytes32 batchDigest = _hashBatch(itemsHash, batchNonce);
        address recoveredExec = ECDSA.recover(batchDigest, executorSig);
        if (recoveredExec != executorSigner) revert InvalidSignature();
        _consumeBatchNonce(executorSigner, batchNonce);

        // 3) 각 레코드 사용자 서명 검증 (논스 소비는 검증 직전)
        for (uint256 i; i < len; ) {
            _consumeUserNonce(records[i].userAddress, userNonces[i]);
            if (!_isValidUserSig(records[i].userAddress, itemDigests[i], userSigs[i])) {
                revert InvalidSignature();
            }
            unchecked { ++i; }
        }

        // 4) 저장
        _storeBoostRecords(records, itemDigests, batchDigest);

        emit BatchProcessed(batchDigest, executorSigner, batchNonce, records.length);
    }

    function _storeBoostRecords(
        BoostRecord[] calldata records,
        bytes32[] memory itemDigests,
        bytes32 batchDigest
    ) internal {
        uint256 len = records.length;
        for (uint256 i; i < len; ) {
            BoostRecord calldata r = records[i];

            if (r.userAddress == address(0)) revert ZeroAddress();
            if (r.amt == 0) revert ZeroAmt();

            uint256 cur = boostCount[r.missionId][r.boostingId];
            if (cur >= MAX_BOOSTS_PER_BOOSTING) revert BoostingCapacityExceeded();

            // 리플레이 방지
            bytes32 recordDigest = itemDigests[i];
            if (consumed[recordDigest]) revert AlreadyProcessed();
            consumed[recordDigest] = true;

            // 조회 키 (유저/미션/부스팅/타임스탬프/배치인덱스)
            bytes32 boostHash = keccak256(
                abi.encode(r.userAddress, r.missionId, r.boostingId, r.timestamp, i)
            );

            // 하위호환 배열(eventBoosts)은 더 이상 push하지 않음 (가스 DoS 방지)
            boosts[boostHash] = r;
            boostHashesByBoostingId[r.missionId][r.boostingId].push(boostHash);
            boostCount[r.missionId][r.boostingId] = cur + 1;
            boostCountByMission[r.missionId] += 1;

            emit BoostRecordAdded(
                boostHash,
                batchDigest,
                r.missionId,
                r.boostingId,
                r.userAddress,
                r.userId,
                r.boostingFor,
                r.boostingWith,
                r.amt,
                r.timestamp
            );

            unchecked { ++i; }
        }
    }

    // ========================================
    // Views
    // ========================================
    function getBoostByHash(bytes32 boostHash) external view returns (BoostRecord memory) {
        return boosts[boostHash];
    }

    function getBoostCount(uint256 missionId) external view returns (uint256) {
        return boostCountByMission[missionId];
    }

    function getBoostCountByBoostingId(uint256 missionId, uint256 boostingId) external view returns (uint256) {
        return boostCount[missionId][boostingId];
    }

    function getBoostHashesByBoostingId(
        uint256 missionId,
        uint256 boostingId,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory) {
        if (limit > MAX_QUERY_LIMIT) revert QueryLimitExceeded();

        bytes32[] storage allHashes = boostHashesByBoostingId[missionId][boostingId];
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
            unchecked { ++i; }
        }
        return out;
    }

    function getBoostsByBoostingId(
        uint256 missionId,
        uint256 boostingId,
        uint256 offset,
        uint256 limit
    ) external view returns (BoostRecord[] memory) {
        if (limit > MAX_QUERY_LIMIT) revert QueryLimitExceeded();

        bytes32[] storage allHashes = boostHashesByBoostingId[missionId][boostingId];
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
            unchecked { ++i; }
        }
        return out;
    }

    // (레거시 뷰) 과거에 쓰던 전체 조회 — 더는 push 안 하므로 대부분 빈 배열일 것
    function getEventBoosts(uint256 missionId) external view returns (BoostRecord[] memory) {
        return eventBoosts[missionId];
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // 테스트/클라이언트용 프리뷰
    function hashBoostRecordPreview(BoostRecord calldata r, uint256 nonce, uint256 deadline) external view returns (bytes32) {
        return _hashBoostRecord(r, nonce, deadline);
    }

    function hashBatchPreview(
        BoostRecord[] calldata records,
        uint256[] calldata userNonces,
        uint256[] calldata deadlines,
        uint256 batchNonce
    ) external view returns (bytes32) {
        if (records.length != userNonces.length || records.length != deadlines.length) revert LengthMismatch();
        bytes32[] memory itemDigests = new bytes32[](records.length);
        for (uint256 i; i < records.length; ) {
            itemDigests[i] = _hashBoostRecord(records[i], userNonces[i], deadlines[i]);
            unchecked { ++i; }
        }
        return _hashBatch(keccak256(abi.encodePacked(itemDigests)), batchNonce);
    }
}
