import { describe, it, expect } from 'vitest';
import { SubVoteRecord } from '../SubVoteRecord';
import type { SubVoteRecordData } from '../SubVoteRecord';

describe('SubVoteRecord', () => {
  const validData: SubVoteRecordData = {
    recordId: 1n,
    timestamp: 1234567890n,
    missionId: 100n,
    votingId: 200n,
    questionId: 300n,
    optionId: 400n,
    userId: 'user123',
    votingAmt: 1000n,
  };

  describe('constructor', () => {
    it('유효한 데이터로 SubVoteRecord를 생성해야 함', () => {
      const record = new SubVoteRecord(validData);

      expect(record.recordId).toBe(validData.recordId);
      expect(record.timestamp).toBe(validData.timestamp);
      expect(record.missionId).toBe(validData.missionId);
      expect(record.votingId).toBe(validData.votingId);
      expect(record.questionId).toBe(validData.questionId);
      expect(record.optionId).toBe(validData.optionId);
      expect(record.userId).toBe(validData.userId);
      expect(record.votingAmt).toBe(validData.votingAmt);
    });
  });

  describe('isValid', () => {
    it('유효한 레코드에 대해 true를 반환해야 함', () => {
      const record = new SubVoteRecord(validData);
      expect(record.isValid()).toBe(true);
    });

    it('timestamp가 0이면 false를 반환해야 함', () => {
      const record = new SubVoteRecord({ ...validData, timestamp: 0n });
      expect(record.isValid()).toBe(false);
    });

    it('missionId가 0이면 false를 반환해야 함', () => {
      const record = new SubVoteRecord({ ...validData, missionId: 0n });
      expect(record.isValid()).toBe(false);
    });

    it('votingId가 0이면 false를 반환해야 함', () => {
      const record = new SubVoteRecord({ ...validData, votingId: 0n });
      expect(record.isValid()).toBe(false);
    });

    it('questionId가 0이면 false를 반환해야 함', () => {
      const record = new SubVoteRecord({ ...validData, questionId: 0n });
      expect(record.isValid()).toBe(false);
    });

    it('optionId가 0이면 false를 반환해야 함', () => {
      const record = new SubVoteRecord({ ...validData, optionId: 0n });
      expect(record.isValid()).toBe(false);
    });

    it('userId가 빈 문자열이면 false를 반환해야 함', () => {
      const record = new SubVoteRecord({ ...validData, userId: '' });
      expect(record.isValid()).toBe(false);
    });

    it('userId가 공백만 있으면 false를 반환해야 함', () => {
      const record = new SubVoteRecord({ ...validData, userId: '   ' });
      expect(record.isValid()).toBe(false);
    });

    it('votingAmt가 0이면 false를 반환해야 함', () => {
      const record = new SubVoteRecord({ ...validData, votingAmt: 0n });
      expect(record.isValid()).toBe(false);
    });
  });

  describe('toTypedData', () => {
    const userAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;

    it('올바른 TypedData를 생성해야 함', () => {
      const record = new SubVoteRecord(validData);
      const typedData = record.toTypedData(userAddress);

      expect(typedData.primaryType).toBe('SubVoteRecord');
      expect(typedData.types.SubVoteRecord).toHaveLength(7);
      expect(typedData.message.timestamp).toBe(validData.timestamp);
      expect(typedData.message.missionId).toBe(validData.missionId);
      expect(typedData.message.votingId).toBe(validData.votingId);
      expect(typedData.message.questionId).toBe(validData.questionId);
      expect(typedData.message.optionId).toBe(validData.optionId);
      expect(typedData.message.votingAmt).toBe(validData.votingAmt);
      expect(typedData.message.user).toBe(userAddress);
    });

    it('TypedData에 올바른 타입 정의가 포함되어야 함', () => {
      const record = new SubVoteRecord(validData);
      const typedData = record.toTypedData(userAddress);

      expect(typedData.types.SubVoteRecord).toContainEqual({
        name: 'timestamp',
        type: 'uint256',
      });
      expect(typedData.types.SubVoteRecord).toContainEqual({
        name: 'missionId',
        type: 'uint256',
      });
      expect(typedData.types.SubVoteRecord).toContainEqual({
        name: 'votingId',
        type: 'uint256',
      });
      expect(typedData.types.SubVoteRecord).toContainEqual({
        name: 'questionId',
        type: 'uint256',
      });
      expect(typedData.types.SubVoteRecord).toContainEqual({
        name: 'optionId',
        type: 'uint256',
      });
      expect(typedData.types.SubVoteRecord).toContainEqual({
        name: 'votingAmt',
        type: 'uint256',
      });
      expect(typedData.types.SubVoteRecord).toContainEqual({ name: 'user', type: 'address' });
    });

    it('recordId와 userId는 TypedData에 포함되지 않아야 함', () => {
      const record = new SubVoteRecord(validData);
      const typedData = record.toTypedData(userAddress);

      const typeNames = typedData.types.SubVoteRecord.map((t) => t.name);
      expect(typeNames).not.toContain('recordId');
      expect(typeNames).not.toContain('userId');
    });

    it('voteType는 SubVoteRecord에 포함되지 않아야 함', () => {
      const record = new SubVoteRecord(validData);
      const typedData = record.toTypedData(userAddress);

      const typeNames = typedData.types.SubVoteRecord.map((t) => t.name);
      expect(typeNames).not.toContain('voteType');
    });

    it('questionId는 TypedData에 포함되어야 함', () => {
      const record = new SubVoteRecord(validData);
      const typedData = record.toTypedData(userAddress);

      expect(typedData.message.questionId).toBe(validData.questionId);
      expect(typedData.types.SubVoteRecord).toContainEqual({
        name: 'questionId',
        type: 'uint256',
      });
    });
  });
});
