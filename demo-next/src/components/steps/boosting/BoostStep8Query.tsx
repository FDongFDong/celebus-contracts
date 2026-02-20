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
import { boostingAbi } from '@/infrastructure/contracts/BoostingContract';
import { logError } from '@/lib/error-handler';
import { toast } from 'sonner';

type TabType = 'boostResults' | 'nonce' | 'settings';

type QueryPrimitive = string | number | boolean | bigint | null;
type QueryObject = { [key: string]: QueryValue };
type QueryValue = QueryPrimitive | QueryObject | QueryValue[];
type QueryResult = QueryValue | readonly QueryValue[] | null;

export function BoostStep8Query() {
  const [activeTab, setActiveTab] = useState<TabType>('boostResults');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult>(null);
  const [error, setError] = useState('');

  const [boostMissionId, setBoostMissionId] = useState('1');
  const [boostingId, setBoostingId] = useState('12345678');
  const [aggregateOptionId, setAggregateOptionId] = useState('1');

  const [userNonceUser, setUserNonceUser] = useState('');
  const [userNonceNonce, setUserNonceNonce] = useState('0');
  const [batchNonceExecutor, setBatchNonceExecutor] = useState('');
  const [batchNonceNonce, setBatchNonceNonce] = useState('0');
  const [boostTypeId, setBoostTypeId] = useState('0');

  const { contractAddress } = useAppStore();
  const { publicClient } = useSelectedChain();

  const queryBoostSummaries = async (missionId: string, localBoostingId: string) => {
    try {
      setIsLoading(true);
      setError('');
      setResult(null);

      if (!contractAddress) {
        throw new Error('컨트랙트 주소가 설정되지 않았습니다');
      }

      const summaries = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: boostingAbi,
        functionName: 'getBoostSummariesByBoostingId',
        args: [BigInt(missionId), BigInt(localBoostingId)],
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

  const queryBoostAggregates = async (missionId: string, optionId: string) => {
    try {
      setIsLoading(true);
      setError('');
      setResult(null);

      if (!contractAddress) {
        throw new Error('컨트랙트 주소가 설정되지 않았습니다');
      }

      const aggregates = (await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: boostingAbi,
        functionName: 'getBoostAggregates',
        args: [BigInt(missionId), BigInt(optionId)],
      })) as readonly [bigint, bigint, bigint];

      setResult({
        bpAmt: aggregates[0],
        celbAmt: aggregates[1],
        total: aggregates[2],
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
        abi: boostingAbi,
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
        abi: boostingAbi,
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
        abi: boostingAbi,
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

  const queryBoostTypeName = async (typeId: string) => {
    try {
      setIsLoading(true);
      setError('');
      setResult(null);

      if (!contractAddress) {
        throw new Error('컨트랙트 주소가 설정되지 않았습니다');
      }

      const typeName = (await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: boostingAbi,
        functionName: 'boostingTypeName',
        args: [Number(typeId)],
      })) as string;

      setResult({ typeId, typeName });
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
      description="Boosting 컨트랙트의 결과/Nonce/설정 데이터를 조회합니다"
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="boostResults">부스팅 결과</TabsTrigger>
          <TabsTrigger value="nonce">Nonce</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        <TabsContent value="boostResults" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">부스팅 요약 조회</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Mission ID</Label>
                  <Input
                    type="number"
                    value={boostMissionId}
                    onChange={(e) => setBoostMissionId(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Boosting ID</Label>
                  <Input
                    type="number"
                    value={boostingId}
                    onChange={(e) => setBoostingId(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  runSafe('BoostStep8Query.queryBoostSummaries', () =>
                    queryBoostSummaries(boostMissionId, boostingId)
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
                    type="number"
                    value={boostMissionId}
                    onChange={(e) => setBoostMissionId(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Option ID</Label>
                  <Input
                    type="number"
                    value={aggregateOptionId}
                    onChange={(e) => setAggregateOptionId(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  runSafe('BoostStep8Query.queryBoostAggregates', () =>
                    queryBoostAggregates(boostMissionId, aggregateOptionId)
                  )
                }
                disabled={isLoading}
              >
                조회
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
                  runSafe('BoostStep8Query.queryUserNonce', () =>
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
                  runSafe('BoostStep8Query.queryBatchNonce', () =>
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
                  runSafe('BoostStep8Query.queryExecutorSigner', queryExecutorSigner)
                }
                disabled={isLoading}
              >
                조회
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Boosting Type 이름 조회</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label>Type ID (0 or 1)</Label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  value={boostTypeId}
                  onChange={(e) => setBoostTypeId(e.target.value)}
                />
              </div>
              <Button
                onClick={() =>
                  runSafe('BoostStep8Query.queryBoostTypeName', () =>
                    queryBoostTypeName(boostTypeId)
                  )
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
