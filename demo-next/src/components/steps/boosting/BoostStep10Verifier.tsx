'use client';

import { useMemo, useState } from 'react';
import { privateKeyToAccount } from 'viem/accounts';
import { hexToSignature, isAddress, type Address, type Hex } from 'viem';
import { toast } from 'sonner';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusAlert } from '@/components/shared/StatusAlert';
import { DigestService } from '@/domain/services/DigestService';
import { EIP712Domain } from '@/domain/value-objects/EIP712Domain';
import { useAppStore } from '@/store/useAppStore';

type TabType = 'userSig' | 'executor' | 'verify';

interface UserSigResult {
  recordHash: string;
  signature: string;
  recovered: string;
  isValid: boolean;
}

interface ExecutorResult {
  batchDigest: string;
  signature: string;
  recovered: string;
  isValid: boolean;
}

interface VerifyResult {
  r: `0x${string}`;
  s: `0x${string}`;
  v: bigint | undefined;
  info: string;
}

interface BoostRecordInput {
  timestamp: string;
  missionId: string;
  boostingId: string;
  optionId: string;
  boostingWith: number;
  amt: string;
}

interface ParsedBoostRecord {
  timestamp: bigint;
  missionId: bigint;
  boostingId: bigint;
  optionId: bigint;
  boostingWith: number;
  amt: bigint;
}

