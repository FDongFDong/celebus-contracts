import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/store/useAppStore';

export function useStep0AppState() {
  return useAppStore(
    useShallow((s) => ({
      selectedChainId: s.selectedChainId,
      connectedWalletAddress: s.connectedWalletAddress,
      contractAddress: s.contractAddress,
      setContractAddress: s.setContractAddress,
      setContractExecutorAddress: s.setContractExecutorAddress,
    }))
  );
}
