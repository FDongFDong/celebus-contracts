'use client';

import { useState } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusAlert } from '@/components/shared/StatusAlert';
import { useAppStore } from '@/store/useAppStore';
import { useSelectedChain } from '@/hooks/useSelectedChain';
import { toast } from 'sonner';
import { parseAbiItem, parseEventLogs } from 'viem';

interface UserMissionResultEvent {
  votingId: string;
  success: boolean;
  failedRecordIds: bigint[];
  reasonCode: number;
  blockNumber?: bigint;
  transactionHash?: string;
}

const REASON_CODES: Record<number, { name: string; message: string }> = {
  0: { name: 'NONE', message: '오류 없음' },
  1: { name: 'EMPTY_OR_OVERFLOW', message: '레코드 수가 0개이거나 20개 초과' },
  2: { name: 'INVALID_SIGNATURE', message: '유저 서명이 유효하지 않음' },
  3: { name: 'NONCE_USED', message: 'Nonce 중복 사용' },
  4: { name: 'INVALID_VOTE_TYPE', message: 'VoteType이 유효하지 않음' },
  5: { name: 'ARTIST_NOT_ALLOWED', message: '허용되지 않은 아티스트' },
  6: { name: 'STRING_TOO_LONG', message: '문자열 길이 초과' },
};

