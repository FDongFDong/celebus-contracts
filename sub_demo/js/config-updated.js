/**
 * SubVoting Demo Configuration
 * 최신 SubVoting.sol 컨트랙트 기준
 */

// ABI는 별도 파일에서 import
import SubVotingABI from '../SubVoting-abi.json' assert { type: 'json' };

export const CONFIG = {
  // Network Configuration
  CHAIN_ID: 5611,
  CHAIN_NAME: 'opBNB Testnet',
  RPC_URL: 'https://opbnb-testnet-rpc.bnbchain.org',

  // Contract Configuration
  VOTING_ADDRESS: 'NEW_CONTRACT_ADDRESS', // 새로 배포된 SubVoting 컨트랙트 주소

  // Contract ABI (최신 SubVoting.sol 기준)
  ABI: SubVotingABI,

  // EIP-712 Domain (SubVoting)
  DOMAIN: {
    name: 'SubVoting',
    version: '1'
  },

  // TypeHash 정의
  TYPE_HASH: {
    VOTE_RECORD: 'VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 questionId,uint256 optionId,uint256 votingAmt,address user)',
    USER_BATCH: 'UserBatch(address user,uint256 userNonce,bytes32 recordsHash)',
    BATCH: 'Batch(uint256 batchNonce)'
  },

  // Default Values
  DEFAULT_VALUES: {
    missionId: 1,
    questionId: 1,
    optionId: 1,
    votingAmt: 100,
    user1Id: '사용자A',
    user2Id: '사용자B'
  },

  // Contract Limits
  LIMITS: {
    MAX_RECORDS_PER_BATCH: 2000,
    MAX_RECORDS_PER_USER_BATCH: 20,
    MAX_STRING_LENGTH: 100,
    MAX_OPTION_ID: 10
  }
};

/**
 * Get contract instance
 */
export function getContractInstance(signerOrProvider, address) {
  return new ethers.Contract(address, CONFIG.ABI, signerOrProvider);
}

/**
 * Contract function selectors
 */
export const SELECTORS = {
  submitMultiUserBatch: '0x...', // submitMultiUserBatch(UserVoteBatch[],uint256,bytes)
  setQuestion: '0x...',
  setOption: '0x...',
  domainSeparator: '0x...'
};
