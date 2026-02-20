/**
 * DeadlinePicker - 만료 시간 선택 컴포넌트
 *
 * RadioGroup으로 1시간/24시간/7일/무제한 중 하나를 선택합니다.
 * deadlineToTimestamp 헬퍼로 Unix timestamp(bigint) 변환을 제공합니다.
 */

'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type DeadlineValue = 'hour' | 'day' | 'week' | 'unlimited';

interface DeadlinePickerProps {
  /** 선택된 값 */
  value: DeadlineValue;
  /** 값 변경 콜백 */
  onChange: (value: DeadlineValue) => void;
  /** 추가 CSS 클래스 */
  className?: string;
}

const DEADLINE_OPTIONS: ReadonlyArray<{
  value: DeadlineValue;
  label: string;
  description: string;
}> = [
  { value: 'hour', label: '1시간', description: '지금부터 1시간 후' },
  { value: 'day', label: '24시간', description: '지금부터 24시간 후' },
  { value: 'week', label: '7일', description: '지금부터 7일 후' },
  { value: 'unlimited', label: '무제한', description: '만료 없음 (uint256 최대값)' },
] as const;

/**
 * 선택된 deadline 값을 Unix timestamp (bigint, 초 단위)로 변환
 *
 * @example
 * const deadline = deadlineToTimestamp('hour');
 * // → BigInt(현재시각 + 3600)
 */
export function deadlineToTimestamp(deadline: DeadlineValue): bigint {
  const now = BigInt(Math.floor(Date.now() / 1000));
  switch (deadline) {
    case 'hour':
      return now + 3600n;
    case 'day':
      return now + 86400n;
    case 'week':
      return now + 604800n;
    case 'unlimited':
      return 2n ** 256n - 1n;
  }
}

/**
 * 서명/만료 시나리오에서 사용할 마감 시간 선택 컴포넌트
 *
 * @example
 * <DeadlinePicker value={deadline} onChange={setDeadline} />
 */
export function DeadlinePicker({
  value,
  onChange,
  className,
}: DeadlinePickerProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as DeadlineValue)}
      className={cn('gap-2', className)}
      aria-label="마감 시간 선택"
    >
      {DEADLINE_OPTIONS.map((option) => (
        <Label
          key={option.value}
          htmlFor={`deadline-${option.value}`}
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
            'hover:bg-muted/50',
            value === option.value && 'border-primary bg-primary/5'
          )}
        >
          <RadioGroupItem
            value={option.value}
            id={`deadline-${option.value}`}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{option.label}</span>
            <span className="text-xs text-muted-foreground">
              {option.description}
            </span>
          </div>
        </Label>
      ))}
    </RadioGroup>
  );
}
