/**
 * useWalletFromPrivateKey Hook
 *
 * Private Key를 입력받아 WalletAdapter 인스턴스를 생성하는 커스텀 훅
 * Private Key 검증 및 에러 처리 포함
 */

import { useState, useEffect } from 'react';
import { WalletAdapter } from '@/infrastructure/viem/WalletAdapter';
import type { Address } from '@/domain/types';

interface UseWalletFromPrivateKeyResult {
  wallet: WalletAdapter | null;
  error: string | null;
  address: Address | null;
  isValid: boolean;
}

/**
 * Private Key로부터 Wallet을 생성하는 훅
 *
 * @param privateKey - Private Key (0x prefix 옵션)
 * @returns Wallet 인스턴스, 에러, 주소, 유효성 상태
 *
 * @example
 * ```tsx
 * const { wallet, error, address, isValid } = useWalletFromPrivateKey(inputValue);
 *
 * if (error) {
 *   return <div>Error: {error}</div>;
 * }
 *
 * if (wallet) {
 *   return <div>Address: {address}</div>;
 * }
 * ```
 */
export function useWalletFromPrivateKey(
  privateKey: string
): UseWalletFromPrivateKeyResult {
  const [wallet, setWallet] = useState<WalletAdapter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<Address | null>(null);

  useEffect(() => {
    // Empty input → reset state
    if (!privateKey || privateKey.trim() === '') {
      setWallet(null);
      setError(null);
      setAddress(null);
      return;
    }

    try {
      // Normalize private key (add 0x prefix if missing)
      let normalizedKey = privateKey.trim();
      if (!normalizedKey.startsWith('0x')) {
        normalizedKey = `0x${normalizedKey}`;
      }

      // Validate length (64 hex chars + 0x prefix = 66)
      if (normalizedKey.length !== 66) {
        throw new Error('Private key must be 64 hex characters (32 bytes)');
      }

      // Validate hex format
      if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedKey)) {
        throw new Error('Invalid private key format (must be hex)');
      }

      // Create wallet
      const newWallet = new WalletAdapter(normalizedKey as `0x${string}`);
      setWallet(newWallet);
      setAddress(newWallet.address);
      setError(null);
    } catch (e) {
      setWallet(null);
      setAddress(null);

      // Extract error message
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Failed to create wallet from private key');
      }
    }
  }, [privateKey]);

  return {
    wallet,
    error,
    address,
    isValid: wallet !== null && error === null,
  };
}

/**
 * Private Key 유효성 검증 전용 훅
 *
 * @param privateKey - Private Key
 * @returns 유효성 여부 및 에러 메시지
 *
 * @example
 * ```tsx
 * const { isValid, error } = useValidatePrivateKey(inputValue);
 * ```
 */
export function useValidatePrivateKey(privateKey: string): {
  isValid: boolean;
  error: string | null;
} {
  const { isValid, error } = useWalletFromPrivateKey(privateKey);
  return { isValid, error };
}
