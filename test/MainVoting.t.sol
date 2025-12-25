// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MainVoting} from "../src/vote/MainVoting.sol";

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                       MainVoting 테스트 컨트랙트                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  테스트 구조:                                                                ║
 * ║  ┌─────────────────────────────────────────────────────────────────────┐    ║
 * ║  │ 1. 기본 기능 테스트                                                  │    ║
 * ║  │    - 배포, 설정, 권한 검증                                           │    ║
 * ║  │                                                                     │    ║
 * ║  │ 2. 투표 제출 성공 케이스                                             │    ║
 * ║  │    - 단일/다중 유저, 단일/다중 레코드                                 │    ║
 * ║  │                                                                     │    ║
 * ║  │ 3. Hard Fail 케이스 (전체 배치 실패)                                 │    ║
 * ║  │    - executor 서명 오류, 빈 배치, 배치 nonce 오류, userId 길이 초과   │    ║
 * ║  │                                                                     │    ║
 * ║  │ 4. Soft Fail 케이스 (해당 유저만 스킵)                               │    ║
 * ║  │    - 유저 서명 오류, nonce 오류, voteType 오류, allowedArtist 오류   │    ║
 * ║  │                                                                     │    ║
 * ║  │ 5. 조건부 스킵 테스트 (핵심!)                                        │    ║
 * ║  │    - 10명 중 1명 실패 → 9명 성공                                    │    ║
 * ║  │    - 이벤트 발생 확인 (UserBatchFailed, BatchProcessed)             │    ║
 * ║  └─────────────────────────────────────────────────────────────────────┘    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */
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

    // 실패 사유 코드 (컨트랙트와 동일)
    uint8 private constant REASON_USER_BATCH_TOO_LARGE = 1;
    uint8 private constant REASON_INVALID_USER_SIGNATURE = 2;
    uint8 private constant REASON_USER_NONCE_INVALID = 3;
    uint8 private constant REASON_INVALID_VOTE_TYPE = 4;
    uint8 private constant REASON_ARTIST_NOT_ALLOWED = 5;

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

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                           Helper Functions                                 ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function _buildDomainSeparator() internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256(bytes("MainVoting")),
                    keccak256(bytes("1")),
                    block.chainid,
                    address(voting)
                )
            );
    }

    function _hashTypedDataV4(
        bytes32 structHash
    ) internal view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    _buildDomainSeparator(),
                    structHash
                )
            );
    }

    function _createVoteRecord(
        string memory userId,
        uint256 missionId,
        uint256 votingId,
        uint256 optionId,
        uint8 voteType,
        uint256 votingAmt
    ) internal view returns (MainVoting.VoteRecord memory) {
        return
            MainVoting.VoteRecord({
                recordId: uint256(
                    keccak256(
                        abi.encodePacked(
                            userId,
                            missionId,
                            votingId,
                            optionId,
                            voteType,
                            votingAmt,
                            block.timestamp
                        )
                    )
                ),
                timestamp: block.timestamp,
                missionId: missionId,
                votingId: votingId,
                optionId: optionId,
                voteType: voteType,
                userId: userId,
                votingAmt: votingAmt
            });
    }

    function _hashVoteRecord(
        MainVoting.VoteRecord memory record,
        address user
    ) internal pure returns (bytes32) {
        return
            keccak256(
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
        uint256 userNonceVal
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
            abi.encode(USER_BATCH_TYPEHASH, user, userNonceVal, recordsHash)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _signBatchSig(
        uint256 privateKey,
        uint256 batchNonceVal
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(BATCH_TYPEHASH, batchNonceVal)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    /// @notice UserVoteBatch 생성 헬퍼
    function _createUserVoteBatch(
        MainVoting.VoteRecord[] memory records,
        address user,
        uint256 userNonceVal,
        uint256 privateKey
    ) internal view returns (MainVoting.UserVoteBatch memory) {
        return
            MainVoting.UserVoteBatch({
                records: records,
                userBatchSig: MainVoting.UserBatchSig({
                    user: user,
                    userNonce: userNonceVal,
                    signature: _signUserBatch(privateKey, records, userNonceVal)
                })
            });
    }

    /// @notice 잘못된 서명으로 UserVoteBatch 생성 (테스트용)
    function _createUserVoteBatchWithWrongSig(
        MainVoting.VoteRecord[] memory records,
        address user,
        uint256 userNonceVal,
        uint256 wrongPrivateKey
    ) internal view returns (MainVoting.UserVoteBatch memory) {
        return
            MainVoting.UserVoteBatch({
                records: records,
                userBatchSig: MainVoting.UserBatchSig({
                    user: user,
                    userNonce: userNonceVal,
                    signature: _signUserBatch(
                        wrongPrivateKey,
                        records,
                        userNonceVal
                    )
                })
            });
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                         1. 기본 기능 테스트                                 ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

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
        vm.expectRevert(
            abi.encodeWithSelector(MainVoting.InvalidVoteType.selector, 2)
        );
        voting.setVoteTypeName(2, "Invalid");
    }

    function test_DomainSeparator() public view {
        bytes32 separator = voting.domainSeparator();
        assertEq(separator, _buildDomainSeparator());
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                      2. 투표 제출 성공 케이스                               ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_SubmitSingleUserVote() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 중복 체크 확인: nonce 0이 사용됨
        assertTrue(voting.usedUserNonces(user1, 0));
        assertTrue(voting.usedBatchNonces(executorSigner, 0));

        (uint256 remember, uint256 forget, uint256 total) = voting
            .getArtistAggregates(1, 1);
        assertEq(remember, 100);
        assertEq(forget, 0);
        assertEq(total, 100);
    }

    function test_SubmitMultipleUsersVotes() public {
        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](3);

        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            1
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        batches[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](
            1
        );
        records2[0] = _createVoteRecord("user2", 1, 2, 2, 0, 200);
        batches[1] = _createUserVoteBatch(records2, user2, 0, user2PrivateKey);

        MainVoting.VoteRecord[] memory records3 = new MainVoting.VoteRecord[](
            1
        );
        records3[0] = _createVoteRecord("user3", 1, 3, 3, 1, 150);
        batches[2] = _createUserVoteBatch(records3, user3, 0, user3PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 중복 체크 확인
        assertTrue(voting.usedUserNonces(user1, 0));
        assertTrue(voting.usedUserNonces(user2, 0));
        assertTrue(voting.usedUserNonces(user3, 0));
    }

    function test_SubmitUserWithMultipleRecords() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](3);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        records[1] = _createVoteRecord("user1", 1, 1, 2, 0, 50);
        records[2] = _createVoteRecord("user1", 1, 1, 1, 1, 80);

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        (uint256 r1, , uint256 t1) = voting.getArtistAggregates(1, 1);
        assertEq(r1, 180);
        assertEq(t1, 180);
    }

    function test_SubmitMixedVoteTypes() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](2);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100); // Remember
        records[1] = _createVoteRecord("user1", 1, 1, 1, 0, 50); // Forget

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        (uint256 r1, uint256 f1, uint256 t1) = voting.getArtistAggregates(1, 1);
        assertEq(r1, 100);
        assertEq(f1, 50);
        assertEq(t1, 150);
    }

    function test_UserBatchExactMax() public {
        // MAX_RECORDS_PER_USER_BATCH = 20
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](
            20
        );
        uint256 baseTs = block.timestamp;
        for (uint256 i = 0; i < 20; i++) {
            vm.warp(baseTs + i + 1);
            records[i] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        }

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        (uint256 r, , uint256 t) = voting.getArtistAggregates(1, 1);
        assertEq(r, 2000);
        assertEq(t, 2000);
    }

    function test_ZeroAmountVote_FailsUserBatch_PartialSuccess() public {
        // user1: 0 수량 레코드 포함 -> 유저 배치 전체 실패(저장/집계 없음)
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            2
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 0);
        records1[1] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](
            1
        );
        records2[0] = _createVoteRecord("user2", 1, 2, 1, 1, 200);

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](2);
        batches[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);
        batches[1] = _createUserVoteBatch(records2, user2, 0, user2PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        assertTrue(voting.usedUserNonces(user1, 0));
        assertTrue(voting.usedUserNonces(user2, 0));

        // 집계는 user2만 반영
        (uint256 remember, , uint256 total) = voting.getArtistAggregates(1, 1);
        assertEq(remember, 200);
        assertEq(total, 200);
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                 3. Hard Fail 케이스 (전체 배치 실패)                        ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_RevertWhen_InvalidExecutorSignature() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory wrongExecutorSig = _signBatchSig(user1PrivateKey, 0);

        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(batches, 0, wrongExecutorSig);
    }

    function test_RevertWhen_EmptyBatches() public {
        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](0);
        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(MainVoting.InvalidRecordIndices.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_RevertWhen_BatchNonceAlreadyUsed() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 두 번째 제출 (같은 batch nonce → BatchNonceAlreadyUsed)
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](
            1
        );
        records2[0] = _createVoteRecord("user1", 1, 2, 1, 1, 100);

        MainVoting.UserVoteBatch[]
            memory batches2 = new MainVoting.UserVoteBatch[](1);
        batches2[0] = _createUserVoteBatch(records2, user1, 1, user1PrivateKey);

        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 0); // 같은 nonce

        vm.expectRevert(MainVoting.BatchNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(batches2, 0, executorSig2);
    }

    /// @notice StringTooLong은 이제 soft-fail로 처리됨
    ///         단일 유저가 StringTooLong으로 실패하면 NoSuccessfulUser 발생
    function test_SoftFail_StringTooLong_AllUsersFail() public {
        bytes memory longUserId = new bytes(101);
        for (uint256 i = 0; i < 101; i++) {
            longUserId[i] = "a";
        }

        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = MainVoting.VoteRecord({
            recordId: uint256(
                keccak256(
                    abi.encodePacked(
                        longUserId,
                        uint256(1),
                        uint256(1),
                        block.timestamp
                    )
                )
            ),
            timestamp: block.timestamp,
            missionId: 1,
            votingId: 1,
            optionId: 1,
            voteType: 1,
            userId: string(longUserId),
            votingAmt: 100
        });

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // StringTooLong은 soft-fail이므로 유저가 실패하고, 다른 유저가 없으면 NoSuccessfulUser
        vm.expectRevert(MainVoting.NoSuccessfulUser.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║              4. Soft Fail 케이스 (모든 유저 실패 → NoSuccessfulUser)        ║
    // ║                                                                           ║
    // ║  이 테스트들은 단일 유저가 실패하는 케이스입니다.                            ║
    // ║  유일한 유저가 실패하면 NoSuccessfulUser 에러가 발생합니다.                  ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_SoftFail_InvalidUserSignature_AllUsersFail() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](1);
        // 잘못된 private key로 서명
        batches[0] = _createUserVoteBatchWithWrongSig(
            records,
            user1,
            0,
            user2PrivateKey
        );

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 유일한 유저가 실패 → NoSuccessfulUser
        vm.expectRevert(MainVoting.NoSuccessfulUser.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_SoftFail_UserNonceInvalid_AllUsersFail() public {
        // 첫 번째 제출 성공
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 두 번째 제출 (같은 user nonce) → soft fail → NoSuccessfulUser
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](
            1
        );
        records2[0] = _createVoteRecord("user1", 1, 2, 1, 1, 100);

        MainVoting.UserVoteBatch[]
            memory batches2 = new MainVoting.UserVoteBatch[](1);
        batches2[0] = _createUserVoteBatch(records2, user1, 0, user1PrivateKey); // 같은 nonce

        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        vm.expectRevert(MainVoting.NoSuccessfulUser.selector);
        voting.submitMultiUserBatch(batches2, 1, executorSig2);
    }

    function test_SoftFail_ArtistNotAllowed_AllUsersFail() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 99, 1, 100); // optionId 99 not allowed

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(MainVoting.NoSuccessfulUser.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_SoftFail_InvalidVoteType_AllUsersFail() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 5, 100); // voteType 5 invalid

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(MainVoting.NoSuccessfulUser.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_SoftFail_UserBatchTooLarge_AllUsersFail() public {
        // MAX_RECORDS_PER_USER_BATCH = 20 초과
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](
            21
        );
        for (uint256 i = 0; i < 21; i++) {
            records[i] = _createVoteRecord("user1", 1, i + 1, 1, 1, 100);
        }

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(MainVoting.NoSuccessfulUser.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║              5. 조건부 스킵 테스트 (핵심! 일부 유저만 실패)                  ║
    // ║                                                                           ║
    // ║  ┌─────────────────────────────────────────────────────────────────┐      ║
    // ║  │ 시나리오: 3명의 유저 중 1명이 실패 → 2명만 성공                   │      ║
    // ║  │                                                                 │      ║
    // ║  │ User1: ✅ 유효한 서명                                           │      ║
    // ║  │ User2: ❌ 잘못된 서명 → UserBatchFailed 이벤트 + 스킵           │      ║
    // ║  │ User3: ✅ 유효한 서명                                           │      ║
    // ║  │                                                                 │      ║
    // ║  │ 결과: User1, User3의 투표만 저장됨                               │      ║
    // ║  └─────────────────────────────────────────────────────────────────┘      ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_ConditionalSkip_InvalidSignature_PartialSuccess() public {
        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](3);

        // User1: 유효
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            1
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        batches[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        // User2: 잘못된 서명 (user3의 private key로 서명)
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](
            1
        );
        records2[0] = _createVoteRecord("user2", 1, 2, 2, 0, 200);
        batches[1] = _createUserVoteBatchWithWrongSig(
            records2,
            user2,
            0,
            user3PrivateKey
        );

        // User3: 유효
        MainVoting.VoteRecord[] memory records3 = new MainVoting.VoteRecord[](
            1
        );
        records3[0] = _createVoteRecord("user3", 1, 3, 3, 1, 150);
        batches[2] = _createUserVoteBatch(records3, user3, 0, user3PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 이벤트 기대
        // User2 실패 이벤트
        vm.expectEmit(true, true, false, true);
        emit MainVoting.UserBatchFailed(
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    _buildDomainSeparator(),
                    keccak256(abi.encode(BATCH_TYPEHASH, 0))
                )
            ),
            user2,
            0,
            REASON_INVALID_USER_SIGNATURE
        );

        voting.submitMultiUserBatch(batches, 0, executorSig);

        // User1, User3는 성공 (nonce 0이 사용됨)
        assertTrue(voting.usedUserNonces(user1, 0));
        assertTrue(voting.usedUserNonces(user3, 0));

        // User2는 실패 (nonce 미사용)
        assertFalse(voting.usedUserNonces(user2, 0));

        // 집계 검증: User2의 투표는 제외됨
        (uint256 r1, , uint256 t1) = voting.getArtistAggregates(1, 1);
        assertEq(r1, 100); // User1만
        assertEq(t1, 100);

        (, uint256 f2, ) = voting.getArtistAggregates(1, 2);
        assertEq(f2, 0); // User2 제외

        (uint256 r3, , uint256 t3) = voting.getArtistAggregates(1, 3);
        assertEq(r3, 150); // User3만
        assertEq(t3, 150);
    }

    function test_ConditionalSkip_InvalidVoteType_PartialSuccess() public {
        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](3);

        // User1: 유효
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            1
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        batches[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        // User2: 잘못된 voteType (5)
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](
            1
        );
        records2[0] = _createVoteRecord("user2", 1, 2, 2, 5, 200); // voteType 5 invalid
        batches[1] = _createUserVoteBatch(records2, user2, 0, user2PrivateKey);

        // User3: 유효
        MainVoting.VoteRecord[] memory records3 = new MainVoting.VoteRecord[](
            1
        );
        records3[0] = _createVoteRecord("user3", 1, 3, 3, 1, 150);
        batches[2] = _createUserVoteBatch(records3, user3, 0, user3PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // User1, User3는 성공
        assertTrue(voting.usedUserNonces(user1, 0));
        assertTrue(voting.usedUserNonces(user3, 0));

        // User2는 서명/nonce 검증은 통과하므로 nonce가 사용됨
        // voteType 검증은 저장 단계에서 발생하여 레코드만 저장 안됨
        assertTrue(voting.usedUserNonces(user2, 0));
    }

    function test_ConditionalSkip_ArtistNotAllowed_PartialSuccess() public {
        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](3);

        // User1: 유효
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            1
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        batches[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        // User2: 허용되지 않은 아티스트 (optionId 99)
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](
            1
        );
        records2[0] = _createVoteRecord("user2", 1, 2, 99, 1, 200); // optionId 99 not allowed
        batches[1] = _createUserVoteBatch(records2, user2, 0, user2PrivateKey);

        // User3: 유효
        MainVoting.VoteRecord[] memory records3 = new MainVoting.VoteRecord[](
            1
        );
        records3[0] = _createVoteRecord("user3", 1, 3, 3, 1, 150);
        batches[2] = _createUserVoteBatch(records3, user3, 0, user3PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        assertTrue(voting.usedUserNonces(user1, 0));
        // User2는 서명/nonce 검증은 통과하므로 nonce가 사용됨
        // artistNotAllowed 검증은 저장 단계에서 발생하여 레코드만 저장 안됨
        assertTrue(voting.usedUserNonces(user2, 0));
        assertTrue(voting.usedUserNonces(user3, 0));
    }

    function test_ConditionalSkip_UserNonceAlreadyUsed_PartialSuccess() public {
        // User1의 nonce 0을 먼저 사용
        MainVoting.VoteRecord[] memory preRecords = new MainVoting.VoteRecord[](
            1
        );
        preRecords[0] = _createVoteRecord("user1", 1, 100, 1, 1, 50);

        MainVoting.UserVoteBatch[]
            memory preBatches = new MainVoting.UserVoteBatch[](1);
        preBatches[0] = _createUserVoteBatch(
            preRecords,
            user1,
            0,
            user1PrivateKey
        );

        bytes memory preExecutorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(preBatches, 0, preExecutorSig);

        // 이제 3명 배치 제출 (User1은 nonce 0 재사용 → 실패)
        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](3);

        // User1: nonce 0 재사용 (실패 예상)
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            1
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        batches[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey); // nonce 0 재사용

        // User2: 유효
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](
            1
        );
        records2[0] = _createVoteRecord("user2", 1, 2, 2, 0, 200);
        batches[1] = _createUserVoteBatch(records2, user2, 0, user2PrivateKey);

        // User3: 유효
        MainVoting.VoteRecord[] memory records3 = new MainVoting.VoteRecord[](
            1
        );
        records3[0] = _createVoteRecord("user3", 1, 3, 3, 1, 150);
        batches[2] = _createUserVoteBatch(records3, user3, 0, user3PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 1);
        voting.submitMultiUserBatch(batches, 1, executorSig);

        // User2, User3는 성공
        assertTrue(voting.usedUserNonces(user2, 0));
        assertTrue(voting.usedUserNonces(user3, 0));

        // User1의 새 투표는 실패 (nonce 0 재사용)
        // nonce 0은 이미 사용됨
        assertTrue(voting.usedUserNonces(user1, 0));
    }

    function test_ConditionalSkip_MultipleRecordsOneInvalid_UserSkipped()
        public
    {
        /**
         * 유저가 3개 레코드에 1개 서명:
         * - Record1: 유효
         * - Record2: 잘못된 voteType (5)
         * - Record3: 유효
         *
         * 결과: 서명/nonce 검증은 통과하지만, 레코드 1개라도 실패하면
         *       해당 유저 배치 전체가 실패(all-or-nothing)
         */
        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](2);

        // User1: 3개 레코드 중 1개가 잘못됨 → 유저 배치 전체 실패
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            3
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        records1[1] = _createVoteRecord("user1", 1, 1, 2, 5, 50); // voteType 5 invalid
        records1[2] = _createVoteRecord("user1", 1, 1, 1, 1, 80);
        batches[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        // User2: 유효
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](
            1
        );
        records2[0] = _createVoteRecord("user2", 1, 4, 2, 0, 200);
        batches[1] = _createUserVoteBatch(records2, user2, 0, user2PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // User1: 서명/nonce 검증 통과 → nonce 사용됨
        assertTrue(voting.usedUserNonces(user1, 0));

        // User2 성공
        assertTrue(voting.usedUserNonces(user2, 0));

        // User1은 유저 배치 전체 실패이므로 집계 반영 없음
        (uint256 r1, , uint256 t1) = voting.getArtistAggregates(1, 1);
        assertEq(r1, 0);
        assertEq(t1, 0);

        // User2의 투표 집계
        (, uint256 f2, uint256 t2) = voting.getArtistAggregates(1, 2);
        assertEq(f2, 200);
        assertEq(t2, 200);
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                    6. 이벤트 발생 테스트                                    ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_Event_UserBatchProcessed() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        bytes32 batchDigest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                _buildDomainSeparator(),
                keccak256(abi.encode(BATCH_TYPEHASH, 0))
            )
        );

        vm.expectEmit(true, true, false, true);
        emit MainVoting.UserBatchProcessed(batchDigest, user1, 0, 1);

        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_Event_BatchProcessed() public {
        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](2);

        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            1
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        batches[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](
            1
        );
        records2[0] = _createVoteRecord("user2", 1, 2, 2, 0, 200);
        batches[1] = _createUserVoteBatch(records2, user2, 0, user2PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        bytes32 batchDigest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                _buildDomainSeparator(),
                keccak256(abi.encode(BATCH_TYPEHASH, 0))
            )
        );

        vm.expectEmit(true, true, false, true);
        emit MainVoting.BatchProcessed(
            batchDigest,
            executorSigner,
            0,
            2, // recordCount
            2, // userCount
            0 // failedUserCount
        );

        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_Event_BatchProcessed_WithFailedUsers() public {
        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](3);

        // User1: 유효
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            1
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        batches[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        // User2: 잘못된 서명
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](
            1
        );
        records2[0] = _createVoteRecord("user2", 1, 2, 2, 0, 200);
        batches[1] = _createUserVoteBatchWithWrongSig(
            records2,
            user2,
            0,
            user3PrivateKey
        );

        // User3: 유효
        MainVoting.VoteRecord[] memory records3 = new MainVoting.VoteRecord[](
            1
        );
        records3[0] = _createVoteRecord("user3", 1, 3, 3, 1, 150);
        batches[2] = _createUserVoteBatch(records3, user3, 0, user3PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        bytes32 batchDigest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                _buildDomainSeparator(),
                keccak256(abi.encode(BATCH_TYPEHASH, 0))
            )
        );

        vm.expectEmit(true, true, false, true);
        emit MainVoting.BatchProcessed(
            batchDigest,
            executorSigner,
            0,
            2, // recordCount (User1 + User3)
            3, // userCount
            1 // failedUserCount (User2)
        );

        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    function test_Event_UserBatchFailed_InvalidSignature() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user2", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](2);

        // User1: 유효
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            1
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        batches[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        // User2: 잘못된 서명
        batches[1] = _createUserVoteBatchWithWrongSig(
            records,
            user2,
            0,
            user3PrivateKey
        );

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        bytes32 batchDigest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                _buildDomainSeparator(),
                keccak256(abi.encode(BATCH_TYPEHASH, 0))
            )
        );

        vm.expectEmit(true, true, false, true);
        emit MainVoting.UserBatchFailed(
            batchDigest,
            user2,
            0,
            REASON_INVALID_USER_SIGNATURE
        );

        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                      7. 상태 전이 테스트                                    ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_ArtistDisabledAfterVoting_SoftFail() public {
        // 첫 번째 투표 성공
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            1
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[]
            memory batches1 = new MainVoting.UserVoteBatch[](1);
        batches1[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        bytes memory executorSig1 = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches1, 0, executorSig1);

        // 아티스트 비활성화
        voting.setArtist(1, 1, "Artist1", false);

        // 두 번째 투표 (비활성화된 아티스트) → soft fail → NoSuccessfulUser
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](
            1
        );
        records2[0] = _createVoteRecord("user1", 1, 2, 1, 1, 100);

        MainVoting.UserVoteBatch[]
            memory batches2 = new MainVoting.UserVoteBatch[](1);
        batches2[0] = _createUserVoteBatch(records2, user1, 1, user1PrivateKey);

        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        vm.expectRevert(MainVoting.NoSuccessfulUser.selector);
        voting.submitMultiUserBatch(batches2, 1, executorSig2);
    }

    function test_ArtistReEnabled() public {
        voting.setArtist(1, 1, "Artist1", false);
        voting.setArtist(1, 1, "Artist1", true);

        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        (uint256 r, , ) = voting.getArtistAggregates(1, 1);
        assertEq(r, 100);
    }

    function test_ExecutorSignerChange_IndependentNonces() public {
        address newExecutor = address(0x5555);

        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            1
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        MainVoting.UserVoteBatch[]
            memory batches1 = new MainVoting.UserVoteBatch[](1);
        batches1[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);
        bytes memory executorSig1 = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches1, 0, executorSig1);

        // 기존 executor의 nonce 0이 사용됨
        assertTrue(voting.usedBatchNonces(executorSigner, 0));

        voting.setExecutorSigner(newExecutor);

        // 새 executor의 nonce 0은 사용되지 않은 상태
        assertFalse(voting.usedBatchNonces(newExecutor, 0));
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                         9. 중복 처리 테스트                                 ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_DuplicateRecordFailsUserBatch_PartialSuccess() public {
        // 첫 번째 제출 (user1 성공)
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            1
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[]
            memory batches1 = new MainVoting.UserVoteBatch[](1);
        batches1[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        bytes memory executorSig1 = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches1, 0, executorSig1);

        // 두 번째 제출:
        // - user1: 이전에 저장된 레코드(digest)가 포함됨 -> 유저 배치 전체 실패(all-or-nothing)
        // - user2: 유효 -> 성공
        MainVoting.VoteRecord[]
            memory user1Records2 = new MainVoting.VoteRecord[](2);
        user1Records2[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100); // duplicate
        user1Records2[1] = _createVoteRecord("user1", 1, 1, 2, 0, 50); // would be valid but not stored

        MainVoting.VoteRecord[]
            memory user2Records = new MainVoting.VoteRecord[](1);
        user2Records[0] = _createVoteRecord("user2", 1, 2, 1, 1, 200);

        MainVoting.UserVoteBatch[]
            memory batches2 = new MainVoting.UserVoteBatch[](2);
        batches2[0] = _createUserVoteBatch(
            user1Records2,
            user1,
            1,
            user1PrivateKey
        );
        batches2[1] = _createUserVoteBatch(
            user2Records,
            user2,
            0,
            user2PrivateKey
        );

        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);
        voting.submitMultiUserBatch(batches2, 1, executorSig2);

        assertTrue(voting.usedUserNonces(user1, 1));
        assertTrue(voting.usedUserNonces(user2, 0));

        // 집계: user1(100) + user2(200) = 300
        (uint256 r1, , uint256 t1) = voting.getArtistAggregates(1, 1);
        assertEq(r1, 300);
        assertEq(t1, 300);

        // user1의 두 번째 배치(artist2)는 반영되지 않음
        (uint256 r2, uint256 f2, uint256 t2) = voting.getArtistAggregates(1, 2);
        assertEq(r2, 0);
        assertEq(f2, 0);
        assertEq(t2, 0);
    }

    function test_AllDuplicateRecords_NoSuccessfulUser() public {
        // 첫 번째 제출
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            1
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[]
            memory batches1 = new MainVoting.UserVoteBatch[](1);
        batches1[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        bytes memory executorSig1 = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches1, 0, executorSig1);

        // 완전히 동일한 레코드로 두 번째 제출 → 저장된 레코드 0개 → NoSuccessfulUser
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](
            1
        );
        records2[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100); // 동일한 레코드

        MainVoting.UserVoteBatch[]
            memory batches2 = new MainVoting.UserVoteBatch[](1);
        batches2[0] = _createUserVoteBatch(records2, user1, 1, user1PrivateKey);

        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        vm.expectRevert(MainVoting.NoSuccessfulUser.selector);
        voting.submitMultiUserBatch(batches2, 1, executorSig2);
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                          10. View 함수 테스트                              ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_GetArtistAggregates() public {
        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](2);

        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            2
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        records1[1] = _createVoteRecord("user1", 1, 1, 1, 0, 50);
        batches[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](
            1
        );
        records2[0] = _createVoteRecord("user2", 1, 3, 1, 1, 200);
        batches[1] = _createUserVoteBatch(records2, user2, 0, user2PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        (uint256 remember, uint256 forget, uint256 total) = voting
            .getArtistAggregates(1, 1);
        assertEq(remember, 300);
        assertEq(forget, 50);
        assertEq(total, 350);
    }

    function test_GetVoteSummariesByMissionVotingId() public {
        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](2);

        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](
            1
        );
        records1[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);
        batches[0] = _createUserVoteBatch(records1, user1, 0, user1PrivateKey);

        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](
            1
        );
        records2[0] = _createVoteRecord("user2", 1, 1, 2, 0, 200);
        batches[1] = _createUserVoteBatch(records2, user2, 0, user2PrivateKey);

        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig2);

        MainVoting.VoteRecordSummary[] memory summaries = voting
            .getVoteSummariesByMissionVotingId(1, 1);
        assertEq(summaries.length, 2);
        assertEq(summaries[0].userId, "user1");
        assertEq(summaries[0].votingFor, "Artist1");
        assertEq(summaries[0].votedOn, "Remember");
        assertEq(summaries[1].userId, "user2");
        assertEq(summaries[1].votingFor, "Artist2");
        assertEq(summaries[1].votedOn, "Forget");
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                         11. 권한 테스트                                     ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_RevertWhen_SetArtistNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        voting.setArtist(1, 99, "UnauthorizedArtist", true);
    }

    function test_UpdateArtistName() public {
        voting.setArtist(1, 1, "NewArtistName", true);
        assertEq(voting.artistName(1, 1), "NewArtistName");
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║                      12. 순차 배치 테스트                                   ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_SequentialBatches() public {
        for (uint256 batchIdx = 0; batchIdx < 3; batchIdx++) {
            MainVoting.UserVoteBatch[]
                memory batchesLoop = new MainVoting.UserVoteBatch[](2);

            MainVoting.VoteRecord[]
                memory recordsLoop1 = new MainVoting.VoteRecord[](1);
            recordsLoop1[0] = _createVoteRecord(
                "user1",
                1,
                batchIdx * 2 + 1,
                1,
                1,
                100
            );
            batchesLoop[0] = _createUserVoteBatch(
                recordsLoop1,
                user1,
                batchIdx,
                user1PrivateKey
            );

            MainVoting.VoteRecord[]
                memory recordsLoop2 = new MainVoting.VoteRecord[](1);
            recordsLoop2[0] = _createVoteRecord(
                "user2",
                1,
                batchIdx * 2 + 2,
                2,
                0,
                200
            );
            batchesLoop[1] = _createUserVoteBatch(
                recordsLoop2,
                user2,
                batchIdx,
                user2PrivateKey
            );

            bytes memory executorSigLoop = _signBatchSig(
                executorPrivateKey,
                batchIdx
            );
            voting.submitMultiUserBatch(batchesLoop, batchIdx, executorSigLoop);
        }

        (uint256 r1, uint256 f1, uint256 t1) = voting.getArtistAggregates(1, 1);
        assertEq(r1, 300);
        assertEq(f1, 0);
        assertEq(t1, 300);

        (uint256 r2, uint256 f2, uint256 t2) = voting.getArtistAggregates(1, 2);
        assertEq(r2, 0);
        assertEq(f2, 600);
        assertEq(t2, 600);
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║              13. ERC-1271 스마트 컨트랙트 지갑 서명 테스트                   ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_ERC1271_SmartWalletSignature_Success() public {
        // ERC1271Mock 배포 (user1을 signer로 설정)
        ERC1271Mock smartWallet = new ERC1271Mock(user1);

        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("smartWalletUser", 1, 1, 1, 1, 100);

        // 스마트 지갑 주소로 recordsHash 계산 (기존 헬퍼 사용)
        bytes32[] memory recordDigests = new bytes32[](records.length);
        for (uint256 i = 0; i < records.length; i++) {
            recordDigests[i] = _hashVoteRecord(records[i], address(smartWallet));
        }
        bytes32 recordsHash = keccak256(abi.encodePacked(recordDigests));

        // UserBatch 해시 (스마트 지갑 주소로)
        bytes32 structHash = keccak256(
            abi.encode(USER_BATCH_TYPEHASH, address(smartWallet), 0, recordsHash)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        // user1PrivateKey로 서명 (ERC1271Mock이 검증)
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = MainVoting.UserVoteBatch({
            records: records,
            userBatchSig: MainVoting.UserBatchSig({
                user: address(smartWallet),
                userNonce: 0,
                signature: signature
            })
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 스마트 지갑 nonce 사용 확인
        assertTrue(voting.usedUserNonces(address(smartWallet), 0));

        // 집계 확인
        (uint256 remember, , uint256 total) = voting.getArtistAggregates(1, 1);
        assertEq(remember, 100);
        assertEq(total, 100);
    }

    function test_ERC1271_SmartWalletSignature_InvalidSignature_Fail() public {
        // ERC1271Mock 배포 (user1을 signer로 설정)
        ERC1271Mock smartWallet = new ERC1271Mock(user1);

        // shouldReturnValid를 false로 설정 → 항상 invalid 반환
        smartWallet.setReturnValid(false);

        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("smartWalletUser", 1, 1, 1, 1, 100);

        // 유효한 유저도 추가 (NoSuccessfulUser 방지)
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord("user2", 1, 2, 2, 0, 200);

        MainVoting.UserVoteBatch[] memory batches = new MainVoting.UserVoteBatch[](2);

        // 스마트 지갑 (실패 예상) - 기존 헬퍼 사용
        bytes32[] memory recordDigests = new bytes32[](records.length);
        for (uint256 i = 0; i < records.length; i++) {
            recordDigests[i] = _hashVoteRecord(records[i], address(smartWallet));
        }
        bytes32 recordsHash = keccak256(abi.encodePacked(recordDigests));
        bytes32 structHash = keccak256(
            abi.encode(USER_BATCH_TYPEHASH, address(smartWallet), 0, recordsHash)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        batches[0] = MainVoting.UserVoteBatch({
            records: records,
            userBatchSig: MainVoting.UserBatchSig({
                user: address(smartWallet),
                userNonce: 0,
                signature: signature
            })
        });

        // User2 (성공)
        batches[1] = _createUserVoteBatch(records2, user2, 0, user2PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 스마트 지갑 실패 → nonce 미사용
        assertFalse(voting.usedUserNonces(address(smartWallet), 0));

        // User2 성공
        assertTrue(voting.usedUserNonces(user2, 0));
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║              14. MAX_RECORDS_PER_BATCH (2000) 경계값 테스트                 ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_BatchExact2000Records_Success() public {
        // 2000개 레코드를 100개 유저 × 20개 레코드로 구성
        uint256 userCount = 100;
        uint256 recordsPerUser = 20;

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](userCount);

        for (uint256 u = 0; u < userCount; u++) {
            // 각 유저의 private key 생성
            uint256 userPrivateKey = 0x10000 + u;
            address userAddr = vm.addr(userPrivateKey);

            MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](recordsPerUser);

            // 같은 유저의 모든 레코드는 동일한 votingId 사용 (votingId 일치 검증)
            uint256 userVotingId = u + 1;

            for (uint256 r = 0; r < recordsPerUser; r++) {
                vm.warp(block.timestamp + 1);
                records[r] = _createVoteRecord(
                    string(abi.encodePacked("user", vm.toString(u))),
                    1,
                    userVotingId, // 같은 유저의 모든 레코드는 동일한 votingId
                    1,
                    1,
                    (r + 1) * 10 // 레코드마다 다른 votingAmt로 고유성 보장
                );
            }

            batches[u] = _createUserVoteBatch(records, userAddr, 0, userPrivateKey);
        }

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // 집계 확인: 각 유저당 (10+20+30+...+200) = 2100 포인트, 100명 = 210000
        (uint256 remember, , uint256 total) = voting.getArtistAggregates(1, 1);
        assertEq(remember, 210000);
        assertEq(total, 210000);
    }

    function test_RevertWhen_BatchExceeds2000Records() public {
        // 2001개 레코드 → BatchTooLarge 에러
        uint256 userCount = 101;
        uint256 recordsPerUser = 20;

        // 마지막 유저만 1개 레코드로 2001개 만들기
        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](userCount);

        for (uint256 u = 0; u < userCount - 1; u++) {
            uint256 userPrivateKey = 0x10000 + u;
            address userAddr = vm.addr(userPrivateKey);

            MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](recordsPerUser);

            for (uint256 r = 0; r < recordsPerUser; r++) {
                vm.warp(block.timestamp + 1);
                records[r] = _createVoteRecord(
                    string(abi.encodePacked("user", vm.toString(u))),
                    1,
                    u * recordsPerUser + r + 1,
                    1,
                    1,
                    10
                );
            }

            batches[u] = _createUserVoteBatch(records, userAddr, 0, userPrivateKey);
        }

        // 마지막 유저: 1개 레코드 (총 2001개)
        uint256 lastUserPrivateKey = 0x10000 + userCount - 1;
        address lastUserAddr = vm.addr(lastUserPrivateKey);
        MainVoting.VoteRecord[] memory lastRecords = new MainVoting.VoteRecord[](1);
        lastRecords[0] = _createVoteRecord("lastUser", 1, 9999, 1, 1, 10);
        batches[userCount - 1] = _createUserVoteBatch(lastRecords, lastUserAddr, 0, lastUserPrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(MainVoting.BatchTooLarge.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║              15. 크로스체인 리플레이 공격 방지 테스트 (BadChain)              ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_RevertWhen_ChainIdMismatch_BadChain() public {
        // 다른 체인 ID로 변경
        vm.chainId(999);

        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord("user1", 1, 1, 1, 1, 100);

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](1);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(MainVoting.BadChain.selector);
        voting.submitMultiUserBatch(batches, 0, executorSig);
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║              16. Ownable2Step 2단계 소유권 이전 테스트                       ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_Ownable2Step_TransferOwnership() public {
        address newOwner = address(0x9999);

        // Step 1: transferOwnership 호출 (pending owner 설정)
        voting.transferOwnership(newOwner);

        // 아직 owner는 변경되지 않음
        assertEq(voting.owner(), owner);
        assertEq(voting.pendingOwner(), newOwner);

        // Step 2: 새 owner가 acceptOwnership 호출
        vm.prank(newOwner);
        voting.acceptOwnership();

        // 이제 owner가 변경됨
        assertEq(voting.owner(), newOwner);
        assertEq(voting.pendingOwner(), address(0));
    }

    function test_Ownable2Step_PendingOwnerCannotCallOnlyOwner() public {
        address newOwner = address(0x9999);

        // Step 1: transferOwnership 호출
        voting.transferOwnership(newOwner);

        // pending owner는 아직 onlyOwner 함수 호출 불가
        vm.prank(newOwner);
        vm.expectRevert();
        voting.setExecutorSigner(address(0x8888));
    }

    function test_Ownable2Step_OnlyPendingOwnerCanAccept() public {
        address newOwner = address(0x9999);

        // Step 1: transferOwnership 호출
        voting.transferOwnership(newOwner);

        // 다른 주소가 acceptOwnership 호출 시 실패
        vm.prank(user1);
        vm.expectRevert();
        voting.acceptOwnership();
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║              17. 배치 내 중복 recordDigest 테스트                            ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_DuplicateRecordDigestInSameBatch_Fails() public {
        // 동일한 레코드를 2번 포함하는 배치
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](2);

        // 완전히 동일한 레코드 2개 (중복 digest)
        records[0] = MainVoting.VoteRecord({
            recordId: 1,
            timestamp: block.timestamp,
            missionId: 1,
            votingId: 1,
            optionId: 1,
            voteType: 1,
            userId: "user1",
            votingAmt: 100
        });
        records[1] = MainVoting.VoteRecord({
            recordId: 2,  // recordId는 다르지만 서명 데이터에 포함 안됨
            timestamp: block.timestamp,
            missionId: 1,
            votingId: 1,
            optionId: 1,
            voteType: 1,
            userId: "user1",
            votingAmt: 100
        });

        // 유효한 유저도 추가 (NoSuccessfulUser 방지)
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord("user2", 1, 2, 2, 0, 200);

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](2);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);
        batches[1] = _createUserVoteBatch(records2, user2, 0, user2PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // user1은 중복으로 인해 배치 전체 실패
        assertTrue(voting.usedUserNonces(user1, 0)); // nonce는 검증 통과 시 사용됨

        // user2 성공
        assertTrue(voting.usedUserNonces(user2, 0));

        // user1의 집계는 반영 안됨 (all-or-nothing)
        (uint256 r1, , uint256 t1) = voting.getArtistAggregates(1, 1);
        assertEq(r1, 0);
        assertEq(t1, 0);

        // user2의 집계만 반영
        (, uint256 f2, uint256 t2) = voting.getArtistAggregates(1, 2);
        assertEq(f2, 200);
        assertEq(t2, 200);
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║              18. optionId = 0 검증 테스트                                    ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝

    function test_RevertWhen_SetArtist_OptionIdZero() public {
        vm.expectRevert(abi.encodeWithSelector(MainVoting.InvalidOptionId.selector, 0));
        voting.setArtist(1, 0, "InvalidArtist", true);
    }

    function test_SoftFail_OptionIdZero_InRecord() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = MainVoting.VoteRecord({
            recordId: 1,
            timestamp: block.timestamp,
            missionId: 1,
            votingId: 1,
            optionId: 0,  // invalid
            voteType: 1,
            userId: "user1",
            votingAmt: 100
        });

        // 유효한 유저도 추가
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord("user2", 1, 2, 1, 1, 200);

        MainVoting.UserVoteBatch[]
            memory batches = new MainVoting.UserVoteBatch[](2);
        batches[0] = _createUserVoteBatch(records, user1, 0, user1PrivateKey);
        batches[1] = _createUserVoteBatch(records2, user2, 0, user2PrivateKey);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        voting.submitMultiUserBatch(batches, 0, executorSig);

        // user1 실패, user2 성공
        assertTrue(voting.usedUserNonces(user1, 0));
        assertTrue(voting.usedUserNonces(user2, 0));

        // user1 집계 없음
        (uint256 r1, , uint256 t1) = voting.getArtistAggregates(1, 1);
        assertEq(r1, 200);  // user2만
        assertEq(t1, 200);
    }
}

// ERC1271Mock import for tests
import {ERC1271Mock} from "./mocks/ERC1271Mock.sol";
