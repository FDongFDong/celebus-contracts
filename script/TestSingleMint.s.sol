// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {VIBENFT} from "../src/nft/VIBENFT.sol";

/**
 * @title TestSingleMint
 * @notice VIBENFT 단건 민팅 반복 실행 스크립트
 *
 * Environment variables:
 *   - NFT_ADDRESS: Deployed VIBENFT contract address
 *   - RECIPIENT: Address to receive NFTs
 *   - PRIVATE_KEY: Broadcaster private key
 *   - MINT_COUNT: (Optional) Number of single mints (default: 10)
 */
contract TestSingleMint is Script {
    function run() external {
        address nftAddress = vm.envAddress("NFT_ADDRESS");
        address recipient = vm.envAddress("RECIPIENT");
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        uint256 mintCount = vm.envOr("MINT_COUNT", uint256(10));

        require(mintCount > 0, "MINT_COUNT must be > 0");

        VIBENFT nft = VIBENFT(nftAddress);

        console.log("=== Single Mint Test ===");
        console.log("NFT:", nftAddress);
        console.log("Recipient:", recipient);
        console.log("Mint Count:", mintCount);
        console.log("========================");

        vm.startBroadcast(privateKey);

        for (uint256 i = 0; i < mintCount; i++) {
            uint256 tokenId = nft.safeMint(recipient);
            console.log("Minted tokenId:", tokenId);
        }

        vm.stopBroadcast();
    }
}
