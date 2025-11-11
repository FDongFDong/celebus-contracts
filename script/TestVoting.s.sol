// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MainVoting} from "../src/vote/MainVoting.sol";

contract TestVoting is Script {
    MainVoting public voting = MainVoting(0x0b26e96bf1FA058BdAd6ff3186B8c46055dCDa0e);

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Testing MainVoting at:", address(voting));
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerKey);

        // 1. ExecutorSigner 설정 (deployer를 executor로 설정)
        if (voting.executorSigner() == address(0)) {
            console.log("Setting executor signer to:", deployer);
            voting.setExecutorSigner(deployer);
        }

        console.log("Current executor signer:", voting.executorSigner());

        // 2. 투표 데이터 생성 (user1이 4명 후보에게 투표)
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](4);

        records[0] = MainVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: 1,
            votingId: 1,
            userAddress: deployer,  // 테스트를 위해 deployer를 user로 사용
            userId: "testUser001",
            votingFor: "YuSeungWoo",
            votedOn: "Remember",
            votingAmt: 100,
            deadline: block.timestamp + 1 hours
        });

        records[1] = MainVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: 1,
            votingId: 2,
            userAddress: deployer,
            userId: "testUser001",
            votingFor: "JangBeomJun",
            votedOn: "Remember",
            votingAmt: 200,
            deadline: block.timestamp + 1 hours
        });

        records[2] = MainVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: 1,
            votingId: 3,
            userAddress: deployer,
            userId: "testUser001",
            votingFor: "SangNamja",
            votedOn: "Remember",
            votingAmt: 150,
            deadline: block.timestamp + 1 hours
        });

        records[3] = MainVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: 1,
            votingId: 4,
            userAddress: deployer,
            userId: "testUser001",
            votingFor: "KaSang",
            votedOn: "Remember",
            votingAmt: 180,
            deadline: block.timestamp + 1 hours
        });

        // 3. Record nonces 생성
        uint256[] memory recordNonces = new uint256[](4);
        for (uint256 i = 0; i < 4; i++) {
            recordNonces[i] = i;
        }

        // 4. User batch signature 생성
        bytes32 recordsHash = keccak256(abi.encode(records));
        bytes32 userBatchDigest = voting.hashUserBatchPreview(deployer, 1, records, recordNonces);

        console.log("Records hash:");
        console.logBytes32(recordsHash);
        console.log("User batch digest:");
        console.logBytes32(userBatchDigest);

        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(deployerKey, userBatchDigest);
        bytes memory userSig = abi.encodePacked(r1, s1, v1);

        // 5. UserBatchSig 배열 생성
        uint256[] memory recordIndices = new uint256[](4);
        recordIndices[0] = 0;
        recordIndices[1] = 1;
        recordIndices[2] = 2;
        recordIndices[3] = 3;

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: deployer,
            userNonce: 1,
            recordIndices: recordIndices,
            signature: userSig
        });

        // 6. Executor batch signature 생성
        bytes32 batchDigest = voting.hashBatchPreview(records, recordNonces, 1);
        console.log("Batch digest:");
        console.logBytes32(batchDigest);

        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(deployerKey, batchDigest);
        bytes memory executorSig = abi.encodePacked(r2, s2, v2);

        // 7. 투표 제출
        console.log("Submitting votes...");
        voting.submitMultiUserBatch(records, userBatchSigs, 1, executorSig, recordNonces);

        console.log("Votes submitted successfully!");
        console.log("Total votes for mission 1:", voting.getVoteCount(1));

        vm.stopBroadcast();
    }

    /**
     * @notice itemsHash 계산 헬퍼 (무결성 검증용)
     */
    function _calculateItemsHash(
        MainVoting.VoteRecord[] memory records,
        uint256[] memory recordNonces
    ) internal view returns (bytes32) {
        bytes32[] memory hashes = new bytes32[](records.length);
        for (uint256 i; i < records.length; ) {
            hashes[i] = voting.hashVoteRecord(records[i], recordNonces[i]);
            unchecked { ++i; }
        }
        return keccak256(abi.encodePacked(hashes));
    }
}
