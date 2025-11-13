// SPDX-License-Identifier: MIT
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
    // 🔒 토큰별 전송 잠금 상태 저장
    mapping(uint256 => bool) private _transferLocked;

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

    // 🔒 Owner 전용: 특정 토큰 전송 잠금 / 해제
    function setTransferLock(uint256 tokenId, bool locked) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _transferLocked[tokenId] = locked;
    }

    // 🔍 외부에서도 잠금 여부 조회 가능
    function isTransferLocked(uint256 tokenId) public view returns (bool) {
        return _transferLocked[tokenId];
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Pausable) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) {
            require(!_transferLocked[tokenId], "Token transfer is locked");
        }

        return super._update(to, tokenId, auth);
    }
}
