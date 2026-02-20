/**
 * GenerateDigestUseCase - EIP-712 Digest 생성 유스케이스
 *
 * Application Layer의 Use Case로, Domain Service를 사용하여
 * Executor와 User의 Batch Digest를 생성합니다.
 */

import type { Hash, Result, Address } from '../../domain/types';
import { success } from '../../domain/types';
import { DigestService, type VoteRecord } from '../../domain/services/DigestService';
import { EIP712Domain } from '../../domain/value-objects/EIP712Domain';
import { keccak256, encodeAbiParameters, toBytes } from 'viem';

/**
 * GenerateDigestUseCase
 *
 * EIP-712 표준에 따라 다음 두 가지 Digest를 생성합니다:
 * 1. Executor Batch Digest - Executor의 배치 서명용
 * 2. User Batch Digest - User의 배치 서명용
 */
export class GenerateDigestUseCase {
  /**
   * Executor Batch Digest 생성
   *
   * @param domain - EIP-712 Domain 객체
   * @param batchNonce - 배치 논스 값
   * @returns Result<Hash, Error> - 생성된 digest 해시
   *
   * 계산 과정:
   * 1. Domain Separator 계산
   * 2. Batch Struct Hash 계산
   * 3. Final Digest 계산 (EIP-191)
   */
  executeExecutorDigest(
    domain: EIP712Domain,
    batchNonce: bigint
  ): Result<Hash, Error> {
    // 1. Domain Separator 계산
    const domainSeparator = domain.calculateDomainSeparator();

    // 2. Batch Struct Hash 계산
    const structHash = DigestService.calculateStructHash(batchNonce);

    // 3. Final Digest 계산
    const digest = DigestService.calculateDigest(domainSeparator, structHash);

    return success(digest);
  }

  /**
   * User Batch Digest 생성
   *
   * @param domain - EIP-712 Domain 객체
   * @param records - VoteRecord 배열
   * @param userAddress - 사용자 지갑 주소
   * @param userNonce - 사용자 논스 값
   * @returns Result<Hash, Error> - 생성된 digest 해시
   *
   * 계산 과정:
   * 1. Domain Separator 계산
   * 2. 각 VoteRecord의 해시 계산
   * 3. Record 해시들을 결합하여 배열 해시 생성
   * 4. UserBatch Struct Hash 계산
   * 5. Final Digest 계산 (EIP-191)
   */
  executeUserDigest(
    domain: EIP712Domain,
    records: VoteRecord[],
    userAddress: Address,
    userNonce: bigint
  ): Result<Hash, Error> {
    // 1. Domain Separator 계산
    const domainSeparator = domain.calculateDomainSeparator();

    // 2. 각 VoteRecord의 해시 계산
    const recordHashes = records.map((record) =>
      DigestService.hashVoteRecord(record, userAddress)
    );

    // 3. Record 해시 배열의 해시 계산
    const recordsHash = this.hashRecordArray(recordHashes);

    // 4. UserBatch Struct Hash 계산
    const structHash = this.calculateUserBatchStructHash(recordsHash, userNonce);

    // 5. Final Digest 계산
    const digest = DigestService.calculateDigest(domainSeparator, structHash);

    return success(digest);
  }

  /**
   * VoteRecord 해시 배열을 단일 해시로 변환
   *
   * @param recordHashes - VoteRecord 해시 배열
   * @returns 배열의 keccak256 해시
   *
   * Solidity: keccak256(abi.encodePacked(recordHashes))
   */
  private hashRecordArray(recordHashes: Hash[]): Hash {
    if (recordHashes.length === 0) {
      // 빈 배열의 해시
      return keccak256(new Uint8Array(0));
    }

    // abi.encodePacked(recordHashes) 구현
    const encoded = encodeAbiParameters(
      recordHashes.map(() => ({ type: 'bytes32' })),
      recordHashes
    );

    return keccak256(encoded);
  }

  /**
   * UserBatch Struct Hash 계산
   *
   * @param recordsHash - VoteRecord 배열의 해시
   * @param userNonce - 사용자 논스
   * @returns UserBatch struct hash
   *
   * 계산 과정:
   * 1. USER_BATCH_TYPEHASH = keccak256("UserBatch(bytes32 recordsHash,uint256 userNonce)")
   * 2. encoded = abi.encode(USER_BATCH_TYPEHASH, recordsHash, userNonce)
   * 3. structHash = keccak256(encoded)
   */
  private calculateUserBatchStructHash(
    recordsHash: Hash,
    userNonce: bigint
  ): Hash {
    // 1. USER_BATCH_TYPEHASH 계산
    const typeHash = keccak256(
      toBytes('UserBatch(bytes32 recordsHash,uint256 userNonce)')
    );

    // 2. UserBatch 데이터 인코딩
    const encoded = encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'bytes32' }, { type: 'uint256' }],
      [typeHash, recordsHash, userNonce]
    );

    // 3. 최종 해시
    return keccak256(encoded);
  }
}
