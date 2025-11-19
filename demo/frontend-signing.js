/**
 * MainVoting 프론트엔드 서명 예제 (브라우저용)
 *
 * 이 파일은 프론트엔드에서 사용자가 투표 레코드에 서명하는 방법을 보여줍니다.
 *
 * 필요: ethers.js v6 (CDN 또는 번들러)
 * <script src="https://cdn.ethers.io/lib/ethers-6.7.0.umd.min.js"></script>
 */

// ============================================
// 설정
// ============================================

const CONFIG = {
  contractAddress: '0xc18a062C1AF323A1E3d57520661fF3f5baCCcf5e',
  rpcUrl: 'https://opbnb-testnet.infura.io/v3/ff3d0a25dafc4bfda7cb700771d89273',
  chainId: 5611
};

// EIP-712 도메인
const DOMAIN = {
  name: 'MainVoting',
  version: '1',
  chainId: CONFIG.chainId,
  verifyingContract: CONFIG.contractAddress
};

// VoteRecord 타입 정의
const VOTE_RECORD_TYPES = {
  VoteRecord: [
    { name: 'timestamp', type: 'uint256' },
    { name: 'missionId', type: 'uint256' },
    { name: 'votingId', type: 'uint256' },
    { name: 'userAddress', type: 'address' },
    { name: 'userIdHash', type: 'bytes32' },  // 주의: userId가 아닌 userIdHash
    { name: 'candidateId', type: 'uint256' },
    { name: 'voteType', type: 'uint8' },
    { name: 'votingAmt', type: 'uint256' }
  ]
};

// UserBatch 타입 정의
const USER_BATCH_TYPES = {
  UserBatch: [
    { name: 'user', type: 'address' },
    { name: 'userNonce', type: 'uint256' },
    { name: 'recordsHash', type: 'bytes32' }
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
      'VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,bytes32 userIdHash,uint256 candidateId,uint8 voteType,uint256 votingAmt)'
    )
  );

  // userId를 해시로 변환 (중요!)
  const userIdHash = ethers.keccak256(ethers.toUtf8Bytes(record.userId));

  const structHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'uint256', 'uint256', 'uint256', 'address', 'bytes32', 'uint256', 'uint8', 'uint256'],
      [
        VOTE_RECORD_TYPEHASH,
        record.timestamp,
        record.missionId,
        record.votingId,
        record.userAddress,
        userIdHash,  // userId가 아닌 해시 사용
        record.candidateId,
        record.voteType,
        record.votingAmt
      ]
    )
  );

  return structHash;
}

/**
 * 여러 레코드의 packed 해시 계산
 *
 * @param {string[]} recordHashes - 레코드 해시 배열
 * @returns {string} - packed 해시
 */
function hashRecordsPacked(recordHashes) {
  return ethers.keccak256(ethers.concat(recordHashes));
}

// ============================================
// 사용자 서명 생성 함수
// ============================================

/**
 * 사용자가 투표 레코드 배치에 서명
 *
 * @param {Object} wallet - ethers.Wallet 또는 Signer
 * @param {Array} records - 투표 레코드 배열 (최대 20개)
 * @param {number} userNonce - 사용자 nonce
 * @returns {Promise<Object>} - UserBatchSig 객체
 */
