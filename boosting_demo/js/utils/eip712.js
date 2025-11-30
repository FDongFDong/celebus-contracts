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
 * Boost Record Hash 계산 (userAddress 제거됨 - SubVoting 패턴)
 * @param {Object} record - Boost record 객체
 * @returns {string} Record hash
 */
export function hashBoostRecord(record) {
  // BOOST_RECORD_TYPEHASH (userAddress 제거 - SubVoting 패턴과 동일)
  const BOOST_RECORD_TYPEHASH = ethers.keccak256(
    ethers.toUtf8Bytes(
      'BoostRecord(uint256 timestamp,uint256 missionId,uint256 boostingId,uint256 optionId,uint8 boostingWith,uint256 amt)'
    )
  );

  // Record 데이터 인코딩 (userAddress 제거, optionId = artistId)
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'uint256', 'uint256', 'uint256', 'uint256', 'uint8', 'uint256'],
    [
      BOOST_RECORD_TYPEHASH,
      record.timestamp,
      record.missionId,
      record.boostingId,
      record.artistId, // optionId
      record.boostingWith, // 0=CELB, 1=BP
      record.amt
    ]
  );

  return ethers.keccak256(encoded);
}

/**
 * User Signature Hash 계산 (1투표 1서명 패턴)
 * @param {string} user - 사용자 주소
 * @param {number} userNonce - 사용자 nonce
 * @param {string} recordHash - 개별 레코드 해시
 * @returns {string} User signature struct hash
 */
export function hashUserSig(user, userNonce, recordHash) {
  // USER_SIG_TYPEHASH (Boosting 컨트랙트 패턴)
  const USER_SIG_TYPEHASH = ethers.keccak256(
    ethers.toUtf8Bytes('UserSig(address user,uint256 userNonce,bytes32 recordHash)')
  );

  // UserSig 데이터 인코딩
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'address', 'uint256', 'bytes32'],
    [USER_SIG_TYPEHASH, user, userNonce, recordHash]
  );

  return ethers.keccak256(encoded);
}

/**
 * User Signature Digest 계산 (EIP-712 형식)
 * @param {Object} domain - Domain 객체
 * @param {string} user - 사용자 주소
 * @param {number} userNonce - 사용자 nonce
 * @param {string} recordHash - 개별 레코드 해시
 * @returns {string} User signature digest
 */
export function calculateUserSigDigest(domain, user, userNonce, recordHash) {
  const domainSeparator = calculateDomainSeparator(domain);
  const userSigHash = hashUserSig(user, userNonce, recordHash);

  return calculateDigest(domainSeparator, userSigHash);
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
