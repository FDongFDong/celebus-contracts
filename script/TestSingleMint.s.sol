// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";

// Lightweight interface to avoid storage queries
interface ICelebusNFT {
    function safeMint(address to, uint256 tokenId) external;
    function balanceOf(address owner) external view returns (uint256);
}

/**
 * @title TestSingleMint
 * @notice 개별 민팅 테스트 (mint 함수를 1개씩 N번 반복 호출)
 * @dev Usage:
 *   forge script script/TestSingleMint.s.sol:TestSingleMint \
 *     --rpc-url $RPC_URL \
 *     --broadcast \
 *     --private-key $PRIVATE_KEY \
 *     -vvv
 *
 * Environment variables:
 *   - NFT_ADDRESS: 배포된 CelebusNFT 컨트랙트 주소 (필수)
 *   - RECIPIENT: NFT를 받을 주소 (필수)
 *   - MINT_COUNT: 민팅 횟수 (선택, 기본값: 10)
 *   - START_TOKEN_ID: 시작 토큰 ID (선택, 기본값: 1)
 */
contract TestSingleMint is Script {
    function run() external {
        // 환경변수 로드
        address nftAddress = vm.envAddress("NFT_ADDRESS");
        address recipient = vm.envAddress("RECIPIENT");
        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        // 선택적 파라미터 (기본값 설정)
        uint256 mintCount = vm.envOr("MINT_COUNT", uint256(10));
        uint256 startTokenId = vm.envOr("START_TOKEN_ID", uint256(1));

        // 파라미터 검증
        require(mintCount > 0, "MINT_COUNT must be greater than 0");

        ICelebusNFT nft = ICelebusNFT(nftAddress);

        console.log("=== Single Mint Test Configuration ===");
        console.log("NFT Contract:", nftAddress);
        console.log("Recipient:", recipient);
        console.log("Mint Count:", mintCount);
        console.log("Start Token ID:", startTokenId);
        console.log("======================================\n");

        uint256 totalGasUsed = 0;
        uint256 successCount = 0;
        uint256 failCount = 0;

        console.log("Starting individual mint test...\n");

        vm.startBroadcast(privateKey);

        for (uint256 i = 0; i < mintCount; i++) {
            uint256 tokenId = startTokenId + i;
            uint256 gasBefore = gasleft();

            try nft.safeMint(recipient, tokenId) {
                uint256 gasUsed = gasBefore - gasleft();
                totalGasUsed += gasUsed;
                successCount++;

                console.log("Mint #", i + 1, "/", mintCount);
                console.log("  Token ID:", tokenId);
                console.log("  Gas Used:", gasUsed);
                console.log("  Status: Success");
                console.log("");
            } catch Error(string memory reason) {
                failCount++;
                console.log("Mint #", i + 1, "/", mintCount);
                console.log("  Token ID:", tokenId);
                console.log("  Status: Failed");
                console.log("  Reason:", reason);
                console.log("");
            }
        }

        vm.stopBroadcast();

        // 통계 출력
        console.log("=== Test Results ===");
        console.log("Total Attempts:", mintCount);
        console.log("Success:", successCount);
        console.log("Failed:", failCount);
        console.log("Success Rate:", (successCount * 100) / mintCount, "%");
        console.log("");

        if (successCount > 0) {
            console.log("=== Gas Statistics ===");
            console.log("Total Gas Used:", totalGasUsed);
            console.log("Average Gas per Mint:", totalGasUsed / successCount);
            console.log("======================\n");
        }

        // 최종 잔액 확인
        uint256 finalBalance = nft.balanceOf(recipient);
        console.log("Final NFT Balance:", finalBalance);
        console.log("");
        console.log("View on opBNBScan:");
        console.log("  NFT:", nftAddress);
        console.log("  Recipient:", recipient);
        console.log("  https://testnet.opbnbscan.com/address/", nftAddress);
    }
}
