// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SecurityTestBase} from "../SecurityTestBase.sol";
import {MainVoting} from "../../../src/vote/MainVoting.sol";
import {console} from "forge-std/Test.sol";

/**
 * @title HIGH_04_StringLengthAttack
 * @notice [HIGH-04] String 길이 제한 부재로 인한 gas 공격 테스트
 * @dev SECURITY_AUDIT.md L477-522
 *
 * 취약점 설명:
 * - VoteRecord 구조체의 string 필드들(userId, votingFor, votedOn)에 길이 제한이 없어
 *   공격자가 매우 긴 문자열(예: 1MB)을 제출하여 gas를 극도로 증가시킬 수 있음
 *
 * 영향도:
 * - 기술적 영향: 스토리지 및 메모리 gas 극도 증가
 * - 비즈니스 영향: Gas 비용 폭탄, 블록 gas 한계 초과 가능
 */
contract HIGH_04_StringLengthAttack is SecurityTestBase {
    // ========================================
    // TC-01: 정상 길이 string 허용
    // ========================================

    function test_AcceptsNormalLengthStrings() public {
        // 1. 정상 길이의 string 제출
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(
            user1,
            "user123", // 7 bytes
            1,
            1,
            "candidate", // 9 bytes
            "vote", // 4 bytes
            100
        );

        uint256 gasBefore = gasleft();
        _submitBatch(records, user1, user1PrivateKey, 0, 0);
        uint256 gasUsed = gasBefore - gasleft();

        assertEq(voting.getVoteCountByVotingId(1, 1), 1);

        console.log("Gas used for normal strings:", gasUsed);

        _logTestResult(
            "TC-01: Normal Length Strings",
            true,
            "Normal length strings accepted successfully"
        );
    }

    // ========================================
    // TC-02: 긴 string 제출 시도 (1KB)
    // ========================================

    function test_GasBomb_1KB_String() public {
        // 1. 1KB 길이의 string 생성
        string memory longUserId = _createLongString(1000); // 1KB

        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(
            user1,
            longUserId, // 1KB string
            1,
            1,
            "candidate",
            "vote",
            100
        );

        // 2. [HIGH-04 수정 검증] StringTooLong 에러 예상
        try this._externalSubmitBatch(records, 0) {
            // 성공하면 안됨 - String 길이 제한을 통과했다는 의미
            console.log("========================================");
            console.log("String length: 1,000 bytes (1KB)");
            console.log("ERROR: Long string was accepted (should be rejected)");
            console.log("========================================");

            _logTestResult(
                "TC-02: 1KB String Rejected",
                false,
                "ERROR: 1KB string should be rejected by MAX_STRING_LENGTH limit"
            );
            revert("Test failed: 1KB string should be rejected");
        } catch (bytes memory reason) {
            // 실패해야 정상 - StringTooLong 에러 확인
            bytes4 receivedSelector = bytes4(reason);
            assertEq(receivedSelector, MainVoting.StringTooLong.selector, "Expected StringTooLong error");

            console.log("========================================");
            console.log("String length: 1,000 bytes (1KB)");
            console.log("FIXED: StringTooLong error correctly thrown");
            console.log("========================================");

            _logTestResult(
                "TC-02: 1KB String Rejected",
                true,
                "FIXED: 1KB string rejected by MAX_STRING_LENGTH limit"
            );
        }
    }

    // ========================================
    // TC-03: 매우 긴 string (10KB)
    // ========================================

    function test_GasBomb_10KB_String() public {
        // 1. 10KB 길이의 string 생성
        string memory veryLongUserId = _createLongString(10000); // 10KB

        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(
            user1,
            veryLongUserId,
            1,
            1,
            "candidate",
            "vote",
            100
        );

        // 2. Gas 측정
        uint256 gasBefore = gasleft();

        try this._externalSubmitBatch(records, 0) {
            uint256 gasUsed = gasBefore - gasleft();

            console.log("========================================");
            console.log("String length: 10,000 bytes (10KB)");
            console.log("Gas used:", gasUsed);
            console.log("VULNERABILITY CONFIRMED: 10KB string submitted successfully");
            console.log("========================================");

            _logTestResult(
                "TC-03: 10KB String Gas Bomb",
                false,
                "VULNERABILITY: 10KB string causes extreme gas usage"
            );
        } catch {
            console.log("Transaction failed - possibly out of gas");

            _logTestResult(
                "TC-03: 10KB String Gas Bomb",
                false,
                "Transaction failed due to extreme gas usage"
            );
        }
    }

    // ========================================
    // TC-04: Fuzzing - 다양한 길이 테스트
    // ========================================

    function testFuzz_StringLengthGasImpact(uint256 length) public {
        // 길이 제한 (0 ~ 5000 bytes)
        vm.assume(length > 0 && length <= 5000);

        // 동적 길이 string 생성
        string memory dynamicString = _createLongString(length);

        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, dynamicString, 1, 1, "candidate", "vote", 100);

        // Gas 측정
        uint256 gasBefore = gasleft();

        try this._externalSubmitBatch(records, 0) {
            uint256 gasUsed = gasBefore - gasleft();

            // 1000 단위마다 로깅
            if (length % 1000 == 0) {
                console.log("Length:", length, "| Gas:", gasUsed);
            }
        } catch {
            // gas 한계 초과
            if (length % 1000 == 0) {
                console.log("Length:", length, "| FAILED (out of gas)");
            }
        }
    }

    // ========================================
    // TC-05: Gas 소비량 비교 (정상 vs 긴 string)
    // ========================================

    function test_CompareGasCost_NormalVsLong() public {
        console.log("========================================");
        console.log("Gas Cost Comparison: Normal vs Long Strings");
        console.log("========================================");

        // 1. 정상 길이 (10 bytes)
        MainVoting.VoteRecord[] memory normalRecords = new MainVoting.VoteRecord[](1);
        normalRecords[0] = _createVoteRecord(
            user1,
            "user123456", // 10 bytes
            1,
            1,
            "candidate",
            "vote",
            100
        );

        uint256 gasNormal = gasleft();
        _submitBatch(normalRecords, user1, user1PrivateKey, 0, 0);
        gasNormal = gasNormal - gasleft();

        console.log("Normal string (10 bytes) gas:", gasNormal);

        // 2. [HIGH-04 수정 검증] 긴 문자열 (1000 bytes) - StringTooLong 에러 예상
        MainVoting.VoteRecord[] memory longRecords = new MainVoting.VoteRecord[](1);
        longRecords[0] = _createVoteRecord(
            user1,
            _createLongString(1000), // 1000 bytes
            1,
            2,
            "candidate",
            "vote",
            100
        );

        try this._externalSubmitBatch(longRecords, 1) {
            // 성공하면 안됨 - String 길이 제한을 통과했다는 의미
            console.log("ERROR: Long string (1000 bytes) was accepted");
            console.log("========================================");

            _logTestResult(
                "TC-05: Gas Attack Prevention",
                false,
                "ERROR: MAX_STRING_LENGTH should prevent gas bomb attacks"
            );
            revert("Test failed: Long string should be rejected");
        } catch (bytes memory reason) {
            // 실패해야 정상 - StringTooLong 에러 확인
            bytes4 receivedSelector = bytes4(reason);
            assertEq(receivedSelector, MainVoting.StringTooLong.selector, "Expected StringTooLong error");

            console.log("FIXED: Long string (1000 bytes) rejected by StringTooLong");
            console.log("========================================");

            _logTestResult(
                "TC-05: Gas Attack Prevention",
                true,
                "FIXED: MAX_STRING_LENGTH prevents gas bomb attacks"
            );
        }
    }

    // ========================================
    // TC-06: 모든 string 필드에 긴 문자열 사용
    // ========================================

    function test_AllStringFieldsLong() public {
        // 모든 string 필드를 긴 문자열로 설정
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);

        records[0] = MainVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: 1,
            votingId: 1,
            userAddress: user1,
            userId: _createLongString(500), // 500 bytes
            votingFor: _createLongString(500), // 500 bytes
            votedOn: _createLongString(500), // 500 bytes
            votingAmt: 100,
            deadline: block.timestamp + 1 hours
        });

        // Gas 측정
        uint256 gasBefore = gasleft();

        try this._externalSubmitBatch(records, 0) {
            uint256 gasUsed = gasBefore - gasleft();

            console.log("========================================");
            console.log("All 3 string fields: 500 bytes each (1.5KB total)");
            console.log("Gas used:", gasUsed);
            console.log("========================================");

            _logTestResult(
                "TC-06: All String Fields Long",
                false,
                "VULNERABILITY: All long strings cause extreme gas usage"
            );
        } catch {
            console.log("Transaction failed - out of gas");

            _logTestResult(
                "TC-06: All String Fields Long",
                false,
                "Transaction failed due to extreme gas from all long strings"
            );
        }
    }

    // ========================================
    // Helper: 외부 호출용 배치 제출
    // ========================================

    function _externalSubmitBatch(
        MainVoting.VoteRecord[] memory records,
        uint256 nonce
    ) external {
        _submitBatch(records, user1, user1PrivateKey, nonce, nonce);
    }
}
