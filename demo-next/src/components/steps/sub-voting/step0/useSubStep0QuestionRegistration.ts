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
  QuestionData,
  StatusMessage,
} from './types';

interface UseSubStep0QuestionRegistrationParams {
  connectedWalletAddress: Address | null;
  contractAddress: Address | null;
  ensureNetwork: () => Promise<void>;
  getPublicClient: () => StepPublicClient;
  getWalletClient: () => StepWalletClient;
  logContext: string;
  writeQuestion: (
    walletClient: StepWalletClient,
    contractAddress: Address,
    data: QuestionData
  ) => Promise<`0x${string}`>;
}

function isValidNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function useSubStep0QuestionRegistration({
  connectedWalletAddress,
  contractAddress,
  ensureNetwork,
  getPublicClient,
  getWalletClient,
  logContext,
  writeQuestion,
}: UseSubStep0QuestionRegistrationParams) {
  const [questionData, setQuestionData] = useState<QuestionData>({
    missionId: 1n,
    questionId: 1,
    text: '좋아하는 아티스트는?',
    allowed: true,
  });
  const [questionStatus, setQuestionStatus] = useState<StatusMessage | null>(null);
  const [questionTxHash, setQuestionTxHash] = useState<string | null>(null);
  const [isRegisteringQuestion, setIsRegisteringQuestion] = useState(false);

  const handleRegisterQuestion = useCallback(async () => {
    if (!connectedWalletAddress) {
      setQuestionStatus({ message: '먼저 헤더에서 지갑을 연결해주세요', type: 'error' });
      toast.error('지갑 연결 필요');
      return;
    }

    if (!contractAddress) {
      setQuestionStatus({
        message: '먼저 SubVoting 컨트랙트를 배포하거나 주소를 설정해주세요',
        type: 'error',
      });
      toast.error('컨트랙트 주소 필요');
      return;
    }

    const text = questionData.text.trim();
    if (!text) {
      setQuestionStatus({ message: '질문 텍스트를 입력해주세요', type: 'error' });
      toast.error('질문 텍스트 필요');
      return;
    }

    if (questionData.missionId < 0n || !isValidNonNegativeInteger(questionData.questionId)) {
      setQuestionStatus({
        message: 'Mission ID와 Question ID는 0 이상의 정수여야 합니다',
        type: 'error',
      });
      toast.error('ID 값이 올바르지 않습니다');
      return;
    }

    setIsRegisteringQuestion(true);
    setQuestionStatus({ message: '네트워크 확인 중...', type: 'info' });

    try {
      await ensureNetwork();

      setQuestionStatus({
        message: '질문 등록 중... MetaMask에서 확인해주세요',
        type: 'info',
      });

      const walletClient = getWalletClient();
      const publicClient = getPublicClient();
      const hash = await writeQuestion(walletClient, contractAddress, {
        ...questionData,
        text,
      });

      setQuestionStatus({
        message: `트랜잭션 전송됨. 대기 중... (${hash.substring(0, 10)}...)`,
        type: 'info',
      });

      await publicClient.waitForTransactionReceipt({ hash });

      setQuestionTxHash(hash);
      setQuestionStatus({
        message: `질문 등록 완료!\n텍스트: ${text}\nMission ID: ${questionData.missionId}\nQuestion ID: ${questionData.questionId}`,
        type: 'success',
      });
      toast.success('질문 등록 완료!');
    } catch (error) {
      logError(`${logContext}.handleRegisterQuestion`, error);
      const message = getBlockchainErrorMessage(error);
      const isRejected = isUserRejectionError(error);

      setQuestionStatus({
        message: isRejected ? '사용자가 트랜잭션을 취소했습니다' : `오류: ${message}`,
        type: isRejected ? 'info' : 'error',
      });

      if (isRejected) {
        toast.info('질문 등록이 취소되었습니다');
      } else {
        toast.error('질문 등록 실패');
      }
    } finally {
      setIsRegisteringQuestion(false);
    }
  }, [
    connectedWalletAddress,
    contractAddress,
    ensureNetwork,
    getPublicClient,
    getWalletClient,
    logContext,
    questionData,
    writeQuestion,
  ]);

  return {
    handleRegisterQuestion,
    isRegisteringQuestion,
    questionData,
    questionStatus,
    questionTxHash,
    setQuestionData,
  };
}
