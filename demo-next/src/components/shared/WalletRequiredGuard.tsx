/**
 * WalletRequiredGuard - 지갑 연결 필수 가드 컴포넌트
 *
 * 지갑이 연결되지 않은 경우 연결 안내 UI를 표시하고,
 * 연결된 경우 children을 렌더링합니다.
 */

'use client';

import type { ReactNode } from 'react';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInjectedWallet } from '@/hooks/useInjectedWallet';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WalletRequiredGuardProps {
  /** 지갑 연결 시 렌더링할 내용 */
  children: ReactNode;
  /** 안내 메시지 */
  message?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 지갑 연결 필수 가드 컴포넌트
 *
 * @example
 * <WalletRequiredGuard>
 *   <Erc20Form />
 * </WalletRequiredGuard>
 *
 * @example
 * <WalletRequiredGuard message="작업을 진행하려면 지갑을 연결해주세요">
 *   <TokenTransfer />
 * </WalletRequiredGuard>
 */
export function WalletRequiredGuard({
  children,
  message = '지갑을 연결해주세요',
  className,
}: WalletRequiredGuardProps) {
  const { isConnected, connect } = useInjectedWallet();

  if (isConnected) {
    return <>{children}</>;
  }

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '지갑 연결에 실패했습니다';
      toast.error(errorMessage);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8',
        className
      )}
    >
      <Wallet className="size-10 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button onClick={handleConnect} className="gap-2">
        <Wallet className="size-4" aria-hidden="true" />
        지갑 연결
      </Button>
    </div>
  );
}
