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
  'function setBoostingTypeName(uint8 boostType, string memory name)',
  'function setArtist(uint256 missionId, uint256 optionId, string memory name, bool allowed)',
]);

export function useBoostStep0Setup() {
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
    bytecodePath: '/Boosting-bytecode.txt',
    connectedWalletAddress,
    deployContract: async (walletClient, ownerAddress, bytecode) =>
      walletClient.deployContract({
        abi: SETUP_ABI,
        args: [ownerAddress],
        bytecode,
      }),
    deployingStatusMessage: 'Boosting 컨트랙트 배포 중... MetaMask에서 확인해주세요',
    ensureNetwork,
    failedToastMessage: '컨트랙트 배포에 실패했습니다',
    getPublicClient,
    getWalletClient,
    logContext: 'useBoostStep0Setup',
    setContractAddress,
    successToastMessage: 'Boosting 컨트랙트가 성공적으로 배포되었습니다!',
    useDeployedAddressToastMessage: 'Boosting 컨트랙트 주소가 적용되었습니다!',
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
    logContext: 'useBoostStep0Setup',
    setContractExecutorAddress,
    successToastMessage: 'Executor가 성공적으로 설정되었습니다!',
    writeExecutor,
  });

  const writeBoostTypeName = async (
    walletClient: StepWalletClient,
    address: Address,
    typeId: 0 | 1,
    name: string
  ) =>
    walletClient.writeContract({
      address,
      abi: SETUP_ABI,
      functionName: 'setBoostingTypeName',
      args: [typeId, name],
    });

  const boostTypes = useStep0DualTypeNames({
    connectedWalletAddress,
    contractAddress,
    ensureNetwork,
    failedToastMessage: '부스팅 타입 설정에 실패했습니다',
    getPublicClient,
    getWalletClient,
    initialName0: 'BP',
    initialName1: 'CELB',
    logContext: 'useBoostStep0Setup',
    missingBothNamesMessage: '두 개의 부스팅 타입 이름을 모두 입력해주세요',
    settingStatusMessage: '부스팅 타입 이름 설정 중... MetaMask에서 확인해주세요',
    successStatusMessage: (name0, name1) =>
      `부스팅 타입 이름 설정 완료!\n0: ${name0}\n1: ${name1}`,
    successToastMessage: '부스팅 타입 이름이 성공적으로 설정되었습니다!',
    waitingFirstStatusMessage: (hash) =>
      `타입 0 (BP) 설정 중... (${hash.substring(0, 10)}...)`,
    waitingSecondStatusMessage: (hash) =>
      `타입 1 (CELB) 설정 중... (${hash.substring(0, 10)}...)`,
    writeTypeName: writeBoostTypeName,
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
    logContext: 'useBoostStep0Setup',
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
    boostTypeName0: boostTypes.typeName0,
    setBoostTypeName0: boostTypes.setTypeName0,
    boostTypeName1: boostTypes.typeName1,
    setBoostTypeName1: boostTypes.setTypeName1,
    boostTypeStatus: boostTypes.typeNameStatus,
    boostTypeTxHashes: boostTypes.typeNameTxHashes,
    isSettingBoostTypes: boostTypes.isSettingTypeNames,
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
    handleSetBoostingTypeNames: boostTypes.handleSetTypeNames,
    handleRegisterArtist: artist.handleRegisterArtist,
  };
}
