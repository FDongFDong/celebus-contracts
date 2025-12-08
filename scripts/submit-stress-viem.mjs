#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createWalletClient,
  createPublicClient,
  decodeAbiParameters,
  defineChain,
  getAddress,
  http,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const DEFAULT_RPC_URL = 'https://opbnb-testnet-rpc.bnbchain.org';
const DEFAULT_STRESS_FILE = 'stress-artifacts/stress-output.json';
const DEFAULT_VOTING_ADDRESS = '0x10Fb9C7BFec7d2059b65c9e70B4F58E2E6fd0eFE';

// VoteRecord 구조체 (컨트랙트와 일치)
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

// UserBatchSig 구조체 (컨트랙트와 일치)
const USER_BATCH_SIG_TUPLE = {
  type: 'tuple',
  components: [
    { name: 'user', type: 'address' },
    { name: 'userNonce', type: 'uint256' },
    { name: 'signature', type: 'bytes' },
  ],
};

// UserVoteBatch 구조체 (컨트랙트와 일치)
const USER_VOTE_BATCH_TUPLE = {
  type: 'tuple[]',
  components: [
    { name: 'records', type: 'tuple[]', components: VOTE_RECORD_TUPLE.components },
    { name: 'userBatchSig', type: 'tuple', components: USER_BATCH_SIG_TUPLE.components },
  ],
};

// 현재 컨트랙트의 submitMultiUserBatch 함수 ABI
const MAIN_VOTING_ABI = [
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'submitMultiUserBatch',
    inputs: [
      {
        name: 'batches',
        type: 'tuple[]',
        components: [
          { name: 'records', type: 'tuple[]', components: VOTE_RECORD_TUPLE.components },
          { name: 'userBatchSig', type: 'tuple', components: USER_BATCH_SIG_TUPLE.components },
        ],
      },
      { name: 'batchNonce', type: 'uint256' },
      { name: 'executorSig', type: 'bytes' },
    ],
    outputs: [],
  },
];

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

function toBigInt(value, label) {
  if (!value) return undefined;
  try {
    return BigInt(value);
  } catch (err) {
    throw new Error(`${label} 값을 BigInt로 변환할 수 없습니다: ${value}`);
  }
}

function loadStressFile(filePath) {
  const resolved = resolve(process.cwd(), filePath);
  const raw = readFileSync(resolved, 'utf8');
  const json = JSON.parse(raw);
  return { json, resolved };
}

function decodeUserVoteBatches(encoded) {
  const [batches] = decodeAbiParameters([USER_VOTE_BATCH_TUPLE], encoded);
  return batches.map((batch) => ({
    records: batch.records.map((r) => ({
      timestamp: BigInt(r.timestamp),
      missionId: BigInt(r.missionId),
      votingId: BigInt(r.votingId),
      optionId: BigInt(r.optionId),
      voteType: Number(r.voteType),
      userId: r.userId,
      votingAmt: BigInt(r.votingAmt),
    })),
    userBatchSig: {
      user: getAddress(batch.userBatchSig.user),
      userNonce: BigInt(batch.userBatchSig.userNonce),
      signature: batch.userBatchSig.signature,
    },
  }));
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  const privateKey = normalizePrivateKey(process.env.PRIVATE_KEY || cli.privateKey);
  if (!privateKey) {
    throw new Error('환경변수 PRIVATE_KEY (또는 --privateKey) 를 설정해주세요.');
  }

  const rpcUrl = cli.rpcUrl || process.env.RPC_URL || DEFAULT_RPC_URL;
  const stressFile = cli.file || process.env.STRESS_FILE || DEFAULT_STRESS_FILE;

  const { json, resolved } = loadStressFile(stressFile);
  const votingAddress = getAddress(
    cli.votingAddress || process.env.VOTING_ADDRESS || json.metadata?.votingAddress || DEFAULT_VOTING_ADDRESS
  );

  const batches = decodeUserVoteBatches(json.batches);
  const batchNonce = BigInt(json.batchNonce);
  const executorSig = json.executorSig;

  const chainId = BigInt(
    cli.chainId || process.env.CHAIN_ID || json.metadata?.chainId || 5611
  );
  const gasLimitInput = cli.gas || process.env.GAS_LIMIT;
  const nonceInput = cli.nonce || process.env.NONCE;
  const gasBumpPercentInput = cli.gasBumpPercent || process.env.GAS_BUMP_PERCENT;

  const chain = defineChain({
    id: Number(chainId),
    name: 'opBNB Testnet',
    network: 'opbnb-testnet',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } },
  });

  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({ account, chain, transport: http(rpcUrl) });
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

  // 총 레코드 수 계산
  const totalRecords = batches.reduce((sum, b) => sum + b.records.length, 0);

  console.log('== 스트레스 서명 제출 시작 ==');
  console.log(`파일: ${resolved}`);
  console.log(`목표 컨트랙트: ${votingAddress}`);
  console.log(`배치 논스: ${batchNonce}`);
  console.log(`총 레코드: ${totalRecords}, 유저 배치: ${batches.length}`);

  let gasLimit;
  if (gasLimitInput) {
    gasLimit = toBigInt(gasLimitInput, 'gas');
  } else {
    const estimate = await publicClient.estimateContractGas({
      account,
      address: votingAddress,
      abi: MAIN_VOTING_ABI,
      functionName: 'submitMultiUserBatch',
      args: [batches, batchNonce, executorSig],
    });
    // add 25% safety margin
    gasLimit = (estimate * 125n) / 100n;
    console.log(`Estimated gas: ${estimate.toString()} → applying 25% buffer = ${gasLimit.toString()}`);
  }

  let maxFeePerGas;
  let maxPriorityFeePerGas;
  try {
    const feeData = await publicClient.estimateFeesPerGas();
    maxFeePerGas = feeData.maxFeePerGas;
    maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
  } catch (err) {
    const gasPrice = await publicClient.getGasPrice();
    maxFeePerGas = gasPrice;
    maxPriorityFeePerGas = gasPrice;
  }

  const gasBumpPercent = gasBumpPercentInput ? Number(gasBumpPercentInput) : 0;
  if (gasBumpPercent > 0) {
    const bump = BigInt(100 + gasBumpPercent);
    maxFeePerGas = (maxFeePerGas * bump) / 100n;
    maxPriorityFeePerGas = (maxPriorityFeePerGas * bump) / 100n;
  }

  const nonce = nonceInput ? toBigInt(nonceInput, 'nonce') : undefined;

  const writeParams = {
    address: votingAddress,
    abi: MAIN_VOTING_ABI,
    functionName: 'submitMultiUserBatch',
    args: [batches, batchNonce, executorSig],
    gas: gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
  if (nonce !== undefined) {
    writeParams.nonce = nonce;
  }

  const hash = await client.writeContract(writeParams);

  console.log('✅ 제출 완료');
  console.log(`txHash: ${hash}`);
  console.log(`opbnbscan: https://testnet.opbnbscan.com/tx/${hash}`);

  try {
    const rawTx = await client.transport.request({
      method: 'eth_getRawTransactionByHash',
      params: [hash],
    });
    if (rawTx) {
      const byteLen = (rawTx.length - 2) / 2;
      const kb = byteLen / 1024;
      console.log(`RLP size: ${byteLen} bytes (${kb.toFixed(2)} KB)`);
    }
  } catch (err) {
    console.warn('⚠️ raw tx size 조회 실패:', err.message ?? err);
  }
}

main().catch((err) => {
  console.error('❌ 제출 중 오류 발생:', err.message ?? err);
  process.exitCode = 1;
});
