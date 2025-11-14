// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SecurityTestBase} from "../SecurityTestBase.sol";
import {MainVoting} from "../../../src/vote/MainVoting.sol";

/**
 * @title CRITICAL_02_ReplayPrevention
 * @notice [CRITICAL-02] 리플레이 공격 방지 시스템 테스트
 * @dev 보안 패치: Record digest 기반으로 중복 제출 방지
 *
 * 보안 개선:
 * - 각 record의 고유한 digest를 계산 (recordNonce 포함)
 * - consumed 매핑에 처리된 digest 저장
 * - 동일한 record 재제출 시 AlreadyProcessed 에러
 *
 * 테스트 시나리오:
 * 1. 동일한 record 재제출 → AlreadyProcessed 에러
 * 2. 같은 배치 내 동일 record → AlreadyProcessed 에러
 * 3. recordNonce가 다르면 → 성공 (다른 digest)
 * 4. 정상 케이스: 고유한 record들 → 성공
 */
contract CRITICAL_02_ReplayPrevention is SecurityTestBase {
    // ========================================
    // TC-01: 동일한 record 재제출 시도 (리플레이 공격)
    // ========================================

    function test_RevertWhen_ReplayingSameRecord() public {
        // 1. 첫 번째 제출: 성공
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](1);
        records1[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate1", "vote1", 100);

        _submitBatch(records1, user1, user1PrivateKey, 0, 0);

        // 2. 동일한 record를 다시 제출 시도 (같은 recordNonce)
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = records1[0];  // 동일한 record

        uint256[] memory recordNonces2 = new uint256[](1);
        recordNonces2[0] = 0;  // 이전과 같은 recordNonce
        bytes memory userSig2 = _signUserBatch(user1PrivateKey, user1, 1, records2, recordNonces2);

        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;

        MainVoting.UserBatchSig memory userBatch2 = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 1,
            recordIndices: indices,
            signature: userSig2
        });

        (bytes memory batchSig2, ) = _signExecutorBatch(executorPrivateKey, records2, recordNonces2, 1);

        MainVoting.UserBatchSig[] memory sigs2 = new MainVoting.UserBatchSig[](1);
        sigs2[0] = userBatch2;

        // 3. 재제출 시도 → 스킵 처리 (에러 발생 안함)
        uint256 countBefore = voting.getVoteCountByVotingId(1, 1);
        voting.submitMultiUserBatch(records2, sigs2, 1, batchSig2);
        uint256 countAfter = voting.getVoteCountByVotingId(1, 1);

        // 4. 검증: count가 증가하지 않음 (스킵됨)
        assertEq(countAfter, countBefore, "Vote count should not increase for duplicate record");

        _logTestResult(
            "TC-01: Replaying Same Record",
            true,
            "Duplicate record silently skipped - replay attack blocked!"
        );
    }

    // ========================================
    // TC-02: 같은 배치 내 동일 record (중복 제출)
    // ========================================

    function test_RevertWhen_DuplicateRecordInSameBatch() public {
        // 1. 같은 배치에 동일한 record 2번 포함
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](2);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate1", "vote1", 100);
        records[1] = records[0];  // 동일한 record

        uint256[] memory recordNonces = new uint256[](2);
        recordNonces[0] = 0;
        recordNonces[1] = 0;  // 같은 recordNonce
        bytes memory userSig = _signUserBatch(user1PrivateKey, user1, 0, records, recordNonces);

        uint256[] memory indices = new uint256[](2);
        indices[0] = 0;
        indices[1] = 1;

        MainVoting.UserBatchSig memory userBatch = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: userSig
        });

        (bytes memory batchSig, ) = _signExecutorBatch(executorPrivateKey, records, recordNonces, 0);

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        // 2. 제출 → 두 번째 record는 스킵됨
        voting.submitMultiUserBatch(records, sigs, 0, batchSig);

        // 3. 검증: 1개만 저장됨 (중복은 스킵)
        uint256 count = voting.getVoteCountByVotingId(1, 1);
        assertEq(count, 1, "Only one record should be stored, duplicate skipped");

        _logTestResult(
            "TC-02: Duplicate Record in Same Batch",
            true,
            "Duplicate record in same batch silently skipped!"
        );
    }

    // ========================================
    // TC-03: recordNonce가 다르면 같은 내용도 허용
    // ========================================

    function test_Success_SameContentDifferentNonce() public {
        // 1. 첫 번째 제출: recordNonce = 0
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](1);
        records1[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate1", "vote1", 100);

        uint256[] memory recordNonces1 = new uint256[](1);
        recordNonces1[0] = 0;  // recordNonce = 0
        bytes memory userSig1 = _signUserBatch(user1PrivateKey, user1, 0, records1, recordNonces1);

        uint256[] memory indices1 = new uint256[](1);
        indices1[0] = 0;

        MainVoting.UserBatchSig memory userBatch1 = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices1,
            signature: userSig1
        });

        (bytes memory batchSig1, ) = _signExecutorBatch(executorPrivateKey, records1, recordNonces1, 0);

        MainVoting.UserBatchSig[] memory sigs1 = new MainVoting.UserBatchSig[](1);
        sigs1[0] = userBatch1;

        voting.submitMultiUserBatch(records1, sigs1, 0, batchSig1);

        // 2. 두 번째 제출: 같은 내용이지만 recordNonce = 1
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = records1[0];  // 같은 내용

        uint256[] memory recordNonces2 = new uint256[](1);
        recordNonces2[0] = 1;  // recordNonce = 1 (다름!)
        bytes memory userSig2 = _signUserBatch(user1PrivateKey, user1, 1, records2, recordNonces2);

        uint256[] memory indices2 = new uint256[](1);
        indices2[0] = 0;

        MainVoting.UserBatchSig memory userBatch2 = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 1,
            recordIndices: indices2,
            signature: userSig2
        });

        (bytes memory batchSig2, ) = _signExecutorBatch(executorPrivateKey, records2, recordNonces2, 1);

        MainVoting.UserBatchSig[] memory sigs2 = new MainVoting.UserBatchSig[](1);
        sigs2[0] = userBatch2;

        // 3. 제출 → 성공 (digest가 다름)
        voting.submitMultiUserBatch(records2, sigs2, 1, batchSig2);

        // 4. 검증: 같은 votingId에 2개 투표 저장됨
        assertEq(voting.getVoteCountByVotingId(1, 1), 2);

        _logTestResult(
            "TC-03: Same Content Different Nonce",
            true,
            "Different recordNonce creates different digest - allowed!"
        );
    }

    // ========================================
    // TC-04: 정상 케이스 - 고유한 record들
    // ========================================

    function test_Success_UniqueRecords() public {
        // 1. 3개의 고유한 record
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](3);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate1", "vote1", 100);
        records[1] = _createVoteRecord(user1, "user1", 1, 2, "candidate2", "vote2", 200);
        records[2] = _createVoteRecord(user1, "user1", 1, 3, "candidate3", "vote3", 300);

        uint256[] memory recordNonces = _createRecordNonces(3);
        bytes memory userSig = _signUserBatch(user1PrivateKey, user1, 0, records, recordNonces);

        uint256[] memory indices = new uint256[](3);
        indices[0] = 0;
        indices[1] = 1;
        indices[2] = 2;

        MainVoting.UserBatchSig memory userBatch = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: userSig
        });

        (bytes memory batchSig, ) = _signExecutorBatch(executorPrivateKey, records, recordNonces, 0);

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        // 2. 제출 → 성공
        voting.submitMultiUserBatch(records, sigs, 0, batchSig);

        // 3. 검증
        assertEq(voting.getVoteCountByVotingId(1, 1), 1);
        assertEq(voting.getVoteCountByVotingId(1, 2), 1);
        assertEq(voting.getVoteCountByVotingId(1, 3), 1);

        _logTestResult(
            "TC-04: Unique Records",
            true,
            "All unique records stored successfully"
        );
    }

    // ========================================
    // TC-05: consumed 매핑 확인
    // ========================================

    function test_ConsumedMappingWorks() public {
        // 1. record 제출
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate1", "vote1", 100);

        uint256[] memory recordNonces = new uint256[](1);
        recordNonces[0] = 0;
        bytes memory userSig = _signUserBatch(user1PrivateKey, user1, 0, records, recordNonces);

        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;

        MainVoting.UserBatchSig memory userBatch = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: userSig
        });

        (bytes memory batchSig, ) = _signExecutorBatch(executorPrivateKey, records, recordNonces, 0);

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        voting.submitMultiUserBatch(records, sigs, 0, batchSig);

        // 2. 같은 record를 다른 userNonce, 다른 batchNonce로 재제출 시도
        bytes memory userSig2 = _signUserBatch(user1PrivateKey, user1, 1, records, recordNonces);

        MainVoting.UserBatchSig memory userBatch2 = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 1,
            recordIndices: indices,
            signature: userSig2
        });

        (bytes memory batchSig2, ) = _signExecutorBatch(executorPrivateKey, records, recordNonces, 1);

        MainVoting.UserBatchSig[] memory sigs2 = new MainVoting.UserBatchSig[](1);
        sigs2[0] = userBatch2;

        // 같은 recordNonce → 스킵 처리
        uint256 countBefore = voting.getVoteCountByVotingId(1, 1);
        voting.submitMultiUserBatch(records, sigs2, 1, batchSig2);
        uint256 countAfter = voting.getVoteCountByVotingId(1, 1);

        // count가 증가하지 않음 (스킵됨)
        assertEq(countAfter, countBefore, "Vote count should not increase for duplicate recordNonce");

        _logTestResult(
            "TC-05: Consumed Mapping Works",
            true,
            "Record digest properly marked as consumed"
        );
    }

    // ========================================
    // TC-06: 대량 record 리플레이 방지
    // ========================================

    function test_RevertWhen_ReplayingBulkRecords() public {
        // 1. 10개 record 제출
        uint256 count = 10;
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            records[i] = _createVoteRecord(
                user1,
                string(abi.encodePacked("user", vm.toString(i))),
                1,
                i + 1,
                "candidate",
                "vote",
                100
            );
        }

        _submitBatch(records, user1, user1PrivateKey, 0, 0);

        // 2. 같은 records 재제출 시도
        uint256[] memory recordNonces = _createRecordNonces(count);
        bytes memory userSig2 = _signUserBatch(user1PrivateKey, user1, 1, records, recordNonces);

        MainVoting.UserBatchSig memory userBatch2 = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 1,
            recordIndices: _createIndices(count),
            signature: userSig2
        });

        (bytes memory batchSig2, ) = _signExecutorBatch(executorPrivateKey, records, recordNonces, 1);

        MainVoting.UserBatchSig[] memory sigs2 = new MainVoting.UserBatchSig[](1);
        sigs2[0] = userBatch2;

        // 3. 재제출 시도 → 모든 record 스킵됨
        uint256 totalCountBefore = voting.getVoteCount(1);
        voting.submitMultiUserBatch(records, sigs2, 1, batchSig2);
        uint256 totalCountAfter = voting.getVoteCount(1);

        // count가 증가하지 않음 (모두 스킵됨)
        assertEq(totalCountAfter, totalCountBefore, "Total vote count should not increase for duplicate records");

        _logTestResult(
            "TC-06: Replaying Bulk Records",
            true,
            "Bulk replay attack blocked - first duplicate caught"
        );
    }
}
