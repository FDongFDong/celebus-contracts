import { getChainById } from '@/infrastructure/config/chains';

export const MAINNET_NETWORK_CONFIRM_KEY = 'vibe:network:mainnet-confirmed:v1';

/**
 * 메인넷 여부 판단
 * - testnet 플래그가 false인 체인은 메인넷으로 간주
 * - 지원하지 않는 체인은 false
 */
export function requiresMainnetSafetyConfirm(chainId: number): boolean {
  try {
    const chain = getChainById(chainId);
    return chain.testnet === false;
  } catch {
    return false;
  }
}
