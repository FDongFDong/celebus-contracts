// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MainVoting} from "../src/vote/MainVoting.sol";

contract MainVotingTest is Test {
    MainVoting public voting;

    address public owner;
    address public executorSigner;
    address public user1;
    address public user2;
    address public user3;

    uint256 public user1PrivateKey;
    uint256 public user2PrivateKey;
    uint256 public user3PrivateKey;
    uint256 public executorPrivateKey;

    // EIP-712 Type Hashes (컨트랙트와 동일)
    bytes32 private constant VOTE_RECORD_TYPEHASH =
        keccak256(
            "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 optionId,uint8 voteType,uint256 votingAmt,address user)"
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

        voting = new MainVoting(owner);
        voting.setExecutorSigner(executorSigner);

        // 후보자 설정 (missionId=1)
        voting.setArtist(1, 1, "Artist1", true);
        voting.setArtist(1, 2, "Artist2", true);
        voting.setArtist(1, 3, "Artist3", true);

        // 투표 타입 설정 (0=Forget, 1=Remember)
        voting.setVoteTypeName(0, "Forget");
        voting.setVoteTypeName(1, "Remember");
    }

    // ========================================
    // Helper Functions
    // ========================================

    function _buildDomainSeparator() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
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

    function _createVoteRecord(
        string memory userId,
        uint256 missionId,
        uint256 votingId,
        uint256 optionId,
        uint8 voteType,
        uint256 votingAmt
    ) internal view returns (MainVoting.VoteRecord memory) {
        return MainVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: missionId,
            votingId: votingId,
            optionId: optionId,
            voteType: voteType,
            userId: userId,
            votingAmt: votingAmt
        });
    }

    function _hashVoteRecord(MainVoting.VoteRecord memory record, address user) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                VOTE_RECORD_TYPEHASH,
                record.timestamp,
                record.missionId,
                record.votingId,
                record.optionId,
                record.voteType,
                record.votingAmt,
                user
            )
        );
    }

    function _signUserBatch(
        uint256 privateKey,
        MainVoting.VoteRecord[] memory records,
        uint256 userNonce
    ) internal view returns (bytes memory) {
        address user = vm.addr(privateKey);

        // recordsHash 계산 (user 주소 포함)
        bytes32[] memory recordDigests = new bytes32[](records.length);
        for (uint256 i = 0; i < records.length; i++) {
            recordDigests[i] = _hashVoteRecord(records[i], user);
        }
        bytes32 recordsHash = keccak256(abi.encodePacked(recordDigests));

        // UserBatch 해시
        bytes32 structHash = keccak256(
            abi.encode(
                USER_BATCH_TYPEHASH,
                user,
                userNonce,
                recordsHash
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _signBatchSig(
        uint256 privateKey,
        uint256 batchNonce
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(abi.encode(BATCH_TYPEHASH, batchNonce));
        bytes32 digest = _hashTypedDataV4(structHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    /// @notice 새 구조에 맞는 UserVoteBatch 생성 헬퍼
    function _createUserVoteBatch(
        MainVoting.VoteRecord[] memory records,
        address user,
        uint256 userNonce,
        uint256 privateKey
    ) internal view returns (MainVoting.UserVoteBatch memory) {
        return MainVoting.UserVoteBatch({
            records: records,
            userBatchSig: MainVoting.UserBatchSig({
                user: user,
                userNonce: userNonce,
                signature: _signUserBatch(privateKey, records, userNonce)
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
        vm.expectRevert(MainVoting.ZeroAddress.selector);
        voting.setExecutorSigner(address(0));
    }

    function test_RevertWhen_SetExecutorSignerNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        voting.setExecutorSigner(address(0x5555));
    }

    // ========================================
    // 후보자/투표타입 설정 테스트
    // ========================================

    function test_SetArtist() public {
        voting.setArtist(2, 1, "NewArtist", true);
        assertEq(voting.artistName(2, 1), "NewArtist");
        assertTrue(voting.allowedArtist(2, 1));
    }

    function test_SetVoteTypeName() public {
        voting.setVoteTypeName(0, "NewForget");
        assertEq(voting.voteTypeName(0), "NewForget");
    }

    function test_RevertWhen_SetVoteTypeNameInvalid() public {
        vm.expectRevert(abi.encodeWithSelector(MainVoting.InvalidVoteType.selector, 2));
        voting.setVoteTypeName(2, "Invalid");
    }

    // ========================================
    // 투표 제출 성공 케이스 (새 구조 UserVoteBatch[])
    // ========================================

    function test_SubmitSingleUserVote() public {
        // 1명의 사용자가 1개의 투표
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100); // Remember

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 검증
        assertTrue(voting.userNonceUsed(user1, 0));
        assertTrue(voting.batchNonceUsed(executorSigner, 0));

        // 집계 검증
        (uint256 remember, uint256 forget, uint256 total) = voting.getArtistAggregates(1, 1);
        assertEq(remember, 100);
        assertEq(forget, 0);
        assertEq(total, 100);
    }

    function test_SubmitMultipleUsersVotes() public {
        // 3명의 사용자가 각각 1개의 투표
        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](3);

        // User1
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](1);
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100); // Remember
        batches[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        // User2
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord("user2", 1, 2, 2, 0, 200); // Forget
        batches[1] = _createUserVoteBatch(records2, user2, 0, user2PrivateKey);

        // User3
        MainVoting.VoteRecord[] memory records3 = new MainVoting.VoteRecord[](1);
        records3[0] = _createVoteRecord("user3", 1, 3, 3, 1, 150); // Remember
        batches[2] = _createUserVoteBatch(records3, user3, 0, user3PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 검증
        assertTrue(voting.userNonceUsed(user1, 0));
        assertTrue(voting.userNonceUsed(user2, 0));
        assertTrue(voting.userNonceUsed(user3, 0));
        assertTrue(voting.batchNonceUsed(executorSigner, 0));

        // 집계 검증 - Artist1 (Remember)
        (uint256 r1, uint256 f1, uint256 t1) = voting.getArtistAggregates(1, 1);
        assertEq(r1, 100);
        assertEq(f1, 0);
        assertEq(t1, 100);

        // 집계 검증 - Artist2 (Forget)
        (uint256 r2, uint256 f2, uint256 t2) = voting.getArtistAggregates(1, 2);
        assertEq(r2, 0);
        assertEq(f2, 200);
        assertEq(t2, 200);

        // 집계 검증 - Artist3 (Remember)
        (uint256 r3, uint256 f3, uint256 t3) = voting.getArtistAggregates(1, 3);
        assertEq(r3, 150);
        assertEq(f3, 0);
        assertEq(t3, 150);
    }

    function test_SubmitUserWithMultipleRecords() public {
        // 1명의 사용자가 3개의 투표
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](3);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100); // Remember Artist1
        records[1] = _createVoteRecord("user1", 1, 2, 2, 0, 50);  // Forget Artist2
        records[2] = _createVoteRecord("user1", 1, 3, 1, 1, 80);  // Remember Artist1

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 집계 검증 - Artist1 (Remember: 100 + 80)
        (uint256 r1, uint256 f1, uint256 t1) = voting.getArtistAggregates(1, 1);
        assertEq(r1, 180);
        assertEq(f1, 0);
        assertEq(t1, 180);

        // 집계 검증 - Artist2 (Forget: 50)
        (uint256 r2, uint256 f2, uint256 t2) = voting.getArtistAggregates(1, 2);
        assertEq(r2, 0);
        assertEq(f2, 50);
        assertEq(t2, 50);
    }

    function test_SubmitMixedVoteTypes() public {
        // 1명의 사용자가 같은 후보자에게 Remember + Forget
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](2);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100); // Remember Artist1
        records[1] = _createVoteRecord("user1", 1, 2, 1, 0, 50);  // Forget Artist1

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 집계 검증 - Artist1 (Remember: 100, Forget: 50)
        (uint256 r1, uint256 f1, uint256 t1) = voting.getArtistAggregates(1, 1);
        assertEq(r1, 100);
        assertEq(f1, 50);
        assertEq(t1, 150);
    }

    // ========================================
    // 서명 검증 실패 케이스
    // ========================================

    function test_RevertWhen_InvalidExecutorSignature() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        // 잘못된 private key로 서명
        bytes memory wrongExecutorSig = _signBatchSig(user1PrivateKey, 0);

        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(batches, 0, wrongExecutorSig);
    }

    function test_RevertWhen_InvalidUserSignature() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](1);
        // 잘못된 private key로 서명
        batches[0] = MainVoting.UserVoteBatch({
            records: records,
            userBatchSig: MainVoting.UserBatchSig({
                user: user1,
                userNonce: 0,
                signature: _signUserBatch(user2PrivateKey, records, 0) // 잘못된 키
            })
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    // test_RevertWhen_UserAddressMismatch 삭제됨 - userAddress 필드가 제거되어 더 이상 유효하지 않음

    function test_RevertWhen_UserNonceAlreadyUsed() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 두 번째 제출 실패 (같은 user nonce)
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord("user1", 1, 2, 2, 0, 150);

        MainVoting.UserVoteBatch[] memory batches2 = new MainVoting.UserVoteBatch[](1);
        batches2[0] = _createUserVoteBatch(records2, user1, 0, user1PrivateKey); // 같은 nonce

        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        vm.expectRevert(MainVoting.UserNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(batches2, 1, executorSig2);
    }

    function test_RevertWhen_BatchNonceAlreadyUsed() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 두 번째 제출 실패 (같은 batch nonce)
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord("user1", 1, 2, 2, 0, 150);

        MainVoting.UserVoteBatch[] memory batches2 = new MainVoting.UserVoteBatch[](1);
        batches2[0] = _createUserVoteBatch(records2, user1, 1, user1PrivateKey);

        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 0); // 같은 batch nonce

        vm.expectRevert(MainVoting.BatchNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(batches2, 0, executorSig2);
    }

    // ========================================
    // 데이터 검증 실패 케이스
    // ========================================

    function test_RevertWhen_ArtistNotAllowed() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 99, 1, 100); // optionId 99 not allowed

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(abi.encodeWithSelector(MainVoting.ArtistNotAllowed.selector, 1, 99));
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_RevertWhen_InvalidVoteType() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 5, 100); // voteType 5 invalid

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(abi.encodeWithSelector(MainVoting.InvalidVoteType.selector, 5));
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_RevertWhen_EmptyBatches() public {
        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](0);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(MainVoting.InvalidRecordIndices.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    // ========================================
    // 0 포인트 투표 스킵 테스트
    // ========================================

    function test_SkipZeroAmountVote() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](2);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 0);   // 0 포인트 - 스킵됨
        records[1] = _createVoteRecord("user1", 1, 2, 1, 1, 100);

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 집계 검증 - 0 포인트 투표는 스킵되어 100만 집계됨
        (uint256 remember, uint256 forget, uint256 total) = voting.getArtistAggregates(1, 1);
        assertEq(remember, 100);
        assertEq(forget, 0);
        assertEq(total, 100);
    }

    // ========================================
    // View 함수 테스트
    // ========================================

    function test_GetArtistAggregates() public {
        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](2);

        // User1 - 2개 투표
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](2);
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100); // Remember Artist1
        records1[1] = _createVoteRecord("user1", 1, 2, 1, 0, 50);  // Forget Artist1
        batches[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        // User2 - 1개 투표
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord("user2", 1, 3, 1, 1, 200); // Remember Artist1
        batches[1] = _createUserVoteBatch(records2, user2, 0, user2PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 집계 검증 - Artist1 (Remember: 100 + 200, Forget: 50)
        (uint256 remember, uint256 forget, uint256 total) = voting.getArtistAggregates(1, 1);
        assertEq(remember, 300);
        assertEq(forget, 50);
        assertEq(total, 350);
    }

    function test_GetVoteSummariesByMissionVotingId() public {
        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](2);

        // User1
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](1);
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        batches[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        // User2 - 같은 votingId
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord("user2", 1, 1, 2, 0, 200);
        batches[1] = _createUserVoteBatch(records2, user2, 0, user2PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // votingId 1로 조회
        MainVoting.VoteRecordSummary[] memory summaries = voting.getVoteSummariesByMissionVotingId(1, 1);
        assertEq(summaries.length, 2);
        assertEq(summaries[0].userId, "user1");
        assertEq(summaries[0].votingFor, "Artist1");
        assertEq(summaries[0].votedOn, "Remember");
        assertEq(summaries[1].userId, "user2");
        assertEq(summaries[1].votingFor, "Artist2");
        assertEq(summaries[1].votedOn, "Forget");
    }

    function test_DomainSeparator() public view {
        bytes32 separator = voting.domainSeparator();
        assertEq(separator, _buildDomainSeparator());
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

        vm.expectRevert(MainVoting.UserNonceTooLow.selector);
        voting.cancelAllUserNonceUpTo(user1, 5);
    }

    function test_CancelBatchNonce() public {
        voting.cancelAllBatchNonceUpTo(10);
        assertEq(voting.minBatchNonce(executorSigner), 10);
    }

    function test_RevertWhen_CancelBatchNonceTooLow() public {
        voting.cancelAllBatchNonceUpTo(10);

        vm.expectRevert(MainVoting.BatchNonceTooLow.selector);
        voting.cancelAllBatchNonceUpTo(5);
    }

    function test_RevertWhen_CancelBatchNonceNotAuthorized() public {
        vm.prank(user1);
        vm.expectRevert(MainVoting.NotOwnerOrExecutor.selector);
        voting.cancelAllBatchNonceUpTo(10);
    }

    // ========================================
    // 순차 배치 테스트
    // ========================================

    function test_SequentialBatches() public {
        // 순차적인 여러 배치 제출
        for (uint256 batchIdx = 0; batchIdx < 3; batchIdx++) {
            MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](2);

            // User1
            MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](1);
            records1[0] = _createVoteRecord(
                "user1", 1, batchIdx * 2 + 1, 1, 1, 100
            );
            batches[0] = _createUserVoteBatch(
                records1, user1, batchIdx, user1PrivateKey
            );

            // User2
            MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
            records2[0] = _createVoteRecord(
                "user2", 1, batchIdx * 2 + 2, 2, 0, 200
            );
            batches[1] = _createUserVoteBatch(
                records2, user2, batchIdx, user2PrivateKey
            );

            bytes memory executorSig = _signBatchSig(executorPrivateKey, batchIdx);
            voting.submitMultiUserBatch(batches, batchIdx, executorSig);
        }

        // 집계 검증 - Artist1 (Remember: 100 * 3)
        (uint256 r1, uint256 f1, uint256 t1) = voting.getArtistAggregates(1, 1);
        assertEq(r1, 300);
        assertEq(f1, 0);
        assertEq(t1, 300);

        // 집계 검증 - Artist2 (Forget: 200 * 3)
        (uint256 r2, uint256 f2, uint256 t2) = voting.getArtistAggregates(1, 2);
        assertEq(r2, 0);
        assertEq(f2, 600);
        assertEq(t2, 600);
    }

    // ========================================
    // 추가 테스트: 권한 검증
    // ========================================

    function test_RevertWhen_SetArtistNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        voting.setArtist(1, 99, "UnauthorizedArtist", true);
    }

    function test_RevertWhen_CancelUserNonceNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        voting.cancelAllUserNonceUpTo(user2, 10);
    }

    // ========================================
    // 추가 테스트: 경계값 테스트
    // ========================================

    function test_RevertWhen_UserBatchTooLarge() public {
        // MAX_RECORDS_PER_USER_BATCH = 20 초과
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](21);
        for (uint256 i = 0; i < 21; i++) {
            records[i] = _createVoteRecord("user1", 1, i + 1, 1, 1, 100);
        }

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(MainVoting.UserBatchTooLarge.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_RevertWhen_StringTooLong() public {
        // MAX_STRING_LENGTH = 100 초과
        bytes memory longUserId = new bytes(101);
        for (uint256 i = 0; i < 101; i++) {
            longUserId[i] = "a";
        }

        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = MainVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: 1,
            votingId: 1,
            optionId: 1,
            voteType: 1,
            userId: string(longUserId),
            votingAmt: 100
        });

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(MainVoting.StringTooLong.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_UserBatchExactMax() public {
        // MAX_RECORDS_PER_USER_BATCH = 20 정확히
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](20);
        for (uint256 i = 0; i < 20; i++) {
            records[i] = _createVoteRecord("user1", 1, i + 1, 1, 1, 100);
        }

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 집계 검증 - Artist1 (Remember: 100 * 20)
        (uint256 r, , uint256 t) = voting.getArtistAggregates(1, 1);
        assertEq(r, 2000);
        assertEq(t, 2000);
    }

    // ========================================
    // 추가 테스트: 상태 전이 테스트
    // ========================================

    function test_ArtistDisabledAfterVoting() public {
        // 첫 번째 투표 성공
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](1);
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[] memory batches1 = new MainVoting.UserVoteBatch[](1);
        batches1[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        bytes memory executorSig1 = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches1, 0, executorSig1);

        // 아티스트 비활성화
        voting.setArtist(1, 1, "Artist1", false);

        // 두 번째 투표 실패해야 함
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord("user1", 1, 2, 1, 1, 100);

        MainVoting.UserVoteBatch[] memory batches2 = new MainVoting.UserVoteBatch[](1);
        batches2[0] = _createUserVoteBatch(records2, user1, 1, user1PrivateKey);

        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        vm.expectRevert(abi.encodeWithSelector(MainVoting.ArtistNotAllowed.selector, 1, 1));
        voting.submitMultiUserBatch(batches2, 1, executorSig2);
    }

    function test_ArtistReEnabled() public {
        // 아티스트 비활성화
        voting.setArtist(1, 1, "Artist1", false);

        // 아티스트 재활성화
        voting.setArtist(1, 1, "Artist1", true);

        // 투표 성공해야 함
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        (uint256 r, , ) = voting.getArtistAggregates(1, 1);
        assertEq(r, 100);
    }

    // ========================================
    // 추가 테스트: ExecutorSigner 관리
    // ========================================

    function test_ExecutorSignerChangeInvalidatesOldNonces() public {
        address newExecutor = address(0x5555);
        uint256 newExecutorPrivateKey = 0x5555;

        // 기존 executorSigner의 nonce 0 사용
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](1);
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        MainVoting.UserVoteBatch[] memory batches1 = new MainVoting.UserVoteBatch[](1);
        batches1[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);
        bytes memory executorSig1 = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches1, 0, executorSig1);

        // executorSigner 변경
        voting.setExecutorSigner(newExecutor);

        // 이전 executorSigner의 nonce는 무효화됨 (max로 설정)
        assertEq(voting.minBatchNonce(executorSigner), type(uint256).max);
        assertEq(voting.minBatchNonce(newExecutor), 0);
    }

    // ========================================
    // 추가 테스트: 기타 테스트
    // ========================================

    function test_DuplicateRecordSkipped() public {
        // 첫 번째 제출
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](1);
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[] memory batches1 = new MainVoting.UserVoteBatch[](1);
        batches1[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        bytes memory executorSig1 = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches1, 0, executorSig1);

        // 동일한 레코드로 두 번째 제출 시도 (다른 nonce로)
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100); // 동일한 레코드

        MainVoting.UserVoteBatch[] memory batches2 = new MainVoting.UserVoteBatch[](1);
        batches2[0] = _createUserVoteBatch(records2, user1, 1, user1PrivateKey);

        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);
        voting.submitMultiUserBatch(batches2, 1, executorSig2);

        // 집계는 첫 번째만 반영 (중복 스킵)
        (uint256 r, , uint256 t) = voting.getArtistAggregates(1, 1);
        assertEq(r, 100); // 100만 집계됨 (200이 아님)
        assertEq(t, 100);
    }

    function test_UpdateArtistName() public {
        // 아티스트 이름 변경
        voting.setArtist(1, 1, "NewArtistName", true);
        assertEq(voting.artistName(1, 1), "NewArtistName");
    }
}
