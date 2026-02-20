'use client';

import { parseAbi, type Address } from 'viem';
import { useStep0AppState } from '@/components/steps/shared/step0/useStep0AppState';
import { useStep0Clients } from '@/components/steps/shared/step0/useStep0Clients';
import { useStep0Deploy } from '@/components/steps/shared/step0/useStep0Deploy';
import { useStep0Executor } from '@/components/steps/shared/step0/useStep0Executor';
import type { StepWalletClient } from '@/components/steps/shared/step0/types';
import { useSubStep0OptionRegistration } from './useSubStep0OptionRegistration';
import { useSubStep0QuestionRegistration } from './useSubStep0QuestionRegistration';

const SETUP_ABI = parseAbi([
  'constructor(address initialOwner)',
  'function setExecutorSigner(address s)',
  'function setQuestion(uint256 missionId, uint256 questionId, string memory text, bool allowed_)',
  'function setOption(uint256 missionId, uint256 questionId, uint256 optionId, string memory text, bool allowed_)',
]);

export function useSubStep0Setup() {
  const {
    selectedChainId,
    connectedWalletAddress,
    contractAddress,
    setContractAddress,
    setContractExecutorAddress,
  } = useStep0AppState();

  const { ensureNetwork, getPublicClient, getWalletClient } = useStep0Clients(
    selectedChainId,
    connectedWalletAddress
  );

  const deploy = useStep0Deploy({
    bytecodePath: '/SubVoting-bytecode.txt',
    connectedWalletAddress,
    deployContract: async (walletClient, ownerAddress, bytecode) =>
      walletClient.deployContract({
        abi: SETUP_ABI,
        args: [ownerAddress],
        bytecode,
      }),
    deployingStatusMessage: 'SubVoting 컨트랙트 배포 중... MetaMask에서 확인해주세요',
    ensureNetwork,
    failedToastMessage: '배포 실패',
    formatErrorMessage: (message, isRejected) =>
      isRejected ? '사용자가 트랜잭션을 취소했습니다' : `배포 실패: ${message}`,
    getPublicClient,
    getWalletClient,
    logContext: 'useSubStep0Setup',
    missingBytecodeMessage: 'Bytecode가 로드되지 않았습니다. 페이지를 새로고침 해주세요.',
    missingWalletMessage: '먼저 헤더에서 지갑을 연결해주세요',
    setContractAddress,
    showValidationToasts: true,
    successToastMessage: 'SubVoting 컨트랙트 배포 완료!',
    useDeployedAddressToastMessage: 'SubVoting 컨트랙트 주소가 적용되었습니다!',
  });

  const writeExecutor = async (
    walletClient: StepWalletClient,
    address: Address,
    executorAddress: Address
  ) =>
    walletClient.writeContract({
      address,
      abi: SETUP_ABI,
      functionName: 'setExecutorSigner',
      args: [executorAddress],
    });

  const executor = useStep0Executor({
    connectedWalletAddress,
    contractAddress,
    ensureNetwork,
    failedToastMessage: 'Executor 설정 실패',
    formatErrorMessage: (message, isRejected) =>
      isRejected ? '사용자가 트랜잭션을 취소했습니다' : `오류: ${message}`,
    getPublicClient,
    getWalletClient,
    logContext: 'useSubStep0Setup',
    missingContractMessage: '먼저 SubVoting 컨트랙트를 배포하거나 주소를 설정해주세요',
    missingContractToastMessage: '컨트랙트 주소 필요',
    missingExecutorAddressToastMessage: 'Executor 주소 필요',
    missingWalletToastMessage: '지갑 연결 필요',
    setContractExecutorAddress,
    showValidationToasts: true,
    successToastMessage: 'Executor 설정 완료!',
    writeExecutor,
  });

  const writeQuestion = async (
    walletClient: StepWalletClient,
    address: Address,
    data: { missionId: bigint; questionId: number; text: string; allowed: boolean }
  ) =>
    walletClient.writeContract({
      address,
      abi: SETUP_ABI,
      functionName: 'setQuestion',
      args: [
        data.missionId,
        BigInt(data.questionId),
        data.text,
        data.allowed,
      ],
    });

  const question = useSubStep0QuestionRegistration({
    connectedWalletAddress,
    contractAddress,
    ensureNetwork,
    getPublicClient,
    getWalletClient,
    logContext: 'useSubStep0Setup',
    writeQuestion,
  });

  const writeOption = async (
    walletClient: StepWalletClient,
    address: Address,
    data: {
      missionId: bigint;
      questionId: number;
      optionId: number;
      text: string;
      allowed: boolean;
    }
  ) =>
    walletClient.writeContract({
      address,
      abi: SETUP_ABI,
      functionName: 'setOption',
      args: [
        data.missionId,
        BigInt(data.questionId),
        BigInt(data.optionId),
        data.text,
        data.allowed,
      ],
    });

  const option = useSubStep0OptionRegistration({
    connectedWalletAddress,
    contractAddress,
    ensureNetwork,
    getPublicClient,
    getWalletClient,
    logContext: 'useSubStep0Setup',
    writeOption,
  });

  return {
    connectedWalletAddress,
    contractAddress,
    selectedChainId,
    deployedAddress: deploy.deployedAddress,
    executorAddress: executor.executorAddress,
    questionData: question.questionData,
    optionData: option.optionData,
    deployStatus: deploy.deployStatus,
    deployTxHash: deploy.deployTxHash,
    executorStatus: executor.executorStatus,
    executorTxHash: executor.executorTxHash,
    questionStatus: question.questionStatus,
    questionTxHash: question.questionTxHash,
    optionStatus: option.optionStatus,
    optionTxHash: option.optionTxHash,
    isDeploying: deploy.isDeploying,
    isSettingExecutor: executor.isSettingExecutor,
    isRegisteringQuestion: question.isRegisteringQuestion,
    isRegisteringOption: option.isRegisteringOption,
    setExecutorAddress: executor.setExecutorAddress,
    setQuestionData: question.setQuestionData,
    setOptionData: option.setOptionData,
    handleDeployContract: deploy.handleDeployContract,
    handleUseDeployedAddress: deploy.handleUseDeployedAddress,
    handleSetExecutor: executor.handleSetExecutor,
    handleRegisterQuestion: question.handleRegisterQuestion,
    handleRegisterOption: option.handleRegisterOption,
  };
}