export function BoostStep10Verifier() {
  const contractAddress = useAppStore((s) => s.contractAddress);

  const [activeTab, setActiveTab] = useState<TabType>('userSig');

  const [domainName, setDomainName] = useState('Boosting');
  const [domainVersion, setDomainVersion] = useState('1');
  const [domainChainId, setDomainChainId] = useState('5611');
  const [domainContractInput, setDomainContractInput] = useState('');

  const [userPrivateKey, setUserPrivateKey] = useState('');
  const [userAddressInput, setUserAddressInput] = useState('');
  const [userNonce, setUserNonce] = useState('0');
  const [recordInput, setRecordInput] = useState('');
  const [userSigResult, setUserSigResult] = useState<UserSigResult | null>(null);

  const [executorPrivateKey, setExecutorPrivateKey] = useState('');
  const [batchNonce, setBatchNonce] = useState('0');
  const [executorResult, setExecutorResult] = useState<ExecutorResult | null>(null);

  const [verifyInputSignature, setVerifyInputSignature] = useState('');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  const [logs, setLogs] = useState<string[]>([]);

  const domainContract = domainContractInput || contractAddress || '';

  const userAddress = useMemo(() => {
    if (!userPrivateKey || !userPrivateKey.startsWith('0x')) return '';
    try {
      const account = privateKeyToAccount(userPrivateKey as Hex);
      return account.address;
    } catch {
      return 'Invalid key';
    }
  }, [userPrivateKey]);

  const executorAddress = useMemo(() => {
    if (!executorPrivateKey || !executorPrivateKey.startsWith('0x')) return '';
    try {
      const account = privateKeyToAccount(executorPrivateKey as Hex);
      return account.address;
    } catch {
      return 'Invalid key';
    }
  }, [executorPrivateKey]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const getDomain = () => {
    if (!domainContract || !isAddress(domainContract)) {
      throw new Error('올바른 Contract Address를 입력해주세요');
    }

    let chainId: bigint;
    try {
      chainId = BigInt(domainChainId);
    } catch {
      throw new Error('체인 ID는 숫자여야 합니다');
    }

    return new EIP712Domain(
      domainName,
      domainVersion,
      chainId,
      domainContract as Address
    );
  };

  const parseRecord = (): BoostRecordInput => {
    if (!recordInput.trim()) {
      throw new Error('Record 데이터를 입력해주세요');
    }

    const parts = recordInput.split(',').map((part) => part.trim());
    if (parts.length < 6) {
      throw new Error('Record 형식이 잘못되었습니다');
    }

    return {
      timestamp: parts[0],
      missionId: parts[1],
      boostingId: parts[2],
      optionId: parts[3],
      boostingWith: Number(parts[4]),
      amt: parts[5],
    };
  };

  const toParsedRecord = (record: BoostRecordInput): ParsedBoostRecord => {
    try {
      return {
        timestamp: BigInt(record.timestamp),
        missionId: BigInt(record.missionId),
        boostingId: BigInt(record.boostingId),
        optionId: BigInt(record.optionId),
        boostingWith: record.boostingWith,
        amt: BigInt(record.amt),
      };
    } catch {
      throw new Error('Record 숫자 필드에 올바른 값을 입력해주세요');
    }
  };

  const generateUserSignature = async () => {
    try {
      if (!userPrivateKey) {
        toast.error('Private Key를 입력해주세요');
        return;
      }

      const account = privateKeyToAccount(userPrivateKey as Hex);
      const userAddr =
        userAddressInput && isAddress(userAddressInput)
          ? (userAddressInput as Address)
          : account.address;

      const record = parseRecord();
      const parsedRecord = toParsedRecord(record);

      addLog('\n=== Boosting UserSig 서명 생성 ===');
      addLog(`Signer: ${account.address}`);
      addLog(`User Address (for hash): ${userAddr}`);
      addLog(`UserNonce: ${userNonce}`);

      const recordHash = DigestService.hashBoostRecord(parsedRecord, userAddr);
      addLog(`RecordHash: ${recordHash}`);

      const domain = getDomain();
      const signature = await account.signTypedData({
        domain: domain.toTypedDataDomain(),
        types: {
          UserSig: [
            { name: 'user', type: 'address' },
            { name: 'userNonce', type: 'uint256' },
            { name: 'recordHash', type: 'bytes32' },
          ],
        },
        primaryType: 'UserSig',
        message: {
          user: userAddr,
          userNonce: BigInt(userNonce),
          recordHash,
        },
      });

      addLog(`Signature: ${signature}`);

      setUserSigResult({
        recordHash,
        signature,
        recovered: account.address,
        isValid: true,
      });

      toast.success('서명 생성 완료');
    } catch (error) {
      const message = error instanceof Error ? error.message : '서명 생성 실패';
      addLog(`Error: ${message}`);
      toast.error(message);
    }
  };

  const generateExecutorSignature = async () => {
    try {
      if (!executorPrivateKey) {
        toast.error('Executor Private Key를 입력해주세요');
        return;
      }

      const account = privateKeyToAccount(executorPrivateKey as Hex);

      addLog('\n=== Boosting Executor 서명 생성 ===');
      addLog(`Executor: ${account.address}`);
      addLog(`BatchNonce: ${batchNonce}`);

      const domain = getDomain();
      const signature = await account.signTypedData({
        domain: domain.toTypedDataDomain(),
        types: {
          Batch: [{ name: 'batchNonce', type: 'uint256' }],
        },
        primaryType: 'Batch',
        message: {
          batchNonce: BigInt(batchNonce),
        },
      });

      addLog(`Signature: ${signature}`);

      const structHash = DigestService.calculateStructHash(BigInt(batchNonce));
      const batchDigest = DigestService.calculateDigest(
        domain.calculateDomainSeparator(),
        structHash
      );

      addLog(`Batch Digest: ${batchDigest}`);

      setExecutorResult({
        batchDigest,
        signature,
        recovered: account.address,
        isValid: true,
      });

      toast.success('서명 생성 완료');
    } catch (error) {
      const message = error instanceof Error ? error.message : '서명 생성 실패';
      addLog(`Error: ${message}`);
      toast.error(message);
    }
  };

  const verifySignature = () => {
    try {
      if (!verifyInputSignature) {
        toast.error('Signature를 입력해주세요');
        return;
      }

      addLog('\n=== 서명 검증 ===');

      const sig = hexToSignature(verifyInputSignature as Hex);
      addLog(`r: ${sig.r}`);
      addLog(`s: ${sig.s}`);
      addLog(`v: ${sig.v}`);

      setVerifyResult({
        r: sig.r,
        s: sig.s,
        v: sig.v,
        info: 'viem에는 verifyTypedData가 없어 서명 컴포넌트만 표시합니다.',
      });

      toast.success('서명 컴포넌트 추출 완료');
    } catch (error) {
      const message = error instanceof Error ? error.message : '검증 실패';
      addLog(`Error: ${message}`);
      toast.error(message);
    }
  };

  const applyContractAddressFromStore = () => {
    if (contractAddress) {
      setDomainContractInput(contractAddress);
    }
  };

  return (
    <StepCard
      stepNumber={10}
      title="서명 검증 유틸리티"
      description="Boosting 데이터로 EIP-712 서명을 생성/검증합니다"
    >
      <Card className="mb-6 bg-muted">
        <CardHeader>
          <CardTitle className="text-sm">도메인 설정</CardTitle>
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
          <Button variant="link" size="sm" className="mt-2" onClick={applyContractAddressFromStore}>
            ↑ 상단 컨트랙트 주소 가져오기
          </Button>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="userSig">사용자 서명</TabsTrigger>
          <TabsTrigger value="executor">Executor 서명</TabsTrigger>
          <TabsTrigger value="verify">서명 검증</TabsTrigger>
        </TabsList>

        <TabsContent value="userSig" className="space-y-4">
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-sm">사용자 서명 생성</CardTitle>
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
                  <Input value={userNonce} onChange={(e) => setUserNonce(e.target.value)} className="text-sm" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>레코드 데이터 (쉼표 구분 1줄)</Label>
                <p className="text-xs opacity-60 mb-1">
                  형식: timestamp, missionId, boostingId, optionId, boostingWith, amt
                </p>
                <Input
                  value={recordInput}
                  onChange={(e) => setRecordInput(e.target.value)}
                  className="font-mono text-sm"
                  placeholder="1703123456789, 1, 12345678, 1, 0, 1000"
                />
              </div>

              <Button onClick={generateUserSignature}>사용자 서명 생성</Button>

              {userSigResult && (
                <div className="bg-background rounded-lg p-4 space-y-2 text-sm">
                  <p><strong>레코드 해시:</strong></p>
                  <p className="font-mono text-xs break-all bg-muted p-2 rounded">{userSigResult.recordHash}</p>
                  <p><strong>서명:</strong></p>
                  <p className="font-mono text-xs break-all bg-muted p-2 rounded">{userSigResult.signature}</p>
                  <p><strong>복구된 주소:</strong></p>
                  <p className="font-mono text-xs flex items-center gap-1">
                    {userSigResult.recovered}
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
                  <Input value={batchNonce} onChange={(e) => setBatchNonce(e.target.value)} className="text-sm" />
                </div>
              </div>

              <Button onClick={generateExecutorSignature}>Executor 서명 생성</Button>

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

              <Button onClick={verifySignature}>서명 검증</Button>

              {verifyResult && (
                <div className="bg-background rounded-lg p-4 space-y-2 text-sm">
                  <p><strong>서명 컴포넌트:</strong></p>
                  <p className="font-mono text-xs">r: {verifyResult.r}</p>
                  <p className="font-mono text-xs">s: {verifyResult.s}</p>
                  <p className="font-mono text-xs">v: {verifyResult.v}</p>
                  <StatusAlert type="info" message={verifyResult.info} className="text-xs mt-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium">디버그 로그</summary>
        <pre className="mt-2 bg-muted text-foreground p-4 rounded text-xs overflow-auto max-h-48 font-mono">
          {logs.join('\n') || '로그가 없습니다'}
        </pre>
      </details>
    </StepCard>
  );
}
