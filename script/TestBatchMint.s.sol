// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {VIBENFT} from "../src/nft/VIBENFT.sol";

/**
 * @title TestBatchMint
 * @notice VIBENFT 배치 민팅 반복 실행 스크립트
 *
 * Environment variables:
 *   - NFT_ADDRESS: Deployed VIBENFT contract address
 *   - RECIPIENT: Address to receive NFTs
 *   - PRIVATE_KEY: Broadcaster private key
 *   - BATCH_SIZE: (Optional) NFTs per tx (default: 100, max: 1500)
 *   - REPEAT_COUNT: (Optional) Number of batch txs (default: 5)
 *   - START_TOKEN_ID: (Optional) compatibility input, ignored (auto-increment contract)
 */
contract TestBatchMint is Script {
    function run() external {
        address nftAddress = vm.envAddress("NFT_ADDRESS");
        address recipient = vm.envAddress("RECIPIENT");
        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        uint256 batchSize = vm.envOr("BATCH_SIZE", uint256(100));
        uint256 repeatCount = vm.envOr("REPEAT_COUNT", uint256(5));
        uint256 compatibilityStartTokenId = vm.envOr("START_TOKEN_ID", uint256(0));

        require(batchSize > 0 && batchSize <= 1500, "BATCH_SIZE must be 1-1500");
        require(repeatCount > 0, "REPEAT_COUNT must be > 0");

        VIBENFT nft = VIBENFT(nftAddress);

        console.log("=== Batch Mint Test ===");
        console.log("NFT:", nftAddress);
        console.log("Recipient:", recipient);
        console.log("Batch Size:", batchSize);
        console.log("Repeat Count:", repeatCount);
        if (compatibilityStartTokenId != 0) {
            console.log("Note: START_TOKEN_ID is ignored (VIBENFT uses auto-increment tokenId)");
        }
        console.log("=======================");

        vm.startBroadcast(privateKey);

        for (uint256 i = 0; i < repeatCount; i++) {
            uint256 startTokenId = nft.batchMint(recipient, batchSize);
            console.log("Batch", i + 1, "startTokenId:", startTokenId);
        }

        vm.stopBroadcast();
    }
}
