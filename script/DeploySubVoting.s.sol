// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SubVoting} from "../src/vote/SubVoting.sol";

contract DeploySubVoting is Script {
    function run() external returns (SubVoting) {
        // Private key 가져오기 (환경변수 또는 CLI 옵션)
        uint256 deployerPrivateKey;
        
        try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
            console.log("Using PRIVATE_KEY from environment variable");
        } catch {
            revert("PRIVATE_KEY environment variable not set. Use: export PRIVATE_KEY=0x... or forge script ... --private-key 0x...");
        }

        address deployer = vm.addr(deployerPrivateKey);

        console.log("========================================");
        console.log("Deploying SubVoting Contract");
        console.log("========================================");
        console.log("Deployer Address:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("========================================");

        vm.startBroadcast(deployerPrivateKey);

        SubVoting voting = new SubVoting(deployer);

        console.log("");
        console.log("========================================");
        console.log("Deployment Successful!");
        console.log("========================================");
        console.log("SubVoting Address:", address(voting));
        console.log("Owner Address:", voting.owner());
        console.log("Stored Chain ID:", voting.CHAIN_ID());
        console.log("ExecutorSigner (not set):", voting.executorSigner());
        console.log("========================================");

        vm.stopBroadcast();

        return voting;
    }
}
