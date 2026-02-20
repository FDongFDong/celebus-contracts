/**
 * ExplorerLink - 블록 익스플로러 링크 컴포넌트
 *
 * 트랜잭션 해시, 주소, 블록 번호에 대한 블록 익스플로러 링크를 렌더링합니다.
 * - 체인에 따라 적절한 익스플로러 URL 생성
 * - 로컬 체인(Anvil)의 경우 렌더링하지 않음
 * - 다양한 variant 지원 (button, link, icon)
 */

'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getTxExplorerUrl,
  getAddressExplorerUrl,
  getBlockExplorerUrl,
} from '@/lib/explorer';
import { cn } from '@/lib/utils';

export type ExplorerLinkType = 'tx' | 'address' | 'block';
export type ExplorerLinkVariant = 'button' | 'link' | 'icon';

interface ExplorerLinkProps {
  /** 링크 타입: tx(트랜잭션), address(주소), block(블록) */
  type: ExplorerLinkType;
  /** 값: 트랜잭션 해시, 주소, 또는 블록 번호 */
  value: string | number | bigint;
  /** 체인 ID (기본값: opBNBTestnet) */
  chainId?: number;
  /** 렌더링 스타일 */
  variant?: ExplorerLinkVariant;
  /** 커스텀 라벨 (variant가 button 또는 link인 경우) */
  label?: string;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 블록 익스플로러 링크 컴포넌트
 *
 * @example
 * // 트랜잭션 링크 (버튼 스타일)
 * <ExplorerLink type="tx" value={txHash} variant="button" />
 *
 * // 주소 링크 (텍스트 스타일)
 * <ExplorerLink type="address" value={address} variant="link" />
 *
 * // 아이콘만
 * <ExplorerLink type="tx" value={txHash} variant="icon" />
 */
export function ExplorerLink({
  type,
  value,
  chainId,
  variant = 'link',
  label,
  className,
}: ExplorerLinkProps) {
  // URL 생성
  const url = (() => {
    switch (type) {
      case 'tx':
        return getTxExplorerUrl(String(value), chainId);
      case 'address':
        return getAddressExplorerUrl(String(value), chainId);
      case 'block':
        return getBlockExplorerUrl(
          typeof value === 'bigint' ? value : BigInt(value),
          chainId
        );
      default:
        return null;
    }
  })();

  // URL이 없으면 (로컬 체인 등) 렌더링하지 않음
  if (!url) {
    return null;
  }

  // 기본 라벨
  const defaultLabel = (() => {
    switch (type) {
      case 'tx':
        return '블록 탐색기에서 보기';
      case 'address':
        return '주소 보기';
      case 'block':
        return '블록 보기';
      default:
        return '탐색기에서 보기';
    }
  })();

  const displayLabel = label ?? defaultLabel;

  // 공통 props
  const linkProps = {
    href: url,
    target: '_blank' as const,
    rel: 'noopener noreferrer',
  };

  // variant에 따른 렌더링
  switch (variant) {
    case 'button':
      return (
        <Button
          asChild
          variant="outline"
          size="sm"
          className={cn('gap-1.5', className)}
        >
          <a {...linkProps}>
            <ExternalLink className="h-3.5 w-3.5" />
            {displayLabel}
          </a>
        </Button>
      );

    case 'icon':
      return (
        <a
          {...linkProps}
          className={cn(
            'inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors',
            className
          )}
          aria-label={displayLabel}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      );

    case 'link':
    default:
      return (
        <a
          {...linkProps}
          className={cn(
            'inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors',
            className
          )}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {displayLabel}
        </a>
      );
  }
}
