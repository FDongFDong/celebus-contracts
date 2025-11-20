/**
 * SubVoting 백엔드 서명 예제 (Node.js)
 *
 * 이 파일은 백엔드에서 Executor로서 배치를 서명하는 방법을 보여줍니다.
 *
 * 설치 필요: npm install ethers@6
 *
 * 사용법:
 * node backend-example.js [contractAddress] [executorPrivateKey]
 *
 * 예시:
 * node backend-example.js 0x7d85B015F728641743Bd7845b0fCDC61b6234ac8 0xb43112fd82593f95dea3ba1a25eed28a6a75d6763677a42560b5d7815fea7977
 */

const { ethers } = require('ethers');

// ============================================
// 명령행 인자 처리
// ============================================

const args = process.argv.slice(2);

// 기본값 설정
const DEFAULT_CONTRACT_ADDRESS = '0x7d85B015F728641743Bd7845b0fCDC61b6234ac8';
const DEFAULT_EXECUTOR_KEY = '0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef';

const contractAddress = args[0] || DEFAULT_CONTRACT_ADDRESS;
const executorPrivateKey = args[1] || DEFAULT_EXECUTOR_KEY;

// ============================================
// 설정
// ============================================

const CONFIG = {
  contractAddress: contractAddress,
  rpcUrl: 'https://opbnb-testnet-rpc.bnbchain.org',
  chainId: 5611,
  executorPrivateKey: executorPrivateKey
};

// EIP-712 도메인
const DOMAIN = {
  name: 'SubVoting',
  version: '1',
  chainId: CONFIG.chainId,
  verifyingContract: CONFIG.contractAddress
};

// Batch 타입 정의 (Executor 서명용)
const BATCH_TYPES = {
  Batch: [
    { name: 'batchNonce', type: 'uint256' }
  ]
};

// ============================================
// Provider 및 Wallet 설정
// ============================================

const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
const executorWallet = new ethers.Wallet(CONFIG.executorPrivateKey, provider);

console.log('=== SubVoting 백엔드 설정 ===');
console.log('Contract Address:', CONFIG.contractAddress);
console.log('Executor Address:', executorWallet.address);
console.log('Chain ID:', CONFIG.chainId);
console.log('RPC URL:', CONFIG.rpcUrl);
console.log('');

// ============================================
// 백엔드 배치 Nonce 관리
// ============================================

let currentBatchNonce = 0;

/**
 * 다음 배치 nonce 가져오기
 * 실제 환경에서는 DB 또는 Redis에 저장하여 관리
 */
function getNextBatchNonce() {
  return currentBatchNonce++;
}

/**
 * 배치 nonce 초기화 (서버 시작 시 컨트랙트에서 조회)
 */
async function initializeBatchNonce() {
  // 실제로는 컨트랙트의 minBatchNonce를 조회하여 설정
  // const contract = new ethers.Contract(CONFIG.contractAddress, ABI, provider);
  // const minNonce = await contract.minBatchNonce(executorWallet.address);
  // currentBatchNonce = Number(minNonce);

  currentBatchNonce = 0; // 테스트용
  console.log('Batch nonce initialized:', currentBatchNonce);
}

// ============================================
// Executor 서명 생성 함수
// ============================================

/**
 * 백엔드가 배치에 서명하는 함수
 *
 * @param {number} batchNonce - 배치 nonce
 * @returns {Promise<string>} - 서명 (0x... 형식)
 */
async function signBatch(batchNonce) {
  // EIP-712 서명 생성
  const signature = await executorWallet.signTypedData(
    DOMAIN,
    BATCH_TYPES,
    { batchNonce }
  );

  return signature;
}

/**
 * 배치 해시 미리보기 (디버깅용)
 *
 * @param {number} batchNonce - 배치 nonce
 * @returns {string} - 배치 해시
 */
