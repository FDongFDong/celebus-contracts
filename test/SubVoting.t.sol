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

    function _signUserSig(
        uint256 privateKey,
        SubVoting.VoteRecord memory record,
        uint256 userNonce
    ) internal view returns (bytes memory) {
        bytes32 digest = voting.hashUserSigPreview(
            vm.addr(privateKey),
            userNonce,
            record
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _signBatchSig(
        uint256 privateKey,
        uint256 batchNonce
    ) internal view returns (bytes memory) {
        bytes32 digest = voting.hashBatchPreview(batchNonce);

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

    // ========================================
    // 투표 제출 성공 케이스
    // ========================================

    function test_SubmitSingleUserVote() public {
        // 1명의 사용자가 1개의 투표
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(
            user1, "user1", 1, 1, "Question1", "AnswerA", 100
        );

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](1);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            recordIndex: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);

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

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](3);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            recordIndex: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });
        userSigs[1] = SubVoting.UserSig({
            user: user2,
            userNonce: 0,
            recordIndex: 1,
            signature: _signUserSig(user2PrivateKey, records[1], 0)
        });
        userSigs[2] = SubVoting.UserSig({
            user: user3,
            userNonce: 0,
            recordIndex: 2,
            signature: _signUserSig(user3PrivateKey, records[2], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);

        // 검증
        assertEq(voting.getVoteCount(1), 3);
        assertTrue(voting.userNonceUsed(user1, 0));
        assertTrue(voting.userNonceUsed(user2, 0));
        assertTrue(voting.userNonceUsed(user3, 0));
        assertTrue(voting.batchNonceUsed(executorSigner, 0));
    }

    // ========================================
    // 서명 검증 실패 케이스
    // ========================================

    function test_RevertWhen_InvalidExecutorSignature() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](1);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            recordIndex: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });

        // 잘못된 private key로 서명
        bytes memory wrongExecutorSig = _signBatchSig(user1PrivateKey, 0);

        vm.expectRevert(SubVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(records, userSigs, 0, wrongExecutorSig);
    }

    function test_RevertWhen_InvalidUserSignature() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](1);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            recordIndex: 0,
            // 잘못된 private key로 서명
            signature: _signUserSig(user2PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(SubVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);
    }

    function test_RevertWhen_UserNonceAlreadyUsed() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](1);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            recordIndex: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);

        // 두 번째 제출 실패 (같은 user nonce)
        records[0] = _createVoteRecord(user1, "user1", 1, 2, "Question2", "AnswerB", 150);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0, // 같은 nonce
            recordIndex: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });
        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        vm.expectRevert(SubVoting.UserNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(records, userSigs, 1, executorSig2);
    }

    function test_RevertWhen_BatchNonceAlreadyUsed() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](1);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            recordIndex: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);

        // 두 번째 제출 실패 (같은 batch nonce)
        records[0] = _createVoteRecord(user1, "user1", 1, 2, "Question2", "AnswerB", 150);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 1,
            recordIndex: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 1)
        });
        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 0); // 같은 batch nonce

        vm.expectRevert(SubVoting.BatchNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(records, userSigs, 0, executorSig2);
    }

    // ========================================
    // View 함수 테스트
    // ========================================

    function test_GetVotesByMissionVotingId() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](3);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);
        records[1] = _createVoteRecord(user2, "user2", 1, 2, "Question2", "AnswerB", 200);
        records[2] = _createVoteRecord(user3, "user3", 1, 1, "Question1", "AnswerC", 150); // 같은 votingId

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](3);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            recordIndex: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });
        userSigs[1] = SubVoting.UserSig({
            user: user2,
            userNonce: 0,
            recordIndex: 1,
            signature: _signUserSig(user2PrivateKey, records[1], 0)
        });
        userSigs[2] = SubVoting.UserSig({
            user: user3,
            userNonce: 0,
            recordIndex: 2,
            signature: _signUserSig(user3PrivateKey, records[2], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);

        // votingId 1로 조회
        SubVoting.VoteRecord[] memory votingId1 = voting.getVotesByMissionVotingId(1, 1);
        assertEq(votingId1.length, 2); // user1, user3
        assertEq(votingId1[0].userId, "user1");
        assertEq(votingId1[1].userId, "user3");

        // votingId 2로 조회
        SubVoting.VoteRecord[] memory votingId2 = voting.getVotesByMissionVotingId(1, 2);
        assertEq(votingId2.length, 1); // user2
        assertEq(votingId2[0].userId, "user2");
    }

    function test_GetVoteCountByVotingId() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](3);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Question1", "AnswerA", 100);
        records[1] = _createVoteRecord(user2, "user2", 1, 1, "Question1", "AnswerB", 200);
        records[2] = _createVoteRecord(user3, "user3", 1, 2, "Question2", "AnswerC", 150);

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](3);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            recordIndex: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });
        userSigs[1] = SubVoting.UserSig({
            user: user2,
            userNonce: 0,
            recordIndex: 1,
            signature: _signUserSig(user2PrivateKey, records[1], 0)
        });
        userSigs[2] = SubVoting.UserSig({
            user: user3,
            userNonce: 0,
            recordIndex: 2,
            signature: _signUserSig(user3PrivateKey, records[2], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);

        // 개수 확인
        assertEq(voting.getVoteCountByVotingId(1, 1), 2); // user1 + user2
        assertEq(voting.getVoteCountByVotingId(1, 2), 1); // user3
    }

    function test_DomainSeparator() public view {
        bytes32 separator = voting.domainSeparator();
        assertTrue(separator != bytes32(0));
    }
}
