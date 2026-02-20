import { describe, it, expect } from 'vitest';
import { VoteRecord } from '../VoteRecord';
import type { Address } from 'viem';

describe('VoteRecord', () => {
  const validRecord = {
    recordId: 1n,
    timestamp: 1703001600n,
    missionId: 100n,
    votingId: 200n,
    optionId: 1n,
    voteType: 1 as const,
    userId: 'user123',
    votingAmt: 1000n,
  };

  const userAddress: Address = '0x1234567890123456789012345678901234567890';

  describe('생성 테스트', () => {
    it('유효한 데이터로 VoteRecord를 생성할 수 있다', () => {
      const record = new VoteRecord(validRecord);

      expect(record.recordId).toBe(validRecord.recordId);
      expect(record.timestamp).toBe(validRecord.timestamp);
      expect(record.missionId).toBe(validRecord.missionId);
      expect(record.votingId).toBe(validRecord.votingId);
      expect(record.optionId).toBe(validRecord.optionId);
      expect(record.voteType).toBe(validRecord.voteType);
      expect(record.userId).toBe(validRecord.userId);
      expect(record.votingAmt).toBe(validRecord.votingAmt);
    });

    it('voteType은 0(Forget) 또는 1(Remember)만 허용된다', () => {
      const forgetRecord = new VoteRecord({ ...validRecord, voteType: 0 as const });
      expect(forgetRecord.voteType).toBe(0);

      const rememberRecord = new VoteRecord({ ...validRecord, voteType: 1 as const });
      expect(rememberRecord.voteType).toBe(1);
    });
  });

  describe('isValid() 메서드 테스트', () => {
    it('모든 필드가 유효하면 true를 반환한다', () => {
      const record = new VoteRecord(validRecord);
      expect(record.isValid()).toBe(true);
    });

    it('timestamp가 0이면 false를 반환한다', () => {
      const record = new VoteRecord({ ...validRecord, timestamp: 0n });
      expect(record.isValid()).toBe(false);
    });

    it('missionId가 0이면 false를 반환한다', () => {
      const record = new VoteRecord({ ...validRecord, missionId: 0n });
      expect(record.isValid()).toBe(false);
    });

    it('votingId가 0이면 false를 반환한다', () => {
      const record = new VoteRecord({ ...validRecord, votingId: 0n });
      expect(record.isValid()).toBe(false);
    });

    it('optionId가 0이면 false를 반환한다', () => {
      const record = new VoteRecord({ ...validRecord, optionId: 0n });
      expect(record.isValid()).toBe(false);
    });

    it('voteType이 0 또는 1이 아니면 false를 반환한다', () => {
      // @ts-expect-error Testing invalid voteType value
      const record = new VoteRecord({ ...validRecord, voteType: 2 });
      expect(record.isValid()).toBe(false);
    });

    it('userId가 빈 문자열이면 false를 반환한다', () => {
      const record = new VoteRecord({ ...validRecord, userId: '' });
      expect(record.isValid()).toBe(false);
    });

    it('votingAmt가 0이면 false를 반환한다', () => {
      const record = new VoteRecord({ ...validRecord, votingAmt: 0n });
      expect(record.isValid()).toBe(false);
    });
  });

  describe('toTypedData() 메서드 테스트', () => {
    it('EIP-712 서명용 TypedData를 올바르게 생성한다', () => {
      const record = new VoteRecord(validRecord);
      const typedData = record.toTypedData(userAddress);

      // TypedData 구조 검증
      expect(typedData).toHaveProperty('types');
      expect(typedData).toHaveProperty('primaryType');
      expect(typedData).toHaveProperty('message');

      // primaryType 검증
      expect(typedData.primaryType).toBe('VoteRecord');

      // types.VoteRecord 검증 (userId 제외, user address 포함)
      expect(typedData.types.VoteRecord).toBeDefined();
      expect(typedData.types.VoteRecord).toEqual([
        { name: 'timestamp', type: 'uint256' },
        { name: 'missionId', type: 'uint256' },
        { name: 'votingId', type: 'uint256' },
        { name: 'optionId', type: 'uint256' },
        { name: 'voteType', type: 'uint8' },
        { name: 'votingAmt', type: 'uint256' },
        { name: 'user', type: 'address' },
      ]);

      // message 검증 (userId 제외, user address 포함)
      expect(typedData.message).toEqual({
        timestamp: validRecord.timestamp,
        missionId: validRecord.missionId,
        votingId: validRecord.votingId,
        optionId: validRecord.optionId,
        voteType: validRecord.voteType,
        votingAmt: validRecord.votingAmt,
        user: userAddress,
      });
    });

    it('recordId는 서명 데이터에 포함되지 않는다', () => {
      const record = new VoteRecord(validRecord);
      const typedData = record.toTypedData(userAddress);

      // recordId가 types와 message에 없어야 함
      const recordIdInTypes = typedData.types.VoteRecord?.some(
        (field) => field.name === 'recordId'
      );
      expect(recordIdInTypes).toBe(false);
      expect(typedData.message).not.toHaveProperty('recordId');
    });

    it('userId는 서명 데이터에 포함되지 않는다', () => {
      const record = new VoteRecord(validRecord);
      const typedData = record.toTypedData(userAddress);

      // userId가 types와 message에 없어야 함
      const userIdInTypes = typedData.types.VoteRecord?.some(
        (field) => field.name === 'userId'
      );
      expect(userIdInTypes).toBe(false);
      expect(typedData.message).not.toHaveProperty('userId');
    });

    it('user address가 서명 데이터에 포함된다', () => {
      const record = new VoteRecord(validRecord);
      const typedData = record.toTypedData(userAddress);

      // user address가 types와 message에 있어야 함
      const userInTypes = typedData.types.VoteRecord?.some(
        (field) => field.name === 'user' && field.type === 'address'
      );
      expect(userInTypes).toBe(true);
      expect(typedData.message.user).toBe(userAddress);
    });
  });
});
