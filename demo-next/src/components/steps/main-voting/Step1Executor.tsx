/**
 * MainVoting Step 1: 역할 할당
 *
 * 헤더에서 연결된 MetaMask 계정을 Executor/User1/User2/Custom 역할에 할당합니다.
 * - 지갑 연결은 Header 컴포넌트에서 전역 관리
 * - 역할별로 현재 연결된 계정을 저장
 */

'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import type { Address } from '@/domain/types';
import { formatAddress } from '@/lib/format';

export function Step1Executor() {
  // -------------------------------------------------------------------------
  // Store State (useShallow로 리렌더링 최적화)
  // -------------------------------------------------------------------------
  const {
    connectedWalletAddress,
    mainVotingExecutorAddress,
    mainVotingUserAddresses,
    mainVotingCustomUserAddress,
    mainVotingSignatures,
    subVotingSignatures,
    boostingSignatures,
    setMainVotingExecutorAddress,
    setMainVotingUserAddress,
    setMainVotingCustomUserAddress,
    setMainVotingUserNonce,
    setMainVotingSignatures,
    setSubVotingSignatures,
    setBoostingSignatures,
    setMainVotingExecutorSig,
    setMainVotingBatchNonce,
    setSubVotingExecutorSig,
    setSubVotingBatchNonce,
    setBoostingExecutorSig,
    setBoostingBatchNonce,
  } = useAppStore(
    useShallow((s) => ({
      connectedWalletAddress: s.connectedWalletAddress,
      mainVotingExecutorAddress: s.mainVotingExecutorAddress,
      mainVotingUserAddresses: s.mainVotingUserAddresses,
      mainVotingCustomUserAddress: s.mainVotingCustomUserAddress,
      mainVotingSignatures: s.mainVotingSignatures,
      subVotingSignatures: s.subVotingSignatures,
      boostingSignatures: s.boostingSignatures,
      setMainVotingExecutorAddress: s.setMainVotingExecutorAddress,
      setMainVotingUserAddress: s.setMainVotingUserAddress,
      setMainVotingCustomUserAddress: s.setMainVotingCustomUserAddress,
      setMainVotingUserNonce: s.setMainVotingUserNonce,
      setMainVotingSignatures: s.setMainVotingSignatures,
      setSubVotingSignatures: s.setSubVotingSignatures,
      setBoostingSignatures: s.setBoostingSignatures,
      setMainVotingExecutorSig: s.setMainVotingExecutorSig,
      setMainVotingBatchNonce: s.setMainVotingBatchNonce,
      setSubVotingExecutorSig: s.setSubVotingExecutorSig,
      setSubVotingBatchNonce: s.setSubVotingBatchNonce,
      setBoostingExecutorSig: s.setBoostingExecutorSig,
      setBoostingBatchNonce: s.setBoostingBatchNonce,
    }))
  );

  // -------------------------------------------------------------------------
  // Derived Values
  // -------------------------------------------------------------------------
  const assignedAddresses = useMemo(() => {
    return [
      mainVotingExecutorAddress,
      mainVotingUserAddresses[0],
      mainVotingUserAddresses[1],
      mainVotingCustomUserAddress,
    ].filter(Boolean) as Address[];
  }, [
    mainVotingCustomUserAddress,
    mainVotingExecutorAddress,
    mainVotingUserAddresses,
  ]);

  const isDuplicateAssignment =
    connectedWalletAddress &&
    assignedAddresses.some(
      (addr) => addr.toLowerCase() === connectedWalletAddress.toLowerCase()
    );

  const resetAllExecutorBatchState = () => {
    setMainVotingExecutorSig(null);
    setMainVotingBatchNonce(0n);
    setSubVotingExecutorSig(null);
    setSubVotingBatchNonce(0n);
    setBoostingExecutorSig(null);
    setBoostingBatchNonce(0n);
  };

  const clearUserSignaturesAndNonce = (userIndex: 0 | 1 | 99) => {
    setMainVotingUserNonce(userIndex, null);
    setMainVotingSignatures(
      mainVotingSignatures.filter((sig) => sig.userIndex !== userIndex)
    );
    setSubVotingSignatures(
      subVotingSignatures.filter((sig) => sig.userIndex !== userIndex)
    );
    setBoostingSignatures(
      boostingSignatures.filter((sig) => sig.userIndex !== userIndex)
    );

    // 사용자 역할이 바뀌면 기존 배치/Executor 서명도 다시 계산해야 안전합니다.
    resetAllExecutorBatchState();
  };

  const isSameAsConnectedAddress = (address: Address | null) => {
    return Boolean(
      connectedWalletAddress &&
        address &&
        address.toLowerCase() === connectedWalletAddress.toLowerCase()
    );
  };

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleAssignRole = (role: 'executor' | 'user1' | 'user2' | 'custom') => {
    if (!connectedWalletAddress) {
      toast.error('먼저 헤더에서 지갑을 연결해주세요.');
      return;
    }

    if (isDuplicateAssignment) {
      toast.warning('이미 다른 역할에 할당된 주소입니다. 중복 할당됩니다.');
    }

    if (role === 'executor') {
      const currentExecutor = mainVotingExecutorAddress;
      setMainVotingExecutorAddress(connectedWalletAddress);
      if (!isSameAsConnectedAddress(currentExecutor)) {
        resetAllExecutorBatchState();
      }
    } else if (role === 'user1') {
      const currentUserAddress = mainVotingUserAddresses[0];
      setMainVotingUserAddress(0, connectedWalletAddress);
      if (!isSameAsConnectedAddress(currentUserAddress)) {
        clearUserSignaturesAndNonce(0);
      }
    } else if (role === 'user2') {
      const currentUserAddress = mainVotingUserAddresses[1];
      setMainVotingUserAddress(1, connectedWalletAddress);
      if (!isSameAsConnectedAddress(currentUserAddress)) {
        clearUserSignaturesAndNonce(1);
      }
    } else {
      const currentCustomUserAddress = mainVotingCustomUserAddress;
      setMainVotingCustomUserAddress(connectedWalletAddress);
      if (!isSameAsConnectedAddress(currentCustomUserAddress)) {
        clearUserSignaturesAndNonce(99);
      }
    }
  };

  const handleClearRole = (role: 'executor' | 'user1' | 'user2' | 'custom') => {
    if (role === 'executor') {
      setMainVotingExecutorAddress(null);
      resetAllExecutorBatchState();
    } else if (role === 'user1') {
      setMainVotingUserAddress(0, null);
      clearUserSignaturesAndNonce(0);
    } else if (role === 'user2') {
      setMainVotingUserAddress(1, null);
      clearUserSignaturesAndNonce(1);
    } else {
      setMainVotingCustomUserAddress(null);
      clearUserSignaturesAndNonce(99);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <StepCard
      stepNumber={1}
      title="역할 할당"
      description="연결된 지갑을 Executor/User1/User2/Custom 역할에 할당합니다"
      badgeColor="default"
    >
      <div className="space-y-4">
        {/* 현재 연결된 지갑 표시 */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <span className="text-sm text-muted-foreground">연결된 지갑:</span>
          {connectedWalletAddress ? (
            <Badge variant="secondary" className="font-mono text-xs">
              {formatAddress(connectedWalletAddress)}
            </Badge>
          ) : (
            <span className="text-sm text-amber-600 dark:text-amber-400">
              지갑을 먼저 연결해주세요
            </span>
          )}
        </div>

        {/* 역할 할당 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-md font-semibold text-yellow-700">
                Executor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                주소:{' '}
                <span className="font-mono">
                  {formatAddress(mainVotingExecutorAddress)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAssignRole('executor')}
                  disabled={!connectedWalletAddress}
                >
                  현재 계정 할당
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClearRole('executor')}
                >
                  해제
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-md font-semibold text-blue-700">
                User 1
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                주소:{' '}
                <span className="font-mono">
                  {formatAddress(mainVotingUserAddresses[0])}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAssignRole('user1')}
                  disabled={!connectedWalletAddress}
                >
                  현재 계정 할당
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClearRole('user1')}
                >
                  해제
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-500/10 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-md font-semibold text-green-700">
                User 2
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                주소:{' '}
                <span className="font-mono">
                  {formatAddress(mainVotingUserAddresses[1])}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAssignRole('user2')}
                  disabled={!connectedWalletAddress}
                >
                  현재 계정 할당
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClearRole('user2')}
                >
                  해제
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-500/10 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-md font-semibold text-purple-700">
                Custom
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                주소:{' '}
                <span className="font-mono">
                  {formatAddress(mainVotingCustomUserAddress)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAssignRole('custom')}
                  disabled={!connectedWalletAddress}
                >
                  현재 계정 할당
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClearRole('custom')}
                >
                  해제
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StepCard>
  );
}
