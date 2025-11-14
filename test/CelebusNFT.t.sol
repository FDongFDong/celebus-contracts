// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test, console} from "forge-std/Test.sol";
import {CelebusNFT} from "../src/nft/CelebusNFT.sol";

contract CelebusNFTTest is Test {
    CelebusNFT public nft;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        nft = new CelebusNFT(owner);
    }

    // ============ Batch Minting Tests ============

    function test_BatchMint_Success() public {
        uint256 startId = 1;
        uint256 count = 100;

        nft.batchMint(user1, startId, count);

        // Verify all tokens were minted
        for (uint256 i = 0; i < count; i++) {
            assertEq(nft.ownerOf(startId + i), user1);
        }
    }

    function test_BatchMint_MaxSize() public {
        uint256 startId = 1;
        uint256 count = 500;

        nft.batchMint(user1, startId, count);

        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.ownerOf(500), user1);
    }

    function test_BatchMint_RevertWhen_CountZero() public {
        vm.expectRevert(CelebusNFT.InvalidTokenCount.selector);
        nft.batchMint(user1, 1, 0);
    }

    function test_BatchMint_RevertWhen_CountTooLarge() public {
        vm.expectRevert(CelebusNFT.InvalidTokenCount.selector);
        nft.batchMint(user1, 1, 501);
    }

    function test_BatchMint_RevertWhen_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        nft.batchMint(user1, 1, 100);
    }

    // ============ Lock/Unlock Tests ============

    function test_LockToken_Success() public {
        nft.safeMint(user1, 1);

        nft.lockToken(1);

        assertTrue(nft.isLocked(1));
    }

    function test_UnlockToken_Success() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        nft.unlockToken(1);

        assertFalse(nft.isLocked(1));
    }

    function test_LockToken_EmitsEvent() public {
        nft.safeMint(user1, 1);

        vm.expectEmit(true, false, false, false);
        emit CelebusNFT.TokenLocked(1);
        nft.lockToken(1);
    }

    function test_UnlockToken_EmitsEvent() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);

        vm.expectEmit(true, false, false, false);
        emit CelebusNFT.TokenUnlocked(1);
        nft.unlockToken(1);
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
        vm.expectRevert();
        nft.lockToken(1);
    }

    // ============ Batch Lock/Unlock Tests ============

    function test_BatchLockTokens_Success() public {
        // Mint 10 tokens
        for (uint256 i = 1; i <= 10; i++) {
            nft.safeMint(user1, i);
        }

        uint256[] memory tokenIds = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            tokenIds[i] = i + 1;
        }

        nft.batchLockTokens(tokenIds);

        for (uint256 i = 0; i < 10; i++) {
            assertTrue(nft.isLocked(tokenIds[i]));
        }
    }

    function test_BatchUnlockTokens_Success() public {
        // Mint and lock 10 tokens
        uint256[] memory tokenIds = new uint256[](10);
        for (uint256 i = 1; i <= 10; i++) {
            nft.safeMint(user1, i);
            nft.lockToken(i);
            tokenIds[i - 1] = i;
        }

        nft.batchUnlockTokens(tokenIds);

        for (uint256 i = 0; i < 10; i++) {
            assertFalse(nft.isLocked(tokenIds[i]));
        }
    }

    function test_BatchLockTokens_RevertWhen_EmptyArray() public {
        uint256[] memory tokenIds = new uint256[](0);

        vm.expectRevert(CelebusNFT.InvalidBatchSize.selector);
        nft.batchLockTokens(tokenIds);
    }

    function test_BatchLockTokens_RevertWhen_TooLarge() public {
        uint256[] memory tokenIds = new uint256[](501);

        vm.expectRevert(CelebusNFT.InvalidBatchSize.selector);
        nft.batchLockTokens(tokenIds);
    }

    // ============ Transfer Blocking Tests ============

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

        // Owner needs approval first, then can transfer locked token
        vm.prank(user1);
        nft.approve(address(this), 1);

        // Now owner (this test contract) can transfer locked token
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

    // ============ Burn Tests ============

    function test_Burn_SuccessWhen_Owner() public {
        nft.safeMint(user1, 1);

        // Contract owner can burn without approval
        nft.burn(1);

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

        // Owner can burn locked token
        nft.burn(1);

        vm.expectRevert();
        nft.ownerOf(1);
    }

    // ============ Pause Tests ============

    function test_Transfer_RevertWhen_Paused() public {
        nft.safeMint(user1, 1);
        nft.pause();

        vm.prank(user1);
        vm.expectRevert();
        nft.transferFrom(user1, user2, 1);
    }

    function test_Mint_RevertWhen_Paused() public {
        nft.pause();

        vm.expectRevert();
        nft.safeMint(user1, 1);
    }

    function test_Unpause_Success() public {
        nft.pause();
        nft.unpause();

        nft.safeMint(user1, 1);
        assertEq(nft.ownerOf(1), user1);
    }

    // ============ Edge Cases ============

    function test_IsLocked_DefaultFalse() public {
        nft.safeMint(user1, 1);

        assertFalse(nft.isLocked(1));
    }

    function test_LockUnlock_Multiple() public {
        nft.safeMint(user1, 1);

        // Lock
        nft.lockToken(1);
        assertTrue(nft.isLocked(1));

        // Unlock
        nft.unlockToken(1);
        assertFalse(nft.isLocked(1));

        // Lock again
        nft.lockToken(1);
        assertTrue(nft.isLocked(1));
    }

    function test_Transfer_AfterUnlock() public {
        nft.safeMint(user1, 1);
        nft.lockToken(1);
        nft.unlockToken(1);

        vm.prank(user1);
        nft.transferFrom(user1, user2, 1);

        assertEq(nft.ownerOf(1), user2);
    }
}
