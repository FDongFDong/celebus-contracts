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

    function _createBatch(
        SubVoting.VoteRecord memory record,
        address user,
        uint256 userNonce,
        uint256 privateKey
    ) internal view returns (SubVoting.UserVoteBatch memory) {
        return SubVoting.UserVoteBatch({
            record: record,
            userSig: SubVoting.UserSig({
                user: user,
                userNonce: userNonce,
                signature: _signUserSig(privateKey, record, userNonce)
            })
        });
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
        SubVoting.VoteRecord memory record = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createBatch(record, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 검증
        assertTrue(voting.userNonceUsed(user1, 0));
        assertTrue(voting.batchNonceUsed(executorSigner, 0));

        // 집계 검증
        (uint256[11] memory optionVotes, uint256 total) = voting.getQuestionAggregates(1, 1);
        assertEq(optionVotes[1], 100);
        assertEq(total, 100);
    }

    function test_SubmitMultipleUsersVotes() public {
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](3);
        batches[0] = _createBatch(
            _createVoteRecord("user1", 1, 1, 1, 1, 100),
            user1, 0, user1PrivateKey
        );
        batches[1] = _createBatch(
            _createVoteRecord("user2", 1, 2, 1, 2, 200),
            user2, 0, user2PrivateKey
        );
        batches[2] = _createBatch(
            _createVoteRecord("user3", 1, 3, 2, 1, 150),
            user3, 0, user3PrivateKey
        );

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(batches, 0, executorSig);

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
        SubVoting.VoteRecord memory record = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createBatch(record, user1, 0, user1PrivateKey);

        // 잘못된 private key로 서명
        bytes memory wrongExecutorSig = _signBatchSig(user1PrivateKey, 0);

        vm.expectRevert(SubVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(batches, 0, wrongExecutorSig);
    }

    function test_RevertWhen_InvalidUserSignature() public {
        SubVoting.VoteRecord memory record = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        // 잘못된 private key로 서명
        batches[0] = _createBatch(record, user1, 0, user2PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(SubVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_RevertWhen_UserNonceAlreadyUsed() public {
        SubVoting.VoteRecord memory record1 = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createBatch(record1, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 두 번째 제출 실패 (같은 user nonce)
        SubVoting.VoteRecord memory record2 = _createVoteRecord("user1", 1, 2, 1, 2, 150);
        batches[0] = _createBatch(record2, user1, 0, user1PrivateKey); // 같은 nonce
        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        vm.expectRevert(SubVoting.UserNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(batches, 1, executorSig2);
    }

    function test_RevertWhen_BatchNonceAlreadyUsed() public {
        SubVoting.VoteRecord memory record1 = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createBatch(record1, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 두 번째 제출 실패 (같은 batch nonce)
        SubVoting.VoteRecord memory record2 = _createVoteRecord("user1", 1, 2, 1, 2, 150);
        batches[0] = _createBatch(record2, user1, 1, user1PrivateKey);
        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 0); // 같은 batch nonce

        vm.expectRevert(SubVoting.BatchNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig2);
    }

    // ========================================
    // 데이터 검증 실패 케이스
    // ========================================

    function test_RevertWhen_QuestionNotAllowed() public {
        SubVoting.VoteRecord memory record = _createVoteRecord("user1", 1, 1, 99, 1, 100); // questionId 99 not allowed

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createBatch(record, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(abi.encodeWithSelector(SubVoting.QuestionNotAllowed.selector, 1, 99));
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_RevertWhen_OptionNotAllowed() public {
        SubVoting.VoteRecord memory record = _createVoteRecord("user1", 1, 1, 1, 5, 100); // optionId 5 not allowed

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createBatch(record, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(abi.encodeWithSelector(SubVoting.OptionNotAllowed.selector, 1, 5));
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_RevertWhen_InvalidOptionId() public {
        SubVoting.VoteRecord memory record = _createVoteRecord("user1", 1, 1, 1, 0, 100); // optionId 0 invalid

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createBatch(record, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(abi.encodeWithSelector(SubVoting.InvalidOptionId.selector, 0));
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    // ========================================
    // 0 포인트 투표 스킵 테스트
    // ========================================

    function test_SkipZeroAmountVote() public {
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](2);
        batches[0] = _createBatch(
            _createVoteRecord("user1", 1, 1, 1, 1, 0), // 0 포인트 - 스킵됨
            user1, 0, user1PrivateKey
        );
        batches[1] = _createBatch(
            _createVoteRecord("user2", 1, 2, 1, 1, 100),
            user2, 0, user2PrivateKey
        );

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 집계 검증 - 0 포인트 투표는 스킵되어 100만 집계됨
        (uint256[11] memory optionVotes, uint256 total) = voting.getQuestionAggregates(1, 1);
        assertEq(optionVotes[1], 100);
        assertEq(total, 100);
    }

    // ========================================
    // View 함수 테스트
    // ========================================

    function test_GetVotesByMissionVotingId() public {
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](3);
        batches[0] = _createBatch(
            _createVoteRecord("user1", 1, 1, 1, 1, 100),
            user1, 0, user1PrivateKey
        );
        batches[1] = _createBatch(
            _createVoteRecord("user2", 1, 2, 1, 2, 200),
            user2, 0, user2PrivateKey
        );
        batches[2] = _createBatch(
            _createVoteRecord("user3", 1, 1, 2, 1, 150), // 같은 votingId
            user3, 0, user3PrivateKey
        );

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

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
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](3);
        batches[0] = _createBatch(
            _createVoteRecord("user1", 1, 1, 1, 1, 100),
            user1, 0, user1PrivateKey
        );
        batches[1] = _createBatch(
            _createVoteRecord("user2", 1, 2, 1, 1, 200),
            user2, 0, user2PrivateKey
        );
        batches[2] = _createBatch(
            _createVoteRecord("user3", 1, 3, 1, 2, 150),
            user3, 0, user3PrivateKey
        );

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 선택지별 득표 확인
        assertEq(voting.getOptionVotes(1, 1, 1), 300); // user1 + user2
        assertEq(voting.getOptionVotes(1, 1, 2), 150); // user3
    }

    function test_GetQuestionWithOptions() public {
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](2);
        batches[0] = _createBatch(
            _createVoteRecord("user1", 1, 1, 1, 1, 100),
            user1, 0, user1PrivateKey
        );
        batches[1] = _createBatch(
            _createVoteRecord("user2", 1, 2, 1, 2, 200),
            user2, 0, user2PrivateKey
        );

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

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

    // ========================================
    // 추가 권한 테스트
    // ========================================

    function test_RevertWhen_SetQuestionNotOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        voting.setQuestion(1, 1, "Unauthorized", true);
    }

    function test_RevertWhen_SetOptionNotOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        voting.setOption(1, 1, 1, "Unauthorized", true);
    }

    function test_RevertWhen_CancelUserNonceNotOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        voting.cancelAllUserNonceUpTo(user2, 10);
    }

    function test_RevertWhen_SetExecutorSignerNotOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        voting.setExecutorSigner(user1);
    }

    // ========================================
    // 경계값 테스트
    // ========================================

    function test_RevertWhen_StringTooLong() public {
        // 101자 문자열 생성 (MAX_STRING_LENGTH = 100 초과)
        bytes memory longString = new bytes(101);
        for (uint256 i = 0; i < 101; i++) {
            longString[i] = "a";
        }
        string memory tooLongUserId = string(longString);

        // 레코드 직접 생성 (헬퍼 함수의 preview 호출을 피하기 위해)
        SubVoting.VoteRecord memory record = SubVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: 1,
            votingId: 1,
            userId: tooLongUserId,
            questionId: 1,
            optionId: 1,
            votingAmt: 100
        });

        // 더미 서명 생성 (실제 서명 검증 전에 StringTooLong이 먼저 발생)
        bytes memory dummySig = new bytes(65);

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = SubVoting.UserVoteBatch({
            record: record,
            userSig: SubVoting.UserSig({
                user: user1,
                userNonce: 0,
                signature: dummySig
            })
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(SubVoting.StringTooLong.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_SetOptionMaxId() public {
        // MAX_OPTION_ID = 10까지 허용
        voting.setQuestion(2, 1, "TestQuestion", true);
        voting.setOption(2, 1, 10, "MaxOption", true);
        assertEq(voting.optionName(2, 1, 10), "MaxOption");
        assertTrue(voting.allowedOption(2, 1, 10));
    }

    // ========================================
    // 상태 전이 테스트
    // ========================================

    function test_QuestionDisabledAfterVoting() public {
        // 먼저 성공적인 투표
        SubVoting.VoteRecord memory record = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createBatch(record, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 질문 비활성화
        voting.setQuestion(1, 1, "Question1", false);

        // 비활성화된 질문에 투표 시도
        SubVoting.VoteRecord memory record2 = _createVoteRecord("user2", 1, 2, 1, 1, 200);
        SubVoting.UserVoteBatch[] memory batches2 = new SubVoting.UserVoteBatch[](1);
        batches2[0] = _createBatch(record2, user2, 0, user2PrivateKey);

        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        vm.expectRevert(abi.encodeWithSelector(SubVoting.QuestionNotAllowed.selector, 1, 1));
        voting.submitMultiUserBatch(batches2, 1, executorSig2);
    }

    function test_OptionDisabledAfterVoting() public {
        // 먼저 성공적인 투표
        SubVoting.VoteRecord memory record = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createBatch(record, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 옵션 비활성화
        voting.setOption(1, 1, 1, "OptionA", false);

        // 비활성화된 옵션에 투표 시도
        SubVoting.VoteRecord memory record2 = _createVoteRecord("user2", 1, 2, 1, 1, 200);
        SubVoting.UserVoteBatch[] memory batches2 = new SubVoting.UserVoteBatch[](1);
        batches2[0] = _createBatch(record2, user2, 0, user2PrivateKey);

        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        vm.expectRevert(abi.encodeWithSelector(SubVoting.OptionNotAllowed.selector, 1, 1));
        voting.submitMultiUserBatch(batches2, 1, executorSig2);
    }

    function test_QuestionReEnabled() public {
        // 질문 비활성화
        voting.setQuestion(1, 1, "Question1", false);

        // 질문 재활성화
        voting.setQuestion(1, 1, "Question1", true);

        // 재활성화된 질문에 투표 성공
        SubVoting.VoteRecord memory record = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createBatch(record, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        assertTrue(voting.userNonceUsed(user1, 0));
    }

    function test_UpdateQuestionText() public {
        string memory newText = "UpdatedQuestion";
        voting.setQuestion(1, 1, newText, true);
        assertEq(voting.questionName(1, 1), newText);
    }

    // ========================================
    // ExecutorSigner 관리 테스트
    // ========================================

    function test_ExecutorSignerChangeInvalidatesOldNonces() public {
        // 이전 executor로 첫 투표
        SubVoting.VoteRecord memory record = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createBatch(record, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // executor 변경
        uint256 newExecutorPrivateKey = 0x5555;
        address newExecutor = vm.addr(newExecutorPrivateKey);
        voting.setExecutorSigner(newExecutor);

        // 새 executor로 투표 성공 (batchNonce 0 사용 가능 - 새 executor이므로)
        SubVoting.VoteRecord memory record2 = _createVoteRecord("user2", 1, 2, 1, 1, 200);
        SubVoting.UserVoteBatch[] memory batches2 = new SubVoting.UserVoteBatch[](1);
        batches2[0] = _createBatch(record2, user2, 0, user2PrivateKey);

        bytes32 digest2 = voting.hashBatchPreview(0);
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(newExecutorPrivateKey, digest2);
        bytes memory newExecutorSig = abi.encodePacked(r2, s2, v2);

        voting.submitMultiUserBatch(batches2, 0, newExecutorSig);
        assertTrue(voting.userNonceUsed(user2, 0));
    }

    // ========================================
    // 중복 레코드 테스트
    // ========================================

    function test_DuplicateRecordSkipped() public {
        // 첫 투표 성공
        SubVoting.VoteRecord memory record = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createBatch(record, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 집계 확인
        (uint256[11] memory optionVotes1, uint256 total1) = voting.getQuestionAggregates(1, 1);
        assertEq(optionVotes1[1], 100);
        assertEq(total1, 100);

        // 동일한 user1이 nonce 0으로 다시 제출 시도 - 이미 사용됨
        SubVoting.VoteRecord memory record2 = _createVoteRecord("user1", 1, 2, 1, 1, 200);
        SubVoting.UserVoteBatch[] memory batches2 = new SubVoting.UserVoteBatch[](1);
        batches2[0] = _createBatch(record2, user1, 0, user1PrivateKey);

        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        // 이미 사용된 nonce이므로 스킵되거나 revert됨
        vm.expectRevert(SubVoting.UserNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(batches2, 1, executorSig2);
    }

    function test_UpdateOptionText() public {
        string memory newText = "UpdatedOption";
        voting.setOption(1, 1, 1, newText, true);
        assertEq(voting.optionName(1, 1, 1), newText);
    }
}
