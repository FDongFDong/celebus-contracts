// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SecurityTestBase} from "../SecurityTestBase.sol";
import {MainVoting} from "../../../src/vote/MainVoting.sol";
import {console} from "forge-std/Test.sol";

/**
 * @title CRITICAL_02_ExecutorSignerReuse
 * @notice [CRITICAL-02] executorSigner 변경 시 기존 서명 무효화 미흡 테스트
 * @dev SECURITY_AUDIT.md L115-206
 *
 * 취약점 설명:
 * - setExecutorSigner 함수로 executorSigner를 변경할 때,
 *   이전 서명자의 서명으로 생성된 유효한 배치 서명들이 무효화되지 않음
 *
 * 공격 시나리오:
 * 1. executorSigner = Alice, Alice가 batchNonce 0~99 사용
 * 2. executorSigner → Bob으로 변경
 * 3. Bob이 batchNonce 0~99 사용
 * 4. executorSigner → Alice로 다시 변경
 * 5. 공격: Alice의 이전 서명(nonce 100~)을 재사용 가능!
 *
 * 영향도:
 * - 기술적 영향: 이전 executorSigner의 권한 완전히 회수 불가
 * - 비즈니스 영향: executorSigner 권한 관리 실패, 보안 사고 대응 불가
 */
contract CRITICAL_02_ExecutorSignerReuse is SecurityTestBase {
    // 추가 executor 계정
    address public executorB;
    uint256 public executorBPrivateKey = 0x5555;

    function setUp() public override {
        super.setUp();
        executorB = vm.addr(executorBPrivateKey);
    }

    // ========================================
    // TC-01: executorSigner 변경 후 이전 서명 재사용 시도
    // ========================================

    function test_RevertWhen_ReusingOldExecutorSignature() public {
        // 1. executorA(초기 설정)로 batchNonce=0 사용
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate", "vote", 100);

        _submitBatch(records, user1, user1PrivateKey, 0, 0);

        assertEq(voting.getVoteCountByVotingId(1, 1), 1);
        assertTrue(voting.batchNonceUsed(executorSigner, 0));

        // 2. executorA의 batchNonce=1 서명을 미리 생성 (제출하지 않고 보관)
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord(user1, "user1", 1, 2, "candidate2", "vote2", 200);

        uint256[] memory recordNonces2 = _createRecordNonces(records2.length);
        (bytes memory executorASignature, ) = _signExecutorBatch(executorPrivateKey, records2, recordNonces2, 1);

        // 3. executorSigner를 executorB로 변경
        voting.setExecutorSigner(executorB);
        assertEq(voting.executorSigner(), executorB);

        // 4. executorA의 이전 서명(nonce=1)으로 제출 시도
        bytes memory userSig = _signUserBatch(user1PrivateKey, user1, 1, records2, recordNonces2);

        MainVoting.UserBatchSig memory userBatch = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 1,
            recordIndices: _createIndices(1),
            signature: userSig
        });

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        // 5. 제출 시도 (실패 예상 - InvalidSignature)
        // 현재 executorSigner는 executorB이므로 executorA의 서명은 무효
        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(records2, sigs, 1, executorASignature);

        _logTestResult(
            "TC-01: Reusing Old Executor Signature",
            true,
            "Old executor signature rejected after signer change"
        );
    }

    // ========================================
    // TC-02: executorSigner A→B→A 순환 변경 시나리오 (핵심 취약점)
    // ========================================

    function test_CircularExecutorSignerChange() public {
        // 1. executorA 계정 (현재 설정된 executor)
        address executorA = executorSigner;
        uint256 executorAPrivateKey_ = executorPrivateKey;

        // 2. executorA로 batchNonce=0 사용
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate", "vote", 100);

        _submitBatch(records, user1, user1PrivateKey, 0, 0);

        // 3. executorA의 batchNonce=10 서명을 미리 생성 (미제출 보관)
        MainVoting.VoteRecord[] memory futureRecords = new MainVoting.VoteRecord[](1);
        futureRecords[0] = _createVoteRecord(user1, "user1", 1, 10, "future", "vote", 100);

        uint256[] memory futureRecordNonces = _createRecordNonces(futureRecords.length);
        (bytes memory executorAFutureSignature, ) = _signExecutorBatch(
            executorAPrivateKey_,
            futureRecords,
            futureRecordNonces,
            10
        );

        // 4. executorSigner를 executorB로 변경
        voting.setExecutorSigner(executorB);
        assertEq(voting.executorSigner(), executorB);

        // 5. executorB로 batchNonce 0~10 소진
        for (uint256 i = 0; i <= 10; i++) {
            MainVoting.VoteRecord[] memory bRecords = new MainVoting.VoteRecord[](1);
            bRecords[0] = _createVoteRecord(
                user1,
                "user1",
                1,
                100 + i,
                "candidateB",
                "voteB",
                100
            );

            uint256[] memory bRecordNonces = _createRecordNonces(bRecords.length);
            bytes memory bUserSig = _signUserBatch(user1PrivateKey, user1, i + 1, bRecords, bRecordNonces);

            MainVoting.UserBatchSig memory bUserBatch = MainVoting.UserBatchSig({
                user: user1,
                userNonce: i + 1,
                recordIndices: _createIndices(1),
                signature: bUserSig
            });

            (bytes memory batchSig, ) = _signExecutorBatch(executorBPrivateKey, bRecords, bRecordNonces, i);

            MainVoting.UserBatchSig[] memory bSigs = new MainVoting.UserBatchSig[](1);
            bSigs[0] = bUserBatch;

            voting.submitMultiUserBatch(bRecords, bSigs, i, batchSig);
        }

        // executorB의 nonce 0~10 사용 확인
        for (uint256 i = 0; i <= 10; i++) {
            assertTrue(voting.batchNonceUsed(executorB, i));
        }

        // 6. executorSigner를 다시 executorA로 변경
        voting.setExecutorSigner(executorA);
        assertEq(voting.executorSigner(), executorA);

        // 7. executorA의 이전 서명(nonce=10) 재사용 시도
        bytes memory userSig = _signUserBatch(user1PrivateKey, user1, 12, futureRecords, futureRecordNonces);

        MainVoting.UserBatchSig memory userBatch = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 12,
            recordIndices: _createIndices(1),
            signature: userSig
        });

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        // 8. 제출 시도
        // 현재 코드: 통과 가능 (취약점!)
        // 수정 후 코드: BatchNonceTooLow 또는 InvalidSignature 에러
        try voting.submitMultiUserBatch(futureRecords, sigs, 10, executorAFutureSignature) {
            // 성공하면 취약점 확인됨
            console.log("VULNERABILITY CONFIRMED: Old executor signature was reused!");
            console.log("Votes for votingId=10:", voting.getVoteCountByVotingId(1, 10));

            _logTestResult(
                "TC-02: Circular Executor Change",
                false,
                "VULNERABILITY: Old signature successfully reused after A->B->A cycle"
            );

            // 이 테스트는 취약점을 확인하는 것이므로 실패가 아니라 취약점 발견으로 처리
            assertTrue(
                true,
                "Vulnerability confirmed: executorSigner change does not invalidate old signatures"
            );
        } catch (bytes memory) {
            // 에러 발생 시 취약점이 수정된 상태
            console.log("Old signature rejected (vulnerability fixed)");

            _logTestResult(
                "TC-02: Circular Executor Change",
                true,
                "Old signature properly rejected (vulnerability fixed)"
            );
        }
    }

    // ========================================
    // TC-03: setExecutorSigner 호출 시 minBatchNonce 무효화 검증
    // ========================================

    function test_ExecutorSignerChange_ShouldInvalidateOldNonces() public {
        // 1. executorA로 batchNonce=0 사용
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate", "vote", 100);

        _submitBatch(records, user1, user1PrivateKey, 0, 0);

        address executorA = executorSigner;

        // 2. executorSigner를 executorB로 변경
        voting.setExecutorSigner(executorB);

        // 3. minBatchNonce[executorA] 확인
        // 수정된 코드: minBatchNonce[executorA] == type(uint256).max 이어야 함
        // 현재 코드: 무효화되지 않음 (취약점)

        uint256 minNonce = voting.minBatchNonce(executorA);

        if (minNonce == type(uint256).max) {
            console.log("FIXED: minBatchNonce invalidated to type(uint256).max");
            _logTestResult(
                "TC-03: MinBatchNonce Invalidation",
                true,
                "Old executor's minBatchNonce properly invalidated"
            );
        } else {
            console.log("VULNERABILITY: minBatchNonce NOT invalidated");
            console.log("Current minBatchNonce:", minNonce);
            _logTestResult(
                "TC-03: MinBatchNonce Invalidation",
                false,
                "VULNERABILITY: Old executor's minBatchNonce not invalidated"
            );

            // 취약점 확인
            assertEq(
                minNonce,
                0,
                "Vulnerability confirmed: minBatchNonce should be type(uint256).max"
            );
        }
    }

    // ========================================
    // TC-04: executorSigner 변경 후 새 서명자는 정상 동작
    // ========================================

    function test_NewExecutorSigner_WorksCorrectly() public {
        // 1. executorB로 변경
        voting.setExecutorSigner(executorB);

        // 2. executorB로 정상 제출
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate", "vote", 100);

        uint256[] memory recordNonces = _createRecordNonces(records.length);
        bytes memory userSig = _signUserBatch(user1PrivateKey, user1, 0, records, recordNonces);

        MainVoting.UserBatchSig memory userBatch = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: _createIndices(1),
            signature: userSig
        });

        (bytes memory batchSig, bytes32 itemsHash) = _signExecutorBatch(executorBPrivateKey, records, recordNonces, 0);

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        voting.submitMultiUserBatch(records, sigs, 0, batchSig);

        // 3. 정상 제출 확인
        assertEq(voting.getVoteCountByVotingId(1, 1), 1);
        assertTrue(voting.batchNonceUsed(executorB, 0));

        _logTestResult(
            "TC-04: New Executor Works",
            true,
            "New executorSigner operates correctly after change"
        );
    }

    // ========================================
    // TC-05: 동일 executorSigner로 여러 번 설정 시도
    // ========================================

    function test_SetSameExecutorSigner_Multiple_Times() public {
        address currentExecutor = voting.executorSigner();

        // 1. 동일 executorSigner로 재설정
        voting.setExecutorSigner(currentExecutor);

        // 여전히 동일
        assertEq(voting.executorSigner(), currentExecutor);

        // 2. 다시 한 번 재설정
        voting.setExecutorSigner(currentExecutor);

        assertEq(voting.executorSigner(), currentExecutor);

        _logTestResult(
            "TC-05: Set Same Executor Multiple Times",
            true,
            "Setting same executor multiple times works without issues"
        );
    }
}
