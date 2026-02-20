'use client';

import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { VoteRecord, type VoteType } from '@/domain/entities/VoteRecord';
import { publicClient } from '@/lib/viem-clients';
import {
  voteRecordFormSchema,
  type VoteRecordFormData,
  defaultVoteRecordFormValues,
} from '@/schemas/voteRecordSchema';
import { logError } from '@/lib/error-handler';
import { usedUserNoncesAbi } from '@/lib/contract-abis';
import {
  type SelectedUser,
  generateTimestamp,
  generateTimestampBasedId,
  generateUserNonce,
  getSelectedUserIndex,
  resolveUserAddress,
} from '@/lib/user-step-helpers';
import { groupRecordsByUser } from './groupRecords';
import type { UIVoteRecord } from './types';

interface NonceCheckResult {
  isUsed: boolean;
  checked: boolean;
}

export function useMainStep2Records() {
  const {
    contractAddress,
    mainVotingUserAddresses,
    mainVotingCustomUserAddress,
    mainVotingUserNonces,
    mainVotingSignatures,
    setMainVotingUserNonce,
    setMainVotingSignatures,
    setMainVotingRecords,
  } = useAppStore(
    useShallow((s) => ({
      contractAddress: s.contractAddress,
      mainVotingUserAddresses: s.mainVotingUserAddresses,
      mainVotingCustomUserAddress: s.mainVotingCustomUserAddress,
      mainVotingUserNonces: s.mainVotingUserNonces,
      mainVotingSignatures: s.mainVotingSignatures,
      setMainVotingUserNonce: s.setMainVotingUserNonce,
      setMainVotingSignatures: s.setMainVotingSignatures,
      setMainVotingRecords: s.setMainVotingRecords,
    }))
  );

  const form = useForm<VoteRecordFormData>({
    resolver: zodResolver(voteRecordFormSchema),
    defaultValues: defaultVoteRecordFormValues,
    mode: 'onBlur',
  });

  const [selectedUser, setSelectedUser] = useState<SelectedUser>('0');
  const [userNonce, setUserNonce] = useState('');
  const [isCheckingNonce, setIsCheckingNonce] = useState(false);
  const [nonceCheckResult, setNonceCheckResult] = useState<NonceCheckResult | null>(null);
  const [voteType, setVoteType] = useState<VoteType>(1);
  const [records, setRecords] = useState<UIVoteRecord[]>([]);

  useEffect(() => {
    const selectedUserIndex = getSelectedUserIndex(selectedUser);

    if (selectedUserIndex === 0 && mainVotingUserNonces.user1) {
      setUserNonce(mainVotingUserNonces.user1.toString());
    } else if (selectedUserIndex === 1 && mainVotingUserNonces.user2) {
      setUserNonce(mainVotingUserNonces.user2.toString());
    } else if (selectedUserIndex === 99 && mainVotingUserNonces.custom) {
      setUserNonce(mainVotingUserNonces.custom.toString());
    } else {
      setUserNonce('');
    }

    setNonceCheckResult(null);
  }, [mainVotingUserNonces, selectedUser]);

  const buildDomainRecords = (uiRecords: UIVoteRecord[]): VoteRecord[] => {
    return uiRecords.map((record, index) => {
      return new VoteRecord({
        recordId: BigInt(index + 1),
        timestamp: BigInt(record.timestamp),
        missionId: BigInt(record.missionId),
        votingId: BigInt(record.votingId),
        optionId: BigInt(record.optionId),
        voteType: record.voteType,
        userId: record.userId,
        votingAmt: BigInt(record.votingAmt),
        userIndex: record.userIndex,
      });
    });
  };

  const clearUserSignature = (userIndex: 0 | 1 | 99) => {
    setMainVotingSignatures(
      mainVotingSignatures.filter((sig) => sig.userIndex !== userIndex)
    );
  };

  const handleGenerateNonce = () => {
    const selectedUserIndex = getSelectedUserIndex(selectedUser);
    const nonceStr = generateUserNonce(selectedUser);

    setUserNonce(nonceStr);
    setMainVotingUserNonce(selectedUserIndex, BigInt(nonceStr));
    clearUserSignature(selectedUserIndex);
    setNonceCheckResult(null);
  };

  const handleCheckNonce = async () => {
    try {
      const selectedUserIndex = getSelectedUserIndex(selectedUser);
      const userAddress = resolveUserAddress(
        selectedUserIndex,
        mainVotingUserAddresses,
        mainVotingCustomUserAddress
      );

      if (!userAddress) {
        const msg =
          selectedUserIndex === 99
            ? 'Custom 역할이 설정되지 않았습니다. Step 1에서 계정을 할당해주세요!'
            : '먼저 Step 1에서 사용자 지갑을 할당해주세요!';
        toast.error(msg);
        return;
      }

      if (!userNonce || !/^\d+$/.test(userNonce)) {
        toast.error('유효한 Nonce 값을 입력하거나 생성해주세요.');
        return;
      }

      if (!contractAddress) {
        toast.error('컨트랙트 주소가 설정되지 않았습니다!');
        return;
      }

      setIsCheckingNonce(true);
      const nonceBigInt = BigInt(userNonce);

      const isUsed = await publicClient.readContract({
        address: contractAddress,
        abi: usedUserNoncesAbi,
        functionName: 'usedUserNonces',
        args: [userAddress, nonceBigInt],
      });

      setNonceCheckResult({ isUsed: isUsed as boolean, checked: true });

      if (!isUsed) {
        setMainVotingUserNonce(selectedUserIndex, nonceBigInt);
        clearUserSignature(selectedUserIndex);
        toast.success('사용 가능한 Nonce입니다!');
      } else {
        setMainVotingUserNonce(selectedUserIndex, null);
        clearUserSignature(selectedUserIndex);
        toast.warning('이미 사용된 Nonce입니다!');
      }
    } catch (error) {
      logError('useMainStep2Records.handleCheckNonce', error);
      toast.error('Nonce 확인에 실패했습니다');
    } finally {
      setIsCheckingNonce(false);
    }
  };

  const handleGenerateTimestamp = () => {
    form.setValue('timestamp', generateTimestamp(), { shouldValidate: true });
  };

  const handleGenerateVotingId = () => {
    form.setValue('votingId', generateTimestampBasedId(selectedUser), {
      shouldValidate: true,
    });
  };

  const onSubmitRecord = (data: VoteRecordFormData) => {
    try {
      const selectedUserIndex = getSelectedUserIndex(selectedUser);
      const userAddress = resolveUserAddress(
        selectedUserIndex,
        mainVotingUserAddresses,
        mainVotingCustomUserAddress
      );

      if (!userAddress) {
        toast.error('지갑이 설정되지 않았습니다! Step 1에서 계정을 할당해주세요.');
        return;
      }

      if (!userNonce || !/^\d+$/.test(userNonce)) {
        toast.error('유효한 User Nonce를 입력해주세요.');
        return;
      }

      setMainVotingUserNonce(selectedUserIndex, BigInt(userNonce));

      const newUIRecord: UIVoteRecord = {
        userIndex: selectedUserIndex,
        userAddress,
        timestamp: data.timestamp,
        missionId: data.missionId,
        votingId: data.votingId,
        optionId: data.optionId,
        voteType,
        userId: data.userId,
        votingAmt: data.votingAmt,
      };

      const nextRecords = [...records, newUIRecord];
      setRecords(nextRecords);
      setMainVotingRecords(buildDomainRecords(nextRecords));
      clearUserSignature(selectedUserIndex);
      setNonceCheckResult(null);
      toast.success('레코드가 추가되었습니다!');
    } catch (error) {
      logError('useMainStep2Records.onSubmitRecord', error);
      toast.error('레코드 추가에 실패했습니다');
    }
  };

  const handleDeleteRecord = (index: number) => {
    const targetRecord = records[index];
    const nextRecords = records.filter((_, i) => i !== index);
    setRecords(nextRecords);
    setMainVotingRecords(buildDomainRecords(nextRecords));
    if (targetRecord) {
      clearUserSignature(targetRecord.userIndex as 0 | 1 | 99);
    }
    toast.success('레코드가 삭제되었습니다');
  };

  const handleClearAllRecords = () => {
    setRecords([]);
    setMainVotingRecords([]);
    setMainVotingSignatures([]);
    toast.success('모든 레코드가 삭제되었습니다');
  };

  const { user1Records, user2Records, customRecords } = useMemo(
    () => groupRecordsByUser(records),
    [records]
  );

  return {
    form,
    selectedUser,
    setSelectedUser,
    mainVotingCustomUserAddress,
    userNonce,
    setUserNonce,
    isCheckingNonce,
    nonceCheckResult,
    voteType,
    setVoteType,
    recordsCount: records.length,
    user1Records,
    user2Records,
    customRecords,
    handleGenerateNonce,
    handleCheckNonce,
    handleGenerateTimestamp,
    handleGenerateVotingId,
    onSubmitRecord,
    handleDeleteRecord,
    handleClearAllRecords,
  };
}
