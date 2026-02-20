import { describe, expect, it } from 'vitest';
import type { Address } from '@/domain/types';
import {
  generateTimestamp,
  generateTimestampBasedId,
  generateUserNonce,
  getSelectedUserIndex,
  resolveUserAddress,
} from '../user-step-helpers';

describe('user-step-helpers', () => {
  it('maps selected user value to user index', () => {
    expect(getSelectedUserIndex('0')).toBe(0);
    expect(getSelectedUserIndex('1')).toBe(1);
    expect(getSelectedUserIndex('custom')).toBe(99);
  });

  it('generates deterministic timestamp and ids for a fixed now', () => {
    const now = 1730000000456;

    expect(generateTimestamp(now)).toBe('1730000000456');
    expect(generateTimestampBasedId('0', now)).toBe('000004560');
    expect(generateTimestampBasedId('custom', now)).toBe('0000045699');
    expect(generateUserNonce('0', now)).toBe('4560');
    expect(generateUserNonce('1', now)).toBe('4561');
    expect(generateUserNonce('custom', now)).toBe('4659');
  });

  it('resolves wallet address by selected user index', () => {
    const user1 = '0x1111111111111111111111111111111111111111' as Address;
    const user2 = '0x2222222222222222222222222222222222222222' as Address;
    const custom = '0x9999999999999999999999999999999999999999' as Address;

    expect(resolveUserAddress(0, [user1, user2], custom)).toBe(user1);
    expect(resolveUserAddress(1, [user1, user2], custom)).toBe(user2);
    expect(resolveUserAddress(99, [user1, user2], custom)).toBe(custom);
    expect(resolveUserAddress(99, [user1, user2], null)).toBeNull();
  });
});
