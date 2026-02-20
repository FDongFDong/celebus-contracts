import { describe, expect, it } from 'vitest';
import {
  decryptPrivateKey,
  encryptPrivateKey,
  isValidMnemonic,
  isValidPrivateKey,
  loadEncryptedKey,
  removeEncryptedKey,
  saveEncryptedKey,
} from '../crypto-wallet';

describe('crypto-wallet', () => {
  it('validates private key format', () => {
    expect(
      isValidPrivateKey(
        '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      )
    ).toBe(true);
    expect(isValidPrivateKey('0x1234')).toBe(false);
    expect(isValidPrivateKey('0123456789abcdef')).toBe(false);
  });

  it('validates mnemonic with bip39 wordlist/checksum', () => {
    const valid12 = 'test test test test test test test test test test test junk';
    const invalidChecksum = 'test test test test test test test test test test test test';
    const invalidWord = 'zzzz test test test test test test test test test test junk';
    const words11 = Array(11).fill('test').join(' ');

    expect(isValidMnemonic(valid12)).toBe(true);
    expect(isValidMnemonic(invalidChecksum)).toBe(false);
    expect(isValidMnemonic(invalidWord)).toBe(false);
    expect(isValidMnemonic(words11)).toBe(false);
  });

  it('stores and removes secrets in ephemeral memory store', () => {
    removeEncryptedKey('unit_test_key');

    saveEncryptedKey('unit_test_key', '0xdeadbeef');
    expect(loadEncryptedKey('unit_test_key')).toBe('0xdeadbeef');

    removeEncryptedKey('unit_test_key');
    expect(loadEncryptedKey('unit_test_key')).toBeNull();
  });

  it('does not read from localStorage persistence', () => {
    const storageData = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        setItem: (k: string, v: string) => storageData.set(k, v),
        getItem: (k: string) => storageData.get(k) ?? null,
        removeItem: (k: string) => storageData.delete(k),
      },
    });

    localStorage.setItem('vibe_wallet_unit_test_key', 'persisted');
    expect(loadEncryptedKey('unit_test_key')).toBeNull();
    localStorage.removeItem('vibe_wallet_unit_test_key');
  });

  it('keeps encrypt/decrypt compatibility APIs as pass-through', () => {
    const value = '0xabc123';
    expect(encryptPrivateKey(value)).toBe(value);
    expect(decryptPrivateKey(value)).toBe(value);
  });
});
