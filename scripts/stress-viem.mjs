#!/usr/bin/env node
/**
 * stress-viem.mjs
 *
 * MainVoting 스트레스 테스트용 서명 데이터 생성 스크립트
 *
 * 주요 기능:
 *   - 결정론적 유저 Private Key 생성 (USER_KEY_SALT 기반)
 *   - EIP-712 서명 생성 (UserBatch, Batch)
 *   - 투표 레코드 생성 및 해시 계산
 *
 * 사용법:
 *   PRIVATE_KEY=0x... VOTING_ADDRESS=0x... node scripts/stress-viem.mjs [options]
 *
 * 옵션:
 *   --totalVotes N      총 투표 수 (기본: 100)
 *   --userCount N       유저 수 (기본: 20)
 *   --perUserVotes N    유저당 투표 수 (totalVotes/userCount 대신 사용)
 *   --missionId N       미션 ID (기본: 1)
 *   --file <name>       출력 파일명 (기본: stress-output.json)
 *   --votingAddress     컨트랙트 주소
 *   --rpcUrl            RPC URL
 *   --chainId           체인 ID (기본: 5611)
 *
 * 출력:
 *   stress-artifacts/<file>.json
 */

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

// =============================================================================
// 상수 정의
// =============================================================================

// 유저 키 파생용 Salt (결정론적 키 생성)
const USER_KEY_SALT = 0x9999999999999999999999999999999999999999999999999999999999999999n;

// 기본값
const DEFAULT_RPC_URL = 'https://opbnb-testnet-rpc.bnbchain.org';
const DEFAULT_VOTING_ADDRESS = '0x10Fb9C7BFec7d2059b65c9e70B4F58E2E6fd0eFE';
const DEFAULT_TOTAL_VOTES = 100;
const DEFAULT_USER_COUNT = 10;
const DEFAULT_MISSION_ID = 1;

// 컨트랙트 제한 (MainVoting.sol과 일치)
const MAX_RECORDS_PER_BATCH = 2000;
const MAX_RECORDS_PER_USER_BATCH = 20;

// =============================================================================
// EIP-712 타입 정의
// =============================================================================

// VoteRecord 타입해시 (컨트랙트의 VOTE_RECORD_TYPEHASH와 일치)
const VOTE_RECORD_TYPESTRING =
  'VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 optionId,uint8 voteType,uint256 votingAmt,address user)';
const VOTE_RECORD_TYPEHASH = keccak256(stringToHex(VOTE_RECORD_TYPESTRING));

// UserBatch EIP-712 타입
const USER_BATCH_TYPES = {
  UserBatch: [
    { name: 'user', type: 'address' },
    { name: 'userNonce', type: 'uint256' },
    { name: 'recordsHash', type: 'bytes32' },
  ],
};

// Batch EIP-712 타입 (Executor 서명용)
const BATCH_TYPES = {
  Batch: [
    { name: 'batchNonce', type: 'uint256' },
  ],
};

// =============================================================================
// ABI 인코딩용 구조체 정의
// =============================================================================

// VoteRecord 구조체
const VOTE_RECORD_TUPLE = {
  type: 'tuple',
  components: [
    { name: 'timestamp', type: 'uint256' },
    { name: 'missionId', type: 'uint256' },
    { name: 'votingId', type: 'uint256' },
    { name: 'optionId', type: 'uint256' },
    { name: 'voteType', type: 'uint8' },
    { name: 'userId', type: 'string' },
    { name: 'votingAmt', type: 'uint256' },
  ],
};

// UserBatchSig 구조체
const USER_BATCH_SIG_TUPLE = {
  type: 'tuple',
  components: [
    { name: 'user', type: 'address' },
    { name: 'userNonce', type: 'uint256' },
    { name: 'signature', type: 'bytes' },
  ],
};

// UserVoteBatch 구조체 배열
const USER_VOTE_BATCH_TUPLE = {
  type: 'tuple[]',
  components: [
    { name: 'records', type: 'tuple[]', components: VOTE_RECORD_TUPLE.components },
    { name: 'userBatchSig', type: 'tuple', components: USER_BATCH_SIG_TUPLE.components },
  ],
};

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * CLI 인자 파싱
 */
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

/**
 * Private Key 정규화 (0x 접두사 및 길이 검증)
 */
