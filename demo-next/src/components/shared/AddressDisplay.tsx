/**
 * AddressDisplay - 주소 표시 + 복사 + 탐색기 링크
 *
 * 블록체인 주소를 축약 표시하고 클립보드 복사, 탐색기 링크 기능을 제공합니다.
 * - 주소 truncate (기본 앞 6자 + 뒤 4자)
 * - 클립보드 복사 (Copy → Check 아이콘 전환)
 * - 블록 익스플로러 링크 (ExplorerLink 재사용)
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { Address } from 'viem';
import { Button } from '@/components/ui/button';
import { ExplorerLink } from '@/components/shared/ExplorerLink';
import { formatAddress } from '@/lib/format';
import { cn } from '@/lib/utils';

interface AddressDisplayProps {
  /** 표시할 주소 */
  address: Address | null;
  /** truncate 시 앞뒤 표시 글자 수 (기본 6) */
  chars?: number;
  /** 복사 버튼 표시 여부 (기본 true) */
  showCopy?: boolean;
  /** 탐색기 링크 표시 여부 (기본 false) */
  showExplorer?: boolean;
  /** 체인 ID */
  chainId?: number;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 주소 표시 컴포넌트
 *
 * @example
 * // 기본 사용 (축약 + 복사)
 * <AddressDisplay address="0x1234..." />
 *
 * // 탐색기 링크 포함
 * <AddressDisplay address="0x1234..." showExplorer chainId={5611} />
 *
 * // 복사 비활성화
 * <AddressDisplay address="0x1234..." showCopy={false} />
 */
export function AddressDisplay({
  address,
  chars = 6,
  showCopy = true,
  showExplorer = false,
  chainId,
  className,
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!address) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)}>
        -
      </span>
    );
  }

  const handleCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setCopied(false);
      return;
    }

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <code className="text-sm font-mono">
        {formatAddress(address, chars)}
      </code>

      {showCopy && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          aria-label={copied ? '복사됨' : '주소 복사'}
          className="text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3 text-green-500" />
          ) : (
            <Copy className="size-3" />
          )}
        </Button>
      )}

      {showExplorer && (
        <ExplorerLink
          type="address"
          value={address}
          chainId={chainId}
          variant="icon"
          className="size-6"
        />
      )}
    </span>
  );
}
