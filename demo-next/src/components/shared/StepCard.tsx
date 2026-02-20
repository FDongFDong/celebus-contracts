/**
 * StepCard Component
 *
 * Step 번호와 제목이 있는 카드 컴포넌트
 * 접기/펼치기, 그라디언트 프로그레스 바, 카테고리별 색상 지원
 */

'use client';

import { useState, useSyncExternalStore } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Settings,
  Sliders,
  Zap,
  CheckCircle,
  ChevronDown,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StepCategory = 'setup' | 'config' | 'action' | 'result';

interface StepCardProps {
  stepNumber: number;
  title: string;
  description?: string;
  category?: StepCategory;
  /** @deprecated Use category instead */
  badgeColor?: 'default' | 'secondary' | 'destructive' | 'outline';
  isCompleted?: boolean;
  defaultOpen?: boolean;
  collapsible?: boolean;
  children: React.ReactNode;
  className?: string;
}

// 카테고리별 색상 및 아이콘
const categoryConfig: Record<
  StepCategory,
  { icon: LucideIcon; colorClass: string; gradientClass: string }
> = {
  setup: {
    icon: Settings,
    colorClass: 'text-[oklch(0.55_0.18_145)] dark:text-[oklch(0.65_0.15_145)]',
    gradientClass:
      'from-[oklch(0.65_0.18_145)] to-[oklch(0.55_0.15_160)]',
  },
  config: {
    icon: Sliders,
    colorClass: 'text-[oklch(0.5_0.2_250)] dark:text-[oklch(0.6_0.18_250)]',
    gradientClass:
      'from-[oklch(0.6_0.2_250)] to-[oklch(0.5_0.25_280)]',
  },
  action: {
    icon: Zap,
    colorClass: 'text-[oklch(0.55_0.22_35)] dark:text-[oklch(0.65_0.2_35)]',
    gradientClass:
      'from-[oklch(0.65_0.22_35)] to-[oklch(0.55_0.2_25)]',
  },
  result: {
    icon: CheckCircle,
    colorClass: 'text-[oklch(0.5_0.2_280)] dark:text-[oklch(0.6_0.18_280)]',
    gradientClass:
      'from-[oklch(0.6_0.2_280)] to-[oklch(0.5_0.22_300)]',
  },
};

/**
 * Step 카드 컴포넌트
 *
 * @param stepNumber - Step 번호 (1, 2, 3, ...)
 * @param title - Step 제목
 * @param description - Step 설명 (선택)
 * @param category - Step 카테고리 (setup, config, action, result)
 * @param isCompleted - 완료 상태 표시
 * @param defaultOpen - 초기 펼침 상태 (기본: true)
 * @param collapsible - 접기/펼치기 가능 여부 (기본: true)
 * @param children - 카드 내용
 * @param className - 추가 CSS 클래스
 */
