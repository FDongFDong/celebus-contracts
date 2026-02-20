import { describe, expect, it } from 'vitest';
import {
  formatNumberWithCommas,
  formatTokenAmountDisplay,
  formatTxHash,
} from '../format';

describe('formatTxHash', () => {
  it('formats a normal tx hash with default front/back length', () => {
    const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    expect(formatTxHash(txHash)).toBe('0x12345678...90abcdef');
  });

  it('returns original value for short hash', () => {
    const shortHash = '0x1234';
    expect(formatTxHash(shortHash)).toBe(shortHash);
  });

  it('returns "-" for empty value', () => {
    expect(formatTxHash('')).toBe('-');
  });
});

describe('formatNumberWithCommas', () => {
  it('adds comma grouping to integer strings', () => {
    expect(formatNumberWithCommas('5000000000')).toBe('5,000,000,000');
  });

  it('adds comma grouping to decimal strings', () => {
    expect(formatNumberWithCommas('1234567.89')).toBe('1,234,567.89');
  });
});

describe('formatTokenAmountDisplay', () => {
  it('formats token amounts with comma grouping', () => {
    expect(formatTokenAmountDisplay(5000000000n, 0)).toBe('5,000,000,000');
  });
});
