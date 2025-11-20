/**
 * EIP-712 Utilities
 * EIP-712 구조화된 데이터 서명 관련 유틸리티 함수들
 */

/**
 * Domain Separator 계산
 * @param {Object} domain - { name, version, chainId, verifyingContract }
 * @returns {string} Domain separator hash
 */
export function calculateDomainSeparator(domain) {
  // EIP712Domain typeHash
  const typeHash = ethers.keccak256(
    ethers.toUtf8Bytes(
      'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
    )
  );

  // Domain 데이터 인코딩
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
 * Struct Hash 계산 (Batch 타입)
 * @param {number} batchNonce - Batch nonce 값
 * @returns {string} Struct hash
 */
export function calculateStructHash(batchNonce) {
  // BATCH_TYPEHASH
  const typeHash = ethers.keccak256(
    ethers.toUtf8Bytes('Batch(uint256 batchNonce)')
  );

  // Batch 데이터 인코딩
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'uint256'],
    [typeHash, batchNonce]
  );

  return ethers.keccak256(encoded);
}

/**
 * Final Digest 계산
 * @param {string} domainSeparator - Domain separator hash
 * @param {string} structHash - Struct hash
 * @returns {string} Final digest (EIP-191 formatted)
 */
export function calculateDigest(domainSeparator, structHash) {
  // EIP-191: \x19\x01 + domainSeparator + structHash
  return ethers.keccak256(
    ethers.solidityPacked(
      ['bytes2', 'bytes32', 'bytes32'],
      ['0x1901', domainSeparator, structHash]
    )
  );
}

/**
 * Vote Record Hash 계산 (userId 제외)
 * @param {Object} record - Vote record 객체
 * @returns {string} Record hash
 */
export function hashVoteRecord(record) {
  // VOTE_RECORD_TYPEHASH (userId 제외)
  const VOTE_RECORD_TYPEHASH = ethers.keccak256(
    ethers.toUtf8Bytes(
      'VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,uint256 candidateId,uint8 voteType,uint256 votingAmt)'
    )
  );

  // Record 데이터 인코딩 (userId 제외)
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'uint256', 'uint256', 'uint256', 'address', 'uint256', 'uint8', 'uint256'],
    [
      VOTE_RECORD_TYPEHASH,
      record.timestamp,
      record.missionId,
      record.votingId,
      record.userAddress,
      record.candidateId,
      record.voteType,
      record.votingAmt
    ]
  );

  return ethers.keccak256(encoded);
}

/**
 * User Batch Hash 계산
 * @param {Array} userRecords - 사용자의 레코드 배열
 * @param {number} userNonce - 사용자 nonce
 * @returns {string} User batch hash
 */
export function hashUserBatch(userRecords, userNonce) {
  // 각 레코드의 해시 계산
  const recordHashes = userRecords.map(record => hashVoteRecord(record));

  // USER_BATCH_TYPEHASH
  const USER_BATCH_TYPEHASH = ethers.keccak256(
    ethers.toUtf8Bytes('UserBatch(bytes32[] recordHashes,uint256 userNonce)')
  );

  // recordHashes 배열 해시
  const recordHashesHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(['bytes32[]'], [recordHashes])
  );

  // UserBatch 데이터 인코딩
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'bytes32', 'uint256'],
    [USER_BATCH_TYPEHASH, recordHashesHash, userNonce]
  );

  return ethers.keccak256(encoded);
}

/**
 * Batch Digest 계산 (모든 사용자 배치)
 * @param {Object} domain - Domain 객체
 * @param {Array} userBatches - 사용자 배치 배열
 * @returns {string} Batch digest
 */
export function calculateBatchDigest(domain, userBatches) {
  const domainSeparator = calculateDomainSeparator(domain);

  // 모든 사용자 배치 해시를 합침
  const userBatchHashes = userBatches.map(batch =>
    hashUserBatch(batch.records, batch.userNonce)
  );

  // Combined hash 계산 (실제 컨트랙트와 동일한 방식)
  const combinedHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32[]'],
      [userBatchHashes]
    )
  );

  return calculateDigest(domainSeparator, combinedHash);
}

/**
 * 계산 과정 설명 생성
 * @param {string} type - 'domain' | 'struct' | 'digest'
 * @param {Object} params - 계산에 사용된 파라미터
 * @returns {string} HTML 설명
 */
export function generateExplanation(type, params) {
  const explanations = {
    domain: `
      <div class="space-y-2 text-sm">
        <p class="font-semibold">1. EIP712Domain TypeHash 계산:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
        </code>

        <p class="font-semibold mt-3">2. Domain 데이터 인코딩:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          abi.encode(
            typeHash,
            keccak256("${params.name}"),
            keccak256("${params.version}"),
            ${params.chainId},
            ${params.verifyingContract}
          )
        </code>

        <p class="font-semibold mt-3">3. 최종 해시:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          keccak256(encoded) = domainSeparator
        </code>
      </div>
    `,

    struct: `
      <div class="space-y-2 text-sm">
        <p class="font-semibold">1. Batch TypeHash 계산:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          keccak256("Batch(uint256 batchNonce)")
        </code>

        <p class="font-semibold mt-3">2. Struct 데이터 인코딩:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          abi.encode(
            typeHash,
            ${params.batchNonce}
          )
        </code>

        <p class="font-semibold mt-3">3. 최종 해시:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          keccak256(encoded) = structHash
        </code>
      </div>
    `,

    digest: `
      <div class="space-y-2 text-sm">
        <p class="font-semibold">EIP-191 형식으로 최종 Digest 생성:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          keccak256(
            "\\x19\\x01" +        // EIP-191 버전 바이트
            domainSeparator +    // 어느 컨트랙트인지
            structHash           // 무슨 데이터인지
          )
        </code>

        <p class="text-xs text-gray-600 mt-2">
          ✅ 이 digest를 Private Key로 ECDSA 서명합니다
        </p>
      </div>
    `
  };

  return explanations[type] || '';
}
