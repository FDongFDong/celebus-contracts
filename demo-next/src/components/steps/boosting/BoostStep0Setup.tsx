/**
 * Boosting Step 0: 컨트랙트 배포 및 설정
 *
 * Boosting 컨트랙트 배포 및 초기 설정 UI
 * - 컨트랙트 배포
 * - Executor 등록
 * - 부스팅 타입 설정
 * - 아티스트 등록
 */

'use client';

import { useCallback, useId } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { InlineStatus, SectionCard } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatAddress } from '@/lib/format';
import { useBoostStep0Setup } from './step0/useBoostStep0Setup';
import { useInjectedWallet } from '@/hooks/useInjectedWallet';
import { toast } from 'sonner';

interface BoostStep0SetupProps {
  showDeploySection?: boolean;
  defaultOpen?: boolean;
  title?: string;
  description?: string;
}

export function BoostStep0Setup({
  showDeploySection = true,
  defaultOpen = true,
  title = '부스팅 컨트랙트 배포 및 설정',
  description = '연결된 지갑으로 Boosting 컨트랙트 배포 및 초기 설정을 진행합니다',
}: BoostStep0SetupProps = {}) {
  const executorAddressId = useId();
  const boostTypeName0Id = useId();
  const boostTypeName1Id = useId();
  const candidateMissionIdId = useId();
  const candidateArtistIdId = useId();
  const candidateNameId = useId();

  const {
    connectedWalletAddress,
    contractAddress,
    deployedAddress,
    deployStatus,
    deployTxHash,
    isDeploying,
    executorAddress,
    setExecutorAddress,
    executorStatus,
    executorTxHash,
    isSettingExecutor,
    boostTypeName0,
    setBoostTypeName0,
    boostTypeName1,
    setBoostTypeName1,
    boostTypeStatus,
    boostTypeTxHashes,
    isSettingBoostTypes,
    candidateMissionId,
    setCandidateMissionId,
    candidateArtistId,
    setCandidateArtistId,
    candidateName,
    setCandidateName,
    candidateStatus,
    artistTxHash,
    isRegisteringArtist,
    handleDeployContract,
    handleUseDeployedAddress,
    handleSetExecutor,
    handleSetBoostingTypeNames,
    handleRegisterArtist,
  } = useBoostStep0Setup();
  const { connect } = useInjectedWallet();

  const handleConnectWallet = useCallback(async () => {
    try {
      await connect();
      toast.success('지갑 연결 완료!');
    } catch (error) {
      const errorCode = (error as { code?: number })?.code;
      const message = error instanceof Error ? error.message : '지갑 연결 실패';

      if (
        errorCode === 4001 ||
        message.toLowerCase().includes('user rejected') ||
        message.toLowerCase().includes('user denied')
      ) {
        toast.info('지갑 연결이 취소되었습니다');
      } else {
        toast.error(message);
      }
    }
  }, [connect]);

  return (
    <StepCard
      stepNumber={0}
      title={title}
      description={description}
      defaultOpen={defaultOpen}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <span className="text-sm text-muted-foreground">연결된 지갑 (Owner):</span>
          {connectedWalletAddress ? (
            <Badge variant="secondary" className="font-mono text-xs">
              {formatAddress(connectedWalletAddress)}
            </Badge>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-amber-600 dark:text-amber-400">
                지갑을 먼저 연결해주세요
              </span>
              <Button size="sm" variant="outline" onClick={handleConnectWallet}>
                지갑 연결
              </Button>
            </div>
          )}
        </div>

        {showDeploySection && (
          <SectionCard
            type="deploy"
            title="컨트랙트 배포"
            description="연결된 지갑이 컨트랙트의 Owner가 됩니다."
          >
            <Button
              onClick={handleDeployContract}
              disabled={isDeploying || !connectedWalletAddress}
              className="w-full"
              aria-label="Boosting 컨트랙트 배포"
            >
              {isDeploying ? '배포 중...' : 'Boosting 컨트랙트 배포'}
            </Button>

            <InlineStatus status={deployStatus} txHash={deployTxHash} />

            {deployedAddress && (
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-3 space-y-2">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    배포된 Boosting 컨트랙트:
                  </p>
                  <p className="text-xs font-mono break-all">{deployedAddress}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUseDeployedAddress}
                    className="w-full"
                    aria-label="배포된 컨트랙트 주소 사용하기"
                  >
                    이 주소 사용하기
                  </Button>
                </CardContent>
              </Card>
            )}
          </SectionCard>
        )}

        <SectionCard type="executor" title="Executor 등록">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={executorAddressId}>Executor 주소</Label>
            <Input
              id={executorAddressId}
              type="text"
              value={executorAddress}
              onChange={(e) => setExecutorAddress(e.target.value)}
              placeholder="0x..."
              className="font-mono text-xs"
              autoComplete="off"
            />
          </div>

          <Button
            onClick={handleSetExecutor}
            disabled={isSettingExecutor || !connectedWalletAddress || !contractAddress}
            className="w-full"
            aria-label="Executor 설정"
          >
            {isSettingExecutor ? '설정 중...' : 'Executor 설정'}
          </Button>

          <InlineStatus status={executorStatus} txHash={executorTxHash} />
        </SectionCard>

        <SectionCard type="config" title="부스팅 타입 이름">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={boostTypeName0Id}>타입 0 (BP)</Label>
              <Input
                id={boostTypeName0Id}
                type="text"
                value={boostTypeName0}
                onChange={(e) => setBoostTypeName0(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={boostTypeName1Id}>타입 1 (CELB)</Label>
              <Input
                id={boostTypeName1Id}
                type="text"
                value={boostTypeName1}
                onChange={(e) => setBoostTypeName1(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <Button
            onClick={handleSetBoostingTypeNames}
            disabled={isSettingBoostTypes || !connectedWalletAddress || !contractAddress}
            className="w-full"
            aria-label="부스팅 타입 설정"
          >
            {isSettingBoostTypes ? '설정 중...' : '부스팅 타입 설정'}
          </Button>

          <InlineStatus status={boostTypeStatus} txHashes={boostTypeTxHashes} />
        </SectionCard>

        <SectionCard type="entity" title="아티스트 등록">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={candidateMissionIdId}>미션 ID</Label>
              <Input
                id={candidateMissionIdId}
                type="number"
                value={candidateMissionId}
                onChange={(e) => setCandidateMissionId(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={candidateArtistIdId}>아티스트 ID</Label>
              <Input
                id={candidateArtistIdId}
                type="number"
                value={candidateArtistId}
                onChange={(e) => setCandidateArtistId(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={candidateNameId}>이름</Label>
              <Input
                id={candidateNameId}
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <Button
            onClick={handleRegisterArtist}
            disabled={isRegisteringArtist || !connectedWalletAddress || !contractAddress}
            className="w-full"
            aria-label="아티스트 등록"
          >
            {isRegisteringArtist ? '등록 중...' : '아티스트 등록'}
          </Button>

          <InlineStatus status={candidateStatus} txHash={artistTxHash} />
        </SectionCard>
      </div>
    </StepCard>
  );
}
