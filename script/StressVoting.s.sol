// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {MainVoting} from "../src/vote/MainVoting.sol";

/// @notice Generates vote/nonce/signature payloads and saves them to JSON for offline reuse.
contract StressVotingGenerate is Script {
    using Strings for uint256;

    MainVoting internal VOTING;

    uint256 private constant DEFAULT_TOTAL_VOTES = 100;
    uint256 private constant DEFAULT_USER_COUNT = 20;
    uint256 private constant USER_KEY_SALT = 0x9999999999999999999999999999999999999999999999999999999999999999;

    function run() external {
        VOTING = MainVoting(_envOrAddress("VOTING_ADDRESS", 0x10Fb9C7BFec7d2059b65c9e70B4F58E2E6fd0eFE));
        uint256 executorKey = vm.envUint("PRIVATE_KEY");
        uint256 missionId = _envOrUint("MISSION_ID", 1);
        uint256 totalVotes = _envOrUint("TOTAL_VOTES", DEFAULT_TOTAL_VOTES);
        uint256 userCount = _envOrUint("USER_COUNT", DEFAULT_USER_COUNT);
        string memory fileName = _envOrString("STRESS_OUT", "stress-output.json");

        require(totalVotes % userCount == 0, "totalVotes % userCount != 0");
        uint256 votesPerUser = totalVotes / userCount;
        require(votesPerUser > 0, "votesPerUser=0");
        require(votesPerUser <= VOTING.MAX_RECORDS_PER_USER_BATCH(), "per-user limit");

        console2.log(
            string.concat("Preparing ", totalVotes.toString(), " votes across ", userCount.toString(), " users")
        );

        MainVoting.VoteRecord[] memory records = _buildRecords(missionId, userCount, votesPerUser);
        MainVoting.UserBatchSig[] memory userBatchSigs = _signUsers(records, userCount, votesPerUser);

        uint256 batchNonce = _deriveBatchNonce();
        bytes memory executorSig = _buildExecutorSig(executorKey, batchNonce);

        string memory fullPath = _writeJson(
            fileName, missionId, totalVotes, userCount, batchNonce, records, userBatchSigs, executorSig
        );

        console2.log(string.concat("Signatures stored to ", fullPath));
        console2.log(string.concat("MissionId: ", missionId.toString()));
        console2.log(string.concat("Batch nonce: ", batchNonce.toString()));
    }

    function _buildRecords(uint256 missionId, uint256 userCount, uint256 votesPerUser)
        internal
        view
        returns (MainVoting.VoteRecord[] memory records)
    {
        uint256 ts = block.timestamp;
        if (ts == 0) ts = 1736726400;
        uint256 deadline = ts + 14 days;
        uint256 recordCount = userCount * votesPerUser;
        records = new MainVoting.VoteRecord[](recordCount);
        uint256 votingBase = uint256(keccak256(abi.encode(ts, missionId)));

        for (uint256 u; u < userCount; ++u) {
            _fillUserRecords(records, u, votesPerUser, ts, missionId, votingBase, deadline);
        }
    }

    function _fillUserRecords(
        MainVoting.VoteRecord[] memory records,
        uint256 userIndex,
        uint256 votesPerUser,
        uint256 timestamp,
        uint256 missionId,
        uint256 votingBase,
        uint256 deadline
    ) internal view {
        address userAddr = vm.addr(_userKey(userIndex));
        string memory userId = string.concat("stress-", userIndex.toString());
        uint256 votingId = (votingBase + userIndex + 1) % 1_000_000_000 + 1;

        for (uint256 j; j < votesPerUser; ++j) {
            uint256 idx = userIndex * votesPerUser + j;
            records[idx] = MainVoting.VoteRecord({
                timestamp: timestamp,
                missionId: missionId,
                votingId: votingId,
                userAddress: userAddr,
                userId: userId,
                votingFor: string.concat("Artist-", (userIndex + 1).toString()),
                votedOn: string.concat("Track-", (j + 1).toString()),
                votingAmt: 10 + j,
                deadline: deadline
            });
        }
    }

    function _signUsers(
        MainVoting.VoteRecord[] memory records,
        uint256 userCount,
        uint256 votesPerUser
    ) internal view returns (MainVoting.UserBatchSig[] memory userBatchSigs) {
        userBatchSigs = new MainVoting.UserBatchSig[](userCount);

        for (uint256 u; u < userCount; ++u) {
            uint256 userKey = _userKey(u);
            uint256[] memory indices = new uint256[](votesPerUser);
            for (uint256 j; j < votesPerUser; ++j) {
                indices[j] = u * votesPerUser + j;
            }
            uint256 userNonce = uint256(keccak256(abi.encodePacked("userNonce", u, block.timestamp)));
            userBatchSigs[u] = _buildUserBatchSig(records, userKey, vm.addr(userKey), userNonce, indices);
        }
    }

    function _buildUserBatchSig(
        MainVoting.VoteRecord[] memory records,
        uint256 userKey,
        address userAddr,
        uint256 userNonce,
        uint256[] memory indices
    ) internal view returns (MainVoting.UserBatchSig memory sigStruct) {
        MainVoting.VoteRecord[] memory subset = new MainVoting.VoteRecord[](indices.length);
        for (uint256 i; i < indices.length; ++i) {
            uint256 idx = indices[i];
            subset[i] = records[idx];
        }
        bytes32 digest = VOTING.hashUserBatchPreview(userAddr, userNonce, subset);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userKey, digest);
        sigStruct = MainVoting.UserBatchSig({
            user: userAddr,
            userNonce: userNonce,
            recordIndices: indices,
            signature: abi.encodePacked(r, s, v)
        });
    }

    function _buildExecutorSig(
        uint256 executorKey,
        uint256 batchNonce
    ) internal view returns (bytes memory signature) {
        bytes32 digest = VOTING.hashBatchPreview(batchNonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(executorKey, digest);
        signature = abi.encodePacked(r, s, v);
    }

    function _deriveBatchNonce() internal view returns (uint256) {
        return uint256(keccak256(abi.encode(block.timestamp, block.prevrandao, msg.sender))) % 1_000_000_000 + 10_000;
    }

    function _userKey(uint256 userIndex) internal pure returns (uint256) {
        return uint256(keccak256(abi.encode(USER_KEY_SALT, userIndex + 1)));
    }

    function _writeJson(
        string memory fileName,
        uint256 missionId,
        uint256 totalVotes,
        uint256 userCount,
        uint256 batchNonce,
        MainVoting.VoteRecord[] memory records,
        MainVoting.UserBatchSig[] memory userBatchSigs,
        bytes memory executorSig
    ) internal returns (string memory fullPath) {
        string memory dir = string.concat(vm.projectRoot(), "/stress-artifacts");
        vm.createDir(dir, true);
        fullPath = string.concat(dir, "/", fileName);
        vm.serializeUint("stress", "missionId", missionId);
        vm.serializeUint("stress", "totalVotes", totalVotes);
        vm.serializeUint("stress", "userCount", userCount);
        vm.serializeUint("stress", "batchNonce", batchNonce);
        vm.serializeBytes("stress", "records", abi.encode(records));
        vm.serializeBytes("stress", "userBatchSigs", abi.encode(userBatchSigs));
        string memory json = vm.serializeBytes("stress", "executorSig", executorSig);
        vm.writeJson(json, fullPath);
    }

    function _envOrUint(string memory key, uint256 defaultValue) internal returns (uint256) {
        if (vm.envExists(key)) return vm.envUint(key);
        return defaultValue;
    }

    function _envOrString(string memory key, string memory defaultValue) internal returns (string memory) {
        if (vm.envExists(key)) return vm.envString(key);
        return defaultValue;
    }

    function _envOrAddress(string memory key, address defaultValue) internal returns (address) {
        if (vm.envExists(key)) return vm.envAddress(key);
        return defaultValue;
    }
}
