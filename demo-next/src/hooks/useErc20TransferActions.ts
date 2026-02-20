'use client';

import { useState, useCallback } from 'react';
import type { Address, Hash } from '@/domain/types';
import { useChainClient } from '@/hooks/useChainClient';
import { useInjectedWallet } from '@/hooks/useInjectedWallet';
import { ERC20_PERMIT_ABI } from '@/infrastructure/contracts/CelebTokenContract';
import {
  logError,
  getBlockchainErrorMessage,
  isUserRejectionError,
} from '@/lib/error-handler';

export type Erc20ActionKey =
  | 'approve'
  | 'transfer'
  | 'transferFrom'
  | 'burn'
  | 'burnFrom';

type ActionStatus = 'idle' | 'submitting' | 'confirmed' | 'error';

interface ActionState {
  status: ActionStatus;
  txHash: Hash | null;
  error: string | null;
}

export type Erc20ActionStates = Record<Erc20ActionKey, ActionState>;

const INITIAL_ACTION_STATE: ActionState = {
  status: 'idle',
  txHash: null,
  error: null,
};

export function getInitialErc20ActionStates(): Erc20ActionStates {
  return {
    approve: { ...INITIAL_ACTION_STATE },
    transfer: { ...INITIAL_ACTION_STATE },
    transferFrom: { ...INITIAL_ACTION_STATE },
    burn: { ...INITIAL_ACTION_STATE },
    burnFrom: { ...INITIAL_ACTION_STATE },
  };
}

export function getErc20ActionErrorMessage(error: unknown): string {
  return isUserRejectionError(error)
    ? '사용자가 트랜잭션을 거부했습니다'
    : getBlockchainErrorMessage(error);
}

export function useErc20TransferActions() {
  const { publicClient } = useChainClient();
  const { getWalletClient, ensureChain, address } = useInjectedWallet();
  const [states, setStates] = useState<Erc20ActionStates>(
    getInitialErc20ActionStates()
  );

  const setActionState = useCallback(
    (key: Erc20ActionKey, patch: Partial<ActionState>) => {
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

  const runWrite = useCallback(
    async (
      key: Erc20ActionKey,
      tokenAddress: Address,
      functionName: 'approve' | 'transfer' | 'transferFrom' | 'burn' | 'burnFrom',
      args: readonly unknown[]
    ) => {
      setActionState(key, { status: 'submitting', error: null, txHash: null });

      try {
        await ensureChain();

        const walletClient = getWalletClient();
        const account = address;
        if (!account) {
          throw new Error('지갑이 연결되지 않았습니다');
        }

        const hash = await walletClient.writeContract({
          account,
          address: tokenAddress,
          abi: ERC20_PERMIT_ABI,
          functionName: functionName as never,
          args: args as never,
          chain: undefined,
        });

        setActionState(key, { txHash: hash });
        await publicClient.waitForTransactionReceipt({ hash });

        setActionState(key, { status: 'confirmed' });
        return hash;
      } catch (error) {
        logError(`useErc20TransferActions.${key}`, error);
        const message = getErc20ActionErrorMessage(error);

        setActionState(key, { status: 'error', error: message });
        throw error;
      }
    },
    [address, ensureChain, getWalletClient, publicClient, setActionState]
  );

  const approve = useCallback(
    async (tokenAddress: Address, spender: Address, amount: bigint) => {
      await runWrite('approve', tokenAddress, 'approve', [spender, amount]);
    },
    [runWrite]
  );

  const transfer = useCallback(
    async (tokenAddress: Address, to: Address, amount: bigint) => {
      await runWrite('transfer', tokenAddress, 'transfer', [to, amount]);
    },
    [runWrite]
  );

  const transferFrom = useCallback(
    async (tokenAddress: Address, from: Address, to: Address, amount: bigint) => {
      await runWrite('transferFrom', tokenAddress, 'transferFrom', [from, to, amount]);
    },
    [runWrite]
  );

  const burn = useCallback(
    async (tokenAddress: Address, amount: bigint) => {
      await runWrite('burn', tokenAddress, 'burn', [amount]);
    },
    [runWrite]
  );

  const burnFrom = useCallback(
    async (tokenAddress: Address, from: Address, amount: bigint) => {
      await runWrite('burnFrom', tokenAddress, 'burnFrom', [from, amount]);
    },
    [runWrite]
  );

  const resetActionState = useCallback((key: Erc20ActionKey) => {
    setStates((prev) => ({
      ...prev,
      [key]: { ...INITIAL_ACTION_STATE },
    }));
  }, []);

  return {
    states,
    approve,
    transfer,
    transferFrom,
    burn,
    burnFrom,
    resetActionState,
  };
}