function hashBatch(batchNonce) {
  const batchTypeHash = ethers.keccak256(
    ethers.toUtf8Bytes('Batch(uint256 batchNonce)')
  );

  const structHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'uint256'],
      [batchTypeHash, batchNonce]
    )
  );

  const domainSeparator = ethers.TypedDataEncoder.hashDomain(DOMAIN);

  const digest = ethers.keccak256(
    ethers.concat([
      '0x1901',
      domainSeparator,
      structHash
    ])
  );

  return digest;
}

// ============================================
// API 엔드포인트 예제
// ============================================

/**
 * POST /api/vote/submit
 *
 * 프론트엔드로부터 받은 데이터:
 * {
 *   records: VoteRecord[],
 *   userSigs: UserSig[]
 * }
 *
 * 응답:
 * {
 *   batchNonce: number,
 *   executorSignature: string,
 *   txHash?: string  // 직접 제출하는 경우
 * }
 */
async function handleVoteSubmit(req, res) {
  try {
    const { records, userSigs } = req.body;

    // 1. 데이터 검증
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Invalid records' });
    }

    if (!userSigs || !Array.isArray(userSigs)) {
      return res.status(400).json({ error: 'Invalid user signatures' });
    }

    // 2. 배치 nonce 생성
    const batchNonce = getNextBatchNonce();

    // 3. Executor 서명 생성
    const executorSignature = await signBatch(batchNonce);

    console.log('Batch signed:', {
      batchNonce,
      executorSignature,
      recordCount: records.length,
      userCount: userSigs.length
    });

    // 4-A. 백엔드가 직접 컨트랙트 호출하는 경우
    // const txHash = await submitToContract(records, userSigs, batchNonce, executorSignature);
    // return res.json({ batchNonce, executorSignature, txHash });

    // 4-B. 프론트엔드에서 호출하도록 서명만 반환하는 경우
    return res.json({ batchNonce, executorSignature });

  } catch (error) {
    console.error('Error in handleVoteSubmit:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * 백엔드가 직접 컨트랙트를 호출하는 경우
 */
async function submitToContract(records, userSigs, batchNonce, executorSignature) {
  const ABI = require('./SubVoting-abi.json'); // ABI 파일 필요
  const contract = new ethers.Contract(CONFIG.contractAddress, ABI, executorWallet);

  try {
    const tx = await contract.submitMultiUserBatch(
      records,
      userSigs,
      batchNonce,
      executorSignature
    );

    console.log('Transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.hash);

    return receipt.hash;
  } catch (error) {
    console.error('Contract call failed:', error);
    throw error;
  }
}

// ============================================
// 사용 예제
// ============================================

async function example() {
  console.log('\n=== SubVoting 백엔드 서명 예제 ===\n');

  // 1. Nonce 초기화
  await initializeBatchNonce();

  // 2. 배치 nonce 가져오기
  const batchNonce = getNextBatchNonce();
  console.log('\nBatch Nonce:', batchNonce);

  // 3. 서명 생성
  const signature = await signBatch(batchNonce);
  console.log('\nExecutor Signature:', signature);

  // 4. 해시 미리보기 (디버깅)
  const hash = hashBatch(batchNonce);
  console.log('\nBatch Hash:', hash);

  // 5. 서명 검증 (옵션)
  const recoveredAddress = ethers.verifyTypedData(
    DOMAIN,
    BATCH_TYPES,
    { batchNonce },
    signature
  );
  console.log('\nRecovered Address:', recoveredAddress);
  console.log('Signature Valid:', recoveredAddress.toLowerCase() === executorWallet.address.toLowerCase());

  console.log('\n=== 완료 ===\n');
}

// 예제 실행
if (require.main === module) {
  example().catch(console.error);
}

// ============================================
// Export (Express 등에서 사용)
// ============================================

module.exports = {
  signBatch,
  hashBatch,
  getNextBatchNonce,
  initializeBatchNonce,
  handleVoteSubmit,
  submitToContract,
  CONFIG,
  DOMAIN,
  BATCH_TYPES
};
