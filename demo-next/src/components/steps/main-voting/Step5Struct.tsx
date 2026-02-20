/**
 * MainVoting Step 5: EIP-712 Struct 해시 계산
 *
 * 배치 Nonce를 입력받아 구조체 해시를 계산합니다.
 */

'use client';

import { useState } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import { DigestService } from '@/domain/services/DigestService';
import { toast } from 'sonner';
import { keccak256, toBytes, parseAbi, type Hash } from 'viem';
import { publicClient } from '@/lib/viem-clients';

/**
 * Step 5: EIP-712 Struct 해시 계산 컴포넌트
 */
export function Step5Struct() {
  // -------------------------------------------------------------------------
  // Store State
  // -------------------------------------------------------------------------
  const contractAddress = useAppStore((s) => s.contractAddress);
  const mainVotingExecutorAddress = useAppStore(
    (s) => s.mainVotingExecutorAddress
  );
  const setMainVotingBatchNonce = useAppStore((s) => s.setMainVotingBatchNonce);

  // -------------------------------------------------------------------------
  // Local State
  // -------------------------------------------------------------------------
  const [batchNonce, setBatchNonce] = useState('0');
  const [batchTypeHash, setBatchTypeHash] = useState<Hash | null>(null);
  const [structHash, setStructHash] = useState<Hash | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [nonceCheckResult, setNonceCheckResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const [showExplanation, setShowExplanation] = useState(false);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /**
   * Batch Nonce 사용 가능 여부 확인
   */
  const handleCheckNonce = async () => {
    try {
      setIsChecking(true);
      setNonceCheckResult({ status: 'idle', message: '' });

      // 필수 값 확인
      if (!mainVotingExecutorAddress) {
        setNonceCheckResult({
          status: 'error',
          message: '먼저 STEP 1에서 Executor 계정을 할당해주세요!',
        });
        return;
      }

      if (!contractAddress) {
        setNonceCheckResult({
          status: 'error',
          message: '먼저 컨트랙트 주소를 설정해주세요!',
        });
        return;
      }

      // Nonce 형식 검증
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
        args: [mainVotingExecutorAddress, BigInt(nonceValue)],
      });

      if (isUsed) {
        setNonceCheckResult({
          status: 'error',
          message: `Nonce ${nonceValue}은(는) 이미 사용되었습니다. 다른 값을 사용하세요.`,
        });
      } else {
        setNonceCheckResult({
          status: 'success',
          message: `Nonce ${nonceValue}은(는) 사용 가능합니다!`,
        });
      }
    } catch (error) {
      console.error('Batch Nonce check failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setNonceCheckResult({
        status: 'error',
        message: `조회 실패: ${message}`,
      });
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Struct Hash 계산
   */
  const handleCalculate = () => {
    try {
      setIsCalculating(true);

      // Nonce 형식 검증
      const nonceValue = batchNonce.trim();
      if (!nonceValue || !/^\d+$/.test(nonceValue)) {
        toast.error('유효한 Batch Nonce 값을 입력해주세요 (숫자만)');
        return;
      }

      const nonce = BigInt(nonceValue);

      // Batch TypeHash 계산
      const typeHash = keccak256(toBytes('Batch(uint256 batchNonce)'));
      setBatchTypeHash(typeHash);

      // Struct Hash 계산
      const calculatedStructHash = DigestService.calculateStructHash(nonce);
      setStructHash(calculatedStructHash);

      // Store에 batchNonce 저장 (Step 6에서 자동 로드됨)
      setMainVotingBatchNonce(nonce);

      toast.success('Struct Hash 계산 완료!');
    } catch (error) {
      console.error('Struct Hash calculation failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`계산 실패: ${message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <StepCard
      stepNumber={5}
      title="구조체 해시 계산"
      description="서명할 데이터 구조의 해시를 계산합니다"
      badgeColor="default"
    >
      <div className="space-y-4">
        {/* Batch Nonce 입력 */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="batchNonce">배치 Nonce</Label>
          <div className="flex gap-2">
            <Input
              id="batchNonce"
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
          <p className="text-xs text-muted-foreground mt-1">
            배치의 고유 번호 (재전송 방지용) - 중복 체크 방식으로 원하는 숫자 사용 가능
          </p>

          {/* Nonce 체크 결과 */}
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

        {/* 계산 버튼 */}
        <Button
          onClick={handleCalculate}
          disabled={isCalculating || !batchNonce}
          className="w-full"
        >
          {isCalculating ? '계산 중...' : '구조체 해시 계산'}
        </Button>

        {/* 계산 결과 */}
        {structHash && (
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="batchTypeHash">배치 타입 해시</Label>
              <Input
                id="batchTypeHash"
                type="text"
                value={batchTypeHash ?? ''}
                readOnly
                className="font-mono text-xs bg-muted"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="structHash">구조체 해시 (계산 결과)</Label>
              <Input
                id="structHash"
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

        {/* 계산 과정 설명 */}
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="font-semibold text-yellow-700">
                📖 계산 과정 보기
              </span>
              <span>{showExplanation ? '▲' : '▼'}</span>
            </button>

            {showExplanation && (
              <div className="mt-4 space-y-3 text-sm">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold mb-2">계산 방법:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-xs">
                    <li>
                      Batch TypeHash 계산:
                      <code className="block ml-4 mt-1 p-2 bg-background rounded font-mono text-xs break-all">
                        keccak256(&quot;Batch(uint256 batchNonce)&quot;)
                      </code>
                    </li>
                    <li>
                      Batch 데이터 인코딩:
                      <code className="block ml-4 mt-1 p-2 bg-background rounded font-mono text-xs break-all">
                        abi.encode(BATCH_TYPEHASH, batchNonce)
                      </code>
                    </li>
                    <li>
                      최종 해시:
                      <code className="block ml-4 mt-1 p-2 bg-background rounded font-mono text-xs break-all">
                        keccak256(encoded)
                      </code>
                    </li>
                  </ol>
                </div>

                {structHash && (
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-semibold mb-2">계산 결과:</h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <p className="font-semibold">Batch Nonce:</p>
                        <p className="font-mono bg-background p-2 rounded break-all">
                          {batchNonce}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Batch TypeHash:</p>
                        <p className="font-mono bg-background p-2 rounded break-all">
                          {batchTypeHash}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Struct Hash:</p>
                        <p className="font-mono bg-background p-2 rounded break-all">
                          {structHash}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StepCard>
  );
}
