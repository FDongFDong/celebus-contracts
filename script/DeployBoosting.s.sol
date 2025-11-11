// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Boosting} from "../src/vote/Boosting.sol";

contract DeployBoosting is Script {
    function run() external returns (Boosting) {
        // 배포자 주소 (private key로부터 유도됨)
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));

        console.log("Deploying Boosting...");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

        // Boosting 배포 (deployer를 owner로 설정)
        Boosting boosting = new Boosting(deployer);

        console.log("Boosting deployed at:", address(boosting));
        console.log("Owner:", boosting.owner());
        console.log("Chain ID stored:", boosting.CHAIN_ID());
        console.log("ExecutorSigner (not set yet):", boosting.executorSigner());

        vm.stopBroadcast();

        return boosting;
    }
}
