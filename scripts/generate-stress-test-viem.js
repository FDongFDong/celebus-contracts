#!/usr/bin/env node
/**
 * =============================================================================
 * Stress Test Data Generator (viem version)
 * =============================================================================
 *
 * Purpose:
 *   Generate pre-signed voting data for stress testing the MainVoting contract.
 *   This script creates mock users, vote records, and EIP-712 signatures
 *   that can be submitted to the blockchain via submit-stress-viem.mjs.
 *
 * Workflow:
 *   1. Generate random user accounts (for testing purposes)
 *   2. Create VoteRecord data for each user
 *   3. Sign UserBatch with each user's private key (EIP-712)
 *   4. Sign Batch with Executor's private key (EIP-712)
 *   5. Export all data as ABI-encoded JSON
 *
 * Output:
 *   stress-artifacts/stress-test-nested.json
 *
 * Usage:
 *   node scripts/generate-stress-test-viem.js
 *
 * =============================================================================
 */

import {
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  encodePacked,
  toHex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// Configuration
// =============================================================================
const CONFIG = {
  missionId: 1,
  votingId: 1,
  userCount: 2,        // Number of test users
  votesPerUser: 10,    // Votes per user (half Remember, half Forget)
  chainId: 5611,       // opBNB Testnet
  votingAddress: '0x63b64F3dEC0b20a54BE337fcA845CE08C093DD25',
};

// =============================================================================
// EIP-712 Domain & Type Hashes
// =============================================================================

/**
 * EIP-712 Domain Separator parameters.
 * Must match the domain defined in the MainVoting contract.
 */
const DOMAIN = {
  name: 'MainVoting',
  version: '1',
  chainId: BigInt(CONFIG.chainId),
  verifyingContract: CONFIG.votingAddress,
};

/**
 * Type hashes for EIP-712 structured data signing.
 * These are keccak256 hashes of the type definitions.
 */
const VOTE_RECORD_TYPEHASH = keccak256(
  toHex('VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,uint256 candidateId,uint8 voteType,uint256 votingAmt)')
);

const USER_BATCH_TYPEHASH = keccak256(
  toHex('UserBatch(address user,uint256 userNonce,bytes32 recordsHash)')
);

const BATCH_TYPEHASH = keccak256(
  toHex('Batch(uint256 batchNonce)')
);

/**
 * Compute the EIP-712 domain separator.
 * @returns {string} The domain separator hash
 */
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
        DOMAIN.verifyingContract,
      ]
    )
  );
}

// =============================================================================
// Signing Functions
// =============================================================================

/**
 * Compute the EIP-712 struct hash for a VoteRecord.
 * @param {Object} record - The vote record object
 * @returns {string} The keccak256 hash of the encoded record
 */
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

/**
 * Sign a UserBatch using EIP-712 typed data signing.
 * Each user signs their own batch of vote records.
 *
 * @param {Object} account - viem account object (from privateKeyToAccount)
 * @param {number} userNonce - Unique nonce for this user's batch
 * @param {string[]} recordDigests - Array of VoteRecord hashes
 * @returns {Promise<string>} The signature bytes
 */
