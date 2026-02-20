'use client';

import { useMemo, useState } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { DigestService } from '@/domain/services/DigestService';
import { toast } from 'sonner';
import { concat, keccak256, type Hash } from 'viem';
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

export function SubStep3UserSigs() {
  const selectedChainId = useAppStore((s) => s.selectedChainId);
  const contractAddress = useAppStore((s) => s.contractAddress);
  const subVotingRecords = useAppStore((s) => s.subVotingRecords);
  const subVotingSignatures = useAppStore((s) => s.subVotingSignatures);
  const setSubVotingSignatures = useAppStore((s) => s.setSubVotingSignatures);
  const mainVotingUserAddresses = useAppStore((s) => s.mainVotingUserAddresses);
  const mainVotingCustomUserAddress = useAppStore(
    (s) => s.mainVotingCustomUserAddress
  );
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
    subVotingRecords.forEach((record) => {
      const idx = record.userIndex ?? -1;
      if (idx === 0 || idx === 1 || idx === 99) {
        map[idx] += 1;
      }
    });
    return map;
  }, [subVotingRecords]);

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

  const handleSignUserBatch = async (userIndex: UserIndex) => {
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

      const userRecords = subVotingRecords.filter(
        (r) => r.userIndex === userIndex
      );

      if (userRecords.length === 0) {
        toast.error(`${role?.label ?? '사용자'}의 레코드가 없습니다. Step 2에서 레코드를 추가해주세요.`);
        return;
      }

      const domain = {
        name: 'SubVoting',
        version: '1',
        chainId: selectedChainId,
        verifyingContract: contractAddress,
      };

      const types = {
        UserBatch: [
          { name: 'user', type: 'address' },
          { name: 'userNonce', type: 'uint256' },
          { name: 'recordsHash', type: 'bytes32' },
        ],
      };

      const recordHashes: Hash[] = userRecords.map((r) =>
        DigestService.hashSubVoteRecord(
          {
            timestamp: r.timestamp,
            missionId: r.missionId,
            votingId: r.votingId,
            questionId: r.questionId,
            optionId: r.optionId,
            votingAmt: r.votingAmt,
          },
          userAddress
        )
      );

      const recordsHash = keccak256(concat(recordHashes));

      const message = {
        user: userAddress,
        userNonce,
        recordsHash,
      };

      const walletClient = getInjectedWalletClient(selectedChainId);
      await ensureCorrectChain(walletClient, selectedChainId);
      const activeAddress = await ensureActiveAddress(userAddress);

      const signature = await walletClient.signTypedData({
        account: activeAddress,
        domain,
        types,
        primaryType: 'UserBatch',
        message,
      });

      const userBatchSig: UserBatchSignature = {
        userIndex,
        userAddress,
        userNonce,
        signature: signature as Hash,
      };

      const updatedSignatures = subVotingSignatures.filter(
        (sig) => sig.userIndex !== userIndex
      );
      updatedSignatures.push(userBatchSig);
      setSubVotingSignatures(updatedSignatures);

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

      logError('SubStep3UserSigs.handleSignUserBatch', error);
      toast.error(getBlockchainErrorMessage(error));
    } finally {
      setSigningUserIndex(null);
    }
  };

  const handleClearSignature = (userIndex: UserIndex) => {
    const updatedSignatures = subVotingSignatures.filter(
      (sig) => sig.userIndex !== userIndex
    );
    setSubVotingSignatures(updatedSignatures);
    toast.success('사용자 서명 삭제 완료');
  };

  const getSignatureForUser = (userIndex: UserIndex) => {
    return subVotingSignatures.find((sig) => sig.userIndex === userIndex) ?? null;
  };

  return (
    <StepCard
      stepNumber={3}
      title="사용자 배치 서명 생성"
      description="각 사용자가 자신의 SubVoting 레코드 배치에 서명합니다"
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
                      onClick={() => handleSignUserBatch(role.index)}
                      disabled={
                        signingUserIndex === role.index ||
                        !role.address ||
                        recordCount === 0
                      }
                    >
                      {signingUserIndex === role.index ? '서명 중...' : '서명 생성'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClearSignature(role.index)}
                      disabled={!signature}
                    >
                      삭제
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted">
          <CardContent className="p-4 text-sm text-muted-foreground space-y-1">
            <p>완료된 사용자 서명: {subVotingSignatures.length}명</p>
            <p>서명 타입: UserBatch(user, userNonce, recordsHash)</p>
          </CardContent>
        </Card>
      </div>
    </StepCard>
  );
}
