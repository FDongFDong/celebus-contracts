// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Boosting} from "../src/vote/Boosting.sol";

contract BoostingTest is Test {
    Boosting public boosting;

    address public owner;
    address public executorSigner;
    address public user1;
    address public user2;
    address public user3;

    uint256 public user1PrivateKey;
    uint256 public user2PrivateKey;
    uint256 public user3PrivateKey;
    uint256 public executorPrivateKey;

    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    bytes32 public constant BOOST_RECORD_TYPEHASH = keccak256(
        "BoostRecord(uint256 timestamp,uint256 missionId,uint256 boostingId,address userAddress,string userId,string boostingFor,string boostingWith,uint256 amt,uint256 nonce,uint256 deadline)"
    );

    bytes32 public constant BATCH_TYPEHASH = keccak256(
        "Batch(uint256 chainId,bytes32 itemsHash,uint256 batchNonce)"
    );

    function setUp() public {
        owner = address(this);

        user1PrivateKey = 0x1111;
        user2PrivateKey = 0x2222;
        user3PrivateKey = 0x3333;
        executorPrivateKey = 0x4444;

        user1 = vm.addr(user1PrivateKey);
        user2 = vm.addr(user2PrivateKey);
        user3 = vm.addr(user3PrivateKey);
        executorSigner = vm.addr(executorPrivateKey);

        boosting = new Boosting(owner);
        boosting.setExecutorSigner(executorSigner);
    }

    function _buildDomainSeparator() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes("Boosting")),
                keccak256(bytes("1")),
                block.chainid,
                address(boosting)
            )
        );
    }

    function _hashTypedDataV4(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", _buildDomainSeparator(), structHash));
    }

    function _createBoostRecord(
        address userAddress,
        string memory userId,
        uint256 missionId,
        uint256 boostingId,
        string memory boostingFor,
        string memory boostingWith,
        uint256 amt
    ) internal view returns (Boosting.BoostRecord memory) {
        return Boosting.BoostRecord({
            timestamp: block.timestamp,
            missionId: missionId,
            boostingId: boostingId,
            userAddress: userAddress,
            userId: userId,
            boostingFor: boostingFor,
            boostingWith: boostingWith,
            amt: amt
        });
    }

    function _signBoostRecord(
        uint256 privateKey,
        Boosting.BoostRecord memory record,
        uint256 nonce,
        uint256 deadline
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
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
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _buildItemDigests(
        Boosting.BoostRecord[] memory records,
        uint256[] memory userNonces,
        uint256[] memory deadlines
    ) internal view returns (bytes32[] memory) {
        require(records.length == userNonces.length, "length mismatch");
        require(records.length == deadlines.length, "length mismatch");
        bytes32[] memory digests = new bytes32[](records.length);
        for (uint256 i; i < records.length; ++i) {
            digests[i] = boosting.hashBoostRecordPreview(records[i], userNonces[i], deadlines[i]);
        }
        return digests;
    }

    function _signExecutorBatch(
        uint256 privateKey,
        Boosting.BoostRecord[] memory records,
        uint256[] memory userNonces,
        uint256[] memory deadlines,
        uint256 batchNonce
    ) internal view returns (bytes memory) {
        bytes32[] memory itemDigests = _buildItemDigests(records, userNonces, deadlines);
        bytes32 itemsHash = keccak256(abi.encodePacked(itemDigests));
        bytes32 structHash = keccak256(
            abi.encode(BATCH_TYPEHASH, block.chainid, itemsHash, batchNonce)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    // ========================================
    // 기본 기능 테스트
    // ========================================

    function test_Deployment() public view {
        assertEq(boosting.owner(), owner);
        assertEq(boosting.executorSigner(), executorSigner);
        assertEq(boosting.CHAIN_ID(), block.chainid);
    }

    function test_SetExecutorSigner() public {
        address newExecutor = address(0x5555);
        boosting.setExecutorSigner(newExecutor);
        assertEq(boosting.executorSigner(), newExecutor);
    }

    function test_RevertWhen_SetExecutorSignerZeroAddress() public {
        vm.expectRevert(Boosting.ZeroAddress.selector);
        boosting.setExecutorSigner(address(0));
    }

    function test_RevertWhen_SetExecutorSignerNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        boosting.setExecutorSigner(address(0x5555));
    }

    // ========================================
    // 부스팅 제출 성공 케이스
    // ========================================

    function test_SubmitSingleUserBoost() public {
        // 1명의 사용자가 1개의 부스팅
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](1);
        records[0] = _createBoostRecord(user1, "user1", 1, 1, "Artist1", "Item1", 100);

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        uint256[] memory deadlines = new uint256[](1);
        deadlines[0] = block.timestamp + 1 hours;

        bytes[] memory userSigs = new bytes[](1);
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, 0);

        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, executorSig);

        // 검증
        assertEq(boosting.getBoostCount(1), 1);
        assertTrue(boosting.userNonceUsed(user1, 0));
        assertTrue(boosting.batchNonceUsed(executorSigner, 0));
    }

    function test_SubmitMultipleUsersBoosts() public {
        // 3명의 사용자가 각각 1개의 부스팅
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](3);
        records[0] = _createBoostRecord(user1, "user1", 1, 1, "Artist1", "Item1", 100);
        records[1] = _createBoostRecord(user2, "user2", 1, 2, "Artist2", "Item2", 200);
        records[2] = _createBoostRecord(user3, "user3", 1, 3, "Artist3", "Item3", 150);

        uint256[] memory userNonces = new uint256[](3);
        userNonces[0] = 0;
        userNonces[1] = 0;
        userNonces[2] = 0;

        uint256[] memory deadlines = new uint256[](3);
        deadlines[0] = block.timestamp + 1 hours;
        deadlines[1] = block.timestamp + 1 hours;
        deadlines[2] = block.timestamp + 1 hours;

        bytes[] memory userSigs = new bytes[](3);
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]);
        userSigs[1] = _signBoostRecord(user2PrivateKey, records[1], userNonces[1], deadlines[1]);
        userSigs[2] = _signBoostRecord(user3PrivateKey, records[2], userNonces[2], deadlines[2]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, 0);

        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, executorSig);

        // 검증
        assertEq(boosting.getBoostCount(1), 3);
        assertTrue(boosting.userNonceUsed(user1, 0));
        assertTrue(boosting.userNonceUsed(user2, 0));
        assertTrue(boosting.userNonceUsed(user3, 0));
        assertTrue(boosting.batchNonceUsed(executorSigner, 0));
    }

    function test_SubmitMixedUsersAndBoosts() public {
        // 실제 시나리오: 다양한 사용자의 다양한 부스팅
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](5);
        records[0] = _createBoostRecord(user1, "alice", 1, 1, "ArtistA", "CoinA", 100);
        records[1] = _createBoostRecord(user2, "bob", 1, 2, "ArtistB", "CoinB", 200);
        records[2] = _createBoostRecord(user3, "charlie", 1, 3, "ArtistC", "CoinC", 150);
        records[3] = _createBoostRecord(user1, "alice", 1, 4, "ArtistD", "CoinD", 80);
        records[4] = _createBoostRecord(user2, "bob", 1, 5, "ArtistE", "CoinE", 120);

        uint256[] memory userNonces = new uint256[](5);
        userNonces[0] = 0; // user1 첫 번째 부스팅
        userNonces[1] = 0; // user2 첫 번째 부스팅
        userNonces[2] = 0; // user3 첫 번째 부스팅
        userNonces[3] = 1; // user1 두 번째 부스팅
        userNonces[4] = 1; // user2 두 번째 부스팅

        uint256 deadline = block.timestamp + 1 hours;
        uint256[] memory deadlines = new uint256[](5);
        for (uint256 i = 0; i < 5; i++) {
            deadlines[i] = deadline;
        }

        bytes[] memory userSigs = new bytes[](5);
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]);
        userSigs[1] = _signBoostRecord(user2PrivateKey, records[1], userNonces[1], deadlines[1]);
        userSigs[2] = _signBoostRecord(user3PrivateKey, records[2], userNonces[2], deadlines[2]);
        userSigs[3] = _signBoostRecord(user1PrivateKey, records[3], userNonces[3], deadlines[3]);
        userSigs[4] = _signBoostRecord(user2PrivateKey, records[4], userNonces[4], deadlines[4]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, 0);

        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, executorSig);

        // 검증
        assertEq(boosting.getBoostCount(1), 5);
        assertTrue(boosting.userNonceUsed(user1, 0));
        assertTrue(boosting.userNonceUsed(user1, 1));
        assertTrue(boosting.userNonceUsed(user2, 0));
        assertTrue(boosting.userNonceUsed(user2, 1));
        assertTrue(boosting.userNonceUsed(user3, 0));
    }

    // ========================================
    // 서명 검증 실패 케이스
    // ========================================

    function test_RevertWhen_InvalidExecutorSignature() public {
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](1);
        records[0] = _createBoostRecord(user1, "user1", 1, 1, "Artist1", "Item1", 100);

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        uint256[] memory deadlines = new uint256[](1);
        deadlines[0] = block.timestamp + 1 hours;

        bytes[] memory userSigs = new bytes[](1);
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]);

        // 잘못된 private key로 서명
        bytes memory wrongExecutorSig = _signExecutorBatch(user1PrivateKey, records, userNonces, deadlines, 0);

        vm.expectRevert(Boosting.InvalidSignature.selector);
        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, wrongExecutorSig);
    }

    function test_RevertWhen_InvalidUserSignature() public {
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](1);
        records[0] = _createBoostRecord(user1, "user1", 1, 1, "Artist1", "Item1", 100);

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        uint256[] memory deadlines = new uint256[](1);
        deadlines[0] = block.timestamp + 1 hours;

        bytes[] memory userSigs = new bytes[](1);
        // 잘못된 private key로 서명
        userSigs[0] = _signBoostRecord(user2PrivateKey, records[0], userNonces[0], deadlines[0]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, 0);

        vm.expectRevert(Boosting.InvalidSignature.selector);
        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, executorSig);
    }

    function test_RevertWhen_UserNonceAlreadyUsed() public {
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](1);
        records[0] = _createBoostRecord(user1, "user1", 1, 1, "Artist1", "Item1", 100);

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        uint256[] memory deadlines = new uint256[](1);
        deadlines[0] = block.timestamp + 1 hours;

        bytes[] memory userSigs = new bytes[](1);
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, 0);

        // 첫 번째 제출 성공
        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, executorSig);

        // 두 번째 제출 실패 (같은 user nonce)
        records[0] = _createBoostRecord(user1, "user1", 1, 2, "Artist2", "Item2", 150);
        deadlines[0] = block.timestamp + 1 hours;
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]); // 같은 nonce
        bytes memory executorSig2 = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, 1);

        vm.expectRevert(Boosting.UserNonceAlreadyUsed.selector);
        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 1, executorSig2);
    }

    function test_RevertWhen_BatchNonceAlreadyUsed() public {
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](1);
        records[0] = _createBoostRecord(user1, "user1", 1, 1, "Artist1", "Item1", 100);

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        uint256[] memory deadlines = new uint256[](1);
        deadlines[0] = block.timestamp + 1 hours;

        bytes[] memory userSigs = new bytes[](1);
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, 0);

        // 첫 번째 제출 성공
        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, executorSig);

        // 두 번째 제출 실패 (같은 batch nonce)
        records[0] = _createBoostRecord(user1, "user1", 1, 2, "Artist2", "Item2", 150);
        userNonces[0] = 1;
        deadlines[0] = block.timestamp + 1 hours;
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]);
        bytes memory executorSig2 = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, 0); // 같은 batch nonce

        vm.expectRevert(Boosting.BatchNonceAlreadyUsed.selector);
        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, executorSig2);
    }

    // ========================================
    // 데이터 검증 실패 케이스
    // ========================================

    function test_RevertWhen_ExpiredDeadline() public {
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](1);
        records[0] = _createBoostRecord(user1, "user1", 1, 1, "Artist1", "Item1", 100);

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        uint256[] memory deadlines = new uint256[](1);
        deadlines[0] = block.timestamp + 1 hours;

        bytes[] memory userSigs = new bytes[](1);
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]);

        // deadline 지나게 만들기
        vm.warp(block.timestamp + 2 hours);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, 0);

        vm.expectRevert(Boosting.ExpiredSignature.selector);
        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, executorSig);
    }

    function test_RevertWhen_ZeroAmount() public {
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](1);
        records[0] = _createBoostRecord(user1, "user1", 1, 1, "Artist1", "Item1", 0); // amt = 0

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        uint256[] memory deadlines = new uint256[](1);
        deadlines[0] = block.timestamp + 1 hours;

        bytes[] memory userSigs = new bytes[](1);
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, 0);

        vm.expectRevert(Boosting.ZeroAmt.selector);
        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, executorSig);
    }

    function test_RevertWhen_LengthMismatch() public {
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](2);
        records[0] = _createBoostRecord(user1, "user1", 1, 1, "Artist1", "Item1", 100);
        records[1] = _createBoostRecord(user2, "user2", 1, 2, "Artist2", "Item2", 200);

        uint256[] memory userNonces = new uint256[](1); // 길이 불일치
        userNonces[0] = 0;

        uint256[] memory deadlines = new uint256[](2);
        deadlines[0] = block.timestamp + 1 hours;
        deadlines[1] = block.timestamp + 1 hours;

        uint256[] memory signingUserNonces = new uint256[](2);
        signingUserNonces[0] = 0;
        signingUserNonces[1] = 0;

        bytes[] memory userSigs = new bytes[](2);
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], signingUserNonces[0], deadlines[0]);
        userSigs[1] = _signBoostRecord(user2PrivateKey, records[1], signingUserNonces[1], deadlines[1]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, signingUserNonces, deadlines, 0);

        vm.expectRevert(Boosting.LengthMismatch.selector);
        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, executorSig);
    }

    // ========================================
    // Nonce 취소 테스트
    // ========================================

    function test_CancelUserNonce() public {
        vm.prank(user1);
        boosting.cancelAllUserNonceUpTo(10);

        assertEq(boosting.minUserNonce(user1), 10);
    }

    function test_RevertWhen_CancelUserNonceTooLow() public {
        vm.prank(user1);
        boosting.cancelAllUserNonceUpTo(10);

        vm.prank(user1);
        vm.expectRevert(Boosting.UserNonceTooLow.selector);
        boosting.cancelAllUserNonceUpTo(5);
    }

    function test_CancelBatchNonce() public {
        boosting.cancelAllBatchNonceUpTo(10);

        assertEq(boosting.minBatchNonce(executorSigner), 10);
    }

    function test_RevertWhen_CancelBatchNonceTooLow() public {
        boosting.cancelAllBatchNonceUpTo(10);

        vm.expectRevert(Boosting.BatchNonceTooLow.selector);
        boosting.cancelAllBatchNonceUpTo(5);
    }

    function test_RevertWhen_CancelBatchNonceNotAuthorized() public {
        vm.prank(user1);
        vm.expectRevert(Boosting.InvalidSignature.selector);
        boosting.cancelAllBatchNonceUpTo(10);
    }

    // ========================================
    // View 함수 테스트
    // ========================================

    function test_GetEventBoosts() public {
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](2);
        records[0] = _createBoostRecord(user1, "user1", 1, 1, "Artist1", "Item1", 100);
        records[1] = _createBoostRecord(user2, "user2", 1, 2, "Artist2", "Item2", 200);

        uint256[] memory userNonces = new uint256[](2);
        userNonces[0] = 0;
        userNonces[1] = 0;

        uint256[] memory deadlines = new uint256[](2);
        deadlines[0] = block.timestamp + 1 hours;
        deadlines[1] = block.timestamp + 1 hours;

        bytes[] memory userSigs = new bytes[](2);
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]);
        userSigs[1] = _signBoostRecord(user2PrivateKey, records[1], userNonces[1], deadlines[1]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, 0);
        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, executorSig);

        // 레거시 eventBoosts 배열은 더 이상 사용되지 않으므로 빈 배열이어야 한다.
        Boosting.BoostRecord[] memory boosts = boosting.getEventBoosts(1);
        assertEq(boosts.length, 0);

        // 대신 전역 카운트와 per boosting 조회로 검증한다.
        assertEq(boosting.getBoostCount(1), 2);
        Boosting.BoostRecord[] memory boostingId1 = boosting.getBoostsByBoostingId(1, 1, 0, 10);
        assertEq(boostingId1.length, 1);
        assertEq(boostingId1[0].amt, 100);
        Boosting.BoostRecord[] memory boostingId2 = boosting.getBoostsByBoostingId(1, 2, 0, 10);
        assertEq(boostingId2.length, 1);
        assertEq(boostingId2[0].amt, 200);
    }

    function test_GetBoostsByBoostingId() public {
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](3);
        records[0] = _createBoostRecord(user1, "user1", 1, 1, "Artist1", "Item1", 100);
        records[1] = _createBoostRecord(user2, "user2", 1, 2, "Artist2", "Item2", 200);
        records[2] = _createBoostRecord(user3, "user3", 1, 1, "Artist1", "Item3", 150); // 같은 boostingId

        uint256[] memory userNonces = new uint256[](3);
        userNonces[0] = 0;
        userNonces[1] = 0;
        userNonces[2] = 0;

        uint256 deadline = block.timestamp + 1 hours;
        uint256[] memory deadlines = new uint256[](3);
        for (uint256 i = 0; i < 3; i++) {
            deadlines[i] = deadline;
        }

        bytes[] memory userSigs = new bytes[](3);
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]);
        userSigs[1] = _signBoostRecord(user2PrivateKey, records[1], userNonces[1], deadlines[1]);
        userSigs[2] = _signBoostRecord(user3PrivateKey, records[2], userNonces[2], deadlines[2]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, 0);
        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, executorSig);

        // boostingId 1로 조회 (offset=0, limit=100)
        Boosting.BoostRecord[] memory boostingId1 = boosting.getBoostsByBoostingId(1, 1, 0, 100);
        assertEq(boostingId1.length, 2); // user1, user3
        assertEq(boostingId1[0].userId, "user1");
        assertEq(boostingId1[1].userId, "user3");

        // boostingId 2로 조회 (offset=0, limit=100)
        Boosting.BoostRecord[] memory boostingId2 = boosting.getBoostsByBoostingId(1, 2, 0, 100);
        assertEq(boostingId2.length, 1); // user2
        assertEq(boostingId2[0].userId, "user2");
    }

    function test_GetBoostCountByBoostingId() public {
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](4);
        records[0] = _createBoostRecord(user1, "user1", 1, 1, "Artist1", "Item1", 100);
        records[1] = _createBoostRecord(user2, "user2", 1, 1, "Artist1", "Item2", 200);
        records[2] = _createBoostRecord(user3, "user3", 1, 2, "Artist2", "Item3", 150);
        records[3] = _createBoostRecord(user1, "user1", 1, 1, "Artist1", "Item4", 80);

        uint256[] memory userNonces = new uint256[](4);
        userNonces[0] = 0;
        userNonces[1] = 0;
        userNonces[2] = 0;
        userNonces[3] = 1;

        uint256 deadline = block.timestamp + 1 hours;
        uint256[] memory deadlines = new uint256[](4);
        for (uint256 i = 0; i < 4; i++) {
            deadlines[i] = deadline;
        }

        bytes[] memory userSigs = new bytes[](4);
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]);
        userSigs[1] = _signBoostRecord(user2PrivateKey, records[1], userNonces[1], deadlines[1]);
        userSigs[2] = _signBoostRecord(user3PrivateKey, records[2], userNonces[2], deadlines[2]);
        userSigs[3] = _signBoostRecord(user1PrivateKey, records[3], userNonces[3], deadlines[3]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, 0);
        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, executorSig);

        // 개수 확인
        assertEq(boosting.getBoostCountByBoostingId(1, 1), 3); // user1(2개) + user2(1개)
        assertEq(boosting.getBoostCountByBoostingId(1, 2), 1); // user3(1개)
    }

    function test_DomainSeparator() public view {
        bytes32 separator = boosting.domainSeparator();
        assertEq(separator, _buildDomainSeparator());
    }

    function test_HashBoostRecordPreview() public view {
        Boosting.BoostRecord memory record = _createBoostRecord(
            user1, "user1", 1, 1, "Artist1", "Item1", 100
        );

        uint256 deadline = block.timestamp + 1 hours;
        bytes32 hash = boosting.hashBoostRecordPreview(record, 0, deadline);

        bytes32 expectedStructHash = keccak256(
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
                0, // nonce
                deadline
            )
        );
        bytes32 expected = _hashTypedDataV4(expectedStructHash);

        assertEq(hash, expected);
    }

    function test_HashBatchPreview() public view {
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](1);
        records[0] = _createBoostRecord(user1, "user1", 1, 1, "Artist1", "Item1", 100);

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;
        uint256[] memory deadlines = new uint256[](1);
        deadlines[0] = block.timestamp + 1 hours;

        bytes32 hash = boosting.hashBatchPreview(records, userNonces, deadlines, 0);

        bytes32[] memory itemDigests = _buildItemDigests(records, userNonces, deadlines);
        bytes32 itemsHash = keccak256(abi.encodePacked(itemDigests));
        bytes32 expectedStructHash = keccak256(
            abi.encode(BATCH_TYPEHASH, block.chainid, itemsHash, 0)
        );
        bytes32 expected = _hashTypedDataV4(expectedStructHash);

        assertEq(hash, expected);
    }

    // ========================================
    // 실제 시나리오 테스트
    // ========================================

    function test_RealWorldBoostingScenario() public {
        // 실제 부스팅 시나리오: 3명 사용자, 각각 다른 아티스트 부스팅
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](3);
        records[0] = _createBoostRecord(user1, "alice", 1, 1, "ArtistA", "Coin", 100);
        records[1] = _createBoostRecord(user2, "bob", 1, 2, "ArtistB", "Item", 200);
        records[2] = _createBoostRecord(user3, "charlie", 1, 3, "ArtistC", "NFT", 150);

        uint256[] memory userNonces = new uint256[](3);
        userNonces[0] = 0;
        userNonces[1] = 0;
        userNonces[2] = 0;

        uint256 deadline = block.timestamp + 1 hours;
        uint256[] memory deadlines = new uint256[](3);
        for (uint256 i = 0; i < 3; i++) {
            deadlines[i] = deadline;
        }

        bytes[] memory userSigs = new bytes[](3);
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]);
        userSigs[1] = _signBoostRecord(user2PrivateKey, records[1], userNonces[1], deadlines[1]);
        userSigs[2] = _signBoostRecord(user3PrivateKey, records[2], userNonces[2], deadlines[2]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, 0);

        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, executorSig);

        // 검증: 총 3건, 각 boostingId에 정확히 1건씩 저장
        assertEq(boosting.getBoostCount(1), 3);
        for (uint256 i = 0; i < 3; i++) {
            Boosting.BoostRecord[] memory result = boosting.getBoostsByBoostingId(1, i + 1, 0, 10);
            assertEq(result.length, 1);
        }
        assertEq(boosting.getBoostsByBoostingId(1, 1, 0, 10)[0].boostingFor, "ArtistA");
        assertEq(boosting.getBoostsByBoostingId(1, 2, 0, 10)[0].boostingFor, "ArtistB");
        assertEq(boosting.getBoostsByBoostingId(1, 3, 0, 10)[0].boostingFor, "ArtistC");
    }

    function test_SequentialBatches() public {
        // 순차적인 여러 배치 제출
        for (uint256 batchIdx = 0; batchIdx < 3; batchIdx++) {
            Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](2);
            records[0] = _createBoostRecord(
                user1, "user1", 1, batchIdx * 2 + 1, "Artist", "Item", 100
            );
            records[1] = _createBoostRecord(
                user2, "user2", 1, batchIdx * 2 + 2, "Artist", "Item", 200
            );

            uint256[] memory userNonces = new uint256[](2);
            userNonces[0] = batchIdx;
            userNonces[1] = batchIdx;

            uint256 deadline = block.timestamp + 1 hours;
            uint256[] memory deadlines = new uint256[](2);
            deadlines[0] = deadline;
            deadlines[1] = deadline;

            bytes[] memory userSigs = new bytes[](2);
            userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]);
            userSigs[1] = _signBoostRecord(user2PrivateKey, records[1], userNonces[1], deadlines[1]);

            bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, batchIdx);

            boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, batchIdx, executorSig);
        }

        // 검증: 총 6개 부스팅 (3배치 x 2부스팅)
        assertEq(boosting.getBoostCount(1), 6);
        assertTrue(boosting.userNonceUsed(user1, 0));
        assertTrue(boosting.userNonceUsed(user1, 1));
        assertTrue(boosting.userNonceUsed(user1, 2));
    }

    function test_SameBoostingIdDifferentUsers() public {
        // 같은 boostingId에 여러 사용자 부스팅
        Boosting.BoostRecord[] memory records = new Boosting.BoostRecord[](3);
        records[0] = _createBoostRecord(user1, "user1", 1, 1, "SameArtist", "Coin", 100);
        records[1] = _createBoostRecord(user2, "user2", 1, 1, "SameArtist", "Item", 200);
        records[2] = _createBoostRecord(user3, "user3", 1, 1, "SameArtist", "NFT", 150);

        uint256[] memory userNonces = new uint256[](3);
        userNonces[0] = 0;
        userNonces[1] = 0;
        userNonces[2] = 0;

        uint256 deadline = block.timestamp + 1 hours;
        uint256[] memory deadlines = new uint256[](3);
        for (uint256 i = 0; i < 3; i++) {
            deadlines[i] = deadline;
        }

        bytes[] memory userSigs = new bytes[](3);
        userSigs[0] = _signBoostRecord(user1PrivateKey, records[0], userNonces[0], deadlines[0]);
        userSigs[1] = _signBoostRecord(user2PrivateKey, records[1], userNonces[1], deadlines[1]);
        userSigs[2] = _signBoostRecord(user3PrivateKey, records[2], userNonces[2], deadlines[2]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, deadlines, 0);

        boosting.submitBoostBatch(records, userNonces, deadlines, userSigs, 0, executorSig);

        // 같은 boostingId로 조회 (offset=0, limit=100)
        Boosting.BoostRecord[] memory sameBoostingIdBoosts = boosting.getBoostsByBoostingId(1, 1, 0, 100);
        assertEq(sameBoostingIdBoosts.length, 3);

        // 모두 같은 아티스트지만 부스팅 방법은 다름
        assertEq(sameBoostingIdBoosts[0].boostingWith, "Coin");
        assertEq(sameBoostingIdBoosts[1].boostingWith, "Item");
        assertEq(sameBoostingIdBoosts[2].boostingWith, "NFT");
    }
}
