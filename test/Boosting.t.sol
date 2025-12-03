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

        // 아티스트 설정 (missionId=1)
        boosting.setArtist(1, 1, "Artist1", true);
        boosting.setArtist(1, 2, "Artist2", true);
        boosting.setArtist(1, 3, "Artist3", true);

        // 부스팅 타입 설정 (0=BP, 1=CELB)
        boosting.setBoostingTypeName(0, "BP");
        boosting.setBoostingTypeName(1, "CELB");
    }

    function _createBoostRecord(
        string memory userId,
        uint256 missionId,
        uint256 boostingId,
        uint256 optionId,
        uint8 boostingWith,
        uint256 amt
    ) internal view returns (Boosting.BoostRecord memory) {
        return Boosting.BoostRecord({
            timestamp: block.timestamp,
            missionId: missionId,
            boostingId: boostingId,
            userId: userId,
            optionId: optionId,
            boostingWith: boostingWith,
            amt: amt
        });
    }

    function _signUserSig(
        uint256 privateKey,
        Boosting.BoostRecord memory record,
        uint256 userNonce
    ) internal view returns (bytes memory) {
        address user = vm.addr(privateKey);
        bytes32 recordHash = boosting.hashBoostRecord(record, user);
        bytes32 digest = boosting.hashUserSigPreview(
            user,
            userNonce,
            recordHash
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _signBatchSig(
        uint256 privateKey,
        uint256 batchNonce
    ) internal view returns (bytes memory) {
        bytes32 digest = boosting.hashBatchPreview(batchNonce);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _createUserBoostBatch(
        uint256 privateKey,
        address userAddress,
        string memory userId,
        uint256 missionId,
        uint256 boostingId,
        uint256 optionId,
        uint8 boostingWith,
        uint256 amt,
        uint256 userNonce
    ) internal view returns (Boosting.UserBoostBatch memory) {
        Boosting.BoostRecord memory record = _createBoostRecord(
            userId, missionId, boostingId, optionId, boostingWith, amt
        );
        return Boosting.UserBoostBatch({
            record: record,
            userSig: Boosting.UserSig({
                user: userAddress,
                userNonce: userNonce,
                signature: _signUserSig(privateKey, record, userNonce)
            })
        });
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
    // 아티스트/부스팅 타입 설정 테스트
    // ========================================

    function test_SetArtist() public {
        boosting.setArtist(2, 1, "NewArtist", true);
        assertEq(boosting.artistName(2, 1), "NewArtist");
        assertTrue(boosting.allowedArtist(2, 1));
    }

    function test_SetBoostingTypeName() public {
        boosting.setBoostingTypeName(0, "NewType");
        assertEq(boosting.boostingTypeName(0), "NewType");
    }

    function test_RevertWhen_SetBoostingTypeNameInvalid() public {
        vm.expectRevert(abi.encodeWithSelector(Boosting.InvalidBoostType.selector, 2));
        boosting.setBoostingTypeName(2, "Invalid");
    }

    // ========================================
    // 부스팅 제출 성공 케이스
    // ========================================

    function test_SubmitSingleUserBoost() public {
        Boosting.UserBoostBatch[] memory batches = new Boosting.UserBoostBatch[](1);
        batches[0] = _createUserBoostBatch(user1PrivateKey, user1, "user1", 1, 1, 1, 0, 100, 0);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        boosting.submitBoostBatch(batches, 0, executorSig);

        // 검증
        assertEq(boosting.boostCount(1, 1), 1);
        assertEq(boosting.boostCountByMission(1), 1);
        assertTrue(boosting.userNonceUsed(user1, 0));
        assertTrue(boosting.batchNonceUsed(executorSigner, 0));

        // 아티스트 집계 검증
        assertEq(boosting.artistTotalAmt(1, 1), 100);
    }

    function test_SubmitMultipleUsersBoosts() public {
        Boosting.UserBoostBatch[] memory batches = new Boosting.UserBoostBatch[](3);
        batches[0] = _createUserBoostBatch(user1PrivateKey, user1, "user1", 1, 1, 1, 0, 100, 0);
        batches[1] = _createUserBoostBatch(user2PrivateKey, user2, "user2", 1, 2, 2, 1, 200, 0);
        batches[2] = _createUserBoostBatch(user3PrivateKey, user3, "user3", 1, 3, 3, 0, 150, 0);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        boosting.submitBoostBatch(batches, 0, executorSig);

        // 검증
        assertEq(boosting.boostCountByMission(1), 3);
        assertTrue(boosting.userNonceUsed(user1, 0));
        assertTrue(boosting.userNonceUsed(user2, 0));
        assertTrue(boosting.userNonceUsed(user3, 0));
        assertTrue(boosting.batchNonceUsed(executorSigner, 0));

        // 아티스트별 집계 검증
        assertEq(boosting.artistTotalAmt(1, 1), 100);
        assertEq(boosting.artistTotalAmt(1, 2), 200);
        assertEq(boosting.artistTotalAmt(1, 3), 150);
    }

    function test_SubmitMixedUsersAndBoosts() public {
        // 실제 시나리오: 다양한 사용자의 다양한 부스팅
        Boosting.UserBoostBatch[] memory batches = new Boosting.UserBoostBatch[](5);
        batches[0] = _createUserBoostBatch(user1PrivateKey, user1, "alice", 1, 1, 1, 0, 100, 0);
        batches[1] = _createUserBoostBatch(user2PrivateKey, user2, "bob", 1, 2, 2, 1, 200, 0);
        batches[2] = _createUserBoostBatch(user3PrivateKey, user3, "charlie", 1, 3, 3, 0, 150, 0);
        batches[3] = _createUserBoostBatch(user1PrivateKey, user1, "alice", 1, 4, 1, 1, 80, 1);
        batches[4] = _createUserBoostBatch(user2PrivateKey, user2, "bob", 1, 5, 2, 0, 120, 1);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        boosting.submitBoostBatch(batches, 0, executorSig);

        // 검증
        assertEq(boosting.boostCountByMission(1), 5);
        assertTrue(boosting.userNonceUsed(user1, 0));
        assertTrue(boosting.userNonceUsed(user1, 1));
        assertTrue(boosting.userNonceUsed(user2, 0));
        assertTrue(boosting.userNonceUsed(user2, 1));
        assertTrue(boosting.userNonceUsed(user3, 0));

        // 아티스트별 집계 (user1: 100+80=180, user2: 200+120=320, user3: 150)
        assertEq(boosting.artistTotalAmt(1, 1), 180); // artist1
        assertEq(boosting.artistTotalAmt(1, 2), 320); // artist2
        assertEq(boosting.artistTotalAmt(1, 3), 150); // artist3
    }

    // ========================================
    // 서명 검증 실패 케이스
    // ========================================

    function test_RevertWhen_InvalidExecutorSignature() public {
        Boosting.UserBoostBatch[] memory batches = new Boosting.UserBoostBatch[](1);
        batches[0] = _createUserBoostBatch(user1PrivateKey, user1, "user1", 1, 1, 1, 0, 100, 0);

        // 잘못된 private key로 서명
        bytes memory wrongExecutorSig = _signBatchSig(user1PrivateKey, 0);

        vm.expectRevert(Boosting.InvalidSignature.selector);
        boosting.submitBoostBatch(batches, 0, wrongExecutorSig);
    }

    function test_RevertWhen_InvalidUserSignature() public {
        // 잘못된 서명으로 배치 생성 (user2 private key로 user1의 레코드 서명)
        Boosting.BoostRecord memory record = _createBoostRecord("user1", 1, 1, 1, 0, 100);
        Boosting.UserBoostBatch[] memory batches = new Boosting.UserBoostBatch[](1);
        batches[0] = Boosting.UserBoostBatch({
            record: record,
            userSig: Boosting.UserSig({
                user: user1,
                userNonce: 0,
                signature: _signUserSig(user2PrivateKey, record, 0) // 잘못된 private key
            })
        });

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(Boosting.InvalidSignature.selector);
        boosting.submitBoostBatch(batches, 0, executorSig);
    }

    function test_RevertWhen_UserNonceAlreadyUsed() public {
        Boosting.UserBoostBatch[] memory batches = new Boosting.UserBoostBatch[](1);
        batches[0] = _createUserBoostBatch(user1PrivateKey, user1, "user1", 1, 1, 1, 0, 100, 0);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 첫 번째 제출 성공
        boosting.submitBoostBatch(batches, 0, executorSig);

        // 두 번째 제출 실패 (같은 user nonce)
        batches[0] = _createUserBoostBatch(user1PrivateKey, user1, "user1", 1, 2, 2, 1, 150, 0); // 같은 nonce
        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 1);

        vm.expectRevert(Boosting.UserNonceAlreadyUsed.selector);
        boosting.submitBoostBatch(batches, 1, executorSig2);
    }

    function test_RevertWhen_BatchNonceAlreadyUsed() public {
        Boosting.UserBoostBatch[] memory batches = new Boosting.UserBoostBatch[](1);
        batches[0] = _createUserBoostBatch(user1PrivateKey, user1, "user1", 1, 1, 1, 0, 100, 0);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        // 첫 번째 제출 성공
        boosting.submitBoostBatch(batches, 0, executorSig);

        // 두 번째 제출 실패 (같은 batch nonce)
        batches[0] = _createUserBoostBatch(user1PrivateKey, user1, "user1", 1, 2, 2, 1, 150, 1);
        bytes memory executorSig2 = _signBatchSig(executorPrivateKey, 0); // 같은 batch nonce

        vm.expectRevert(Boosting.BatchNonceAlreadyUsed.selector);
        boosting.submitBoostBatch(batches, 0, executorSig2);
    }

    // ========================================
    // 데이터 검증 실패 케이스
    // ========================================

    function test_RevertWhen_ArtistNotAllowed() public {
        Boosting.UserBoostBatch[] memory batches = new Boosting.UserBoostBatch[](1);
        batches[0] = _createUserBoostBatch(user1PrivateKey, user1, "user1", 1, 1, 99, 0, 100, 0); // optionId 99 not allowed

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(abi.encodeWithSelector(Boosting.ArtistNotAllowed.selector, 1, 99));
        boosting.submitBoostBatch(batches, 0, executorSig);
    }

    function test_RevertWhen_InvalidBoostType() public {
        Boosting.UserBoostBatch[] memory batches = new Boosting.UserBoostBatch[](1);
        batches[0] = _createUserBoostBatch(user1PrivateKey, user1, "user1", 1, 1, 1, 5, 100, 0); // boostingWith 5 invalid

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        vm.expectRevert(abi.encodeWithSelector(Boosting.InvalidBoostType.selector, 5));
        boosting.submitBoostBatch(batches, 0, executorSig);
    }

    // LengthMismatch 테스트 제거 - 새로운 구조에서는 record와 userSig가 구조체로 묶여있어 불일치 불가능

    // ========================================
    // 0 포인트 부스팅 스킵 테스트
    // ========================================

    function test_SkipZeroAmountBoost() public {
        Boosting.UserBoostBatch[] memory batches = new Boosting.UserBoostBatch[](2);
        batches[0] = _createUserBoostBatch(user1PrivateKey, user1, "user1", 1, 1, 1, 0, 0, 0); // 0 포인트 - 스킵됨
        batches[1] = _createUserBoostBatch(user2PrivateKey, user2, "user2", 1, 2, 1, 0, 100, 0);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);

        boosting.submitBoostBatch(batches, 0, executorSig);

        // 집계 검증 - 0 포인트 부스팅은 스킵되어 100만 집계됨
        assertEq(boosting.artistTotalAmt(1, 1), 100);
        assertEq(boosting.boostCountByMission(1), 1); // 0 포인트는 카운트 안됨
    }

    // ========================================
    // View 함수 테스트
    // ========================================

    function test_GetArtistTotalAmt() public {
        Boosting.UserBoostBatch[] memory batches = new Boosting.UserBoostBatch[](3);
        batches[0] = _createUserBoostBatch(user1PrivateKey, user1, "user1", 1, 1, 1, 0, 100, 0);
        batches[1] = _createUserBoostBatch(user2PrivateKey, user2, "user2", 1, 2, 1, 1, 200, 0);
        batches[2] = _createUserBoostBatch(user3PrivateKey, user3, "user3", 1, 3, 2, 0, 150, 0);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        boosting.submitBoostBatch(batches, 0, executorSig);

        // 아티스트별 총 amt 확인
        assertEq(boosting.getArtistTotalAmt(1, 1), 300); // user1 + user2
        assertEq(boosting.getArtistTotalAmt(1, 2), 150); // user3
    }

    function test_GetArtistInfo() public {
        Boosting.UserBoostBatch[] memory batches = new Boosting.UserBoostBatch[](1);
        batches[0] = _createUserBoostBatch(user1PrivateKey, user1, "user1", 1, 1, 1, 0, 100, 0);

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        boosting.submitBoostBatch(batches, 0, executorSig);

        // 아티스트 정보 조회
        Boosting.ArtistInfo memory info = boosting.getArtistInfo(1, 1);
        assertEq(info.artistName, "Artist1");
        assertTrue(info.allowed);
        assertEq(info.totalAmt, 100);
    }

    function test_GetBoostSummariesByBoostingId() public {
        Boosting.UserBoostBatch[] memory batches = new Boosting.UserBoostBatch[](2);
        batches[0] = _createUserBoostBatch(user1PrivateKey, user1, "user1", 1, 1, 1, 0, 100, 0);
        batches[1] = _createUserBoostBatch(user2PrivateKey, user2, "user2", 1, 1, 2, 1, 200, 0); // 같은 boostingId

        bytes memory executorSig = _signBatchSig(executorPrivateKey, 0);
        boosting.submitBoostBatch(batches, 0, executorSig);

        // boostingId 1로 조회
        Boosting.BoostRecordSummary[] memory summaries = boosting.getBoostSummariesByBoostingId(1, 1);
        assertEq(summaries.length, 2);
        assertEq(summaries[0].userId, "user1");
        assertEq(summaries[0].boostingFor, "Artist1");
        assertEq(summaries[0].boostingWith, "BP");
        assertEq(summaries[1].userId, "user2");
        assertEq(summaries[1].boostingFor, "Artist2");
        assertEq(summaries[1].boostingWith, "CELB");
    }

    function test_DomainSeparator() public view {
        bytes32 separator = boosting.domainSeparator();
        assertTrue(separator != bytes32(0));
    }

    // ========================================
    // Nonce 취소 테스트
    // ========================================

    function test_CancelUserNonce() public {
        boosting.cancelAllUserNonceUpTo(user1, 10);
        assertEq(boosting.minUserNonce(user1), 10);
    }

    function test_RevertWhen_CancelUserNonceTooLow() public {
        boosting.cancelAllUserNonceUpTo(user1, 10);

        vm.expectRevert(Boosting.UserNonceTooLow.selector);
        boosting.cancelAllUserNonceUpTo(user1, 5);
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
        vm.expectRevert(Boosting.NotOwnerOrExecutor.selector);
        boosting.cancelAllBatchNonceUpTo(10);
    }

    // ========================================
    // 순차 배치 테스트
    // ========================================

    function test_SequentialBatches() public {
        // 순차적인 여러 배치 제출
        for (uint256 batchIdx = 0; batchIdx < 3; batchIdx++) {
            Boosting.UserBoostBatch[] memory batches = new Boosting.UserBoostBatch[](2);
            batches[0] = _createUserBoostBatch(
                user1PrivateKey, user1, "user1", 1, batchIdx * 2 + 1, 1, 0, 100, batchIdx
            );
            batches[1] = _createUserBoostBatch(
                user2PrivateKey, user2, "user2", 1, batchIdx * 2 + 2, 2, 1, 200, batchIdx
            );

            bytes memory executorSig = _signBatchSig(executorPrivateKey, batchIdx);
            boosting.submitBoostBatch(batches, batchIdx, executorSig);
        }

        // 총 6건 (3배치 * 2건)
        assertEq(boosting.boostCountByMission(1), 6);

        // 아티스트별 집계
        assertEq(boosting.artistTotalAmt(1, 1), 300); // user1: 100 * 3
        assertEq(boosting.artistTotalAmt(1, 2), 600); // user2: 200 * 3
    }
}
