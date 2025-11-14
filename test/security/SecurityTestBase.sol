// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {MainVoting} from "../../src/vote/MainVoting.sol";
import {SubVoting} from "../../src/vote/SubVoting.sol";
import {Boosting} from "../../src/vote/Boosting.sol";

/**
 * @title SecurityTestBase
 * @notice 보안 테스트를 위한 공통 헬퍼 함수 및 유틸리티
 * @dev SECURITY_AUDIT.md의 취약점 검증을 위한 베이스 컨트랙트
 */
abstract contract SecurityTestBase is Test {
    // ========================================
    // 컨트랙트 인스턴스
    // ========================================

    MainVoting public voting;
    SubVoting public subVoting;
    Boosting public boosting;

    // ========================================
    // 계정 및 키
    // ========================================

    address public owner;
    address public executorSigner;
    address public user1;
    address public user2;
    address public user3;

    uint256 public user1PrivateKey = 0x1111;
    uint256 public user2PrivateKey = 0x2222;
    uint256 public user3PrivateKey = 0x3333;
    uint256 public executorPrivateKey = 0x4444;

    // ========================================
    // EIP-712 타입 해시
    // ========================================

    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    bytes32 public constant USER_BATCH_TYPEHASH = keccak256(
        "UserBatch(address user,uint256 userNonce,bytes32 recordsHash)"
    );

    bytes32 public constant BATCH_TYPEHASH = keccak256(
        "Batch(uint256 chainId,bytes32 itemsHash,uint256 batchNonce)"
    );

    // ========================================
    // Setup
    // ========================================

    function setUp() public virtual {
        owner = address(this);

        user1 = vm.addr(user1PrivateKey);
        user2 = vm.addr(user2PrivateKey);
        user3 = vm.addr(user3PrivateKey);
        executorSigner = vm.addr(executorPrivateKey);

        // MainVoting 배포
        voting = new MainVoting(owner);
        voting.setExecutorSigner(executorSigner);

        // SubVoting 배포
        subVoting = new SubVoting(owner);
        subVoting.setExecutorSigner(executorSigner);

        // Boosting 배포
        boosting = new Boosting(owner);
        boosting.setExecutorSigner(executorSigner);
    }

    // ========================================
    // EIP-712 서명 헬퍼 - MainVoting
    // ========================================

    function _buildDomainSeparator() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes("MainVoting")),
                keccak256(bytes("1")),
                block.chainid,
                address(voting)
            )
        );
    }

    function _hashTypedDataV4(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", _buildDomainSeparator(), structHash));
    }

    function _signUserBatch(
        uint256 privateKey,
        address user,
        uint256 userNonce,
        MainVoting.VoteRecord[] memory userRecords,
        uint256[] memory userRecordNonces
    ) internal view returns (bytes memory) {
        bytes32[] memory hashes = new bytes32[](userRecords.length);
        for (uint256 i; i < userRecords.length; ) {
            hashes[i] = voting.hashVoteRecord(userRecords[i]);
            unchecked { ++i; }
        }
        bytes32 recordsHash = keccak256(abi.encodePacked(hashes));
        bytes32 structHash = keccak256(
            abi.encode(USER_BATCH_TYPEHASH, user, userNonce, recordsHash)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _signExecutorBatch(
        uint256 privateKey,
        MainVoting.VoteRecord[] memory records,
        uint256[] memory recordNonces,
        uint256 batchNonce
    ) internal view returns (bytes memory signature, bytes32 itemsHash) {
        bytes32[] memory hashes = new bytes32[](records.length);
        for (uint256 i; i < records.length; ) {
            hashes[i] = voting.hashVoteRecord(records[i]);
            unchecked { ++i; }
        }
        itemsHash = keccak256(abi.encodePacked(hashes));
        bytes32 structHash = keccak256(
            abi.encode(BATCH_TYPEHASH, block.chainid, itemsHash, batchNonce)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        signature = abi.encodePacked(r, s, v);
    }

    // ========================================
    // VoteRecord 생성 헬퍼
    // ========================================

    function _createVoteRecord(
        address userAddress,
        string memory userId,
        uint256 missionId,
        uint256 votingId,
        string memory votingFor,
        string memory votedOn,
        uint256 votingAmt
    ) internal view returns (MainVoting.VoteRecord memory) {
        return MainVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: missionId,
            votingId: votingId,
            userAddress: userAddress,
            userId: userId,
            votingFor: votingFor,
            votedOn: votedOn,
            votingAmt: votingAmt,
            deadline: block.timestamp + 1 hours
        });
    }

    // ========================================
    // 대량 데이터 생성 헬퍼
    // ========================================

    /**
     * @notice 대량의 VoteRecord 배열을 생성
     * @param count 생성할 레코드 개수
     * @param votingId 투표 ID (동일 votingId로 생성하여 DoS 테스트용)
     */
    function _generateBulkRecords(
        uint256 count,
        uint256 votingId
    ) internal view returns (MainVoting.VoteRecord[] memory) {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            records[i] = _createVoteRecord(
                user1,
                string(abi.encodePacked("user", vm.toString(i))),
                1,
                votingId,
                "candidate",
                "vote",
                100
            );
        }
        return records;
    }

    // ========================================
    // 유틸리티 함수
    // ========================================

    /**
     * @notice recordIndices 배열 생성 (0부터 순차적)
     */
    function _createIndices(uint256 count) internal pure returns (uint256[] memory) {
        uint256[] memory indices = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            indices[i] = i;
        }
        return indices;
    }

    /**
     * @notice recordNonces 배열 생성 (0부터 순차적)
     */
    function _createRecordNonces(uint256 count) internal pure returns (uint256[] memory) {
        uint256[] memory nonces = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            nonces[i] = i;
        }
        return nonces;
    }

    /**
     * @notice Gas 소비량 측정 유틸리티
     * @dev 함수 실행 전후의 gas를 측정하여 반환
     */
    function _measureGas(function() external func) internal returns (uint256 gasUsed) {
        uint256 gasBefore = gasleft();
        func();
        gasUsed = gasBefore - gasleft();
    }

    /**
     * @notice 긴 문자열 생성 헬퍼 (String length attack 테스트용)
     * @param length 문자열 길이 (bytes)
     */
    function _createLongString(uint256 length) internal pure returns (string memory) {
        bytes memory data = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            data[i] = "A";
        }
        return string(data);
    }

    /**
     * @notice 배치 제출 헬퍼 (테스트 코드 간소화)
     */
    function _submitBatch(
        MainVoting.VoteRecord[] memory records,
        address user,
        uint256 userPrivateKey_,
        uint256 userNonce,
        uint256 batchNonce
    ) internal {
        uint256[] memory recordNonces = _createRecordNonces(records.length);
        bytes memory userSig = _signUserBatch(userPrivateKey_, user, userNonce, records, recordNonces);

        MainVoting.UserBatchSig memory userBatch = MainVoting.UserBatchSig({
            user: user,
            userNonce: userNonce,
            recordIndices: _createIndices(records.length),
            signature: userSig
        });

        (bytes memory batchSig, bytes32 itemsHash) = _signExecutorBatch(executorPrivateKey, records, recordNonces, batchNonce);

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        voting.submitMultiUserBatch(records, sigs, batchNonce, batchSig);
    }

    // ========================================
    // 로깅 헬퍼
    // ========================================

    function _logGasUsage(string memory testName, uint256 gasUsed) internal pure {
        console.log("========================================");
        console.log("Test:", testName);
        console.log("Gas used:", gasUsed);
        console.log("========================================");
    }

    function _logTestResult(string memory testName, bool passed, string memory note) internal pure {
        console.log("========================================");
        console.log("Test:", testName);
        console.log("Result:", passed ? "PASS" : "FAIL");
        console.log("Note:", note);
        console.log("========================================");
    }

    /**
     * @notice itemsHash 계산 헬퍼 (무결성 검증용)
     */
    function _calculateItemsHash(
        MainVoting.VoteRecord[] memory records,
        uint256[] memory recordNonces
    ) internal view returns (bytes32) {
        bytes32[] memory hashes = new bytes32[](records.length);
        for (uint256 i; i < records.length; ) {
            hashes[i] = voting.hashVoteRecord(records[i]);
            unchecked { ++i; }
        }
        return keccak256(abi.encodePacked(hashes));
    }
}
