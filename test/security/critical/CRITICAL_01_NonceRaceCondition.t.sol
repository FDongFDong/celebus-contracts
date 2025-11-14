// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SecurityTestBase} from "../SecurityTestBase.sol";
import {MainVoting} from "../../../src/vote/MainVoting.sol";

/**
 * @title CRITICAL_01_NonceRaceCondition
 * @notice [CRITICAL-01] Nonce 관리 메커니즘의 경쟁 조건 (Race Condition) 테스트
 * @dev SECURITY_AUDIT.md L53-112
 *
 * 취약점 설명:
 * - _consumeUserNonce와 _consumeBatchNonce에서 nonce 체크와 사용 표시가 원자적으로 수행되지 않음
 * - 병렬 트랜잭션 제출 시 동일 nonce로 중복 투표 가능성
 *
 * 공격 시나리오:
 * 1. 공격자가 동일한 userNonce를 사용하는 두 개의 배치 트랜잭션 준비
 * 2. Tx1과 Tx2를 거의 동시에 제출하여 mempool에 진입
 * 3. 블록 생성자가 두 트랜잭션을 같은 블록에 포함
 * 4. 두 트랜잭션 모두 nonce 체크를 통과하여 중복 투표 발생
 *
 * 영향도:
 * - 기술적 영향: 투표 시스템의 근본적인 무결성 파괴
 * - 비즈니스 영향: 투표 결과의 신뢰성 완전 상실
 */
