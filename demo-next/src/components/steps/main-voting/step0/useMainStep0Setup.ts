'use client';

import { parseAbi, type Address } from 'viem';
import type { StepWalletClient } from '@/components/steps/shared/step0/types';
import { useStep0AppState } from '@/components/steps/shared/step0/useStep0AppState';
import { useStep0ArtistRegistration } from '@/components/steps/shared/step0/useStep0ArtistRegistration';
import { useStep0Clients } from '@/components/steps/shared/step0/useStep0Clients';
import { useStep0Deploy } from '@/components/steps/shared/step0/useStep0Deploy';
import { useStep0DualTypeNames } from '@/components/steps/shared/step0/useStep0DualTypeNames';
import { useStep0Executor } from '@/components/steps/shared/step0/useStep0Executor';

const SETUP_ABI = parseAbi([
  'constructor(address initialOwner)',
  'function setExecutorSigner(address _executorSigner)',
  'function setVoteTypeName(uint8 voteType, string memory name)',
  'function setArtist(uint256 missionId, uint256 optionId, string memory name, bool allowed)',
]);

export function useMainStep0Setup() {
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
    bytecodePath: '/MainVoting-bytecode.txt',
    connectedWalletAddress,
    deployContract: async (walletClient, ownerAddress, bytecode) =>
      walletClient.deployContract({
        abi: SETUP_ABI,
        args: [ownerAddress],
        bytecode,
      }),
    deployingStatusMessage: '컨트랙트 배포 중... MetaMask에서 확인해주세요',
    ensureNetwork,
    failedToastMessage: '컨트랙트 배포에 실패했습니다',
    getPublicClient,
    getWalletClient,
    logContext: 'useMainStep0Setup',
    setContractAddress,
    successToastMessage: '컨트랙트가 성공적으로 배포되었습니다!',
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
    failedToastMessage: 'Executor 설정에 실패했습니다',
    getPublicClient,
    getWalletClient,
    logContext: 'useMainStep0Setup',
    setContractExecutorAddress,
    successToastMessage: 'Executor가 성공적으로 설정되었습니다!',
    writeExecutor,
  });

  const writeVoteTypeName = async (
    walletClient: StepWalletClient,
    address: Address,
    typeId: 0 | 1,
    name: string
  ) =>
    walletClient.writeContract({
      address,
      abi: SETUP_ABI,
      functionName: 'setVoteTypeName',
      args: [typeId, name],
    });

  const voteTypes = useStep0DualTypeNames({
    connectedWalletAddress,
    contractAddress,
    ensureNetwork,
    failedToastMessage: '투표 타입 설정에 실패했습니다',
    getPublicClient,
    getWalletClient,
    initialName0: 'Forget',
    initialName1: 'Remember',
    logContext: 'useMainStep0Setup',
    missingBothNamesMessage: '두 개의 투표 타입 이름을 모두 입력해주세요',
    settingStatusMessage: '투표 타입 이름 설정 중... MetaMask에서 확인해주세요',
    successStatusMessage: (name0, name1) =>
      `투표 타입 이름 설정 완료!\n0: ${name0}\n1: ${name1}`,
    successToastMessage: '투표 타입 이름이 성공적으로 설정되었습니다!',
    waitingFirstStatusMessage: (hash) => `타입 0 설정 중... (${hash.substring(0, 10)}...)`,
    waitingSecondStatusMessage: (hash) => `타입 1 설정 중... (${hash.substring(0, 10)}...)`,
    writeTypeName: writeVoteTypeName,
  });

  const writeArtist = async (
    walletClient: StepWalletClient,
    address: Address,
    missionId: bigint,
    artistId: bigint,
    artistName: string
  ) =>
    walletClient.writeContract({
      address,
      abi: SETUP_ABI,
      functionName: 'setArtist',
      args: [missionId, artistId, artistName, true],
    });

  const artist = useStep0ArtistRegistration({
    connectedWalletAddress,
    contractAddress,
    ensureNetwork,
    failedToastMessage: '아티스트 등록에 실패했습니다',
    getPublicClient,
    getWalletClient,
    logContext: 'useMainStep0Setup',
    successToastMessage: '아티스트가 성공적으로 등록되었습니다!',
    writeArtist,
  });

  return {
    connectedWalletAddress,
    contractAddress,
    deployedAddress: deploy.deployedAddress,
    deployStatus: deploy.deployStatus,
    deployTxHash: deploy.deployTxHash,
    isDeploying: deploy.isDeploying,
    executorAddress: executor.executorAddress,
    setExecutorAddress: executor.setExecutorAddress,
    executorStatus: executor.executorStatus,
    executorTxHash: executor.executorTxHash,
    isSettingExecutor: executor.isSettingExecutor,
    voteTypeName0: voteTypes.typeName0,
    setVoteTypeName0: voteTypes.setTypeName0,
    voteTypeName1: voteTypes.typeName1,
    setVoteTypeName1: voteTypes.setTypeName1,
    voteTypeStatus: voteTypes.typeNameStatus,
    voteTypeTxHashes: voteTypes.typeNameTxHashes,
    isSettingVoteTypes: voteTypes.isSettingTypeNames,
    candidateMissionId: artist.candidateMissionId,
    setCandidateMissionId: artist.setCandidateMissionId,
    candidateArtistId: artist.candidateArtistId,
    setCandidateArtistId: artist.setCandidateArtistId,
    candidateName: artist.candidateName,
    setCandidateName: artist.setCandidateName,
    candidateStatus: artist.candidateStatus,
    artistTxHash: artist.artistTxHash,
    isRegisteringArtist: artist.isRegisteringArtist,
    handleDeployContract: deploy.handleDeployContract,
    handleUseDeployedAddress: deploy.handleUseDeployedAddress,
    handleSetExecutor: executor.handleSetExecutor,
    handleSetVoteTypeNames: voteTypes.handleSetTypeNames,
    handleRegisterArtist: artist.handleRegisterArtist,
  };
}
