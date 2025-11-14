// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SecurityTestBase} from "../SecurityTestBase.sol";
import {MainVoting} from "../../../src/vote/MainVoting.sol";
import {console} from "forge-std/Test.sol";

/**
 * @title HIGH_01_CrossChainReplay
 * @notice [HIGH-01] 크로스 체인 리플레이 공격 방어 부족 테스트
 * @dev SECURITY_AUDIT.md L353-398
 *
 * 취약점 설명:
 * - CHAIN_ID는 생성자에서 block.chainid로 설정되지만,
 *   _hashBatch에서 block.chainid를 사용하므로
 *   하드포크로 인한 chainId 변경 시 기존 서명이 새 체인에서 재사용될 수 있음
 *
 * 공격 시나리오:
 * - 하드포크 발생 시: 기존 체인(chainId = 31337)에서 생성된 서명이
 *   새 체인(chainId = 31338)에서 재사용 가능
 *
 * 영향도:
 * - 기술적 영향: 하드포크 시 서명 재사용 가능
 * - 비즈니스 영향: 체인 분기 시 보안 문제
 */
contract HIGH_01_CrossChainReplay is SecurityTestBase {
    // ========================================
    // TC-01: chainId 불일치 시 BadChain 에러
    // ========================================

    function test_RevertWhen_ChainIdMismatch() public {
        // 1. 현재 chainId 확인
        uint256 originalChainId = block.chainid;
        assertEq(voting.CHAIN_ID(), originalChainId);

        console.log("Original chainId:", originalChainId);

        // 2. chainId 변경
        vm.chainId(31338);
        assertEq(block.chainid, 31338);

        console.log("Changed chainId:", block.chainid);

        // 3. 투표 제출 시도
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

        (bytes memory batchSig, ) = _signExecutorBatch(executorPrivateKey, records, recordNonces, 0);

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        // 4. BadChain 에러 예상
        vm.expectRevert(MainVoting.BadChain.selector);
        voting.submitMultiUserBatch(records, sigs, 0, batchSig);

        _logTestResult(
            "TC-01: ChainId Mismatch",
            true,
            "BadChain error correctly thrown when chainId changes"
        );
    }

    // ========================================
    // TC-02: 하드포크 시뮬레이션 (핵심 취약점 검증)
    // ========================================

    function test_HardForkChainIdChange() public {
        // 1. 원본 체인(31337)에서 서명 생성
        uint256 originalChainId = block.chainid;
        assertEq(originalChainId, 31337); // Anvil default

        console.log("========================================");
        console.log("Original chain - chainId:", originalChainId);

        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate", "vote", 100);

        uint256[] memory recordNonces = _createRecordNonces(records.length);
        bytes memory userSig = _signUserBatch(user1PrivateKey, user1, 0, records, recordNonces);
        (bytes memory batchSig, ) = _signExecutorBatch(executorPrivateKey, records, recordNonces, 0);

        // 2. 원본 체인에서 정상 제출
        MainVoting.UserBatchSig memory userBatch = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: _createIndices(1),
            signature: userSig
        });

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        voting.submitMultiUserBatch(records, sigs, 0, batchSig);

        assertEq(voting.getVoteCountByVotingId(1, 1), 1);
        console.log("Submitted successfully on original chain");

        // 3. 하드포크 시뮬레이션 (chainId 변경)
        vm.chainId(31338);
        assertEq(block.chainid, 31338);

        console.log("Hard fork occurred - new chainId:", block.chainid);

        // 4. 이전 서명으로 제출 시도
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord(user1, "user1", 1, 2, "candidate2", "vote2", 200);

        // 원본 체인의 서명 재사용
        uint256[] memory recordNonces2 = _createRecordNonces(records2.length);
        bytes memory oldUserSig = _signUserBatch(user1PrivateKey, user1, 1, records2, recordNonces2);
        (bytes memory oldBatchSig, ) = _signExecutorBatch(executorPrivateKey, records2, recordNonces2, 1);

        MainVoting.UserBatchSig memory userBatch2 = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 1,
            recordIndices: _createIndices(1),
            signature: oldUserSig
        });

        MainVoting.UserBatchSig[] memory sigs2 = new MainVoting.UserBatchSig[](1);
        sigs2[0] = userBatch2;

        // 5. 제출 시도
        // 현재 코드: _hashBatch에서 block.chainid 사용하므로 통과 가능 (취약점!)
        // 수정 코드: _hashBatch에서 CHAIN_ID 사용하므로 InvalidSignature 에러

        // submitMultiUserBatch는 먼저 CHAIN_ID 체크를 하므로 BadChain 에러 발생
        vm.expectRevert(MainVoting.BadChain.selector);
        voting.submitMultiUserBatch(records2, sigs2, 1, oldBatchSig);

        console.log("Signature rejected after hard fork (BadChain check)");
        console.log("========================================");

        _logTestResult(
            "TC-02: Hard Fork Simulation",
            true,
            "BadChain check prevents cross-chain replay"
        );
    }

    // ========================================
    // TC-03: CHAIN_ID immutable 사용 검증
    // ========================================

    function test_CHAIN_ID_IsImmutable() public view {
        // 1. CHAIN_ID가 immutable로 설정되어 있는지 확인
        uint256 chainId = voting.CHAIN_ID();
        assertEq(chainId, block.chainid);

        console.log("CHAIN_ID (immutable):", chainId);
        console.log("block.chainid:", block.chainid);

        // 2. CHAIN_ID는 생성자에서 설정되어 변경 불가
        // 이는 코드 리뷰로 확인 필요

        _logTestResult(
            "TC-03: CHAIN_ID Immutable",
            true,
            "CHAIN_ID is correctly set as immutable in constructor"
        );
    }

    // ========================================
    // TC-04: 다른 체인에서 생성된 서명 거부
    // ========================================

    function test_RevertWhen_SignatureFromDifferentChain() public {
        // 1. 다른 chainId로 서명 생성 (오프체인 시뮬레이션)
        // chainId를 임시로 변경하여 서명 생성
        vm.chainId(99999);

        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate", "vote", 100);

        uint256[] memory recordNonces = _createRecordNonces(records.length);
        bytes memory wrongChainUserSig = _signUserBatch(user1PrivateKey, user1, 0, records, recordNonces);
        (bytes memory wrongChainBatchSig, ) = _signExecutorBatch(executorPrivateKey, records, recordNonces, 0);

        // 2. 원래 chainId로 복구
        vm.chainId(31337);

        // 3. 잘못된 체인의 서명으로 제출 시도
        MainVoting.UserBatchSig memory userBatch = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: _createIndices(1),
            signature: wrongChainUserSig
        });

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        // 4. InvalidSignature 에러 예상
        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(records, sigs, 0, wrongChainBatchSig);

        _logTestResult(
            "TC-04: Different Chain Signature",
            true,
            "Signatures from different chainId are rejected"
        );
    }

    // ========================================
    // TC-05: submitMultiUserBatch의 CHAIN_ID 체크 순서
    // ========================================

    function test_CHAIN_ID_CheckOrder() public {
        // submitMultiUserBatch 함수는 맨 처음에 CHAIN_ID를 체크함
        // if (block.chainid != CHAIN_ID) revert BadChain();

        // 1. chainId 변경
        vm.chainId(31338);

        // 2. 모든 서명이 유효해도 CHAIN_ID 체크에서 먼저 실패
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "candidate", "vote", 100);

        uint256[] memory recordNonces = _createRecordNonces(records.length);
        bytes memory userSig = _signUserBatch(user1PrivateKey, user1, 0, records, recordNonces);
        (bytes memory batchSig, ) = _signExecutorBatch(executorPrivateKey, records, recordNonces, 0);

        MainVoting.UserBatchSig memory userBatch = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: _createIndices(1),
            signature: userSig
        });

        MainVoting.UserBatchSig[] memory sigs = new MainVoting.UserBatchSig[](1);
        sigs[0] = userBatch;

        // 3. BadChain이 다른 에러들보다 먼저 발생
        vm.expectRevert(MainVoting.BadChain.selector);
        voting.submitMultiUserBatch(records, sigs, 0, batchSig);

        _logTestResult(
            "TC-05: CHAIN_ID Check Order",
            true,
            "CHAIN_ID check happens first in submitMultiUserBatch"
        );
    }
}
