/**
 * EIP-712 Utilities for SubVoting
 * SubVoting 컨트랙트의 EIP-712 구조화된 데이터 서명
 *
 * SubVoting 특성 (N:1 구조):
 * - 1 유저 = 1 서명 (여러 레코드를 한 번에 서명)
 * - VoteRecord: timestamp, missionId, votingId, questionId, optionId, votingAmt, userId, user
 * - UserBatch: user, userNonce, recordsHash
 */

/**
 * Domain Separator 계산
 */
export function calculateDomainSeparator(domain) {
  const typeHash = ethers.keccak256(
    ethers.toUtf8Bytes(
      'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
    )
  );

  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
    [
      typeHash,
      ethers.keccak256(ethers.toUtf8Bytes(domain.name)),
      ethers.keccak256(ethers.toUtf8Bytes(domain.version)),
      domain.chainId,
      domain.verifyingContract
    ]
  );

  return ethers.keccak256(encoded);
}

/**
 * Batch Struct Hash 계산 (Executor 서명용)
 *
 * ⚠️ SubVoting.sol BATCH_TYPEHASH:
 * "Batch(uint256 batchNonce)"
 */
export function calculateBatchStructHash(batchNonce) {
  const typeHash = ethers.keccak256(
    ethers.toUtf8Bytes('Batch(uint256 batchNonce)')
  );

  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'uint256'],
    [typeHash, batchNonce]
  );

  return ethers.keccak256(encoded);
}

/**
 * Final Digest 계산
 */
export function calculateDigest(domainSeparator, structHash) {
  return ethers.keccak256(
    ethers.solidityPacked(
      ['bytes2', 'bytes32', 'bytes32'],
      ['0x1901', domainSeparator, structHash]
    )
  );
}

/**
 * Vote Record Hash 계산
 *
 * ⚠️ SubVoting.sol VOTE_RECORD_TYPEHASH:
 * "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 questionId,uint256 optionId,uint256 votingAmt,address user)"
 *
 * 참고: userId는 서명 대상에서 제외됩니다.
 *   - 프론트엔드에서 userId 없이 서명 가능
 *   - 백엔드가 DB에서 userId를 조회하여 VoteRecord에 주입
 *   - 온체인 저장 및 조회 시에만 userId 사용
 */
export function hashVoteRecord(record, userAddress) {
  const VOTE_RECORD_TYPEHASH = ethers.keccak256(
    ethers.toUtf8Bytes(
      'VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 questionId,uint256 optionId,uint256 votingAmt,address user)'
    )
  );

  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'address'],
    [
      VOTE_RECORD_TYPEHASH,
      record.timestamp,
      record.missionId,
      record.votingId,
      record.questionId,
      record.optionId,
      record.votingAmt,
      userAddress
    ]
  );

  return ethers.keccak256(encoded);
}

/**
 * 여러 레코드 해시를 통합하여 recordsHash 생성
 * recordsHash = keccak256(abi.encodePacked([hash0, hash1, ...]))
 */
export function hashRecordsArray(recordHashes) {
  return ethers.keccak256(
    ethers.solidityPacked(
      recordHashes.map(() => 'bytes32'),
      recordHashes
    )
  );
}

/**
 * User Batch Hash 계산
 *
 * ⚠️ SubVoting.sol USER_BATCH_TYPEHASH:
 * "UserBatch(address user,uint256 userNonce,bytes32 recordsHash)"
 */
export function hashUserBatch(userAddress, userNonce, recordsHash) {
  const USER_BATCH_TYPEHASH = ethers.keccak256(
    ethers.toUtf8Bytes('UserBatch(address user,uint256 userNonce,bytes32 recordsHash)')
  );

  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'address', 'uint256', 'bytes32'],
    [USER_BATCH_TYPEHASH, userAddress, userNonce, recordsHash]
  );

  return ethers.keccak256(encoded);
}

/**
 * 사용자 배치 서명용 Digest 계산 (N:1 구조)
 * 여러 레코드를 한 번에 서명
 */
export function calculateUserBatchDigest(domain, records, userAddress, userNonce) {
  const domainSeparator = calculateDomainSeparator(domain);

  // 1. 각 레코드의 해시 계산
  const recordHashes = records.map(r => hashVoteRecord(r, userAddress));

  // 2. recordsHash 통합
  const recordsHash = hashRecordsArray(recordHashes);

  // 3. UserBatch 해시 생성
  const userBatchHash = hashUserBatch(userAddress, userNonce, recordsHash);

  // 4. EIP-712 다이제스트
  const digest = calculateDigest(domainSeparator, userBatchHash);

  return { domainSeparator, recordHashes, recordsHash, userBatchHash, digest };
}

/**
 * Executor 서명용 Digest 계산
 */
export function calculateExecutorDigest(domain, batchNonce) {
  const domainSeparator = calculateDomainSeparator(domain);
  const structHash = calculateBatchStructHash(batchNonce);
  const digest = calculateDigest(domainSeparator, structHash);

  return { domainSeparator, structHash, digest };
}

/**
 * 계산 과정 설명 생성
 */
export function generateExplanation(type, params) {
  const explanations = {
    domain: `
      <div class="space-y-2 text-sm">
        <p class="font-semibold">1. EIP712Domain TypeHash:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
        </code>
        <p class="font-semibold mt-3">2. Domain 인코딩:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          abi.encode(typeHash, keccak256("${params.name}"), keccak256("${params.version}"), ${params.chainId}, ${params.verifyingContract})
        </code>
      </div>
    `,

    record: `
      <div class="space-y-2 text-sm">
        <p class="font-semibold">VoteRecord TypeHash:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 questionId,uint256 optionId,uint256 votingAmt,address user)"
        </code>
        <p class="text-xs text-blue-600 mt-2">⚠️ userId는 서명 대상 제외 (백엔드가 주입)</p>
      </div>
    `,

    userBatch: `
      <div class="space-y-2 text-sm">
        <p class="font-semibold">UserBatch TypeHash:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          "UserBatch(address user,uint256 userNonce,bytes32 recordsHash)"
        </code>
        <p class="text-xs text-green-600 mt-2">✅ N 레코드 = 1 서명 (recordsHash로 통합)</p>
      </div>
    `,

    batch: `
      <div class="space-y-2 text-sm">
        <p class="font-semibold">Batch TypeHash:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          keccak256("Batch(uint256 batchNonce)")
        </code>
      </div>
    `,

    digest: `
      <div class="space-y-2 text-sm">
        <p class="font-semibold">EIP-191 Digest:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          keccak256("\\x19\\x01" + domainSeparator + structHash)
        </code>
        <p class="text-xs text-gray-600 mt-2">✅ 이 digest를 ECDSA 서명</p>
      </div>
    `
  };

  return explanations[type] || '';
}
