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

    // EIP-712 TypeHash constants (must match contract)
    bytes32 private constant VOTE_RECORD_TYPEHASH =
        keccak256(
            "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 questionId,uint256 optionId,uint256 votingAmt,address user)"
        );
    bytes32 private constant USER_BATCH_TYPEHASH =
        keccak256(
            "UserBatch(address user,uint256 userNonce,bytes32 recordsHash)"
        );
    bytes32 private constant BATCH_TYPEHASH =
        keccak256("Batch(uint256 batchNonce)");

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
        uint256 recordId,
        string memory userId,
        uint256 missionId,
        uint256 votingId,
        uint256 questionId,
        uint256 optionId,
        uint256 votingAmt
    ) internal view returns (SubVoting.VoteRecord memory) {
        return SubVoting.VoteRecord({
            recordId: recordId,
            timestamp: block.timestamp,
            missionId: missionId,
            votingId: votingId,
            userId: userId,
            questionId: questionId,
            optionId: optionId,
            votingAmt: votingAmt
        });
    }

    function _hashVoteRecord(
        SubVoting.VoteRecord memory record,
        address user
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    VOTE_RECORD_TYPEHASH,
                    record.timestamp,
                    record.missionId,
                    record.votingId,
                    record.questionId,
                    record.optionId,
                    record.votingAmt,
                    user
                )
            );
    }

    function _signUserBatch(
        uint256 privateKey,
        SubVoting.VoteRecord[] memory records,
        uint256 userNonce
    ) internal view returns (bytes memory) {
        address user = vm.addr(privateKey);

        // Build record digests
        bytes32[] memory recordDigests = new bytes32[](records.length);
        for (uint256 i = 0; i < records.length; i++) {
            recordDigests[i] = _hashVoteRecord(records[i], user);
        }

        // Hash the records
        bytes32 recordsHash = keccak256(abi.encodePacked(recordDigests));

        // Create user batch digest
        bytes32 structHash = keccak256(
            abi.encode(USER_BATCH_TYPEHASH, user, userNonce, recordsHash)
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", voting.domainSeparator(), structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _signBatchSig(
        uint256 privateKey,
        uint256 batchNonce
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(abi.encode(BATCH_TYPEHASH, batchNonce));
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", voting.domainSeparator(), structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _createBatch(
        SubVoting.VoteRecord[] memory records,
        address user,
        uint256 userNonce,
        uint256 privateKey
    ) internal view returns (SubVoting.UserVoteBatch memory) {
        return SubVoting.UserVoteBatch({
            records: records,
            userBatchSig: SubVoting.UserBatchSig({
                user: user,
                userNonce: userNonce,
                signature: _signUserBatch(privateKey, records, userNonce)
            })
        });
    }

    // Helper to create single record batch
    function _createSingleRecordBatch(
        SubVoting.VoteRecord memory record,
        address user,
        uint256 userNonce,
        uint256 privateKey
    ) internal view returns (SubVoting.UserVoteBatch memory) {
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = record;
        return _createBatch(records, user, userNonce, privateKey);
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
        SubVoting.VoteRecord memory record = _createVoteRecord(1, "user1", 1, 1, 1, 1, 100);

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createSingleRecordBatch(record, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 검증 - 중복 체크이므로 nonce 0이 사용되었는지 확인
        assertTrue(voting.usedUserNonces(user1, 0));
        assertTrue(voting.usedBatchNonces(executorSigner, 0));

        // 집계 검증
        (uint256[11] memory optionVotes, uint256 total) = voting.getQuestionAggregates(1, 1);
        assertEq(optionVotes[1], 100);
        assertEq(total, 100);
    }

    function test_SubmitMultipleUsersVotes() public {
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](3);
        batches[0] = _createSingleRecordBatch(
            _createVoteRecord(1, "user1", 1, 1, 1, 1, 100),
            user1, 0, user1PrivateKey
        );
        batches[1] = _createSingleRecordBatch(
            _createVoteRecord(2, "user2", 1, 2, 1, 2, 200),
            user2, 0, user2PrivateKey
        );
        batches[2] = _createSingleRecordBatch(
            _createVoteRecord(3, "user3", 1, 3, 2, 1, 150),
            user3, 0, user3PrivateKey
        );

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 검증
        assertTrue(voting.usedUserNonces(user1, 0));
        assertTrue(voting.usedUserNonces(user2, 0));
        assertTrue(voting.usedUserNonces(user3, 0));
        assertTrue(voting.usedBatchNonces(executorSigner, 0));

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

    function test_SubmitMultipleRecordsPerUser() public {
        // 한 유저가 여러 레코드를 제출
        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](3);
        records[0] = _createVoteRecord(1, "user1", 1, 1, 1, 1, 100);
        records[1] = _createVoteRecord(2, "user1", 1, 1, 1, 2, 50);
        records[2] = _createVoteRecord(3, "user1", 1, 1, 2, 1, 75);

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 검증
        assertTrue(voting.usedUserNonces(user1, 0));

        // 집계 검증 - Question1
        (uint256[11] memory q1Votes, uint256 q1Total) = voting.getQuestionAggregates(1, 1);
        assertEq(q1Votes[1], 100);
        assertEq(q1Votes[2], 50);
        assertEq(q1Total, 150);

        // 집계 검증 - Question2
        (uint256[11] memory q2Votes, uint256 q2Total) = voting.getQuestionAggregates(1, 2);
        assertEq(q2Votes[1], 75);
        assertEq(q2Total, 75);
    }

    // ========================================
    // 서명 검증 실패 케이스
    // ========================================

    function test_RevertWhen_InvalidExecutorSignature() public {
        SubVoting.VoteRecord memory record = _createVoteRecord(1, "user1", 1, 1, 1, 1, 100);

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createSingleRecordBatch(record, user1, 0, user1PrivateKey);

        // 잘못된 private key로 서명
        bytes memory wrongExecutorSig = _signBatchSig(user1PrivateKey, 0);

        vm.expectRevert(SubVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(batches, 0, wrongExecutorSig);
    }

    function test_SoftFailWhen_InvalidUserSignature() public {
        // Soft-fail 테스트: 잘못된 서명의 유저는 실패하지만 다른 유저는 성공
        SubVoting.VoteRecord memory record1 = _createVoteRecord(1, "user1", 1, 1, 1, 1, 100);
        SubVoting.VoteRecord memory record2 = _createVoteRecord(2, "user2", 1, 1, 1, 1, 200);

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](2);
        // user1: 잘못된 서명 (user2의 키로 서명)
        batches[0] = _createSingleRecordBatch(record1, user1, 0, user2PrivateKey);
        // user2: 올바른 서명
        batches[1] = _createSingleRecordBatch(record2, user2, 0, user2PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 전체 트랜잭션은 성공 (soft-fail로 user1만 실패)
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // user1은 nonce 사용되지 않음 (실패)
        assertFalse(voting.usedUserNonces(user1, 0));
        // user2는 nonce 0 사용됨 (성공)
        assertTrue(voting.usedUserNonces(user2, 0));

        // 집계는 user2의 투표만 반영
        (uint256[11] memory optionVotes, uint256 total) = voting.getQuestionAggregates(1, 1);
        assertEq(optionVotes[1], 200);
        assertEq(total, 200);
    }

    function test_RevertWhen_UserNonceInvalid() public {
        SubVoting.VoteRecord memory record1 = _createVoteRecord(1, "user1", 1, 1, 1, 1, 100);

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createSingleRecordBatch(record1, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 두 번째 제출 - 같은 nonce 사용 시도 (순차 시스템이므로 nonce=0은 이미 사용됨)
        SubVoting.VoteRecord memory record2 = _createVoteRecord(2, "user1", 1, 2, 1, 2, 150);
        batches[0] = _createSingleRecordBatch(record2, user1, 0, user1PrivateKey); // 같은 nonce
        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        // Soft-fail로 처리되지만, 성공한 유저가 없으면 revert
        vm.expectRevert(SubVoting.NoSuccessfulUser.selector);
        voting.submitMultiUserBatch(batches, 1, executorSig2);
    }

    function test_RevertWhen_BatchNonceAlreadyUsed() public {
        SubVoting.VoteRecord memory record1 = _createVoteRecord(1, "user1", 1, 1, 1, 1, 100);

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createSingleRecordBatch(record1, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 두 번째 제출 실패 (같은 batch nonce)
        SubVoting.VoteRecord memory record2 = _createVoteRecord(2, "user1", 1, 2, 1, 2, 150);
        batches[0] = _createSingleRecordBatch(record2, user1, 1, user1PrivateKey);
        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 0); // 같은 batch nonce

        vm.expectRevert(SubVoting.BatchNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig2);
    }

    // ========================================
    // Soft-fail 레코드 검증 테스트
    // ========================================

    function test_SoftFailWhen_QuestionNotAllowed() public {
        // 허용되지 않은 질문에 투표
        SubVoting.VoteRecord memory record1 = _createVoteRecord(1, "user1", 1, 1, 99, 1, 100); // questionId 99 not allowed
        SubVoting.VoteRecord memory record2 = _createVoteRecord(2, "user2", 1, 1, 1, 1, 200); // valid

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](2);
        batches[0] = _createSingleRecordBatch(record1, user1, 0, user1PrivateKey);
        batches[1] = _createSingleRecordBatch(record2, user2, 0, user2PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 전체 트랜잭션은 성공 (soft-fail)
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // user1도 nonce 0 사용됨 (배치 수준 검증은 통과)
        assertTrue(voting.usedUserNonces(user1, 0));
        assertTrue(voting.usedUserNonces(user2, 0));

        // 집계는 user2의 투표만 반영 (user1의 레코드는 per-record 검증에서 실패)
        (uint256[11] memory optionVotes, uint256 total) = voting.getQuestionAggregates(1, 1);
        assertEq(optionVotes[1], 200);
        assertEq(total, 200);
    }

    function test_SoftFailWhen_OptionNotAllowed() public {
        // 허용되지 않은 선택지에 투표
        SubVoting.VoteRecord memory record1 = _createVoteRecord(1, "user1", 1, 1, 1, 5, 100); // optionId 5 not allowed
        SubVoting.VoteRecord memory record2 = _createVoteRecord(2, "user2", 1, 1, 1, 1, 200); // valid

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](2);
        batches[0] = _createSingleRecordBatch(record1, user1, 0, user1PrivateKey);
        batches[1] = _createSingleRecordBatch(record2, user2, 0, user2PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 집계는 user2의 투표만 반영
        (uint256[11] memory optionVotes, uint256 total) = voting.getQuestionAggregates(1, 1);
        assertEq(optionVotes[1], 200);
        assertEq(total, 200);
    }

    function test_SoftFailWhen_InvalidOptionId() public {
        // 유효하지 않은 optionId (0 또는 >10)
        SubVoting.VoteRecord memory record1 = _createVoteRecord(1, "user1", 1, 1, 1, 0, 100); // optionId 0 invalid
        SubVoting.VoteRecord memory record2 = _createVoteRecord(2, "user2", 1, 1, 1, 1, 200); // valid

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](2);
        batches[0] = _createSingleRecordBatch(record1, user1, 0, user1PrivateKey);
        batches[1] = _createSingleRecordBatch(record2, user2, 0, user2PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 집계는 user2의 투표만 반영
        (uint256[11] memory optionVotes, uint256 total) = voting.getQuestionAggregates(1, 1);
        assertEq(optionVotes[1], 200);
        assertEq(total, 200);
    }

    // ========================================
    // 0 포인트 투표 스킵 테스트
    // ========================================

    function test_SkipZeroAmountVote() public {
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](2);
        batches[0] = _createSingleRecordBatch(
            _createVoteRecord(1, "user1", 1, 1, 1, 1, 0), // 0 포인트 - 스킵됨
            user1, 0, user1PrivateKey
        );
        batches[1] = _createSingleRecordBatch(
            _createVoteRecord(2, "user2", 1, 2, 1, 1, 100),
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

    function test_DomainSeparator() public view {
        bytes32 separator = voting.domainSeparator();
        assertTrue(separator != bytes32(0));
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

    function test_RevertWhen_SetExecutorSignerNotOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        voting.setExecutorSigner(user1);
    }

    // ========================================
    // 경계값 테스트
    // ========================================

    /// @notice StringTooLong은 이제 soft-fail로 처리됨
    ///         단일 유저가 StringTooLong으로 실패하면 NoSuccessfulUser 발생
    function test_SoftFail_StringTooLong_AllUsersFail() public {
        // 101자 문자열 생성 (MAX_STRING_LENGTH = 100 초과)
        bytes memory longString = new bytes(101);
        for (uint256 i = 0; i < 101; i++) {
            longString[i] = "a";
        }
        string memory tooLongUserId = string(longString);

        // 레코드 직접 생성
        SubVoting.VoteRecord memory record = SubVoting.VoteRecord({
            recordId: 1,
            timestamp: block.timestamp,
            missionId: 1,
            votingId: 1,
            userId: tooLongUserId,
            questionId: 1,
            optionId: 1,
            votingAmt: 100
        });

        // 더미 서명 생성
        bytes memory dummySig = new bytes(65);

        SubVoting.VoteRecord[] memory records = new SubVoting.VoteRecord[](1);
        records[0] = record;

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = SubVoting.UserVoteBatch({
            records: records,
            userBatchSig: SubVoting.UserBatchSig({
                user: user1,
                userNonce: 0,
                signature: dummySig
            })
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // StringTooLong은 soft-fail이므로 유저가 실패하고, 다른 유저가 없으면 NoSuccessfulUser
        vm.expectRevert(SubVoting.NoSuccessfulUser.selector);
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
        SubVoting.VoteRecord memory record = _createVoteRecord(1, "user1", 1, 1, 1, 1, 100);
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createSingleRecordBatch(record, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 질문 비활성화
        voting.setQuestion(1, 1, "Question1", false);

        // 비활성화된 질문에 투표 시도 - soft-fail로 성공한 유저가 없으면 revert
        SubVoting.VoteRecord memory record2 = _createVoteRecord(2, "user2", 1, 2, 1, 1, 200);
        SubVoting.UserVoteBatch[] memory batches2 = new SubVoting.UserVoteBatch[](1);
        batches2[0] = _createSingleRecordBatch(record2, user2, 0, user2PrivateKey);

        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        // user2의 배치 검증은 통과하지만 레코드 저장 시 실패하여 stored=0
        vm.expectRevert(SubVoting.NoSuccessfulUser.selector);
        voting.submitMultiUserBatch(batches2, 1, executorSig2);
    }

    function test_QuestionReEnabled() public {
        // 질문 비활성화
        voting.setQuestion(1, 1, "Question1", false);

        // 질문 재활성화
        voting.setQuestion(1, 1, "Question1", true);

        // 재활성화된 질문에 투표 성공
        SubVoting.VoteRecord memory record = _createVoteRecord(1, "user1", 1, 1, 1, 1, 100);
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createSingleRecordBatch(record, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        assertTrue(voting.usedUserNonces(user1, 0));
    }

    function test_UpdateQuestionText() public {
        string memory newText = "UpdatedQuestion";
        voting.setQuestion(1, 1, newText, true);
        assertEq(voting.questionName(1, 1), newText);
    }

    // ========================================
    // ExecutorSigner 관리 테스트
    // ========================================

    function test_ExecutorSignerChange_IndependentNonces() public {
        // 이전 executor로 첫 투표
        SubVoting.VoteRecord memory record = _createVoteRecord(1, "user1", 1, 1, 1, 1, 100);
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createSingleRecordBatch(record, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 기존 executor의 nonce 0이 사용됨
        assertTrue(voting.usedBatchNonces(executorSigner, 0));

        // executor 변경
        uint256 newExecutorPrivateKey = 0x5555;
        address newExecutor = vm.addr(newExecutorPrivateKey);
        voting.setExecutorSigner(newExecutor);

        // 새 executor의 nonce 0은 사용되지 않은 상태
        assertFalse(voting.usedBatchNonces(newExecutor, 0));

        // 새 executor로 투표 성공 (batchNonce 0 사용 가능)
        SubVoting.VoteRecord memory record2 = _createVoteRecord(2, "user2", 1, 2, 1, 1, 200);
        SubVoting.UserVoteBatch[] memory batches2 = new SubVoting.UserVoteBatch[](1);
        batches2[0] = _createSingleRecordBatch(record2, user2, 0, user2PrivateKey);

        bytes32 structHash = keccak256(abi.encode(BATCH_TYPEHASH, uint256(0)));
        bytes32 digest2 = keccak256(
            abi.encodePacked("\x19\x01", voting.domainSeparator(), structHash)
        );
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(newExecutorPrivateKey, digest2);
        bytes memory newExecutorSig = abi.encodePacked(r2, s2, v2);

        voting.submitMultiUserBatch(batches2, 0, newExecutorSig);
        assertTrue(voting.usedUserNonces(user2, 0));
    }

    // ========================================
    // 중복 레코드 테스트
    // ========================================

    function test_DuplicateRecordSkipped() public {
        // 첫 투표 성공
        SubVoting.VoteRecord memory record = _createVoteRecord(1, "user1", 1, 1, 1, 1, 100);
        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createSingleRecordBatch(record, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 집계 확인
        (uint256[11] memory optionVotes1, uint256 total1) = voting.getQuestionAggregates(1, 1);
        assertEq(optionVotes1[1], 100);
        assertEq(total1, 100);

        // 같은 user가 nonce 1로 동일한 레코드 해시를 다시 제출 시도
        // (consumed 체크로 인해 스킵됨)
        SubVoting.UserVoteBatch[] memory batches2 = new SubVoting.UserVoteBatch[](1);
        batches2[0] = _createSingleRecordBatch(record, user1, 1, user1PrivateKey);

        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        // 배치는 성공하지만 중복 레코드는 스킵되어 stored=0 → revert
        vm.expectRevert(SubVoting.NoSuccessfulUser.selector);
        voting.submitMultiUserBatch(batches2, 1, executorSig2);
    }

    function test_UpdateOptionText() public {
        string memory newText = "UpdatedOption";
        voting.setOption(1, 1, 1, newText, true);
        assertEq(voting.optionName(1, 1, 1), newText);
    }

    // ========================================
    // UserMissionResult 이벤트 테스트
    // ========================================

    function test_UserMissionResultEvent_Success() public {
        SubVoting.VoteRecord memory record = _createVoteRecord(1, "user1", 1, 1, 1, 1, 100);

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](1);
        batches[0] = _createSingleRecordBatch(record, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // UserMissionResult 이벤트 확인
        vm.expectEmit(true, false, false, true);
        uint256[] memory emptyFailedIds = new uint256[](0);
        emit SubVoting.UserMissionResult(1, true, emptyFailedIds, 0);

        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_UserMissionResultEvent_Failure() public {
        // 허용되지 않은 질문에 투표
        SubVoting.VoteRecord memory record = _createVoteRecord(1, "user1", 1, 1, 99, 1, 100);

        SubVoting.UserVoteBatch[] memory batches = new SubVoting.UserVoteBatch[](2);
        batches[0] = _createSingleRecordBatch(record, user1, 0, user1PrivateKey);
        batches[1] = _createSingleRecordBatch(
            _createVoteRecord(2, "user2", 1, 1, 1, 1, 200),
            user2, 0, user2PrivateKey
        );

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // user1의 UserMissionResult 이벤트 (실패)
        vm.expectEmit(true, false, false, false);
        uint256[] memory failedIds = new uint256[](1);
        failedIds[0] = 1;
        emit SubVoting.UserMissionResult(1, false, failedIds, 5); // REASON_QUESTION_NOT_ALLOWED = 5

        voting.submitMultiUserBatch(batches, 0, executorSig);
    }
}
