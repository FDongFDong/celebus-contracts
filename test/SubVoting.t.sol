// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SubVoting} from "../src/vote/SubVoting.sol";

contract SubVotingTest is Test {
    SubVoting public voting;

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

    bytes32 public constant VOTE_RECORD_TYPEHASH = keccak256(
        "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,bytes32 userIdHash,bytes32 votingForHash,bytes32 votedOnHash,uint256 votingAmt,uint256 nonce,uint256 deadline)"
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

        voting = new SubVoting(owner);
        voting.setExecutorSigner(executorSigner);
    }

    function _buildDomainSeparator() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes("SubVoting")),
                keccak256(bytes("1")),
                block.chainid,
                address(voting)
            )
        );
    }

    function _hashTypedDataV4(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", _buildDomainSeparator(), structHash));
    }

    function _createVoteRecord(
        address userAddress,
        string memory userId,
        uint256 missionId,
        uint256 votingId,
        string memory votingFor,
        string memory votedOn,
        uint256 votingAmt
    ) internal view returns (SubVoting.VoteRecord memory) {
        return SubVoting.VoteRecord({
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

    function _signVoteRecord(
        uint256 privateKey,
        SubVoting.VoteRecord memory record,
        uint256 nonce
    ) internal view returns (bytes memory) {
        bytes32 digest = voting.hashVoteRecordPreview(record, nonce);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _buildItemDigests(
        SubVoting.VoteRecord[] memory records,
        uint256[] memory userNonces
    ) internal view returns (bytes32[] memory) {
        require(records.length == userNonces.length, "length mismatch");
        bytes32[] memory digests = new bytes32[](records.length);
        for (uint256 i; i < records.length; ++i) {
            digests[i] = voting.hashVoteRecordPreview(records[i], userNonces[i]);
        }
        return digests;
    }

    function _signExecutorBatch(
        uint256 privateKey,
        SubVoting.VoteRecord[] memory records,
        uint256[] memory userNonces,
        uint256 batchNonce
    ) internal view returns (bytes memory) {
        bytes32[] memory itemDigests = _buildItemDigests(records, userNonces);
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
        assertEq(voting.owner(), owner);
        assertEq(voting.executorSigner(), executorSigner);
        assertEq(voting.CHAIN_ID(), block.chainid);
    }

    function test_SetExecutorSigner() public {
        address newExecutor = address(0x5555);
        voting.setExecutorSigner(newExecutor);
        assertEq(voting.executorSigner(), newExecutor);
    }

    function test_RevertWhen_SetExecutorSignerZeroAddress() public {
        vm.expectRevert(SubVoting.ZeroAddress.selector);
        voting.setExecutorSigner(address(0));
    }

    function test_RevertWhen_SetExecutorSignerNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        voting.setExecutorSigner(address(0x5555));
    }

    // ========================================
    // 투표 제출 성공 케이스
    // ========================================

    function test_SubmitSingleUserVote() public {
        // 1명의 사용자가 1개의 투표
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        bytes[] memory userSigs = new bytes[](1);
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, 0);

        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig);

        // 검증
        assertEq(voting.getVoteCount(1), 1);
        assertTrue(voting.userNonceUsed(user1, 0));
        assertTrue(voting.batchNonceUsed(executorSigner, 0));
    }

    function test_SubmitMultipleUsersVotes() public {
        // 3명의 사용자가 각각 1개의 투표
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](3);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);
        records[1] = _createVoteRecord(user2, "user2", 1, 2, "Question2", "AnswerB", 200);
        records[2] = _createVoteRecord(user3, "user3", 1, 3, "Question3", "AnswerC", 150);

        uint256[] memory userNonces = new uint256[](3);
        userNonces[0] = 0;
        userNonces[1] = 0;
        userNonces[2] = 0;

        bytes[] memory userSigs = new bytes[](3);
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]);
        userSigs[1] = _signVoteRecord(user2PrivateKey, records[1], userNonces[1]);
        userSigs[2] = _signVoteRecord(user3PrivateKey, records[2], userNonces[2]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, 0);

        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig);

        // 검증
        assertEq(voting.getVoteCount(1), 3);
        assertTrue(voting.userNonceUsed(user1, 0));
        assertTrue(voting.userNonceUsed(user2, 0));
        assertTrue(voting.userNonceUsed(user3, 0));
        assertTrue(voting.batchNonceUsed(executorSigner, 0));
    }

    function test_SubmitMixedUsersAndVotes() public {
        // 실제 시나리오: 다양한 사용자의 다양한 투표
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](5);
        records[0] = _createVoteRecord(user1, "alice", 1, 1, "ArtistA", "song1", 100);
        records[1] = _createVoteRecord(user2, "bob", 1, 2, "ArtistB", "song2", 200);
        records[2] = _createVoteRecord(user3, "charlie", 1, 3, "ArtistC", "song3", 150);
        records[3] = _createVoteRecord(user1, "alice", 1, 4, "ArtistD", "song4", 80);
        records[4] = _createVoteRecord(user2, "bob", 1, 5, "ArtistE", "song5", 120);

        uint256[] memory userNonces = new uint256[](5);
        userNonces[0] = 0; // user1 첫 번째 투표
        userNonces[1] = 0; // user2 첫 번째 투표
        userNonces[2] = 0; // user3 첫 번째 투표
        userNonces[3] = 1; // user1 두 번째 투표
        userNonces[4] = 1; // user2 두 번째 투표

        bytes[] memory userSigs = new bytes[](5);
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]);
        userSigs[1] = _signVoteRecord(user2PrivateKey, records[1], userNonces[1]);
        userSigs[2] = _signVoteRecord(user3PrivateKey, records[2], userNonces[2]);
        userSigs[3] = _signVoteRecord(user1PrivateKey, records[3], userNonces[3]);
        userSigs[4] = _signVoteRecord(user2PrivateKey, records[4], userNonces[4]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, 0);

        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig);

        // 검증
        assertEq(voting.getVoteCount(1), 5);
        assertTrue(voting.userNonceUsed(user1, 0));
        assertTrue(voting.userNonceUsed(user1, 1));
        assertTrue(voting.userNonceUsed(user2, 0));
        assertTrue(voting.userNonceUsed(user2, 1));
        assertTrue(voting.userNonceUsed(user3, 0));
    }

    // ========================================
    // 서명 검증 실패 케이스
    // ========================================

    function test_RevertWhen_InvalidExecutorSignature() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        bytes[] memory userSigs = new bytes[](1);
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]);

        // 잘못된 private key로 서명
        bytes memory wrongExecutorSig = _signExecutorBatch(user1PrivateKey, records, userNonces, 0);

        vm.expectRevert(SubVoting.InvalidSignature.selector);
        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, wrongExecutorSig);
    }

    function test_RevertWhen_InvalidUserSignature() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        bytes[] memory userSigs = new bytes[](1);
        // 잘못된 private key로 서명
        userSigs[0] = _signVoteRecord(user2PrivateKey, records[0], userNonces[0]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, 0);

        vm.expectRevert(SubVoting.InvalidSignature.selector);
        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig);
    }

    function test_RevertWhen_UserNonceAlreadyUsed() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        bytes[] memory userSigs = new bytes[](1);
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, 0);

        // 첫 번째 제출 성공
        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig);

        // 두 번째 제출 실패 (같은 user nonce)
        records[0] = _createVoteRecord(user1, "user1", 1, 2, "Question2", "AnswerB", 150);
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]); // 같은 nonce
        bytes memory executorSig2 = _signExecutorBatch(executorPrivateKey, records, userNonces, 1);

        vm.expectRevert(SubVoting.UserNonceAlreadyUsed.selector);
        voting.submitSubVoteBatch(records, userNonces, userSigs, 1, executorSig2);
    }

    function test_RevertWhen_BatchNonceAlreadyUsed() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        bytes[] memory userSigs = new bytes[](1);
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, 0);

        // 첫 번째 제출 성공
        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig);

        // 두 번째 제출 실패 (같은 batch nonce)
        records[0] = _createVoteRecord(user1, "user1", 1, 2, "Question2", "AnswerB", 150);
        userNonces[0] = 1;
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]);
        bytes memory executorSig2 = _signExecutorBatch(executorPrivateKey, records, userNonces, 0); // 같은 batch nonce

        vm.expectRevert(SubVoting.BatchNonceAlreadyUsed.selector);
        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig2);
    }

    function test_RevertWhen_WrongNonceForSignature() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        bytes[] memory userSigs = new bytes[](1);
        // nonce 5로 서명했지만, userNonces에는 0으로 제출
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], 5);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, 0);

        vm.expectRevert(SubVoting.InvalidSignature.selector);
        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig);
    }

    // ========================================
    // 데이터 검증 실패 케이스
    // ========================================

    function test_RevertWhen_ExpiredDeadline() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);

        // deadline 지나게 만들기
        vm.warp(block.timestamp + 2 hours);

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        bytes[] memory userSigs = new bytes[](1);
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, 0);

        vm.expectRevert(SubVoting.ExpiredSignature.selector);
        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig);
    }

    function test_RevertWhen_ZeroVotingAmount() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 0); // votingAmt = 0

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        bytes[] memory userSigs = new bytes[](1);
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, 0);

        vm.expectRevert(SubVoting.ZeroVotingAmt.selector);
        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig);
    }

    // Note: ZeroAddress 테스트는 실제로 불가능
    // address(0)로는 유효한 서명을 만들 수 없어서 InvalidSignature가 먼저 발생
    // 서명 검증이 ZeroAddress 체크보다 먼저 실행되므로 이 에러는 실제로 발생하지 않음

    function test_RevertWhen_LengthMismatch() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](2);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);
        records[1] = _createVoteRecord(user2, "user2", 1, 2, "Question2", "AnswerB", 200);

        uint256[] memory userNonces = new uint256[](1); // 길이 불일치
        userNonces[0] = 0;

        uint256[] memory signingUserNonces = new uint256[](2);
        signingUserNonces[0] = 0;
        signingUserNonces[1] = 0;

        bytes[] memory userSigs = new bytes[](2);
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], signingUserNonces[0]);
        userSigs[1] = _signVoteRecord(user2PrivateKey, records[1], signingUserNonces[1]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, signingUserNonces, 0);

        vm.expectRevert(SubVoting.LengthMismatch.selector);
        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig);
    }

    // ========================================
    // Nonce 취소 테스트
    // ========================================

    function test_CancelUserNonce() public {
        vm.prank(user1);
        voting.cancelAllUserNonceUpTo(10);

        assertEq(voting.minUserNonce(user1), 10);
    }

    function test_RevertWhen_CancelUserNonceTooLow() public {
        vm.prank(user1);
        voting.cancelAllUserNonceUpTo(10);

        vm.prank(user1);
        vm.expectRevert(SubVoting.UserNonceTooLow.selector);
        voting.cancelAllUserNonceUpTo(5);
    }

    function test_CancelBatchNonce() public {
        voting.cancelAllBatchNonceUpTo(10);

        assertEq(voting.minBatchNonce(executorSigner), 10);
    }

    function test_RevertWhen_CancelBatchNonceTooLow() public {
        voting.cancelAllBatchNonceUpTo(10);

        vm.expectRevert(SubVoting.BatchNonceTooLow.selector);
        voting.cancelAllBatchNonceUpTo(5);
    }

    function test_RevertWhen_CancelBatchNonceNotAuthorized() public {
        vm.prank(user1);
        vm.expectRevert(SubVoting.InvalidSignature.selector);
        voting.cancelAllBatchNonceUpTo(10);
    }

    // ========================================
    // View 함수 테스트
    // ========================================

    function test_GetEventVotes() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](2);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);
        records[1] = _createVoteRecord(user2, "user2", 1, 2, "Question2", "AnswerB", 200);

        uint256[] memory userNonces = new uint256[](2);
        userNonces[0] = 0;
        userNonces[1] = 0;

        bytes[] memory userSigs = new bytes[](2);
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]);
        userSigs[1] = _signVoteRecord(user2PrivateKey, records[1], userNonces[1]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, 0);
        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig);

        // 레거시 eventVotes 배열은 더 이상 push 하지 않으므로 빈 배열이어야 한다.
        SubVoting.VoteRecord[] memory votes = voting.getEventVotes(1);
        assertEq(votes.length, 0);

        // 대신 전역 카운트 및 votingId별 조회로 검증한다.
        assertEq(voting.getVoteCount(1), 2);
        SubVoting.VoteRecord[] memory votingId1 = voting.getVotesByVotingId(1, 1, 0, 10);
        assertEq(votingId1.length, 1);
        assertEq(votingId1[0].votingAmt, 100);
        SubVoting.VoteRecord[] memory votingId2 = voting.getVotesByVotingId(1, 2, 0, 10);
        assertEq(votingId2.length, 1);
        assertEq(votingId2[0].votingAmt, 200);
    }

    function test_GetVotesByVotingId() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](3);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);
        records[1] = _createVoteRecord(user2, "user2", 1, 2, "Question2", "AnswerB", 200);
        records[2] = _createVoteRecord(user3, "user3", 1, 1, "Question1", "AnswerC", 150); // 같은 votingId

        uint256[] memory userNonces = new uint256[](3);
        userNonces[0] = 0;
        userNonces[1] = 0;
        userNonces[2] = 0;

        bytes[] memory userSigs = new bytes[](3);
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]);
        userSigs[1] = _signVoteRecord(user2PrivateKey, records[1], userNonces[1]);
        userSigs[2] = _signVoteRecord(user3PrivateKey, records[2], userNonces[2]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, 0);
        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig);

        // votingId 1로 조회 (offset=0, limit=100)
        SubVoting.VoteRecord[] memory votingId1 = voting.getVotesByVotingId(1, 1, 0, 100);
        assertEq(votingId1.length, 2); // user1, user3
        assertEq(votingId1[0].userId, "user1");
        assertEq(votingId1[1].userId, "user3");

        // votingId 2로 조회 (offset=0, limit=100)
        SubVoting.VoteRecord[] memory votingId2 = voting.getVotesByVotingId(1, 2, 0, 100);
        assertEq(votingId2.length, 1); // user2
        assertEq(votingId2[0].userId, "user2");
    }

    function test_GetVoteCountByVotingId() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](4);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);
        records[1] = _createVoteRecord(user2, "user2", 1, 1, "Question1", "AnswerB", 200);
        records[2] = _createVoteRecord(user3, "user3", 1, 2, "Question2", "AnswerC", 150);
        records[3] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerD", 80);

        uint256[] memory userNonces = new uint256[](4);
        userNonces[0] = 0;
        userNonces[1] = 0;
        userNonces[2] = 0;
        userNonces[3] = 1;

        bytes[] memory userSigs = new bytes[](4);
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]);
        userSigs[1] = _signVoteRecord(user2PrivateKey, records[1], userNonces[1]);
        userSigs[2] = _signVoteRecord(user3PrivateKey, records[2], userNonces[2]);
        userSigs[3] = _signVoteRecord(user1PrivateKey, records[3], userNonces[3]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, 0);
        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig);

        // 개수 확인
        assertEq(voting.getVoteCountByVotingId(1, 1), 3); // user1(2개) + user2(1개)
        assertEq(voting.getVoteCountByVotingId(1, 2), 1); // user3(1개)
    }

    function test_DomainSeparator() public view {
        bytes32 separator = voting.domainSeparator();
        assertEq(separator, _buildDomainSeparator());
    }

    function test_HashVoteRecordPreview() public view {
        SubVoting.VoteRecord memory record = _createVoteRecord(
            user1, "user1", 1, 1, "Question1", "AnswerA", 100
        );

        bytes32 hash = voting.hashVoteRecordPreview(record, 0);

        bytes32 expectedStructHash = keccak256(
            abi.encode(
                VOTE_RECORD_TYPEHASH,
                record.timestamp,
                record.missionId,
                record.votingId,
                record.userAddress,
                keccak256(bytes(record.userId)),
                keccak256(bytes(record.votingFor)),
                keccak256(bytes(record.votedOn)),
                record.votingAmt,
                0, // nonce
                record.deadline
            )
        );
        bytes32 expected = _hashTypedDataV4(expectedStructHash);

        assertEq(hash, expected);
    }

    function test_HashBatchPreview() public view {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);

        uint256[] memory userNonces = new uint256[](1);
        userNonces[0] = 0;

        bytes32 hash = voting.hashBatchPreview(records, userNonces, 0);

        bytes32[] memory itemDigests = _buildItemDigests(records, userNonces);
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

    function test_RealWorldSubVotingScenario() public {
        // 실제 서브투표 시나리오: 3명 사용자, 각각 1개씩 질문 투표
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](3);
        records[0] = _createVoteRecord(user1, "alice", 1, 1, "QuestionA", "AnswerA1", 100);
        records[1] = _createVoteRecord(user2, "bob", 1, 2, "QuestionB", "AnswerB1", 200);
        records[2] = _createVoteRecord(user3, "charlie", 1, 3, "QuestionC", "AnswerC1", 150);

        uint256[] memory userNonces = new uint256[](3);
        userNonces[0] = 0;
        userNonces[1] = 0;
        userNonces[2] = 0;

        bytes[] memory userSigs = new bytes[](3);
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]);
        userSigs[1] = _signVoteRecord(user2PrivateKey, records[1], userNonces[1]);
        userSigs[2] = _signVoteRecord(user3PrivateKey, records[2], userNonces[2]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, 0);

        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig);

        // 검증: 총 3건, 각 votingId별로 한 건씩 저장
        assertEq(voting.getVoteCount(1), 3);
        for (uint256 i = 0; i < 3; i++) {
            SubVoting.VoteRecord[] memory result = voting.getVotesByVotingId(1, i + 1, 0, 10);
            assertEq(result.length, 1);
        }
        assertEq(voting.getVotesByVotingId(1, 1, 0, 10)[0].votingFor, "QuestionA");
        assertEq(voting.getVotesByVotingId(1, 2, 0, 10)[0].votingFor, "QuestionB");
        assertEq(voting.getVotesByVotingId(1, 3, 0, 10)[0].votingFor, "QuestionC");
    }

    function test_SequentialBatches() public {
        // 순차적인 여러 배치 제출
        for (uint256 batchIdx = 0; batchIdx < 3; batchIdx++) {
            SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](2);
            records[0] = _createVoteRecord(
                user1, "user1", 1, batchIdx * 2 + 1, "Question", "Answer", 100
            );
            records[1] = _createVoteRecord(
                user2, "user2", 1, batchIdx * 2 + 2, "Question", "Answer", 200
            );

            uint256[] memory userNonces = new uint256[](2);
            userNonces[0] = batchIdx;
            userNonces[1] = batchIdx;

            bytes[] memory userSigs = new bytes[](2);
            userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]);
            userSigs[1] = _signVoteRecord(user2PrivateKey, records[1], userNonces[1]);

            bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, batchIdx);

            voting.submitSubVoteBatch(records, userNonces, userSigs, batchIdx, executorSig);
        }

        // 검증: 총 6개 투표 (3배치 x 2투표)
        assertEq(voting.getVoteCount(1), 6);
        assertTrue(voting.userNonceUsed(user1, 0));
        assertTrue(voting.userNonceUsed(user1, 1));
        assertTrue(voting.userNonceUsed(user1, 2));
    }

    function test_SameVotingIdDifferentUsers() public {
        // 같은 votingId에 여러 사용자 투표
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](3);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "SameQuestion", "AnswerA", 100);
        records[1] = _createVoteRecord(user2, "user2", 1, 1, "SameQuestion", "AnswerB", 200);
        records[2] = _createVoteRecord(user3, "user3", 1, 1, "SameQuestion", "AnswerC", 150);

        uint256[] memory userNonces = new uint256[](3);
        userNonces[0] = 0;
        userNonces[1] = 0;
        userNonces[2] = 0;

        bytes[] memory userSigs = new bytes[](3);
        userSigs[0] = _signVoteRecord(user1PrivateKey, records[0], userNonces[0]);
        userSigs[1] = _signVoteRecord(user2PrivateKey, records[1], userNonces[1]);
        userSigs[2] = _signVoteRecord(user3PrivateKey, records[2], userNonces[2]);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, records, userNonces, 0);

        voting.submitSubVoteBatch(records, userNonces, userSigs, 0, executorSig);

        // 같은 votingId로 조회 (offset=0, limit=100)
        SubVoting.VoteRecord[] memory sameVotingIdVotes = voting.getVotesByVotingId(1, 1, 0, 100);
        assertEq(sameVotingIdVotes.length, 3);

        // 모두 같은 질문이지만 답변은 다름
        assertEq(sameVotingIdVotes[0].votedOn, "AnswerA");
        assertEq(sameVotingIdVotes[1].votedOn, "AnswerB");
        assertEq(sameVotingIdVotes[2].votedOn, "AnswerC");
    }
}
