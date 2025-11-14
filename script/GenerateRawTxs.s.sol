// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {CelebusNFT} from "../src/nft/CelebusNFT.sol";
import {Vm} from "forge-std/Vm.sol";

/**
 * @title GenerateRawTxs
 * @notice Foundry Script로 Raw Transaction 생성 (병렬 전송용)
 * @dev Usage:
 *   forge script script/GenerateRawTxs.s.sol:GenerateRawTxs \
 *     --rpc-url $RPC_URL \
 *     -vvv
 *
 * Environment variables:
 *   - NFT_ADDRESS: Deployed CelebusNFT contract address
 *   - RECIPIENT: Address to receive the NFTs
 *   - PRIVATE_KEY: Private key for signing
 *   - BATCH_SIZE: (Optional) Number of NFTs per batch (default: 200)
 *   - REPEAT_COUNT: (Optional) Number of batches (default: 5)
 *   - START_TOKEN_ID: (Optional) Starting token ID (default: 1)
 */
contract GenerateRawTxs is Script {
    function run() external {
        // Load environment variables
        address nftAddress = vm.envAddress("NFT_ADDRESS");
        address recipient = vm.envAddress("RECIPIENT");
        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        // Optional parameters with defaults
        uint256 batchSize = vm.envOr("BATCH_SIZE", uint256(200));
        uint256 repeatCount = vm.envOr("REPEAT_COUNT", uint256(5));
        uint256 startTokenId = vm.envOr("START_TOKEN_ID", uint256(1));

        // Validate parameters
        require(batchSize > 0 && batchSize <= 500, "Batch size must be 1-500");
        require(repeatCount > 0 && repeatCount <= 100, "Repeat count must be 1-100");

        CelebusNFT nft = CelebusNFT(nftAddress);

        console.log("=== Raw Transaction Generation ===");
        console.log("NFT Contract:", nftAddress);
        console.log("Recipient:", recipient);
        console.log("Batch Size:", batchSize);
        console.log("Repeat Count:", repeatCount);
        console.log("Start Token ID:", startTokenId);
        console.log("===================================\n");

        // 배포자 주소 (private key로부터)
        address sender = vm.addr(privateKey);

        // 현재 nonce 조회
        uint256 currentNonce = vm.getNonce(sender);
        console.log("Current nonce:", currentNonce);
        console.log("");

        // 가스 설정
        uint256 gasLimit = 2_000_000; // 충분한 가스 리미트

        // 출력 디렉토리 생성
        string memory outputDir = "raw-txs";

        // 디렉토리 생성 (이미 존재해도 에러 안남)
        string[] memory mkdirCmd = new string[](3);
        mkdirCmd[0] = "mkdir";
        mkdirCmd[1] = "-p";
        mkdirCmd[2] = outputDir;
        vm.ffi(mkdirCmd);

        console.log("Generating raw transactions...\n");

        // 각 배치에 대한 raw transaction 생성
        for (uint256 i = 0; i < repeatCount; i++) {
            uint256 currentStartId = startTokenId + (i * batchSize);
            uint256 txNonce = currentNonce + i;

            console.log("Batch", i + 1, "/", repeatCount);
            console.log("  Token IDs:", currentStartId, "-", currentStartId + batchSize - 1);
            console.log("  Nonce:", txNonce);

            // calldata 생성
            bytes memory callData = abi.encodeWithSignature(
                "batchMint(address,uint256,uint256)",
                recipient,
                currentStartId,
                batchSize
            );

            // Raw transaction 생성 (cast를 통해)
            // cast mktx를 사용하여 서명된 raw transaction 생성
            string[] memory castCmd = new string[](15);
            castCmd[0] = "cast";
            castCmd[1] = "mktx";
            castCmd[2] = vm.toString(nftAddress);
            castCmd[3] = vm.toString(callData);
            castCmd[4] = "--nonce";
            castCmd[5] = vm.toString(txNonce);
            castCmd[6] = "--gas-limit";
            castCmd[7] = vm.toString(gasLimit);
            castCmd[8] = "--legacy";
            castCmd[9] = "--rpc-url";
            castCmd[10] = vm.envString("RPC_URL");
            castCmd[11] = "--private-key";
            castCmd[12] = vm.envString("PRIVATE_KEY");
            castCmd[13] = "--create";
            castCmd[14] = "false";

            bytes memory rawTx = vm.ffi(castCmd);
            string memory rawTxHex = vm.toString(rawTx);

            // 파일로 저장
            string memory filename = string.concat(
                outputDir,
                "/tx-",
                vm.toString(i),
                ".hex"
            );

            vm.writeFile(filename, rawTxHex);

            console.log("  Saved:", filename);
            console.log("");
        }

        console.log("=== Generation Complete ===");
        console.log("Total raw transactions:", repeatCount);
        console.log("Output directory:", outputDir);
        console.log("===========================\n");

        console.log("Next step:");
        console.log("  ./scripts/send-raw-parallel.sh");
    }
}
