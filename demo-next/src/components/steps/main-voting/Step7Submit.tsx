'use client';

import { useState, useMemo } from 'react';
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
import { mainVotingAbi } from '@/infrastructure/contracts/MainVotingContract';
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

/**
 * BigInt를 문자열로 변환하는 JSON replacer
 */
const bigIntReplacer = (_key: string, value: unknown): unknown =>
  typeof value === 'bigint' ? value.toString() : value;

/**
 * Contract 타입 정의
 */
type VoteRecordTuple = [
  string, // recordId
  bigint, // timestamp
  bigint, // missionId
  bigint, // votingId
  bigint, // optionId
  number, // voteType
  string, // userId
  bigint // votingAmt
];

type UserBatchSigTuple = [
  string, // user
  bigint, // nonce
  string // signature
];

type UserVoteBatch = [
  VoteRecordTuple[], // records
  UserBatchSigTuple // sig
];

export function Step7Submit() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  // Store selector pattern for better re-render optimization
  const contractAddress = useAppStore((s) => s.contractAddress);
  const selectedChainId = useAppStore((s) => s.selectedChainId);
  const mainVotingExecutorAddress = useAppStore(
    (s) => s.mainVotingExecutorAddress
  );
  const mainVotingRecords = useAppStore((s) => s.mainVotingRecords);
  const mainVotingSignatures = useAppStore((s) => s.mainVotingSignatures);
  const mainVotingBatchNonce = useAppStore((s) => s.mainVotingBatchNonce);
  const mainVotingExecutorSig = useAppStore((s) => s.mainVotingExecutorSig);
  const setMainVotingTxHash = useAppStore((s) => s.setMainVotingTxHash);

  /**
   * UserVoteBatch[] 구조로 데이터 생성
   * useMemo로 최적화: 의존성이 변경될 때만 재계산
   */
  const batches = useMemo((): UserVoteBatch[] => {
    const result: UserVoteBatch[] = [];

    mainVotingSignatures.forEach((sig) => {
      if (sig.userIndex === undefined || sig.userNonce === undefined) {
        return;
      }

      const userRecords: VoteRecordTuple[] = mainVotingRecords
        .filter((r) => r.userIndex === sig.userIndex)
        .map((r, idx) => {
          const recordId = r.recordId ? r.recordId.toString() : String(idx + 1);
          return [
            recordId,
            r.timestamp,
            r.missionId,
            r.votingId,
            r.optionId,
            r.voteType,
            r.userId,
            r.votingAmt,
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
  }, [mainVotingRecords, mainVotingSignatures]);

  /**
   * Remix 파라미터 복사
   */
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} 복사됨`);
    } catch {
      toast.error('복사 실패');
    }
  };

  /**
   * 트랜잭션 제출
   */
  const handleSubmit = async () => {
    try {
      // 유효성 검사
      if (mainVotingRecords.length === 0) {
        toast.error('레코드가 없습니다. STEP 2에서 레코드를 추가해주세요.');
        return;
      }

      if (!mainVotingSignatures || mainVotingSignatures.length === 0) {
        toast.error('사용자 배치 서명이 없습니다. STEP 3에서 서명해주세요.');
        return;
      }

      if (!mainVotingExecutorSig) {
        toast.error('Executor 서명이 없습니다. STEP 6에서 서명을 생성해주세요.');
        return;
      }

      if (!contractAddress) {
        toast.error('컨트랙트 주소가 설정되지 않았습니다.');
        return;
      }

      if (!mainVotingExecutorAddress) {
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

      // 병렬 실행으로 ~200ms 개선
      const walletClient = getInjectedWalletClient(selectedChainId);
      const chain = getChainById(selectedChainId);
      const [, activeAddress] = await Promise.all([
        ensureCorrectChain(walletClient, selectedChainId),
        ensureActiveAddress(mainVotingExecutorAddress),
      ]);

      setLoadingMessage('트랜잭션 전송 중...');

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: mainVotingAbi,
        functionName: 'submitMultiUserBatch',
        args: [batches, mainVotingBatchNonce, mainVotingExecutorSig],
        chain,
        account: activeAddress as `0x${string}`,
      });

      setLoadingMessage(`트랜잭션 확인 대기 중... (TX: ${hash.slice(0, 10)}...)`);

      await publicClient.waitForTransactionReceipt({ hash });

      setTxHash(hash);
      setMainVotingTxHash(hash);
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

      logError('Step7Submit.handleSubmit', err);
      const errorMessage = getBlockchainErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const recordCount = mainVotingRecords.length;
  const userBatchCount = mainVotingSignatures.length;

  return (
    <StepCard
      stepNumber={7}
      title="배치 제출"
      description="사용자 서명 데이터를 컨트랙트에 제출합니다"
      badgeColor="destructive"
    >
      <div className="space-y-4">
        {/* 제출 요약 */}
        <Card className="bg-muted">
          <CardContent className="p-4">
            <p className="font-semibold mb-2 flex items-center gap-2">
              제출 데이터 요약:
            </p>
            <ul className="text-sm space-y-1">
              <li>
                레코드 수: <Badge variant="outline">{recordCount}</Badge>
              </li>
              <li>
                사용자 배치 수:{' '}
                <Badge variant="outline">{userBatchCount}</Badge>
              </li>
              <li>
                Batch Nonce:{' '}
                <Badge variant="outline">{mainVotingBatchNonce.toString()}</Badge>
              </li>
              <li>
                Executor 서명:{' '}
                <Badge variant="outline">
                  {mainVotingExecutorSig ? '있음' : '없음'}
                </Badge>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 상태 알림 */}
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

        {/* 제출 버튼 */}
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? '제출 중...' : '컨트랙트 제출'}
        </Button>

        {/* Remix 파라미터 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Remix 파라미터</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="recordsInput">batches (UserVoteBatch[])</Label>
              <Textarea
                id="recordsInput"
                className="font-mono text-xs max-h-40 overflow-y-auto"
                value={JSON.stringify(batches, bigIntReplacer, 2)}
                readOnly
              />
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(JSON.stringify(batches, bigIntReplacer), 'batches')}
                >
                  복사
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="batchNonce">batchNonce</Label>
              <Input
                id="batchNonce"
                className="font-mono text-xs"
                value={mainVotingBatchNonce.toString()}
                readOnly
              />
            </div>

            <div>
              <Label htmlFor="executorSig">executorSig</Label>
              <Input
                id="executorSig"
                className="font-mono text-xs"
                value={mainVotingExecutorSig ?? ''}
                readOnly
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </StepCard>
  );
}
