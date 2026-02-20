/**
 * NFT Step 2: setApprovalForAll
 *
 * 모든 토큰에 대한 operator 승인 설정
 * - 새 operator 승인
 * - 현재 승인된 operator 목록 조회
 * - 승인 해제
 */

'use client';

import { useState, useId, useEffect } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type Address } from 'viem';
import { vibeNftAbi } from '@/infrastructure/contracts';
import { useSelectedChain } from '@/hooks/useSelectedChain';
import { useApprovedOperators } from '@/hooks/useApprovedOperators';
import { formatAddress } from '@/lib/format';
import { toast } from 'sonner';
import { getNftWalletClient } from './nftWallet';
import { RefreshCw, X, Loader2 } from 'lucide-react';

type StatusType = 'success' | 'error' | 'info';

export function NFTStep2ApprovalForAll() {
  const operatorInputId = useId();

  const {
    nftContractAddress,
    nftName,
    nftSymbol,
    nftOperatorAddress,
    nftIsApprovedForAll,
    nftTxHash,
    nftWalletAddress: walletAddress,
    setNftOperatorAddress,
    setNftIsApprovedForAll,
    setNftTxHash,
  } = useAppStore();

  // 선택된 체인 정보
  const { publicClient } = useSelectedChain();

  const [operatorInput, setOperatorInput] = useState('');
  const [approvalValue, setApprovalValue] = useState(true);
  const [status, setStatus] = useState<{
    type: StatusType;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // 승인된 Operator 목록 조회 훅 (viem getLogs 사용)
  const {
    operators: approvedOperators,
    isLoading: isLoadingOperators,
    error: operatorsError,
    refresh: refreshOperators,
  } = useApprovedOperators(nftContractAddress, walletAddress, publicClient);

  // 해제 중인 operator 추적
  const [revokingOperator, setRevokingOperator] = useState<Address | null>(null);

  // 컨트랙트와 지갑이 준비되면 자동으로 operator 목록 조회
  useEffect(() => {
    if (nftContractAddress && walletAddress) {
      refreshOperators();
    }
  }, [nftContractAddress, walletAddress, refreshOperators]);

  const handleCheckApproval = async () => {
    const operator = operatorInput.trim();
    if (!operator) {
      setStatus({ type: 'error', message: 'Operator 주소를 입력해주세요' });
      return;
    }

    if (!nftContractAddress || !walletAddress) {
      setStatus({ type: 'error', message: '컨트랙트와 지갑이 연결되어야 합니다' });
      return;
    }

    setIsChecking(true);
    setStatus({ type: 'info', message: '승인 상태 확인 중...' });

    try {
      
      const isApproved = await publicClient.readContract({
        address: nftContractAddress,
        abi: vibeNftAbi,
        functionName: 'isApprovedForAll',
        args: [walletAddress, operator as Address],
      });

      setNftOperatorAddress(operator as Address);
      setNftIsApprovedForAll(isApproved as boolean);
      setStatus({
        type: 'success',
        message: `승인 상태: ${isApproved ? '✅ 승인됨' : '❌ 미승인'}`,
      });
    } catch (error) {
      console.error('Check approval failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatus({ type: 'error', message: `오류: ${message}` });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSetApprovalForAll = async () => {
    const operator = operatorInput.trim();
    if (!operator) {
      setStatus({ type: 'error', message: 'Operator 주소를 입력해주세요' });
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
    setStatus({ type: 'info', message: 'setApprovalForAll 실행 중...' });

    try {

      const hash = await walletClient.writeContract({
        address: nftContractAddress,
        abi: vibeNftAbi,
        functionName: 'setApprovalForAll',
        args: [operator as Address, approvalValue],
      });

      setStatus({
        type: 'info',
        message: `트랜잭션 전송됨. 대기 중...\nTX: ${hash}`,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      setNftOperatorAddress(operator as Address);
      setNftIsApprovedForAll(approvalValue);
      setNftTxHash(hash);

      setStatus({
        type: 'success',
        message: `setApprovalForAll 완료!\n${approvalValue ? '승인됨' : '승인 해제됨'}`,
      });
      toast.success('setApprovalForAll 완료!');

      // 목록 새로고침
      await refreshOperators();
    } catch (error) {
      console.error('setApprovalForAll failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatus({ type: 'error', message: `오류: ${message}` });
      toast.error('setApprovalForAll 실패');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 특정 operator의 승인 해제
   */
  const handleRevokeOperator = async (operatorAddress: Address) => {
    if (!nftContractAddress || !walletAddress) {
      toast.error('컨트랙트와 지갑이 연결되어야 합니다');
      return;
    }

    const walletClient = getNftWalletClient();
    if (!walletClient) {
      toast.error('지갑 클라이언트를 생성할 수 없습니다');
      return;
    }

    setRevokingOperator(operatorAddress);

    try {
      const hash = await walletClient.writeContract({
        address: nftContractAddress,
        abi: vibeNftAbi,
        functionName: 'setApprovalForAll',
        args: [operatorAddress, false],
      });

      toast.info(`트랜잭션 전송됨: ${hash.slice(0, 10)}...`);

      await publicClient.waitForTransactionReceipt({ hash });

      toast.success('승인 해제 완료!');

      // 목록 새로고침
      await refreshOperators();
    } catch (error) {
      console.error('Revoke operator failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`승인 해제 실패: ${message}`);
    } finally {
      setRevokingOperator(null);
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
    <StepCard stepNumber={2} title="setApprovalForAll" badgeColor="outline">
      <p className="text-sm text-muted-foreground mb-4">
        특정 operator에게 모든 NFT에 대한 전송 권한을 부여하거나 해제합니다.
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

      {/* Operator Input & Approval */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Operator 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={operatorInputId}>Operator Address (0x...)</Label>
            <Input
              id={operatorInputId}
              type="text"
              value={operatorInput}
              onChange={(e) => setOperatorInput(e.target.value)}
              placeholder="0x..."
              className="font-mono text-sm"
              disabled={!isReady}
            />
            <p className="text-xs text-muted-foreground">
              이 주소에게 모든 NFT 전송 권한을 부여합니다
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
            <div>
              <p className="text-sm font-medium">승인 상태</p>
              <p className="text-xs text-muted-foreground">
                {approvalValue ? '권한 부여 (approve)' : '권한 해제 (revoke)'}
              </p>
            </div>
            <Button
              variant={approvalValue ? 'default' : 'outline'}
              size="sm"
              onClick={() => setApprovalValue(!approvalValue)}
              disabled={!isReady}
            >
              {approvalValue ? '✅ 승인' : '❌ 해제'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleCheckApproval}
              disabled={!isReady || isChecking || !operatorInput.trim()}
            >
              {isChecking ? '확인 중...' : '현재 상태 확인'}
            </Button>
            <Button
              onClick={handleSetApprovalForAll}
              disabled={!isReady || isLoading || !operatorInput.trim()}
            >
              {isLoading ? '처리 중...' : 'setApprovalForAll'}
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

      {/* Approved Operators List */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">현재 승인된 Operator 목록</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshOperators}
            disabled={!isReady || isLoadingOperators}
          >
            {isLoadingOperators ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-1.5">새로고침</span>
          </Button>
        </CardHeader>
        <CardContent>
          {operatorsError && (
            <Alert className="mb-3 border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertDescription>
                조회 실패: {operatorsError}
                <br />
                <span className="text-xs">Explorer API가 지원되지 않는 체인이거나 네트워크 오류일 수 있습니다.</span>
              </AlertDescription>
            </Alert>
          )}

          {/* 블록 범위 제한 안내 */}
          <p className="text-xs text-muted-foreground mb-3">
            ⚠️ 최근 블록에서 발생한 승인만 표시됩니다. 오래된 승인은 표시되지 않을 수 있습니다.
          </p>

          {isLoadingOperators ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>승인된 Operator 조회 중...</span>
            </div>
          ) : approvedOperators.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>승인된 Operator가 없습니다</p>
              <p className="text-xs mt-1">
                위에서 Operator를 추가하면 여기에 표시됩니다
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {approvedOperators.map((op) => (
                <div
                  key={op.address}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">
                      승인됨
                    </Badge>
                    <span className="font-mono text-sm">
                      {op.address.slice(0, 10)}...{op.address.slice(-8)}
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevokeOperator(op.address)}
                    disabled={revokingOperator === op.address}
                  >
                    {revokingOperator === op.address ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        해제 중...
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        해제
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Status (Last Operation) */}
      {nftOperatorAddress && nftIsApprovedForAll !== null && (
        <Card className={nftIsApprovedForAll ? 'border-green-500' : 'border-amber-500'}>
          <CardHeader>
            <CardTitle className="text-base">최근 작업 상태</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Operator:</span>
              <span className="font-mono text-xs">{formatAddress(nftOperatorAddress)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">승인 상태:</span>
              <Badge variant={nftIsApprovedForAll ? 'default' : 'secondary'}>
                {nftIsApprovedForAll ? '✅ 승인됨' : '❌ 미승인'}
              </Badge>
            </div>
            {nftTxHash && (
              <div>
                <p className="text-sm font-medium">Transaction Hash</p>
                <p className="text-xs font-mono break-all">{nftTxHash}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </StepCard>
  );
}
