'use client';

import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { WalletAdapter } from '@/infrastructure/viem/WalletAdapter';
import { BoostRecord } from '@/domain/entities/BoostRecord';
import { publicClient } from '@/lib/viem-clients';
import type { Address } from '@/domain/types';
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
  BoostStep2State,
  IndexedBoostRecord,
  NonceCheckStatus,
  UIBoostRecord,
} from './types';

const USER_ID_INPUT = '1';

export function useBoostStep2Record(): BoostStep2State {
  const {
    mainVotingUserAddresses,
    contractAddress,
    addBoostingRecord,
    clearBoostingRecords,
    setBoostingSignatures,
    setMainVotingUserNonce,
  } = useAppStore(
    useShallow((s) => ({
      mainVotingUserAddresses: s.mainVotingUserAddresses,
      contractAddress: s.contractAddress,
      addBoostingRecord: s.addBoostingRecord,
      clearBoostingRecords: s.clearBoostingRecords,
      setBoostingSignatures: s.setBoostingSignatures,
      setMainVotingUserNonce: s.setMainVotingUserNonce,
    }))
  );

  const [selectedUser, setSelectedUser] = useState<SelectedUser>('0');
  const [customPrivateKey, setCustomPrivateKey] = useState('');
  const [customWallet, setCustomWallet] = useState<WalletAdapter | null>(null);
  const [customAddress, setCustomAddress] = useState<string | null>(null);

  const [userNonce, setUserNonce] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [boostingId, setBoostingId] = useState('');
  const [missionId, setMissionId] = useState('1');
  const [optionId, setOptionId] = useState('1');
  const [boostingWith, setBoostingWith] = useState<'0' | '1'>('0');
  const [amt, setAmt] = useState('1000');

  const [records, setRecords] = useState<UIBoostRecord[]>([]);
  const [nonceCheckStatus, setNonceCheckStatus] = useState<NonceCheckStatus>({
    type: null,
    message: '',
  });

  useEffect(() => {
    const rawKey = customPrivateKey.trim();

    if (!rawKey) {
      setCustomWallet(null);
      setCustomAddress(null);
      return;
    }

    const privateKey = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`;

    try {
      const wallet = new WalletAdapter(privateKey as `0x${string}`);
      setCustomWallet(wallet);
      setCustomAddress(wallet.address);
    } catch (error) {
      logError('useBoostStep2Record.customWalletInit', error);
      setCustomWallet(null);
      setCustomAddress(null);
    }
  }, [customPrivateKey]);

  const updateStore = (nextRecords: UIBoostRecord[]) => {
    clearBoostingRecords();
    setBoostingSignatures([]);

    nextRecords.forEach((record) => {
      const boostRecord = new BoostRecord({
        recordId: 0n,
        timestamp: BigInt(record.timestamp),
        missionId: BigInt(record.missionId),
        boostingId: BigInt(record.boostingId),
        optionId: BigInt(record.optionId),
        boostingWith: record.boostingWith,
        amt: BigInt(record.amt),
        userId: record.userId,
        userIndex: record.userIndex,
        userAddress: record.userAddress,
        userNonce: BigInt(record.userNonce),
      });
      addBoostingRecord(boostRecord);
    });
  };

  const handleGenerateTimestamp = () => {
    setTimestamp(generateTimestamp());
    toast.success('타임스탬프가 생성되었습니다');
  };

  const handleGenerateBoostingId = () => {
    setBoostingId(generateTimestampBasedId(selectedUser));
    toast.success('Boosting ID가 생성되었습니다');
  };

  const handleGenerateNonce = () => {
    setUserNonce(generateUserNonce(selectedUser));
    setNonceCheckStatus({ type: null, message: '' });
    toast.success('User Nonce가 생성되었습니다');
  };

  const handleCheckNonce = async () => {
    try {
      if (!userNonce || !/^\d+$/.test(userNonce)) {
        toast.error('유효한 Nonce 값을 입력하거나 생성해주세요.');
        return;
      }

      const selectedUserIndex = getSelectedUserIndex(selectedUser);
      const userAddress = resolveUserAddress(
        selectedUserIndex,
        mainVotingUserAddresses,
        customWallet?.address ?? null
      );

      if (!userAddress) {
        if (selectedUserIndex === 99) {
          toast.error('Custom 지갑이 설정되지 않았습니다!');
        } else {
          toast.error('먼저 Step 1에서 사용자 지갑을 할당해주세요!');
        }
        return;
      }

      if (!contractAddress) {
        toast.error('컨트랙트 주소가 설정되지 않았습니다!');
        return;
      }

      const nonceBigInt = BigInt(userNonce);

      const isUsed = (await publicClient.readContract({
        address: contractAddress,
        abi: usedUserNoncesAbi,
        functionName: 'usedUserNonces',
        args: [userAddress, nonceBigInt],
      })) as boolean;

      if (isUsed) {
        setNonceCheckStatus({
          type: 'error',
          message: '이미 사용된 Nonce입니다. 다른 값을 사용해주세요.',
        });
        toast.error('이미 사용된 Nonce입니다');
      } else {
        setNonceCheckStatus({
          type: 'success',
          message: '사용 가능한 Nonce입니다.',
        });
        toast.success('사용 가능한 Nonce입니다');
      }
    } catch (error) {
      logError('useBoostStep2Record.handleCheckNonce', error);
      const message = getErrorMessage(error, '알 수 없는 오류');
      setNonceCheckStatus({
        type: 'error',
        message: `중복 확인 실패: ${message}`,
      });
      toast.error('Nonce 중복 확인에 실패했습니다');
    }
  };

  const handleAddRecord = () => {
    const selectedUserIndex = getSelectedUserIndex(selectedUser);

    let userAddress: Address | null = null;

    if (selectedUserIndex === 99) {
      if (!customPrivateKey) {
        toast.error('Private Key를 입력해주세요!');
        return;
      }
      if (!customWallet) {
        toast.error('유효하지 않은 Private Key입니다.');
        return;
      }
      userAddress = customWallet.address;
    } else {
      userAddress = resolveUserAddress(
        selectedUserIndex,
        mainVotingUserAddresses,
        null
      );
      if (!userAddress) {
        toast.error('먼저 Step 1에서 사용자 지갑을 할당해주세요!');
        return;
      }
    }

    const existing = records.find((record) => record.userIndex === selectedUserIndex);
    if (existing) {
      toast.error(
        'Boosting은 각 사용자당 1개의 레코드만 추가할 수 있습니다.\n기존 레코드를 삭제한 후 새로 추가해주세요.'
      );
      return;
    }

    if (!userNonce || !/^\d+$/.test(userNonce)) {
      toast.error('유효한 User Nonce를 입력하거나 생성해주세요!');
      return;
    }

    if (!boostingId || !/^\d+$/.test(boostingId)) {
      toast.error('유효한 Boosting ID를 입력하거나 생성해주세요!');
      return;
    }

    if (!amt || amt === '0' || !/^\d+$/.test(amt)) {
      toast.error('Amount는 0보다 큰 숫자여야 합니다.');
      return;
    }

    const record: UIBoostRecord = {
      userIndex: selectedUserIndex,
      userAddress,
      userNonce,
      timestamp: timestamp || generateTimestamp(),
      missionId,
      boostingId,
      optionId,
      boostingWith: boostingWith === '0' ? 0 : 1,
      amt,
      userId: USER_ID_INPUT,
    };

    const nextRecords = [...records, record];
    setRecords(nextRecords);
    setMainVotingUserNonce(selectedUserIndex, BigInt(userNonce));
    updateStore(nextRecords);
    toast.success('레코드가 추가되었습니다!');
  };

  const handleDeleteRecord = (index: number) => {
    if (index < 0 || index >= records.length) {
      toast.error('잘못된 레코드 인덱스입니다.');
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
      updateStore(nextRecords);
      toast.success('레코드가 삭제되었습니다');
    }
  };

  const { user1Record, user2Record, customRecord } = useMemo(() => {
    const result: {
      user1Record: IndexedBoostRecord | null;
      user2Record: IndexedBoostRecord | null;
      customRecord: IndexedBoostRecord | null;
    } = {
      user1Record: null,
      user2Record: null,
      customRecord: null,
    };

    records.forEach((record, globalIndex) => {
      if (record.userIndex === 0 && !result.user1Record) {
        result.user1Record = { record, globalIndex };
      } else if (record.userIndex === 1 && !result.user2Record) {
        result.user2Record = { record, globalIndex };
      } else if (record.userIndex === 99 && !result.customRecord) {
        result.customRecord = { record, globalIndex };
      }
    });

    return result;
  }, [records]);

  return {
    selectedUser,
    setSelectedUser,
    customPrivateKey,
    setCustomPrivateKey,
    customAddress,
    userNonce,
    setUserNonce,
    timestamp,
    setTimestamp,
    boostingId,
    setBoostingId,
    missionId,
    setMissionId,
    optionId,
    setOptionId,
    boostingWith,
    setBoostingWith,
    amt,
    setAmt,
    recordsCount: records.length,
    user1Record,
    user2Record,
    customRecord,
    nonceCheckStatus,
    handleGenerateTimestamp,
    handleGenerateBoostingId,
    handleGenerateNonce,
    handleCheckNonce,
    handleAddRecord,
    handleDeleteRecord,
  };
}
