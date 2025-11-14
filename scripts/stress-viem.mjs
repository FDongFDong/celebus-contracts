#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import crypto from 'node:crypto';
import {
  concatHex,
  encodeAbiParameters,
  encodePacked,
  getAddress,
  keccak256,
  stringToHex,
} from 'viem';
import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const USER_KEY_SALT = 0x9999999999999999999999999999999999999999999999999999999999999999n;
const DEFAULT_RPC_URL = 'https://opbnb-testnet-rpc.bnbchain.org';
const DEFAULT_VOTING_ADDRESS = '0x10Fb9C7BFec7d2059b65c9e70B4F58E2E6fd0eFE';
const DEFAULT_TOTAL_VOTES = 100;
const DEFAULT_USER_COUNT = 20;
const DEFAULT_MISSION_ID = 1;
const MAX_RECORDS_PER_BATCH = 5000;
const MAX_RECORDS_PER_USER_BATCH = 50;
const TWO_WEEKS = 14n * 24n * 60n * 60n;

const VOTE_RECORD_TYPESTRING =
  'VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,bytes32 userIdHash,bytes32 votingForHash,bytes32 votedOnHash,uint256 votingAmt,uint256 deadline)';
const VOTE_RECORD_TYPEHASH = keccak256(stringToHex(VOTE_RECORD_TYPESTRING));

const USER_BATCH_TYPES = {
  UserBatch: [
    { name: 'user', type: 'address' },
    { name: 'userNonce', type: 'uint256' },
    { name: 'recordsHash', type: 'bytes32' },
  ],
};

const BATCH_TYPES = {
  Batch: [
    { name: 'batchNonce', type: 'uint256' },
  ],
};

