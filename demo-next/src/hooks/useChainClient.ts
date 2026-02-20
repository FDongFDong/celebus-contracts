'use client';

/**
 * 현재 선택된 체인의 PublicClient를 제공하는 훅
 *
 * 기존 useSelectedChain + viem-clients.ts의 중복을 통합.
 * useAppStore의 selectedChainId 기반으로 동적 체인 클라이언트 생성.
 */

import { useMemo } from 'react';
import { createPublicClient, http } from 'viem';
import { useAppStore } from '@/store/useAppStore';
import { getChainById } from '@/infrastructure/config/chains';

export function useChainClient() {
  const selectedChainId = useAppStore((s) => s.selectedChainId);

  const chain = useMemo(() => getChainById(selectedChainId), [selectedChainId]);

  const publicClient = useMemo(
    () => createPublicClient({ chain, transport: http() }),
    [chain]
  );

  return { publicClient, chain, chainId: selectedChainId };
}
