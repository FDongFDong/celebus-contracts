'use client';

import { useState } from 'react';
import { isAddress } from 'viem';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusAlert } from '@/components/shared/StatusAlert';
import { useAppStore } from '@/store/useAppStore';
import { useSelectedChain } from '@/hooks/useSelectedChain';
import { subVotingAbi } from '@/infrastructure/contracts/SubVotingContract';
import { logError } from '@/lib/error-handler';
import { toast } from 'sonner';

type TabType = 'voteResults' | 'question' | 'nonce' | 'settings';

type QueryPrimitive = string | number | boolean | bigint | null;
type QueryObject = { [key: string]: QueryValue };
type QueryValue = QueryPrimitive | QueryObject | QueryValue[];
type QueryResult = QueryValue | readonly QueryValue[] | null;

export function SubStep8Query() {
  const [activeTab, setActiveTab] = useState<TabType>('voteResults');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult>(null);
  const [error, setError] = useState('');

  const [voteSummaryMissionId, setVoteSummaryMissionId] = useState('1');
  const [voteSummaryVotingId, setVoteSummaryVotingId] = useState('12345678');

  const [questionMissionId, setQuestionMissionId] = useState('1');
  const [questionId, setQuestionId] = useState('1');
  const [questionOptionId, setQuestionOptionId] = useState('1');
  const [aggregateOptionIds, setAggregateOptionIds] = useState('1,2,3');

  const [userNonceUser, setUserNonceUser] = useState('');
  const [userNonceNonce, setUserNonceNonce] = useState('0');
  const [batchNonceExecutor, setBatchNonceExecutor] = useState('');
  const [batchNonceNonce, setBatchNonceNonce] = useState('0');

  const { contractAddress } = useAppStore();
  const { publicClient } = useSelectedChain();

  const queryVoteSummaries = async (missionId: string, votingId: string) => {
    try {
      setIsLoading(true);
      setError('');
      setResult(null);

      if (!contractAddress) {
        throw new Error('컨트랙트 주소가 설정되지 않았습니다');
      }

      const summaries = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: subVotingAbi,
        functionName: 'getVoteSummariesByMissionVotingId',
        args: [BigInt(missionId), BigInt(votingId)],
      });

      setResult(summaries as QueryResult);
      toast.success('조회 완료');
    } catch (err) {
      const message = err instanceof Error ? err.message : '조회 실패';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const queryOptionVotes = async (
    missionId: string,
    question: string,
    optionId: string
  ) => {
    try {
      setIsLoading(true);
      setError('');
      setResult(null);

      if (!contractAddress) {
        throw new Error('컨트랙트 주소가 설정되지 않았습니다');
      }

      const votes = (await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: subVotingAbi,
        functionName: 'getOptionVotes',
        args: [BigInt(missionId), BigInt(question), BigInt(optionId)],
      })) as bigint;

      setResult({ optionVotes: votes });
      toast.success('조회 완료');
    } catch (err) {
      const message = err instanceof Error ? err.message : '조회 실패';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const queryQuestionTotalVotes = async (missionId: string, question: string) => {
    try {
      setIsLoading(true);
      setError('');
      setResult(null);

      if (!contractAddress) {
        throw new Error('컨트랙트 주소가 설정되지 않았습니다');
      }

      const total = (await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: subVotingAbi,
        functionName: 'getQuestionTotalVotes',
        args: [BigInt(missionId), BigInt(question)],
      })) as bigint;

      setResult({ totalVotes: total });
      toast.success('조회 완료');
    } catch (err) {
      const message = err instanceof Error ? err.message : '조회 실패';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const queryQuestionAggregates = async (
    missionId: string,
    question: string,
    optionIdsCsv: string
  ) => {
    try {
      setIsLoading(true);
      setError('');
      setResult(null);

      if (!contractAddress) {
        throw new Error('컨트랙트 주소가 설정되지 않았습니다');
      }

      const optionIds = optionIdsCsv
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => BigInt(v));

      if (optionIds.length === 0) {
        throw new Error('Option IDs를 최소 1개 입력해주세요');
      }

      const response = (await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: subVotingAbi,
        functionName: 'getQuestionAggregates',
        args: [BigInt(missionId), BigInt(question), optionIds],
      })) as readonly [readonly bigint[], bigint];

      setResult({
        optionVotes: Array.from(response[0]),
        total: response[1],
      });
      toast.success('조회 완료');
    } catch (err) {
      const message = err instanceof Error ? err.message : '조회 실패';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const queryUserNonce = async (user: string, nonce: string) => {
    try {
      setIsLoading(true);
      setError('');
      setResult(null);

      if (!contractAddress) {
        throw new Error('컨트랙트 주소가 설정되지 않았습니다');
      }

      if (!isAddress(user)) {
        throw new Error('올바른 주소를 입력해주세요');
      }

      const used = (await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: subVotingAbi,
        functionName: 'usedUserNonces',
        args: [user as `0x${string}`, BigInt(nonce)],
      })) as boolean;

      setResult({ used });
      toast.success('조회 완료');
    } catch (err) {
      const message = err instanceof Error ? err.message : '조회 실패';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const queryBatchNonce = async (executor: string, nonce: string) => {
    try {
      setIsLoading(true);
      setError('');
      setResult(null);

      if (!contractAddress) {
        throw new Error('컨트랙트 주소가 설정되지 않았습니다');
      }

      if (!isAddress(executor)) {
        throw new Error('올바른 주소를 입력해주세요');
      }

      const used = (await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: subVotingAbi,
        functionName: 'usedBatchNonces',
        args: [executor as `0x${string}`, BigInt(nonce)],
      })) as boolean;

      setResult({ used });
      toast.success('조회 완료');
    } catch (err) {
      const message = err instanceof Error ? err.message : '조회 실패';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const queryExecutorSigner = async () => {
    try {
      setIsLoading(true);
      setError('');
      setResult(null);

      if (!contractAddress) {
        throw new Error('컨트랙트 주소가 설정되지 않았습니다');
      }

      const signer = (await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: subVotingAbi,
        functionName: 'executorSigner',
      })) as `0x${string}`;

      setResult({ executorSigner: signer });
      toast.success('조회 완료');
    } catch (err) {
      const message = err instanceof Error ? err.message : '조회 실패';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const runSafe = (label: string, action: () => Promise<unknown> | unknown) => {
    Promise.resolve()
      .then(action)
      .catch((caughtError) => logError(label, caughtError));
  };

  return (
    <StepCard
      stepNumber={8}
      title="컨트랙트 조회"
      description="SubVoting 컨트랙트의 결과/설정/Nonce 데이터를 조회합니다"
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="voteResults">투표 결과</TabsTrigger>
          <TabsTrigger value="question">질문 집계</TabsTrigger>
          <TabsTrigger value="nonce">Nonce</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        <TabsContent value="voteResults" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">투표 요약 조회</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Mission ID</Label>
                  <Input
                    type="number"
                    value={voteSummaryMissionId}
                    onChange={(e) => setVoteSummaryMissionId(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Voting ID</Label>
                  <Input
                    type="number"
                    value={voteSummaryVotingId}
                    onChange={(e) => setVoteSummaryVotingId(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  runSafe('SubStep8Query.queryVoteSummaries', () =>
                    queryVoteSummaries(voteSummaryMissionId, voteSummaryVotingId)
                  )
                }
                disabled={isLoading}
              >
                조회
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="question" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">선택지 득표 조회</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Mission ID</Label>
                  <Input
                    type="number"
                    value={questionMissionId}
                    onChange={(e) => setQuestionMissionId(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Question ID</Label>
                  <Input
                    type="number"
                    value={questionId}
                    onChange={(e) => setQuestionId(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Option ID</Label>
                  <Input
                    type="number"
                    value={questionOptionId}
                    onChange={(e) => setQuestionOptionId(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() =>
                    runSafe('SubStep8Query.queryOptionVotes', () =>
                      queryOptionVotes(questionMissionId, questionId, questionOptionId)
                    )
                  }
                  disabled={isLoading}
                >
                  Option Votes 조회
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    runSafe('SubStep8Query.queryQuestionTotalVotes', () =>
                      queryQuestionTotalVotes(questionMissionId, questionId)
                    )
                  }
                  disabled={isLoading}
                >
                  Total Votes 조회
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">질문 집계 조회</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Mission ID</Label>
                  <Input
                    type="number"
                    value={questionMissionId}
                    onChange={(e) => setQuestionMissionId(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Question ID</Label>
                  <Input
                    type="number"
                    value={questionId}
                    onChange={(e) => setQuestionId(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Option IDs (comma)</Label>
                  <Input
                    value={aggregateOptionIds}
                    onChange={(e) => setAggregateOptionIds(e.target.value)}
                    placeholder="1,2,3"
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  runSafe('SubStep8Query.queryQuestionAggregates', () =>
                    queryQuestionAggregates(
                      questionMissionId,
                      questionId,
                      aggregateOptionIds
                    )
                  )
                }
                disabled={isLoading}
              >
                집계 조회
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nonce" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">사용자 Nonce 조회</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>사용자 주소</Label>
                  <Input
                    placeholder="0x..."
                    className="font-mono text-xs"
                    value={userNonceUser}
                    onChange={(e) => setUserNonceUser(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Nonce</Label>
                  <Input
                    type="number"
                    value={userNonceNonce}
                    onChange={(e) => setUserNonceNonce(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  runSafe('SubStep8Query.queryUserNonce', () =>
                    queryUserNonce(userNonceUser, userNonceNonce)
                  )
                }
                disabled={isLoading}
              >
                조회
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">배치 Nonce 조회</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Executor 주소</Label>
                  <Input
                    placeholder="0x..."
                    className="font-mono text-xs"
                    value={batchNonceExecutor}
                    onChange={(e) => setBatchNonceExecutor(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Nonce</Label>
                  <Input
                    type="number"
                    value={batchNonceNonce}
                    onChange={(e) => setBatchNonceNonce(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  runSafe('SubStep8Query.queryBatchNonce', () =>
                    queryBatchNonce(batchNonceExecutor, batchNonceNonce)
                  )
                }
                disabled={isLoading}
              >
                조회
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ExecutorSigner 조회</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() =>
                  runSafe('SubStep8Query.queryExecutorSigner', queryExecutorSigner)
                }
                disabled={isLoading}
              >
                조회
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isLoading && (
        <StatusAlert type="loading" message="조회 중..." className="mt-4" />
      )}

      {result && (
        <Card className="mt-4 bg-green-500/10 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-base">조회 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono bg-background p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(
                result,
                (_key, value) =>
                  typeof value === 'bigint' ? value.toString() : value,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      )}

      {error && <StatusAlert type="error" message={error} className="mt-4" />}
    </StepCard>
  );
}
