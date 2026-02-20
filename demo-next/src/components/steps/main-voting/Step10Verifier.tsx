'use client';

import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { StatusAlert } from '@/components/shared/StatusAlert';
import { useStep10Verifier } from './step10/useStep10Verifier';
import type { TabType } from './step10/types';

export function Step10Verifier() {
  const {
    activeTab,
    setActiveTab,
    domainName,
    setDomainName,
    domainVersion,
    setDomainVersion,
    domainChainId,
    setDomainChainId,
    domainContractInput,
    setDomainContractInput,
    contractAddress,
    userPrivateKey,
    setUserPrivateKey,
    userAddress,
    userAddressInput,
    setUserAddressInput,
    userNonce,
    setUserNonce,
    recordsInput,
    setRecordsInput,
    userBatchResult,
    executorPrivateKey,
    setExecutorPrivateKey,
    executorAddress,
    batchNonce,
    setBatchNonce,
    executorResult,
    verifyInputSignature,
    setVerifyInputSignature,
    verifyResult,
    logs,
    generateUserBatchSignature,
    generateExecutorSignature,
    verifySignature,
    applyContractAddressFromStore,
  } = useStep10Verifier();

  return (
    <StepCard
      stepNumber={10}
      title="서명 검증 유틸리티"
      description="직접 데이터를 입력하여 EIP-712 서명을 생성하고 검증합니다"
    >
      <Card className="mb-6 bg-muted">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            도메인 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">이름</Label>
              <Input value={domainName} onChange={(e) => setDomainName(e.target.value)} className="text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">버전</Label>
              <Input value={domainVersion} onChange={(e) => setDomainVersion(e.target.value)} className="text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">체인 ID</Label>
              <Input value={domainChainId} onChange={(e) => setDomainChainId(e.target.value)} className="text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">컨트랙트 주소</Label>
              <Input
                value={domainContractInput || contractAddress || ''}
                onChange={(e) => setDomainContractInput(e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
              />
            </div>
          </div>
          <Button
            variant="link"
            size="sm"
            className="mt-2"
            onClick={applyContractAddressFromStore}
          >
            ↑ 상단 컨트랙트 주소 가져오기
          </Button>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="userBatch">사용자 배치 서명</TabsTrigger>
          <TabsTrigger value="executor">Executor 서명</TabsTrigger>
          <TabsTrigger value="verify">서명 검증</TabsTrigger>
        </TabsList>

        <TabsContent value="userBatch" className="space-y-4">
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-sm">사용자 배치 서명 생성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Private Key (서명용)</Label>
                  <Input
                    type="password"
                    value={userPrivateKey}
                    onChange={(e) => setUserPrivateKey(e.target.value)}
                    placeholder="0x..."
                    className="font-mono text-sm"
                    autoComplete="off"
                  />
                  <p className="text-xs opacity-60 mt-1">주소: {userAddress || '-'}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>사용자 주소 (해시용)</Label>
                  <Input
                    value={userAddressInput}
                    onChange={(e) => setUserAddressInput(e.target.value)}
                    placeholder="0x... (비우면 Private Key에서 추출)"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>사용자 Nonce</Label>
                  <Input
                    value={userNonce}
                    onChange={(e) => setUserNonce(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>레코드 데이터 (한 줄 당 하나, 쉼표 구분)</Label>
                <p className="text-xs opacity-60 mb-1">형식: timestamp, missionId, votingId, optionId, voteType, votingAmt</p>
                <Textarea
                  value={recordsInput}
                  onChange={(e) => setRecordsInput(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                  placeholder="1703123456789, 1, 12345678, 1, 1, 100&#10;1703123456790, 1, 12345678, 2, 0, 200"
                />
              </div>

              <Button onClick={generateUserBatchSignature}>
                사용자 배치 서명 생성
              </Button>

              {userBatchResult && (
                <div className="bg-background rounded-lg p-4 space-y-2 text-sm">
                  <p><strong>레코드 해시:</strong></p>
                  <p className="font-mono text-xs break-all bg-muted p-2 rounded">{userBatchResult.recordsHash}</p>
                  <p><strong>서명:</strong></p>
                  <p className="font-mono text-xs break-all bg-muted p-2 rounded">{userBatchResult.signature}</p>
                  <p><strong>복구된 주소:</strong></p>
                  <p className="font-mono text-xs flex items-center gap-1">
                    {userBatchResult.recovered}
                    <Badge variant="default" className="ml-2">VALID</Badge>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executor" className="space-y-4">
          <Card className="bg-red-500/10 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-sm">Executor (배치) 서명 생성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Executor Private Key</Label>
                  <Input
                    type="password"
                    value={executorPrivateKey}
                    onChange={(e) => setExecutorPrivateKey(e.target.value)}
                    placeholder="0x..."
                    className="font-mono text-sm"
                    autoComplete="off"
                  />
                  <p className="text-xs opacity-60 mt-1">Executor 주소: {executorAddress || '-'}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>배치 Nonce</Label>
                  <Input
                    value={batchNonce}
                    onChange={(e) => setBatchNonce(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <Button onClick={generateExecutorSignature}>
                Executor 서명 생성
              </Button>

              {executorResult && (
                <div className="bg-background rounded-lg p-4 space-y-2 text-sm">
                  <p><strong>배치 다이제스트:</strong></p>
                  <p className="font-mono text-xs break-all bg-muted p-2 rounded">{executorResult.batchDigest}</p>
                  <p><strong>서명:</strong></p>
                  <p className="font-mono text-xs break-all bg-muted p-2 rounded">{executorResult.signature}</p>
                  <p><strong>복구된 주소:</strong></p>
                  <p className="font-mono text-xs flex items-center gap-1">
                    {executorResult.recovered}
                    <Badge variant="default" className="ml-2">VALID</Badge>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verify" className="space-y-4">
          <Card className="bg-green-500/10 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-sm">서명 검증 (주소 복구)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label>서명</Label>
                <Input
                  value={verifyInputSignature}
                  onChange={(e) => setVerifyInputSignature(e.target.value)}
                  placeholder="0x..."
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={verifySignature}>
                서명 검증
              </Button>

              {verifyResult && (
                <div className="bg-background rounded-lg p-4 space-y-2 text-sm">
                  <p><strong>서명 컴포넌트:</strong></p>
                  <p className="font-mono text-xs">r: {verifyResult.r}</p>
                  <p className="font-mono text-xs">s: {verifyResult.s}</p>
                  <p className="font-mono text-xs">v: {verifyResult.v}</p>
                  <StatusAlert
                    type="info"
                    message={verifyResult.info}
                    className="text-xs mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          디버그 로그
        </summary>
        <pre className="mt-2 bg-muted text-foreground p-4 rounded text-xs overflow-auto max-h-48 font-mono">
          {logs.join('\n') || '로그가 없습니다'}
        </pre>
      </details>
    </StepCard>
  );
}
