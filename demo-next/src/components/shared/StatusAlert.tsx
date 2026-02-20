/**
 * StatusAlert Component
 *
 * 상태에 따라 다른 아이콘과 스타일을 가진 Alert 컴포넌트
 * Success, Error, Warning, Info, Loading 5가지 타입 지원
 * OKLch 색상으로 다크모드 최적화
 */

'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface StatusAlertProps {
  type: StatusType;
  title?: string;
  message: string;
  details?: string;
  className?: string;
  animate?: boolean;
}

const icons: Record<StatusType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

const variants: Record<StatusType, 'default' | 'destructive'> = {
  success: 'default',
  error: 'destructive',
  warning: 'default',
  info: 'default',
  loading: 'default',
};

// OKLch 기반 색상 - 라이트/다크 모드 자동 전환
const colorClasses: Record<StatusType, string> = {
  success: cn(
    'border-[oklch(0.65_0.18_145)] bg-[oklch(0.95_0.05_145)] text-[oklch(0.35_0.15_145)]',
    'dark:border-[oklch(0.55_0.15_145)] dark:bg-[oklch(0.25_0.08_145)] dark:text-[oklch(0.85_0.12_145)]'
  ),
  error: cn(
    'border-[oklch(0.55_0.22_25)] bg-[oklch(0.95_0.05_25)] text-[oklch(0.45_0.18_25)]',
    'dark:border-[oklch(0.55_0.2_25)] dark:bg-[oklch(0.25_0.1_25)] dark:text-[oklch(0.85_0.15_25)]'
  ),
  warning: cn(
    'border-[oklch(0.75_0.15_85)] bg-[oklch(0.97_0.04_85)] text-[oklch(0.45_0.12_85)]',
    'dark:border-[oklch(0.65_0.15_85)] dark:bg-[oklch(0.28_0.08_85)] dark:text-[oklch(0.9_0.1_85)]'
  ),
  info: cn(
    'border-[oklch(0.6_0.18_250)] bg-[oklch(0.96_0.03_250)] text-[oklch(0.4_0.15_250)]',
    'dark:border-[oklch(0.55_0.18_250)] dark:bg-[oklch(0.25_0.08_250)] dark:text-[oklch(0.85_0.12_250)]'
  ),
  loading: cn(
    'border-[oklch(0.7_0_0)] bg-[oklch(0.97_0_0)] text-[oklch(0.4_0_0)]',
    'dark:border-[oklch(0.5_0_0)] dark:bg-[oklch(0.25_0_0)] dark:text-[oklch(0.85_0_0)]'
  ),
};

// 아이콘 색상
const iconClasses: Record<StatusType, string> = {
  success: 'text-[oklch(0.55_0.18_145)] dark:text-[oklch(0.7_0.15_145)]',
  error: 'text-[oklch(0.5_0.22_25)] dark:text-[oklch(0.65_0.2_25)]',
  warning: 'text-[oklch(0.65_0.15_85)] dark:text-[oklch(0.75_0.15_85)]',
  info: 'text-[oklch(0.5_0.18_250)] dark:text-[oklch(0.65_0.18_250)]',
  loading: 'text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)]',
};

/**
 * 상태 Alert 컴포넌트
 *
 * @param type - Alert 타입 (success, error, warning, info, loading)
 * @param title - Alert 제목 (선택)
 * @param message - Alert 메시지
 * @param details - 추가 세부정보 (선택)
 * @param className - 추가 CSS 클래스
 * @param animate - 입장 애니메이션 활성화 (기본: true)
 */
export function StatusAlert({
  type,
  title,
  message,
  details,
  className = '',
  animate = true,
}: StatusAlertProps) {
  const Icon = icons[type];

  return (
    <Alert
      variant={variants[type]}
      className={cn(
        colorClasses[type],
        'transition-all duration-300',
        animate && 'animate-fade-in-up',
        className
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4',
          iconClasses[type],
          type === 'loading' && 'animate-spin'
        )}
      />
      {title && <AlertTitle className="font-semibold">{title}</AlertTitle>}
      <AlertDescription>
        <div className="text-sm">{message}</div>
        {details && (
          <div className="text-xs mt-2 opacity-80 font-mono break-all">
            {details}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Inline Status Badge (작은 인라인 상태 표시)
 */
export function StatusBadge({
  type,
  label,
  pulse = false,
}: {
  type: StatusType;
  label: string;
  pulse?: boolean;
}) {
  const Icon = icons[type];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        'transition-all duration-200',
        colorClasses[type],
        pulse && 'pulse-glow'
      )}
    >
      <Icon
        className={cn(
          'h-3 w-3',
          iconClasses[type],
          type === 'loading' && 'animate-spin'
        )}
      />
      {label}
    </span>
  );
}
