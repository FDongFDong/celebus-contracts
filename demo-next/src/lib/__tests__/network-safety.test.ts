import { describe, expect, it } from 'vitest';
import { requiresMainnetSafetyConfirm } from '../network-safety';

describe('network safety', () => {
  it('returns true for mainnet chains', () => {
    expect(requiresMainnetSafetyConfirm(56)).toBe(true); // BNB Mainnet
    expect(requiresMainnetSafetyConfirm(204)).toBe(true); // opBNB Mainnet
  });

  it('returns false for testnet chains', () => {
    expect(requiresMainnetSafetyConfirm(97)).toBe(false); // BSC Testnet
    expect(requiresMainnetSafetyConfirm(5611)).toBe(false); // opBNB Testnet
  });

  it('returns false for unsupported chain', () => {
    expect(requiresMainnetSafetyConfirm(9999)).toBe(false);
  });
});