export function Step9Events() {
  const [txHash, setTxHash] = useState('');
  const [fromBlock, setFromBlock] = useState('');
  const [toBlock, setToBlock] = useState('');
  const [events, setEvents] = useState<UserMissionResultEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const { contractAddress } = useAppStore();
  const { publicClient } = useSelectedChain();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  /**
   * 트랜잭션 해시로 이벤트 조회
   */
  const queryByTxHash = async () => {
    if (!txHash || !txHash.startsWith('0x')) {
      toast.error('유효한 트랜잭션 해시를 입력하세요');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      addLog(`트랜잭션 이벤트 조회 중: ${txHash}`);

      const receipt = await publicClient.getTransactionReceipt({
        hash: txHash as `0x${string}`
      });

      if (!receipt) {
        throw new Error('트랜잭션을 찾을 수 없습니다');
      }

      const eventAbi = parseAbiItem(
        'event UserMissionResult(uint256 indexed votingId, bool success, uint256[] failedRecordIds, uint8 reasonCode)'
      );

      const parsedLogs = parseEventLogs({
        abi: [eventAbi],
        logs: receipt.logs,
      });

      const parsedEvents: UserMissionResultEvent[] = parsedLogs.map((log) => {
        const args = log.args as {
          votingId?: bigint;
          success?: boolean;
          failedRecordIds?: readonly bigint[];
          reasonCode?: number;
        };
        return {
          votingId: args.votingId?.toString() || '0',
          success: args.success || false,
          failedRecordIds: Array.from(args.failedRecordIds || []),
          reasonCode: Number(args.reasonCode || 0),
          blockNumber: receipt.blockNumber,
          transactionHash: txHash,
        };
      });

      setEvents(parsedEvents);
      addLog(`이벤트 ${parsedEvents.length}건 조회 완료`);
      toast.success('이벤트 조회 완료');
    } catch (err) {
      const message = err instanceof Error ? err.message : '조회 실패';
      setError(message);
      addLog(`ERROR: ${message}`);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 블록 범위로 이벤트 조회
   */
  const queryByBlockRange = async () => {
    try {
      setIsLoading(true);
      setError('');
      addLog('블록 범위 이벤트 조회 시작...');

      if (!contractAddress) {
        throw new Error('컨트랙트 주소가 설정되지 않았습니다');
      }

      const currentBlock = await publicClient.getBlockNumber();
      const fromBlockValue = fromBlock ? BigInt(fromBlock) : currentBlock - 1000n;
      const toBlockValue = toBlock ? BigInt(toBlock) : 'latest';

      addLog(`블록 범위: ${fromBlockValue} ~ ${toBlockValue === 'latest' ? currentBlock : toBlockValue}`);

      const eventAbi = parseAbiItem(
        'event UserMissionResult(uint256 indexed votingId, bool success, uint256[] failedRecordIds, uint8 reasonCode)'
      );

      const logsResult = await publicClient.getLogs({
        address: contractAddress as `0x${string}`,
        event: eventAbi,
        fromBlock: fromBlockValue,
        toBlock: toBlockValue as bigint | 'latest',
      });

      const parsedEvents: UserMissionResultEvent[] = logsResult.map((log) => {
        const args = log.args as {
          votingId?: bigint;
          success?: boolean;
          failedRecordIds?: readonly bigint[];
          reasonCode?: number;
        };
        return {
          votingId: args.votingId?.toString() || '0',
          success: args.success || false,
          failedRecordIds: Array.from(args.failedRecordIds || []),
          reasonCode: Number(args.reasonCode || 0),
          blockNumber: log.blockNumber ?? undefined,
          transactionHash: log.transactionHash ?? undefined,
        };
      });

      setEvents(parsedEvents);
      addLog(`이벤트 ${parsedEvents.length}건 조회 완료`);
      toast.success('이벤트 조회 완료');
    } catch (err) {
      const message = err instanceof Error ? err.message : '조회 실패';
      setError(message);
      addLog(`ERROR: ${message}`);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 로그 클리어
   */
  const clearLogs = () => {
    setLogs([]);
    toast.success('로그 삭제됨');
  };

  return (
    <StepCard
      stepNumber={9}
      title="이벤트 조회 및 알림"
      description="UserMissionResult 이벤트를 조회하고 실패 알림을 처리합니다"
    >
      {/* 트랜잭션 해시로 조회 */}
      <Card className="mb-6 bg-blue-500/10 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            트랜잭션 해시로 조회
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <Label>Transaction Hash</Label>
            <Input
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="0x..."
              className="font-mono text-sm"
            />
          </div>
          <Button
            onClick={queryByTxHash}
            disabled={isLoading}
            variant="default"
            size="sm"
          >
            조회
          </Button>
        </CardContent>
      </Card>

      {/* 블록 범위로 조회 */}
      <Card className="mb-6 bg-green-500/10 border-green-500/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            블록 범위로 조회
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>From Block (빈칸: 최근 1000블록)</Label>
              <Input
                type="number"
                value={fromBlock}
                onChange={(e) => setFromBlock(e.target.value)}
                placeholder="예: 12345678"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>To Block (빈칸: latest)</Label>
              <Input
                type="number"
                value={toBlock}
                onChange={(e) => setToBlock(e.target.value)}
                placeholder="예: 12346678"
              />
            </div>
          </div>
          <Button
            onClick={queryByBlockRange}
            disabled={isLoading}
            variant="default"
            size="sm"
          >
            조회
          </Button>
        </CardContent>
      </Card>

      {/* 이벤트 결과 테이블 */}
      {events.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            조회 결과: {events.length}건
          </h3>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">#</th>
                  <th className="px-4 py-2 text-left font-medium">Voting ID</th>
                  <th className="px-4 py-2 text-left font-medium">결과</th>
                  <th className="px-4 py-2 text-left font-medium">실패 레코드 수</th>
                  <th className="px-4 py-2 text-left font-medium">실패 사유</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, i) => {
                  const reasonInfo = REASON_CODES[event.reasonCode] || {
                    name: 'UNKNOWN',
                    message: '알 수 없는 오류'
                  };
                  return (
                    <tr key={i} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-2">{i + 1}</td>
                      <td className="px-4 py-2 font-mono text-xs">{event.votingId}</td>
                      <td className="px-4 py-2">
                        <Badge variant={event.success ? 'default' : 'destructive'}>
                          {event.success ? '성공' : '실패'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">{event.failedRecordIds.length}</td>
                      <td className="px-4 py-2">
                        <span className="text-xs font-mono text-red-600">{event.reasonCode}</span>
                        <span className="text-xs opacity-70 ml-1">{reasonInfo.message}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 로그 출력 */}
      <Card className="bg-muted">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              로그
            </CardTitle>
            <Button onClick={clearLogs} variant="ghost" size="sm">
              삭제
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-32 overflow-y-auto text-xs font-mono bg-background p-2 rounded">
            {logs.length === 0 ? (
              <p className="opacity-60">로그가 없습니다</p>
            ) : (
              logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 로딩 상태 */}
      {isLoading && (
        <StatusAlert
          type="loading"
          message="조회 중..."
          className="mt-4"
        />
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
