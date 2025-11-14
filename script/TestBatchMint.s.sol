// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";

// Lightweight interface to avoid storage queries
interface ICelebusNFT {
    function batchMint(address to, uint256 startTokenId, uint256 count) external;
    function balanceOf(address owner) external view returns (uint256);
}

/**
 * @title TestBatchMint
 * @notice 배치 민팅 테스트 (batchMint 함수를 K개씩 N번 반복 호출)
 * @dev Usage:
 *   forge script script/TestBatchMint.s.sol:TestBatchMint \
 *     --rpc-url $RPC_URL \
 *     --broadcast \
 *     --private-key $PRIVATE_KEY \
 *     -vvv
 *
 * Environment variables:
 *   - NFT_ADDRESS: 배포된 CelebusNFT 컨트랙트 주소 (필수)
 *   - RECIPIENT: NFT를 받을 주소 (필수)
 *   - BATCH_SIZE: 배치당 민팅 개수 (선택, 기본값: 100)
 *   - REPEAT_COUNT: 반복 횟수 (선택, 기본값: 5)
 *   - START_TOKEN_ID: 시작 토큰 ID (선택, 기본값: 1)
 */
contract TestBatchMint is Script {
    function run() external {
        // 환경변수 로드
        address nftAddress = vm.envAddress("NFT_ADDRESS");
        address recipient = vm.envAddress("RECIPIENT");
        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        // 선택적 파라미터 (기본값 설정)
        uint256 batchSize = vm.envOr("BATCH_SIZE", uint256(100));
        uint256 repeatCount = vm.envOr("REPEAT_COUNT", uint256(5));
        uint256 startTokenId = vm.envOr("START_TOKEN_ID", uint256(1));

        // 파라미터 검증
        require(batchSize > 0, "BATCH_SIZE must be greater than 0");
        require(repeatCount > 0, "REPEAT_COUNT must be greater than 0");

        ICelebusNFT nft = ICelebusNFT(nftAddress);

        console.log("=== Batch Mint Test Configuration ===");
        console.log("NFT Contract:", nftAddress);
        console.log("Recipient:", recipient);
        console.log("Batch Size:", batchSize);
        console.log("Repeat Count:", repeatCount);
        console.log("Total NFTs:", batchSize * repeatCount);
        console.log("Start Token ID:", startTokenId);
        console.log("======================================\n");

        uint256 totalGasUsed = 0;
        uint256 successCount = 0;
        uint256 failCount = 0;
        uint256 currentTokenId = startTokenId;

        console.log("Starting batch mint test...\n");
        console.log("Note: On-chain processing time will be calculated from broadcast receipts\n");

        vm.startBroadcast(privateKey);

        for (uint256 i = 0; i < repeatCount; i++) {
            uint256 batchStartId = currentTokenId;
            uint256 batchEndId = currentTokenId + batchSize - 1;
            uint256 gasBefore = gasleft();

            console.log("Batch #", i + 1, "/", repeatCount);
            console.log("  Token IDs:", batchStartId, "-", batchEndId);
            console.log("  Batch Size:", batchSize);

            try nft.batchMint(recipient, batchStartId, batchSize) {
                uint256 gasUsed = gasBefore - gasleft();
                totalGasUsed += gasUsed;
                successCount++;

                console.log("  Gas Used:", gasUsed);
                console.log("  Gas per NFT:", gasUsed / batchSize);
                console.log("  Status: Success");
                console.log("  Progress:", (i + 1) * batchSize, "/", batchSize * repeatCount);
                console.log("");

                currentTokenId += batchSize;
            } catch Error(string memory reason) {
                failCount++;
                console.log("  Status: Failed");
                console.log("  Reason:", reason);
                console.log("");

                // 실패 시에도 토큰 ID는 증가 (다음 배치 시도)
                currentTokenId += batchSize;
            }
        }

        vm.stopBroadcast();

        // 통계 출력
        console.log("=== Test Results ===");
        console.log("Total Batches:", repeatCount);
        console.log("Success:", successCount);
        console.log("Failed:", failCount);
        console.log("Success Rate:", (successCount * 100) / repeatCount, "%");
        console.log("Total NFTs Minted:", successCount * batchSize);
        console.log("");

        if (successCount > 0) {
            console.log("=== Gas Statistics ===");
            console.log("Total Gas Used:", totalGasUsed);
            console.log("Average Gas per Batch:", totalGasUsed / successCount);
            console.log("Average Gas per NFT:", totalGasUsed / (successCount * batchSize));
            console.log("======================\n");
        }

        // 최종 잔액 확인 (RPC 노드 동기화 문제로 생략)
        // Note: opBNB RPC 노드의 storage trie가 준비되기 전에는 balanceOf() 호출 시 실패 가능
        console.log("Expected Final Balance:", successCount * batchSize);
        console.log("Verify balance on opBNBScan after sync");
        console.log("");
        console.log("View on opBNBScan:");
        console.log("  NFT:", nftAddress);
        console.log("  Recipient:", recipient);
        console.log("  https://testnet.opbnbscan.com/address/", nftAddress);
    }
}
