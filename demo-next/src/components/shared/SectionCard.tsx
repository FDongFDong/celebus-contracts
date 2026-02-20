/**
 * SectionCard Component
 *
 * Step0 Setup 페이지의 섹션별 일관된 색상을 적용하는 Card 래퍼
 * - deploy: 보라색 (컨트랙트 배포)
 * - executor: 노란색 (Executor 설정)
 * - config: 초록색 (타입/설정)
 * - entity: 보라색 (아티스트/엔티티 등록)
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export type SectionType = 'deploy' | 'executor' | 'config' | 'entity';

/**
 * 섹션 타입별 색상 설정
 * 모든 탭(MainVoting, Boosting, SubVoting, ERC20, NFT)에서 동일하게 적용
 */
const sectionStyles: Record<SectionType, { card: string; title: string }> = {
  deploy: {
    card: 'bg-purple-500/10 border-purple-500/30',
    title: 'text-purple-700 dark:text-purple-400',
  },
  executor: {
    card: 'bg-yellow-500/10 border-yellow-500/30',
    title: 'text-yellow-700 dark:text-yellow-400',
  },
  config: {
    card: 'bg-green-500/10 border-green-500/30',
    title: 'text-green-700 dark:text-green-400',
  },
  entity: {
    card: 'bg-violet-500/10 border-violet-500/30',
    title: 'text-violet-700 dark:text-violet-400',
  },
};

interface SectionCardProps {
  /** 섹션 타입 */
  type: SectionType;
  /** 카드 제목 */
  title: string;
  /** 카드 내용 */
  children: ReactNode;
  /** 카드 설명 (선택) */
  description?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 섹션 카드 컴포넌트
 *
 * @example
 * <SectionCard type="deploy" title="컨트랙트 배포">
 *   <Button>배포하기</Button>
 * </SectionCard>
 */
export function SectionCard({
  type,
  title,
  children,
  description,
  className,
}: SectionCardProps) {
  const styles = sectionStyles[type];

  return (
    <Card className={cn(styles.card, className)}>
      <CardHeader className="p-4 pb-3">
        <CardTitle className={cn('text-base font-semibold', styles.title)}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
