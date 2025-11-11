// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SubVoting} from "../src/vote/SubVoting.sol";

contract DeploySubVoting is Script {
    function run() external returns (SubVoting) {
        // 배포자 주소 (private key로부터 유도됨)
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));

        console.log("Deploying SubVoting...");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

        // SubVoting 배포 (deployer를 owner로 설정)
        SubVoting voting = new SubVoting(deployer);

        console.log("SubVoting deployed at:", address(voting));
        console.log("Owner:", voting.owner());
        console.log("Chain ID stored:", voting.CHAIN_ID());
        console.log("ExecutorSigner (not set yet):", voting.executorSigner());

        vm.stopBroadcast();

        return voting;
    }
}
