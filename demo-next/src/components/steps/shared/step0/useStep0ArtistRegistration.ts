import { useCallback, useState } from 'react';
import type { Address } from 'viem';
import { toast } from 'sonner';
import {
  getBlockchainErrorMessage,
  isUserRejectionError,
  logError,
} from '@/lib/error-handler';
import { isValidBigIntString } from '@/lib/safe-bigint';
import type {
  SetupStatusMessage,
  StepPublicClient,
  StepWalletClient,
} from './types';

interface UseStep0ArtistRegistrationParams {
  connectedWalletAddress: Address | null;
  contractAddress: Address | null;
  ensureNetwork: () => Promise<void>;
  failedToastMessage: string;
  getPublicClient: () => StepPublicClient;
  getWalletClient: () => StepWalletClient;
  logContext: string;
  successToastMessage: string;
  waitingStatusMessage?: (hash: string) => string;
  writeArtist: (
    walletClient: StepWalletClient,
    contractAddress: Address,
    missionId: bigint,
    artistId: bigint,
    artistName: string
  ) => Promise<`0x${string}`>;
  formatErrorMessage?: (message: string, isRejected: boolean) => string;
  initialArtistId?: string;
  initialArtistName?: string;
  initialMissionId?: string;
  missingArtistNameMessage?: string;
  missingContractMessage?: string;
  missingWalletMessage?: string;
  settingStatusMessage?: string;
  successStatusMessage?: (
    artistName: string,
    missionId: bigint,
    artistId: bigint
  ) => string;
}

export function useStep0ArtistRegistration({
  connectedWalletAddress,
  contractAddress,
  ensureNetwork,
  failedToastMessage,
  getPublicClient,
  getWalletClient,
  logContext,
  successToastMessage,
  waitingStatusMessage = (hash) => `트랜잭션 전송됨. 대기 중... (${hash.substring(0, 10)}...)`,
  writeArtist,
  formatErrorMessage,
  initialArtistId = '1',
  initialArtistName = 'Artist A',
  initialMissionId = '1',
  missingArtistNameMessage = '아티스트 이름을 입력해주세요',
  missingContractMessage = '먼저 컨트랙트를 배포하거나 주소를 설정해주세요',
  missingWalletMessage = '먼저 헤더에서 지갑을 연결해주세요',
  settingStatusMessage = '아티스트 등록 중... MetaMask에서 확인해주세요',
  successStatusMessage = (artistName, missionId, artistId) =>
    `아티스트 등록 완료!\n이름: ${artistName}\n미션 ID: ${missionId}\n아티스트 ID: ${artistId}`,
}: UseStep0ArtistRegistrationParams) {
  const [candidateMissionId, setCandidateMissionId] = useState(initialMissionId);
  const [candidateArtistId, setCandidateArtistId] = useState(initialArtistId);
  const [candidateName, setCandidateName] = useState(initialArtistName);
  const [isRegisteringArtist, setIsRegisteringArtist] = useState(false);
  const [candidateStatus, setCandidateStatus] = useState<SetupStatusMessage | null>(null);
  const [artistTxHash, setArtistTxHash] = useState<string | null>(null);

  const handleRegisterArtist = useCallback(async () => {
    if (!connectedWalletAddress) {
      setCandidateStatus({ type: 'error', message: missingWalletMessage });
      return;
    }

    if (!contractAddress) {
      setCandidateStatus({ type: 'error', message: missingContractMessage });
      return;
    }

    if (!isValidBigIntString(candidateMissionId) || !isValidBigIntString(candidateArtistId)) {
      setCandidateStatus({
        type: 'error',
        message: '미션 ID와 아티스트 ID는 0 이상의 정수여야 합니다',
      });
      return;
    }

    const missionId = BigInt(candidateMissionId);
    const artistId = BigInt(candidateArtistId);
    const artistName = candidateName.trim();

    if (!artistName) {
      setCandidateStatus({ type: 'error', message: missingArtistNameMessage });
      return;
    }

    setIsRegisteringArtist(true);
    setCandidateStatus({ type: 'info', message: '네트워크 확인 중...' });

    try {
      await ensureNetwork();
      setCandidateStatus({ type: 'info', message: settingStatusMessage });

      const walletClient = getWalletClient();
      const publicClient = getPublicClient();
      const hash = await writeArtist(
        walletClient,
        contractAddress,
        missionId,
        artistId,
        artistName
      );

      setCandidateStatus({
        type: 'info',
        message: waitingStatusMessage(hash),
      });

      await publicClient.waitForTransactionReceipt({ hash });

      setArtistTxHash(hash);
      setCandidateStatus({
        type: 'success',
        message: successStatusMessage(artistName, missionId, artistId),
      });
      toast.success(successToastMessage);
    } catch (error) {
      logError(`${logContext}.handleRegisterArtist`, error);
      const isRejected = isUserRejectionError(error);
      const message = getBlockchainErrorMessage(error);

      setCandidateStatus({
        type: isRejected ? 'info' : 'error',
        message: formatErrorMessage ? formatErrorMessage(message, isRejected) : message,
      });

      if (isRejected) {
        toast.info('아티스트 등록이 취소되었습니다');
      } else {
        toast.error(failedToastMessage);
      }
    } finally {
      setIsRegisteringArtist(false);
    }
  }, [
    candidateArtistId,
    candidateMissionId,
    candidateName,
    connectedWalletAddress,
    contractAddress,
    ensureNetwork,
    failedToastMessage,
    formatErrorMessage,
    getPublicClient,
    getWalletClient,
    logContext,
    missingArtistNameMessage,
    missingContractMessage,
    missingWalletMessage,
    settingStatusMessage,
    successStatusMessage,
    successToastMessage,
    waitingStatusMessage,
    writeArtist,
  ]);

  return {
    artistTxHash,
    candidateArtistId,
    candidateMissionId,
    candidateName,
    candidateStatus,
    handleRegisterArtist,
    isRegisteringArtist,
    setCandidateArtistId,
    setCandidateMissionId,
    setCandidateName,
  };
}
