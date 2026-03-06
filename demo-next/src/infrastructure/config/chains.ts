/**
 * Infrastructure Layer - Chain Configurations
 *
 * 지원하는 블록체인 네트워크 설정
 */

import { defineChain } from 'viem';
import { foundry } from 'viem/chains';

/**
 * BNB Mainnet 체인 정의 (L1)
 * @see https://docs.bnbchain.org/bnb-smart-chain/developers/network/
 */
export const bscMainnet = defineChain({
  id: 56,
  name: 'BNB Smart Chain',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        'https://bsc-dataseed.bnbchain.org',
        'https://bsc-dataseed1.bnbchain.org',
        'https://bsc-rpc.publicnode.com',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'BscScan',
      url: 'https://bscscan.com',
    },
  },
  testnet: false,
});

/**
 * opBNB Mainnet 체인 정의 (L2)
 * @see https://docs.bnbchain.org/bnb-opbnb/get-started/network-info
 */
export const opBNBMainnet = defineChain({
  id: 204,
  name: 'opBNB Mainnet',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        'https://opbnb-mainnet-rpc.bnbchain.org',
        'https://opbnb-rpc.publicnode.com',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'opBNBScan',
      url: 'https://opbnbscan.com',
    },
  },
  testnet: false,
});

/**
 * opBNB Testnet 체인 정의 (L2)
 * @see https://docs.bnbchain.org/bnb-opbnb/get-started/network-info
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
 * BSC Testnet 체인 정의 (L1)
 * @see https://docs.bnbchain.org/bnb-smart-chain/developers/network/
 */
export const bscTestnet = defineChain({
  id: 97,
  name: 'BSC Testnet',
  nativeCurrency: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        'https://data-seed-prebsc-1-s1.bnbchain.org:8545', // BNB Chain 공식
        'https://data-seed-prebsc-2-s1.bnbchain.org:8545', // BNB Chain 공식 백업
        'https://bsc-testnet-rpc.publicnode.com', // PublicNode
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'BscScan Testnet',
      url: 'https://testnet.bscscan.com',
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
  bscMainnet,
  opBNBMainnet,
  opBNBTestnet,
  bscTestnet,
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

/**
 * 네트워크 선택기에서 사용할 체인 목록
 * Anvil은 로컬 테스트용이므로 제외
 */
export const selectableChains = [
  bscMainnet,
  opBNBMainnet,
  bscTestnet,
  opBNBTestnet,
] as const;

/**
 * MetaMask에 네트워크 추가/전환 요청
 */
export async function switchNetwork(chainId: number): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('지갑을 찾을 수 없습니다');
  }

  const chain = getChainById(chainId);
  const chainIdHex = `0x${chainId.toString(16)}`;

  try {
    // 네트워크 전환 시도
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError) {
    // 네트워크가 없으면 추가
    if ((switchError as { code?: number })?.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: chainIdHex,
            chainName: chain.name,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: chain.rpcUrls.default.http,
            blockExplorerUrls: chain.blockExplorers
              ? [chain.blockExplorers.default.url]
              : undefined,
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}
