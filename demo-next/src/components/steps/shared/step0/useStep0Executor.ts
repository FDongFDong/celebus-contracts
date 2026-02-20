import { useCallback, useState } from 'react';
import { isAddress, type Address } from 'viem';
import { toast } from 'sonner';
import {
  getBlockchainErrorMessage,
  isUserRejectionError,
  logError,
} from '@/lib/error-handler';
import type {
  SetupStatusMessage,
  StepPublicClient,
  StepWalletClient,
} from './types';

interface UseStep0ExecutorParams {
  connectedWalletAddress: Address | null;
  contractAddress: Address | null;
  ensureNetwork: () => Promise<void>;
  failedToastMessage: string;
  getPublicClient: () => StepPublicClient;
  getWalletClient: () => StepWalletClient;
  logContext: string;
  setContractExecutorAddress: (address: Address | null) => void;
  successToastMessage: string;
  writeExecutor: (
    walletClient: StepWalletClient,
    contractAddress: Address,
    executorAddress: Address
  ) => Promise<`0x${string}`>;
  formatErrorMessage?: (message: string, isRejected: boolean) => string;
  initialExecutorAddress?: string;
  missingContractMessage?: string;
  missingExecutorAddressMessage?: string;
  missingWalletMessage?: string;
  missingWalletToastMessage?: string;
  missingContractToastMessage?: string;
  missingExecutorAddressToastMessage?: string;
  invalidExecutorAddressMessage?: string;
  invalidExecutorAddressToastMessage?: string;
  showValidationToasts?: boolean;
  settingStatusMessage?: string;
  waitingStatusMessage?: (hash: string) => string;
}

export function useStep0Executor({
  connectedWalletAddress,
  contractAddress,
  ensureNetwork,
  failedToastMessage,
  getPublicClient,
  getWalletClient,
  logContext,
  setContractExecutorAddress,
  successToastMessage,
  writeExecutor,
  formatErrorMessage,
  initialExecutorAddress = '0x240eCdd1C5a7C30149D43987ce5A3Eb4e9E97897',
  missingContractMessage = '먼저 컨트랙트를 배포하거나 주소를 설정해주세요',
  missingExecutorAddressMessage = 'Executor 주소를 입력해주세요',
  missingWalletMessage = '먼저 헤더에서 지갑을 연결해주세요',
  missingWalletToastMessage,
  missingContractToastMessage,
  missingExecutorAddressToastMessage,
  invalidExecutorAddressMessage = '유효한 Executor 주소를 입력해주세요',
  invalidExecutorAddressToastMessage,
  showValidationToasts = false,
  settingStatusMessage = 'Executor 설정 중... MetaMask에서 확인해주세요',
  waitingStatusMessage = (hash) => `트랜잭션 전송됨. 대기 중... (${hash.substring(0, 10)}...)`,
}: UseStep0ExecutorParams) {
  const [executorAddress, setExecutorAddress] = useState(initialExecutorAddress);
  const [isSettingExecutor, setIsSettingExecutor] = useState(false);
  const [executorStatus, setExecutorStatus] = useState<SetupStatusMessage | null>(null);
  const [executorTxHash, setExecutorTxHash] = useState<string | null>(null);

  const handleSetExecutor = useCallback(async () => {
    if (!connectedWalletAddress) {
      setExecutorStatus({ type: 'error', message: missingWalletMessage });
      if (showValidationToasts) {
        toast.error(missingWalletToastMessage ?? missingWalletMessage);
      }
      return;
    }

    if (!contractAddress) {
      setExecutorStatus({ type: 'error', message: missingContractMessage });
      if (showValidationToasts) {
        toast.error(missingContractToastMessage ?? missingContractMessage);
      }
      return;
    }

    const normalizedExecutorAddress = executorAddress.trim();
    if (!normalizedExecutorAddress) {
      setExecutorStatus({ type: 'error', message: missingExecutorAddressMessage });
      if (showValidationToasts) {
        toast.error(missingExecutorAddressToastMessage ?? missingExecutorAddressMessage);
      }
      return;
    }
    if (!isAddress(normalizedExecutorAddress)) {
      setExecutorStatus({ type: 'error', message: invalidExecutorAddressMessage });
      if (showValidationToasts) {
        toast.error(invalidExecutorAddressToastMessage ?? invalidExecutorAddressMessage);
      }
      return;
    }

    setIsSettingExecutor(true);
    setExecutorStatus({ type: 'info', message: '네트워크 확인 중...' });

    try {
      await ensureNetwork();
      setExecutorStatus({ type: 'info', message: settingStatusMessage });

      const walletClient = getWalletClient();
      const publicClient = getPublicClient();
      const hash = await writeExecutor(
        walletClient,
        contractAddress,
        normalizedExecutorAddress as Address
      );

      setExecutorStatus({
        type: 'info',
        message: waitingStatusMessage(hash),
      });

      await publicClient.waitForTransactionReceipt({ hash });

      setContractExecutorAddress(normalizedExecutorAddress as Address);
      setExecutorTxHash(hash);
      setExecutorStatus({ type: 'success', message: 'Executor 설정 완료!' });
      toast.success(successToastMessage);
    } catch (error) {
      logError(`${logContext}.handleSetExecutor`, error);
      const isRejected = isUserRejectionError(error);
      const message = getBlockchainErrorMessage(error);

      setExecutorStatus({
        type: isRejected ? 'info' : 'error',
        message: formatErrorMessage ? formatErrorMessage(message, isRejected) : message,
      });

      if (isRejected) {
        toast.info('Executor 설정이 취소되었습니다');
      } else {
        toast.error(failedToastMessage);
      }
    } finally {
      setIsSettingExecutor(false);
    }
  }, [
    connectedWalletAddress,
    contractAddress,
    ensureNetwork,
    executorAddress,
    failedToastMessage,
    formatErrorMessage,
    getPublicClient,
    getWalletClient,
    logContext,
    missingContractMessage,
    missingContractToastMessage,
    missingExecutorAddressMessage,
    missingExecutorAddressToastMessage,
    missingWalletMessage,
    missingWalletToastMessage,
    invalidExecutorAddressMessage,
    invalidExecutorAddressToastMessage,
    setContractExecutorAddress,
    settingStatusMessage,
    showValidationToasts,
    successToastMessage,
    waitingStatusMessage,
    writeExecutor,
  ]);

  return {
    executorAddress,
    executorStatus,
    executorTxHash,
    handleSetExecutor,
    isSettingExecutor,
    setExecutorAddress,
  };
}
