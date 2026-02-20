import { describe, expect, it } from 'vitest';
import type { Address } from '@/domain/types';
import type { UIVoteRecord } from '../types';
import { groupRecordsByUser } from '../groupRecords';

function buildRecord(userIndex: number, id: string): UIVoteRecord {
  return {
    userIndex,
    userAddress: '0x1111111111111111111111111111111111111111' as Address,
    timestamp: `1700000000${id}`,
    missionId: '1',
    votingId: `100${id}`,
    optionId: '1',
    voteType: 1,
    userId: `user-${id}`,
    votingAmt: '100',
  };
}

describe('groupRecordsByUser', () => {
  it('groups records by user index and preserves global index', () => {
    const records: UIVoteRecord[] = [
      buildRecord(0, '0'),
      buildRecord(1, '1'),
      buildRecord(99, '2'),
      buildRecord(0, '3'),
    ];

    const grouped = groupRecordsByUser(records);

    expect(grouped.user1Records).toHaveLength(2);
    expect(grouped.user2Records).toHaveLength(1);
    expect(grouped.customRecords).toHaveLength(1);

    expect(grouped.user1Records.map((r) => r.globalIndex)).toEqual([0, 3]);
    expect(grouped.user2Records.map((r) => r.globalIndex)).toEqual([1]);
    expect(grouped.customRecords.map((r) => r.globalIndex)).toEqual([2]);
  });

  it('ignores unknown user indexes', () => {
    const records = [buildRecord(42, '9')] as UIVoteRecord[];
    const grouped = groupRecordsByUser(records);

    expect(grouped.user1Records).toHaveLength(0);
    expect(grouped.user2Records).toHaveLength(0);
    expect(grouped.customRecords).toHaveLength(0);
  });
});
