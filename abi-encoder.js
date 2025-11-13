// ABI Encoder for MainVoting v3.0.0
// Contract Address: 0x10Fb9C7BFec7d2059b65c9e70B4F58E2E6fd0eFE
// Network: opBNB Testnet (Chain ID: 5611)

const { ethers } = require("ethers");

// opBNB Testnet RPC
const RPC_URL = "https://opbnb-testnet-rpc.bnbchain.org";
const CONTRACT_ADDRESS = "0x10Fb9C7BFec7d2059b65c9e70B4F58E2E6fd0eFE";

// MainVoting ABI (필요한 함수만)
const ABI = [
  // View Functions
  "function executorSigner() view returns (address)",
  "function owner() view returns (address)",
  "function CHAIN_ID() view returns (uint256)",
  "function getVotesByUserVotingId(address user, uint256 missionId, uint256 votingId) view returns (tuple(uint256 timestamp, uint256 missionId, uint256 votingId, address userAddress, string userId, string votingFor, string votedOn, uint256 votingAmt, uint256 deadline)[])",
  "function getVoteSummariesByMissionVotingId(uint256 missionId, uint256 votingId) view returns (tuple(uint256 timestamp, uint256 missionId, uint256 votingId, string userId, string votingFor, string votedOn, uint256 votingAmt)[])",
  "function getUserVotingStat(address user, uint256 missionId, uint256 votingId) view returns (bool hasVoted, uint256 totalAmt, uint256 count)",
  "function getVoteCountByVotingId(uint256 missionId, uint256 votingId) view returns (uint256)",
  "function getUserVoteHashes(address user, uint256 missionId, uint256 votingId, uint256 offset, uint256 limit) view returns (bytes32[])",
  "function getVoteByHash(bytes32 voteHash) view returns (tuple(uint256 timestamp, uint256 missionId, uint256 votingId, address userAddress, string userId, string votingFor, string votedOn, uint256 votingAmt, uint256 deadline))",
];

// Provider 및 Contract 인스턴스 생성
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

// ============================================
// 예제 함수들
// ============================================

/**
 * 특정 사용자의 votingId로 모든 투표 조회
 * @param {string} userAddress - 사용자 주소
 * @param {number} missionId - 미션 ID
 * @param {number} votingId - 투표 ID
 */
async function getVotesByUserVotingId(userAddress, missionId, votingId) {
  try {
    console.log(`\n=== 투표 조회 ===`);
    console.log(`사용자: ${userAddress}`);
    console.log(`미션 ID: ${missionId}`);
    console.log(`투표 ID: ${votingId}`);

    const votes = await contract.getVotesByUserVotingId(
      userAddress,
      missionId,
      votingId
    );

    console.log(`\n조회된 투표 수: ${votes.length}`);

    votes.forEach((vote, index) => {
      console.log(`\n투표 ${index + 1}:`);
      console.log(`  - 사용자 ID: ${vote.userId}`);
      console.log(`  - 투표 대상: ${vote.votingFor}`);
      console.log(`  - 선택 항목: ${vote.votedOn}`);
      console.log(`  - 투표 포인트: ${vote.votingAmt}`);
      console.log(`  - 타임스탬프: ${vote.timestamp}`);
    });

    return votes;
  } catch (error) {
    console.error("에러:", error.message);
    throw error;
  }
}

/**
 * 사용자의 투표 통계 조회
 * @param {string} userAddress - 사용자 주소
 * @param {number} missionId - 미션 ID
 * @param {number} votingId - 투표 ID
 */
async function getUserVotingStat(userAddress, missionId, votingId) {
  try {
    const stat = await contract.getUserVotingStat(
      userAddress,
      missionId,
      votingId
    );

    console.log(`\n=== 투표 통계 ===`);
    console.log(`투표 여부: ${stat.hasVoted}`);
    console.log(`총 포인트: ${stat.totalAmt}`);
    console.log(`투표 건수: ${stat.count}`);

    return stat;
  } catch (error) {
    console.error("에러:", error.message);
    throw error;
  }
}

/**
 * votingId별 총 투표 수 조회
 * @param {number} missionId - 미션 ID
 * @param {number} votingId - 투표 ID
 */
async function getVoteCountByVotingId(missionId, votingId) {
  try {
    const count = await contract.getVoteCountByVotingId(missionId, votingId);
    console.log(`\n=== 투표 수 ===`);
    console.log(`미션 ${missionId}, 투표 ${votingId}: ${count}건`);
    return count;
  } catch (error) {
    console.error("에러:", error.message);
    throw error;
  }
}

/**
 * Executor Signer 주소 조회
 */
async function getExecutorSigner() {
  try {
    const signer = await contract.executorSigner();
    console.log(`\nExecutor Signer: ${signer}`);
    return signer;
  } catch (error) {
    console.error("에러:", error.message);
    throw error;
  }
}

/**
 * Owner 주소 조회
 */
async function getOwner() {
  try {
    const owner = await contract.owner();
    console.log(`\nOwner: ${owner}`);
    return owner;
  } catch (error) {
    console.error("에러:", error.message);
    throw error;
  }
}

// ============================================
// 메인 실행 예시
// ============================================
async function main() {
  console.log("==============================================");
  console.log("MainVoting v3.0.0 ABI Encoder");
  console.log("==============================================");
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Network: opBNB Testnet`);
  console.log("==============================================\n");

  // 기본 정보 조회
  await getOwner();
  await getExecutorSigner();

  // 예시: 특정 사용자의 투표 조회
  // const userAddress = "0xYourUserAddress";
  // const missionId = 1;
  // const votingId = 1;
  // await getVotesByUserVotingId(userAddress, missionId, votingId);
  // await getUserVotingStat(userAddress, missionId, votingId);
  // await getVoteCountByVotingId(missionId, votingId);
}

// 스크립트 실행
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

// Export functions for use in other modules
module.exports = {
  contract,
  getVotesByUserVotingId,
  getUserVotingStat,
  getVoteCountByVotingId,
  getExecutorSigner,
  getOwner,
};
