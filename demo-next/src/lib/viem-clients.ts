/**
 * Viem Client Factory
 *
 * 현재 선택된 체인에 맞는 Viem client를 생성
 * 네트워크 선택기에서 체인 변경 시 올바른 체인 사용 보장
 */

import { createPublicClient, http, type PublicClient } from 'viem';
import { useAppStore } from '@/store/useAppStore';
import { getChainById } from '@/infrastructure/config/chains';

// 체인별 클라이언트 캐시
const clientCache = new Map<number, PublicClient>();

/**
 * 현재 선택된 체인의 Public Client를 반환
 *
 * @returns PublicClient for the currently selected chain
 */
export function getPublicClient(): PublicClient {
  const { selectedChainId } = useAppStore.getState();

  // 캐시된 클라이언트가 있으면 재사용
  let client = clientCache.get(selectedChainId);
  if (!client) {
    const chain = getChainById(selectedChainId);
    client = createPublicClient({
      chain,
      transport: http(),
    });
    clientCache.set(selectedChainId, client);
  }

  return client;
}

/**
 * 특정 체인의 Public Client를 반환
 *
 * @param chainId - 체인 ID
 * @returns PublicClient for the specified chain
 */
export function getPublicClientForChain(chainId: number): PublicClient {
  let client = clientCache.get(chainId);
  if (!client) {
    const chain = getChainById(chainId);
    client = createPublicClient({
      chain,
      transport: http(),
    });
    clientCache.set(chainId, client);
  }

  return client;
}

/**
 * @deprecated Use getPublicClient() instead for dynamic chain support
 *
 * 이전 버전과의 호환성을 위해 유지하지만,
 * 새 코드에서는 getPublicClient()를 사용해야 합니다.
 */
export const publicClient = (() => {
  // Proxy를 사용하여 항상 현재 선택된 체인의 클라이언트 반환
  return new Proxy({} as PublicClient, {
    get(_target, prop) {
      const client = getPublicClient();
      const value = client[prop as keyof PublicClient];
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    },
  });
})();
