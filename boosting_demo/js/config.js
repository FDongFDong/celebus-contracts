/**
 * Boosting Demo Configuration
 * 컨트랙트 주소, ABI, 기본값 등을 관리합니다
 */

export const CONFIG = {
  // Network Configuration
  CHAIN_ID: 5611,
  CHAIN_NAME: 'opBNB Testnet',
  RPC_URL: 'https://opbnb-testnet-rpc.bnbchain.org',

  // Contract Configuration
  VOTING_ADDRESS: '0xFA6e0320bd5110c8e7AfA38f6762DC20b83ef347', // 배포된 Boosting 컨트랙트 주소

  // Contract ABI
  ABI: [
    'function submitBoostBatch(tuple(uint256 timestamp, uint256 missionId, uint256 boostingId, address userAddress, string userId, uint256 artistId, uint8 boostingWith, uint256 amt)[] records, tuple(address user, uint256 userNonce, bytes signature)[] userSigs, uint256 batchNonce, bytes executorSig)',
    'function getArtistTotalAmt(uint256 missionId, uint256 artistId) view returns (uint256)',
    'function minUserNonce(address) view returns (uint256)',
    'function minBatchNonce(address) view returns (uint256)',
    'function setExecutorSigner(address _executorSigner)',
    'function setBoostingTypeName(uint8 typeId, string memory name)',
    'function setArtist(uint256 missionId, uint256 artistId, string memory name, bool allowed)'
  ],

  // EIP-712 Domain Configuration
  DOMAIN: {
    name: 'Boosting',
    version: '1',
    chainId: 5611,
    verifyingContract: '0xFA6e0320bd5110c8e7AfA38f6762DC20b83ef347'
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

    // Boost Record Defaults
    missionId: 1,
    boostingId: 1,
    artistId: 1,
    boostingWith: 0, // 0=CELB, 1=BP
    amt: 100
  },

  // Limits
  MAX_RECORDS_PER_BATCH: 20,
  MAX_RECORDS_PER_USER: 1, // 1배치에 1유저당 1개 레코드만 허용

  // UI Messages
  MESSAGES: {
    userIdNote: '⚠️ 실제 환경에서는 백엔드가 지갑 주소로 DB에서 userId를 조회하여 자동 설정합니다',
    signatureExplanation: 'EIP-712 구조화된 데이터 서명을 사용합니다',
    backendNote: '💡 백엔드는 모든 사용자의 서명을 수집한 후 배치로 컨트랙트에 제출합니다',
    artistNote: '🎨 Artist ID는 부스팅 대상 아티스트를 지정합니다',
    boostingWithNote: '💖 Boosting With는 부스팅 타입 (CELB, BP 등)을 지정합니다'
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
