'use client';

import { useState } from 'react';
import { parseAbi, type Hash, keccak256, toBytes } from 'viem';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import { DigestService } from '@/domain/services/DigestService';
import { publicClient } from '@/lib/viem-clients';
import { toast } from 'sonner';

export function SubStep5Struct() {
  const contractAddress = useAppStore((s) => s.contractAddress);
  const mainVotingExecutorAddress = useAppStore((s) => s.mainVotingExecutorAddress);
  const contractExecutorAddress = useAppStore((s) => s.contractExecutorAddress);
  const setSubVotingBatchNonce = useAppStore((s) => s.setSubVotingBatchNonce);

  const executorAddress = mainVotingExecutorAddress ?? contractExecutorAddress;

  const [batchNonce, setBatchNonce] = useState('0');
  const [batchTypeHash, setBatchTypeHash] = useState<Hash | null>(null);
  const [structHash, setStructHash] = useState<Hash | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [nonceCheckResult, setNonceCheckResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const handleCheckNonce = async () => {
    try {
      setIsChecking(true);
      setNonceCheckResult({ status: 'idle', message: '' });

      if (!executorAddress) {
        setNonceCheckResult({
          status: 'error',
          message: '먼저 STEP 1에서 Executor 계정을 할당해주세요',
        });
        return;
      }

      if (!contractAddress) {
        setNonceCheckResult({
          status: 'error',
          message: '먼저 컨트랙트 주소를 설정해주세요',
        });
        return;
      }

      const nonceValue = batchNonce.trim();
      if (!nonceValue || !/^\d+$/.test(nonceValue)) {
        setNonceCheckResult({
          status: 'error',
          message: '유효한 Nonce 값을 입력해주세요 (숫자만)',
        });
        return;
      }

      const isUsed = await publicClient.readContract({
        address: contractAddress,
        abi: parseAbi([
          'function usedBatchNonces(address executor, uint256 nonce) view returns (bool)',
        ]),
        functionName: 'usedBatchNonces',
        args: [executorAddress, BigInt(nonceValue)],
      });

      if (isUsed) {
        setNonceCheckResult({
          status: 'error',
          message: `Nonce ${nonceValue}은(는) 이미 사용되었습니다`,
        });
      } else {
        setNonceCheckResult({
          status: 'success',
          message: `Nonce ${nonceValue}은(는) 사용 가능합니다`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setNonceCheckResult({ status: 'error', message: `조회 실패: ${message}` });
    } finally {
      setIsChecking(false);
    }
  };

  const handleCalculate = () => {
    try {
      setIsCalculating(true);

      const nonceValue = batchNonce.trim();
      if (!nonceValue || !/^\d+$/.test(nonceValue)) {
        toast.error('유효한 Batch Nonce 값을 입력해주세요');
        return;
      }

      const nonce = BigInt(nonceValue);
      const typeHash = keccak256(toBytes('Batch(uint256 batchNonce)'));
      const calculatedStructHash = DigestService.calculateStructHash(nonce);

      setBatchTypeHash(typeHash);
      setStructHash(calculatedStructHash);
      setSubVotingBatchNonce(nonce);

      toast.success('Struct Hash 계산 완료');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`계산 실패: ${message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <StepCard
      stepNumber={5}
      title="구조체 해시 계산"
      description="SubVoting 배치 nonce 기반 struct hash를 계산합니다"
      badgeColor="default"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="subBatchNonce">배치 Nonce</Label>
          <div className="flex gap-2">
            <Input
              id="subBatchNonce"
              type="text"
              value={batchNonce}
              onChange={(e) => setBatchNonce(e.target.value)}
              placeholder="숫자 입력"
              className="font-mono flex-1"
            />
            <Button
              onClick={handleCheckNonce}
              disabled={isChecking}
              variant="outline"
              className="whitespace-nowrap"
            >
              {isChecking ? '확인 중...' : '사용 가능 확인'}
            </Button>
          </div>

          {nonceCheckResult.status !== 'idle' && (
            <div
              className={`mt-2 p-3 rounded-lg text-sm ${
                nonceCheckResult.status === 'success'
                  ? 'bg-green-500/10 border border-green-500/30 text-green-700'
                  : 'bg-red-500/10 border border-red-500/30 text-red-700'
              }`}
            >
              {nonceCheckResult.message}
            </div>
          )}
        </div>

        <Button
          onClick={handleCalculate}
          disabled={isCalculating || !batchNonce}
          className="w-full"
        >
          {isCalculating ? '계산 중...' : '구조체 해시 계산'}
        </Button>

        {structHash && (
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subBatchTypeHash">배치 타입 해시</Label>
              <Input
                id="subBatchTypeHash"
                type="text"
                value={batchTypeHash ?? ''}
                readOnly
                className="font-mono text-xs bg-muted"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subStructHash">구조체 해시</Label>
              <Input
                id="subStructHash"
                type="text"
                value={structHash}
                readOnly
                className="font-mono text-xs bg-green-500/10"
              />
              <p className="text-xs text-green-700 mt-1">
                ✓ 이 값이 STEP 6에서 자동으로 사용됩니다
              </p>
            </div>
          </div>
        )}

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="font-semibold text-yellow-700">📖 계산 과정 보기</span>
              <span>{showExplanation ? '▲' : '▼'}</span>
            </button>

            {showExplanation && (
              <div className="mt-4 text-xs text-muted-foreground space-y-2">
                <p>1) keccak256(&quot;Batch(uint256 batchNonce)&quot;)</p>
                <p>2) abi.encode(typeHash, batchNonce)</p>
                <p>3) keccak256(encoded)</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StepCard>
  );
}
