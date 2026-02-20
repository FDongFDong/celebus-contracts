import { createWalletClient, custom, type WalletClient } from 'viem';
import type { Address } from '@/domain/types';
import { getChainById, switchNetwork } from '@/infrastructure/config/chains';
import { useAppStore } from '@/store/useAppStore';

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
};

/**
 * 지갑 미연결 에러
 * - 자동 팝업 대신 에러를 반환하여 UI에서 적절히 처리할 수 있도록 함
 */
export class WalletNotConnectedError extends Error {
  constructor(message = '지갑을 먼저 연결해주세요') {
    super(message);
    this.name = 'WalletNotConnectedError';
  }
}

function getEthereumProvider(): EthereumProvider {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask를 찾을 수 없습니다. 확장 프로그램을 설치해주세요.');
  }
  return window.ethereum as EthereumProvider;
}

/**
 * 주입된 지갑(MetaMask) 기반 WalletClient 생성
 * @param chainId - 대상 체인 ID (미지정 시 현재 선택된 체인)
 */
function resolveTargetChainId(chainId?: number): number {
  if (chainId !== undefined) {
    return chainId;
  }
  return useAppStore.getState().selectedChainId;
}

export function getInjectedWalletClient(chainId?: number): WalletClient {
  const provider = getEthereumProvider();
  const targetChainId = resolveTargetChainId(chainId);
  const chain = getChainById(targetChainId);
  return createWalletClient({
    chain,
    transport: custom(provider),
  });
}

export async function getActiveAddress(): Promise<Address | null> {
  const provider = getEthereumProvider();
  const accounts = (await provider.request({
    method: 'eth_accounts',
  })) as string[] | undefined;
  const address = accounts?.[0];
  return (address as Address) ?? null;
}

export async function requestActiveAddress(): Promise<Address> {
  const provider = getEthereumProvider();
  const accounts = (await provider.request({
    method: 'eth_requestAccounts',
  })) as string[] | undefined;
  const address = accounts?.[0];
  if (!address) {
    throw new Error('MetaMask 계정을 가져오지 못했습니다.');
  }
  return address as Address;
}

/**
 * 현재 활성 지갑 주소 확인 (팝업 없음)
 * - eth_accounts만 사용하여 연결 상태 확인
 * - 미연결 시 WalletNotConnectedError 반환 (자동 팝업 없음)
 * - expected 주소와 다르면 계정 전환 요청 에러
 */
export async function ensureActiveAddress(expected?: Address): Promise<Address> {
  const active = await getActiveAddress();

  if (!active) {
    throw new WalletNotConnectedError('지갑을 먼저 연결해주세요');
  }

  if (expected && active.toLowerCase() !== expected.toLowerCase()) {
    throw new Error(
      `MetaMask 계정을 ${expected}로 전환해주세요. 현재 계정: ${active}`
    );
  }

  return active;
}

/**
 * MetaMask의 현재 체인이 대상 체인과 다르면 전환 요청
 * @param walletClient - 현재 WalletClient
 * @param targetChainId - 전환할 체인 ID (미지정 시 현재 선택된 체인)
 */
export async function ensureCorrectChain(
  walletClient: WalletClient,
  targetChainId?: number
): Promise<void> {
  const resolvedChainId = resolveTargetChainId(targetChainId);
  const currentChainId = await walletClient.getChainId();
  if (currentChainId !== resolvedChainId) {
    await switchNetwork(resolvedChainId);
  }
}
