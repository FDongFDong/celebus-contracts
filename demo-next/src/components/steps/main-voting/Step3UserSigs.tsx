/**
 * MainVoting Step 3: 사용자 배치 서명 생성
 *
 * 각 사용자가 자신의 레코드에 대해 EIP-712 서명을 생성하는 컴포넌트
 */

'use client';

import { useMemo, useState } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { DigestService } from '@/domain/services/DigestService';
import { toast } from 'sonner';
import { keccak256, concat, type Hash } from 'viem';
import type { Address } from '@/domain/types';
import type { UserBatchSignature } from '@/store/useAppStore';
import {
  ensureActiveAddress,
  ensureCorrectChain,
  getInjectedWalletClient,
  WalletNotConnectedError,
} from '@/lib/injected-wallet';
import { logError, getBlockchainErrorMessage } from '@/lib/error-handler';

/**
 * 백엔드 전송 데이터 구조
 */
interface BackendSubmitData {
  records: Array<{
    timestamp: string;
    missionId: string;
    votingId: string;
    optionId: string;
    voteType: number;
    votingAmt: string;
  }>;
  userBatchSig: {
    user: Address;
    userNonce: string;
    signature: Hash;
  };
}

type UserIndex = 0 | 1 | 99;

/**
 * Step 3: 사용자 배치 서명 생성 컴포넌트
 */
