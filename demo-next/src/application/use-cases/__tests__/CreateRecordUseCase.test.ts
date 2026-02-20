/**
 * CreateRecordUseCase Test
 *
 * TDD RED Phase: 실패하는 테스트 작성
 */

import { describe, it, expect } from 'vitest';
import { CreateRecordUseCase } from '../CreateRecordUseCase';
import type { VoteRecordData, VoteType } from '../../../domain/entities/VoteRecord';

describe('CreateRecordUseCase', () => {
  describe('execute', () => {
    it('유효한 VoteRecord 생성에 성공해야 함', () => {
      // Given
      const useCase = new CreateRecordUseCase();
      const params: VoteRecordData = {
        recordId: 1n,
        timestamp: BigInt(Date.now()),
        missionId: 1n,
        votingId: 1n,
        optionId: 1n,
        voteType: 1 as VoteType, // Remember
        userId: 'user123',
        votingAmt: 100n,
      };

      // When
      const result = useCase.execute(params);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.recordId).toBe(1n);
        expect(result.value.timestamp).toBe(params.timestamp);
        expect(result.value.missionId).toBe(1n);
        expect(result.value.votingId).toBe(1n);
        expect(result.value.optionId).toBe(1n);
        expect(result.value.voteType).toBe(1);
        expect(result.value.userId).toBe('user123');
        expect(result.value.votingAmt).toBe(100n);
      }
    });

    it('timestamp가 0일 때 ValidationError를 반환해야 함', () => {
      // Given
      const useCase = new CreateRecordUseCase();
      const params: VoteRecordData = {
        recordId: 1n,
        timestamp: 0n, // Invalid
        missionId: 1n,
        votingId: 1n,
        optionId: 1n,
        voteType: 1 as VoteType,
        userId: 'user123',
        votingAmt: 100n,
      };

      // When
      const result = useCase.execute(params);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.name).toBe('ValidationError');
        expect(result.error.message).toContain('Invalid VoteRecord');
      }
    });

    it('missionId가 0일 때 ValidationError를 반환해야 함', () => {
      // Given
      const useCase = new CreateRecordUseCase();
      const params: VoteRecordData = {
        recordId: 1n,
        timestamp: BigInt(Date.now()),
        missionId: 0n, // Invalid
        votingId: 1n,
        optionId: 1n,
        voteType: 1 as VoteType,
        userId: 'user123',
        votingAmt: 100n,
      };

      // When
      const result = useCase.execute(params);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.name).toBe('ValidationError');
      }
    });

    it('votingId가 0일 때 ValidationError를 반환해야 함', () => {
      // Given
      const useCase = new CreateRecordUseCase();
      const params: VoteRecordData = {
        recordId: 1n,
        timestamp: BigInt(Date.now()),
        missionId: 1n,
        votingId: 0n, // Invalid
        optionId: 1n,
        voteType: 1 as VoteType,
        userId: 'user123',
        votingAmt: 100n,
      };

      // When
      const result = useCase.execute(params);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.name).toBe('ValidationError');
      }
    });

    it('optionId가 0일 때 ValidationError를 반환해야 함', () => {
      // Given
      const useCase = new CreateRecordUseCase();
      const params: VoteRecordData = {
        recordId: 1n,
        timestamp: BigInt(Date.now()),
        missionId: 1n,
        votingId: 1n,
        optionId: 0n, // Invalid
        voteType: 1 as VoteType,
        userId: 'user123',
        votingAmt: 100n,
      };

      // When
      const result = useCase.execute(params);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.name).toBe('ValidationError');
      }
    });

    it('voteType이 0 또는 1이 아닐 때 ValidationError를 반환해야 함', () => {
      // Given
      const useCase = new CreateRecordUseCase();
      const params: VoteRecordData = {
        recordId: 1n,
        timestamp: BigInt(Date.now()),
        missionId: 1n,
        votingId: 1n,
        optionId: 1n,
        voteType: 2 as VoteType, // Invalid
        userId: 'user123',
        votingAmt: 100n,
      };

      // When
      const result = useCase.execute(params);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.name).toBe('ValidationError');
      }
    });

    it('userId가 빈 문자열일 때 ValidationError를 반환해야 함', () => {
      // Given
      const useCase = new CreateRecordUseCase();
      const params: VoteRecordData = {
        recordId: 1n,
        timestamp: BigInt(Date.now()),
        missionId: 1n,
        votingId: 1n,
        optionId: 1n,
        voteType: 1 as VoteType,
        userId: '', // Invalid
        votingAmt: 100n,
      };

      // When
      const result = useCase.execute(params);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.name).toBe('ValidationError');
      }
    });

    it('votingAmt가 0일 때 ValidationError를 반환해야 함', () => {
      // Given
      const useCase = new CreateRecordUseCase();
      const params: VoteRecordData = {
        recordId: 1n,
        timestamp: BigInt(Date.now()),
        missionId: 1n,
        votingId: 1n,
        optionId: 1n,
        voteType: 1 as VoteType,
        userId: 'user123',
        votingAmt: 0n, // Invalid
      };

      // When
      const result = useCase.execute(params);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.name).toBe('ValidationError');
      }
    });

    it('voteType이 0(Forget)일 때도 정상 동작해야 함', () => {
      // Given
      const useCase = new CreateRecordUseCase();
      const params: VoteRecordData = {
        recordId: 1n,
        timestamp: BigInt(Date.now()),
        missionId: 1n,
        votingId: 1n,
        optionId: 1n,
        voteType: 0 as VoteType, // Forget
        userId: 'user123',
        votingAmt: 100n,
      };

      // When
      const result = useCase.execute(params);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.voteType).toBe(0);
      }
    });
  });
});