function normalizePrivateKey(value) {
  if (!value) return null;
  let hex = value.trim().toLowerCase();
  if (!hex.startsWith('0x')) hex = `0x${hex}`;
  if (hex.length !== 66) {
    throw new Error('PRIVATE_KEY must be 32 bytes (64 hex chars)');
  }
  return hex;
}

/**
 * 결정론적 유저 Private Key 생성
 * - USER_KEY_SALT + index를 해시하여 키 생성
 * - 동일한 index는 항상 동일한 키 반환
 */
function deriveUserKey(index) {
  const encoded = encodeAbiParameters(
    [{ type: 'uint256' }, { type: 'uint256' }],
    [USER_KEY_SALT, BigInt(index + 1)]
  );
  return keccak256(encoded);
}

/**
 * 값을 BigInt로 변환
 */
function toBigInt(value, label) {
  if (typeof value === 'bigint') return value;
  try {
    return BigInt(value);
  } catch (err) {
    throw new Error(`${label} 값을 BigInt로 변환할 수 없습니다: ${value}`);
  }
}

/**
 * VoteRecord 해시 계산
 * - 컨트랙트의 _hashVoteRecord 함수와 동일한 로직
 * - user 주소가 해시에 포함됨
 */
function hashVoteRecord(record, userAddress) {
  return keccak256(
    encodeAbiParameters(
      [
        { type: 'bytes32' },  // TYPEHASH
        { type: 'uint256' },  // timestamp
        { type: 'uint256' },  // missionId
        { type: 'uint256' },  // votingId
        { type: 'uint256' },  // optionId
        { type: 'uint8' },    // voteType
        { type: 'uint256' },  // votingAmt
        { type: 'address' },  // user
      ],
      [
        VOTE_RECORD_TYPEHASH,
        record.timestamp,
        record.missionId,
        record.votingId,
        record.optionId,
        record.voteType,
        record.votingAmt,
        userAddress,
      ]
    )
  );
}

/**
 * UserVoteBatch 배열을 ABI 인코딩
 */
function encodeUserVoteBatches(batches) {
  return encodeAbiParameters([USER_VOTE_BATCH_TUPLE], [batches]);
}

/**
 * 유저별 고유 nonce 생성
 * - userIndex, timestamp, salt를 조합하여 결정론적 생성
 */
function deriveUserNonce(userIndex, timestamp, salt) {
  const packed = encodePacked(
    ['string', 'uint256', 'uint256', 'uint256'],
    ['userNonce', BigInt(userIndex), timestamp, salt]
  );
  return toBigInt(keccak256(packed), 'userNonce');
}

/**
 * 랜덤 배치 nonce 생성
 */
function randomBatchNonce() {
  const rand = BigInt(`0x${crypto.randomBytes(32).toString('hex')}`);
  return (rand % 1_000_000_000n) + 10_000n;
}

/**
 * RPC에서 chainId 조회 (실패 시 기본값 5611 사용)
 */
async function resolveChainId(rpcUrl, provided) {
  if (provided) return BigInt(provided);
  if (!rpcUrl) return 5611n;
  try {
    const client = createPublicClient({ transport: http(rpcUrl) });
    const id = await client.getChainId();
    return BigInt(id);
  } catch (err) {
    console.warn('[WARN] RPC에서 chainId를 가져오지 못했습니다. 기본값 5611 사용');
    return 5611n;
  }
}

// =============================================================================
// 메인 함수
// =============================================================================

