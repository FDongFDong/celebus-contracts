import { describe, expect, it } from 'vitest';
import { normalizeArgs, isWithinBlockRange } from '@/hooks/useErc20Query';

describe('useErc20Query helpers', () => {
  it('normalizes decoded args to string map', () => {
    const result = normalizeArgs({
      0: 'ignored',
      from: '0xabc',
      value: 10n,
      ok: true,
      empty: null,
    });

    expect(result).toEqual({
      from: '0xabc',
      value: '10',
      ok: 'true',
      empty: '-',
    });
  });

  it('validates block range with max limit', () => {
    expect(isWithinBlockRange(10n, 510n)).toBe(true);
    expect(isWithinBlockRange(10n, 6000n)).toBe(false);
    expect(isWithinBlockRange(200n, 100n)).toBe(false);
  });
});