export function StepCard({
  stepNumber,
  title,
  description,
  category = 'config',
  badgeColor: _badgeColor,
  isCompleted = false,
  defaultOpen = true,
  collapsible = true,
  children,
  className = '',
}: StepCardProps) {
  void _badgeColor;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // useSyncExternalStore로 마운트 상태 관리 (Hydration 일치 보장)
  const isMounted = useSyncExternalStore(
    () => () => {}, // subscribe - no-op, 상태 변경 없음
    () => true, // getSnapshot - 클라이언트에서 항상 true
    () => false // getServerSnapshot - 서버에서 항상 false
  );

  const config = categoryConfig[category];
  const CategoryIcon = config.icon;

  // Non-collapsible 버전
  if (!collapsible) {
    return (
      <Card
        variant="elevated"
        className={cn(
          'relative overflow-hidden mb-6 transition-all duration-300',
          isCompleted && 'ring-2 ring-[oklch(0.65_0.18_145)] ring-opacity-50',
          className
        )}
      >
        {/* Gradient Progress Bar */}
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b',
            config.gradientClass
          )}
        />

        <CardHeader className="pl-8">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="flex items-center gap-2">
              <CategoryIcon className={cn('h-4 w-4', config.colorClass)} />
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs font-mono px-2 py-0.5',
                  'bg-gradient-to-r opacity-90',
                  config.gradientClass,
                  'text-white dark:text-white'
                )}
              >
                STEP {stepNumber}
              </Badge>
            </div>
            <span className="flex-1">{title}</span>
            {isCompleted && (
              <CheckCircle className="h-5 w-5 text-[oklch(0.55_0.18_145)] dark:text-[oklch(0.65_0.15_145)]" />
            )}
          </CardTitle>
          {description && (
            <CardDescription className="pl-6">{description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="pl-8">{children}</CardContent>
      </Card>
    );
  }

  // SSR/초기 렌더링: Collapsible 없이 정적으로 렌더링 (hydration 불일치 방지)
  if (!isMounted) {
    return (
      <Card
        variant="elevated"
        className={cn(
          'relative overflow-hidden mb-6 transition-all duration-300',
          isCompleted && 'ring-2 ring-[oklch(0.65_0.18_145)] ring-opacity-50',
          className
        )}
      >
        {/* Gradient Progress Bar */}
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b',
            config.gradientClass
          )}
        />

        <CardHeader className="pl-8">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="flex items-center gap-2">
              <CategoryIcon className={cn('h-4 w-4', config.colorClass)} />
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs font-mono px-2 py-0.5',
                  'bg-gradient-to-r opacity-90',
                  config.gradientClass,
                  'text-white dark:text-white'
                )}
              >
                STEP {stepNumber}
              </Badge>
            </div>
            <span className="flex-1">{title}</span>
            {isCompleted && (
              <CheckCircle className="h-5 w-5 text-[oklch(0.55_0.18_145)] dark:text-[oklch(0.65_0.15_145)]" />
            )}
            <ChevronDown
              className={cn(
                'h-5 w-5 text-muted-foreground transition-transform duration-200',
                defaultOpen && 'rotate-180'
              )}
            />
          </CardTitle>
          {description && (
            <CardDescription className="pl-6">{description}</CardDescription>
          )}
        </CardHeader>

        {defaultOpen && (
          <CardContent className="pl-8">{children}</CardContent>
        )}
      </Card>
    );
  }

  // Collapsible 버전: 클라이언트에서만 렌더링 (Radix ID가 일관됨)
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        variant="elevated"
        className={cn(
          'relative overflow-hidden mb-6 transition-all duration-300',
          isCompleted && 'ring-2 ring-[oklch(0.65_0.18_145)] ring-opacity-50',
          className
        )}
      >
        {/* Gradient Progress Bar */}
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b',
            config.gradientClass
          )}
        />

        {/* Header만 Trigger로 감싸기 - 내부 버튼 클릭이 토글에 영향 안 줌 */}
        <CollapsibleTrigger asChild>
          <CardHeader className="pl-8 cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center gap-2">
                <CategoryIcon className={cn('h-4 w-4', config.colorClass)} />
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs font-mono px-2 py-0.5',
                    'bg-gradient-to-r opacity-90',
                    config.gradientClass,
                    'text-white dark:text-white'
                  )}
                >
                  STEP {stepNumber}
                </Badge>
              </div>
              <span className="flex-1">{title}</span>
              {isCompleted && (
                <CheckCircle className="h-5 w-5 text-[oklch(0.55_0.18_145)] dark:text-[oklch(0.65_0.15_145)]" />
              )}
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </CardTitle>
            {description && (
              <CardDescription className="pl-6">{description}</CardDescription>
            )}
          </CardHeader>
        </CollapsibleTrigger>

        {/* Content는 Trigger 밖에 - 버튼 클릭 등이 Collapsible 토글에 영향 안 줌 */}
        <CollapsibleContent className="collapsible-content">
          <CardContent className="pl-8">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

/**
 * Compact Step Card (헤더 없이 컨텐츠만)
 */
export function CompactStepCard({
  stepNumber,
  title,
  category = 'config',
  children,
  className = '',
}: {
  stepNumber: number;
  title: string;
  category?: StepCategory;
  children: React.ReactNode;
  className?: string;
}) {
  const config = categoryConfig[category];
  const CategoryIcon = config.icon;

  return (
    <div
      className={cn(
        'relative p-4 border rounded-lg mb-4',
        'bg-card/50 backdrop-blur-sm',
        'transition-all duration-200 hover:shadow-md',
        className
      )}
    >
      {/* Mini gradient bar */}
      <div
        className={cn(
          'absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-gradient-to-b',
          config.gradientClass
        )}
      />

      <div className="flex items-center gap-2 mb-3 pl-3">
        <CategoryIcon className={cn('h-3.5 w-3.5', config.colorClass)} />
        <Badge
          variant="outline"
          className="text-xs font-mono px-1.5 py-0"
        >
          STEP {stepNumber}
        </Badge>
        <span className="font-medium text-sm">{title}</span>
      </div>
      <div className="pl-3">{children}</div>
    </div>
  );
}

/**
 * Step Progress Indicator (여러 스텝 진행 상황 표시)
 */
export function StepProgress({
  currentStep,
  totalSteps,
  className = '',
}: {
  currentStep: number;
  totalSteps: number;
  className?: string;
}) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>
          Step {currentStep} of {totalSteps}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[oklch(0.6_0.2_250)] to-[oklch(0.5_0.25_280)] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
