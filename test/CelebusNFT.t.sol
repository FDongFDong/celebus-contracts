// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test, console} from "forge-std/Test.sol";
import {CelebusNFT} from "../src/nft/CelebusNFT.sol";

/**
 * @title CelebusNFTTest
 * @dev CelebusNFT 컨트랙트의 종합 테스트 스위트
 *
 * 테스트 범위:
 * - 민팅: 단일/배치 민팅, 권한, pause 상태
 * - 잠금: 단일/배치 잠금/해제, 이벤트, 권한
 * - 전송: 잠금 차단, Owner 예외, approval
 * - 소각: 권한, 잠긴 토큰, 플래그 정리
 * - 일시정지: pause/unpause, 기능 차단, 복구
 * - 조회: isLocked, name, symbol, balanceOf 등
 * - 엣지 케이스: 반복 잠금, 소각 후 재민팅 등
 * - 가스 벤치마크: 배치 작업 가스 측정
 */
contract CelebusNFTTest is Test {
    CelebusNFT public nft;
    address public owner;
    address public user1;
    address public user2;

    // 이벤트 선언 (테스트용)
    event TokenLocked(uint256 indexed tokenId);
    event TokenUnlocked(uint256 indexed tokenId);

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        nft = new CelebusNFT(owner);
    }

    // ============================================
    // 민팅 테스트 (Minting)
    // ============================================

    function test_SafeMint_Success() public {
        nft.safeMint(user1, 1);
        assertEq(nft.ownerOf(1), user1);
    }

    function test_SafeMint_RevertWhen_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert(); // Ownable unauthorized
        nft.safeMint(user1, 1);
    }

    function test_SafeMint_RevertWhen_Paused() public {
        nft.pause();
        vm.expectRevert(); // ERC721Pausable
        nft.safeMint(user1, 1);
    }

    function test_SafeMint_RevertWhen_TokenAlreadyMinted() public {
        nft.safeMint(user1, 1);
        vm.expectRevert(); // ERC721: token already minted
        nft.safeMint(user2, 1);
    }

    function test_BatchMint_Success() public {
        nft.batchMint(user1, 1, 100);

        // 검증: 첫/중간/마지막 토큰
        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.ownerOf(50), user1);
        assertEq(nft.ownerOf(100), user1);
    }

    function test_BatchMint_SingleToken() public {
        nft.batchMint(user1, 1, 1);
        assertEq(nft.ownerOf(1), user1);
    }

    function test_BatchMint_LargeCount() public {
        // 가스 한도 내에서 큰 배치 (500개)
        nft.batchMint(user1, 1, 500);
        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.ownerOf(500), user1);
    }

    function test_BatchMint_RevertWhen_CountZero() public {
        vm.expectRevert(CelebusNFT.EmptyBatch.selector);
        nft.batchMint(user1, 1, 0);
    }

    function test_BatchMint_RevertWhen_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert(); // Ownable unauthorized
        nft.batchMint(user1, 1, 100);
    }

    function test_BatchMint_RevertWhen_Paused() public {
        nft.pause();
        vm.expectRevert(); // ERC721Pausable
        nft.batchMint(user1, 1, 100);
    }

    function test_BatchMint_NonSequentialStart() public {
        // 시작 ID가 1000부터
        nft.batchMint(user1, 1000, 10);
        assertEq(nft.ownerOf(1000), user1);
        assertEq(nft.ownerOf(1009), user1);
    }

    function test_BatchMint_MultipleBatches() public {
        // 여러 배치를 다른 주소에 민팅
        nft.batchMint(user1, 1, 100);
        nft.batchMint(user2, 101, 100);

        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.ownerOf(100), user1);
        assertEq(nft.ownerOf(101), user2);
        assertEq(nft.ownerOf(200), user2);
    }

    // ============================================
    // 토큰 잠금 테스트 (Locking)
    // ============================================

    function test_LockToken_Success() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);
        assertTrue(nft.isLocked(1));
    }

    function test_LockToken_EmitsEvent() public {
        nft.safeMint(user1, 1);

        vm.expectEmit(true, false, false, false);
        emit TokenLocked(1);
        nft.lockToken(1);
    }

    function test_LockToken_RevertWhen_TokenDoesNotExist() public {
        vm.expectRevert(
            abi.encodeWithSelector(CelebusNFT.TokenDoesNotExist.selector, 999)
        );
        nft.lockToken(999);
    }

    function test_LockToken_RevertWhen_NotOwner() public {
        nft.safeMint(user1, 1);

        vm.prank(user1);
        vm.expectRevert(); // Ownable unauthorized
        nft.lockToken(1);
    }

    function test_LockToken_AlreadyLocked() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        // 이미 잠긴 토큰을 다시 잠금 (성공해야 함)
        nft.lockToken(1);
        assertTrue(nft.isLocked(1));
    }

    function test_UnlockToken_Success() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        nft.unlockToken(1);
        assertFalse(nft.isLocked(1));
    }

    function test_UnlockToken_EmitsEvent() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        vm.expectEmit(true, false, false, false);
        emit TokenUnlocked(1);
        nft.unlockToken(1);
    }

    function test_UnlockToken_RevertWhen_TokenDoesNotExist() public {
        vm.expectRevert(
            abi.encodeWithSelector(CelebusNFT.TokenDoesNotExist.selector, 999)
        );
        nft.unlockToken(999);
    }

    function test_UnlockToken_RevertWhen_NotOwner() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        vm.prank(user1);
        vm.expectRevert(); // Ownable unauthorized
        nft.unlockToken(1);
    }

    function test_UnlockToken_AlreadyUnlocked() public {
        nft.safeMint(user1, 1);
        // 잠금 없이 바로 해제 시도 (성공해야 함)
        nft.unlockToken(1);
        assertFalse(nft.isLocked(1));
    }

    // ============================================
    // 배치 잠금 테스트 (Batch Locking)
    // ============================================

    function test_BatchLockTokens_Success() public {
        // 10개 토큰 민팅
        for (uint256 i = 1; i <= 10; i++) {
            nft.safeMint(user1, i);
        }

        uint256[] memory tokenIds = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            tokenIds[i] = i + 1;
        }

        nft.batchLockTokens(tokenIds);

        // 모든 토큰이 잠김
        for (uint256 i = 0; i < 10; i++) {
            assertTrue(nft.isLocked(tokenIds[i]));
        }
    }

    function test_BatchLockTokens_EmitsEvents() public {
        nft.safeMint(user1, 1);
        nft.safeMint(user1, 2);

        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 1;
        tokenIds[1] = 2;

        vm.expectEmit(true, false, false, false);
        emit TokenLocked(1);
        vm.expectEmit(true, false, false, false);
        emit TokenLocked(2);

        nft.batchLockTokens(tokenIds);
    }

    function test_BatchLockTokens_RevertWhen_EmptyArray() public {
        uint256[] memory tokenIds = new uint256[](0);

        vm.expectRevert(CelebusNFT.EmptyBatch.selector);
        nft.batchLockTokens(tokenIds);
    }

    function test_BatchLockTokens_RevertWhen_TokenDoesNotExist() public {
        nft.safeMint(user1, 1);
        nft.safeMint(user1, 2);

        uint256[] memory tokenIds = new uint256[](3);
        tokenIds[0] = 1;
        tokenIds[1] = 999; // 존재하지 않는 토큰
        tokenIds[2] = 2;

        vm.expectRevert(
            abi.encodeWithSelector(CelebusNFT.TokenDoesNotExist.selector, 999)
        );
        nft.batchLockTokens(tokenIds);
    }

    function test_BatchLockTokens_RevertWhen_NotOwner() public {
        nft.safeMint(user1, 1);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 1;

        vm.prank(user1);
        vm.expectRevert(); // Ownable unauthorized
        nft.batchLockTokens(tokenIds);
    }

    function test_BatchLockTokens_LargeCount() public {
        // 100개 토큰 배치 잠금
        nft.batchMint(user1, 1, 100);

        uint256[] memory tokenIds = new uint256[](100);
        for (uint256 i = 0; i < 100; i++) {
            tokenIds[i] = i + 1;
        }

        nft.batchLockTokens(tokenIds);

        // 모든 토큰이 잠김
        assertTrue(nft.isLocked(1));
        assertTrue(nft.isLocked(100));
    }

    function test_BatchUnlockTokens_Success() public {
        // 10개 토큰 민팅 및 잠금
        uint256[] memory tokenIds = new uint256[](10);
        for (uint256 i = 1; i <= 10; i++) {
            nft.safeMint(user1, i);
            nft.lockToken(i);
            tokenIds[i - 1] = i;
        }

        nft.batchUnlockTokens(tokenIds);

        // 모든 토큰이 잠금 해제
        for (uint256 i = 0; i < 10; i++) {
            assertFalse(nft.isLocked(tokenIds[i]));
        }
    }

    function test_BatchUnlockTokens_EmitsEvents() public {
        nft.safeMint(user1, 1);
        nft.safeMint(user1, 2);
        nft.lockToken(1);
        nft.lockToken(2);

        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 1;
        tokenIds[1] = 2;

        vm.expectEmit(true, false, false, false);
        emit TokenUnlocked(1);
        vm.expectEmit(true, false, false, false);
        emit TokenUnlocked(2);

        nft.batchUnlockTokens(tokenIds);
    }

    function test_BatchUnlockTokens_RevertWhen_EmptyArray() public {
        uint256[] memory tokenIds = new uint256[](0);

        vm.expectRevert(CelebusNFT.EmptyBatch.selector);
        nft.batchUnlockTokens(tokenIds);
    }

    function test_BatchUnlockTokens_RevertWhen_TokenDoesNotExist() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 1;
        tokenIds[1] = 999; // 존재하지 않는 토큰

        vm.expectRevert(
            abi.encodeWithSelector(CelebusNFT.TokenDoesNotExist.selector, 999)
        );
        nft.batchUnlockTokens(tokenIds);
    }

    function test_BatchUnlockTokens_RevertWhen_NotOwner() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 1;

        vm.prank(user1);
        vm.expectRevert(); // Ownable unauthorized
        nft.batchUnlockTokens(tokenIds);
    }

    // ============================================
    // 전송 차단 테스트 (Transfer Blocking)
    // ============================================

    function test_Transfer_SuccessWhen_Unlocked() public {
        nft.safeMint(user1, 1);

        vm.prank(user1);
        nft.transferFrom(user1, user2, 1);

        assertEq(nft.ownerOf(1), user2);
    }

    function test_Transfer_RevertWhen_Locked() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(CelebusNFT.TokenIsLocked.selector, 1)
        );
        nft.transferFrom(user1, user2, 1);
    }

    function test_Transfer_OwnerCanTransferLocked() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        // Owner가 직접 전송 (approval 필요)
        vm.prank(user1);
        nft.approve(owner, 1);

        // Owner는 잠긴 토큰도 전송 가능
        nft.transferFrom(user1, user2, 1);

        assertEq(nft.ownerOf(1), user2);
    }

    function test_SafeTransferFrom_RevertWhen_Locked() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(CelebusNFT.TokenIsLocked.selector, 1)
        );
        nft.safeTransferFrom(user1, user2, 1);
    }

    function test_SafeTransferFrom_OwnerCanTransferLocked() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        vm.prank(user1);
        nft.approve(owner, 1);

        nft.safeTransferFrom(user1, user2, 1);
        assertEq(nft.ownerOf(1), user2);
    }

    function test_Transfer_AfterUnlock() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);
        nft.unlockToken(1);

        vm.prank(user1);
        nft.transferFrom(user1, user2, 1);

        assertEq(nft.ownerOf(1), user2);
    }

    function test_TransferFrom_WithApproval() public {
        nft.safeMint(user1, 1);

        vm.prank(user1);
        nft.approve(user2, 1);

        vm.prank(user2);
        nft.transferFrom(user1, address(0xdead), 1);

        assertEq(nft.ownerOf(1), address(0xdead));
    }

    function test_TransferFrom_WithApprovalForAll() public {
        nft.safeMint(user1, 1);

        vm.prank(user1);
        nft.setApprovalForAll(user2, true);

        vm.prank(user2);
        nft.transferFrom(user1, address(0xdead), 1);

        assertEq(nft.ownerOf(1), address(0xdead));
    }

    function test_Transfer_RevertWhen_LockedWithApproval() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        vm.prank(user1);
        nft.approve(user2, 1);

        // user2는 approval 있어도 잠긴 토큰 전송 불가
        vm.prank(user2);
        vm.expectRevert(
            abi.encodeWithSelector(CelebusNFT.TokenIsLocked.selector, 1)
        );
        nft.transferFrom(user1, address(0xdead), 1);
    }

    // ============================================
    // 소각 테스트 (Burning)
    // ============================================

    function test_Burn_SuccessWhen_Owner() public {
        nft.safeMint(user1, 1);

        nft.burn(1);

        // 소각된 토큰은 ownerOf() 호출 시 revert
        vm.expectRevert();
        nft.ownerOf(1);
    }

    function test_Burn_RevertWhen_NotOwner() public {
        nft.safeMint(user1, 1);

        vm.prank(user1);
        vm.expectRevert(CelebusNFT.OnlyOwnerCanBurn.selector);
        nft.burn(1);
    }

    function test_Burn_LockedToken() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        // Owner는 잠긴 토큰도 소각 가능
        nft.burn(1);

        vm.expectRevert();
        nft.ownerOf(1);
    }

    function test_Burn_ClearsLockFlag() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        nft.burn(1);

        // 소각 후 다시 민팅하면 잠금 플래그 초기화되어야 함
        nft.safeMint(user2, 1);
        assertFalse(nft.isLocked(1));
    }

    function test_Burn_RevertWhen_TokenDoesNotExist() public {
        vm.expectRevert(); // ERC721: invalid token ID
        nft.burn(999);
    }

    function test_Burn_RevertWhen_Paused() public {
        nft.safeMint(user1, 1);
        nft.pause();

        vm.expectRevert(); // ERC721Pausable
        nft.burn(1);
    }

    // ============================================
    // 일시정지 테스트 (Pause)
    // ============================================

    function test_Pause_Success() public {
        nft.pause();
        assertTrue(nft.paused());
    }

    function test_Pause_RevertWhen_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert(); // Ownable unauthorized
        nft.pause();
    }

    function test_Unpause_Success() public {
        nft.pause();
        nft.unpause();
        assertFalse(nft.paused());
    }

    function test_Unpause_RevertWhen_NotOwner() public {
        nft.pause();

        vm.prank(user1);
        vm.expectRevert(); // Ownable unauthorized
        nft.unpause();
    }

    function test_Pause_BlocksMinting() public {
        nft.pause();

        vm.expectRevert(); // ERC721Pausable
        nft.safeMint(user1, 1);
    }

    function test_Pause_BlocksBatchMinting() public {
        nft.pause();

        vm.expectRevert(); // ERC721Pausable
        nft.batchMint(user1, 1, 100);
    }

    function test_Pause_BlocksTransfer() public {
        nft.safeMint(user1, 1);
        nft.pause();

        vm.prank(user1);
        vm.expectRevert(); // ERC721Pausable
        nft.transferFrom(user1, user2, 1);
    }

    function test_Pause_BlocksBurn() public {
        nft.safeMint(user1, 1);
        nft.pause();

        vm.expectRevert(); // ERC721Pausable
        nft.burn(1);
    }

    function test_Pause_AllowsLocking() public {
        nft.safeMint(user1, 1);
        nft.pause();

        // pause 상태에서도 잠금은 가능
        nft.lockToken(1);
        assertTrue(nft.isLocked(1));
    }

    function test_Pause_AllowsUnlocking() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);
        nft.pause();

        // pause 상태에서도 잠금 해제 가능
        nft.unlockToken(1);
        assertFalse(nft.isLocked(1));
    }

    function test_Unpause_RestoresFunctionality() public {
        nft.pause();
        nft.unpause();

        // 모든 기능 정상 작동
        nft.safeMint(user1, 1);
        assertEq(nft.ownerOf(1), user1);

        vm.prank(user1);
        nft.transferFrom(user1, user2, 1);
        assertEq(nft.ownerOf(1), user2);
    }

    // ============================================
    // 조회 기능 테스트 (View Functions)
    // ============================================

    function test_IsLocked_DefaultFalse() public {
        nft.safeMint(user1, 1);
        assertFalse(nft.isLocked(1));
    }

    function test_IsLocked_ReturnsTrueAfterLock() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);
        assertTrue(nft.isLocked(1));
    }

    function test_IsLocked_RevertWhen_TokenDoesNotExist() public {
        vm.expectRevert(
            abi.encodeWithSelector(CelebusNFT.TokenDoesNotExist.selector, 999)
        );
        nft.isLocked(999);
    }

    function test_Name_ReturnsCorrectValue() public view {
        assertEq(nft.name(), "CelebusNFT");
    }

    function test_Symbol_ReturnsCorrectValue() public view {
        assertEq(nft.symbol(), "CELEB");
    }

    function test_BalanceOf_Correct() public {
        nft.batchMint(user1, 1, 10);
        assertEq(nft.balanceOf(user1), 10);
    }

    function test_OwnerOf_Correct() public {
        nft.safeMint(user1, 1);
        assertEq(nft.ownerOf(1), user1);
    }

    function test_GetApproved_Correct() public {
        nft.safeMint(user1, 1);

        vm.prank(user1);
        nft.approve(user2, 1);

        assertEq(nft.getApproved(1), user2);
    }

    function test_IsApprovedForAll_Correct() public {
        vm.prank(user1);
        nft.setApprovalForAll(user2, true);

        assertTrue(nft.isApprovedForAll(user1, user2));
    }

    // ============================================
    // 엣지 케이스 테스트 (Edge Cases)
    // ============================================

    function test_LockUnlock_Multiple() public {
        nft.safeMint(user1, 1);

        // Lock → Unlock → Lock → Unlock
        nft.lockToken(1);
        assertTrue(nft.isLocked(1));

        nft.unlockToken(1);
        assertFalse(nft.isLocked(1));

        nft.lockToken(1);
        assertTrue(nft.isLocked(1));

        nft.unlockToken(1);
        assertFalse(nft.isLocked(1));
    }

    function test_BatchMint_OverlappingTokenIds() public {
        nft.batchMint(user1, 1, 10);

        // 중복 토큰 ID 민팅 시도
        vm.expectRevert(); // ERC721: token already minted
        nft.batchMint(user2, 5, 10);
    }

    function test_LockAfterBurn_RemintDoesNotLock() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);
        nft.burn(1);

        // 같은 ID로 다시 민팅
        nft.safeMint(user2, 1);

        // 잠금 플래그가 초기화되었으므로 false
        assertFalse(nft.isLocked(1));
    }

    function test_Transfer_LockDoesNotFollowToken() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        // Owner가 강제 전송
        vm.prank(user1);
        nft.approve(owner, 1);
        nft.transferFrom(user1, user2, 1);

        // 잠금 상태는 유지됨
        assertTrue(nft.isLocked(1));
    }

    function test_BatchLockTokens_PartialOverlap() public {
        nft.safeMint(user1, 1);
        nft.safeMint(user1, 2);
        nft.lockToken(1); // 1번만 미리 잠금

        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 1;
        tokenIds[1] = 2;

        // 1번은 이미 잠김, 2번은 새로 잠김
        nft.batchLockTokens(tokenIds);

        assertTrue(nft.isLocked(1));
        assertTrue(nft.isLocked(2));
    }

    function test_SafeMint_ToZeroAddress() public {
        vm.expectRevert(); // ERC721: mint to zero address
        nft.safeMint(address(0), 1);
    }

    function test_Transfer_ToZeroAddress() public {
        nft.safeMint(user1, 1);

        vm.prank(user1);
        vm.expectRevert(); // ERC721: transfer to zero address
        nft.transferFrom(user1, address(0), 1);
    }

    // ============================================
    // 가스 벤치마크 테스트 (Gas Benchmarks)
    // ============================================

    function test_GasBenchmark_BatchMint_10() public {
        uint256 gasBefore = gasleft();
        nft.batchMint(user1, 1, 10);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Gas for batchMint(10):", gasUsed);
    }

    function test_GasBenchmark_BatchMint_100() public {
        uint256 gasBefore = gasleft();
        nft.batchMint(user1, 1, 100);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Gas for batchMint(100):", gasUsed);
    }

    function test_GasBenchmark_BatchLock_10() public {
        nft.batchMint(user1, 1, 10);

        uint256[] memory tokenIds = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            tokenIds[i] = i + 1;
        }

        uint256 gasBefore = gasleft();
        nft.batchLockTokens(tokenIds);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Gas for batchLockTokens(10):", gasUsed);
    }

    function test_GasBenchmark_BatchUnlock_10() public {
        nft.batchMint(user1, 1, 10);

        uint256[] memory tokenIds = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            tokenIds[i] = i + 1;
        }

        nft.batchLockTokens(tokenIds);

        uint256 gasBefore = gasleft();
        nft.batchUnlockTokens(tokenIds);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Gas for batchUnlockTokens(10):", gasUsed);
    }
}
