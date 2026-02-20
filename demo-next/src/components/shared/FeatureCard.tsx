/**
 * FeatureCard Component
 *
 * 기능 소개를 위한 카드 컴포넌트
 * 아이콘, 그라디언트 테두리 호버 효과, 마이크로 애니메이션 지원
 */

'use client';

import { type LucideIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  details?: string;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

/**
 * Feature Card 컴포넌트
 *
 * @param icon - 카드 아이콘 (lucide-react)
 * @param title - 카드 제목
 * @param description - 카드 설명
 * @param details - 추가 세부사항 (선택)
 * @param onClick - 클릭 핸들러 (선택)
 * @param isActive - 활성 상태 (선택)
 * @param className - 추가 CSS 클래스
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  details,
  onClick,
  isActive = false,
  className = '',
}: FeatureCardProps) {
  return (
    <Card
      variant={onClick ? 'interactive' : 'default'}
      onClick={onClick}
      className={cn(
        'feature-card-safe group relative isolate overflow-hidden',
        'transition-all duration-300',
        'hover:border-[oklch(0.62_0.19_250/0.35)] hover:shadow-md',
        // 활성 상태
        isActive && 'ring-2 ring-[oklch(0.6_0.2_250/0.5)]',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* 아이콘 컨테이너 with gradient background */}
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              'bg-gradient-to-br from-[oklch(0.6_0.2_250/10%)] to-[oklch(0.5_0.25_280/10%)]',
              'dark:from-[oklch(0.6_0.2_250/20%)] dark:to-[oklch(0.5_0.25_280/20%)]',
              'transition-transform duration-300 group-hover:scale-110'
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5',
                'text-[oklch(0.5_0.2_250)] dark:text-[oklch(0.65_0.18_250)]',
                'transition-colors duration-300'
              )}
            />
          </div>

          <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </CardDescription>
        {details && (
          <div className="feature-card-details mt-2 text-xs text-muted-foreground font-mono">
            {details}
          </div>
        )}
      </CardContent>

    </Card>
  );
}

/**
 * Mini Feature Card (더 작은 사이즈)
 */
export function MiniFeatureCard({
  icon: Icon,
  title,
  description,
  onClick,
  className = '',
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg',
        'bg-card/50 border border-border/50',
        'transition-all duration-200',
        'hover:bg-accent/50 hover:border-[oklch(0.6_0.2_250/30%)]',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
          'bg-[oklch(0.6_0.2_250/10%)] dark:bg-[oklch(0.6_0.2_250/15%)]',
          'transition-transform duration-200 group-hover:scale-105'
        )}
      >
        <Icon className="h-4 w-4 text-[oklch(0.5_0.2_250)] dark:text-[oklch(0.65_0.18_250)]" />
      </div>

      <div className="min-w-0">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {description}
        </p>
      </div>
    </div>
  );
}

/**
 * Feature Card Grid (FeatureCard들을 그리드로 배치)
 */
export function FeatureCardGrid({
  children,
  columns = 4,
  className = '',
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
    5: 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}