async function signUserBatch(account, userNonce, recordDigests) {
  // Hash all record digests into a single recordsHash
  const recordsHash = keccak256(encodePacked(['bytes32[]'], [recordDigests]));

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

/**
 * Sign a Batch using EIP-712 typed data signing.
 * The Executor signs to authorize the entire batch submission.
 *
 * @param {Object} executorAccount - viem account object for the executor
 * @param {number} batchNonce - Unique nonce for this batch
 * @returns {Promise<string>} The signature bytes
 */
async function signBatch(executorAccount, batchNonce) {
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

// =============================================================================
// Main Generator Function
// =============================================================================

/**
 * Main function to generate stress test data.
 * Creates users, vote records, and all required signatures.
 */
async function generateStressTest() {
  console.log('[INFO] Starting stress test data generation (viem)...\n');

  // -------------------------------------------------------------------------
  // Step 1: Generate random user accounts (for testing only)
  // -------------------------------------------------------------------------
  const userAccounts = [];
  for (let i = 0; i < CONFIG.userCount; i++) {
    const randomHex =
      '0x' +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
    const account = privateKeyToAccount(randomHex);
    userAccounts.push(account);
  }
  console.log(`[OK] Created ${CONFIG.userCount} user accounts`);

  // -------------------------------------------------------------------------
  // Step 2: Set up Executor account
  // NOTE: Replace with your own private key for production use
  // -------------------------------------------------------------------------
  const executorAccount = privateKeyToAccount(
    process.env.PRIVATE_KEY || (() => { throw new Error('PRIVATE_KEY required'); })()
  );
  console.log(`[OK] Executor: ${executorAccount.address}`);

  // -------------------------------------------------------------------------
  // Step 3: Generate VoteRecords for each user
  // -------------------------------------------------------------------------
  const now = Math.floor(Date.now() / 1000);
  const allRecords = [];
  const allUserBatchSigs = [];
  let totalVotes = 0;

  for (let userIdx = 0; userIdx < CONFIG.userCount; userIdx++) {
    const userAccount = userAccounts[userIdx];
    const userRecords = [];

    for (let voteIdx = 0; voteIdx < CONFIG.votesPerUser; voteIdx++) {
      // Cycle through Artist-1 to Artist-10
      const candidateId = (voteIdx % 10) + 1;
      // First half: Remember (1), Second half: Forget (0)
      const voteType = voteIdx < CONFIG.votesPerUser / 2 ? 1 : 0;

      const record = {
        timestamp: now + userIdx * 100 + voteIdx,
        missionId: CONFIG.missionId,
        votingId: CONFIG.votingId,
        userAddress: userAccount.address,
        candidateId: candidateId,
        voteType: voteType,
        userId: `stress-user-${userIdx}`,
        votingAmt: 100 + voteIdx,
      };

      userRecords.push(record);
      totalVotes++;
    }

    allRecords.push(userRecords);
  }

  console.log(
    `[OK] Created ${totalVotes} vote records (${CONFIG.userCount} users x ${CONFIG.votesPerUser} votes)`
  );

  // -------------------------------------------------------------------------
  // Step 4: Generate UserBatch signatures for each user
  // -------------------------------------------------------------------------
  for (let userIdx = 0; userIdx < CONFIG.userCount; userIdx++) {
    const userAccount = userAccounts[userIdx];
    const userRecords = allRecords[userIdx];

    // Compute hash digests for all records
    const recordDigests = userRecords.map((record) => hashVoteRecord(record));

    // Sign the UserBatch (using index as nonce for simplicity)
    const userNonce = userIdx;
    const signature = await signUserBatch(userAccount, userNonce, recordDigests);

    allUserBatchSigs.push({
      user: userAccount.address,
      userNonce: userNonce,
      signature: signature,
    });
  }

  console.log(`[OK] Generated ${CONFIG.userCount} user signatures`);

  // -------------------------------------------------------------------------
  // Step 5: Generate Executor (Batch) signature
  // -------------------------------------------------------------------------
  const batchNonce = Math.floor(Math.random() * 1000000);
  const executorSig = await signBatch(executorAccount, batchNonce);
  console.log(`[OK] Generated executor signature (batchNonce: ${batchNonce})`);

  // -------------------------------------------------------------------------
  // Step 6: ABI-encode data for Foundry/viem compatibility
  // -------------------------------------------------------------------------
  const encodedRecords = encodeAbiParameters(
    parseAbiParameters(
      '(uint256,uint256,uint256,address,uint256,uint8,string,uint256)[][]'
    ),
    [
      allRecords.map((userRecords) =>
        userRecords.map((r) => [
          BigInt(r.timestamp),
          BigInt(r.missionId),
          BigInt(r.votingId),
          r.userAddress,
          BigInt(r.candidateId),
          r.voteType,
          r.userId,
          BigInt(r.votingAmt),
        ])
      ),
    ]
  );

  const encodedUserBatchSigs = encodeAbiParameters(
    parseAbiParameters('(address,uint256,bytes)[]'),
    [
      allUserBatchSigs.map((sig) => [
        sig.user,
        BigInt(sig.userNonce),
        sig.signature,
      ]),
    ]
  );

  // -------------------------------------------------------------------------
  // Step 7: Build output JSON structure
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Step 8: Save to file
  // -------------------------------------------------------------------------
  const outputDir = path.join(__dirname, '..', 'stress-artifacts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'stress-test-nested.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  // -------------------------------------------------------------------------
  // Output summary and next steps
  // -------------------------------------------------------------------------
  console.log(`\n[OK] Saved to: ${outputPath}`);
  console.log(`\n[SUMMARY]`);
  console.log(`  - Users: ${CONFIG.userCount}`);
  console.log(`  - Votes per user: ${CONFIG.votesPerUser}`);
  console.log(`  - Total votes: ${totalVotes}`);
  console.log(`  - Batch Nonce: ${batchNonce}`);
  console.log(`\n[NEXT STEPS] Run the following commands to submit:`);
  console.log(`  export STRESS_FILE=stress-artifacts/stress-test-nested.json`);
  console.log(`  export VOTING_ADDRESS=${CONFIG.votingAddress}`);
  console.log(
    `  export PRIVATE_KEY=<YOUR_PRIVATE_KEY>`
  );
  console.log(`  node scripts/submit-stress-viem.mjs`);
}

// =============================================================================
// Entry Point
// =============================================================================
generateStressTest().catch((error) => {
  console.error('[ERROR]', error);
  process.exit(1);
});
