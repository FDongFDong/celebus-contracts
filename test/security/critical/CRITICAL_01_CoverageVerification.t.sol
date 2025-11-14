// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SecurityTestBase} from "../SecurityTestBase.sol";
import {MainVoting} from "../../../src/vote/MainVoting.sol";

/**
 * @title CRITICAL_01_CoverageVerification
 * @notice [CRITICAL-01] 커버리지 검증 시스템 테스트
 * @dev 보안 패치: Executor가 임의의 vote를 주입할 수 없도록 커버리지 검증
 *
 * 보안 개선:
 * - 각 사용자가 자신이 서명한 record의 위치(indices)를 명시
 * - 모든 record가 사용자 서명으로 커버되는지 검증
 * - 커버되지 않은 record가 있으면 UncoveredRecord 에러
 * - 중복 인덱스가 있으면 DuplicateIndex 에러
 *
 * 테스트 시나리오:
 * 1. 커버되지 않은 record 시도 → UncoveredRecord 에러
 * 2. 중복 인덱스 시도 → DuplicateIndex 에러
 * 3. 정상 케이스: 모든 record 커버됨 → 성공
 * 4. 다중 사용자 배치: 각자의 record만 커버 → 성공
 */
contract CRITICAL_01_CoverageVerification is SecurityTestBase {
    // ========================================
    // TC-01: 커버되지 않은 record 제출 시도 (공격 차단)
    // ========================================

    function test_RevertWhen_ExecutorAddsUnauthorizedVote() public {
        // 1. 배치에는 2개 record가 있음
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](2);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate1", "vote1", 100);
        records[1] = _createVoteRecord(user1, "user1", 1, 2, "candidate2", "vote2", 200);

        // 2. 사용자 A는 records[0]만 서명 (records[1]은 가짜!)
        MainVoting.VoteRecord[] memory userRecords = new MainVoting.VoteRecord[](1);
        userRecords[0] = records[0];

        uint256[] memory userRecordNonces = _createRecordNonces(userRecords.length);
        uint256[] memory allRecordNonces = _createRecordNonces(records.length);

        bytes memory userSig = _signUserBatch(user1PrivateKey, user1, 0, userRecords, userRecordNonces);

        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;  // records[0]만 커버

        MainVoting.UserBatchSig memory userBatch = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,  // records[1]은 커버 안됨!
            signature: userSig
        });

        (bytes memory batchSig, bytes32 itemsHash) = _signExecutorBatch(executorPrivateKey, records, allRecordNonces, 0);

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        // 3. 제출 시도 → records[1]이 커버되지 않아서 실패
        vm.expectRevert(abi.encodeWithSelector(MainVoting.UncoveredRecord.selector, 1));
        voting.submitMultiUserBatch(records, sigs, 0, batchSig);

        _logTestResult(
            "TC-01: Executor Adds Unauthorized Vote",
            true,
            "UncoveredRecord(1) error correctly thrown - fake vote blocked!"
        );
    }

    // ========================================
    // TC-02: 중복 인덱스 시도 (잘못된 설정)
    // ========================================

    function test_RevertWhen_DuplicateIndexInBatch() public {
        // 1. 2개 투표 생성
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](2);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate1", "vote1", 100);
        records[1] = _createVoteRecord(user1, "user1", 1, 2, "candidate2", "vote2", 200);

        uint256[] memory recordNonces = _createRecordNonces(records.length);
        bytes memory userSig = _signUserBatch(user1PrivateKey, user1, 0, records, recordNonces);

        // 2. 잘못된 indices: [0, 0] - 중복!
        uint256[] memory indices = new uint256[](2);
        indices[0] = 0;
        indices[1] = 0;  // 중복!

        MainVoting.UserBatchSig memory userBatch = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: userSig
        });

        (bytes memory batchSig, bytes32 itemsHash) = _signExecutorBatch(executorPrivateKey, records, recordNonces, 0);

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        // 3. 제출 시도 → 중복 인덱스 에러
        vm.expectRevert(abi.encodeWithSelector(MainVoting.DuplicateIndex.selector, 0));
        voting.submitMultiUserBatch(records, sigs, 0, batchSig);

        _logTestResult(
            "TC-02: Duplicate Index in Batch",
            true,
            "DuplicateIndex(0) error correctly thrown"
        );
    }

    // ========================================
    // TC-03: 정상 케이스 - 모든 record 커버됨
    // ========================================

    function test_Success_AllVotesCovered() public {
        // 1. 사용자 A가 3개 투표에 모두 서명
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](3);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate1", "vote1", 100);
        records[1] = _createVoteRecord(user1, "user1", 1, 2, "candidate2", "vote2", 200);
        records[2] = _createVoteRecord(user1, "user1", 1, 3, "candidate3", "vote3", 300);

        uint256[] memory recordNonces = _createRecordNonces(3);
        bytes memory userSig = _signUserBatch(user1PrivateKey, user1, 0, records, recordNonces);

        uint256[] memory indices = new uint256[](3);
        indices[0] = 0;
        indices[1] = 1;
        indices[2] = 2;  // 모든 record 커버

        MainVoting.UserBatchSig memory userBatch = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: userSig
        });

        (bytes memory batchSig, bytes32 itemsHash) = _signExecutorBatch(executorPrivateKey, records, recordNonces, 0);

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        // 2. 제출 → 성공
        voting.submitMultiUserBatch(records, sigs, 0, batchSig);

        // 3. 검증
        assertEq(voting.getVoteCountByVotingId(1, 1), 1);
        assertEq(voting.getVoteCountByVotingId(1, 2), 1);
        assertEq(voting.getVoteCountByVotingId(1, 3), 1);

        _logTestResult(
            "TC-03: All Votes Covered",
            true,
            "All records properly covered and stored"
        );
    }

    // ========================================
    // TC-04: 다중 사용자 배치 - 각자의 record만 커버
    // ========================================

    function test_Success_MultipleUserBatchesValid() public {
        // 1. 2명의 사용자, 각 2개씩 총 4개 투표
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](4);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate1", "vote1", 100);
        records[1] = _createVoteRecord(user1, "user1", 1, 2, "candidate2", "vote2", 200);
        records[2] = _createVoteRecord(user2, "user2", 1, 3, "candidate3", "vote3", 300);
        records[3] = _createVoteRecord(user2, "user2", 1, 4, "candidate4", "vote4", 400);

        // 전체 recordNonces 먼저 생성
        uint256[] memory recordNonces = _createRecordNonces(4);

        // 2. user1의 배치: records[0], records[1]
        MainVoting.VoteRecord[] memory user1Records = new MainVoting.VoteRecord[](2);
        user1Records[0] = records[0];
        user1Records[1] = records[1];
        uint256[] memory user1RecordNonces = new uint256[](2);
        user1RecordNonces[0] = recordNonces[0];
        user1RecordNonces[1] = recordNonces[1];
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, user1Records, user1RecordNonces);

        uint256[] memory user1Indices = new uint256[](2);
        user1Indices[0] = 0;
        user1Indices[1] = 1;

        MainVoting.UserBatchSig memory user1Batch = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: user1Indices,
            signature: user1Sig
        });

        // 3. user2의 배치: records[2], records[3]
        MainVoting.VoteRecord[] memory user2Records = new MainVoting.VoteRecord[](2);
        user2Records[0] = records[2];
        user2Records[1] = records[3];
        uint256[] memory user2RecordNonces = new uint256[](2);
        user2RecordNonces[0] = recordNonces[2];
        user2RecordNonces[1] = recordNonces[3];
        bytes memory user2Sig = _signUserBatch(user2PrivateKey, user2, 0, user2Records, user2RecordNonces);

        uint256[] memory user2Indices = new uint256[](2);
        user2Indices[0] = 2;
        user2Indices[1] = 3;

        MainVoting.UserBatchSig memory user2Batch = MainVoting.UserBatchSig({
            user: user2,
            userNonce: 0,
            recordIndices: user2Indices,
            signature: user2Sig
        });

        // 4. 배치 제출
        (bytes memory batchSig, bytes32 itemsHash) = _signExecutorBatch(executorPrivateKey, records, recordNonces, 0);

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](2);
        sigs[0] = user1Batch;
        sigs[1] = user2Batch;

        voting.submitMultiUserBatch(records, sigs, 0, batchSig);

        // 5. 검증
        assertEq(voting.getVoteCountByVotingId(1, 1), 1);
        assertEq(voting.getVoteCountByVotingId(1, 2), 1);
        assertEq(voting.getVoteCountByVotingId(1, 3), 1);
        assertEq(voting.getVoteCountByVotingId(1, 4), 1);

        _logTestResult(
            "TC-04: Multiple User Batches Valid",
            true,
            "Multiple users with their own records - all properly covered"
        );
    }

    // ========================================
    // TC-05: 부분 커버리지 시도 (일부만 서명)
    // ========================================

    function test_RevertWhen_PartialCoverage() public {
        // 1. 3개 투표 생성
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](3);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate1", "vote1", 100);
        records[1] = _createVoteRecord(user1, "user1", 1, 2, "candidate2", "vote2", 200);
        records[2] = _createVoteRecord(user1, "user1", 1, 3, "candidate3", "vote3", 300);

        // 전체 recordNonces 먼저 생성
        uint256[] memory recordNonces = _createRecordNonces(3);

        // 2. 사용자는 records[0], records[2]만 서명 (records[1] 누락)
        MainVoting.VoteRecord[] memory userRecords = new MainVoting.VoteRecord[](2);
        userRecords[0] = records[0];
        userRecords[1] = records[2];
        uint256[] memory userRecordNonces = new uint256[](2);
        userRecordNonces[0] = recordNonces[0];
        userRecordNonces[1] = recordNonces[2];
        bytes memory userSig = _signUserBatch(user1PrivateKey, user1, 0, userRecords, userRecordNonces);

        uint256[] memory indices = new uint256[](2);
        indices[0] = 0;
        indices[1] = 2;  // records[1] 건너뜀!

        MainVoting.UserBatchSig memory userBatch = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: userSig
        });

        (bytes memory batchSig, bytes32 itemsHash) = _signExecutorBatch(executorPrivateKey, records, recordNonces, 0);

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        // 3. 제출 시도 → records[1]이 커버되지 않아서 실패
        vm.expectRevert(abi.encodeWithSelector(MainVoting.UncoveredRecord.selector, 1));
        voting.submitMultiUserBatch(records, sigs, 0, batchSig);

        _logTestResult(
            "TC-05: Partial Coverage",
            true,
            "UncoveredRecord(1) error - middle record not covered"
        );
    }
}
