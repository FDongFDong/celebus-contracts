// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {CelebusNFT} from "../src/nft/CelebusNFT.sol";

/**
 * @title StressBatchMint
 * @dev NFT 배치 민팅 스트레스 테스트 스크립트
 *
 * 사용법:
 * PRIVATE_KEY=0x... \
 * RECIPIENT=0x... \
 * BATCH_SIZE=200 \
 * REPEAT=5 \
 * NFT_ADDRESS=0x... \
 * forge script script/StressBatchMint.s.sol:StressBatchMint \
 *   --rpc-url https://opbnb-testnet-rpc.bnbchain.org \
 *   --broadcast -vvv
 *
 * 또는 .env 파일 사용:
 * forge script script/StressBatchMint.s.sol:StressBatchMint \
 *   --rpc-url $RPC_URL \
 *   --broadcast -vvv
 */
contract StressBatchMint is Script {
    function run() external {
        // 환경변수 읽기
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address recipient = vm.envAddress("RECIPIENT");
        uint256 batchSize = vm.envUint("BATCH_SIZE");
        uint256 repeat = vm.envUint("REPEAT");
        address nftAddress = vm.envAddress("NFT_ADDRESS");

        // 입력값 검증
        require(recipient != address(0), "Invalid recipient address");
        require(batchSize > 0 && batchSize <= 1000, "Batch size must be 1-1000");
        require(repeat > 0 && repeat <= 100, "Repeat must be 1-100");
        require(nftAddress != address(0), "Invalid NFT address");

        CelebusNFT nft = CelebusNFT(nftAddress);

        console.log("=== Stress Batch Mint Configuration ===");
        console.log("NFT Address:", nftAddress);
        console.log("Recipient:", recipient);
        console.log("Batch Size:", batchSize);
        console.log("Repeat Count:", repeat);
        console.log("Total NFTs:", batchSize * repeat);
        console.log("======================================");

        vm.startBroadcast(privateKey);

        uint256 totalGasUsed = 0;
        uint256 successCount = 0;

        for (uint256 i = 0; i < repeat; i++) {
            uint256 gasBefore = gasleft();

            try nft.batchMint(recipient, batchSize) returns (uint256 startTokenId) {
                uint256 gasUsed = gasBefore - gasleft();
                totalGasUsed += gasUsed;
                successCount++;

                console.log("Batch", i + 1, "SUCCESS:");
                console.log("  Token IDs:", startTokenId, "-", startTokenId + batchSize - 1);
                console.log("  Gas Used:", gasUsed);
            } catch Error(string memory reason) {
                console.log("Batch", i + 1, "FAILED:", reason);
            } catch (bytes memory lowLevelData) {
                console.log("Batch", i + 1, "FAILED with low-level error");
                console.logBytes(lowLevelData);
            }
        }

        vm.stopBroadcast();

        // 최종 결과 출력
        console.log("\n=== Stress Test Results ===");
        console.log("Total Batches:", repeat);
        console.log("Successful Batches:", successCount);
        console.log("Failed Batches:", repeat - successCount);
        console.log("Total Gas Used:", totalGasUsed);
        if (successCount > 0) {
            console.log("Average Gas per Batch:", totalGasUsed / successCount);
        }
        console.log("===========================");
    }
}
