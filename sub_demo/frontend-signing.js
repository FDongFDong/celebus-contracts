/**
 * SubVoting 프론트엔드 서명 예제 (브라우저용)
 *
 * 이 파일은 프론트엔드에서 사용자가 투표 레코드에 서명하는 방법을 보여줍니다.
 *
 * 필요: ethers.js v6 (CDN 또는 번들러)
 * <script src="https://cdn.ethers.io/lib/ethers-6.7.0.umd.min.js"></script>
 */

// ============================================
// 설정 (기본값)
// ============================================

const DEFAULT_CONFIG = {
  contractAddress: '0x7d85B015F728641743Bd7845b0fCDC61b6234ac8',
  rpcUrl: 'https://opbnb-testnet-rpc.bnbchain.org',
  chainId: 5611
};

// 설정 초기화 함수 (주소 커스터마이징 가능)
let CONFIG = { ...DEFAULT_CONFIG };

function initConfig(contractAddress) {
  CONFIG.contractAddress = contractAddress || DEFAULT_CONFIG.contractAddress;
}

// EIP-712 도메인 (동적 생성)
function getDomain() {
  return {
    name: 'SubVoting',
    version: '1',
    chainId: CONFIG.chainId,
    verifyingContract: CONFIG.contractAddress
  };
}

// VoteRecord 타입 정의
const VOTE_RECORD_TYPES = {
  VoteRecord: [
    { name: 'timestamp', type: 'uint256' },
    { name: 'missionId', type: 'uint256' },
    { name: 'votingId', type: 'uint256' },
    { name: 'userAddress', type: 'address' },
    { name: 'userIdHash', type: 'bytes32' },  // 주의: userId가 아닌 userIdHash
    { name: 'questionId', type: 'uint256' },  // SubVoting: questionId
    { name: 'answerId', type: 'uint256' },    // SubVoting: answerId (1~10)
    { name: 'votingAmt', type: 'uint256' }
  ]
};

// UserSig 타입 정의 (SubVoting은 1:1 서명 방식)
const USER_SIG_TYPES = {
  UserSig: [
    { name: 'user', type: 'address' },
    { name: 'userNonce', type: 'uint256' },
    { name: 'recordHash', type: 'bytes32' }
  ]
};

// ============================================
// 레코드 해시 계산 함수
// ============================================

/**
 * VoteRecord 해시 계산
 *
 * @param {Object} record - 투표 레코드
 * @returns {string} - 레코드 해시
 */
function hashVoteRecord(record) {
  const VOTE_RECORD_TYPEHASH = ethers.keccak256(
    ethers.toUtf8Bytes(
      'VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,bytes32 userIdHash,uint256 questionId,uint256 answerId,uint256 votingAmt)'
    )
  );

  // userId를 해시로 변환 (중요!)
  const userIdHash = ethers.keccak256(ethers.toUtf8Bytes(record.userId));

  const structHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'uint256', 'uint256', 'uint256', 'address', 'bytes32', 'uint256', 'uint256', 'uint256'],
      [
        VOTE_RECORD_TYPEHASH,
        record.timestamp,
        record.missionId,
        record.votingId,
        record.userAddress,
        userIdHash,  // userId가 아닌 해시 사용
        record.questionId,
        record.answerId,
        record.votingAmt
      ]
    )
  );

  return structHash;
}

// ============================================
// 사용자 서명 생성 함수 (SubVoting: 1:1 방식)
// ============================================

/**
 * 사용자가 개별 투표 레코드에 서명 (SubVoting 방식)
 *
 * @param {Object} wallet - ethers.Wallet 또는 Signer
 * @param {Object} record - 단일 투표 레코드
 * @param {number} userNonce - 사용자 nonce
 * @param {number} recordIndex - 배치 내 레코드 인덱스
 * @returns {Promise<Object>} - UserSig 객체
 */
async function signUserRecord(wallet, record, userNonce, recordIndex) {
  // 1. 레코드 해시 계산
  const recordHash = hashVoteRecord(record);

  // 2. UserSig 서명 데이터
  const userSigData = {
    user: wallet.address,
    userNonce: userNonce,
    recordHash: recordHash
  };

  // 3. EIP-712 서명 생성
  const signature = await wallet.signTypedData(
    getDomain(),
    USER_SIG_TYPES,
    userSigData
  );

  // 4. UserSig 구조체 반환
  return {
    user: wallet.address,
    userNonce: userNonce,
    recordIndex: recordIndex,
    signature: signature
  };
}

/**
 * 여러 레코드에 대한 사용자 서명 배치 생성
 *
 * @param {Object} wallet - ethers.Wallet 또는 Signer
 * @param {Array} records - 투표 레코드 배열
 * @param {number} startUserNonce - 시작 사용자 nonce
 * @returns {Promise<Array>} - UserSig 배열
 */
async function signMultipleRecords(wallet, records, startUserNonce) {
  const userSigs = [];

  for (let i = 0; i < records.length; i++) {
    const userSig = await signUserRecord(
      wallet,
      records[i],
      startUserNonce + i,
      i
    );
    userSigs.push(userSig);
  }

  return userSigs;
}

