import { describe, it, expect } from 'vitest';
import { BoostRecord } from '../BoostRecord';
import type { BoostRecordData } from '../BoostRecord';

describe('BoostRecord', () => {
  const validData: BoostRecordData = {
    recordId: 1n,
    timestamp: 1234567890n,
    missionId: 100n,
    boostingId: 200n,
    optionId: 300n,
    boostingWith: 0,
    amt: 1000n,
    userId: 'user123',
  };

  describe('constructor', () => {
    it('유효한 데이터로 BoostRecord를 생성해야 함', () => {
      const record = new BoostRecord(validData);

      expect(record.recordId).toBe(validData.recordId);
      expect(record.timestamp).toBe(validData.timestamp);
      expect(record.missionId).toBe(validData.missionId);
      expect(record.boostingId).toBe(validData.boostingId);
      expect(record.optionId).toBe(validData.optionId);
      expect(record.boostingWith).toBe(validData.boostingWith);
      expect(record.amt).toBe(validData.amt);
      expect(record.userId).toBe(validData.userId);
    });

    it('CELB로 부스팅하는 레코드를 생성해야 함', () => {
      const record = new BoostRecord({ ...validData, boostingWith: 1 });
      expect(record.boostingWith).toBe(1);
    });
  });

  describe('isValid', () => {
    it('유효한 레코드에 대해 true를 반환해야 함', () => {
      const record = new BoostRecord(validData);
      expect(record.isValid()).toBe(true);
    });

    it('timestamp가 0이면 false를 반환해야 함', () => {
      const record = new BoostRecord({ ...validData, timestamp: 0n });
      expect(record.isValid()).toBe(false);
    });

    it('missionId가 0이면 false를 반환해야 함', () => {
      const record = new BoostRecord({ ...validData, missionId: 0n });
      expect(record.isValid()).toBe(false);
    });

    it('boostingId가 0이면 false를 반환해야 함', () => {
      const record = new BoostRecord({ ...validData, boostingId: 0n });
      expect(record.isValid()).toBe(false);
    });

    it('optionId가 0이면 false를 반환해야 함', () => {
      const record = new BoostRecord({ ...validData, optionId: 0n });
      expect(record.isValid()).toBe(false);
    });

    it('boostingWith가 0이 아니고 1도 아니면 false를 반환해야 함', () => {
      // @ts-expect-error Testing invalid boostingWith value
      const record = new BoostRecord({ ...validData, boostingWith: 2 });
      expect(record.isValid()).toBe(false);
    });

    it('amt가 0이면 false를 반환해야 함', () => {
      const record = new BoostRecord({ ...validData, amt: 0n });
      expect(record.isValid()).toBe(false);
    });

    it('userId가 빈 문자열이면 false를 반환해야 함', () => {
      const record = new BoostRecord({ ...validData, userId: '' });
      expect(record.isValid()).toBe(false);
    });

    it('userId가 공백만 있으면 false를 반환해야 함', () => {
      const record = new BoostRecord({ ...validData, userId: '   ' });
      expect(record.isValid()).toBe(false);
    });
  });

  describe('toTypedData', () => {
    const userAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;

    it('올바른 TypedData를 생성해야 함', () => {
      const record = new BoostRecord(validData);
      const typedData = record.toTypedData(userAddress);

      expect(typedData.primaryType).toBe('BoostRecord');
      expect(typedData.types.BoostRecord).toHaveLength(7);
      expect(typedData.message.timestamp).toBe(validData.timestamp);
      expect(typedData.message.missionId).toBe(validData.missionId);
      expect(typedData.message.boostingId).toBe(validData.boostingId);
      expect(typedData.message.optionId).toBe(validData.optionId);
      expect(typedData.message.boostingWith).toBe(validData.boostingWith);
      expect(typedData.message.amt).toBe(validData.amt);
      expect(typedData.message.user).toBe(userAddress);
    });

    it('TypedData에 올바른 타입 정의가 포함되어야 함', () => {
      const record = new BoostRecord(validData);
      const typedData = record.toTypedData(userAddress);

      expect(typedData.types.BoostRecord).toContainEqual({
        name: 'timestamp',
        type: 'uint256',
      });
      expect(typedData.types.BoostRecord).toContainEqual({
        name: 'missionId',
        type: 'uint256',
      });
      expect(typedData.types.BoostRecord).toContainEqual({
        name: 'boostingId',
        type: 'uint256',
      });
      expect(typedData.types.BoostRecord).toContainEqual({
        name: 'optionId',
        type: 'uint256',
      });
      expect(typedData.types.BoostRecord).toContainEqual({
        name: 'boostingWith',
        type: 'uint8',
      });
      expect(typedData.types.BoostRecord).toContainEqual({ name: 'amt', type: 'uint256' });
      expect(typedData.types.BoostRecord).toContainEqual({ name: 'user', type: 'address' });
    });

    it('recordId와 userId는 TypedData에 포함되지 않아야 함', () => {
      const record = new BoostRecord(validData);
      const typedData = record.toTypedData(userAddress);

      const typeNames = typedData.types.BoostRecord.map((t) => t.name);
      expect(typeNames).not.toContain('recordId');
      expect(typeNames).not.toContain('userId');
    });

    it('BP로 부스팅하는 경우 TypedData를 생성해야 함', () => {
      const record = new BoostRecord({ ...validData, boostingWith: 0 });
      const typedData = record.toTypedData(userAddress);

      expect(typedData.message.boostingWith).toBe(0);
    });

    it('CELB로 부스팅하는 경우 TypedData를 생성해야 함', () => {
      const record = new BoostRecord({ ...validData, boostingWith: 1 });
      const typedData = record.toTypedData(userAddress);

      expect(typedData.message.boostingWith).toBe(1);
    });
  });
});