const RECORD_TUPLE = {
  type: 'tuple[]',
  components: [
    { name: 'timestamp', type: 'uint256' },
    { name: 'missionId', type: 'uint256' },
    { name: 'votingId', type: 'uint256' },
    { name: 'userAddress', type: 'address' },
    { name: 'userId', type: 'string' },
    { name: 'votingFor', type: 'string' },
    { name: 'votedOn', type: 'string' },
    { name: 'votingAmt', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

const USER_SIG_TUPLE = {
  type: 'tuple[]',
  components: [
    { name: 'user', type: 'address' },
    { name: 'userNonce', type: 'uint256' },
    { name: 'recordIndices', type: 'uint256[]' },
    { name: 'signature', type: 'bytes' },
  ],
};

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const part = argv[i];
    if (!part.startsWith('--')) continue;
    const key = part.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    args[key] = value;
  }
  return args;
}

function normalizePrivateKey(value) {
  if (!value) return null;
  let hex = value.trim().toLowerCase();
  if (!hex.startsWith('0x')) hex = `0x${hex}`;
  if (hex.length !== 66) {
    throw new Error('PRIVATE_KEY must be 32 bytes (64 hex chars)');
  }
  return hex;
}

function deriveUserKey(index) {
  const encoded = encodeAbiParameters(
    [
      { type: 'uint256' },
      { type: 'uint256' },
    ],
    [USER_KEY_SALT, BigInt(index + 1)]
  );
  const digest = keccak256(encoded);
  return digest;
}

function toBigInt(value, label) {
  if (typeof value === 'bigint') return value;
  try {
    return BigInt(value);
  } catch (err) {
    throw new Error(`${label} 값을 BigInt로 변환할 수 없습니다: ${value}`);
  }
}

function hashVoteRecord(record) {
  return keccak256(
    encodeAbiParameters(
      [
        { type: 'bytes32' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'address' },
        { type: 'bytes32' },
        { type: 'bytes32' },
        { type: 'bytes32' },
        { type: 'uint256' },
        { type: 'uint256' },
      ],
      [
        VOTE_RECORD_TYPEHASH,
        record.timestamp,
        record.missionId,
        record.votingId,
        record.userAddress,
        keccak256(stringToHex(record.userId)),
        keccak256(stringToHex(record.votingFor)),
        keccak256(stringToHex(record.votedOn)),
        record.votingAmt,
        record.deadline,
      ]
    )
  );
}

function encodeRecords(records) {
  return encodeAbiParameters([RECORD_TUPLE], [records]);
}

// recordNonces는 V1에서 제거됨 (불필요)

function encodeUserBatchSigs(sigs) {
  return encodeAbiParameters([USER_SIG_TUPLE], [sigs]);
}

function deriveUserNonce(userIndex, timestamp, salt) {
  const packed = encodePacked(
    ['string', 'uint256', 'uint256', 'uint256'],
    ['userNonce', BigInt(userIndex), timestamp, salt]
  );
  return toBigInt(keccak256(packed), 'userNonce');
}

function randomBatchNonce() {
  const rand = BigInt(`0x${crypto.randomBytes(32).toString('hex')}`);
  return (rand % 1_000_000_000n) + 10_000n;
}

async function resolveChainId(rpcUrl, provided) {
  if (provided) return BigInt(provided);
  if (!rpcUrl) return 5611n;
  try {
    const client = createPublicClient({ transport: http(rpcUrl) });
    const id = await client.getChainId();
    return BigInt(id);
  } catch (err) {
    console.warn('[경고] RPC에서 chainId를 가져오지 못했습니다. 기본값 5611 사용');
    return 5611n;
  }
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  const executorKey = normalizePrivateKey(process.env.PRIVATE_KEY || cli.privateKey);
  if (!executorKey) {
    throw new Error('환경변수 PRIVATE_KEY (또는 --privateKey) 를 설정해주세요.');
  }

  const rpcUrl = cli.rpcUrl || process.env.RPC_URL || DEFAULT_RPC_URL;
  const votingAddress = getAddress(cli.votingAddress || process.env.VOTING_ADDRESS || DEFAULT_VOTING_ADDRESS);
  const userCount = Number(cli.userCount || process.env.USER_COUNT || DEFAULT_USER_COUNT);
  const totalVotesInput = Number(cli.totalVotes || process.env.TOTAL_VOTES || DEFAULT_TOTAL_VOTES);
  const perUserVotesRaw = cli.perUserVotes ?? cli.recordsPerUser ?? process.env.PER_USER_VOTES;
  let totalVotes;
  let votesPerUser;
  if (perUserVotesRaw !== undefined) {
    votesPerUser = Number(perUserVotesRaw);
    if (!Number.isInteger(votesPerUser) || votesPerUser <= 0) {
      throw new Error('--perUserVotes (또는 --recordsPerUser) 는 1 이상의 정수여야 합니다.');
    }
    totalVotes = votesPerUser * userCount;
  } else {
    totalVotes = totalVotesInput;
    if (totalVotes % userCount !== 0) {
      throw new Error('totalVotes % userCount 가 0 이어야 합니다.');
    }
    votesPerUser = totalVotes / userCount;
  }
  const missionId = toBigInt(cli.missionId || process.env.MISSION_ID || DEFAULT_MISSION_ID, 'missionId');
  const timestampInput = cli.timestamp || process.env.TIMESTAMP;
  const timestamp = timestampInput ? toBigInt(timestampInput, 'timestamp') : BigInt(Math.floor(Date.now() / 1000));
  const nonceSalt = BigInt('0x' + crypto.randomBytes(16).toString('hex'));
  const randomSalt = BigInt('0x' + crypto.randomBytes(16).toString('hex'));
  const deadline = timestamp + TWO_WEEKS;
  const chainId = await resolveChainId(rpcUrl, cli.chainId || process.env.CHAIN_ID);

  if (!Number.isInteger(totalVotes) || totalVotes <= 0) {
    throw new Error('TOTAL_VOTES 는 1 이상의 정수여야 합니다.');
  }
  if (!Number.isInteger(userCount) || userCount <= 0) {
    throw new Error('USER_COUNT 는 1 이상의 정수여야 합니다.');
  }
  if (totalVotes > MAX_RECORDS_PER_BATCH) {
    throw new Error(`totalVotes 는 ${MAX_RECORDS_PER_BATCH} 를 초과할 수 없습니다.`);
  }
  if (votesPerUser > MAX_RECORDS_PER_USER_BATCH) {
    throw new Error(`유저당 레코드 수(${votesPerUser})가 한도(${MAX_RECORDS_PER_USER_BATCH})를 초과했습니다.`);
  }

  if (votesPerUser % 2 !== 0) {
    throw new Error(
      'Remember/Forget 을 동일하게 맞추려면 1인당 투표 수가 짝수여야 합니다. totalVotes / userCount 를 조정해주세요.'
    );
  }
  const rememberCount = votesPerUser / 2;
  const rememberLabel = String(cli.rememberLabel || process.env.REMEMBER_LABEL || 'Remember');
  const forgetLabel = String(cli.forgetLabel || process.env.FORGET_LABEL || 'Forget');

  const executorAccount = privateKeyToAccount(executorKey);
  const domain = {
    name: 'MainVoting',
    version: '1',
    chainId: Number(chainId),
    verifyingContract: votingAddress,
  };

  const votingBase = toBigInt(
    keccak256(encodeAbiParameters([{ type: 'uint256' }, { type: 'uint256' }], [timestamp, missionId])),
    'votingBase'
  );

  const records = [];
  const recordHashes = [];
  const userBatchSigs = [];

  for (let u = 0; u < userCount; u++) {
    const userKey = deriveUserKey(u);
    const userAccount = privateKeyToAccount(userKey);
    const perUserRecords = [];
    const perUserHashes = [];
    const recordIndices = [];

    const votingIdBase = votingBase + BigInt(u) + (randomSalt % 1_000_000_000n) + 1n;
    const votingId = (votingIdBase % 1_000_000_000n) + 1n;
    const userNonce = deriveUserNonce(u, timestamp, nonceSalt + BigInt(u + 1));
    const userId = `stress-${u}`;

    for (let j = 0; j < votesPerUser; j++) {
      const idx = records.length;
      const votingAmt = BigInt(10 + j);
      const votedOnLabel = j < rememberCount ? rememberLabel : forgetLabel;
      const record = {
        timestamp,
        missionId,
        votingId,
        userAddress: userAccount.address,
        userId,
        votingFor: `Artist-${u + 1}`,
        votedOn: votedOnLabel,
        votingAmt,
        deadline,
      };
      const digest = hashVoteRecord(record);

      records.push(record);
      recordHashes.push(digest);

      perUserRecords.push(record);
      perUserHashes.push(digest);
      recordIndices.push(BigInt(idx));
    }

    const recordsHash = keccak256(concatHex(perUserHashes));
    const signature = await userAccount.signTypedData({
      domain,
      types: USER_BATCH_TYPES,
      primaryType: 'UserBatch',
      message: {
        user: userAccount.address,
        userNonce,
        recordsHash,
      },
    });

    userBatchSigs.push({
      user: userAccount.address,
      userNonce,
      recordIndices,
      signature,
    });
  }

  const batchNonceInput = cli.batchNonce || process.env.BATCH_NONCE;
  const batchNonce = batchNonceInput ? toBigInt(batchNonceInput, 'batchNonce') : randomBatchNonce();
  const executorSig = await executorAccount.signTypedData({
    domain,
    types: BATCH_TYPES,
    primaryType: 'Batch',
    message: {
      batchNonce,
    },
  });

  const encodedRecords = encodeRecords(records);
  const encodedUserSigs = encodeUserBatchSigs(userBatchSigs);

  const outputDir = resolve(process.cwd(), 'stress-artifacts');
  mkdirSync(outputDir, { recursive: true });
  const fileName = cli.file || process.env.STRESS_OUT || 'stress-output.json';
  const outPath = resolve(outputDir, fileName);

  const json = {
    missionId: Number(missionId),
    totalVotes,
    userCount,
    batchNonce: Number(batchNonce),
    records: encodedRecords,
    userBatchSigs: encodedUserSigs,
    executorSig,
    metadata: {
      votingAddress,
      chainId: Number(chainId),
      missionId: Number(missionId),
      timestamp: timestamp.toString(),
      deadline: deadline.toString(),
    },
  };

  writeFileSync(outPath, JSON.stringify(json, null, 2));
  console.log('✅ 스트레스 서명 세트 생성 완료');
  console.log(`- VOTING_ADDRESS: ${votingAddress}`);
  console.log(
    `- 총 투표 수: ${totalVotes} (유저 ${userCount}명, 1인당 ${votesPerUser}건 | Remember ${rememberCount} / Forget ${votesPerUser - rememberCount})`
  );
  const uniqueVotingIds = [...new Set(records.map((r) => r.votingId.toString()))];
  const sampleVotingIds = uniqueVotingIds.slice(0, 10);
  if (sampleVotingIds.length > 0) {
    console.log(`- 샘플 votingId (최대 10개): ${sampleVotingIds.join(', ')}`);
  }
  console.log(`- 배치 논스: ${batchNonce.toString()}`);
  console.log(`- 출력 파일: ${outPath}`);
}

main().catch((err) => {
  console.error('❌ 생성 중 오류 발생:', err.message ?? err);
  process.exitCode = 1;
});
