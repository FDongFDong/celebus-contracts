'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import type { Address } from '@/domain/types';
import { useChainClient } from './useChainClient';

const BALANCE_POLL_INTERVAL_MS = 15_000;

function formatNativeBalance(balance: bigint, decimals: number): string {
  const normalized = formatUnits(balance, decimals);
  const [whole, fraction = ''] = normalized.split('.');
  if (!fraction) return whole;

  const trimmed = fraction.slice(0, 4).replace(/0+$/, '');
  return trimmed ? `${whole}.${trimmed}` : whole;
}

interface UseNativeBalanceResult {
  balance: bigint | null;
  formattedBalance: string | null;
  symbol: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useNativeBalance(address: Address | null): UseNativeBalanceResult {
  const { publicClient, chain } = useChainClient();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!address) {
      setBalance(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextBalance = await publicClient.getBalance({ address });
      setBalance(nextBalance);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '잔고 조회 실패');
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    if (!address) {
      setBalance(null);
      setError(null);
      return;
    }

    void refetch();
    const timerId = window.setInterval(() => {
      void refetch();
    }, BALANCE_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timerId);
    };
  }, [address, refetch]);

  const formattedBalance = useMemo(() => {
    if (balance === null) return null;
    return formatNativeBalance(balance, chain.nativeCurrency.decimals);
  }, [balance, chain.nativeCurrency.decimals]);

  return {
    balance,
    formattedBalance,
    symbol: chain.nativeCurrency.symbol,
    isLoading,
    error,
    refetch,
  };
}
