'use client';

import { useCallback, useId } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusAlert } from '@/components/shared/StatusAlert';
import { TxHashDisplay } from '@/components/shared/TxHashDisplay';
import { formatAddress } from '@/lib/format';
import { isValidBigIntString } from '@/lib/safe-bigint';
import { useSubStep0Setup } from './step0/useSubStep0Setup';
import { useInjectedWallet } from '@/hooks/useInjectedWallet';
import { toast } from 'sonner';

interface SubStep0SetupProps {
  showDeploySection?: boolean;
  defaultOpen?: boolean;
  title?: string;
  helperText?: string;
}

function parseMissionIdInput(value: string, fallback: bigint): bigint {
  if (!isValidBigIntString(value)) {
    return fallback;
  }
  return BigInt(value);
}

export function SubStep0Setup({
  showDeploySection = true,
  defaultOpen = true,
  title = 'SubVoting 컨트랙트 배포 및 설정',
  helperText = '연결된 지갑으로 SubVoting 컨트랙트 배포 및 초기 설정을 진행합니다',
}: SubStep0SetupProps = {}) {
  const executorAddressId = useId();
  const missionIdId = useId();
  const questionIdId = useId();
  const questionTextId = useId();
  const optionMissionIdId = useId();
  const optionQuestionIdId = useId();
  const optionIdId = useId();
  const optionTextId = useId();

  const {
    connectedWalletAddress,
    contractAddress,
    deployedAddress,
    executorAddress,
    questionData,
    optionData,
    deployStatus,
    deployTxHash,
    executorStatus,
    executorTxHash,
    questionStatus,
    questionTxHash,
    optionStatus,
    optionTxHash,
    isDeploying,
    isSettingExecutor,
    isRegisteringQuestion,
    isRegisteringOption,
    selectedChainId,
    setExecutorAddress,
    setQuestionData,
    setOptionData,
    handleDeployContract,
    handleUseDeployedAddress,
    handleSetExecutor,
    handleRegisterQuestion,
    handleRegisterOption,
  } = useSubStep0Setup();
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
      badgeColor="secondary"
      defaultOpen={defaultOpen}
    >
      <p className="text-sm text-muted-foreground mb-4">
        {helperText}
      </p>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border mb-6">
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
        <Card className="bg-purple-500/10 border-purple-500/30 mb-6">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-base text-purple-700 dark:text-purple-400">컨트랙트 배포</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-xs text-muted-foreground">
              연결된 지갑이 컨트랙트의 Owner가 됩니다.
            </p>

            <Button
              type="button"
              onClick={handleDeployContract}
              disabled={isDeploying || !connectedWalletAddress}
              className="w-full"
              aria-label="SubVoting 컨트랙트 배포"
            >
              {isDeploying ? '배포 중...' : 'SubVoting 컨트랙트 배포'}
            </Button>

            {deployStatus && (
              <StatusAlert type={deployStatus.type} message={deployStatus.message} className="mt-3" />
            )}

            {deployStatus?.type === 'success' && deployTxHash && (
              <div className="mt-2">
                <TxHashDisplay txHash={deployTxHash} chainId={selectedChainId} />
              </div>
            )}

            {deployedAddress && (
              <Card className="bg-green-500/10 border-green-500/30 mt-4">
                <CardContent className="p-3 space-y-2">
                  <p className="text-sm font-semibold text-green-700">배포된 컨트랙트:</p>
                  <p className="text-xs font-mono break-all">{deployedAddress}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUseDeployedAddress}
                    className="w-full"
                  >
                    이 주소 사용하기
                  </Button>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-yellow-500/10 border-yellow-500/30 mb-6">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-base text-yellow-700 dark:text-yellow-400">Executor 등록</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={executorAddressId}>Executor 주소</Label>
            <Input
              id={executorAddressId}
              type="text"
              value={executorAddress}
              onChange={(e) => setExecutorAddress(e.target.value)}
              placeholder="0x..."
              className="font-mono text-xs"
            />
          </div>
          <Button
            type="button"
            onClick={handleSetExecutor}
            disabled={isSettingExecutor || !connectedWalletAddress || !contractAddress}
            className="w-full"
            aria-label="Executor 설정"
          >
            {isSettingExecutor ? '설정 중...' : 'Executor 설정'}
          </Button>
          {executorStatus && (
            <StatusAlert type={executorStatus.type} message={executorStatus.message} className="mt-3" />
          )}
          {executorStatus?.type === 'success' && executorTxHash && (
            <div className="mt-2">
              <TxHashDisplay txHash={executorTxHash} chainId={selectedChainId} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-green-500/10 border-green-500/30 mb-6">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-base text-green-700 dark:text-green-400">질문 등록</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={missionIdId}>Mission ID</Label>
                <Input
                  id={missionIdId}
                  type="number"
                  value={questionData.missionId.toString()}
                  onChange={(e) =>
                    setQuestionData({
                      ...questionData,
                      missionId: parseMissionIdInput(
                        e.target.value,
                        questionData.missionId
                      ),
                    })
                  }
                />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={questionIdId}>Question ID</Label>
              <Input
                id={questionIdId}
                type="number"
                value={questionData.questionId}
                onChange={(e) =>
                  setQuestionData({ ...questionData, questionId: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={questionTextId}>질문 내용</Label>
              <Input
                id={questionTextId}
                type="text"
                value={questionData.text}
                onChange={(e) => setQuestionData({ ...questionData, text: e.target.value })}
                placeholder="예: 좋아하는 아티스트는?"
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={handleRegisterQuestion}
            disabled={isRegisteringQuestion || !connectedWalletAddress || !contractAddress}
            className="w-full"
            aria-label="질문 등록"
          >
            {isRegisteringQuestion ? '등록 중...' : '질문 등록'}
          </Button>
          {questionStatus && (
            <StatusAlert type={questionStatus.type} message={questionStatus.message} className="mt-3" />
          )}
          {questionStatus?.type === 'success' && questionTxHash && (
            <div className="mt-2">
              <TxHashDisplay txHash={questionTxHash} chainId={selectedChainId} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-purple-500/10 border-purple-500/30 mb-6">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-base text-purple-700 dark:text-purple-400">옵션 등록</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={optionMissionIdId}>Mission ID</Label>
                <Input
                  id={optionMissionIdId}
                  type="number"
                  value={optionData.missionId.toString()}
                  onChange={(e) =>
                    setOptionData({
                      ...optionData,
                      missionId: parseMissionIdInput(
                        e.target.value,
                        optionData.missionId
                      ),
                    })
                  }
                />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={optionQuestionIdId}>Question ID</Label>
              <Input
                id={optionQuestionIdId}
                type="number"
                value={optionData.questionId}
                onChange={(e) =>
                  setOptionData({ ...optionData, questionId: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={optionIdId}>Option ID</Label>
              <Input
                id={optionIdId}
                type="number"
                value={optionData.optionId}
                onChange={(e) => setOptionData({ ...optionData, optionId: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={optionTextId}>옵션 내용</Label>
              <Input
                id={optionTextId}
                type="text"
                value={optionData.text}
                onChange={(e) => setOptionData({ ...optionData, text: e.target.value })}
                placeholder="예: 아티스트 A"
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={handleRegisterOption}
            disabled={isRegisteringOption || !connectedWalletAddress || !contractAddress}
            className="w-full"
            aria-label="옵션 등록"
          >
            {isRegisteringOption ? '등록 중...' : '옵션 등록'}
          </Button>
          {optionStatus && (
            <StatusAlert type={optionStatus.type} message={optionStatus.message} className="mt-3" />
          )}
          {optionStatus?.type === 'success' && optionTxHash && (
            <div className="mt-2">
              <TxHashDisplay txHash={optionTxHash} chainId={selectedChainId} />
            </div>
          )}
        </CardContent>
      </Card>
    </StepCard>
  );
}
