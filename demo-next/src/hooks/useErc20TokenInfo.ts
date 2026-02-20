'use client';

/**
 * 토큰 주소 기반 토큰 정보 자동 조회 훅
 *
 * tokenAddress 변경 시 name, symbol, decimals, totalSupply 조회.
 * ownerAddress 제공 시 balanceOf 추가 조회.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Address } from '@/domain/types';
import { useChainClient } from '@/hooks/useChainClient';
import { ERC20_PERMIT_ABI } from '@/infrastructure/contracts/CelebTokenContract';
import {
  logError,
  getBlockchainErrorMessage,
  isNoDataReadContractError,
} from '@/lib/error-handler';

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
}

interface UseTokenInfoResult {
  tokenInfo: TokenInfo | null;
  balance: bigint | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useErc20TokenInfo(
  tokenAddress: Address | null,
  ownerAddress: Address | null = null
): UseTokenInfoResult {
  const { publicClient } = useChainClient();

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenInfo = useCallback(async () => {
    if (!tokenAddress) {
      setTokenInfo(null);
      setBalance(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const code = await publicClient.getCode({ address: tokenAddress });
      if (!code || code === '0x') {
        setError('해당 주소는 배포된 컨트랙트가 아닙니다');
        setTokenInfo(null);
        setBalance(null);
        return;
      }

      const results = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_PERMIT_ABI,
          functionName: 'name',
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_PERMIT_ABI,
          functionName: 'symbol',
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_PERMIT_ABI,
          functionName: 'decimals',
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_PERMIT_ABI,
          functionName: 'totalSupply',
        }),
      ]);

      const info: TokenInfo = {
        name: results[0] as string,
        symbol: results[1] as string,
        decimals: results[2] as number,
        totalSupply: results[3] as bigint,
      };
      setTokenInfo(info);

      if (ownerAddress) {
        const bal = await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_PERMIT_ABI,
          functionName: 'balanceOf',
          args: [ownerAddress],
        });
        setBalance(bal as bigint);
      }
    } catch (err) {
      if (!isNoDataReadContractError(err)) {
        logError('useErc20TokenInfo', err);
      }
      setError(getBlockchainErrorMessage(err));
      setTokenInfo(null);
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, ownerAddress, publicClient]);

  useEffect(() => {
    void fetchTokenInfo();
  }, [fetchTokenInfo]);

  return { tokenInfo, balance, isLoading, error, refetch: fetchTokenInfo };
}
