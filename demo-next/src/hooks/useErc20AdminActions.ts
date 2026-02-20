'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Address, Hash } from '@/domain/types';
import { useChainClient } from '@/hooks/useChainClient';
import { useInjectedWallet } from '@/hooks/useInjectedWallet';
import { ERC20_PERMIT_ABI } from '@/infrastructure/contracts/CelebTokenContract';
import {
  getBlockchainErrorMessage,
  isUserRejectionError,
  logError,
} from '@/lib/error-handler';

type AdminActionKey = 'mint' | 'pause' | 'unpause' | 'transferOwnership';
type AdminStatus = 'idle' | 'submitting' | 'confirmed' | 'error';

interface AdminActionState {
  status: AdminStatus;
  txHash: Hash | null;
  error: string | null;
}

type AdminActionStates = Record<AdminActionKey, AdminActionState>;

const INITIAL_ACTION_STATE: AdminActionState = {
  status: 'idle',
  txHash: null,
  error: null,
};

function initialAdminStates(): AdminActionStates {
  return {
    mint: { ...INITIAL_ACTION_STATE },
    pause: { ...INITIAL_ACTION_STATE },
    unpause: { ...INITIAL_ACTION_STATE },
    transferOwnership: { ...INITIAL_ACTION_STATE },
  };
}

export function isOwnerAddress(
  currentAddress: Address | null,
  ownerAddress: Address | null
): boolean {
  if (!currentAddress || !ownerAddress) return false;
  return currentAddress.toLowerCase() === ownerAddress.toLowerCase();
}

export function useErc20AdminActions(tokenAddress: Address | null) {
  const { publicClient } = useChainClient();
  const { address, getWalletClient, ensureChain } = useInjectedWallet();

  const [ownerAddress, setOwnerAddress] = useState<Address | null>(null);
  const [paused, setPaused] = useState<boolean | null>(null);
  const [states, setStates] = useState<AdminActionStates>(initialAdminStates());

  const setActionState = useCallback(
    (key: AdminActionKey, patch: Partial<AdminActionState>) => {
      setStates((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          ...patch,
        },
      }));
    },
    []
  );

  const refreshOwnerState = useCallback(async () => {
    if (!tokenAddress) {
      setOwnerAddress(null);
      setPaused(null);
      return;
    }

    try {
      const [owner, isPaused] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_PERMIT_ABI,
          functionName: 'owner',
        }) as Promise<Address>,
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_PERMIT_ABI,
          functionName: 'paused',
        }) as Promise<boolean>,
      ]);

      setOwnerAddress(owner);
      setPaused(isPaused);
    } catch (error) {
      logError('useErc20AdminActions.refreshOwnerState', error);
      setOwnerAddress(null);
      setPaused(null);
    }
  }, [publicClient, tokenAddress]);

  const executeAdminAction = useCallback(
    async (
      key: AdminActionKey,
      functionName: 'mint' | 'pause' | 'unpause' | 'transferOwnership',
      args: readonly unknown[]
    ) => {
      if (!tokenAddress) {
        throw new Error('토큰 주소를 먼저 설정해주세요');
      }

      setActionState(key, { status: 'submitting', error: null, txHash: null });

      try {
        await ensureChain();
        const walletClient = getWalletClient();

        if (!address) {
          throw new Error('지갑이 연결되지 않았습니다');
        }

        const hash = await walletClient.writeContract({
          account: address,
          address: tokenAddress,
          abi: ERC20_PERMIT_ABI,
          functionName: functionName as never,
          args: args as never,
          chain: undefined,
        });

        setActionState(key, { txHash: hash });
        await publicClient.waitForTransactionReceipt({ hash });
        setActionState(key, { status: 'confirmed' });
        await refreshOwnerState();
        return hash;
      } catch (error) {
        logError(`useErc20AdminActions.${key}`, error);
        const message = isUserRejectionError(error)
          ? '사용자가 트랜잭션을 거부했습니다'
          : getBlockchainErrorMessage(error);

        setActionState(key, { status: 'error', error: message });
        throw error;
      }
    },
    [address, ensureChain, getWalletClient, publicClient, refreshOwnerState, setActionState, tokenAddress]
  );

  const mint = useCallback(
    async (to: Address, amount: bigint) => {
      await executeAdminAction('mint', 'mint', [to, amount]);
    },
    [executeAdminAction]
  );

  const pause = useCallback(async () => {
    await executeAdminAction('pause', 'pause', []);
  }, [executeAdminAction]);

  const unpause = useCallback(async () => {
    await executeAdminAction('unpause', 'unpause', []);
  }, [executeAdminAction]);

  const transferOwnership = useCallback(
    async (newOwner: Address) => {
      await executeAdminAction('transferOwnership', 'transferOwnership', [newOwner]);
    },
    [executeAdminAction]
  );

  const isOwner = useMemo(
    () => isOwnerAddress(address, ownerAddress),
    [address, ownerAddress]
  );

  return {
    ownerAddress,
    paused,
    isOwner,
    states,
    refreshOwnerState,
    mint,
    pause,
    unpause,
    transferOwnership,
  };
}
