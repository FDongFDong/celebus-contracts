'use client';

import { useEffect, useState } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import { EIP712Domain } from '@/domain/value-objects/EIP712Domain';
import { toast } from 'sonner';
import type { Address, Hash } from '@/domain/types';

export function BoostStep4Domain() {
  const selectedChainId = useAppStore((s) => s.selectedChainId);
  const contractAddress = useAppStore((s) => s.contractAddress);
  const setDomainData = useAppStore((s) => s.setDomainData);

  const [name, setName] = useState('Boosting');
  const [version, setVersion] = useState('1');
  const [chainId, setChainId] = useState(String(selectedChainId));
  const [verifyingContract, setVerifyingContract] = useState('');
  const [domainSeparator, setDomainSeparator] = useState<Hash | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (contractAddress) {
      setVerifyingContract(contractAddress);
    }
  }, [contractAddress]);

  useEffect(() => {
    setChainId(String(selectedChainId));
  }, [selectedChainId]);

  const handleCalculate = () => {
    try {
      setIsCalculating(true);

      if (!name || !version || !chainId || !verifyingContract) {
        toast.error('모든 필드를 입력해주세요');
        return;
      }

      const domain = new EIP712Domain(
        name,
        version,
        BigInt(chainId),
        verifyingContract as Address
      );

      const separator = domain.calculateDomainSeparator();
      setDomainSeparator(separator);

      setDomainData({
        name,
        version,
        chainId: BigInt(chainId),
        verifyingContract: verifyingContract as Address,
      });

      toast.success('Domain Separator 계산 완료');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`계산 실패: ${message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <StepCard
      stepNumber={4}
      title="도메인 구분자 계산"
      description="Boosting EIP-712 도메인을 계산합니다"
      badgeColor="default"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="boostDomainName">도메인 이름</Label>
            <Input
              id="boostDomainName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Boosting"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="boostDomainVersion">도메인 버전</Label>
            <Input
              id="boostDomainVersion"
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="boostDomainChainId">체인 ID</Label>
            <Input
              id="boostDomainChainId"
              type="number"
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
              placeholder="5611"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="boostDomainContract">검증 컨트랙트</Label>
            <Input
              id="boostDomainContract"
              type="text"
              value={verifyingContract}
              onChange={(e) => setVerifyingContract(e.target.value)}
              placeholder="0x..."
              className="font-mono text-xs"
            />
          </div>
        </div>

        <Button
          onClick={handleCalculate}
          disabled={isCalculating || !name || !version || !chainId || !verifyingContract}
          className="w-full"
        >
          {isCalculating ? '계산 중...' : 'Domain Separator 계산'}
        </Button>

        {domainSeparator && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="boostDomainSeparator">도메인 구분자</Label>
              <Input
                id="boostDomainSeparator"
                type="text"
                value={domainSeparator}
                readOnly
                className="font-mono text-xs bg-green-500/10"
              />
              <p className="text-xs text-green-700 mt-1">
                이 값이 STEP 6에서 자동으로 사용됩니다
              </p>
            </div>
          </div>
        )}

        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="font-semibold text-primary">계산 과정 보기</span>
              <span>{showExplanation ? '▲' : '▼'}</span>
            </button>

            {showExplanation && (
              <div className="mt-4 space-y-3 text-sm">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold mb-2">계산 방법:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-xs">
                    <li>keccak256(&quot;EIP712Domain(...)&quot;) 타입해시 계산</li>
                    <li>domain 필드를 abi.encode</li>
                    <li>encoded 결과를 keccak256</li>
                  </ol>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StepCard>
  );
}
