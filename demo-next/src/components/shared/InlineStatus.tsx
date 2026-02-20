/**
 * InlineStatus Component
 *
 * 인라인 상태 표시 컴포넌트 (renderStatus 함수 대체)
 * - 성공, 에러, 정보 상태 표시
 * - 단일/다중 트랜잭션 해시 지원
 * - 접근성 (aria) 속성 포함
 * - TxHashDisplay 통합
 */

'use client';

import { TxHashDisplay } from '@/components/shared/TxHashDisplay';
import { cn } from '@/lib/utils';

type StatusType = 'success' | 'error' | 'info';

interface StatusMessage {
  type: StatusType;
  message: string;
}

/**
 * 상태 타입별 색상 설정
 */
const statusColors: Record<StatusType, string> = {
  success: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
};

interface InlineStatusProps {
  /** 상태 객체 (null이면 렌더링하지 않음) */
  status: StatusMessage | null;
  /** 단일 트랜잭션 해시 (선택) */
  txHash?: string | null;
  /** 다중 트랜잭션 해시 배열 (선택) */
  txHashes?: string[];
  /** 체인 ID (ExplorerLink용) */
  chainId?: number;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 인라인 상태 표시 컴포넌트
 *
 * @example
 * // 단일 트랜잭션
 * <InlineStatus status={deployStatus} txHash={deployTxHash} />
 *
 * // 다중 트랜잭션
 * <InlineStatus status={voteTypeStatus} txHashes={voteTypeTxHashes} />
 */
export function InlineStatus({
  status,
  txHash,
  txHashes,
  chainId,
  className,
}: InlineStatusProps) {
  if (!status) return null;

  const showSingleTx = status.type === 'success' && txHash;
  const showMultipleTx = status.type === 'success' && txHashes && txHashes.length > 0;

  return (
    <div
      className={cn(
        'mt-3 p-3 rounded-md border text-sm whitespace-pre-line',
        statusColors[status.type],
        className
      )}
      role="status"
      aria-live="polite"
    >
      {status.message}

      {/* 단일 트랜잭션 링크 */}
      {showSingleTx && (
        <div className="mt-2">
          <TxHashDisplay txHash={txHash} chainId={chainId} variant="compact" />
        </div>
      )}

      {/* 다중 트랜잭션 링크 */}
      {showMultipleTx && (
        <div className="mt-2 space-y-1">
          {txHashes.map((hash, index) => (
            <TxHashDisplay
              key={hash}
              txHash={hash}
              chainId={chainId}
              label={`TX ${index + 1}`}
              variant="compact"
            />
          ))}
        </div>
      )}
    </div>
  );
}
