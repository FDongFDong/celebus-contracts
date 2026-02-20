import { useCallback, useEffect, useState } from 'react';
import type { Address } from 'viem';
import { toast } from 'sonner';
import {
  getBlockchainErrorMessage,
  isUserRejectionError,
  logError,
} from '@/lib/error-handler';
import { loadPublicBytecode } from '@/components/steps/shared/step0-clients';
import type {
  SetupStatusMessage,
  StepPublicClient,
  StepWalletClient,
} from './types';

interface UseStep0DeployParams {
  bytecodePath: string;
  connectedWalletAddress: Address | null;
  deployContract: (
    walletClient: StepWalletClient,
    ownerAddress: Address,
    bytecode: `0x${string}`
  ) => Promise<`0x${string}`>;
  deployingStatusMessage: string;
  ensureNetwork: () => Promise<void>;
  failedToastMessage: string;
  getPublicClient: () => StepPublicClient;
  getWalletClient: () => StepWalletClient;
  logContext: string;
  setContractAddress: (address: Address | null) => void;
  successToastMessage: string;
  formatErrorMessage?: (message: string, isRejected: boolean) => string;
  missingBytecodeMessage?: string;
  missingWalletMessage?: string;
  showValidationToasts?: boolean;
  useDeployedAddressToastMessage?: string;
}

export function useStep0Deploy({
  bytecodePath,
  connectedWalletAddress,
  deployContract,
  deployingStatusMessage,
  ensureNetwork,
  failedToastMessage,
  getPublicClient,
  getWalletClient,
  logContext,
  setContractAddress,
  successToastMessage,
  formatErrorMessage,
  missingBytecodeMessage = 'Bytecode가 로드되지 않았습니다. 페이지를 새로고침 해주세요.',
  missingWalletMessage = '먼저 헤더에서 지갑을 연결해주세요',
  showValidationToasts = false,
  useDeployedAddressToastMessage = '컨트랙트 주소가 적용되었습니다!',
}: UseStep0DeployParams) {
  const [bytecode, setBytecode] = useState('');
  const [deployedAddress, setDeployedAddress] = useState<Address | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<SetupStatusMessage | null>(null);
  const [deployTxHash, setDeployTxHash] = useState<string | null>(null);

  useEffect(() => {
    const loadBytecode = async () => {
      try {
        const text = await loadPublicBytecode(bytecodePath);
        setBytecode(text);
      } catch (error) {
        logError(`${logContext}.loadBytecode`, error);
        setBytecode('');
      }
    };

    void loadBytecode();
  }, [bytecodePath, logContext]);

  const handleDeployContract = useCallback(async () => {
    if (!connectedWalletAddress) {
      setDeployStatus({ type: 'error', message: missingWalletMessage });
      if (showValidationToasts) {
        toast.error(missingWalletMessage);
      }
      return;
    }

    if (!bytecode) {
      setDeployStatus({ type: 'error', message: missingBytecodeMessage });
      if (showValidationToasts) {
        toast.error(missingBytecodeMessage);
      }
      return;
    }

    setIsDeploying(true);
    setDeployStatus({ type: 'info', message: '네트워크 확인 중...' });

    try {
      await ensureNetwork();

      setDeployStatus({
        type: 'info',
        message: deployingStatusMessage,
      });

      const walletClient = getWalletClient();
      const publicClient = getPublicClient();
      const hash = await deployContract(
        walletClient,
        connectedWalletAddress,
        bytecode.trim() as `0x${string}`
      );

      setDeployStatus({
        type: 'info',
        message: `트랜잭션 전송됨. 대기 중...\nTX: ${hash}`,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (!receipt.contractAddress) {
        throw new Error('Contract address not found in receipt');
      }

      setDeployedAddress(receipt.contractAddress);
      setContractAddress(receipt.contractAddress);
      setDeployTxHash(hash);
      setDeployStatus({
        type: 'success',
        message: `배포 완료!\n주소: ${receipt.contractAddress}`,
      });

      toast.success(successToastMessage);
    } catch (error) {
      logError(`${logContext}.handleDeployContract`, error);
      const isRejected = isUserRejectionError(error);
      const message = getBlockchainErrorMessage(error);

      setDeployStatus({
        type: isRejected ? 'info' : 'error',
        message: formatErrorMessage ? formatErrorMessage(message, isRejected) : message,
      });

      if (isRejected) {
        toast.info('배포가 취소되었습니다');
      } else {
        toast.error(failedToastMessage);
      }
    } finally {
      setIsDeploying(false);
    }
  }, [
    bytecode,
    connectedWalletAddress,
    deployContract,
    deployingStatusMessage,
    ensureNetwork,
    failedToastMessage,
    formatErrorMessage,
    getPublicClient,
    getWalletClient,
    logContext,
    missingBytecodeMessage,
    missingWalletMessage,
    setContractAddress,
    showValidationToasts,
    successToastMessage,
  ]);

  const handleUseDeployedAddress = useCallback(() => {
    if (!deployedAddress) {
      return;
    }

    setContractAddress(deployedAddress);
    toast.success(useDeployedAddressToastMessage);
  }, [deployedAddress, setContractAddress, useDeployedAddressToastMessage]);

  return {
    deployStatus,
    deployTxHash,
    deployedAddress,
    handleDeployContract,
    handleUseDeployedAddress,
    isDeploying,
  };
}
