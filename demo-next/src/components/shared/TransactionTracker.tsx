/**
 * TransactionTracker - 트랜잭션 상태 추적 컴포넌트
 *
 * 서명 → 제출 → 확인/에러 상태를 시각적으로 표시합니다.
 * - idle: 아무것도 렌더링하지 않음
 * - signing: 스피너 + "서명 중..."
 * - submitting: 스피너 + "트랜잭션 처리 중..."
 * - confirmed: 체크 아이콘 + TxHashDisplay
 * - error: 에러 아이콘 + 에러 메시지
 */

'use client';

import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { TxHashDisplay } from '@/components/shared/TxHashDisplay';
import { cn } from '@/lib/utils';

type TransactionStatus = 'idle' | 'signing' | 'submitting' | 'confirmed' | 'error';

interface TransactionTrackerProps {
  /** 트랜잭션 처리 상태 */
  status: TransactionStatus;
  /** 트랜잭션 해시 (confirmed 상태에서 사용) */
  txHash?: string | null;
  /** 체인 ID (ExplorerLink용) */
  chainId?: number;
  /** 에러 메시지 (error 상태에서 사용) */
  error?: string | null;
  /** 추가 CSS 클래스 */
  className?: string;
}

const statusConfig = {
  signing: {
    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    message: '서명 중...',
  },
  submitting: {
    bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    message: '트랜잭션 처리 중...',
  },
  confirmed: {
    bg: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    message: '트랜잭션 완료',
  },
  error: {
    bg: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    message: '',
  },
} as const;

/**
 * 트랜잭션 상태 추적 컴포넌트
 *
 * @example
 * <TransactionTracker status="signing" />
 *
 * @example
 * <TransactionTracker
 *   status="confirmed"
 *   txHash="0x1234..."
 *   chainId={5611}
 * />
 */
export function TransactionTracker({
  status,
  txHash,
  chainId,
  error,
  className,
}: TransactionTrackerProps) {
  if (status === 'idle') {
    return null;
  }

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border p-3',
        config.bg,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {status === 'signing' && (
        <>
          <Loader2 className={cn('size-4 shrink-0 animate-spin', config.text)} />
          <span className={cn('text-sm font-medium', config.text)}>
            {config.message}
          </span>
        </>
      )}

      {status === 'submitting' && (
        <>
          <Loader2 className={cn('size-4 shrink-0 animate-spin', config.text)} />
          <span className={cn('text-sm font-medium', config.text)}>
            {config.message}
          </span>
        </>
      )}

      {status === 'confirmed' && (
        <>
          <CheckCircle className={cn('size-4 shrink-0', config.text)} />
          <span className={cn('text-sm font-medium', config.text)}>
            {config.message}
          </span>
          {txHash && (
            <TxHashDisplay
              txHash={txHash}
              chainId={chainId}
              className="ml-auto"
              variant="compact"
            />
          )}
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className={cn('size-4 shrink-0', config.text)} />
          <span className={cn('text-sm font-medium', config.text)}>
            {error ?? '알 수 없는 오류가 발생했습니다'}
          </span>
        </>
      )}
    </div>
  );
}
