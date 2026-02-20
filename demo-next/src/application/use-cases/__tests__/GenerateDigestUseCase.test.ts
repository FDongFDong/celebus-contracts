/**
 * GenerateDigestUseCase 테스트
 *
 * TDD RED Phase: 실패하는 테스트를 먼저 작성
 */

import { describe, it, expect } from 'vitest';
import { GenerateDigestUseCase } from '../GenerateDigestUseCase';
import { EIP712Domain } from '../../../domain/value-objects/EIP712Domain';
import type { VoteRecord } from '../../../domain/services/DigestService';
import type { Address } from '../../../domain/types';

describe('GenerateDigestUseCase', () => {
  const mockDomain = new EIP712Domain(
    'CelebusVoting',
    '1',
    BigInt(1),
    '0x1234567890123456789012345678901234567890' as Address
  );

  describe('executeExecutorDigest', () => {
    it('Executor Batch Digest를 성공적으로 생성해야 함', () => {
      // Given
      const useCase = new GenerateDigestUseCase();
      const batchNonce = BigInt(1);

      // When
      const result = useCase.executeExecutorDigest(mockDomain, batchNonce);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toMatch(/^0x[a-fA-F0-9]{64}$/);
      }
    });

    it('batchNonce가 0일 때도 정상적으로 digest를 생성해야 함', () => {
      // Given
      const useCase = new GenerateDigestUseCase();
      const batchNonce = BigInt(0);

      // When
      const result = useCase.executeExecutorDigest(mockDomain, batchNonce);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toMatch(/^0x[a-fA-F0-9]{64}$/);
      }
    });

    it('같은 domain과 batchNonce는 같은 digest를 생성해야 함', () => {
      // Given
      const useCase = new GenerateDigestUseCase();
      const batchNonce = BigInt(42);

      // When
      const result1 = useCase.executeExecutorDigest(mockDomain, batchNonce);
      const result2 = useCase.executeExecutorDigest(mockDomain, batchNonce);

      // Then
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.value).toBe(result2.value);
      }
    });

    it('다른 batchNonce는 다른 digest를 생성해야 함', () => {
      // Given
      const useCase = new GenerateDigestUseCase();
      const batchNonce1 = BigInt(1);
      const batchNonce2 = BigInt(2);

      // When
      const result1 = useCase.executeExecutorDigest(mockDomain, batchNonce1);
      const result2 = useCase.executeExecutorDigest(mockDomain, batchNonce2);

      // Then
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.value).not.toBe(result2.value);
      }
    });
  });

  describe('executeUserDigest', () => {
    const mockRecord: VoteRecord = {
      timestamp: BigInt(1704067200),
      missionId: BigInt(1),
      votingId: BigInt(1),
      optionId: BigInt(1),
      voteType: 1,
      votingAmt: BigInt(1000),
    };

    const mockRecords: VoteRecord[] = [mockRecord];
    const userAddress: Address = '0x9876543210987654321098765432109876543210';
    const userNonce = BigInt(1);

    it('User Batch Digest를 성공적으로 생성해야 함', () => {
      // Given
      const useCase = new GenerateDigestUseCase();

      // When
      const result = useCase.executeUserDigest(
        mockDomain,
        mockRecords,
        userAddress,
        userNonce
      );

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toMatch(/^0x[a-fA-F0-9]{64}$/);
      }
    });

    it('빈 records 배열로 digest를 생성해야 함', () => {
      // Given
      const useCase = new GenerateDigestUseCase();
      const emptyRecords: VoteRecord[] = [];

      // When
      const result = useCase.executeUserDigest(
        mockDomain,
        emptyRecords,
        userAddress,
        userNonce
      );

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toMatch(/^0x[a-fA-F0-9]{64}$/);
      }
    });

    it('여러 개의 records로 digest를 생성해야 함', () => {
      // Given
      const useCase = new GenerateDigestUseCase();
      const multipleRecords: VoteRecord[] = [
        mockRecord,
        {
          ...mockRecord,
          timestamp: BigInt(1704067201),
          optionId: BigInt(2),
        },
        {
          ...mockRecord,
          timestamp: BigInt(1704067202),
          optionId: BigInt(3),
        },
      ];

      // When
      const result = useCase.executeUserDigest(
        mockDomain,
        multipleRecords,
        userAddress,
        userNonce
      );

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toMatch(/^0x[a-fA-F0-9]{64}$/);
      }
    });

    it('같은 domain, records, userNonce는 같은 digest를 생성해야 함', () => {
      // Given
      const useCase = new GenerateDigestUseCase();

      // When
      const result1 = useCase.executeUserDigest(
        mockDomain,
        mockRecords,
        userAddress,
        userNonce
      );
      const result2 = useCase.executeUserDigest(
        mockDomain,
        mockRecords,
        userAddress,
        userNonce
      );

      // Then
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.value).toBe(result2.value);
      }
    });

    it('다른 userNonce는 다른 digest를 생성해야 함', () => {
      // Given
      const useCase = new GenerateDigestUseCase();
      const userNonce1 = BigInt(1);
      const userNonce2 = BigInt(2);

      // When
      const result1 = useCase.executeUserDigest(
        mockDomain,
        mockRecords,
        userAddress,
        userNonce1
      );
      const result2 = useCase.executeUserDigest(
        mockDomain,
        mockRecords,
        userAddress,
        userNonce2
      );

      // Then
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.value).not.toBe(result2.value);
      }
    });

    it('다른 records는 다른 digest를 생성해야 함', () => {
      // Given
      const useCase = new GenerateDigestUseCase();
      const records1 = [mockRecord];
      const records2 = [{ ...mockRecord, optionId: BigInt(2) }];

      // When
      const result1 = useCase.executeUserDigest(
        mockDomain,
        records1,
        userAddress,
        userNonce
      );
      const result2 = useCase.executeUserDigest(
        mockDomain,
        records2,
        userAddress,
        userNonce
      );

      // Then
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.value).not.toBe(result2.value);
      }
    });

    it('다른 userAddress는 다른 digest를 생성해야 함', () => {
      // Given
      const useCase = new GenerateDigestUseCase();
      const userAddress1: Address = '0x1111111111111111111111111111111111111111';
      const userAddress2: Address = '0x2222222222222222222222222222222222222222';

      // When
      const result1 = useCase.executeUserDigest(
        mockDomain,
        mockRecords,
        userAddress1,
        userNonce
      );
      const result2 = useCase.executeUserDigest(
        mockDomain,
        mockRecords,
        userAddress2,
        userNonce
      );

      // Then
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.value).not.toBe(result2.value);
      }
    });
  });
});
