import { describe, expect, it } from 'vitest';
import { isOwnerAddress } from '@/hooks/useErc20AdminActions';

describe('useErc20AdminActions helpers', () => {
  it('matches owner address case-insensitively', () => {
    expect(
      isOwnerAddress(
        '0xAbCDEFabcdefABCDEFabcdefAbcdefABCDEFABCD',
        '0xabcdefABCDEFabcdefABCDEFabcdefabcdefabcd'
      )
    ).toBe(true);
  });

  it('returns false when any address is missing', () => {
    expect(isOwnerAddress(null, '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')).toBe(false);
    expect(isOwnerAddress('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', null)).toBe(false);
  });
});
