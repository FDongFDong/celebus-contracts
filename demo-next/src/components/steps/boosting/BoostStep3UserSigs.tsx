'use client';

import { useMemo, useState } from 'react';
import { type Hash } from 'viem';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { DigestService } from '@/domain/services/DigestService';
import { toast } from 'sonner';
import type { UserBatchSignature } from '@/store/useAppStore';
import {
  ensureActiveAddress,
  ensureCorrectChain,
  getInjectedWalletClient,
  WalletNotConnectedError,
} from '@/lib/injected-wallet';
import {
  getBlockchainErrorMessage,
  isUserRejectionError,
  logError,
} from '@/lib/error-handler';
import { formatAddress } from '@/lib/format';

type UserIndex = 0 | 1 | 99;

export function BoostStep3UserSigs() {
  const selectedChainId = useAppStore((s) => s.selectedChainId);
  const contractAddress = useAppStore((s) => s.contractAddress);
  const boostingRecords = useAppStore((s) => s.boostingRecords);
  const boostingSignatures = useAppStore((s) => s.boostingSignatures);
  const setBoostingSignatures = useAppStore((s) => s.setBoostingSignatures);
  const mainVotingUserAddresses = useAppStore((s) => s.mainVotingUserAddresses);
  const mainVotingCustomUserAddress = useAppStore((s) => s.mainVotingCustomUserAddress);
  const mainVotingUserNonces = useAppStore((s) => s.mainVotingUserNonces);

  const [signingUserIndex, setSigningUserIndex] = useState<UserIndex | null>(null);

  const userRoles = useMemo(() => {
    return [
      {
        index: 0 as UserIndex,
        label: '사용자 1',
        color: 'blue' as const,
        address: mainVotingUserAddresses[0] ?? null,
      },
      {
        index: 1 as UserIndex,
        label: '사용자 2',
        color: 'green' as const,
        address: mainVotingUserAddresses[1] ?? null,
      },
      {
        index: 99 as UserIndex,
        label: 'Custom',
        color: 'purple' as const,
        address: mainVotingCustomUserAddress ?? null,
      },
    ];
  }, [mainVotingCustomUserAddress, mainVotingUserAddresses]);

  const recordsByUserIndex = useMemo(() => {
    const map: Record<string, number> = { 0: 0, 1: 0, 99: 0 };
    boostingRecords.forEach((record) => {
      const idx = record.userIndex ?? -1;
      if (idx === 0 || idx === 1 || idx === 99) {
        map[idx] += 1;
      }
    });
    return map;
  }, [boostingRecords]);

  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/30',
    green: 'bg-green-500/10 border-green-500/30',
    purple: 'bg-purple-500/10 border-purple-500/30',
  } as const;

  const getUserNonce = (userIndex: UserIndex): bigint | null => {
    if (userIndex === 0) return mainVotingUserNonces.user1;
    if (userIndex === 1) return mainVotingUserNonces.user2;
    return mainVotingUserNonces.custom;
  };

  const handleSignUserRecord = async (userIndex: UserIndex) => {
    try {
      setSigningUserIndex(userIndex);

      const role = userRoles.find((r) => r.index === userIndex);
      const userAddress = role?.address ?? null;

      if (!userAddress) {
        toast.error('먼저 Step 1에서 사용자 지갑을 할당해주세요.');
        return;
      }

      if (!contractAddress) {
        toast.error('컨트랙트 주소가 설정되지 않았습니다.');
        return;
      }

      const userNonce = getUserNonce(userIndex);
      if (userNonce === null) {
        toast.error('User Nonce가 설정되지 않았습니다. Step 2에서 입력해주세요.');
        return;
      }

      const userRecord = boostingRecords.find((record) => record.userIndex === userIndex);
      if (!userRecord) {
        toast.error(`${role?.label ?? '사용자'}의 레코드가 없습니다. Step 2에서 레코드를 추가해주세요.`);
        return;
      }

      const domain = {
        name: 'Boosting',
        version: '1',
        chainId: selectedChainId,
        verifyingContract: contractAddress,
      };

      const types = {
        UserSig: [
          { name: 'user', type: 'address' },
          { name: 'userNonce', type: 'uint256' },
          { name: 'recordHash', type: 'bytes32' },
        ],
      };

      const recordHash: Hash = DigestService.hashBoostRecord(
        {
          timestamp: userRecord.timestamp,
          missionId: userRecord.missionId,
          boostingId: userRecord.boostingId,
          optionId: userRecord.optionId,
          boostingWith: userRecord.boostingWith,
          amt: userRecord.amt,
        },
        userAddress
      );

      const message = {
        user: userAddress,
        userNonce,
        recordHash,
      };

      const walletClient = getInjectedWalletClient(selectedChainId);
      await ensureCorrectChain(walletClient, selectedChainId);
      const activeAddress = await ensureActiveAddress(userAddress);

      const signature = await walletClient.signTypedData({
        account: activeAddress,
        domain,
        types,
        primaryType: 'UserSig',
        message,
      });

      const userSig: UserBatchSignature = {
        userIndex,
        userAddress,
        userNonce,
        signature: signature as Hash,
      };

      const updatedSignatures = boostingSignatures.filter(
        (sig) => sig.userIndex !== userIndex
      );
      updatedSignatures.push(userSig);
      setBoostingSignatures(updatedSignatures);

      toast.success(`${role?.label ?? '사용자'} 서명 생성 완료`);
    } catch (error) {
      if (error instanceof WalletNotConnectedError) {
        toast.info('지갑을 먼저 연결해주세요 (Step 0)');
        return;
      }

      if (isUserRejectionError(error)) {
        toast.info('서명이 취소되었습니다');
        return;
      }

      logError('BoostStep3UserSigs.handleSignUserRecord', error);
      toast.error(getBlockchainErrorMessage(error));
    } finally {
      setSigningUserIndex(null);
    }
  };

  const handleClearSignature = (userIndex: UserIndex) => {
    const updatedSignatures = boostingSignatures.filter(
      (sig) => sig.userIndex !== userIndex
    );
    setBoostingSignatures(updatedSignatures);
    toast.success('사용자 서명 삭제 완료');
  };

  const getSignatureForUser = (userIndex: UserIndex) => {
    return boostingSignatures.find((sig) => sig.userIndex === userIndex) ?? null;
  };

  return (
    <StepCard
      stepNumber={3}
      title="사용자 서명 생성"
      description="각 사용자가 자신의 Boosting 레코드에 서명합니다"
      badgeColor="secondary"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {userRoles.map((role) => {
            const signature = getSignatureForUser(role.index);
            const recordCount = recordsByUserIndex[role.index] ?? 0;

            return (
              <Card key={role.index} className={colorClasses[role.color]}>
                <CardHeader>
                  <CardTitle className="text-base">{role.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-muted-foreground break-all font-mono">
                    주소: {formatAddress(role.address)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    레코드 수: {recordCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Nonce: {getUserNonce(role.index)?.toString() ?? '-'}
                  </div>

                  {signature ? (
                    <Badge variant="secondary">서명 완료</Badge>
                  ) : (
                    <Badge variant="outline">서명 없음</Badge>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSignUserRecord(role.index)}
                      disabled={
                        signingUserIndex === role.index ||
                        !role.address ||
                        recordCount === 0
                      }
                    >
                      {signingUserIndex === role.index ? '서명 중...' : '서명 생성'}
                    </Button>

                    {signature && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClearSignature(role.index)}
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </StepCard>
  );
}
