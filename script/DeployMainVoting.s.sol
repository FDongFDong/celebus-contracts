// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MainVoting} from "../src/vote/MainVoting.sol";

contract DeployMainVoting is Script {
    function run() external returns (MainVoting) {
        // Private key 가져오기 (환경변수 또는 CLI 옵션)
        uint256 deployerPrivateKey;
        
        // 환경변수 확인 (존재하면 사용)
        try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
            console.log("Using PRIVATE_KEY from environment variable");
        } catch {
            // 환경변수 없으면 에러 메시지 출력
            revert("PRIVATE_KEY environment variable not set. Use: export PRIVATE_KEY=0x... or forge script ... --private-key 0x...");
        }

        // 배포자 주소 (private key로부터 유도됨)
        address deployer = vm.addr(deployerPrivateKey);

        console.log("========================================");
        console.log("Deploying MainVoting Contract");
        console.log("========================================");
        console.log("Deployer Address:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("========================================");

        vm.startBroadcast(deployerPrivateKey);

        // MainVoting 배포 (deployer를 owner로 설정)
        MainVoting voting = new MainVoting(deployer);

        console.log("");
        console.log("========================================");
        console.log("Deployment Successful!");
        console.log("========================================");
        console.log("MainVoting Address:", address(voting));
        console.log("Owner Address:", voting.owner());
        console.log("Stored Chain ID:", voting.CHAIN_ID());
        console.log("========================================");

        vm.stopBroadcast();

        return voting;
    }
}
