#!/usr/bin/env node

import {
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  encodePacked,
  toHex,
  hexToBytes
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 설정
const CONFIG = {
  missionId: 1,
  votingId: 1,
  userCount: 2, // 2명 유저 (가스 절약)
  votesPerUser: 10, // 각 유저당 10개 (5 Remember + 5 Forget)
  chainId: 5611,
  votingAddress: '0x63b64F3dEC0b20a54BE337fcA845CE08C093DD25',
};

// EIP-712 Domain
const DOMAIN = {
  name: 'MainVoting',
  version: '1',
  chainId: BigInt(CONFIG.chainId),
  verifyingContract: CONFIG.votingAddress,
};

// TypeHashes
const VOTE_RECORD_TYPEHASH = keccak256(
  toHex('VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,uint256 candidateId,uint8 voteType,uint256 votingAmt)')
);

const USER_BATCH_TYPEHASH = keccak256(
  toHex('UserBatch(address user,uint256 userNonce,bytes32 recordsHash)')
);

const BATCH_TYPEHASH = keccak256(
  toHex('Batch(uint256 batchNonce)')
);

// Domain Separator 계산
function getDomainSeparator() {
  const typeHash = keccak256(
    toHex('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
  );
  
  return keccak256(
    encodeAbiParameters(
      parseAbiParameters('bytes32, bytes32, bytes32, uint256, address'),
      [
        typeHash,
        keccak256(toHex(DOMAIN.name)),
        keccak256(toHex(DOMAIN.version)),
        DOMAIN.chainId,
        DOMAIN.verifyingContract
      ]
    )
  );
}

// VoteRecord 해시 생성
function hashVoteRecord(record) {
  return keccak256(
    encodeAbiParameters(
      parseAbiParameters('bytes32, uint256, uint256, uint256, address, uint256, uint8, uint256'),
      [
        VOTE_RECORD_TYPEHASH,
        BigInt(record.timestamp),
        BigInt(record.missionId),
        BigInt(record.votingId),
        record.userAddress,
        BigInt(record.candidateId),
        record.voteType,
        BigInt(record.votingAmt),
      ]
    )
  );
}

// UserBatch 서명 생성
async function signUserBatch(account, userNonce, recordDigests) {
  const recordsHash = keccak256(encodePacked(['bytes32[]'], [recordDigests]));

  // EIP-712 signTypedData 사용
  const signature = await account.signTypedData({
    domain: {
      name: DOMAIN.name,
      version: DOMAIN.version,
      chainId: Number(DOMAIN.chainId),
      verifyingContract: DOMAIN.verifyingContract,
    },
    types: {
      UserBatch: [
        { name: 'user', type: 'address' },
        { name: 'userNonce', type: 'uint256' },
        { name: 'recordsHash', type: 'bytes32' },
      ],
    },
    primaryType: 'UserBatch',
    message: {
      user: account.address,
      userNonce: BigInt(userNonce),
      recordsHash: recordsHash,
    },
  });

  return signature;
}

// Batch 서명 생성 (Executor)
async function signBatch(executorAccount, batchNonce) {
  // EIP-712 signTypedData 사용
  const signature = await executorAccount.signTypedData({
    domain: {
      name: DOMAIN.name,
      version: DOMAIN.version,
      chainId: Number(DOMAIN.chainId),
      verifyingContract: DOMAIN.verifyingContract,
    },
    types: {
      Batch: [{ name: 'batchNonce', type: 'uint256' }],
    },
    primaryType: 'Batch',
    message: {
      batchNonce: BigInt(batchNonce),
    },
  });

  return signature;
}

// 메인 생성 함수
async function generateStressTest() {
  console.log('🚀 스트레스 테스트 데이터 생성 시작 (viem)...\n');

  // 1. 유저 계정 생성
  const userAccounts = [];
  for (let i = 0; i < CONFIG.userCount; i++) {
    // 간단한 private key 생성 (테스트용)
    const randomHex = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const account = privateKeyToAccount(randomHex);
    userAccounts.push(account);
  }
  console.log(`✅ ${CONFIG.userCount}명의 유저 계정 생성 완료`);

  // 2. Executor 계정 (실제 private key 사용)
  const executorAccount = privateKeyToAccount(
    '0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef'
  );
  console.log(`✅ Executor: ${executorAccount.address}`);

  // 3. VoteRecord 생성 (2차원 배열)
  const now = Math.floor(Date.now() / 1000);
  const allRecords = [];
  const allUserBatchSigs = [];

  let totalVotes = 0;

  for (let userIdx = 0; userIdx < CONFIG.userCount; userIdx++) {
    const userAccount = userAccounts[userIdx];
    const userRecords = [];

    for (let voteIdx = 0; voteIdx < CONFIG.votesPerUser; voteIdx++) {
      const candidateId = (voteIdx % 10) + 1; // Artist-1 ~ Artist-10 순환
      const voteType = voteIdx < CONFIG.votesPerUser / 2 ? 1 : 0; // 첫 10개 Remember, 나머지 10개 Forget

      const record = {
        timestamp: now + userIdx * 100 + voteIdx,
        missionId: CONFIG.missionId,
        votingId: CONFIG.votingId,
        userAddress: userAccount.address,
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
    const userAccount = userAccounts[userIdx];
    const userRecords = allRecords[userIdx];

    // 레코드 다이제스트 계산
    const recordDigests = userRecords.map((record) => hashVoteRecord(record));

    // UserBatch 서명
    const userNonce = userIdx; // 간단히 인덱스 사용
    const signature = await signUserBatch(userAccount, userNonce, recordDigests);

    allUserBatchSigs.push({
      user: userAccount.address,
      userNonce: userNonce,
      signature: signature,
    });
  }

  console.log(`✅ ${CONFIG.userCount}개 유저 서명 생성 완료`);

  // 5. Batch 서명 생성
  const batchNonce = Math.floor(Math.random() * 1000000);
  const executorSig = await signBatch(executorAccount, batchNonce);
  console.log(`✅ Executor 서명 생성 완료 (batchNonce: ${batchNonce})`);

  // 6. ABI 인코딩 (Foundry가 파싱할 수 있도록)
  const encodedRecords = encodeAbiParameters(
    parseAbiParameters('(uint256,uint256,uint256,address,uint256,uint8,string,uint256)[][]'),
    [allRecords.map(userRecords =>
      userRecords.map(r => [
        BigInt(r.timestamp),
        BigInt(r.missionId),
        BigInt(r.votingId),
        r.userAddress,
        BigInt(r.candidateId),
        r.voteType,
        r.userId,
        BigInt(r.votingAmt)
      ])
    )]
  );

  const encodedUserBatchSigs = encodeAbiParameters(
    parseAbiParameters('(address,uint256,bytes)[]'),
    [allUserBatchSigs.map(sig => [sig.user, BigInt(sig.userNonce), sig.signature])]
  );

  // 7. JSON 출력
  const output = {
    records: encodedRecords,
    userBatchSigs: encodedUserBatchSigs,
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
  console.log(`   export STRESS_FILE=stress-artifacts/stress-test-nested.json`);
  console.log(`   export VOTING_ADDRESS=${CONFIG.votingAddress}`);
  console.log(`   export PRIVATE_KEY=0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef`);
  console.log(`   forge script script/SubmitStressVoting.s.sol:SubmitStressVoting \\`);
  console.log(`     --rpc-url https://opbnb-testnet-rpc.bnbchain.org \\`);
  console.log(`     --private-key $PRIVATE_KEY \\`);
  console.log(`     --broadcast`);
}

// 실행
generateStressTest().catch((error) => {
  console.error('❌ 에러 발생:', error);
  process.exit(1);
});
