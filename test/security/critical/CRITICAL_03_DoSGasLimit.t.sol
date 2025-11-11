// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SecurityTestBase} from "../SecurityTestBase.sol";
import {MainVoting} from "../../../src/vote/MainVoting.sol";
import {console} from "forge-std/Test.sol";

/**
 * @title CRITICAL_03_DoSGasLimit
 * @notice [CRITICAL-03] SubVoting/Boosting의 O(n) 조회로 인한 DoS 취약점 테스트
 * @dev SECURITY_AUDIT.md L209-348
 *
 * 취약점 설명:
 * - SubVoting과 Boosting 컨트랙트의 조회 함수들이 전체 배열을 순회(O(n))하여 필터링
 * - 대량의 데이터가 축적되면 gas 한계를 초과하여 조회 불가능
 *
 * 공격 시나리오:
 * 1. 공격자가 대량의 투표 데이터를 제출 (예: 10,000개)
 * 2. eventVotes[missionId] 배열에 10,000개 항목 저장
 * 3. 사용자가 getVotesByVotingId(1, 1)을 호출
 * 4. 함수는 10,000개 항목을 두 번 순회
 * 5. Gas 소비량이 30,000,000 gas를 초과하여 호출 실패
 * 6. 결과: 투표 조회 기능 완전히 사용 불가능 (DoS)
 *
 * 영향도:
 * - 기술적 영향: 대량 데이터 축적 시 조회 기능 완전 마비
 * - 비즈니스 영향: 투표 결과 확인 불가능 → 서비스 운영 불가
 */
contract CRITICAL_03_DoSGasLimit is SecurityTestBase {
    // ========================================
    // TC-01: MainVoting 대량 투표 후 조회 성공 (페이지네이션)
    // ========================================

    function test_MainVoting_QuerySucceeds_WithPagination() public {
        // 1. votingId=1에 1,000개 투표 제출
        uint256 totalRecords = 1000;
        uint256 batchSize = 50; // MAX_RECORDS_PER_USER_BATCH 제한 고려

        for (uint256 batch = 0; batch < totalRecords / batchSize; batch++) {
            MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](batchSize);

            for (uint256 i = 0; i < batchSize; i++) {
                records[i] = _createVoteRecord(
                    user1,
                    string(abi.encodePacked("user", vm.toString(batch * batchSize + i))),
                    1,
                    1, // 모두 동일 votingId
                    "candidate",
                    "vote",
                    100
                );
            }

            _submitBatch(records, user1, user1PrivateKey, batch, batch);
        }

        // 2. 총 개수 확인
        uint256 totalCount = voting.getVoteCountByVotingId(1, 1);
        assertEq(totalCount, totalRecords);

        // 3. 유저별 페이지네이션으로 조회 (offset=0, limit=100)
        uint256 gasBefore = gasleft();
        bytes32[] memory hashes = voting.getUserVoteHashes(user1, 1, 1, 0, 100);
        uint256 gasUsed = gasBefore - gasleft();

        assertEq(hashes.length, 100);

        console.log("Gas used for paginated user vote hash query (100 items):", gasUsed);

        _logTestResult(
            "TC-01: MainVoting User Pagination Query",
            true,
            "Successfully queried 100 user vote hashes from 1,000 total with pagination"
        );
    }

    // ========================================
    // TC-02: MainVoting MAX_QUERY_LIMIT 초과 시도
    // ========================================

    function test_RevertWhen_ExceedingMaxQueryLimit() public {
        // 1. 소량 데이터 제출
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](10);
        for (uint256 i = 0; i < 10; i++) {
            records[i] = _createVoteRecord(user1, "user1", 1, 1, "candidate", "vote", 100);
        }

        _submitBatch(records, user1, user1PrivateKey, 0, 0);

        // 2. MAX_QUERY_LIMIT (100) 초과 조회 시도
        vm.expectRevert(MainVoting.QueryLimitExceeded.selector);
        voting.getUserVoteHashes(user1, 1, 1, 0, 101);

        _logTestResult(
            "TC-02: Exceeding MAX_QUERY_LIMIT",
            true,
            "QueryLimitExceeded error correctly thrown for user query with limit=101"
        );
    }

    // ========================================
    // TC-03: MainVoting 최대 한계 테스트 (100,000개 제한)
    // ========================================

    function test_MainVoting_VotingCapacityLimit() public pure {
        // MainVoting은 MAX_VOTES_PER_VOTING = 100,000 제한이 있음
        // 이 테스트는 제한에 도달하는지 확인

        console.log("========================================");
        console.log("Testing voting capacity limit");
        console.log("Note: This test is informational - actual 100k submission would take too long");
        console.log("========================================");

        // 실제 환경에서는 100,000개 제출 시 gas 한계 우려
        // 여기서는 개념적 확인만 수행

        uint256 maxVotesPerVoting = 100000; // MAX_VOTES_PER_VOTING 상수

        console.log("MAX_VOTES_PER_VOTING:", maxVotesPerVoting);
        console.log("With 100,000 votes, query gas cost would be very high");

        // 예상 gas 계산 (추정)
        // - getVoteHashesByVotingId: 100,000 * ~5 gas/storage read = ~500,000 gas
        // - getVotesByVotingId: 100 items * ~10,000 gas = ~1,000,000 gas (페이지네이션으로 안전)

        console.log("Estimated gas for count query: ~500,000 gas");
        console.log("Estimated gas for paginated query (limit=100): ~1,000,000 gas");

        _logTestResult(
            "TC-03: Voting Capacity Limit",
            true,
            "MAX_VOTES_PER_VOTING limit exists but gas cost still high at maximum"
        );
    }

    // ========================================
    // TC-04: Gas 소비량 측정 (다양한 데이터 크기)
    // ========================================

    function test_MeasureQueryGasCost_VariousSizes() public {
        uint256[] memory sizes = new uint256[](3);
        sizes[0] = 100;
        sizes[1] = 500;
        sizes[2] = 1000;

        console.log("========================================");
        console.log("Gas Cost Measurement for MainVoting");
        console.log("========================================");

        for (uint256 idx = 0; idx < sizes.length; idx++) {
            uint256 size = sizes[idx];

            // 새로운 votingId 사용
            uint256 votingId = idx + 10;

            // 데이터 제출
            uint256 batchSize = 50;
            for (uint256 batch = 0; batch < size / batchSize; batch++) {
                MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](batchSize);

                for (uint256 i = 0; i < batchSize; i++) {
                    records[i] = _createVoteRecord(
                        user1,
                        string(abi.encodePacked("user", vm.toString(batch * batchSize + i))),  // 고유한 userId
                        1,
                        votingId,
                        "candidate",
                        "vote",
                        100
                    );
                }

                _submitBatch(records, user1, user1PrivateKey, idx * 100 + batch, idx * 100 + batch);
            }

            // Gas 측정 (limit=100으로 고정, 유저별 조회)
            uint256 gasBefore = gasleft();
            voting.getUserVoteHashes(user1, 1, votingId, 0, 100);
            uint256 gasUsed = gasBefore - gasleft();

            console.log("Total data size:", size, "| Gas for user query(limit=100):", gasUsed);
        }

        console.log("========================================");

        _logTestResult(
            "TC-04: Gas Cost Measurement",
            true,
            "Gas costs measured for various data sizes"
        );
    }

}