export function Step3UserSigs() {
  // -------------------------------------------------------------------------
  // Store State
  // -------------------------------------------------------------------------
  const selectedChainId = useAppStore((s) => s.selectedChainId);
  const contractAddress = useAppStore((s) => s.contractAddress);
  const mainVotingRecords = useAppStore((s) => s.mainVotingRecords);
  const mainVotingSignatures = useAppStore((s) => s.mainVotingSignatures);
  const setMainVotingSignatures = useAppStore((s) => s.setMainVotingSignatures);
  const mainVotingUserAddresses = useAppStore((s) => s.mainVotingUserAddresses);
  const mainVotingCustomUserAddress = useAppStore(
    (s) => s.mainVotingCustomUserAddress
  );
  const mainVotingUserNonces = useAppStore((s) => s.mainVotingUserNonces);

  // -------------------------------------------------------------------------
  // Local State
  // -------------------------------------------------------------------------
  const [signingUserIndex, setSigningUserIndex] = useState<UserIndex | null>(null);
  const [backendData, setBackendData] = useState<Record<string, BackendSubmitData | null>>({
    0: null,
    1: null,
    99: null,
  });

  // -------------------------------------------------------------------------
  // Derived Values
  // -------------------------------------------------------------------------
  const userRoles = useMemo(() => {
    return [
      {
        index: 0 as UserIndex,
        label: '사용자 1',
        color: 'blue' as const,
        address: mainVotingUserAddresses[0] ?? null,
        deviceLabel: 'iPhone, Seoul, 10:00:01',
        icon: '📱',
      },
      {
        index: 1 as UserIndex,
        label: '사용자 2',
        color: 'green' as const,
        address: mainVotingUserAddresses[1] ?? null,
        deviceLabel: 'Desktop, Busan, 10:00:05',
        icon: '💻',
      },
      {
        index: 99 as UserIndex,
        label: 'Custom',
        color: 'purple' as const,
        address: mainVotingCustomUserAddress ?? null,
        deviceLabel: 'Custom device',
        icon: '🧩',
      },
    ];
  }, [mainVotingCustomUserAddress, mainVotingUserAddresses]);

  const recordsByUserIndex = useMemo(() => {
    const map: Record<string, number> = { 0: 0, 1: 0, 99: 0 };
    mainVotingRecords.forEach((record) => {
      const idx = record.userIndex ?? -1;
      if (idx === 0 || idx === 1 || idx === 99) {
        map[idx] += 1;
      }
    });
    return map;
  }, [mainVotingRecords]);

  const colorClasses = {
    blue: {
      card: 'bg-blue-500/10 border-blue-500/30',
      backend: 'bg-blue-500/10 border-2 border-blue-500/40',
    },
    green: {
      card: 'bg-green-500/10 border-green-500/30',
      backend: 'bg-green-500/10 border-2 border-green-500/40',
    },
    purple: {
      card: 'bg-purple-500/10 border-purple-500/30',
      backend: 'bg-purple-500/10 border-2 border-purple-500/40',
    },
  } as const;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const getUserNonce = (userIndex: UserIndex): bigint | null => {
    if (userIndex === 0) return mainVotingUserNonces.user1;
    if (userIndex === 1) return mainVotingUserNonces.user2;
    return mainVotingUserNonces.custom;
  };

  /**
   * 사용자 배치 서명 생성
   */
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
        toast.error('컨트랙트 주소가 설정되지 않았습니다!');
        return;
      }

      const userNonce = getUserNonce(userIndex);
      if (userNonce === null) {
        toast.error('User Nonce가 설정되지 않았습니다. Step 2에서 입력해주세요.');
        return;
      }

      const userRecords = mainVotingRecords.filter(
        (r) => r.userIndex === userIndex
      );

      if (userRecords.length === 0) {
        toast.error(`${role?.label ?? '사용자'}의 레코드가 없습니다. Step 2에서 레코드를 추가해주세요.`);
        return;
      }

      const walletClient = getInjectedWalletClient(selectedChainId);

      const domain = {
        name: 'MainVoting',
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

      const recordHashes: Hash[] = userRecords.map((r) => {
        const recordData = {
          timestamp: r.timestamp,
          missionId: r.missionId,
          votingId: r.votingId,
          optionId: r.optionId,
          voteType: r.voteType,
          votingAmt: r.votingAmt,
        };
        return DigestService.hashVoteRecord(recordData, userAddress);
      });

      const recordsHash = keccak256(concat(recordHashes));

      const message = {
        user: userAddress,
        userNonce,
        recordsHash,
      };

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

      const updatedSignatures = mainVotingSignatures.filter(
        (sig) => sig.userIndex !== userIndex
      );
      updatedSignatures.push(userBatchSig);
      setMainVotingSignatures(updatedSignatures);

      const backendSubmitData: BackendSubmitData = {
        records: userRecords.map((r) => ({
          timestamp: r.timestamp.toString(),
          missionId: r.missionId.toString(),
          votingId: r.votingId.toString(),
          optionId: r.optionId.toString(),
          voteType: r.voteType,
          votingAmt: r.votingAmt.toString(),
        })),
        userBatchSig: {
          user: userAddress,
          userNonce: userNonce.toString(),
          signature: signature as Hash,
        },
      };

      setBackendData((prev) => ({
        ...prev,
        [userIndex]: backendSubmitData,
      }));

      toast.success(`${role?.label ?? '사용자'} 서명 생성 완료!`);
    } catch (error) {
      if (error instanceof WalletNotConnectedError) {
        toast.info('지갑을 먼저 연결해주세요 (Step 0)');
        return;
      }
      logError('Step3UserSigs.handleSignUserBatch', error);
      const message = getBlockchainErrorMessage(error);
      toast.error(`서명 생성 실패: ${message}`);
    } finally {
      setSigningUserIndex(null);
    }
  };

  /**
   * 사용자 서명 삭제
   */
  const handleClearSignature = (userIndex: UserIndex) => {
    const updatedSignatures = mainVotingSignatures.filter(
      (sig) => sig.userIndex !== userIndex
    );
    setMainVotingSignatures(updatedSignatures);

    setBackendData((prev) => ({
      ...prev,
      [userIndex]: null,
    }));

    toast.success('사용자 서명 삭제 완료');
  };

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  const getSignatureForUser = (userIndex: UserIndex) => {
    return mainVotingSignatures.find((sig) => sig.userIndex === userIndex) ?? null;
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <StepCard
      stepNumber={3}
      title="사용자 배치 서명 생성"
      description="각 사용자가 자신의 레코드에 서명합니다"
      badgeColor="secondary"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {userRoles.map((role) => {
            const signature = getSignatureForUser(role.index);
            const isSigning = signingUserIndex === role.index;
            const recordCount = recordsByUserIndex[role.index] ?? 0;

            return (
              <Card
                key={role.index}
                className={colorClasses[role.color].card}
              >
                <CardHeader>
                  <CardTitle className="text-md">{role.label} 서명</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-muted-foreground">
                    주소:{' '}
                    <span className="font-mono">
                      {role.address ?? '-'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSignUserBatch(role.index)}
                      disabled={!role.address || recordCount === 0 || isSigning}
                      className="flex-1"
                      variant="default"
                    >
                      {isSigning ? '서명 중...' : '서명 생성'}
                    </Button>
                    {signature && (
                      <Button
                        onClick={() => handleClearSignature(role.index)}
                        variant="destructive"
                        size="icon"
                      >
                        🗑️
                      </Button>
                    )}
                  </div>

                  {recordCount === 0 && (
                    <p className="text-xs text-muted-foreground">
                      레코드가 없습니다. Step 2에서 추가해주세요.
                    </p>
                  )}

                  {signature && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">서명:</p>
                      <div className="bg-muted rounded-lg p-3 font-mono text-xs break-all">
                        {signature.signature}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 서명 완료 요약 */}
        {mainVotingSignatures.length > 0 && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm">
              <Badge variant="default" className="mr-2">
                완료
              </Badge>
              {mainVotingSignatures.length}명의 사용자 서명 완료
            </p>
          </div>
        )}

        {/* 백엔드 전송 데이터 */}
        {Object.values(backendData).some(Boolean) && (
          <div className="mt-6">
            <Card className="border-l-4 border-l-secondary">
              <CardHeader>
                <CardTitle className="text-base">
                  프론트엔드 → 백엔드 전달 데이터
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm">
                    <strong>실제 프로덕션:</strong> 각 사용자는{' '}
                    <strong>자신의 기기</strong>에서 별도로 백엔드 API에 전송합니다
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {userRoles.map((role) => {
                    const data = backendData[role.index];
                    if (!data) return null;

                    return (
                      <Card
                        key={role.index}
                        className={colorClasses[role.color].backend}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{role.icon}</span>
                            <div>
                              <CardTitle className="text-sm">
                                {role.label}의 기기
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">
                                {role.deviceLabel}
                              </p>
                            </div>
                          </div>
                          <Badge variant="default" className="text-xs w-fit">
                            POST /api/vote/submit
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <div className="max-h-96 overflow-y-auto bg-muted rounded-lg p-3">
                            <pre className="text-xs font-mono">
                              {JSON.stringify(data, null, 2)}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>백엔드가 처리:</strong> 서버가 여러 사용자의 제출을 수집
                    → userId 자동 주입 → 배치로 결합 → Executor 서명 → 컨트랙트 제출
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </StepCard>
  );
}
