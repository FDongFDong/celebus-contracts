import { describe, expect, it } from 'vitest';
import {
  getAddressExplorerUrl,
  getBlockExplorerUrl,
  getTxExplorerUrl,
} from '../explorer';

describe('explorer utils', () => {
  it('returns opBNB explorer URL by default', () => {
    expect(getTxExplorerUrl('0xabc')).toBe('https://testnet.opbnbscan.com/tx/0xabc');
    expect(getAddressExplorerUrl('0xabc')).toBe(
      'https://testnet.opbnbscan.com/address/0xabc'
    );
  });

  it('returns BSC explorer URL when chainId is 97', () => {
    expect(getTxExplorerUrl('0xabc', 97)).toBe('https://testnet.bscscan.com/tx/0xabc');
    expect(getAddressExplorerUrl('0xabc', 97)).toBe(
      'https://testnet.bscscan.com/address/0xabc'
    );
    expect(getBlockExplorerUrl(123n, 97)).toBe('https://testnet.bscscan.com/block/123');
  });

  it('returns BNB Mainnet explorer URL when chainId is 56', () => {
    expect(getTxExplorerUrl('0xabc', 56)).toBe('https://bscscan.com/tx/0xabc');
    expect(getAddressExplorerUrl('0xabc', 56)).toBe(
      'https://bscscan.com/address/0xabc'
    );
    expect(getBlockExplorerUrl(321n, 56)).toBe('https://bscscan.com/block/321');
  });

  it('returns opBNB Mainnet explorer URL when chainId is 204', () => {
    expect(getTxExplorerUrl('0xabc', 204)).toBe('https://opbnbscan.com/tx/0xabc');
    expect(getAddressExplorerUrl('0xabc', 204)).toBe(
      'https://opbnbscan.com/address/0xabc'
    );
    expect(getBlockExplorerUrl(77, 204)).toBe('https://opbnbscan.com/block/77');
  });

  it('returns null for unsupported chain', () => {
    expect(getTxExplorerUrl('0xabc', 9999)).toBeNull();
    expect(getAddressExplorerUrl('0xabc', 9999)).toBeNull();
    expect(getBlockExplorerUrl(1, 9999)).toBeNull();
  });
});
