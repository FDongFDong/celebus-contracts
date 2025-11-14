// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.5.0
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {
    ERC721Burnable
} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {
    ERC721Pausable
} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CelebusNFT is ERC721, ERC721Pausable, Ownable, ERC721Burnable {
    // Token lock state mapping
    mapping(uint256 => bool) private _locked;

    // Events
    event TokenLocked(uint256 indexed tokenId);
    event TokenUnlocked(uint256 indexed tokenId);

    // Custom errors
    error TokenIsLocked(uint256 tokenId);
    error TokenDoesNotExist(uint256 tokenId);
    error OnlyOwnerCanBurn();
    error InvalidBatchSize();

    constructor(
        address initialOwner
    ) ERC721("CelebusNFT", "CELEB") Ownable(initialOwner) {}

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }

    /// @notice Batch mint multiple NFTs with consecutive token IDs
    /// @param to The address to mint tokens to
    /// @param startTokenId The first token ID to mint
    /// @param count The number of tokens to mint (max 500)
    function batchMint(
        address to,
        uint256 startTokenId,
        uint256 count
    ) external onlyOwner {
        for (uint256 i = 0; i < count; i++) {
            _safeMint(to, startTokenId + i);
        }
    }

    /// @notice Lock a token to prevent transfers
    /// @param tokenId The token ID to lock
    function lockToken(uint256 tokenId) external onlyOwner {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        _locked[tokenId] = true;
        emit TokenLocked(tokenId);
    }

    /// @notice Unlock a token to allow transfers
    /// @param tokenId The token ID to unlock
    function unlockToken(uint256 tokenId) external onlyOwner {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        _locked[tokenId] = false;
        emit TokenUnlocked(tokenId);
    }

    /// @notice Lock multiple tokens in batch
    /// @param tokenIds Array of token IDs to lock
    function batchLockTokens(uint256[] calldata tokenIds) external onlyOwner {
        if (tokenIds.length == 0 || tokenIds.length > 500)
            revert InvalidBatchSize();

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            if (_ownerOf(tokenId) == address(0))
                revert TokenDoesNotExist(tokenId);
            _locked[tokenId] = true;
            emit TokenLocked(tokenId);
        }
    }

    /// @notice Unlock multiple tokens in batch
    /// @param tokenIds Array of token IDs to unlock
    function batchUnlockTokens(uint256[] calldata tokenIds) external onlyOwner {
        if (tokenIds.length == 0 || tokenIds.length > 500)
            revert InvalidBatchSize();

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            if (_ownerOf(tokenId) == address(0))
                revert TokenDoesNotExist(tokenId);
            _locked[tokenId] = false;
            emit TokenUnlocked(tokenId);
        }
    }

    /// @notice Check if a token is locked
    /// @param tokenId The token ID to check
    /// @return bool True if locked, false otherwise
    function isLocked(uint256 tokenId) public view returns (bool) {
        return _locked[tokenId];
    }

    /// @notice Burn a token (only owner can burn any token)
    /// @param tokenId The token ID to burn
    function burn(uint256 tokenId) public override {
        if (msg.sender != owner()) revert OnlyOwnerCanBurn();
        // Owner can burn any token without approval check
        _burn(tokenId);
    }

    // The following functions are overrides required by Solidity.

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Pausable) returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0))
        // Allow burning (to == address(0))
        // Block transfers if token is locked, unless auth is contract owner
        if (
            from != address(0) &&
            to != address(0) &&
            _locked[tokenId] &&
            auth != owner()
        ) {
            revert TokenIsLocked(tokenId);
        }

        return super._update(to, tokenId, auth);
    }
}
