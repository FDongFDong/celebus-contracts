/**
 * TechDetail - 기술 세부사항 접기/펼치기 패널
 *
 * 개발자 모드에서 기술적 세부 정보를 표시하는 접이식 패널입니다.
 * Radix Collapsible 기반으로 부드러운 애니메이션을 제공합니다.
 */

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface TechDetailProps {
  /** 패널 라벨 */
  label: string;
  /** 패널 내용 */
  children: ReactNode;
  /** 기본 열림 상태 (기본 false) */
  defaultOpen?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 기술 세부사항 접기/펼치기 패널
 *
 * @example
 * <TechDetail label="EIP-712 도메인 정보">
 *   <pre>{JSON.stringify(domain, null, 2)}</pre>
 * </TechDetail>
 *
 * @example
 * <TechDetail label="서명 데이터" defaultOpen>
 *   <code>{signatureHex}</code>
 * </TechDetail>
 */
export function TechDetail({
  label,
  children,
  defaultOpen = false,
  className,
}: TechDetailProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md px-3 py-2',
          'text-sm font-medium text-muted-foreground',
          'hover:bg-muted/50 hover:text-foreground transition-colors',
          'cursor-pointer'
        )}
        aria-label={`${label} ${open ? '접기' : '펼치기'}`}
      >
        <ChevronDown
          className={cn(
            'size-4 shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'overflow-hidden',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0'
        )}
      >
        <div className="px-3 py-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
