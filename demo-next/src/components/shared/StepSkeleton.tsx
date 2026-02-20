/**
 * StepSkeleton Component
 *
 * Dynamic import 시 로딩 상태를 표시하는 스켈레톤 컴포넌트
 * StepCard와 동일한 레이아웃을 유지하여 CLS(Cumulative Layout Shift) 방지
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type StepCategory = 'setup' | 'config' | 'action' | 'result';

interface StepSkeletonProps {
  stepNumber: number;
  title: string;
  category?: StepCategory;
  className?: string;
}

// 카테고리별 그라디언트 색상
const categoryGradients: Record<StepCategory, string> = {
  setup: 'from-[oklch(0.65_0.18_145)] to-[oklch(0.55_0.15_160)]',
  config: 'from-[oklch(0.6_0.2_250)] to-[oklch(0.5_0.25_280)]',
  action: 'from-[oklch(0.65_0.22_35)] to-[oklch(0.55_0.2_25)]',
  result: 'from-[oklch(0.6_0.2_280)] to-[oklch(0.5_0.22_300)]',
};

/**
 * Step 로딩 스켈레톤
 *
 * @param stepNumber - Step 번호
 * @param title - Step 제목
 * @param category - Step 카테고리 (색상 결정)
 * @param className - 추가 CSS 클래스
 */
export function StepSkeleton({
  stepNumber,
  title,
  category = 'config',
  className = '',
}: StepSkeletonProps) {
  const gradientClass = categoryGradients[category];

  return (
    <Card
      variant="elevated"
      className={cn(
        'relative overflow-hidden mb-6 animate-pulse',
        className
      )}
    >
      {/* Gradient Progress Bar */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b',
          gradientClass
        )}
      />

      <CardHeader className="pl-8">
        <div className="flex items-center gap-3">
          {/* Icon skeleton */}
          <Skeleton className="h-4 w-4 rounded" />
          {/* Badge skeleton */}
          <Skeleton className="h-5 w-16 rounded" />
          {/* Title */}
          <span className="flex-1 text-lg font-semibold text-muted-foreground">
            Step {stepNumber}: {title}
          </span>
          {/* Chevron skeleton */}
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      </CardHeader>

      <CardContent className="pl-8 space-y-4">
        {/* Content skeletons */}
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-3/4 rounded-md" />
        <Skeleton className="h-10 w-1/2 rounded-md" />
      </CardContent>
    </Card>
  );
}
