#!/usr/bin/env node

import {
  createWalletClient,
  createPublicClient,
  http,
  parseAbi,
  decodeAbiParameters,
  parseAbiParameters
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { opBNBTestnet } from 'viem/chains';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 설정
const VOTING_ADDRESS = '0x63b64F3dEC0b20a54BE337fcA845CE08C093DD25';
const RPC_URL = 'https://opbnb-testnet-rpc.bnbchain.org';
const PRIVATE_KEY = '0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef';

// ABI
const votingAbi = parseAbi([
  'function submitMultiUserBatch((uint256,uint256,uint256,address,uint256,uint8,string,uint256)[][] records, (address,uint256,bytes)[] userBatchSigs, uint256 batchNonce, bytes executorSig) external',
]);

async function submitStressTest() {
  console.log('🚀 스트레스 테스트 제출 시작...\n');

  // 1. JSON 읽기
  const jsonPath = path.join(__dirname, '..', 'stress-artifacts', 'stress-test-nested.json');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log(`📄 JSON 로드 완료`);
  console.log(`   - 유저 수: ${jsonData.metadata.userCount}명`);
  console.log(`   - 총 투표: ${jsonData.metadata.totalVotes}개`);
  console.log(`   - Batch Nonce: ${jsonData.batchNonce}\n`);

  // 2. 계정 설정
  const account = privateKeyToAccount(PRIVATE_KEY);
  
  const publicClient = createPublicClient({
    chain: opBNBTestnet,
    transport: http(RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: opBNBTestnet,
    transport: http(RPC_URL),
  });

  console.log(`✅ 계정: ${account.address}\n`);

  // 3. 잔액 확인
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`💰 잔액: ${balance} wei\n`);

  // 4. 트랜잭션 데이터 준비
  console.log('📝 트랜잭션 준비 중...');

  // ABI 디코딩
  const [records] = decodeAbiParameters(
    parseAbiParameters('(uint256,uint256,uint256,address,uint256,uint8,string,uint256)[][]'),
    jsonData.records
  );

  const [userBatchSigs] = decodeAbiParameters(
    parseAbiParameters('(address,uint256,bytes)[]'),
    jsonData.userBatchSigs
  );

  const batchNonce = BigInt(jsonData.batchNonce);
  const executorSig = jsonData.executorSig;

  console.log(`   - 디코딩된 records: ${records.length}개 유저`);
  console.log(`   - 디코딩된 userBatchSigs: ${userBatchSigs.length}개\n`);

  // 5. 트랜잭션 전송
  console.log('📤 트랜잭션 전송 중...\n');

  try {
    const hash = await walletClient.writeContract({
      address: VOTING_ADDRESS,
      abi: votingAbi,
      functionName: 'submitMultiUserBatch',
      args: [records, userBatchSigs, batchNonce, executorSig],
      gas: 10000000n, // 충분한 가스 설정
    });

    console.log(`✅ 트랜잭션 전송 완료!`);
    console.log(`   TX Hash: ${hash}\n`);

    // 6. 트랜잭션 확인 대기
    console.log('⏳ 트랜잭션 확인 대기 중...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(`\n✅ 트랜잭션 확인 완료!`);
    console.log(`   블록: ${receipt.blockNumber}`);
    console.log(`   가스 사용: ${receipt.gasUsed}`);
    console.log(`   상태: ${receipt.status === 'success' ? '성공' : '실패'}\n`);

    if (receipt.status === 'success') {
      console.log('🎉 스트레스 테스트 성공적으로 완료!\n');
      console.log(`🔗 탐색기: https://testnet.opbnbscan.com/tx/${hash}`);
    } else {
      console.log('❌ 트랜잭션 실패');
    }
  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    if (error.cause) {
      console.error('상세:', error.cause);
    }
    process.exit(1);
  }
}

submitStressTest().catch((error) => {
  console.error('❌ 실행 에러:', error);
  process.exit(1);
});
