/**
 * NFT Step 4: 승인 상태 확인
 *
 * isApprovedForAll, getApproved 조회
 */

'use client';

import { useState, useId } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type Address, zeroAddress } from 'viem';
import { vibeNftAbi } from '@/infrastructure/contracts';
import { useSelectedChain } from '@/hooks/useSelectedChain';
import { formatAddress } from '@/lib/format';

type StatusType = 'success' | 'error' | 'info';

export function NFTStep4CheckApproval() {
  const ownerInputId = useId();
  const operatorInputId = useId();
  const tokenIdInputId = useId();

  const { nftContractAddress, nftName, nftSymbol } = useAppStore();

  // 선택된 체인 정보
  const { publicClient } = useSelectedChain();

  // isApprovedForAll
  const [ownerInput, setOwnerInput] = useState('');
  const [operatorInput, setOperatorInput] = useState('');
  const [isApprovedForAllResult, setIsApprovedForAllResult] = useState<boolean | null>(null);
  const [approvalForAllStatus, setApprovalForAllStatus] = useState<{
    type: StatusType;
    message: string;
  } | null>(null);
  const [isCheckingApprovalForAll, setIsCheckingApprovalForAll] = useState(false);

  // getApproved
  const [tokenIdInput, setTokenIdInput] = useState('');
  const [approvedAddress, setApprovedAddress] = useState<Address | null>(null);
  const [tokenOwner, setTokenOwner] = useState<Address | null>(null);
  const [approvedStatus, setApprovedStatus] = useState<{
    type: StatusType;
    message: string;
  } | null>(null);
  const [isCheckingApproved, setIsCheckingApproved] = useState(false);

  const formatApproval = (address: Address | null) => {
    if (address === zeroAddress) return '없음 (0x0)';
    return formatAddress(address);
  };

  const handleCheckIsApprovedForAll = async () => {
    const owner = ownerInput.trim();
    const operator = operatorInput.trim();

    if (!owner || !operator) {
      setApprovalForAllStatus({ type: 'error', message: 'Owner와 Operator 주소를 모두 입력해주세요' });
      return;
    }

    if (!nftContractAddress) {
      setApprovalForAllStatus({ type: 'error', message: '먼저 컨트랙트를 등록해주세요' });
      return;
    }

    setIsCheckingApprovalForAll(true);
    setApprovalForAllStatus({ type: 'info', message: 'isApprovedForAll 조회 중...' });

    try {
      
      const isApproved = await publicClient.readContract({
        address: nftContractAddress,
        abi: vibeNftAbi,
        functionName: 'isApprovedForAll',
        args: [owner as Address, operator as Address],
      });

      setIsApprovedForAllResult(isApproved as boolean);
      setApprovalForAllStatus({
        type: 'success',
        message: `조회 완료: ${isApproved ? '✅ 승인됨' : '❌ 미승인'}`,
      });
    } catch (error) {
      console.error('isApprovedForAll failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setApprovalForAllStatus({ type: 'error', message: `오류: ${message}` });
    } finally {
      setIsCheckingApprovalForAll(false);
    }
  };

  const handleCheckGetApproved = async () => {
    const tokenId = tokenIdInput.trim();

    if (!tokenId) {
      setApprovedStatus({ type: 'error', message: 'Token ID를 입력해주세요' });
      return;
    }

    if (!nftContractAddress) {
      setApprovedStatus({ type: 'error', message: '먼저 컨트랙트를 등록해주세요' });
      return;
    }

    setIsCheckingApproved(true);
    setApprovedStatus({ type: 'info', message: 'getApproved 조회 중...' });

    try {
            const tokenIdBigInt = BigInt(tokenId);

      const [approved, owner] = await Promise.all([
        publicClient.readContract({
          address: nftContractAddress,
          abi: vibeNftAbi,
          functionName: 'getApproved',
          args: [tokenIdBigInt],
        }),
        publicClient.readContract({
          address: nftContractAddress,
          abi: vibeNftAbi,
          functionName: 'ownerOf',
          args: [tokenIdBigInt],
        }),
      ]);

      setApprovedAddress(approved as Address);
      setTokenOwner(owner as Address);
      setApprovedStatus({
        type: 'success',
        message: `조회 완료!`,
      });
    } catch (error) {
      console.error('getApproved failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setApprovedStatus({ type: 'error', message: `오류: ${message}` });
    } finally {
      setIsCheckingApproved(false);
    }
  };

  const getStatusColor = (type: StatusType) => {
    switch (type) {
      case 'success':
        return 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'error':
        return 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'info':
        return 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const isReady = !!nftContractAddress;

  return (
    <StepCard stepNumber={4} title="승인 상태 확인" badgeColor="outline">
      <p className="text-sm text-muted-foreground mb-4">
        isApprovedForAll과 getApproved를 통해 승인 상태를 조회합니다.
      </p>

      {/* Prerequisites */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">컨트랙트 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm">등록된 컨트랙트:</span>
            {nftContractAddress ? (
              <Badge variant="secondary" className="font-mono text-xs">
                {nftName} ({nftSymbol})
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600">
                미등록
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different checks */}
      <Tabs defaultValue="approvalForAll" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="approvalForAll">isApprovedForAll</TabsTrigger>
          <TabsTrigger value="approved">getApproved</TabsTrigger>
        </TabsList>

        {/* isApprovedForAll Tab */}
        <TabsContent value="approvalForAll">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">isApprovedForAll 조회</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                특정 owner가 operator에게 모든 NFT 권한을 부여했는지 확인합니다.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={ownerInputId}>Owner Address</Label>
                  <Input
                    id={ownerInputId}
                    type="text"
                    value={ownerInput}
                    onChange={(e) => setOwnerInput(e.target.value)}
                    placeholder="0x..."
                    className="font-mono text-sm"
                    disabled={!isReady}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={operatorInputId}>Operator Address</Label>
                  <Input
                    id={operatorInputId}
                    type="text"
                    value={operatorInput}
                    onChange={(e) => setOperatorInput(e.target.value)}
                    placeholder="0x..."
                    className="font-mono text-sm"
                    disabled={!isReady}
                  />
                </div>
              </div>

              <Button
                onClick={handleCheckIsApprovedForAll}
                disabled={!isReady || isCheckingApprovalForAll || !ownerInput.trim() || !operatorInput.trim()}
                className="w-full"
              >
                {isCheckingApprovalForAll ? '조회 중...' : 'isApprovedForAll 조회'}
              </Button>

              {approvalForAllStatus && (
                <Alert className={getStatusColor(approvalForAllStatus.type)}>
                  <AlertDescription>{approvalForAllStatus.message}</AlertDescription>
                </Alert>
              )}

              {isApprovedForAllResult !== null && (
                <div className="p-4 rounded-lg bg-muted/50 border text-center">
                  <p className="text-sm text-muted-foreground mb-2">결과</p>
                  <Badge
                    variant={isApprovedForAllResult ? 'default' : 'secondary'}
                    className="text-lg px-4 py-2"
                  >
                    {isApprovedForAllResult ? '✅ 승인됨 (true)' : '❌ 미승인 (false)'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* getApproved Tab */}
        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">getApproved 조회</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                특정 토큰 ID에 대해 승인된 주소를 확인합니다.
              </p>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={tokenIdInputId}>Token ID</Label>
                <Input
                  id={tokenIdInputId}
                  type="number"
                  value={tokenIdInput}
                  onChange={(e) => setTokenIdInput(e.target.value)}
                  placeholder="0"
                  className="font-mono text-sm"
                  disabled={!isReady}
                />
              </div>

              <Button
                onClick={handleCheckGetApproved}
                disabled={!isReady || isCheckingApproved || !tokenIdInput.trim()}
                className="w-full"
              >
                {isCheckingApproved ? '조회 중...' : 'getApproved 조회'}
              </Button>

              {approvedStatus && (
                <Alert className={getStatusColor(approvedStatus.type)}>
                  <AlertDescription>{approvedStatus.message}</AlertDescription>
                </Alert>
              )}

              {approvedAddress !== null && (
                <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Token #{tokenIdInput}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">소유자:</span>
                    <span className="font-mono text-xs">{formatAddress(tokenOwner)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">승인된 주소:</span>
                    <span className="font-mono text-xs">
                      {approvedAddress === zeroAddress ? (
                        <Badge variant="secondary">없음</Badge>
                      ) : (
                        formatApproval(approvedAddress)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StepCard>
  );
}
