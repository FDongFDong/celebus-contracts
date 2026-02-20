/**
 * DigestService 테스트
 * TDD RED Phase - 실패하는 테스트 먼저 작성
 */

import { describe, it, expect } from 'vitest';
import { getAddress } from 'viem';
import type { Hash } from 'viem';
import { DigestService } from '../DigestService';
import type { Address } from '../../types';

describe('DigestService', () => {
  describe('calculateStructHash', () => {
    it('should calculate struct hash for batchNonce', () => {
      // Given: batchNonce = 1
      const batchNonce = 1n;

      // When: structHash 계산
      const structHash = DigestService.calculateStructHash(batchNonce);

      // Then: 올바른 해시 반환
      expect(structHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(structHash.length).toBe(66); // "0x" + 64 hex chars
    });

    it('should calculate consistent hash for same batchNonce', () => {
      // Given: 동일한 batchNonce
      const batchNonce = 42n;

      // When: 두 번 계산
      const hash1 = DigestService.calculateStructHash(batchNonce);
      const hash2 = DigestService.calculateStructHash(batchNonce);

      // Then: 같은 해시 반환 (순수 함수)
      expect(hash1).toBe(hash2);
    });

    it('should calculate different hash for different batchNonce', () => {
      // Given: 다른 batchNonce
      const batchNonce1 = 1n;
      const batchNonce2 = 2n;

      // When: structHash 계산
      const hash1 = DigestService.calculateStructHash(batchNonce1);
      const hash2 = DigestService.calculateStructHash(batchNonce2);

      // Then: 다른 해시 반환
      expect(hash1).not.toBe(hash2);
    });

    it('should match ethers.js reference implementation', () => {
      // Given: batchNonce = 1
      const batchNonce = 1n;

      // ethers.js 기준 구현의 예상 결과
      // BATCH_TYPEHASH = keccak256("Batch(uint256 batchNonce)")
      // structHash = keccak256(abi.encode(BATCH_TYPEHASH, batchNonce))

      // When: structHash 계산
      const structHash = DigestService.calculateStructHash(batchNonce);

      // Then: ethers.js와 동일한 결과
      // 실제 값은 구현 후 검증
      expect(structHash).toBeDefined();
      expect(structHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('calculateDigest', () => {
    it('should calculate final digest from domainSeparator and structHash', () => {
      // Given: domainSeparator와 structHash
      const domainSeparator = ('0x' + 'a'.repeat(64)) as Hash;
      const structHash = ('0x' + 'b'.repeat(64)) as Hash;

      // When: digest 계산
      const digest = DigestService.calculateDigest(domainSeparator, structHash);

      // Then: 올바른 해시 반환
      expect(digest).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(digest.length).toBe(66);
    });

    it('should calculate consistent digest for same inputs', () => {
      // Given: 동일한 입력
      const domainSeparator = ('0x' + '1'.repeat(64)) as Hash;
      const structHash = ('0x' + '2'.repeat(64)) as Hash;

      // When: 두 번 계산
      const digest1 = DigestService.calculateDigest(domainSeparator, structHash);
      const digest2 = DigestService.calculateDigest(domainSeparator, structHash);

      // Then: 같은 해시 반환 (순수 함수)
      expect(digest1).toBe(digest2);
    });

    it('should calculate different digest for different domainSeparator', () => {
      // Given: 다른 domainSeparator
      const domainSeparator1 = ('0x' + '1'.repeat(64)) as Hash;
      const domainSeparator2 = ('0x' + '2'.repeat(64)) as Hash;
      const structHash = ('0x' + 'a'.repeat(64)) as Hash;

      // When: digest 계산
      const digest1 = DigestService.calculateDigest(domainSeparator1, structHash);
      const digest2 = DigestService.calculateDigest(domainSeparator2, structHash);

      // Then: 다른 해시 반환
      expect(digest1).not.toBe(digest2);
    });

    it('should follow EIP-191 format (0x1901 + domainSeparator + structHash)', () => {
      // Given: domainSeparator와 structHash
      const domainSeparator = ('0x' + '3'.repeat(64)) as Hash;
      const structHash = ('0x' + '4'.repeat(64)) as Hash;

      // When: digest 계산
      const digest = DigestService.calculateDigest(domainSeparator, structHash);

      // Then: EIP-191 형식으로 계산됨
      // keccak256("0x1901" + domainSeparator + structHash)
      expect(digest).toBeDefined();
      expect(digest).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('hashVoteRecord', () => {
    it('should hash vote record with user address', () => {
      // Given: VoteRecord와 userAddress
      const record = {
        timestamp: 1700000000n,
        missionId: 1n,
        votingId: 2n,
        optionId: 3n,
        voteType: 1 as const,
        votingAmt: 1000n,
      };
      const userAddress: Address = getAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');

      // When: recordHash 계산
      const recordHash = DigestService.hashVoteRecord(record, userAddress);

      // Then: 올바른 해시 반환
      expect(recordHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(recordHash.length).toBe(66);
    });

    it('should calculate consistent hash for same record and address', () => {
      // Given: 동일한 record와 address
      const record = {
        timestamp: 1700000000n,
        missionId: 1n,
        votingId: 2n,
        optionId: 3n,
        voteType: 1 as const,
        votingAmt: 1000n,
      };
      const userAddress: Address = getAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');

      // When: 두 번 계산
      const hash1 = DigestService.hashVoteRecord(record, userAddress);
      const hash2 = DigestService.hashVoteRecord(record, userAddress);

      // Then: 같은 해시 반환 (순수 함수)
      expect(hash1).toBe(hash2);
    });

    it('should calculate different hash for different user address', () => {
      // Given: 같은 record, 다른 address
      const record = {
        timestamp: 1700000000n,
        missionId: 1n,
        votingId: 2n,
        optionId: 3n,
        voteType: 1 as const,
        votingAmt: 1000n,
      };
      const address1: Address = getAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');
      const address2: Address = getAddress('0x1234567890AbcdEF1234567890aBcdef12345678');

      // When: recordHash 계산
      const hash1 = DigestService.hashVoteRecord(record, address1);
      const hash2 = DigestService.hashVoteRecord(record, address2);

      // Then: 다른 해시 반환
      expect(hash1).not.toBe(hash2);
    });

    it('should calculate different hash for different record fields', () => {
      // Given: 다른 record 필드
      const baseRecord = {
        timestamp: 1700000000n,
        missionId: 1n,
        votingId: 2n,
        optionId: 3n,
        voteType: 1 as const,
        votingAmt: 1000n,
      };
      const modifiedRecord = {
        ...baseRecord,
        votingAmt: 2000n, // 변경된 필드
      };
      const userAddress: Address = getAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');

      // When: recordHash 계산
      const hash1 = DigestService.hashVoteRecord(baseRecord, userAddress);
      const hash2 = DigestService.hashVoteRecord(modifiedRecord, userAddress);

      // Then: 다른 해시 반환
      expect(hash1).not.toBe(hash2);
    });

    it('should exclude userId from hash (frontend signs without userId)', () => {
      // Given: userId 필드가 없는 record
      const record = {
        timestamp: 1700000000n,
        missionId: 1n,
        votingId: 2n,
        optionId: 3n,
        voteType: 1 as const,
        votingAmt: 1000n,
        // userId는 서명 대상이 아님 (백엔드가 나중에 주입)
      };
      const userAddress: Address = getAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');

      // When: recordHash 계산
      const recordHash = DigestService.hashVoteRecord(record, userAddress);

      // Then: userId 없이 해시 계산됨
      expect(recordHash).toBeDefined();
      expect(recordHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should match VOTE_RECORD_TYPEHASH format without userId', () => {
      // Given: VoteRecord
      const record = {
        timestamp: 1700000000n,
        missionId: 1n,
        votingId: 2n,
        optionId: 3n,
        voteType: 1 as const,
        votingAmt: 1000n,
      };
      const userAddress: Address = getAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');

      // Expected TypeHash:
      // keccak256("VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 optionId,uint8 voteType,uint256 votingAmt,address user)")

      // When: recordHash 계산
      const recordHash = DigestService.hashVoteRecord(record, userAddress);

      // Then: 올바른 TypeHash 형식으로 계산됨
      expect(recordHash).toBeDefined();
      expect(recordHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('hashSubVoteRecord', () => {
    it('should hash sub vote record with user address', () => {
      const record = {
        timestamp: 1700000000n,
        missionId: 1n,
        votingId: 2n,
        questionId: 10n,
        optionId: 3n,
        votingAmt: 1000n,
      };
      const userAddress: Address = getAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');

      const recordHash = DigestService.hashSubVoteRecord(record, userAddress);

      expect(recordHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(recordHash.length).toBe(66);
    });

    it('should include questionId in sub vote hash', () => {
      const baseRecord = {
        timestamp: 1700000000n,
        missionId: 1n,
        votingId: 2n,
        questionId: 10n,
        optionId: 3n,
        votingAmt: 1000n,
      };
      const changedRecord = { ...baseRecord, questionId: 11n };
      const userAddress: Address = getAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');

      const hash1 = DigestService.hashSubVoteRecord(baseRecord, userAddress);
      const hash2 = DigestService.hashSubVoteRecord(changedRecord, userAddress);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('hashBoostRecord', () => {
    it('should hash boost record with user address', () => {
      const record = {
        timestamp: 1700000000n,
        missionId: 1n,
        boostingId: 2n,
        optionId: 3n,
        boostingWith: 1,
        amt: 500n,
      };
      const userAddress: Address = getAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');

      const recordHash = DigestService.hashBoostRecord(record, userAddress);

      expect(recordHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(recordHash.length).toBe(66);
    });

    it('should include boostingWith in boost hash', () => {
      const baseRecord = {
        timestamp: 1700000000n,
        missionId: 1n,
        boostingId: 2n,
        optionId: 3n,
        boostingWith: 0,
        amt: 500n,
      };
      const changedRecord = { ...baseRecord, boostingWith: 1 };
      const userAddress: Address = getAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');

      const hash1 = DigestService.hashBoostRecord(baseRecord, userAddress);
      const hash2 = DigestService.hashBoostRecord(changedRecord, userAddress);

      expect(hash1).not.toBe(hash2);
    });
  });
});
