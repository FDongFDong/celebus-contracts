// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MainVoting2} from "../src/vote/MainVoting2.sol";

contract DeployMainVoting2 is Script {
    function run() external returns (MainVoting2) {
        // 배포자 주소 (private key로부터 유도됨)
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));

        console.log("Deploying MainVoting2...");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

        // MainVoting2 배포 (deployer를 owner로 설정)
        MainVoting2 voting = new MainVoting2(deployer);

        console.log("MainVoting2 deployed at:", address(voting));
        console.log("Owner:", voting.owner());
        console.log("Chain ID stored:", voting.CHAIN_ID());

        vm.stopBroadcast();

        return voting;
    }
}
