/**
 * SubVoting Demo Configuration
 * 컨트랙트 주소, ABI, 기본값 등을 관리합니다
 */

export const CONFIG = {
  // Network Configuration
  CHAIN_ID: 5611,
  CHAIN_NAME: 'opBNB Testnet',
  RPC_URL: 'https://opbnb-testnet-rpc.bnbchain.org',

  // Contract Configuration
  VOTING_ADDRESS: '0x3779650F74676B9df554f7aE8A3584af9eB99E8b', // SubVoting 컨트랙트 주소 (새로 배포)

  // Contract ABI
  ABI: [
    'function submitMultiUserBatch(tuple(uint256 timestamp, uint256 missionId, uint256 votingId, address userAddress, string userId, uint256 questionId, uint256 optionId, uint256 votingAmt)[] records, tuple(address user, uint256 userNonce, bytes signature)[] userSigs, uint256 batchNonce, bytes executorSig)',
    'function getQuestionAggregates(uint256 missionId, uint256 questionId) view returns (uint256[11] optionVotes, uint256 total)',
    'function getOptionVotes(uint256 missionId, uint256 questionId, uint256 optionId) view returns (uint256)',
    'function minUserNonce(address) view returns (uint256)',
    'function minBatchNonce(address) view returns (uint256)',
    'function userNonceUsed(address, uint256) view returns (bool)',
    'function setExecutorSigner(address _executorSigner)',
    'function setQuestion(uint256 missionId, uint256 questionId, string memory text, bool allowed)',
    'function setOption(uint256 missionId, uint256 questionId, uint256 optionId, string memory text, bool allowed)'
  ],

  // EIP-712 Domain Configuration
  DOMAIN: {
    name: 'SubVoting',
    version: '1',
    chainId: 5611,
    verifyingContract: '0x3779650F74676B9df554f7aE8A3584af9eB99E8b'
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
    questionId: 1,  // MainVoting의 artistId 대신
    optionId: 1,    // MainVoting의 voteType 대신 (1~10)
    votingAmt: 100
  },

  // Limits
  MAX_RECORDS_PER_BATCH: 5000,
  MAX_OPTION_ID: 10, // 답변은 1~10만 허용

  // UI Messages
  MESSAGES: {
    userIdNote: '⚠️ 실제 환경에서는 백엔드가 지갑 주소로 DB에서 userId를 조회하여 자동 설정합니다',
    signatureExplanation: 'EIP-712 구조화된 데이터 서명을 사용합니다 (1레코드 = 1서명)',
    backendNote: '💡 백엔드는 개별 사용자 서명들을 수집한 후 배치로 컨트랙트에 제출합니다',
    singleVoteNote: '📝 SubVoting은 단일 투표 방식: 1개 질문 → 1개 답변 → 1개 서명'
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
