/**
 * MainVoting Step 4: EIP-712 Domain 설정
 *
 * EIP-712 Domain을 입력받아 Domain Separator를 계산합니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import { EIP712Domain } from '@/domain/value-objects/EIP712Domain';
import { toast } from 'sonner';
import type { Address, Hash } from '@/domain/types';

/**
 * Step 4: EIP-712 Domain 설정 컴포넌트
 */
export function Step4Domain() {
  // -------------------------------------------------------------------------
  // Store State
  // -------------------------------------------------------------------------
  const selectedChainId = useAppStore((s) => s.selectedChainId);
  const contractAddress = useAppStore((s) => s.contractAddress);
  const setDomainData = useAppStore((s) => s.setDomainData);

  // -------------------------------------------------------------------------
  // Local State
  // -------------------------------------------------------------------------
  const [name, setName] = useState('MainVoting');
  const [version, setVersion] = useState('1');
  const [chainId, setChainId] = useState('5611');
  const [verifyingContract, setVerifyingContract] = useState('');
  const [domainSeparator, setDomainSeparator] = useState<Hash | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  // 컨트랙트 주소 변경 시 자동 입력
  useEffect(() => {
    if (contractAddress) {
      setVerifyingContract(contractAddress);
    }
  }, [contractAddress]);

  useEffect(() => {
    setChainId(String(selectedChainId));
  }, [selectedChainId]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /**
   * Domain Separator 계산
   */
  const handleCalculate = () => {
    try {
      setIsCalculating(true);

      // 유효성 검증
      if (!name || !version || !chainId || !verifyingContract) {
        toast.error('모든 필드를 입력해주세요!');
        return;
      }

      // EIP712Domain 생성
      const domain = new EIP712Domain(
        name,
        version,
        BigInt(chainId),
        verifyingContract as Address
      );

      // Domain Separator 계산
      const separator = domain.calculateDomainSeparator();
      setDomainSeparator(separator);

      // Store에 저장
      setDomainData({
        name,
        version,
        chainId: BigInt(chainId),
        verifyingContract: verifyingContract as Address,
      });

      toast.success('Domain Separator 계산 완료!');
    } catch (error) {
      console.error('Domain Separator calculation failed:', error);
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
      stepNumber={4}
      title="도메인 구분자 계산"
      description="EIP-712 도메인을 식별하는 고유 해시를 계산합니다"
      badgeColor="default"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 도메인 이름 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="domainName">도메인 이름</Label>
            <Input
              id="domainName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="MainVoting"
            />
          </div>

          {/* 도메인 버전 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="domainVersion">도메인 버전</Label>
            <Input
              id="domainVersion"
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1"
            />
          </div>

          {/* 체인 ID */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="chainId">체인 ID</Label>
            <Input
              id="chainId"
              type="number"
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
              placeholder="5611"
            />
          </div>

          {/* 검증 컨트랙트 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="verifyingContract">검증 컨트랙트</Label>
            <Input
              id="verifyingContract"
              type="text"
              value={verifyingContract}
              onChange={(e) => setVerifyingContract(e.target.value)}
              placeholder="0x..."
              className="font-mono text-xs"
            />
          </div>
        </div>

        {/* 계산 버튼 */}
        <Button
          onClick={handleCalculate}
          disabled={isCalculating || !name || !version || !chainId || !verifyingContract}
          className="w-full"
        >
          {isCalculating ? '계산 중...' : 'Domain Separator 계산'}
        </Button>

        {/* 계산 결과 */}
        {domainSeparator && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="domainSeparator">
                도메인 구분자 (계산 결과)
              </Label>
              <Input
                id="domainSeparator"
                type="text"
                value={domainSeparator}
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
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="font-semibold text-primary">
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
                      EIP712Domain TypeHash 계산:
                      <code className="block ml-4 mt-1 p-2 bg-background rounded font-mono text-xs break-all">
                        keccak256(&quot;EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)&quot;)
                      </code>
                    </li>
                    <li>
                      Domain 데이터 인코딩:
                      <code className="block ml-4 mt-1 p-2 bg-background rounded font-mono text-xs break-all">
                        abi.encode(typeHash, keccak256(name), keccak256(version), chainId, verifyingContract)
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

                {domainSeparator && (
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-semibold mb-2">계산 결과:</h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <p className="font-semibold">Name:</p>
                        <p className="font-mono bg-background p-2 rounded break-all">
                          {name}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Version:</p>
                        <p className="font-mono bg-background p-2 rounded break-all">
                          {version}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Chain ID:</p>
                        <p className="font-mono bg-background p-2 rounded break-all">
                          {chainId}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Verifying Contract:</p>
                        <p className="font-mono bg-background p-2 rounded break-all">
                          {verifyingContract}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Domain Separator:</p>
                        <p className="font-mono bg-background p-2 rounded break-all">
                          {domainSeparator}
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