contract CRITICAL_01_NonceRaceCondition is SecurityTestBase {
    // ========================================
    // TC-01: 동일 userNonce 재사용 시도 (기본 시나리오)
    // ========================================

    function test_RevertWhen_ReusingUserNonce() public {
        // 1. 첫 번째 배치 준비
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](1);
        records1[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate1", "vote1", 100);

        // 2. 첫 번째 배치 제출 (userNonce=0 사용)
        _submitBatch(records1, user1, user1PrivateKey, 0, 0);

        // 3. 투표 성공 확인
        assertEq(voting.getVoteCountByVotingId(1, 1), 1);
        assertTrue(voting.userNonceUsed(user1, 0));

        // 4. 두 번째 배치 준비 (동일 userNonce=0 재사용)
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord(user1, "user1", 1, 2, "candidate2", "vote2", 200);

        uint256[] memory recordNonces2 = _createRecordNonces(records2.length);
        bytes memory userSig2 = _signUserBatch(user1PrivateKey, user1, 0, records2, recordNonces2);

        MainVoting.UserBatchSig memory userBatch2 = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0, // 동일 nonce 재사용!
            recordIndices: _createIndices(1),
            signature: userSig2
        });

        (bytes memory batchSig2, bytes32 itemsHash2) = _signExecutorBatch(executorPrivateKey, records2, recordNonces2, 1);

        MainVoting.UserBatchSig[] memory sigs2 = new MainVoting.UserBatchSig[](1);
        sigs2[0] = userBatch2;

        // 5. 두 번째 배치 제출 시도 (실패 예상)
        vm.expectRevert(MainVoting.UserNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(records2, sigs2, 1, batchSig2);

        _logTestResult(
            "TC-01: Reusing UserNonce",
            true,
            "UserNonceAlreadyUsed error correctly thrown"
        );
    }

    // ========================================
    // TC-02: 동일 batchNonce 재사용 시도
    // ========================================

    function test_RevertWhen_ReusingBatchNonce() public {
        // 1. 첫 번째 배치 제출 (batchNonce=0)
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](1);
        records1[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate1", "vote1", 100);

        _submitBatch(records1, user1, user1PrivateKey, 0, 0);

        assertTrue(voting.batchNonceUsed(executorSigner, 0));

        // 2. 두 번째 배치 준비 (동일 batchNonce=0 재사용)
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord(user2, "user2", 1, 2, "candidate2", "vote2", 200);

        uint256[] memory recordNonces2 = _createRecordNonces(records2.length);
        bytes memory userSig2 = _signUserBatch(user2PrivateKey, user2, 0, records2, recordNonces2);

        MainVoting.UserBatchSig memory userBatch2 = MainVoting.UserBatchSig({
            user: user2,
            userNonce: 0,
            recordIndices: _createIndices(1),
            signature: userSig2
        });

        (bytes memory batchSig2, ) = _signExecutorBatch(executorPrivateKey, records2, recordNonces2, 0); // 동일 batchNonce!

        MainVoting.UserBatchSig[] memory sigs2 = new MainVoting.UserBatchSig[](1);
        sigs2[0] = userBatch2;

        // 3. 제출 시도 (실패 예상)
        vm.expectRevert(MainVoting.BatchNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(records2, sigs2, 0, batchSig2);

        _logTestResult(
            "TC-02: Reusing BatchNonce",
            true,
            "BatchNonceAlreadyUsed error correctly thrown"
        );
    }

    // ========================================
    // TC-03: 병렬 트랜잭션 시뮬레이션 (핵심 테스트)
    // ========================================

    function test_RevertWhen_ConcurrentNonceUsage() public {
        // 1. 동일 사용자의 동일 nonce를 가진 2개 배치 준비
        uint256 userNonce = 0;

        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](1);
        records1[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate1", "vote1", 100);

        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord(user1, "user1", 1, 2, "candidate2", "vote2", 200);

        // 2. 첫 번째 배치 제출 (성공)
        uint256[] memory recordNonces1 = _createRecordNonces(records1.length);
        bytes memory userSig1 = _signUserBatch(user1PrivateKey, user1, userNonce, records1, recordNonces1);

        MainVoting.UserBatchSig memory userBatch1 = MainVoting.UserBatchSig({
            user: user1,
            userNonce: userNonce,
            recordIndices: _createIndices(1),
            signature: userSig1
        });

        (bytes memory batchSig1, ) = _signExecutorBatch(executorPrivateKey, records1, recordNonces1, 0);

        MainVoting.UserBatchSig[] memory sigs1 = new MainVoting.UserBatchSig[](1);
        sigs1[0] = userBatch1;

        voting.submitMultiUserBatch(records1, sigs1, 0, batchSig1);

        // 투표 성공 확인
        assertEq(voting.getVoteCountByVotingId(1, 1), 1);

        // 3. 동일 nonce로 두 번째 배치 제출 시도 (실패 예상)
        uint256[] memory recordNonces2 = _createRecordNonces(records2.length);
        bytes memory userSig2 = _signUserBatch(user1PrivateKey, user1, userNonce, records2, recordNonces2);

        MainVoting.UserBatchSig memory userBatch2 = MainVoting.UserBatchSig({
            user: user1,
            userNonce: userNonce, // 동일 nonce 재사용
            recordIndices: _createIndices(1),
            signature: userSig2
        });

        (bytes memory batchSig2, ) = _signExecutorBatch(executorPrivateKey, records2, recordNonces2, 1);

        MainVoting.UserBatchSig[] memory sigs2 = new MainVoting.UserBatchSig[](1);
        sigs2[0] = userBatch2;

        vm.expectRevert(MainVoting.UserNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(records2, sigs2, 1, batchSig2);

        _logTestResult(
            "TC-03: Concurrent Nonce Usage",
            true,
            "Race condition prevented by nonce check"
        );
    }

    // ========================================
    // TC-04: Fuzzing - 랜덤 nonce 충돌 테스트
    // ========================================

    function testFuzz_NonceReusePrevention(uint256 nonce) public {
        // nonce는 uint256.max 미만이어야 함 (cancelAllUserNonceUpTo 최대값 방지)
        vm.assume(nonce < type(uint256).max - 1);

        // 1. 첫 번째 제출
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](1);
        records1[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate", "vote", 100);

        _submitBatch(records1, user1, user1PrivateKey, nonce, 0);

        // nonce 사용 확인
        assertTrue(voting.userNonceUsed(user1, nonce));

        // 2. 동일 nonce 재사용 시도
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord(user1, "user1", 1, 2, "candidate", "vote", 100);

        uint256[] memory recordNonces2 = _createRecordNonces(records2.length);
        bytes memory userSig2 = _signUserBatch(user1PrivateKey, user1, nonce, records2, recordNonces2);

        MainVoting.UserBatchSig memory userBatch2 = MainVoting.UserBatchSig({
            user: user1,
            userNonce: nonce,
            recordIndices: _createIndices(1),
            signature: userSig2
        });

        (bytes memory batchSig2, ) = _signExecutorBatch(executorPrivateKey, records2, recordNonces2, 1);

        MainVoting.UserBatchSig[] memory sigs2 = new MainVoting.UserBatchSig[](1);
        sigs2[0] = userBatch2;

        // 3. 재사용 시도 실패 확인
        vm.expectRevert(MainVoting.UserNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(records2, sigs2, 1, batchSig2);
    }

    // ========================================
    // TC-05: minUserNonce 이하 nonce 사용 시도
    // ========================================

    function test_RevertWhen_NonceBelowMinimum() public {
        // 1. user1이 nonce 0~9까지 모두 취소
        voting.cancelAllUserNonceUpTo(user1, 10);

        assertEq(voting.minUserNonce(user1), 10);

        // 2. nonce=5 사용 시도 (minUserNonce=10보다 낮음)
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate", "vote", 100);

        uint256[] memory recordNonces = _createRecordNonces(records.length);
        bytes memory userSig = _signUserBatch(user1PrivateKey, user1, 5, records, recordNonces);

        MainVoting.UserBatchSig memory userBatch = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 5,
            recordIndices: _createIndices(1),
            signature: userSig
        });

        (bytes memory batchSig, ) = _signExecutorBatch(executorPrivateKey, records, recordNonces, 0);

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        // 3. 제출 시도 (실패 예상)
        vm.expectRevert(MainVoting.UserNonceTooLow.selector);
        voting.submitMultiUserBatch(records, sigs, 0, batchSig);

        _logTestResult(
            "TC-05: Nonce Below Minimum",
            true,
            "UserNonceTooLow error correctly thrown"
        );
    }

    // ========================================
    // TC-06: 순차적 nonce 사용 검증
    // ========================================

    function test_SequentialNonceUsage() public {
        // 1. nonce 0, 1, 2를 순차적으로 사용
        for (uint256 i = 0; i < 3; i++) {
            MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
            records[0] = _createVoteRecord(
                user1,
                "user1",
                1,
                i + 1,
                "candidate",
                "vote",
                100
            );

            _submitBatch(records, user1, user1PrivateKey, i, i);

            // 각 nonce 사용 확인
            assertTrue(voting.userNonceUsed(user1, i));
        }

        // 2. 총 투표 개수 확인 (3개)
        uint256 totalVotes = voting.getVoteCount(1);
        assertEq(totalVotes, 3);

        _logTestResult(
            "TC-06: Sequential Nonce Usage",
            true,
            "Sequential nonces 0,1,2 successfully used"
        );
    }

    // ========================================
    // TC-07: 비순차적 nonce 사용 (허용되어야 함)
    // ========================================

    function test_NonSequentialNonceUsage() public {
        // 1. nonce를 비순차적으로 사용 (0, 5, 10, 100)
        uint256[] memory nonces = new uint256[](4);
        nonces[0] = 0;
        nonces[1] = 5;
        nonces[2] = 10;
        nonces[3] = 100;

        for (uint256 i = 0; i < nonces.length; i++) {
            MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
            records[0] = _createVoteRecord(
                user1,
                "user1",
                1,
                i + 1,
                "candidate",
                "vote",
                100
            );

            _submitBatch(records, user1, user1PrivateKey, nonces[i], i);

            // 각 nonce 사용 확인
            assertTrue(voting.userNonceUsed(user1, nonces[i]));
        }

        // 2. 중간 nonce (1, 2, 3, 4 등)는 사용되지 않음
        assertFalse(voting.userNonceUsed(user1, 1));
        assertFalse(voting.userNonceUsed(user1, 2));
        assertFalse(voting.userNonceUsed(user1, 3));

        _logTestResult(
            "TC-07: Non-Sequential Nonce Usage",
            true,
            "Non-sequential nonces 0,5,10,100 successfully used"
        );
    }
}
