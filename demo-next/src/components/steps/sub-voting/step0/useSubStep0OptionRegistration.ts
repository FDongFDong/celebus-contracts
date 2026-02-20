import { useCallback, useState } from 'react';
import type { Address } from 'viem';
import { toast } from 'sonner';
import {
  getBlockchainErrorMessage,
  isUserRejectionError,
  logError,
} from '@/lib/error-handler';
import type {
  StepPublicClient,
  StepWalletClient,
} from '@/components/steps/shared/step0/types';
import type {
  OptionData,
  StatusMessage,
} from './types';

interface UseSubStep0OptionRegistrationParams {
  connectedWalletAddress: Address | null;
  contractAddress: Address | null;
  ensureNetwork: () => Promise<void>;
  getPublicClient: () => StepPublicClient;
  getWalletClient: () => StepWalletClient;
  logContext: string;
  writeOption: (
    walletClient: StepWalletClient,
    contractAddress: Address,
    data: OptionData
  ) => Promise<`0x${string}`>;
}

function isValidNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function useSubStep0OptionRegistration({
  connectedWalletAddress,
  contractAddress,
  ensureNetwork,
  getPublicClient,
  getWalletClient,
  logContext,
  writeOption,
}: UseSubStep0OptionRegistrationParams) {
  const [optionData, setOptionData] = useState<OptionData>({
    missionId: 1n,
    questionId: 1,
    optionId: 1,
    text: '아티스트 A',
    allowed: true,
  });
  const [optionStatus, setOptionStatus] = useState<StatusMessage | null>(null);
  const [optionTxHash, setOptionTxHash] = useState<string | null>(null);
  const [isRegisteringOption, setIsRegisteringOption] = useState(false);

  const handleRegisterOption = useCallback(async () => {
    if (!connectedWalletAddress) {
      setOptionStatus({ message: '먼저 헤더에서 지갑을 연결해주세요', type: 'error' });
      toast.error('지갑 연결 필요');
      return;
    }

    if (!contractAddress) {
      setOptionStatus({
        message: '먼저 SubVoting 컨트랙트를 배포하거나 주소를 설정해주세요',
        type: 'error',
      });
      toast.error('컨트랙트 주소 필요');
      return;
    }

    const text = optionData.text.trim();
    if (!text) {
      setOptionStatus({ message: '옵션 텍스트를 입력해주세요', type: 'error' });
      toast.error('옵션 텍스트 필요');
      return;
    }

    if (
      optionData.missionId < 0n ||
      !isValidNonNegativeInteger(optionData.questionId) ||
      !isValidNonNegativeInteger(optionData.optionId)
    ) {
      setOptionStatus({
        message: 'Mission ID, Question ID, Option ID는 0 이상의 정수여야 합니다',
        type: 'error',
      });
      toast.error('ID 값이 올바르지 않습니다');
      return;
    }

    setIsRegisteringOption(true);
    setOptionStatus({ message: '네트워크 확인 중...', type: 'info' });

    try {
      await ensureNetwork();

      setOptionStatus({
        message: '옵션 등록 중... MetaMask에서 확인해주세요',
        type: 'info',
      });

      const walletClient = getWalletClient();
      const publicClient = getPublicClient();
      const hash = await writeOption(walletClient, contractAddress, {
        ...optionData,
        text,
      });

      setOptionStatus({
        message: `트랜잭션 전송됨. 대기 중... (${hash.substring(0, 10)}...)`,
        type: 'info',
      });

      await publicClient.waitForTransactionReceipt({ hash });

      setOptionTxHash(hash);
      setOptionStatus({
        message: `옵션 등록 완료!\n텍스트: ${text}\nMission ID: ${optionData.missionId}\nQuestion ID: ${optionData.questionId}\nOption ID: ${optionData.optionId}`,
        type: 'success',
      });
      toast.success('옵션 등록 완료!');
    } catch (error) {
      logError(`${logContext}.handleRegisterOption`, error);
      const message = getBlockchainErrorMessage(error);
      const isRejected = isUserRejectionError(error);

      setOptionStatus({
        message: isRejected ? '사용자가 트랜잭션을 취소했습니다' : `오류: ${message}`,
        type: isRejected ? 'info' : 'error',
      });

      if (isRejected) {
        toast.info('옵션 등록이 취소되었습니다');
      } else {
        toast.error('옵션 등록 실패');
      }
    } finally {
      setIsRegisteringOption(false);
    }
  }, [
    connectedWalletAddress,
    contractAddress,
    ensureNetwork,
    getPublicClient,
    getWalletClient,
    logContext,
    optionData,
    writeOption,
  ]);

  return {
    handleRegisterOption,
    isRegisteringOption,
    optionData,
    optionStatus,
    optionTxHash,
    setOptionData,
  };
}
