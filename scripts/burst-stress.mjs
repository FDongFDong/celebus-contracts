#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { createPublicClient, defineChain, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

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

function runCommand(command, commandArgs, envOverrides = {}, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: 'inherit',
      env: { ...process.env, ...envOverrides },
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${label ?? command} exited with code ${code}`));
      }
    });
  });
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  const count = Number(cli.count || process.env.STRESS_BURST_COUNT || 2);
  const perUserVotes = cli.perUserVotes || cli.recordsPerUser || process.env.PER_USER_VOTES;
  const userCount = Number(cli.userCount || process.env.USER_COUNT || 35);
  const totalVotes = perUserVotes ? Number(perUserVotes) * userCount : Number(cli.totalVotes || 175);
  const missionId = Number(cli.missionId || 1);
  const rpcUrl = cli.rpcUrl || process.env.RPC_URL;
  const votingAddress = cli.votingAddress || cli.VOTING_ADDRESS || process.env.VOTING_ADDRESS;
  const gasBumpPercent = Number(cli.gasBumpPercent || process.env.GAS_BUMP_PERCENT || 10);

  if (!process.env.PRIVATE_KEY) {
    throw new Error('환경변수 PRIVATE_KEY가 필요합니다.');
  }
  if (!votingAddress) {
    throw new Error('환경변수 VOTING_ADDRESS 또는 --votingAddress (--VOTING_ADDRESS) 가 필요합니다.');
  }
  if (!rpcUrl) {
    throw new Error('환경변수 RPC_URL 또는 --rpcUrl 가 필요합니다.');
  }
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error('--count 는 1 이상의 정수여야 합니다.');
  }

  const chainId = Number(cli.chainId || process.env.CHAIN_ID || 5611);
  const account = privateKeyToAccount(process.env.PRIVATE_KEY);
  const chain = defineChain({
    id: chainId,
    name: 'opBNB Testnet',
    network: 'opbnb-testnet',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } },
  });
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const baseNonce = BigInt(
    await publicClient.getTransactionCount({ address: account.address, blockTag: 'pending' })
  );

  const generatedFiles = [];
  console.log(`== 1. Signatures 생성 (${count}회, ${totalVotes} votes씩) ==`);
  for (let i = 0; i < count; i++) {
    const timestamp = Date.now();
    const fileName = `burst-${totalVotes}-${missionId}-${timestamp}-${i}.json`;
    const filePath = resolve(process.cwd(), 'stress-artifacts', fileName);
    await runCommand(
      'npm',
      [
        'run',
        'stress:viem',
        '--',
        '--totalVotes',
        String(totalVotes),
        '--userCount',
        String(userCount),
        '--missionId',
        String(missionId),
        '--file',
        fileName,
        '--votingAddress',
        votingAddress,
      ],
      {
        VOTING_ADDRESS: votingAddress,
        RPC_URL: rpcUrl,
      },
      `stress:viem #${i + 1}`
    );
    generatedFiles.push(filePath);
  }

  console.log('== 2. 동시 제출 시작 ==');
  const submitPromises = generatedFiles.map((filePath, idx) =>
    runCommand(
      'node',
      ['scripts/submit-stress-viem.mjs', '--file', filePath, '--votingAddress', votingAddress],
      {
        VOTING_ADDRESS: votingAddress,
        RPC_URL: rpcUrl,
        PRIVATE_KEY: process.env.PRIVATE_KEY,
        NONCE: (baseNonce + BigInt(idx)).toString(),
        GAS_BUMP_PERCENT: String(gasBumpPercent),
      },
      `submit #${idx + 1}`
    )
  );

  const results = await Promise.allSettled(submitPromises);
  results.forEach((res, idx) => {
    if (res.status === 'fulfilled') {
      console.log(`submit #${idx + 1}: ✅ success`);
    } else {
      console.warn(`submit #${idx + 1}: ❌ ${res.reason?.message || res.reason}`);
    }
  });

  console.log('== 완료 ==');
  console.log('생성한 파일 목록:');
  generatedFiles.forEach((file) => console.log(`- ${file}`));
}

main().catch((err) => {
  console.error('❌ burst 스크립트 오류:', err.message ?? err);
  process.exit(1);
});
