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
import { publicClient } from '@/lib/viem-clients';
import {
  ensureActiveAddress,
  ensureCorrectChain,
  getInjectedWalletClient,
  WalletNotConnectedError,
} from '@/lib/injected-wallet';
import { boostingAbi } from '@/infrastructure/contracts/BoostingContract';
import { getChainById } from '@/infrastructure/config/chains';
import { toast } from 'sonner';
import type { Hash } from '@/domain/types';
import {
  getBlockchainErrorMessage,
  isUserRejectionError,
  logError,
} from '@/lib/error-handler';

type BoostRecordTuple = [
  bigint,
  bigint,
  bigint,
  bigint,
  string,
  bigint,
  number,
  bigint,
];

type UserSigTuple = [
  string,
  bigint,
  string,
];

type UserBoostBatch = [
  BoostRecordTuple,
  UserSigTuple,
];

const bigIntReplacer = (_key: string, value: unknown): unknown =>
  typeof value === 'bigint' ? value.toString() : value;

export function BoostStep7Submit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const contractAddress = useAppStore((s) => s.contractAddress);
  const selectedChainId = useAppStore((s) => s.selectedChainId);
  const mainVotingExecutorAddress = useAppStore((s) => s.mainVotingExecutorAddress);
  const contractExecutorAddress = useAppStore((s) => s.contractExecutorAddress);
  const boostingRecords = useAppStore((s) => s.boostingRecords);
  const boostingSignatures = useAppStore((s) => s.boostingSignatures);
  const boostingBatchNonce = useAppStore((s) => s.boostingBatchNonce);
  const boostingExecutorSig = useAppStore((s) => s.boostingExecutorSig);
  const setBoostingTxHash = useAppStore((s) => s.setBoostingTxHash);

  const executorAddress = mainVotingExecutorAddress ?? contractExecutorAddress;

  const batches = useMemo((): UserBoostBatch[] => {
    const result: UserBoostBatch[] = [];

    boostingSignatures.forEach((sig, idx) => {
      if (sig.userIndex === undefined || sig.userNonce === undefined) {
        return;
      }

      const record = boostingRecords.find((item) => item.userIndex === sig.userIndex);
      if (!record) {
        return;
      }

      const fallbackRecordId =
        record.timestamp * 100n + BigInt((sig.userIndex ?? idx) + 1);
      const recordId =
        record.recordId && record.recordId > 0n ? record.recordId : fallbackRecordId;

      result.push([
        [
          recordId,
          record.timestamp,
          record.missionId,
          record.boostingId,
          record.userId,
          record.optionId,
          record.boostingWith,
          record.amt,
        ],
        [sig.userAddress, sig.userNonce, sig.signature],
      ]);
    });

    return result;
  }, [boostingRecords, boostingSignatures]);

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
      if (!contractAddress) {
        toast.error('컨트랙트 주소가 설정되지 않았습니다');
        return;
      }

      if (!executorAddress) {
        toast.error('Executor 주소가 설정되지 않았습니다');
        return;
      }

      if (!boostingRecords || boostingRecords.length === 0) {
        toast.error('부스팅 레코드가 없습니다 (Step 2)');
        return;
      }

      if (!boostingSignatures || boostingSignatures.length === 0) {
        toast.error('유저 서명이 없습니다 (Step 3)');
        return;
      }

      if (!boostingExecutorSig) {
        toast.error('Executor 서명이 없습니다 (Step 6)');
        return;
      }

      if (batches.length === 0) {
        toast.error('제출 가능한 배치 데이터가 없습니다');
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);
      setTxHash(null);
      setLoadingStatus('가스 추정 중...');

      const walletClient = getInjectedWalletClient(selectedChainId);
      const chain = getChainById(selectedChainId);
      const [, activeAddress] = await Promise.all([
        ensureCorrectChain(walletClient, selectedChainId),
        ensureActiveAddress(executorAddress),
      ]);

      setLoadingStatus('트랜잭션 전송 중...');

      const hash = (await walletClient.writeContract({
        address: contractAddress,
        abi: boostingAbi,
        functionName: 'submitBoostBatch',
        args: [batches, boostingBatchNonce, boostingExecutorSig],
        account: activeAddress,
        chain,
      })) as Hash;

      setLoadingStatus(`트랜잭션 확인 대기 중... (TX: ${hash.slice(0, 10)}...)`);

      await publicClient.waitForTransactionReceipt({ hash });

      setTxHash(hash);
      setBoostingTxHash(hash);

      toast.success('트랜잭션이 성공적으로 제출되었습니다');
    } catch (error) {
      if (error instanceof WalletNotConnectedError) {
        toast.info('지갑을 먼저 연결해주세요 (Step 0)');
        return;
      }

      if (isUserRejectionError(error)) {
        toast.info('트랜잭션 서명이 취소되었습니다');
        return;
      }

      logError('BoostStep7Submit.handleSubmit', error);

      const err = error as Error & { data?: string };
      let message = getBlockchainErrorMessage(error);

      const selector = typeof err?.data === 'string' ? err.data.slice(0, 10) : undefined;
      if (selector === '0x8894779f') {
        message =
          'NoSuccessfulUser(): 모든 유저 배치가 실패했습니다. boostingWith/optionId/amt/nonce를 확인해주세요.\n\n' +
          message;
      }

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setLoadingStatus('');
    }
  };

  const recordCount = boostingRecords?.length ?? 0;
  const batchCount = boostingSignatures?.length ?? 0;
  const batchNonceDisplay = boostingBatchNonce?.toString() ?? '-';
  const hasExecutorSig = !!boostingExecutorSig;

  return (
    <StepCard
      stepNumber={7}
      title="Boosting 컨트랙트 제출"
      description="모든 Boosting 배치 데이터를 컨트랙트에 제출합니다"
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
                사용자 배치 수: <Badge variant="outline">{batchCount}</Badge>
              </li>
              <li>
                Batch Nonce: <Badge variant="outline">{batchNonceDisplay}</Badge>
              </li>
              <li>
                Executor 서명: <Badge variant="outline">{hasExecutorSig ? '있음' : '없음'}</Badge>
              </li>
            </ul>
          </CardContent>
        </Card>

        {loadingStatus && (
          <StatusAlert type="info" title="처리 중" message={loadingStatus} />
        )}
        {errorMessage && <StatusAlert type="error" title="오류" message={errorMessage} />}
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

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          variant="destructive"
          aria-label="컨트랙트에 제출"
        >
          {isSubmitting ? '제출 중...' : '컨트랙트에 제출'}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Remix 파라미터</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="boost-batches">batches (UserBoostBatch[])</Label>
              <Textarea
                id="boost-batches"
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
              <Label htmlFor="boost-batchNonce">batchNonce</Label>
              <Input
                id="boost-batchNonce"
                className="font-mono text-xs"
                value={boostingBatchNonce.toString()}
                readOnly
              />
            </div>

            <div>
              <Label htmlFor="boost-executorSig">executorSig</Label>
              <Input
                id="boost-executorSig"
                className="font-mono text-xs"
                value={boostingExecutorSig ?? ''}
                readOnly
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </StepCard>
  );
}
