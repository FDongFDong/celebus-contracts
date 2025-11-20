/**
 * MainVoting Demo Configuration
 * 컨트랙트 주소, ABI, 기본값 등을 관리합니다
 */

export const CONFIG = {
  // Network Configuration
  CHAIN_ID: 5611,
  CHAIN_NAME: 'opBNB Testnet',
  RPC_URL: 'https://opbnb-testnet-rpc.bnbchain.org',

  // Contract Configuration
  VOTING_ADDRESS: '0x509c27A029620Ac71F42653440892dcb73E13BEf', // 배포된 MainVoting 컨트랙트 주소

  // Contract ABI
  ABI: [
    'function submitMultiUserBatch(tuple(uint256 timestamp, uint256 missionId, uint256 votingId, address userAddress, uint256 candidateId, uint8 voteType, string userId, uint256 votingAmt)[][] records, tuple(address user, uint256 userNonce, bytes signature)[] userBatchSigs, uint256 batchNonce, bytes executorSig)',
    'function getCandidateAggregates(uint256 missionId, uint256 candidateId) view returns (uint256 remember, uint256 forget, uint256 total)',
    'function minUserNonce(address) view returns (uint256)',
    'function minBatchNonce(address) view returns (uint256)',
    'function setExecutorSigner(address _executorSigner)',
    'function setVoteTypeName(uint8 voteType, string memory name)',
    'function setCandidate(uint256 missionId, uint256 candidateId, string memory name, bool allowed)'
  ],

  // EIP-712 Domain Configuration
  DOMAIN: {
    name: 'MainVoting',
    version: '1',
    chainId: 5611,
    verifyingContract: '0x509c27A029620Ac71F42653440892dcb73E13BEf'
  },

  // Default Values for Testing
  DEFAULT_VALUES: {
    // User Private Keys (테스트용 - 각각 다른 비밀키 사용)
    user1PrivateKey: '0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef',
    user2PrivateKey: '0xb43112fd82593f95dea3ba1a25eed28a6a75d6763677a42560b5d7815fea7977',
    // Executor는 0x240eCdd1C5a7C30149D43987ce5A3Eb4e9E97897 (컨트랙트에 등록됨)
    executorPrivateKey: '0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef',

    // User IDs (데모용 - 실제로는 백엔드가 DB에서 조회)
    user1Id: '사용자A',
    user2Id: '사용자B',

    // Vote Record Defaults
    missionId: 1,
    votingId: 1,
    candidateId: 1,
    voteType: 1, // 1 = Remember, 0 = Forget
    votingAmt: 100
  },

  // Limits
  MAX_RECORDS_PER_BATCH: 20,
  MAX_RECORDS_PER_USER: 20,

  // UI Messages
  MESSAGES: {
    userIdNote: '⚠️ 실제 환경에서는 백엔드가 지갑 주소로 DB에서 userId를 조회하여 자동 설정합니다',
    signatureExplanation: 'EIP-712 구조화된 데이터 서명을 사용합니다',
    backendNote: '💡 백엔드는 모든 사용자의 서명을 수집한 후 배치로 컨트랙트에 제출합니다'
  }
};

// Utility function to get current contract instance
export function getContractInstance(signer, contractAddress) {
  const address = contractAddress || CONFIG.VOTING_ADDRESS;
  return new ethers.Contract(address, CONFIG.ABI, signer);
}

// Utility function to get domain for EIP-712
export function getDomain(contractAddress) {
  return {
    name: CONFIG.DOMAIN.name,
    version: CONFIG.DOMAIN.version,
    chainId: CONFIG.DOMAIN.chainId,
    verifyingContract: contractAddress || CONFIG.DOMAIN.verifyingContract
  };
}
