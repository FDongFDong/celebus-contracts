/**
 * Infrastructure Layer - Chain Configurations
 *
 * 지원하는 블록체인 네트워크 설정
 */

import { defineChain } from 'viem';
import { foundry } from 'viem/chains';

/**
 * opBNB Testnet 체인 정의
 * @see https://docs.bnbchain.org/opbnb-docs/docs/core-concepts/opbnb-chains
 */
export const opBNBTestnet = defineChain({
  id: 5611,
  name: 'opBNB Testnet',
  nativeCurrency: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://opbnb-testnet-rpc.bnbchain.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'opBNBScan',
      url: 'https://testnet.opbnbscan.com',
    },
  },
  testnet: true,
});

/**
 * Anvil (로컬 테스트 체인)
 * Foundry 기본 체인 사용
 */
export const anvil = foundry;

/**
 * 지원하는 모든 체인
 */
export const supportedChains = {
  opBNBTestnet,
  anvil,
} as const;

/**
 * 체인 ID로 체인 정보 조회
 */
export function getChainById(chainId: number) {
  const chain = Object.values(supportedChains).find((c) => c.id === chainId);
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return chain;
}