// ============================================
// 컨트랙트 호출 함수
// ============================================

/**
 * 사용자 nonce 조회
 *
 * @param {string} userAddress - 사용자 주소
 * @returns {Promise<number>} - 현재 minUserNonce
 */
async function getUserNonce(userAddress) {
  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const ABI = [
    'function minUserNonce(address) view returns (uint256)'
  ];
  const contract = new ethers.Contract(CONFIG.contractAddress, ABI, provider);
  const nonce = await contract.minUserNonce(userAddress);
  return Number(nonce);
}

/**
 * 질문별 집계 결과 조회
 *
 * @param {number} missionId - 미션 ID
 * @param {number} questionId - 질문 ID
 * @returns {Promise<Object>} - { answerVotes: uint256[11], total: uint256 }
 */
async function getQuestionAggregates(missionId, questionId) {
  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const ABI = [
    'function getQuestionAggregates(uint256 missionId, uint256 questionId) view returns (uint256[11] answerVotes, uint256 total)'
  ];
  const contract = new ethers.Contract(CONFIG.contractAddress, ABI, provider);
  const result = await contract.getQuestionAggregates(missionId, questionId);

  return {
    answerVotes: result.answerVotes.map(v => v.toString()),
    total: result.total.toString()
  };
}

/**
 * 컨트랙트에 투표 제출
 *
 * @param {Object} signer - ethers Signer
 * @param {Array} records - 투표 레코드 배열
 * @param {Array} userSigs - UserSig 배열
 * @param {number} batchNonce - 배치 nonce
 * @param {string} executorSig - Executor 서명
 * @returns {Promise<Object>} - 트랜잭션 영수증
 */
async function submitVotes(signer, records, userSigs, batchNonce, executorSig) {
  const ABI = [
    'function submitMultiUserBatch(tuple(uint256 timestamp, uint256 missionId, uint256 votingId, address userAddress, string userId, uint256 questionId, uint256 answerId, uint256 votingAmt)[] records, tuple(address user, uint256 userNonce, uint256 recordIndex, bytes signature)[] userSigs, uint256 batchNonce, bytes executorSig)'
  ];

  const contract = new ethers.Contract(CONFIG.contractAddress, ABI, signer);

  const tx = await contract.submitMultiUserBatch(
    records,
    userSigs,
    batchNonce,
    executorSig
  );

  console.log('Transaction sent:', tx.hash);

  const receipt = await tx.wait();
  console.log('Transaction confirmed:', receipt.hash);

  return receipt;
}

// ============================================
// 전체 플로우 예제
// ============================================

async function exampleFlow() {
  console.log('\n=== SubVoting 프론트엔드 서명 예제 ===\n');

  // 1. 사용자 Wallet 생성 (테스트용 - 실제로는 MetaMask 등 사용)
  const userPrivateKey = '0x' + '1'.repeat(64); // 테스트용 키
  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const userWallet = new ethers.Wallet(userPrivateKey, provider);

  console.log('User Address:', userWallet.address);

  // 2. 투표 레코드 작성
  const records = [
    {
      timestamp: Math.floor(Date.now() / 1000),
      missionId: 1,
      votingId: 1,
      userAddress: userWallet.address,
      questionId: 1,   // 질문 ID
      answerId: 1,     // 답변 ID (1~10)
      userId: 'user123',
      votingAmt: 100
    },
    {
      timestamp: Math.floor(Date.now() / 1000),
      missionId: 1,
      votingId: 1,
      userAddress: userWallet.address,
      questionId: 1,
      answerId: 2,
      userId: 'user123',
      votingAmt: 50
    }
  ];

  console.log('\nRecords:', records.length);

  // 3. 사용자 nonce 조회
  const userNonce = await getUserNonce(userWallet.address);
  console.log('\nUser Nonce:', userNonce);

  // 4. 사용자 서명 생성 (각 레코드마다)
  const userSigs = await signMultipleRecords(userWallet, records, userNonce);
  console.log('\nUser Signatures:', userSigs.length);

  // 5. 백엔드에 요청하여 Executor 서명 받기
  console.log('\n→ 백엔드 API 호출 필요');
  console.log('POST /api/vote/submit');
  console.log('Body:', { records, userSigs });

  // 6. 백엔드로부터 받은 응답 (예시)
  const backendResponse = {
    batchNonce: 0,
    executorSignature: '0x...' // 백엔드가 생성한 서명
  };

  console.log('\n← 백엔드 응답');
  console.log(backendResponse);

  // 7. 컨트랙트 호출 (옵션 A: 프론트엔드에서 직접)
  // const receipt = await submitVotes(
  //   userWallet,
  //   records,
  //   userSigs,
  //   backendResponse.batchNonce,
  //   backendResponse.executorSignature
  // );

  console.log('\n=== 완료 ===\n');
}

// ============================================
// Export
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initConfig,
    hashVoteRecord,
    signUserRecord,
    signMultipleRecords,
    getUserNonce,
    getQuestionAggregates,
    submitVotes,
    CONFIG,
    getDomain,
    VOTE_RECORD_TYPES,
    USER_SIG_TYPES
  };
}
