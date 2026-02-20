'use client';

import { useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { WalletAdapter } from '@/infrastructure/viem/WalletAdapter';
import { SubVoteRecord } from '@/domain/entities/SubVoteRecord';
import { publicClient } from '@/lib/viem-clients';
import { usedUserNoncesAbi } from '@/lib/contract-abis';
import {
  type SelectedUser,
  generateTimestamp,
  generateTimestampBasedId,
  generateUserNonce,
  getSelectedUserIndex,
  resolveUserAddress,
} from '@/lib/user-step-helpers';
import { getErrorMessage, logError } from '@/lib/error-handler';
import type {
  IndexedSubVoteRecord,
  SubStep2State,
  UISubVoteRecord,
} from './types';

const CONFIG = {
  MAX_RECORDS_PER_BATCH: 20,
  MAX_OPTIONS_PER_RECORD: 5,
} as const;

function buildSubVotingRecords(nextRecords: UISubVoteRecord[]) {
  const domainRecords: SubVoteRecord[] = [];

  nextRecords.forEach((record, recordIndex) => {
    record.options.forEach((optionId, optionIdx) => {
      domainRecords.push(
        new SubVoteRecord({
          recordId: BigInt(recordIndex * 100 + optionIdx),
          timestamp: BigInt(record.timestamp),
          missionId: BigInt(record.missionId),
          votingId: BigInt(record.votingId),
          questionId: BigInt(record.questionId),
          optionId: BigInt(optionId),
          userId: record.userId,
          votingAmt: BigInt(record.votingAmt),
          userIndex: record.userIndex,
          userAddress: record.userAddress as `0x${string}`,
          userNonce: BigInt(record.userNonce),
        })
      );
    });
  });

  return domainRecords;
}

export function useSubStep2Records(): SubStep2State {
  const {
    contractAddress,
    mainVotingUserAddresses,
    setSubVotingRecords,
    setSubVotingSignatures,
    setMainVotingUserNonce,
  } = useAppStore(
    useShallow((s) => ({
      contractAddress: s.contractAddress,
      mainVotingUserAddresses: s.mainVotingUserAddresses,
      setSubVotingRecords: s.setSubVotingRecords,
      setSubVotingSignatures: s.setSubVotingSignatures,
      setMainVotingUserNonce: s.setMainVotingUserNonce,
    }))
  );

  const [selectedUser, setSelectedUser] = useState<SelectedUser>('0');
  const [customPrivateKey, setCustomPrivateKey] = useState('');
  const [customWallet, setCustomWallet] = useState<WalletAdapter | null>(null);

  const [userNonce, setUserNonce] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [missionId, setMissionId] = useState('1');
  const [votingId, setVotingId] = useState('');
  const [questionId, setQuestionId] = useState('1');
  const [options, setOptions] = useState('');
  const [votingAmt, setVotingAmt] = useState('100');

  const [records, setRecords] = useState<UISubVoteRecord[]>([]);
  const [nonceCheckResult, setNonceCheckResult] = useState<{
    isUsed: boolean;
    message: string;
  } | null>(null);
  const [isCheckingNonce, setIsCheckingNonce] = useState(false);
  const [optionsError, setOptionsError] = useState('');

  const handleCustomPrivateKeyChange = useCallback((value: string) => {
    setCustomPrivateKey(value);
    const trimmed = value.trim();
    if (!trimmed) {
      setCustomWallet(null);
      return;
    }

    try {
      const privateKey = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
      const wallet = new WalletAdapter(privateKey as `0x${string}`);
      setCustomWallet(wallet);
    } catch (error) {
      logError('useSubStep2Records.customWalletInit', error);
      setCustomWallet(null);
    }
  }, []);

  const handleGenerateNonce = useCallback(() => {
    setUserNonce(generateUserNonce(selectedUser));
    setNonceCheckResult(null);
    toast.success('Nonce 생성 완료');
  }, [selectedUser]);

  const handleCheckNonce = useCallback(async () => {
    if (!userNonce.trim() || !/^\d+$/.test(userNonce)) {
      toast.error('유효한 Nonce 값을 입력해주세요');
      return;
    }

    const selectedUserIndex = getSelectedUserIndex(selectedUser);
    const userAddress = resolveUserAddress(
      selectedUserIndex,
      mainVotingUserAddresses,
      customWallet?.address ?? null
    );

    if (!userAddress) {
      toast.error(
        selectedUserIndex === 99
          ? 'Custom 지갑이 설정되지 않았습니다'
          : '먼저 Step 1에서 사용자 지갑을 할당해주세요'
      );
      return;
    }

    if (!contractAddress) {
      toast.error('SubVoting 컨트랙트 주소가 설정되지 않았습니다');
      return;
    }

    setIsCheckingNonce(true);

    try {
      const nonceBigInt = BigInt(userNonce);
      const isUsed = await publicClient.readContract({
        address: contractAddress,
        abi: usedUserNoncesAbi,
        functionName: 'usedUserNonces',
        args: [userAddress as `0x${string}`, nonceBigInt],
      });

      setNonceCheckResult({
        isUsed: isUsed as boolean,
        message: isUsed ? '이미 사용된 Nonce입니다' : '사용 가능한 Nonce입니다',
      });
    } catch (error) {
      logError('useSubStep2Records.handleCheckNonce', error);
      const message = getErrorMessage(error, '알 수 없는 오류');
      setNonceCheckResult({
        isUsed: true,
        message: `중복 확인 실패: ${message}`,
      });
    } finally {
      setIsCheckingNonce(false);
    }
  }, [
    contractAddress,
    customWallet,
    mainVotingUserAddresses,
    selectedUser,
    userNonce,
  ]);

  const handleGenerateTimestamp = useCallback(() => {
    setTimestamp(generateTimestamp());
    toast.success('Timestamp 생성 완료');
  }, []);

  const handleGenerateVotingId = useCallback(() => {
    setVotingId(generateTimestampBasedId(selectedUser));
    toast.success('Voting ID 생성 완료');
  }, [selectedUser]);

  const handleAddRecord = useCallback(() => {
    if (records.length >= CONFIG.MAX_RECORDS_PER_BATCH) {
      toast.error(`최대 ${CONFIG.MAX_RECORDS_PER_BATCH}개까지만 추가할 수 있습니다`);
      return;
    }

    const selectedUserIndex = getSelectedUserIndex(selectedUser);
    const userAddress = resolveUserAddress(
      selectedUserIndex,
      mainVotingUserAddresses,
      customWallet?.address ?? null
    );

    if (!userAddress) {
      toast.error(
        selectedUserIndex === 99
          ? 'Private Key를 입력해주세요'
          : '먼저 Step 1에서 사용자 지갑을 할당해주세요'
      );
      return;
    }

    if (!userNonce.trim() || !/^\d+$/.test(userNonce)) {
      toast.error('User Nonce를 입력하거나 생성 버튼을 눌러주세요');
      return;
    }

    if (!votingId.trim() || !/^\d+$/.test(votingId)) {
      toast.error('먼저 자동 생성 버튼을 눌러 Voting ID를 생성해주세요');
      return;
    }

    const existing = records.find((record) => record.userIndex === selectedUserIndex);
    if (existing && existing.votingId !== votingId) {
      toast.info(
        '같은 유저의 레코드는 모두 같은 votingId여야 합니다. 기존 votingId로 자동 맞춥니다.'
      );
      setVotingId(existing.votingId);
    }

    const optionsInput = options.trim();
    if (!optionsInput) {
      setOptionsError('최소 1개 이상의 옵션을 선택해주세요!');
      toast.error('옵션을 입력해주세요');
      return;
    }

    const parsedOptions = optionsInput
      .split(',')
      .map((option) => option.trim())
      .filter((option) => option !== '');

    if (parsedOptions.length === 0) {
      setOptionsError('유효한 옵션을 입력해주세요! (예: 1,2,3)');
      toast.error('유효한 옵션을 입력해주세요');
      return;
    }

    if (parsedOptions.length > CONFIG.MAX_OPTIONS_PER_RECORD) {
      setOptionsError(`최대 ${CONFIG.MAX_OPTIONS_PER_RECORD}개까지만 선택할 수 있습니다!`);
      toast.error(`최대 ${CONFIG.MAX_OPTIONS_PER_RECORD}개까지만 선택 가능`);
      return;
    }

    if (!parsedOptions.every((option) => /^\d+$/.test(option))) {
      setOptionsError('옵션은 숫자만 입력해주세요! (예: 1,2,3)');
      toast.error('옵션은 숫자만 입력해주세요');
      return;
    }

    setOptionsError('');

    const record: UISubVoteRecord = {
      userIndex: selectedUserIndex,
      userAddress,
      userNonce,
      timestamp: timestamp.trim() || generateTimestamp(),
      missionId,
      votingId: existing ? existing.votingId : votingId,
      questionId,
      options: parsedOptions,
      userId: 'user123',
      votingAmt,
    };

    const nextRecords = [...records, record];
    setRecords(nextRecords);
    setMainVotingUserNonce(selectedUserIndex, BigInt(userNonce));
    setSubVotingRecords(buildSubVotingRecords(nextRecords));
    setSubVotingSignatures([]);
    toast.success('레코드 추가 완료');
  }, [
    customWallet,
    mainVotingUserAddresses,
    missionId,
    options,
    questionId,
    records,
    selectedUser,
    setMainVotingUserNonce,
    setSubVotingSignatures,
    setSubVotingRecords,
    timestamp,
    userNonce,
    votingAmt,
    votingId,
  ]);

  const handleDeleteRecord = useCallback(
    (index: number) => {
      if (index < 0 || index >= records.length) {
        toast.error('잘못된 레코드 인덱스입니다');
        return;
      }

      const record = records[index];
      const userName =
        record.userIndex === 0
          ? 'User 1'
          : record.userIndex === 1
            ? 'User 2'
            : 'Custom';

      if (window.confirm(`${userName}의 레코드를 삭제하시겠습니까?`)) {
        const nextRecords = records.filter((_, i) => i !== index);
        setRecords(nextRecords);
        setSubVotingRecords(buildSubVotingRecords(nextRecords));
        setSubVotingSignatures([]);
        toast.success('레코드 삭제 완료');
      }
    },
    [records, setSubVotingSignatures, setSubVotingRecords]
  );

  const { user1Records, user2Records, customRecords } = useMemo(() => {
    return records.reduce<{
      user1Records: IndexedSubVoteRecord[];
      user2Records: IndexedSubVoteRecord[];
      customRecords: IndexedSubVoteRecord[];
    }>(
      (acc, record, globalIndex) => {
        const indexedRecord = { record, globalIndex };
        if (record.userIndex === 0) {
          acc.user1Records.push(indexedRecord);
        } else if (record.userIndex === 1) {
          acc.user2Records.push(indexedRecord);
        } else if (record.userIndex === 99) {
          acc.customRecords.push(indexedRecord);
        }
        return acc;
      },
      { user1Records: [], user2Records: [], customRecords: [] }
    );
  }, [records]);

  return {
    selectedUser,
    setSelectedUser,
    customPrivateKey,
    customWalletAddress: customWallet?.address ?? null,
    handleCustomPrivateKeyChange,
    userNonce,
    setUserNonce,
    isCheckingNonce,
    nonceCheckResult,
    timestamp,
    setTimestamp,
    missionId,
    setMissionId,
    votingId,
    setVotingId,
    questionId,
    setQuestionId,
    options,
    setOptions,
    votingAmt,
    setVotingAmt,
    optionsError,
    clearOptionsError: () => setOptionsError(''),
    recordsCount: records.length,
    maxRecordsPerBatch: CONFIG.MAX_RECORDS_PER_BATCH,
    maxOptionsPerRecord: CONFIG.MAX_OPTIONS_PER_RECORD,
    user1Records,
    user2Records,
    customRecords,
    handleGenerateNonce,
    handleCheckNonce,
    handleGenerateTimestamp,
    handleGenerateVotingId,
    handleAddRecord,
    handleDeleteRecord,
  };
}
