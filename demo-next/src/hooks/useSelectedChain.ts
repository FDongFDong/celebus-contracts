/**
 * useSelectedChain Hook
 *
 * 전역 선택된 체인 정보와 viem 클라이언트를 제공
 */

import { useMemo } from 'react';
import { createPublicClient, http } from 'viem';
import { useAppStore } from '@/store/useAppStore';
import { getChainById } from '@/infrastructure/config/chains';

/**
 * 현재 선택된 체인과 관련 클라이언트를 반환하는 훅
 */
export function useSelectedChain() {
  const selectedChainId = useAppStore((s) => s.selectedChainId);

  const chain = useMemo(() => getChainById(selectedChainId), [selectedChainId]);

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain,
        transport: http(),
      }),
    [chain]
  );

  return {
    chainId: selectedChainId,
    chain,
    publicClient,
  };
}