async function main() {
  // -------------------------------------------------------------------------
  // 1. 설정값 파싱
  // -------------------------------------------------------------------------
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

  // 총 투표 수 및 유저당 투표 수 계산
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
  const chainId = await resolveChainId(rpcUrl, cli.chainId || process.env.CHAIN_ID);

  // -------------------------------------------------------------------------
  // 2. 유효성 검증
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 3. Executor 계정 및 EIP-712 도메인 설정
  // -------------------------------------------------------------------------
  const executorAccount = privateKeyToAccount(executorKey);
  const domain = {
    name: 'MainVoting',
    version: '1',
    chainId: Number(chainId),
    verifyingContract: votingAddress,
  };

  // votingId 베이스값 생성 (timestamp + missionId 해시)
  const votingBase = toBigInt(
    keccak256(encodeAbiParameters([{ type: 'uint256' }, { type: 'uint256' }], [timestamp, missionId])),
    'votingBase'
  );

  // -------------------------------------------------------------------------
  // 4. 유저별 투표 레코드 및 서명 생성
  // -------------------------------------------------------------------------
  const userVoteBatches = [];

  for (let u = 0; u < userCount; u++) {
    // 유저 키 및 계정 생성
    const userKey = deriveUserKey(u);
    const userAccount = privateKeyToAccount(userKey);
    const perUserRecords = [];
    const perUserHashes = [];

    // 유저별 고유 votingId 생성
    const votingIdBase = votingBase + BigInt(u) + (randomSalt % 1_000_000_000n) + 1n;
    const votingId = (votingIdBase % 1_000_000_000n) + 1n;
    const userNonce = deriveUserNonce(u, timestamp, nonceSalt + BigInt(u + 1));
    const userId = `stress-${u}`;

    // 투표 레코드 생성
    for (let j = 0; j < votesPerUser; j++) {
      const votingAmt = BigInt(10 + j);
      // voteType: 0=Forget, 1=Remember (전반부 Remember, 후반부 Forget)
      const voteType = j < rememberCount ? 1 : 0;
      // optionId: 1~10 순환 (아티스트 ID)
      const optionId = BigInt((j % 10) + 1);

      const record = {
        timestamp,
        missionId,
        votingId,
        optionId,
        voteType,
        userId,
        votingAmt,
      };

      // 해시 계산 (user 주소 포함)
      const digest = hashVoteRecord(record, userAccount.address);
      perUserRecords.push(record);
      perUserHashes.push(digest);
    }

    // 모든 레코드 해시를 연결하여 recordsHash 생성
    const recordsHash = keccak256(concatHex(perUserHashes));

    // 유저의 EIP-712 서명 생성
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

    // UserVoteBatch 구조에 저장
    userVoteBatches.push({
      records: perUserRecords,
      userBatchSig: {
        user: userAccount.address,
        userNonce,
        signature,
      },
    });
  }

  // -------------------------------------------------------------------------
  // 5. Executor 서명 생성
  // -------------------------------------------------------------------------
  const batchNonceInput = cli.batchNonce || process.env.BATCH_NONCE;
  const batchNonce = batchNonceInput ? toBigInt(batchNonceInput, 'batchNonce') : randomBatchNonce();

  const executorSig = await executorAccount.signTypedData({
    domain,
    types: BATCH_TYPES,
    primaryType: 'Batch',
    message: { batchNonce },
  });

  // -------------------------------------------------------------------------
  // 6. 결과 저장
  // -------------------------------------------------------------------------
  const encodedBatches = encodeUserVoteBatches(userVoteBatches);

  const outputDir = resolve(process.cwd(), 'stress-artifacts');
  mkdirSync(outputDir, { recursive: true });
  const fileName = cli.file || process.env.STRESS_OUT || 'stress-output.json';
  const outPath = resolve(outputDir, fileName);

  const json = {
    missionId: Number(missionId),
    totalVotes,
    userCount,
    batchNonce: Number(batchNonce),
    batches: encodedBatches,
    executorSig,
    metadata: {
      votingAddress,
      chainId: Number(chainId),
      missionId: Number(missionId),
      timestamp: timestamp.toString(),
    },
  };

  writeFileSync(outPath, JSON.stringify(json, null, 2));

  // -------------------------------------------------------------------------
  // 7. 결과 출력
  // -------------------------------------------------------------------------
  console.log('[OK] 스트레스 서명 세트 생성 완료');
  console.log(`- VOTING_ADDRESS: ${votingAddress}`);
  console.log(
    `- 총 투표 수: ${totalVotes} (유저 ${userCount}명, 1인당 ${votesPerUser}건 | Remember ${rememberCount} / Forget ${votesPerUser - rememberCount})`
  );

  const allRecords = userVoteBatches.flatMap(b => b.records);
  const uniqueVotingIds = [...new Set(allRecords.map((r) => r.votingId.toString()))];
  const sampleVotingIds = uniqueVotingIds.slice(0, 10);
  if (sampleVotingIds.length > 0) {
    console.log(`- 샘플 votingId (최대 10개): ${sampleVotingIds.join(', ')}`);
  }
  console.log(`- 배치 논스: ${batchNonce.toString()}`);
  console.log(`- 출력 파일: ${outPath}`);
}

main().catch((err) => {
  console.error('[ERROR] 생성 중 오류 발생:', err.message ?? err);
  process.exitCode = 1;
});