async function signUserBatch(wallet, records, userNonce) {
  // 1. 각 레코드의 해시 계산
  const recordHashes = records.map(record => hashVoteRecord(record));

  // 2. recordsHash 계산 (packed)
  const recordsHash = hashRecordsPacked(recordHashes);

  // 3. UserBatch 서명 데이터
  const userBatchData = {
    user: wallet.address,
    userNonce: userNonce,
    recordsHash: recordsHash
  };

  // 4. EIP-712 서명 생성
  const signature = await wallet.signTypedData(
    DOMAIN,
    USER_BATCH_TYPES,
    userBatchData
  );

  // 5. UserBatchSig 구조체 반환
  const recordIndices = Array.from({ length: records.length }, (_, i) => i);

  return {
    user: wallet.address,
    userNonce: userNonce,
    recordIndices: recordIndices,
    signature: signature
  };
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
 * 컨트랙트에 투표 제출
 *
 * @param {Object} signer - ethers Signer
 * @param {Array} records - 투표 레코드 배열
 * @param {Array} userBatchSigs - UserBatchSig 배열
 * @param {number} batchNonce - 배치 nonce
 * @param {string} executorSig - Executor 서명
 * @returns {Promise<Object>} - 트랜잭션 영수증
 */
async function submitVotes(signer, records, userBatchSigs, batchNonce, executorSig) {
  const ABI = [
    'function submitMultiUserBatch(tuple(uint256 timestamp, uint256 missionId, uint256 votingId, address userAddress, uint256 candidateId, uint8 voteType, string userId, uint256 votingAmt)[] records, tuple(address user, uint256 userNonce, uint256[] recordIndices, bytes signature)[] userBatchSigs, uint256 batchNonce, bytes executorSig)'
  ];

  const contract = new ethers.Contract(CONFIG.contractAddress, ABI, signer);

  const tx = await contract.submitMultiUserBatch(
    records,
    userBatchSigs,
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
  console.log('\n=== MainVoting 프론트엔드 서명 예제 ===\n');

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
      candidateId: 1,
      voteType: 1, // Remember
      userId: 'user123',
      votingAmt: 100
    },
    {
      timestamp: Math.floor(Date.now() / 1000),
      missionId: 1,
      votingId: 1,
      userAddress: userWallet.address,
      candidateId: 2,
      voteType: 0, // Forget
      userId: 'user123',
      votingAmt: 50
    }
  ];

  console.log('\nRecords:', records.length);

  // 3. 사용자 nonce 조회
  const userNonce = await getUserNonce(userWallet.address);
  console.log('\nUser Nonce:', userNonce);

  // 4. 사용자 서명 생성
  const userBatchSig = await signUserBatch(userWallet, records, userNonce);
  console.log('\nUser Signature:', userBatchSig.signature);

  // 5. 백엔드에 요청하여 Executor 서명 받기
  console.log('\n→ 백엔드 API 호출 필요');
  console.log('POST /api/vote/submit');
  console.log('Body:', { records, userBatchSigs: [userBatchSig] });

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
  //   [userBatchSig],
  //   backendResponse.batchNonce,
  //   backendResponse.executorSignature
  // );

  console.log('\n=== 완료 ===\n');
}

// ============================================
// MetaMask 연동 예제
// ============================================

async function exampleWithMetaMask() {
  if (typeof window.ethereum === 'undefined') {
    alert('MetaMask를 설치해주세요!');
    return;
  }

  // 1. MetaMask 연결
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  console.log('Connected:', userAddress);

  // 2. 네트워크 확인
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== CONFIG.chainId) {
    alert('opBNB Testnet으로 전환해주세요!');
    return;
  }

  // 3. 투표 레코드 작성 (UI에서 입력받기)
  const records = [
    {
      timestamp: Math.floor(Date.now() / 1000),
      missionId: 1,
      votingId: 1,
      userAddress: userAddress,
      candidateId: 1,
      voteType: 1,
      userId: 'user123',
      votingAmt: 100
    }
  ];

  // 4. 사용자 nonce 조회
  const userNonce = await getUserNonce(userAddress);

  // 5. 서명 요청
  const userBatchSig = await signUserBatch(signer, records, userNonce);

  // 6. 백엔드 API 호출
  const response = await fetch('/api/vote/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      records,
      userBatchSigs: [userBatchSig]
    })
  });

  const { batchNonce, executorSignature } = await response.json();

  // 7. 컨트랙트 제출
  const receipt = await submitVotes(
    signer,
    records,
    [userBatchSig],
    batchNonce,
    executorSignature
  );

  alert('투표 완료! TX: ' + receipt.hash);
}

// ============================================
// Export
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    hashVoteRecord,
    hashRecordsPacked,
    signUserBatch,
    getUserNonce,
    submitVotes,
    CONFIG,
    DOMAIN,
    VOTE_RECORD_TYPES,
    USER_BATCH_TYPES
  };
}
