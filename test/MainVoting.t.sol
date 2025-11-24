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
            "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,uint256 artistId,uint8 voteType,uint256 votingAmt)"
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

        // 아티스트 설정 (missionId=1)
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
        address userAddress,
        string memory userId,
        uint256 missionId,
        uint256 votingId,
        uint256 artistId,
        uint8 voteType,
        uint256 votingAmt
    ) internal view returns (MainVoting.VoteRecord memory) {
        return MainVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: missionId,
            votingId: votingId,
            userAddress: userAddress,
            artistId: artistId,
            voteType: voteType,
            userId: userId,
            votingAmt: votingAmt
        });
    }

    function _hashVoteRecord(MainVoting.VoteRecord memory record) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                VOTE_RECORD_TYPEHASH,
                record.timestamp,
                record.missionId,
                record.votingId,
                record.userAddress,
                record.artistId,
                record.voteType,
                record.votingAmt
            )
        );
    }

    function _signUserBatch(
        uint256 privateKey,
        MainVoting.VoteRecord[] memory records,
        uint256 userNonce
    ) internal view returns (bytes memory) {
        // recordsHash 계산
        bytes32[] memory recordDigests = new bytes32[](records.length);
        for (uint256 i = 0; i < records.length; i++) {
            recordDigests[i] = _hashVoteRecord(records[i]);
        }
        bytes32 recordsHash = keccak256(abi.encodePacked(recordDigests));

        // UserBatch 해시
        bytes32 structHash = keccak256(
            abi.encode(
                USER_BATCH_TYPEHASH,
                vm.addr(privateKey),
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
    // 아티스트/투표타입 설정 테스트
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
    // 투표 제출 성공 케이스
    // ========================================

    function test_SubmitSingleUserVote() public {
        // 1명의 사용자가 1개의 투표
        MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](1);
        records[0] = new MainVoting.VoteRecord[](1);
        records[0][0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100); // Remember

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            signature: _signUserBatch(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);

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
        MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](3);

        records[0] = new MainVoting.VoteRecord[](1);
        records[0][0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100); // Remember

        records[1] = new MainVoting.VoteRecord[](1);
        records[1][0] = _createVoteRecord(user2, "user2", 1, 2, 2, 0, 200); // Forget

        records[2] = new MainVoting.VoteRecord[](1);
        records[2][0] = _createVoteRecord(user3, "user3", 1, 3, 3, 1, 150); // Remember

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](3);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            signature: _signUserBatch(user1PrivateKey, records[0], 0)
        });
        userBatchSigs[1] = MainVoting.UserBatchSig({
            user: user2,
            userNonce: 0,
            signature: _signUserBatch(user2PrivateKey, records[1], 0)
        });
        userBatchSigs[2] = MainVoting.UserBatchSig({
            user: user3,
            userNonce: 0,
            signature: _signUserBatch(user3PrivateKey, records[2], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);

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
        MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](1);
        records[0] = new MainVoting.VoteRecord[](3);
        records[0][0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100); // Remember Artist1
        records[0][1] = _createVoteRecord(user1, "user1", 1, 2, 2, 0, 50);  // Forget Artist2
        records[0][2] = _createVoteRecord(user1, "user1", 1, 3, 1, 1, 80);  // Remember Artist1

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            signature: _signUserBatch(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);

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
        // 1명의 사용자가 같은 아티스트에게 Remember + Forget
        MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](1);
        records[0] = new MainVoting.VoteRecord[](2);
        records[0][0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100); // Remember Artist1
        records[0][1] = _createVoteRecord(user1, "user1", 1, 2, 1, 0, 50);  // Forget Artist1

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            signature: _signUserBatch(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);

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
        MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](1);
        records[0] = new MainVoting.VoteRecord[](1);
        records[0][0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            signature: _signUserBatch(user1PrivateKey, records[0], 0)
        });

        // 잘못된 private key로 서명
        bytes memory wrongExecutorSig = _signBatchSig(user1PrivateKey, 0);

        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, wrongExecutorSig);
    }

    function test_RevertWhen_InvalidUserSignature() public {
        MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](1);
        records[0] = new MainVoting.VoteRecord[](1);
        records[0][0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            // 잘못된 private key로 서명
            signature: _signUserBatch(user2PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
    }

    function test_RevertWhen_UserAddressMismatch() public {
        MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](1);
        records[0] = new MainVoting.VoteRecord[](1);
        // 레코드의 userAddress는 user1이지만
        records[0][0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        // 서명은 user2로 함
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user2,
            userNonce: 0,
            signature: _signUserBatch(user2PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
    }

    function test_RevertWhen_UserNonceAlreadyUsed() public {
        MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](1);
        records[0] = new MainVoting.VoteRecord[](1);
        records[0][0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            signature: _signUserBatch(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);

        // 두 번째 제출 실패 (같은 user nonce)
        records[0][0] = _createVoteRecord(user1, "user1", 1, 2, 2, 0, 150);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0, // 같은 nonce
            signature: _signUserBatch(user1PrivateKey, records[0], 0)
        });
        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        vm.expectRevert(MainVoting.UserNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(records, userBatchSigs, 1, executorSig2);
    }

    function test_RevertWhen_BatchNonceAlreadyUsed() public {
        MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](1);
        records[0] = new MainVoting.VoteRecord[](1);
        records[0][0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            signature: _signUserBatch(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);

        // 두 번째 제출 실패 (같은 batch nonce)
        records[0][0] = _createVoteRecord(user1, "user1", 1, 2, 2, 0, 150);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 1,
            signature: _signUserBatch(user1PrivateKey, records[0], 1)
        });
        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 0); // 같은 batch nonce

        vm.expectRevert(MainVoting.BatchNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig2);
    }

    // ========================================
    // 데이터 검증 실패 케이스
    // ========================================

    function test_RevertWhen_ArtistNotAllowed() public {
        MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](1);
        records[0] = new MainVoting.VoteRecord[](1);
        records[0][0] = _createVoteRecord(user1, "user1", 1, 1, 99, 1, 100); // artistId 99 not allowed

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            signature: _signUserBatch(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(abi.encodeWithSelector(MainVoting.ArtistNotAllowed.selector, 1, 99));
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
    }

    function test_RevertWhen_InvalidVoteType() public {
        MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](1);
        records[0] = new MainVoting.VoteRecord[](1);
        records[0][0] = _createVoteRecord(user1, "user1", 1, 1, 1, 5, 100); // voteType 5 invalid

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            signature: _signUserBatch(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(abi.encodeWithSelector(MainVoting.InvalidVoteType.selector, 5));
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
    }

    function test_RevertWhen_InvalidRecordIndices() public {
        MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](2);
        records[0] = new MainVoting.VoteRecord[](1);
        records[0][0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        records[1] = new MainVoting.VoteRecord[](1);
        records[1][0] = _createVoteRecord(user2, "user2", 1, 2, 2, 0, 200);

        // userBatchSigs 길이 불일치
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            signature: _signUserBatch(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(MainVoting.InvalidRecordIndices.selector);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
    }

    // ========================================
    // 0 포인트 투표 스킵 테스트
    // ========================================

    function test_SkipZeroAmountVote() public {
        MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](1);
        records[0] = new MainVoting.VoteRecord[](2);
        records[0][0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 0);   // 0 포인트 - 스킵됨
        records[0][1] = _createVoteRecord(user1, "user1", 1, 2, 1, 1, 100);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            signature: _signUserBatch(user1PrivateKey, records[0], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);

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
        MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](2);

        records[0] = new MainVoting.VoteRecord[](2);
        records[0][0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100); // Remember Artist1
        records[0][1] = _createVoteRecord(user1, "user1", 1, 2, 1, 0, 50);  // Forget Artist1

        records[1] = new MainVoting.VoteRecord[](1);
        records[1][0] = _createVoteRecord(user2, "user2", 1, 3, 1, 1, 200); // Remember Artist1

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](2);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            signature: _signUserBatch(user1PrivateKey, records[0], 0)
        });
        userBatchSigs[1] = MainVoting.UserBatchSig({
            user: user2,
            userNonce: 0,
            signature: _signUserBatch(user2PrivateKey, records[1], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);

        // 집계 검증 - Artist1 (Remember: 100 + 200, Forget: 50)
        (uint256 remember, uint256 forget, uint256 total) = voting.getArtistAggregates(1, 1);
        assertEq(remember, 300);
        assertEq(forget, 50);
        assertEq(total, 350);
    }

    function test_GetVoteSummariesByMissionVotingId() public {
        MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](2);

        records[0] = new MainVoting.VoteRecord[](1);
        records[0][0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);

        records[1] = new MainVoting.VoteRecord[](1);
        records[1][0] = _createVoteRecord(user2, "user2", 1, 1, 2, 0, 200); // 같은 votingId

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](2);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            signature: _signUserBatch(user1PrivateKey, records[0], 0)
        });
        userBatchSigs[1] = MainVoting.UserBatchSig({
            user: user2,
            userNonce: 0,
            signature: _signUserBatch(user2PrivateKey, records[1], 0)
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);

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
            MainVoting.VoteRecord[][] memory records = new MainVoting.VoteRecord[][](2);

            records[0] = new MainVoting.VoteRecord[](1);
            records[0][0] = _createVoteRecord(
                user1, "user1", 1, batchIdx * 2 + 1, 1, 1, 100
            );

            records[1] = new MainVoting.VoteRecord[](1);
            records[1][0] = _createVoteRecord(
                user2, "user2", 1, batchIdx * 2 + 2, 2, 0, 200
            );

            MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](2);
            userBatchSigs[0] = MainVoting.UserBatchSig({
                user: user1,
                userNonce: batchIdx,
                signature: _signUserBatch(user1PrivateKey, records[0], batchIdx)
            });
            userBatchSigs[1] = MainVoting.UserBatchSig({
                user: user2,
                userNonce: batchIdx,
                signature: _signUserBatch(user2PrivateKey, records[1], batchIdx)
            });

            bytes memory executorSig = _signBatchSig(executorPrivateKey, batchIdx);
            voting.submitMultiUserBatch(records, userBatchSigs, batchIdx, executorSig);
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
}
