#!/usr/bin/env node

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 설정
const CONFIG = {
  missionId: 1,
  votingId: 1,
  userCount: 5, // 5명 유저
  votesPerUser: 20, // 각 유저당 20개 (10 Forget + 10 Remember)
  chainId: 5611,
  votingAddress: '0x63b64F3dEC0b20a54BE337fcA845CE08C093DD25',
};

// EIP-712 Domain
const DOMAIN = {
  name: 'MainVoting',
  version: '1',
  chainId: CONFIG.chainId,
  verifyingContract: CONFIG.votingAddress,
};

// TypeHashes
const VOTE_RECORD_TYPEHASH = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes(
    'VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,uint256 candidateId,uint8 voteType,uint256 votingAmt)'
  )
);

const USER_BATCH_TYPEHASH = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes('UserBatch(address user,uint256 userNonce,bytes32 recordsHash)')
);

const BATCH_TYPEHASH = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes('Batch(uint256 batchNonce)')
);

// 랜덤 지갑 생성
function generateWallets(count) {
  const wallets = [];
  for (let i = 0; i < count; i++) {
    const wallet = ethers.Wallet.createRandom();
    wallets.push(wallet);
  }
  return wallets;
}

// VoteRecord 해시 생성
function hashVoteRecord(record) {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'uint256', 'uint256', 'uint256', 'address', 'uint256', 'uint8', 'uint256'],
      [
        VOTE_RECORD_TYPEHASH,
        record.timestamp,
        record.missionId,
        record.votingId,
        record.userAddress,
        record.candidateId,
        record.voteType,
        record.votingAmt,
      ]
    )
  );
}

// UserBatch 서명 생성
async function signUserBatch(wallet, userNonce, recordDigests) {
  const recordsHash = ethers.utils.keccak256(
    ethers.utils.solidityPack(recordDigests.map(() => 'bytes32'), recordDigests)
  );

  const structHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'address', 'uint256', 'bytes32'],
      [USER_BATCH_TYPEHASH, wallet.address, userNonce, recordsHash]
    )
  );

  const digest = ethers.utils.keccak256(
    ethers.utils.solidityPack(
      ['string', 'bytes32', 'bytes32'],
      ['\x19\x01', ethers.utils._TypedDataEncoder.hashDomain(DOMAIN), structHash]
    )
  );

  const signature = await wallet.signMessage(ethers.utils.arrayify(digest));
  return signature;
}

// Batch 서명 생성 (Executor)
async function signBatch(executorWallet, batchNonce) {
  const structHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(['bytes32', 'uint256'], [BATCH_TYPEHASH, batchNonce])
  );

  const digest = ethers.utils.keccak256(
    ethers.utils.solidityPack(
      ['string', 'bytes32', 'bytes32'],
      ['\x19\x01', ethers.utils._TypedDataEncoder.hashDomain(DOMAIN), structHash]
    )
  );

  const signature = await executorWallet.signMessage(ethers.utils.arrayify(digest));
  return signature;
}

// 메인 생성 함수
async function generateStressTest() {
  console.log('🚀 스트레스 테스트 데이터 생성 시작...\n');

  // 1. 유저 지갑 생성
  const userWallets = generateWallets(CONFIG.userCount);
  console.log(`✅ ${CONFIG.userCount}명의 유저 지갑 생성 완료`);

  // 2. Executor 지갑 (실제 private key 사용)
  const executorWallet = new ethers.Wallet(
    '0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef'
  );
  console.log(`✅ Executor: ${executorWallet.address}`);

  // 3. VoteRecord 생성 (2차원 배열)
  const now = Math.floor(Date.now() / 1000);
  const allRecords = [];
  const allUserBatchSigs = [];

  let totalVotes = 0;

  for (let userIdx = 0; userIdx < CONFIG.userCount; userIdx++) {
    const userWallet = userWallets[userIdx];
    const userRecords = [];

    for (let voteIdx = 0; voteIdx < CONFIG.votesPerUser; voteIdx++) {
      const candidateId = (voteIdx % 10) + 1; // Artist-1 ~ Artist-10 순환
      const voteType = voteIdx < CONFIG.votesPerUser / 2 ? 1 : 0; // 반은 Remember, 반은 Forget

      const record = {
        timestamp: now + userIdx * 100 + voteIdx,
        missionId: CONFIG.missionId,
        votingId: CONFIG.votingId,
        userAddress: userWallet.address,
        candidateId: candidateId,
        voteType: voteType,
        userId: `stress-user-${userIdx}`,
        votingAmt: 100 + voteIdx, // 포인트
      };

      userRecords.push(record);
      totalVotes++;
    }

    allRecords.push(userRecords);
  }

  console.log(`✅ 총 ${totalVotes}개 투표 레코드 생성 완료 (${CONFIG.userCount}명 × ${CONFIG.votesPerUser}개)`);

  // 4. 각 유저별 서명 생성
  for (let userIdx = 0; userIdx < CONFIG.userCount; userIdx++) {
    const userWallet = userWallets[userIdx];
    const userRecords = allRecords[userIdx];

    // 레코드 다이제스트 계산
    const recordDigests = userRecords.map((record) => hashVoteRecord(record));

    // UserBatch 서명
    const userNonce = userIdx; // 간단히 인덱스 사용
    const signature = await signUserBatch(userWallet, userNonce, recordDigests);

    allUserBatchSigs.push({
      user: userWallet.address,
      userNonce: userNonce,
      signature: signature,
    });
  }

  console.log(`✅ ${CONFIG.userCount}개 유저 서명 생성 완료`);

  // 5. Batch 서명 생성
  const batchNonce = Math.floor(Math.random() * 1000000);
  const executorSig = await signBatch(executorWallet, batchNonce);
  console.log(`✅ Executor 서명 생성 완료 (batchNonce: ${batchNonce})`);

  // 6. JSON 출력
  const output = {
    records: allRecords,
    userBatchSigs: allUserBatchSigs,
    batchNonce: batchNonce,
    executorSig: executorSig,
    metadata: {
      votingAddress: CONFIG.votingAddress,
      chainId: CONFIG.chainId,
      missionId: CONFIG.missionId,
      votingId: CONFIG.votingId,
      userCount: CONFIG.userCount,
      votesPerUser: CONFIG.votesPerUser,
      totalVotes: totalVotes,
      timestamp: now,
      generatedAt: new Date().toISOString(),
    },
  };

  // 7. 파일 저장
  const outputDir = path.join(__dirname, '..', 'stress-artifacts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'stress-test-nested.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n✅ 저장 완료: ${outputPath}`);
  console.log(`\n📊 요약:`);
  console.log(`   - 유저 수: ${CONFIG.userCount}명`);
  console.log(`   - 유저당 투표: ${CONFIG.votesPerUser}개`);
  console.log(`   - 총 투표: ${totalVotes}개`);
  console.log(`   - Batch Nonce: ${batchNonce}`);
  console.log(`\n🎯 다음 명령어로 실행:`);
  console.log(`   STRESS_FILE=stress-artifacts/stress-test-nested.json \\`);
  console.log(`   forge script script/SubmitStressVoting.s.sol:SubmitStressVoting \\`);
  console.log(`   --rpc-url https://opbnb-testnet-rpc.bnbchain.org \\`);
  console.log(`   --private-key $PRIVATE_KEY \\`);
  console.log(`   --broadcast`);
}

// 실행
generateStressTest().catch((error) => {
  console.error('❌ 에러 발생:', error);
  process.exit(1);
});
