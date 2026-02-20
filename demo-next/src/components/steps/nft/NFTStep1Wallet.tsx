/**
 * NFT Step 1: NFT 잔액 조회
 *
 * 연결된 지갑의 NFT 보유 수량 확인
 */

'use client';

import { useState } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { vibeNftAbi } from '@/infrastructure/contracts';
import { useSelectedChain } from '@/hooks/useSelectedChain';
import { toast } from 'sonner';
import { formatAddress } from '@/lib/format';

type StatusType = 'success' | 'error' | 'info';

export function NFTStep1Wallet() {
  const {
    nftContractAddress,
    nftName,
    nftSymbol,
    nftBalance,
    nftWalletAddress: walletAddress,
    setNftBalance,
  } = useAppStore();

  // 선택된 체인 정보
  const { publicClient } = useSelectedChain();

  const [status, setStatus] = useState<{
    type: StatusType;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckBalance = async () => {
    if (!nftContractAddress) {
      setStatus({ type: 'error', message: '먼저 Step 0에서 컨트랙트를 등록해주세요' });
      return;
    }

    if (!walletAddress) {
      setStatus({ type: 'error', message: '먼저 Step 0에서 지갑을 연결해주세요' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'info', message: 'NFT 잔액 조회 중...' });

    try {
      
      const balance = await publicClient.readContract({
        address: nftContractAddress,
        abi: vibeNftAbi,
        functionName: 'balanceOf',
        args: [walletAddress],
      });

      setNftBalance(balance as bigint);
      setStatus({ type: 'success', message: 'NFT 잔액 조회 완료!' });
      toast.success('NFT 잔액 조회 완료!');
    } catch (error) {
      console.error('Check balance failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatus({ type: 'error', message: `오류: ${message}` });
      toast.error('잔액 조회 실패');
    } finally {
      setIsLoading(false);
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

  const isReady = !!nftContractAddress && !!walletAddress;

  return (
    <StepCard stepNumber={1} title="NFT 잔액 조회" badgeColor="outline">
      <p className="text-sm text-muted-foreground mb-4">
        연결된 지갑의 NFT 보유 수량을 확인합니다.
      </p>

      {/* Prerequisites */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">사전 조건</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">컨트랙트 등록:</span>
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
            <span className="text-sm">지갑 연결:</span>
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

      {/* Balance Check */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">NFT 잔액 조회</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleCheckBalance}
            disabled={!isReady || isLoading}
            className="w-full"
          >
            {isLoading ? '조회 중...' : 'balanceOf 조회'}
          </Button>

          {status && (
            <Alert className={getStatusColor(status.type)}>
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Balance Result */}
      {nftBalance !== null && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="text-base text-green-700 dark:text-green-400">
              NFT 보유 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-4xl font-bold">{nftBalance.toString()}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {nftSymbol} NFT 보유 수량
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </StepCard>
  );
}
