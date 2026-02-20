'use client';

import { useEffect, useState } from 'react';
import { hexToSignature, type Hash } from 'viem';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import { DigestService } from '@/domain/services/DigestService';
import { toast } from 'sonner';
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

export function BoostStep6Digest() {
  const selectedChainId = useAppStore((s) => s.selectedChainId);
  const contractAddress = useAppStore((s) => s.contractAddress);
  const mainVotingExecutorAddress = useAppStore((s) => s.mainVotingExecutorAddress);
  const contractExecutorAddress = useAppStore((s) => s.contractExecutorAddress);

  const setBoostingBatchNonce = useAppStore((s) => s.setBoostingBatchNonce);
  const setBoostingExecutorSig = useAppStore((s) => s.setBoostingExecutorSig);
  const setBoostingDigest = useAppStore((s) => s.setBoostingDigest);

  const domainName = useAppStore((s) => s.domainName);
  const domainVersion = useAppStore((s) => s.domainVersion);
  const domainChainId = useAppStore((s) => s.domainChainId);
  const domainVerifyingContract = useAppStore((s) => s.domainVerifyingContract);
  const boostingBatchNonce = useAppStore((s) => s.boostingBatchNonce);

  const executorAddress = mainVotingExecutorAddress ?? contractExecutorAddress;

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

  useEffect(() => {
    if (!domainVerifyingContract) return;

    import('@/domain/value-objects/EIP712Domain').then(({ EIP712Domain }) => {
      const domain = new EIP712Domain(
        domainName,
        domainVersion,
        domainChainId,
        domainVerifyingContract
      );
      setDomainSeparator(domain.calculateDomainSeparator());
    });
  }, [domainName, domainVersion, domainChainId, domainVerifyingContract]);

  useEffect(() => {
    setBatchNonce(boostingBatchNonce);
    if (boostingBatchNonce !== null && boostingBatchNonce !== undefined) {
      setStructHash(DigestService.calculateStructHash(boostingBatchNonce));
    }
  }, [boostingBatchNonce]);

  const handleBatchNonceChange = (value: string) => {
    if (value === '') {
      setBatchNonce(null);
      setStructHash(null);
      setBoostingBatchNonce(0n);
      return;
    }

    if (!/^\d+$/.test(value)) return;

    const nextNonce = BigInt(value);
    setBatchNonce(nextNonce);
    setBoostingBatchNonce(nextNonce);
    setStructHash(DigestService.calculateStructHash(nextNonce));
  };

  const handleCalculateDigest = () => {
    try {
      setIsCalculating(true);

      if (!domainSeparator || !structHash) {
        toast.error('Step 4와 5를 먼저 완료해주세요');
        return;
      }

      const digest = DigestService.calculateDigest(domainSeparator, structHash);
      setFinalDigest(digest);
      setBoostingDigest(digest);

      toast.success('최종 다이제스트 계산 완료');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`계산 실패: ${message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleGenerateSignature = async () => {
    try {
      setIsSigning(true);

      if (!finalDigest) {
        toast.error('먼저 최종 다이제스트를 계산해주세요');
        return;
      }

      if (!executorAddress) {
        toast.error('Executor 지갑이 설정되지 않았습니다. Step 1에서 계정을 할당해주세요.');
        return;
      }

      if (!contractAddress) {
        toast.error('컨트랙트 주소가 설정되지 않았습니다.');
        return;
      }

      if (batchNonce === null) {
        toast.error('Batch Nonce가 설정되지 않았습니다.');
        return;
      }

      const domain = {
        name: 'Boosting',
        version: '1',
        chainId: selectedChainId,
        verifyingContract: contractAddress,
      };

      const types = {
        Batch: [{ name: 'batchNonce', type: 'uint256' }],
      };

      const message = { batchNonce };

      const walletClient = getInjectedWalletClient(selectedChainId);
      await ensureCorrectChain(walletClient, selectedChainId);
      const activeAddress = await ensureActiveAddress(executorAddress);

      const signature = await walletClient.signTypedData({
        account: activeAddress,
        domain,
        types,
        primaryType: 'Batch',
        message,
      });

      setExecutorSignature(signature as Hash);
      setBoostingExecutorSig(signature as Hash);

      const sig = hexToSignature(signature as Hash);
      setSignatureComponents({
        r: sig.r,
        s: sig.s,
        v: typeof sig.v === 'bigint' ? Number(sig.v) : (sig.v ?? 0),
      });

      toast.success('Executor 서명 생성 완료');
    } catch (error) {
      if (error instanceof WalletNotConnectedError) {
        toast.info('지갑을 먼저 연결해주세요 (Step 0)');
        return;
      }

      if (isUserRejectionError(error)) {
        toast.info('서명이 취소되었습니다');
        return;
      }

      logError('BoostStep6Digest.handleGenerateSignature', error);
      toast.error(getBlockchainErrorMessage(error));
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <StepCard
      stepNumber={6}
      title="최종 다이제스트 및 Executor 서명"
      description="Boosting 제출용 배치 다이제스트를 계산하고 Executor 서명을 생성합니다"
      badgeColor="default"
    >
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="boostDigestDomainSeparator">도메인 구분자 (STEP 4)</Label>
            <Input
              id="boostDigestDomainSeparator"
              type="text"
              value={domainSeparator ?? ''}
              readOnly
              className="font-mono text-xs bg-primary/5"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="boostDigestStructHash">구조체 해시 (STEP 5)</Label>
            <Input
              id="boostDigestStructHash"
              type="text"
              value={structHash ?? ''}
              readOnly
              className="font-mono text-xs bg-yellow-500/5"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="boostDigestBatchNonce">배치 Nonce</Label>
            <Input
              id="boostDigestBatchNonce"
              type="text"
              value={batchNonce?.toString() ?? ''}
              onChange={(e) => handleBatchNonceChange(e.target.value)}
              placeholder="0"
              className="font-mono"
            />
          </div>
        </div>

        <Button
          onClick={handleCalculateDigest}
          disabled={isCalculating || !domainSeparator || !structHash}
          className="w-full"
        >
          {isCalculating ? '계산 중...' : '최종 다이제스트 계산'}
        </Button>

        {finalDigest && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="boostFinalDigest">최종 다이제스트</Label>
            <Input
              id="boostFinalDigest"
              type="text"
              value={finalDigest}
              readOnly
              className="font-mono text-xs bg-green-500/10"
            />
          </div>
        )}

        {finalDigest && (
          <Button onClick={handleGenerateSignature} disabled={isSigning} className="w-full">
            {isSigning ? '서명 중...' : 'Executor 서명 생성'}
          </Button>
        )}

        {executorSignature && signatureComponents && (
          <Card className="bg-purple-500/10 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-base">ECDSA 서명 구성요소</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs font-mono">
              <div>
                <p className="font-semibold opacity-70">r:</p>
                <p className="bg-muted rounded p-2 break-all">{signatureComponents.r}</p>
              </div>
              <div>
                <p className="font-semibold opacity-70">s:</p>
                <p className="bg-muted rounded p-2 break-all">{signatureComponents.s}</p>
              </div>
              <div>
                <p className="font-semibold opacity-70">v:</p>
                <p className="bg-muted rounded p-2">{signatureComponents.v}</p>
              </div>
              <div>
                <p className="font-semibold opacity-70">signature:</p>
                <p className="bg-muted rounded p-2 break-all">{executorSignature}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StepCard>
  );
}
