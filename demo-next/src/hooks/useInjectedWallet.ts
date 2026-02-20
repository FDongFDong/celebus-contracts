'use client';

/**
 * MetaMask 등 주입된 지갑(injected wallet) 통합 훅
 *
 * 기존 lib/injected-wallet.ts의 함수들을 React 훅으로 래핑.
 * opBNBTestnet 하드코딩 제거 → useAppStore의 selectedChainId 기반 동적 체인 지원.
 * window.ethereum 이벤트(accountsChanged, chainChanged)를 자동 리스닝.
 */

import { useCallback, useEffect } from 'react';
import { createWalletClient, custom, type WalletClient } from 'viem';
import { useAppStore } from '@/store/useAppStore';
import { getChainById, switchNetwork } from '@/infrastructure/config/chains';
import type { Address } from '@/domain/types';

/** window.ethereum 타입 (MetaMask provider) */
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

/** window.ethereum 안전 접근 */
function getProvider(): EthereumProvider | null {
  if (typeof window === 'undefined') return null;
  return (window.ethereum as EthereumProvider | undefined) ?? null;
}

export function useInjectedWallet() {
  const selectedChainId = useAppStore((s) => s.selectedChainId);
  const connectedWalletAddress = useAppStore((s) => s.connectedWalletAddress);
  const setConnectedWalletAddress = useAppStore(
    (s) => s.setConnectedWalletAddress
  );
  const setSelectedChainId = useAppStore((s) => s.setSelectedChainId);

  /** 내부 상태 + 스토어 동기화 */
  const syncAddress = useCallback(
    (addr: Address | null) => {
      setConnectedWalletAddress(addr);
    },
    [setConnectedWalletAddress]
  );

  /** MetaMask 연결 요청 (팝업 표시) */
  const connect = useCallback(async (): Promise<Address> => {
    const provider = getProvider();
    if (!provider) {
      throw new Error('MetaMask를 찾을 수 없습니다. 확장 프로그램을 설치해주세요.');
    }

    const accounts = (await provider.request({
      method: 'eth_requestAccounts',
    })) as string[];

    const account = accounts[0];
    if (!account) {
      throw new Error('MetaMask 계정을 가져오지 못했습니다.');
    }

    const addr = account as Address;
    syncAddress(addr);
    return addr;
  }, [syncAddress]);

  /** 연결 해제 (로컬 상태만 초기화) */
  const disconnect = useCallback(() => {
    syncAddress(null);
  }, [syncAddress]);

  /** 현재 selectedChainId 체인으로 MetaMask 전환 */
  const ensureChain = useCallback(async () => {
    await switchNetwork(selectedChainId);
  }, [selectedChainId]);

  /** 동적 체인 기반 WalletClient 생성 */
  const getWalletClient = useCallback((): WalletClient => {
    const provider = getProvider();
    if (!provider) {
      throw new Error('MetaMask를 찾을 수 없습니다.');
    }

    const chain = getChainById(selectedChainId);
    return createWalletClient({
      chain,
      transport: custom(provider),
    });
  }, [selectedChainId]);

  /**
   * 이벤트 리스닝 - 지갑 연결 후에만 활성화
   *
   * 중요: 페이지 로드 시 window.ethereum에 접근하면
   * Phantom 등 다중 지갑 확장이 선택 팝업을 띄움.
   * isConnected가 true일 때만 리스너를 등록하여 이를 방지.
   */
  useEffect(() => {
    const isConnected = connectedWalletAddress !== null;
    if (!isConnected) return;

    const provider = getProvider();
    if (!provider) return;

    // 계정 변경 리스닝
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      const account = accounts[0];
      syncAddress(account ? (account as Address) : null);
    };

    // 체인 변경 리스닝 → 스토어 동기화
    const handleChainChanged = (...args: unknown[]) => {
      const chainIdHex = args[0] as string;
      const newChainId = parseInt(chainIdHex, 16);
      try {
        getChainById(newChainId);
        setSelectedChainId(newChainId);
      } catch {
        // 지원하지 않는 체인은 스토어에 반영하지 않음
      }
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
    };
  }, [connectedWalletAddress, setSelectedChainId, syncAddress]);

  return {
    address: connectedWalletAddress,
    isConnected: connectedWalletAddress !== null,
    connect,
    disconnect,
    ensureChain,
    getWalletClient,
  };
}
