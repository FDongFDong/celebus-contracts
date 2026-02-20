'use client';

import { useState } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusAlert } from '@/components/shared/StatusAlert';
import { useAppStore } from '@/store/useAppStore';
import { useSelectedChain } from '@/hooks/useSelectedChain';
import { logError } from '@/lib/error-handler';
import { toast } from 'sonner';
import { isAddress } from 'viem';
import { mainVotingAbi } from '@/infrastructure/contracts/MainVotingContract';

type TabType = 'voteResults' | 'artist' | 'record' | 'nonce' | 'settings';

type QueryPrimitive = string | number | boolean | bigint | null;
type QueryObject = { [key: string]: QueryValue };
type QueryValue = QueryPrimitive | QueryObject | QueryValue[];
type QueryResult = QueryValue | readonly QueryValue[] | null;

export function Step8Query() {
  const [activeTab, setActiveTab] = useState<TabType>('voteResults');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult>(null);
  const [error, setError] = useState('');
  const [voteSummaryMissionId, setVoteSummaryMissionId] = useState('1');
  const [voteSummaryVotingId, setVoteSummaryVotingId] = useState('12345678');
  const [artistAggMissionId, setArtistAggMissionId] = useState('1');
  const [artistAggOptionId, setArtistAggOptionId] = useState('1');
  const [userNonceUser, setUserNonceUser] = useState('');
  const [userNonceNonce, setUserNonceNonce] = useState('0');
  const [batchNonceExecutor, setBatchNonceExecutor] = useState('');
  const [batchNonceNonce, setBatchNonceNonce] = useState('0');

  const { contractAddress } = useAppStore();
  const { publicClient } = useSelectedChain();

  /**
   * 투표 요약 조회
   */
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
        abi: mainVotingAbi,
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

  /**
   * 아티스트 집계 조회
   */
  const queryArtistAggregates = async (missionId: string, optionId: string) => {
    try {
      setIsLoading(true);
      setError('');
      setResult(null);

      if (!contractAddress) {
        throw new Error('컨트랙트 주소가 설정되지 않았습니다');
      }

      const stats = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: mainVotingAbi,
        functionName: 'getArtistAggregates',
        args: [BigInt(missionId), BigInt(optionId)],
      }) as readonly [bigint, bigint, bigint];

      setResult({
        remember: stats[0].toString(),
        forget: stats[1].toString(),
        total: stats[2].toString(),
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

  /**
   * 사용자 Nonce 조회
   */
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

      const used = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: mainVotingAbi,
        functionName: 'usedUserNonces',
        args: [user as `0x${string}`, BigInt(nonce)],
      }) as boolean;

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

  /**
   * 배치 Nonce 조회
   */
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

      const used = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: mainVotingAbi,
        functionName: 'usedBatchNonces',
        args: [executor as `0x${string}`, BigInt(nonce)],
      }) as boolean;

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

  /**
   * ExecutorSigner 조회
   */
  const queryExecutorSigner = async () => {
    try {
      setIsLoading(true);
      setError('');
      setResult(null);

      if (!contractAddress) {
        throw new Error('컨트랙트 주소가 설정되지 않았습니다');
      }

      const signer = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: mainVotingAbi,
        functionName: 'executorSigner',
      }) as `0x${string}`;

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
      .catch((error) => logError(label, error));
  };

  return (
    <StepCard
      stepNumber={8}
      title="컨트랙트 조회"
      description="컨트랙트의 다양한 데이터를 조회합니다"
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="voteResults">투표 결과</TabsTrigger>
          <TabsTrigger value="artist">Artist</TabsTrigger>
          <TabsTrigger value="record">레코드</TabsTrigger>
          <TabsTrigger value="nonce">Nonce</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        {/* 투표 결과 탭 */}
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
                    id="voteSummary-missionId"
                    type="number"
                    placeholder="1"
                    value={voteSummaryMissionId}
                    onChange={(e) => setVoteSummaryMissionId(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Voting ID</Label>
                  <Input
                    id="voteSummary-votingId"
                    type="number"
                    placeholder="12345678"
                    value={voteSummaryVotingId}
                    onChange={(e) => setVoteSummaryVotingId(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  runSafe(
                    'Step8Query.queryVoteSummaries',
                    () => queryVoteSummaries(voteSummaryMissionId, voteSummaryVotingId)
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
              <CardTitle className="text-base">아티스트 집계 조회</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Mission ID</Label>
                  <Input
                    id="artistAgg-missionId"
                    type="number"
                    placeholder="1"
                    value={artistAggMissionId}
                    onChange={(e) => setArtistAggMissionId(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Option ID</Label>
                  <Input
                    id="artistAgg-optionId"
                    type="number"
                    placeholder="1"
                    value={artistAggOptionId}
                    onChange={(e) => setArtistAggOptionId(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  runSafe(
                    'Step8Query.queryArtistAggregates',
                    () => queryArtistAggregates(artistAggMissionId, artistAggOptionId)
                  )
                }
                disabled={isLoading}
              >
                조회
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nonce 탭 */}
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
                    id="userNonce-user"
                    placeholder="0x..."
                    className="font-mono text-xs"
                    value={userNonceUser}
                    onChange={(e) => setUserNonceUser(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Nonce</Label>
                  <Input
                    id="userNonce-nonce"
                    type="number"
                    value={userNonceNonce}
                    onChange={(e) => setUserNonceNonce(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  runSafe('Step8Query.queryUserNonce', () =>
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
                    id="batchNonce-executor"
                    placeholder="0x..."
                    className="font-mono text-xs"
                    value={batchNonceExecutor}
                    onChange={(e) => setBatchNonceExecutor(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Nonce</Label>
                  <Input
                    id="batchNonce-nonce"
                    type="number"
                    value={batchNonceNonce}
                    onChange={(e) => setBatchNonceNonce(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  runSafe('Step8Query.queryBatchNonce', () =>
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

        {/* 설정 탭 */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ExecutorSigner 조회</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => runSafe('Step8Query.queryExecutorSigner', queryExecutorSigner)}
                disabled={isLoading}
              >
                조회
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 나머지 탭들은 간소화 */}
        <TabsContent value="artist">
          <StatusAlert type="info" message="아티스트 관련 조회 기능 (구현 예정)" />
        </TabsContent>

        <TabsContent value="record">
          <StatusAlert type="info" message="레코드 조회 기능 (구현 예정)" />
        </TabsContent>
      </Tabs>

      {/* 로딩 상태 */}
      {isLoading && (
        <StatusAlert
          type="loading"
          message="조회 중..."
          className="mt-4"
        />
      )}

      {/* 결과 표시 */}
      {result && (
        <Card className="mt-4 bg-green-500/10 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-base">조회 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono bg-background p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(
                result,
                (key, value) =>
                  typeof value === 'bigint' ? value.toString() : value,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* 에러 표시 */}
      {error && (
        <StatusAlert
          type="error"
          message={error}
          className="mt-4"
        />
      )}
    </StepCard>
  );
}
