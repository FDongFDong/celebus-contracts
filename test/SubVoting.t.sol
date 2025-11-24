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

        // 질문과 선택지 설정 (missionId=1)
        voting.setQuestion(1, 1, "Question1", true);
        voting.setQuestion(1, 2, "Question2", true);
        voting.setOption(1, 1, 1, "OptionA", true);
        voting.setOption(1, 1, 2, "OptionB", true);
        voting.setOption(1, 2, 1, "OptionC", true);
        voting.setOption(1, 2, 2, "OptionD", true);
    }

    function _createVoteRecord(
        address userAddress,
        string memory userId,
        uint256 missionId,
        uint256 votingId,
        uint256 questionId,
        uint256 optionId,
        uint256 votingAmt
    ) internal view returns (SubVoting.VoteRecord memory) {
        return SubVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: missionId,
            votingId: votingId,
            userAddress: userAddress,
            userId: userId,
            questionId: questionId,
            optionId: optionId,
            votingAmt: votingAmt
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
    // 질문/선택지 설정 테스트
    // ========================================

    function test_SetQuestion() public {
        voting.setQuestion(2, 1, "NewQuestion", true);
        assertEq(voting.questionName(2, 1), "NewQuestion");
        assertTrue(voting.allowedQuestion(2, 1));
    }

    function test_SetOption() public {
        voting.setQuestion(2, 1, "Q", true);
        voting.setOption(2, 1, 1, "NewOption", true);
        assertEq(voting.optionName(2, 1, 1), "NewOption");
        assertTrue(voting.allowedOption(2, 1, 1));
    }

    function test_RevertWhen_SetOptionInvalidId() public {
        vm.expectRevert(abi.encodeWithSelector(SubVoting.InvalidOptionId.selector, 0));
        voting.setOption(1, 1, 0, "Invalid", true);

        vm.expectRevert(abi.encodeWithSelector(SubVoting.InvalidOptionId.selector, 11));
        voting.setOption(1, 1, 11, "Invalid", true);
    }

    // ========================================
    // 투표 제출 성공 케이스
    // ========================================

    function test_SubmitSingleUserVote() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(
            user1, "user1", 1, 1, 1, 1, 100
        );

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](1);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);

        // 검증
        assertTrue(voting.userNonceUsed(user1, 0));
        assertTrue(voting.batchNonceUsed(executorSigner, 0));

        // 집계 검증
        (uint256[11] memory optionVotes, uint256 total) = voting.getQuestionAggregates(1, 1);
        assertEq(optionVotes[1], 100);
        assertEq(total, 100);
    }

    function test_SubmitMultipleUsersVotes() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](3);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        records[1] = _createVoteRecord(user2, "user2", 1, 2, 1, 2, 200);
        records[2] = _createVoteRecord(user3, "user3", 1, 3, 2, 1, 150);

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](3);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });
        userSigs[1] = SubVoting.UserSig({
            user: user2,
            userNonce: 0,
            signature: _signUserSig(user2PrivateKey, records[1], 0)
        });
        userSigs[2] = SubVoting.UserSig({
            user: user3,
            userNonce: 0,
            signature: _signUserSig(user3PrivateKey, records[2], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);

        // 검증
        assertTrue(voting.userNonceUsed(user1, 0));
        assertTrue(voting.userNonceUsed(user2, 0));
        assertTrue(voting.userNonceUsed(user3, 0));
        assertTrue(voting.batchNonceUsed(executorSigner, 0));

        // 집계 검증 - Question1
        (uint256[11] memory q1Votes, uint256 q1Total) = voting.getQuestionAggregates(1, 1);
        assertEq(q1Votes[1], 100); // user1 voted option1
        assertEq(q1Votes[2], 200); // user2 voted option2
        assertEq(q1Total, 300);

        // 집계 검증 - Question2
        (uint256[11] memory q2Votes, uint256 q2Total) = voting.getQuestionAggregates(1, 2);
        assertEq(q2Votes[1], 150); // user3 voted option1
        assertEq(q2Total, 150);
    }

    // ========================================
    // 서명 검증 실패 케이스
    // ========================================

    function test_RevertWhen_InvalidExecutorSignature() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](1);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });

        // 잘못된 private key로 서명
        bytes memory wrongExecutorSig = _signBatchSig(user1PrivateKey, 0);

        vm.expectRevert(SubVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(records, userSigs, 0, wrongExecutorSig);
    }

    function test_RevertWhen_InvalidUserSignature() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](1);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            // 잘못된 private key로 서명
            signature: _signUserSig(user2PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(SubVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);
    }

    function test_RevertWhen_UserNonceAlreadyUsed() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](1);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);

        // 두 번째 제출 실패 (같은 user nonce)
        records[0] = _createVoteRecord(user1, "user1", 1, 2, 1, 2, 150);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0, // 같은 nonce
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });
        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        vm.expectRevert(SubVoting.UserNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(records, userSigs, 1, executorSig2);
    }

    function test_RevertWhen_BatchNonceAlreadyUsed() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](1);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);

        // 두 번째 제출 실패 (같은 batch nonce)
        records[0] = _createVoteRecord(user1, "user1", 1, 2, 1, 2, 150);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 1,
            signature: _signUserSig(user1PrivateKey, records[0], 1)
        });
        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 0); // 같은 batch nonce

        vm.expectRevert(SubVoting.BatchNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(records, userSigs, 0, executorSig2);
    }

    // ========================================
    // 데이터 검증 실패 케이스
    // ========================================

    function test_RevertWhen_QuestionNotAllowed() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 99, 1, 100); // questionId 99 not allowed

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](1);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(abi.encodeWithSelector(SubVoting.QuestionNotAllowed.selector, 1, 99));
        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);
    }

    function test_RevertWhen_OptionNotAllowed() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 5, 100); // optionId 5 not allowed for question 1

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](1);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(abi.encodeWithSelector(SubVoting.OptionNotAllowed.selector, 1, 5));
        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);
    }

    function test_RevertWhen_InvalidOptionId() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 0, 100); // optionId 0 invalid

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](1);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(abi.encodeWithSelector(SubVoting.InvalidOptionId.selector, 0));
        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);
    }

    // ========================================
    // 0 포인트 투표 스킵 테스트
    // ========================================

    function test_SkipZeroAmountVote() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](2);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 0); // 0 포인트 - 스킵됨
        records[1] = _createVoteRecord(user2, "user2", 1, 2, 1, 1, 100);

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](2);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });
        userSigs[1] = SubVoting.UserSig({
            user: user2,
            userNonce: 0,
            signature: _signUserSig(user2PrivateKey, records[1], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);

        // 집계 검증 - 0 포인트 투표는 스킵되어 100만 집계됨
        (uint256[11] memory optionVotes, uint256 total) = voting.getQuestionAggregates(1, 1);
        assertEq(optionVotes[1], 100);
        assertEq(total, 100);
    }

    // ========================================
    // View 함수 테스트
    // ========================================

    function test_GetVotesByMissionVotingId() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](3);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        records[1] = _createVoteRecord(user2, "user2", 1, 2, 1, 2, 200);
        records[2] = _createVoteRecord(user3, "user3", 1, 1, 2, 1, 150); // 같은 votingId

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](3);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });
        userSigs[1] = SubVoting.UserSig({
            user: user2,
            userNonce: 0,
            signature: _signUserSig(user2PrivateKey, records[1], 0)
        });
        userSigs[2] = SubVoting.UserSig({
            user: user3,
            userNonce: 0,
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

    function test_GetOptionVotes() public {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](3);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        records[1] = _createVoteRecord(user2, "user2", 1, 2, 1, 1, 200);
        records[2] = _createVoteRecord(user3, "user3", 1, 3, 1, 2, 150);

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](3);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });
        userSigs[1] = SubVoting.UserSig({
            user: user2,
            userNonce: 0,
            signature: _signUserSig(user2PrivateKey, records[1], 0)
        });
        userSigs[2] = SubVoting.UserSig({
            user: user3,
            userNonce: 0,
            signature: _signUserSig(user3PrivateKey, records[2], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);

        // 선택지별 득표 확인
        assertEq(voting.getOptionVotes(1, 1, 1), 300); // user1 + user2
        assertEq(voting.getOptionVotes(1, 1, 2), 150); // user3
    }

    function test_GetQuestionWithOptions() public {
        // 투표 제출
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](2);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        records[1] = _createVoteRecord(user2, "user2", 1, 2, 1, 2, 200);

        SubVoting.UserSig[] memory userSigs = new SubVoting.UserSig[](2);
        userSigs[0] = SubVoting.UserSig({
            user: user1,
            userNonce: 0,
            signature: _signUserSig(user1PrivateKey, records[0], 0)
        });
        userSigs[1] = SubVoting.UserSig({
            user: user2,
            userNonce: 0,
            signature: _signUserSig(user2PrivateKey, records[1], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(records, userSigs, 0, executorSig);

        // 질문 정보 조회
        SubVoting.QuestionInfo memory info = voting.getQuestionWithOptions(1, 1);
        assertEq(info.questionText, "Question1");
        assertTrue(info.questionAllowed);
        assertEq(info.totalVotes, 300);
        assertEq(info.options.length, 2);
        assertEq(info.options[0].optionId, 1);
        assertEq(info.options[0].votes, 100);
        assertEq(info.options[1].optionId, 2);
        assertEq(info.options[1].votes, 200);
    }

    function test_DomainSeparator() public view {
        bytes32 separator = voting.domainSeparator();
        assertTrue(separator != bytes32(0));
    }

    // ========================================
    // Nonce 취소 테스트
    // ========================================

    function test_CancelUserNonce() public {
        voting.cancelAllUserNonceUpTo(user1, 10);
        assertEq(voting.minUserNonce(user1), 10);
    }

    function test_RevertWhen_CancelUserNonceTooLow() public {
        voting.cancelAllUserNonceUpTo(user1, 10);

        vm.expectRevert(SubVoting.UserNonceTooLow.selector);
        voting.cancelAllUserNonceUpTo(user1, 5);
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
}
