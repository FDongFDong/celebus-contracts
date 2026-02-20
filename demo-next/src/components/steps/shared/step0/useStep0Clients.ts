import { useCallback } from 'react';
import type { Address } from 'viem';
import { ensureCorrectChain, getInjectedWalletClient } from '@/lib/injected-wallet';
import {
  createStepPublicClient,
  createStepWalletClient,
} from '@/components/steps/shared/step0-clients';

export function useStep0Clients(
  selectedChainId: number,
  connectedWalletAddress: Address | null
) {
  const getWalletClient = useCallback(
    () => createStepWalletClient(selectedChainId, connectedWalletAddress),
    [connectedWalletAddress, selectedChainId]
  );

  const getPublicClient = useCallback(
    () => createStepPublicClient(selectedChainId),
    [selectedChainId]
  );

  const ensureNetwork = useCallback(async () => {
    const tempWalletClient = getInjectedWalletClient(selectedChainId);
    await ensureCorrectChain(tempWalletClient, selectedChainId);
  }, [selectedChainId]);

  return {
    ensureNetwork,
    getPublicClient,
    getWalletClient,
  };
}
