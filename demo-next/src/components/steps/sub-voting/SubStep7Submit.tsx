'use client';

import { useMemo, useState } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { StatusAlert } from '@/components/shared/StatusAlert';
import { TxHashDisplay } from '@/components/shared/TxHashDisplay';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { subVotingAbi } from '@/infrastructure/contracts/SubVotingContract';
import { getChainById } from '@/infrastructure/config/chains';
import { publicClient } from '@/lib/viem-clients';
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

type VoteRecordTuple = [
  bigint,
  bigint,
  bigint,
  bigint,
  string,
  bigint,
  bigint,
  bigint,
];

type UserBatchSigTuple = [
  string,
  bigint,
  string,
];

type UserVoteBatch = [
  VoteRecordTuple[],
  UserBatchSigTuple,
];

const bigIntReplacer = (_key: string, value: unknown): unknown =>
  typeof value === 'bigint' ? value.toString() : value;

export function SubStep7Submit() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const contractAddress = useAppStore((s) => s.contractAddress);
  const selectedChainId = useAppStore((s) => s.selectedChainId);
  const mainVotingExecutorAddress = useAppStore((s) => s.mainVotingExecutorAddress);
  const contractExecutorAddress = useAppStore((s) => s.contractExecutorAddress);
  const subVotingRecords = useAppStore((s) => s.subVotingRecords);
  const subVotingSignatures = useAppStore((s) => s.subVotingSignatures);
  const subVotingBatchNonce = useAppStore((s) => s.subVotingBatchNonce);
  const subVotingExecutorSig = useAppStore((s) => s.subVotingExecutorSig);
  const setSubVotingTxHash = useAppStore((s) => s.setSubVotingTxHash);

  const executorAddress = mainVotingExecutorAddress ?? contractExecutorAddress;

  const batches = useMemo((): UserVoteBatch[] => {
    const result: UserVoteBatch[] = [];

    subVotingSignatures.forEach((sig) => {
      if (sig.userIndex === undefined || sig.userNonce === undefined) {
        return;
      }

      const userRecords: VoteRecordTuple[] = subVotingRecords
        .filter((record) => record.userIndex === sig.userIndex)
        .map((record, idx) => {
          const fallbackRecordId = BigInt(idx + 1);
          const recordId =
            record.recordId && record.recordId > 0n ? record.recordId : fallbackRecordId;

          return [
            recordId,
            record.timestamp,
            record.missionId,
            record.votingId,
            record.userId,
            record.questionId,
            record.optionId,
            record.votingAmt,
          ];
        });

      if (userRecords.length > 0) {
        result.push([
          userRecords,
          [sig.userAddress, sig.userNonce, sig.signature] as UserBatchSigTuple,
        ]);
      }
    });

    return result;
  }, [subVotingRecords, subVotingSignatures]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} 복사됨`);
    } catch {
      toast.error('복사 실패');
    }
  };

  const handleSubmit = async () => {
    try {
      if (subVotingRecords.length === 0) {
        toast.error('레코드가 없습니다. STEP 2에서 레코드를 추가해주세요.');
        return;
      }

      if (!subVotingSignatures || subVotingSignatures.length === 0) {
        toast.error('사용자 배치 서명이 없습니다. STEP 3에서 서명해주세요.');
        return;
      }

      if (!subVotingExecutorSig) {
        toast.error('Executor 서명이 없습니다. STEP 6에서 서명을 생성해주세요.');
        return;
      }

      if (!contractAddress) {
        toast.error('컨트랙트 주소가 설정되지 않았습니다.');
        return;
      }

      if (!executorAddress) {
        toast.error('Executor 계정이 설정되지 않았습니다. STEP 1에서 할당해주세요.');
        return;
      }

      if (batches.length === 0) {
        toast.error('제출할 배치 데이터가 없습니다.');
        return;
      }

      setIsLoading(true);
      setError('');
      setTxHash('');
      setLoadingMessage('가스 추정 중...');

      const walletClient = getInjectedWalletClient(selectedChainId);
      const chain = getChainById(selectedChainId);
      const [, activeAddress] = await Promise.all([
        ensureCorrectChain(walletClient, selectedChainId),
        ensureActiveAddress(executorAddress),
      ]);

      setLoadingMessage('트랜잭션 전송 중...');

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: subVotingAbi,
        functionName: 'submitMultiUserBatch',
        args: [batches, subVotingBatchNonce, subVotingExecutorSig],
        chain,
        account: activeAddress as `0x${string}`,
      });

      setLoadingMessage(`트랜잭션 확인 대기 중... (TX: ${hash.slice(0, 10)}...)`);

      await publicClient.waitForTransactionReceipt({ hash });

      setTxHash(hash);
      setSubVotingTxHash(hash);
      toast.success('트랜잭션 제출 성공!');
    } catch (err) {
      if (err instanceof WalletNotConnectedError) {
        toast.info('지갑을 먼저 연결해주세요 (Step 0)');
        return;
      }

      if (isUserRejectionError(err)) {
        toast.info('트랜잭션 서명이 취소되었습니다');
        return;
      }

      logError('SubStep7Submit.handleSubmit', err);
      const errorMessage = getBlockchainErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const recordCount = subVotingRecords.length;
  const userBatchCount = subVotingSignatures.length;

  return (
    <StepCard
      stepNumber={7}
      title="배치 제출"
      description="사용자 서명 데이터를 SubVoting 컨트랙트에 제출합니다"
      badgeColor="destructive"
    >
      <div className="space-y-4">
        <Card className="bg-muted">
          <CardContent className="p-4">
            <p className="font-semibold mb-2 flex items-center gap-2">제출 데이터 요약:</p>
            <ul className="text-sm space-y-1">
              <li>
                레코드 수: <Badge variant="outline">{recordCount}</Badge>
              </li>
              <li>
                사용자 배치 수: <Badge variant="outline">{userBatchCount}</Badge>
              </li>
              <li>
                Batch Nonce: <Badge variant="outline">{subVotingBatchNonce.toString()}</Badge>
              </li>
              <li>
                Executor 서명:{' '}
                <Badge variant="outline">{subVotingExecutorSig ? '있음' : '없음'}</Badge>
              </li>
            </ul>
          </CardContent>
        </Card>

        {loadingMessage && (
          <StatusAlert type="info" title="처리 중" message={loadingMessage} />
        )}
        {error && <StatusAlert type="error" title="오류" message={error} />}
        {txHash && (
          <div className="space-y-2">
            <StatusAlert
              type="success"
              title="트랜잭션 완료"
              message="트랜잭션이 확인되었습니다."
            />
            <TxHashDisplay txHash={txHash} chainId={selectedChainId} />
          </div>
        )}

        <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
          {isLoading ? '제출 중...' : '컨트랙트 제출'}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Remix 파라미터</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="sub-batches">batches (UserVoteBatch[])</Label>
              <Textarea
                id="sub-batches"
                className="font-mono text-xs max-h-40 overflow-y-auto"
                value={JSON.stringify(batches, bigIntReplacer, 2)}
                readOnly
              />
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(JSON.stringify(batches, bigIntReplacer), 'batches')
                  }
                >
                  복사
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="sub-batchNonce">batchNonce</Label>
              <Input
                id="sub-batchNonce"
                className="font-mono text-xs"
                value={subVotingBatchNonce.toString()}
                readOnly
              />
            </div>

            <div>
              <Label htmlFor="sub-executorSig">executorSig</Label>
              <Input
                id="sub-executorSig"
                className="font-mono text-xs"
                value={subVotingExecutorSig ?? ''}
                readOnly
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </StepCard>
  );
}
