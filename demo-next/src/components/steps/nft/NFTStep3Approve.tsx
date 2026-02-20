/**
 * NFT Step 3: approve (개별 토큰)
 *
 * 특정 토큰 ID에 대한 승인 설정
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
import { type Address, zeroAddress } from 'viem';
import { vibeNftAbi } from '@/infrastructure/contracts';
import { useSelectedChain } from '@/hooks/useSelectedChain';
import { toast } from 'sonner';
import { logError } from '@/lib/error-handler';
import { formatAddress } from '@/lib/format';
import { getNftWalletClient } from './nftWallet';

type StatusType = 'success' | 'error' | 'info';

export function NFTStep3Approve() {
  const tokenIdInputId = useId();
  const approveToInputId = useId();

  const {
    nftContractAddress,
    nftName,
    nftSymbol,
    nftWalletAddress: walletAddress,
    setNftTokenIdForApprove,
    setNftApprovedAddress,
    setNftTxHash,
  } = useAppStore();

  // 선택된 체인 정보
  const { publicClient } = useSelectedChain();

  const [tokenIdInput, setTokenIdInput] = useState('');
  const [approveToInput, setApproveToInput] = useState('');
  const [status, setStatus] = useState<{
    type: StatusType;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [tokenOwner, setTokenOwner] = useState<Address | null>(null);
  const [currentApproved, setCurrentApproved] = useState<Address | null>(null);

  const formatApproval = (address: Address | null) => {
    if (address === zeroAddress) return '없음 (0x0)';
    return formatAddress(address);
  };

  const handleCheckToken = async () => {
    const tokenId = tokenIdInput.trim();
    if (!tokenId) {
      setStatus({ type: 'error', message: 'Token ID를 입력해주세요' });
      return;
    }

    if (!nftContractAddress) {
      setStatus({ type: 'error', message: '먼저 컨트랙트를 등록해주세요' });
      return;
    }

    setIsChecking(true);
    setStatus({ type: 'info', message: '토큰 정보 확인 중...' });

    try {
            const tokenIdBigInt = BigInt(tokenId);

      const [owner, approved] = await Promise.all([
        publicClient.readContract({
          address: nftContractAddress,
          abi: vibeNftAbi,
          functionName: 'ownerOf',
          args: [tokenIdBigInt],
        }),
        publicClient.readContract({
          address: nftContractAddress,
          abi: vibeNftAbi,
          functionName: 'getApproved',
          args: [tokenIdBigInt],
        }),
      ]);

      setTokenOwner(owner as Address);
      setCurrentApproved(approved as Address);
      setNftTokenIdForApprove(tokenIdBigInt);
      setNftApprovedAddress(approved as Address);

      const isOwner = (owner as Address).toLowerCase() === walletAddress?.toLowerCase();
      setStatus({
        type: 'success',
        message: `토큰 정보 확인 완료!\n소유자: ${formatAddress(owner as Address)}${isOwner ? ' (본인)' : ''}\n현재 승인: ${formatApproval(approved as Address)}`,
      });
    } catch (error) {
      logError('NFTStep3Approve.handleCheckToken', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatus({ type: 'error', message: `오류: ${message}` });
    } finally {
      setIsChecking(false);
    }
  };

  const handleApprove = async () => {
    const tokenId = tokenIdInput.trim();
    const approveTo = approveToInput.trim();

    if (!tokenId) {
      setStatus({ type: 'error', message: 'Token ID를 입력해주세요' });
      return;
    }

    if (!approveTo) {
      setStatus({ type: 'error', message: '승인할 주소를 입력해주세요 (해제: 0x0)' });
      return;
    }

    if (!nftContractAddress || !walletAddress) {
      setStatus({ type: 'error', message: '컨트랙트와 지갑이 연결되어야 합니다' });
      return;
    }

    const walletClient = getNftWalletClient();
    if (!walletClient) {
      setStatus({ type: 'error', message: '지갑 클라이언트를 생성할 수 없습니다' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'info', message: 'approve 실행 중...' });

    try {
            const tokenIdBigInt = BigInt(tokenId);

      const hash = await walletClient.writeContract({
        address: nftContractAddress,
        abi: vibeNftAbi,
        functionName: 'approve',
        args: [approveTo as Address, tokenIdBigInt],
      });

      setStatus({
        type: 'info',
        message: `트랜잭션 전송됨. 대기 중...\nTX: ${hash}`,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      setNftTokenIdForApprove(tokenIdBigInt);
      setNftApprovedAddress(approveTo as Address);
      setNftTxHash(hash);
      setCurrentApproved(approveTo as Address);

      setStatus({
        type: 'success',
        message: `approve 완료!\nToken #${tokenId} → ${formatAddress(approveTo as Address)}`,
      });
      toast.success('approve 완료!');
    } catch (error) {
      logError('NFTStep3Approve.handleApprove', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatus({ type: 'error', message: `오류: ${message}` });
      toast.error('approve 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeApproval = () => {
    setApproveToInput(zeroAddress);
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

  const isReady = !!nftContractAddress && !!walletAddress;
  const isOwner = tokenOwner?.toLowerCase() === walletAddress?.toLowerCase();

  return (
    <StepCard stepNumber={3} title="approve (개별 토큰)" badgeColor="outline">
      <p className="text-sm text-muted-foreground mb-4">
        특정 토큰 ID에 대한 전송 권한을 부여하거나 해제합니다.
      </p>

      {/* Prerequisites */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">사전 조건</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">컨트랙트:</span>
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
          <div className="flex items-center justify-between">
            <span className="text-sm">지갑:</span>
            {walletAddress ? (
              <Badge variant="secondary" className="font-mono text-xs">
                {formatAddress(walletAddress)}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600">
                미연결
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Token Check */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">토큰 정보 확인</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            variant="outline"
            onClick={handleCheckToken}
            disabled={!isReady || isChecking || !tokenIdInput.trim()}
            className="w-full"
          >
            {isChecking ? '확인 중...' : '토큰 정보 확인'}
          </Button>

          {tokenOwner && (
            <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">소유자:</span>
                <span className="font-mono text-xs">
                  {formatAddress(tokenOwner)}
                  {isOwner && <Badge variant="secondary" className="ml-2">본인</Badge>}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">현재 승인:</span>
                <span className="font-mono text-xs">{formatApproval(currentApproved)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">승인 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={approveToInputId}>승인할 주소 (0x...)</Label>
            <Input
              id={approveToInputId}
              type="text"
              value={approveToInput}
              onChange={(e) => setApproveToInput(e.target.value)}
              placeholder="0x... (해제: 0x0000...)"
              className="font-mono text-sm"
              disabled={!isReady || !isOwner}
            />
            <p className="text-xs text-muted-foreground">
              승인 해제: 0x0000000000000000000000000000000000000000 입력
            </p>
          </div>

          {!isOwner && tokenOwner && (
            <Alert className="border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertDescription>
                토큰 소유자만 approve를 실행할 수 있습니다.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleRevokeApproval}
              disabled={!isReady || !isOwner || isLoading}
            >
              승인 해제 (0x0)
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!isReady || !isOwner || isLoading || !tokenIdInput.trim() || !approveToInput.trim()}
            >
              {isLoading ? '처리 중...' : 'approve'}
            </Button>
          </div>

          {status && (
            <Alert className={getStatusColor(status.type)}>
              <AlertDescription className="whitespace-pre-line">
                {status.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </StepCard>
  );
}
