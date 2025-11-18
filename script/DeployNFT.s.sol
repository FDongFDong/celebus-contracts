// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {CelebusNFT} from "../src/nft/CelebusNFT.sol";

/**
 * @title DeployNFT
 * @notice Deploy CelebusNFT contract to any network
 * @dev Usage:
 *   forge script script/DeployNFT.s.sol:DeployNFT \
 *     --rpc-url $RPC_URL \
 *     --broadcast \
 *     --private-key $PRIVATE_KEY \
 *     -vvv
 *
 * Notes:
 *   - Private key is passed via --private-key flag
 *   - The deployer address becomes the NFT contract owner
 *
 * Networks:
 *   - Local: http://localhost:8545 (anvil)
 *   - opBNB Testnet: https://opbnb-testnet-rpc.bnbchain.org
 */
contract DeployNFT is Script {
    function run() external {
        // msg.sender는 --private-key로 전달된 주소
        address owner = msg.sender;

        console.log("=== CelebusNFT Deployment ===");
        console.log("Deployer:", owner);
        console.log("Chain ID:", block.chainid);
        console.log("=============================\n");

        vm.startBroadcast();

        // Deploy CelebusNFT
        CelebusNFT nft = new CelebusNFT(owner);

        vm.stopBroadcast();

        console.log("\n=== Deployment Successful ===");
        console.log("CelebusNFT Address:", address(nft));
        console.log("Owner:", nft.owner());
        console.log("Name:", nft.name());
        console.log("Symbol:", nft.symbol());
        console.log("=============================\n");

        console.log("Next steps:");
        console.log("1. Save the NFT address:");
        console.log("   export NFT_ADDRESS=%s", address(nft));
        console.log("\n2. Mint NFTs using MintBatch script:");
        console.log(
            "   forge script script/MintBatch.s.sol:MintBatch --rpc-url $RPC_URL --broadcast -vvv"
        );
        console.log("\n3. Verify on explorer (if on testnet/mainnet):");
        console.log("   - opBNB Testnet: https://testnet.opbnbscan.com/address/%s", address(nft));
    }
}
