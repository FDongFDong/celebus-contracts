/**
 * MainVoting Step 6: 최종 다이제스트 계산 및 Executor 서명
 *
 * STEP 4와 5의 결과를 결합하여 최종 서명할 해시를 생성하고 Executor가 서명합니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import { DigestService } from '@/domain/services/DigestService';
import { toast } from 'sonner';
import { hexToSignature, type Hash } from 'viem';
import {
  ensureActiveAddress,
  ensureCorrectChain,
  getInjectedWalletClient,
  WalletNotConnectedError,
} from '@/lib/injected-wallet';

/**
 * Step 6: 최종 다이제스트 및 Executor 서명 컴포넌트
 */
export function Step6Digest() {
  // -------------------------------------------------------------------------
  // Store State
  // -------------------------------------------------------------------------
  const contractAddress = useAppStore((s) => s.contractAddress);
  const selectedChainId = useAppStore((s) => s.selectedChainId);
  const mainVotingExecutorAddress = useAppStore(
    (s) => s.mainVotingExecutorAddress
  );
  const mainVotingBatchNonce = useAppStore((s) => s.mainVotingBatchNonce);
  const setMainVotingBatchNonce = useAppStore((s) => s.setMainVotingBatchNonce);
  const setMainVotingExecutorSig = useAppStore(
    (s) => s.setMainVotingExecutorSig
  );
  const domainName = useAppStore((s) => s.domainName);
  const domainVersion = useAppStore((s) => s.domainVersion);
  const domainChainId = useAppStore((s) => s.domainChainId);
  const domainVerifyingContract = useAppStore((s) => s.domainVerifyingContract);
  const setMainVotingDigest = useAppStore((s) => s.setMainVotingDigest);

  // -------------------------------------------------------------------------
  // Local State
  // -------------------------------------------------------------------------
  const [domainSeparator, setDomainSeparator] = useState<Hash | null>(null);
  const [structHash, setStructHash] = useState<Hash | null>(null);
  const [finalDigest, setFinalDigest] = useState<Hash | null>(null);
  const [batchNonce, setBatchNonce] = useState<bigint | null>(null);
  const [executorSignature, setExecutorSignature] = useState<Hash | null>(null);
  const [signatureComponents, setSignatureComponents] = useState<{
    r: string;
    s: string;
    v: number;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  // Step 4 결과 자동 로드 (Domain Separator)
  useEffect(() => {
    if (domainVerifyingContract) {
      import('@/domain/value-objects/EIP712Domain').then(({ EIP712Domain }) => {
        const domain = new EIP712Domain(
          domainName,
          domainVersion,
          domainChainId,
          domainVerifyingContract
        );
        setDomainSeparator(domain.calculateDomainSeparator());
      });
    }
  }, [domainName, domainVersion, domainChainId, domainVerifyingContract]);

  // Step 5 결과 자동 로드 (Batch Nonce → Struct Hash)
  useEffect(() => {
    if (mainVotingBatchNonce !== null && mainVotingBatchNonce !== undefined) {
      setBatchNonce(mainVotingBatchNonce);
      const calculatedStructHash = DigestService.calculateStructHash(mainVotingBatchNonce);
      setStructHash(calculatedStructHash);
    }
  }, [mainVotingBatchNonce]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleBatchNonceChange = (value: string) => {
    if (value === '') {
      setBatchNonce(null);
      setStructHash(null);
      setMainVotingBatchNonce(0n);
      return;
    }
    if (!/^\d+$/.test(value)) {
      return;
    }
    const nextNonce = BigInt(value);
    setBatchNonce(nextNonce);
    setMainVotingBatchNonce(nextNonce);

    // batchNonce 변경 시 structHash 자동 계산
    const calculatedStructHash = DigestService.calculateStructHash(nextNonce);
    setStructHash(calculatedStructHash);
  };

  /**
   * Final Digest 계산
   */
  const handleCalculateDigest = () => {
    try {
      setIsCalculating(true);

      if (!domainSeparator || !structHash) {
        toast.error('Step 4와 5를 먼저 완료해주세요!');
        return;
      }

      // Final Digest 계산
      const digest = DigestService.calculateDigest(domainSeparator, structHash);
      setFinalDigest(digest);
      setMainVotingDigest(digest);

      toast.success('최종 다이제스트 계산 완료!');
    } catch (error) {
      console.error('Digest calculation failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`계산 실패: ${message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  /**
   * Executor 서명 생성
   */
  const handleGenerateSignature = async () => {
    try {
      setIsSigning(true);

      if (!finalDigest) {
        toast.error('먼저 최종 다이제스트를 계산해주세요!');
        return;
      }

      if (!mainVotingExecutorAddress) {
        toast.error('Executor 지갑이 초기화되지 않았습니다! Step 1에서 계정을 할당해주세요.');
        return;
      }

      if (!contractAddress) {
        toast.error('컨트랙트 주소가 설정되지 않았습니다! Step 0에서 컨트랙트 주소를 설정해주세요.');
        return;
      }

      if (batchNonce === null) {
        toast.error('Batch Nonce가 설정되지 않았습니다! Step 5를 먼저 완료해주세요.');
        return;
      }

      // EIP-712 서명 생성
      const domain = {
        name: 'MainVoting',
        version: '1',
        chainId: selectedChainId,
        verifyingContract: contractAddress,
      };

      const types = {
        Batch: [{ name: 'batchNonce', type: 'uint256' }],
      };

      const message = {
        batchNonce,
      };

      const walletClient = getInjectedWalletClient(selectedChainId);
      await ensureCorrectChain(walletClient, selectedChainId);
      const activeAddress = await ensureActiveAddress(mainVotingExecutorAddress ?? undefined);

      const signature = await walletClient.signTypedData({
        account: activeAddress,
        domain,
        types,
        primaryType: 'Batch',
        message,
      });

      setExecutorSignature(signature as Hash);
      setMainVotingExecutorSig(signature as Hash);

      // 서명 분해 (r, s, v)
      const sig = hexToSignature(signature as Hash);
      setSignatureComponents({
        r: sig.r,
        s: sig.s,
        v: typeof sig.v === 'bigint' ? Number(sig.v) : (sig.v ?? 0),
      });

      toast.success('Executor 서명 생성 완료!');
    } catch (error) {
      if (error instanceof WalletNotConnectedError) {
        toast.info('지갑을 먼저 연결해주세요 (Step 0)');
        return;
      }
      console.error('Signature generation failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Executor 서명 생성 실패: ${message}`);
    } finally {
      setIsSigning(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <StepCard
      stepNumber={6}
      title="최종 다이제스트 및 Executor 서명"
      description="STEP 4와 5의 결과를 결합하여 최종 서명할 해시를 생성합니다"
      badgeColor="default"
    >
      <div className="space-y-4">
        {/* STEP 4, 5 결과 자동 복사 */}
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="domainSeparatorInput">
              도메인 구분자 (STEP 4에서 자동 복사)
            </Label>
            <Input
              id="domainSeparatorInput"
              type="text"
              value={domainSeparator ?? ''}
              readOnly
              placeholder="STEP 4를 먼저 완료해주세요"
              className="font-mono text-xs bg-primary/5"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="structHashInput">
              구조체 해시 (STEP 5에서 자동 복사)
            </Label>
            <Input
              id="structHashInput"
              type="text"
              value={structHash ?? ''}
              onChange={(e) => setStructHash(e.target.value as Hash)}
              placeholder="STEP 5를 먼저 완료해주세요"
              className="font-mono text-xs bg-yellow-500/5"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="batchNonceInput">배치 Nonce (STEP 5에서 입력)</Label>
            <Input
              id="batchNonceInput"
              type="text"
              value={batchNonce?.toString() ?? ''}
              onChange={(e) => handleBatchNonceChange(e.target.value)}
              placeholder="0"
              className="font-mono"
            />
          </div>
        </div>

        {/* 다이제스트 계산 버튼 */}
        <Button
          onClick={handleCalculateDigest}
          disabled={isCalculating || !domainSeparator || !structHash}
          className="w-full"
        >
          {isCalculating ? '계산 중...' : '최종 다이제스트 계산'}
        </Button>

        {/* 계산 결과 */}
        {finalDigest && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="finalDigest">최종 다이제스트 (EIP-191)</Label>
            <Input
              id="finalDigest"
              type="text"
              value={finalDigest}
              readOnly
              className="font-mono text-xs bg-green-500/10"
            />
          </div>
        )}

        {/* 서명 생성 버튼 */}
        {finalDigest && (
          <Button
            onClick={handleGenerateSignature}
            disabled={isSigning}
            className="w-full"
          >
            {isSigning ? '서명 중...' : 'Executor 서명 생성'}
          </Button>
        )}

        {/* 서명 결과 */}
        {executorSignature && signatureComponents && (
          <Card className="bg-purple-500/10 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-base">ECDSA 서명 구성요소</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-xs">
                <div>
                  <p className="font-semibold opacity-70">r:</p>
                  <div className="bg-muted rounded-lg p-3 font-mono break-all">
                    {signatureComponents.r}
                  </div>
                </div>
                <div>
                  <p className="font-semibold opacity-70">s:</p>
                  <div className="bg-muted rounded-lg p-3 font-mono break-all">
                    {signatureComponents.s}
                  </div>
                </div>
                <div>
                  <p className="font-semibold opacity-70">v:</p>
                  <div className="bg-muted rounded-lg p-3 font-mono">
                    {signatureComponents.v}
                  </div>
                </div>
              </div>

              <div className="border-t pt-3 flex flex-col gap-1.5">
                <Label htmlFor="executorSignature">최종 서명 (65바이트)</Label>
                <Input
                  id="executorSignature"
                  type="text"
                  value={executorSignature}
                  readOnly
                  className="font-mono text-xs"
                />
              </div>

              <div className="mt-3">
                <p className="font-semibold opacity-70 mb-1 text-xs">서명자 주소:</p>
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {mainVotingExecutorAddress ?? '-'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 계산 과정 설명 */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="font-semibold text-green-700">
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
                      EIP-191 형식으로 인코딩:
                      <code className="block ml-4 mt-1 p-2 bg-background rounded font-mono text-xs break-all">
                        encodePacked(&quot;\x19\x01&quot;, domainSeparator, structHash)
                      </code>
                    </li>
                    <li>
                      최종 해시:
                      <code className="block ml-4 mt-1 p-2 bg-background rounded font-mono text-xs break-all">
                        keccak256(packed)
                      </code>
                    </li>
                    <li>
                      Executor 서명:
                      <code className="block ml-4 mt-1 p-2 bg-background rounded font-mono text-xs break-all">
                        ECDSA 서명 알고리즘으로 최종 다이제스트에 서명
                      </code>
                    </li>
                  </ol>
                </div>

                {finalDigest && (
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-semibold mb-2">계산 결과:</h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <p className="font-semibold">Domain Separator:</p>
                        <p className="font-mono bg-background p-2 rounded break-all">
                          {domainSeparator}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Struct Hash:</p>
                        <p className="font-mono bg-background p-2 rounded break-all">
                          {structHash}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Final Digest:</p>
                        <p className="font-mono bg-background p-2 rounded break-all">
                          {finalDigest}
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
