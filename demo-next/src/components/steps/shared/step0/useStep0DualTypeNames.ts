import { useCallback, useState } from 'react';
import type { Address } from 'viem';
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

interface UseStep0DualTypeNamesParams {
  connectedWalletAddress: Address | null;
  contractAddress: Address | null;
  ensureNetwork: () => Promise<void>;
  failedToastMessage: string;
  getPublicClient: () => StepPublicClient;
  getWalletClient: () => StepWalletClient;
  initialName0: string;
  initialName1: string;
  logContext: string;
  missingBothNamesMessage: string;
  settingStatusMessage: string;
  successStatusMessage: (name0: string, name1: string) => string;
  successToastMessage: string;
  waitingFirstStatusMessage: (hash: string) => string;
  waitingSecondStatusMessage: (hash: string) => string;
  writeTypeName: (
    walletClient: StepWalletClient,
    contractAddress: Address,
    typeId: 0 | 1,
    name: string
  ) => Promise<`0x${string}`>;
  formatErrorMessage?: (message: string, isRejected: boolean) => string;
  missingContractMessage?: string;
  missingWalletMessage?: string;
}

export function useStep0DualTypeNames({
  connectedWalletAddress,
  contractAddress,
  ensureNetwork,
  failedToastMessage,
  getPublicClient,
  getWalletClient,
  initialName0,
  initialName1,
  logContext,
  missingBothNamesMessage,
  settingStatusMessage,
  successStatusMessage,
  successToastMessage,
  waitingFirstStatusMessage,
  waitingSecondStatusMessage,
  writeTypeName,
  formatErrorMessage,
  missingContractMessage = '먼저 컨트랙트를 배포하거나 주소를 설정해주세요',
  missingWalletMessage = '먼저 헤더에서 지갑을 연결해주세요',
}: UseStep0DualTypeNamesParams) {
  const [typeName0, setTypeName0] = useState(initialName0);
  const [typeName1, setTypeName1] = useState(initialName1);
  const [isSettingTypeNames, setIsSettingTypeNames] = useState(false);
  const [typeNameStatus, setTypeNameStatus] = useState<SetupStatusMessage | null>(null);
  const [typeNameTxHashes, setTypeNameTxHashes] = useState<string[]>([]);

  const handleSetTypeNames = useCallback(async () => {
    if (!connectedWalletAddress) {
      setTypeNameStatus({ type: 'error', message: missingWalletMessage });
      return;
    }

    if (!contractAddress) {
      setTypeNameStatus({ type: 'error', message: missingContractMessage });
      return;
    }

    const name0 = typeName0.trim();
    const name1 = typeName1.trim();
    if (!name0 || !name1) {
      setTypeNameStatus({
        type: 'error',
        message: missingBothNamesMessage,
      });
      return;
    }

    setIsSettingTypeNames(true);
    setTypeNameStatus({ type: 'info', message: '네트워크 확인 중...' });

    try {
      await ensureNetwork();
      setTypeNameStatus({ type: 'info', message: settingStatusMessage });

      const walletClient = getWalletClient();
      const publicClient = getPublicClient();

      const hash0 = await writeTypeName(walletClient, contractAddress, 0, name0);
      setTypeNameStatus({
        type: 'info',
        message: waitingFirstStatusMessage(hash0),
      });
      await publicClient.waitForTransactionReceipt({ hash: hash0 });

      const hash1 = await writeTypeName(walletClient, contractAddress, 1, name1);
      setTypeNameStatus({
        type: 'info',
        message: waitingSecondStatusMessage(hash1),
      });
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      setTypeNameTxHashes([hash0, hash1]);
      setTypeNameStatus({
        type: 'success',
        message: successStatusMessage(name0, name1),
      });
      toast.success(successToastMessage);
    } catch (error) {
      logError(`${logContext}.handleSetTypeNames`, error);
      const isRejected = isUserRejectionError(error);
      const message = getBlockchainErrorMessage(error);

      setTypeNameStatus({
        type: isRejected ? 'info' : 'error',
        message: formatErrorMessage ? formatErrorMessage(message, isRejected) : message,
      });

      if (isRejected) {
        toast.info('타입 설정이 취소되었습니다');
      } else {
        toast.error(failedToastMessage);
      }
    } finally {
      setIsSettingTypeNames(false);
    }
  }, [
    connectedWalletAddress,
    contractAddress,
    ensureNetwork,
    failedToastMessage,
    formatErrorMessage,
    getPublicClient,
    getWalletClient,
    logContext,
    missingBothNamesMessage,
    missingContractMessage,
    missingWalletMessage,
    settingStatusMessage,
    successStatusMessage,
    successToastMessage,
    typeName0,
    typeName1,
    waitingFirstStatusMessage,
    waitingSecondStatusMessage,
    writeTypeName,
  ]);

  return {
    handleSetTypeNames,
    isSettingTypeNames,
    setTypeName0,
    setTypeName1,
    typeName0,
    typeName1,
    typeNameStatus,
    typeNameTxHashes,
  };
}
