// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {MainVoting} from "../src/vote/MainVoting.sol";

/// @notice Submits the two required real vote scenarios to the deployed MainVoting contract.
contract SubmitVoteScenarios is Script {
    MainVoting internal constant VOTING = MainVoting(0x10Fb9C7BFec7d2059b65c9e70B4F58E2E6fd0eFE);

    uint256 private constant USER_ALPHA_KEY = 0x1111111111111111111111111111111111111111111111111111111111111111;
    uint256 private constant USER_BRAVO_KEY = 0x2222222222222222222222222222222222222222222222222222222222222222;
    uint256 private constant USER_CHARLIE_KEY = 0x3333333333333333333333333333333333333333333333333333333333333333;

    uint256 private constant MISSION_ID = 1;

    struct ScenarioVotingIds {
        uint256 alphaFirst;
        uint256 alphaSecond;
        uint256 bravo;
        uint256 charlie;
        uint256 alphaFive;
    }

    struct ScenarioNonces {
        uint256 batchBase;
        uint256 alphaFirst;
        uint256 alphaSecond;
        uint256 alphaFive;
        uint256 bravo;
        uint256 charlie;
    }

    function run() external {
        uint256 executorKey = vm.envUint("PRIVATE_KEY");
        address executor = vm.addr(executorKey);

        console2.log("MainVoting:", address(VOTING));
        console2.log("Executor signer (env):", executor);
        console2.log("On-chain executor signer:", VOTING.executorSigner());

        require(executor == VOTING.executorSigner(), "Executor signer mismatch");

        uint256 seed = _generateSeed();
        ScenarioVotingIds memory votingIds = _generateScenarioVotingIds(seed);
        ScenarioNonces memory nonces = _generateScenarioNonces(seed);
        _logVotingSetup(votingIds, nonces);

        (
            MainVoting.VoteRecord[] memory records1,
            uint256[] memory nonces1,
            MainVoting.UserBatchSig[] memory userBatchSigs1,
            uint256 batchNonce1,
            bytes memory executorSig1
        ) = _buildScenarioMultiUser(executorKey, votingIds, nonces);

        (
            MainVoting.VoteRecord[] memory records2,
            uint256[] memory nonces2,
            MainVoting.UserBatchSig[] memory userBatchSigs2,
            uint256 batchNonce2,
            bytes memory executorSig2
        ) = _buildScenarioSameUserExtra(executorKey, votingIds, nonces);

        (
            MainVoting.VoteRecord[] memory records3,
            uint256[] memory nonces3,
            MainVoting.UserBatchSig[] memory userBatchSigs3,
            uint256 batchNonce3,
            bytes memory executorSig3
        ) = _buildScenarioAlphaFiveVotes(executorKey, votingIds, nonces);

        vm.startBroadcast(executorKey);

        VOTING.submitMultiUserBatch(records1, userBatchSigs1, batchNonce1, executorSig1, nonces1);
        console2.log("Submitted scenario 1 (multi-user batch).");

        VOTING.submitMultiUserBatch(records2, userBatchSigs2, batchNonce2, executorSig2, nonces2);
        console2.log("Submitted scenario 2 (same user additional votes).");

        VOTING.submitMultiUserBatch(records3, userBatchSigs3, batchNonce3, executorSig3, nonces3);
        console2.log("Submitted scenario 3 (Alpha single signature / 5 votes).");

        vm.stopBroadcast();
    }

    function _buildScenarioMultiUser(
        uint256 executorKey,
        ScenarioVotingIds memory votingIds,
        ScenarioNonces memory nonces
    )
        internal
        view
        returns (
            MainVoting.VoteRecord[] memory records,
            uint256[] memory recordNonces,
            MainVoting.UserBatchSig[] memory userBatchSigs,
            uint256 batchNonce,
            bytes memory executorSig
        )
    {
        uint256 ts = block.timestamp;
        if (ts == 0) ts = 1736726400;
        uint256 deadline = ts + 14 days;

        address userAlpha = vm.addr(USER_ALPHA_KEY);
        address userBravo = vm.addr(USER_BRAVO_KEY);
        address userCharlie = vm.addr(USER_CHARLIE_KEY);

        console2.log("Scenario 1 users:");
        console2.log(" - Alpha:", userAlpha);
        console2.log(" - Bravo:", userBravo);
        console2.log(" - Charlie:", userCharlie);

        records = new MainVoting.VoteRecord[](5);
        records[0] = _voteRecord(ts, userAlpha, "alpha001", "Nova", "Remember", 180, deadline, votingIds.alphaFirst);
        records[1] = _voteRecord(ts, userAlpha, "alpha001", "Eden", "Remember", 120, deadline, votingIds.alphaFirst);
        records[2] = _voteRecord(ts, userBravo, "bravo009", "Nova", "Remember", 220, deadline, votingIds.bravo);
        records[3] = _voteRecord(ts, userBravo, "bravo009", "Milo", "Forget", 70, deadline, votingIds.bravo);
        records[4] = _voteRecord(ts, userCharlie, "charlie777", "Aura", "Remember", 350, deadline, votingIds.charlie);

        recordNonces = new uint256[](5);
        recordNonces[0] = 11;
        recordNonces[1] = 12;
        recordNonces[2] = 21;
        recordNonces[3] = 22;
        recordNonces[4] = 31;

        userBatchSigs = new MainVoting.UserBatchSig[](3);
        uint256[] memory alphaIdx = _buildIndices(0, 1);
        uint256[] memory bravoIdx = _buildIndices(2, 3);
        uint256[] memory charlieIdx = _buildIndices(4);

        userBatchSigs[0] =
            _buildUserBatchSig(userAlpha, USER_ALPHA_KEY, nonces.alphaFirst, alphaIdx, records, recordNonces);
        userBatchSigs[1] = _buildUserBatchSig(userBravo, USER_BRAVO_KEY, nonces.bravo, bravoIdx, records, recordNonces);
        userBatchSigs[2] =
            _buildUserBatchSig(userCharlie, USER_CHARLIE_KEY, nonces.charlie, charlieIdx, records, recordNonces);

        batchNonce = nonces.batchBase;
        executorSig = _buildExecutorSig(executorKey, records, recordNonces, batchNonce);
    }

    function _buildScenarioSameUserExtra(
        uint256 executorKey,
        ScenarioVotingIds memory votingIds,
        ScenarioNonces memory nonces
    )
        internal
        view
        returns (
            MainVoting.VoteRecord[] memory records,
            uint256[] memory recordNonces,
            MainVoting.UserBatchSig[] memory userBatchSigs,
            uint256 batchNonce,
            bytes memory executorSig
        )
    {
        uint256 ts = block.timestamp + 5 minutes;
        if (ts == 5 minutes) ts = 1736726400 + 5 minutes;
        uint256 deadline = ts + 14 days;

        address userAlpha = vm.addr(USER_ALPHA_KEY);
        console2.log("Scenario 2 user (same as Alpha):", userAlpha);

        records = new MainVoting.VoteRecord[](2);
        records[0] = _voteRecord(ts, userAlpha, "alpha001", "Nova", "Remember", 90, deadline, votingIds.alphaSecond);
        records[1] = _voteRecord(ts, userAlpha, "alpha001", "Lena", "Remember", 130, deadline, votingIds.alphaSecond);

        recordNonces = new uint256[](2);
        recordNonces[0] = 101;
        recordNonces[1] = 102;

        userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = _buildUserBatchSig(
            userAlpha, USER_ALPHA_KEY, nonces.alphaSecond, _buildIndices(0, 1), records, recordNonces
        );

        batchNonce = nonces.batchBase + 1;
        executorSig = _buildExecutorSig(executorKey, records, recordNonces, batchNonce);
    }

    function _buildScenarioAlphaFiveVotes(
        uint256 executorKey,
        ScenarioVotingIds memory votingIds,
        ScenarioNonces memory nonces
    )
        internal
        view
        returns (
            MainVoting.VoteRecord[] memory records,
            uint256[] memory recordNonces,
            MainVoting.UserBatchSig[] memory userBatchSigs,
            uint256 batchNonce,
            bytes memory executorSig
        )
    {
        uint256 ts = block.timestamp + 15 minutes;
        if (ts == 15 minutes) ts = 1736726400 + 15 minutes;
        uint256 deadline = ts + 14 days;

        address userAlpha = vm.addr(USER_ALPHA_KEY);
        console2.log("Scenario 3 user (Alpha, 5 votes):", userAlpha);

        records = new MainVoting.VoteRecord[](5);
        records[0] = _voteRecord(ts, userAlpha, "alpha001", "Nova", "Remember", 50, deadline, votingIds.alphaFive);
        records[1] = _voteRecord(ts, userAlpha, "alpha001", "Eden", "Remember", 70, deadline, votingIds.alphaFive);
        records[2] = _voteRecord(ts, userAlpha, "alpha001", "Lena", "Remember", 90, deadline, votingIds.alphaFive);
        records[3] = _voteRecord(ts, userAlpha, "alpha001", "Haru", "Remember", 110, deadline, votingIds.alphaFive);
        records[4] = _voteRecord(ts, userAlpha, "alpha001", "Milo", "Forget", 40, deadline, votingIds.alphaFive);

        recordNonces = new uint256[](5);
        recordNonces[0] = 301;
        recordNonces[1] = 302;
        recordNonces[2] = 303;
        recordNonces[3] = 304;
        recordNonces[4] = 305;

        uint256[] memory alphaIdx = new uint256[](5);
        for (uint256 i; i < 5;) {
            alphaIdx[i] = i;
            unchecked {
                ++i;
            }
        }

        userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] =
            _buildUserBatchSig(userAlpha, USER_ALPHA_KEY, nonces.alphaFive, alphaIdx, records, recordNonces);

        batchNonce = nonces.batchBase + 2;
        executorSig = _buildExecutorSig(executorKey, records, recordNonces, batchNonce);
    }

    function _voteRecord(
        uint256 ts,
        address user,
        string memory userId,
        string memory votingFor,
        string memory votedOn,
        uint256 amount,
        uint256 deadline,
        uint256 votingId
    ) internal pure returns (MainVoting.VoteRecord memory) {
        return MainVoting.VoteRecord({
            timestamp: ts,
            missionId: MISSION_ID,
            votingId: votingId,
            userAddress: user,
            userId: userId,
            votingFor: votingFor,
            votedOn: votedOn,
            votingAmt: amount,
            deadline: deadline
        });
    }

    function _buildIndices(uint256 a) internal pure returns (uint256[] memory indices) {
        indices = new uint256[](1);
        indices[0] = a;
    }

    function _buildIndices(uint256 a, uint256 b) internal pure returns (uint256[] memory indices) {
        indices = new uint256[](2);
        indices[0] = a;
        indices[1] = b;
    }

    function _buildUserBatchSig(
        address user,
        uint256 userKey,
        uint256 userNonce,
        uint256[] memory indices,
        MainVoting.VoteRecord[] memory records,
        uint256[] memory recordNonces
    ) internal view returns (MainVoting.UserBatchSig memory sigStruct) {
        MainVoting.VoteRecord[] memory subset = new MainVoting.VoteRecord[](indices.length);
        uint256[] memory subsetNonces = new uint256[](indices.length);

        for (uint256 i; i < indices.length;) {
            uint256 idx = indices[i];
            subset[i] = records[idx];
            subsetNonces[i] = recordNonces[idx];
            unchecked {
                ++i;
            }
        }

        bytes32 digest = VOTING.hashUserBatchPreview(user, userNonce, subset, subsetNonces);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userKey, digest);

        sigStruct = MainVoting.UserBatchSig({
            user: user,
            userNonce: userNonce,
            recordIndices: indices,
            signature: abi.encodePacked(r, s, v)
        });
    }

    function _buildExecutorSig(
        uint256 executorKey,
        MainVoting.VoteRecord[] memory records,
        uint256[] memory recordNonces,
        uint256 batchNonce
    ) internal view returns (bytes memory signature) {
        bytes32 digest = VOTING.hashBatchPreview(records, recordNonces, batchNonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(executorKey, digest);
        signature = abi.encodePacked(r, s, v);
    }

    function _generateSeed() internal view returns (uint256) {
        return uint256(keccak256(abi.encode(block.timestamp, block.prevrandao, address(VOTING), tx.origin)));
    }

    function _generateScenarioVotingIds(uint256 seed) internal pure returns (ScenarioVotingIds memory ids) {
        ids.alphaFirst = _normalizeVotingId(seed);
        ids.bravo = _normalizeVotingId(seed + 0x1337);
        ids.charlie = _normalizeVotingId(seed + 0x2222);
        ids.alphaSecond = _normalizeVotingId(seed + 0x3333);
        ids.alphaFive = _normalizeVotingId(seed + 0x4444);
    }

    function _generateScenarioNonces(uint256 seed) internal pure returns (ScenarioNonces memory nonces) {
        nonces.batchBase = _normalizeNonce(seed + 0xAAAA);
        nonces.alphaFirst = _normalizeNonce(seed + 0xBBBB);
        nonces.alphaSecond = _normalizeNonce(seed + 0xCCCC);
        nonces.alphaFive = _normalizeNonce(seed + 0xDDDD);
        nonces.bravo = _normalizeNonce(seed + 0xEEEE);
        nonces.charlie = _normalizeNonce(seed + 0xFFFF);
    }

    function _normalizeVotingId(uint256 raw) private pure returns (uint256) {
        return (raw % 1_000_000_000) + 1;
    }

    function _normalizeNonce(uint256 raw) private pure returns (uint256) {
        return (raw % 1_000_000_000_000) + 1000;
    }

    function _logVotingSetup(ScenarioVotingIds memory ids, ScenarioNonces memory nonces) internal view {
        console2.log("Voting IDs for mission:", MISSION_ID);
        console2.log(" - Alpha (session 1):", ids.alphaFirst, " / userNonce:", nonces.alphaFirst);
        console2.log(" - Bravo:", ids.bravo, " / userNonce:", nonces.bravo);
        console2.log(" - Charlie:", ids.charlie, " / userNonce:", nonces.charlie);
        console2.log(" - Alpha (session 2):", ids.alphaSecond, " / userNonce:", nonces.alphaSecond);
        console2.log(" - Alpha (5 votes batch):", ids.alphaFive, " / userNonce:", nonces.alphaFive);
        console2.log("Batch nonce base:", nonces.batchBase);
    }
}
