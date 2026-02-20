/**
 * TokenAmountInput - 토큰 수량 입력 컴포넌트
 *
 * 사람이 읽을 수 있는 단위로 토큰 수량을 입력합니다.
 * - 숫자와 소수점만 입력 허용
 * - "최대" 버튼으로 최대 금액 자동 입력
 * - 잔액 표시
 */

'use client';

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatTokenAmount } from '@/lib/format';
import { cn } from '@/lib/utils';

interface TokenAmountInputProps {
  /** 현재 입력값 (사람이 읽을 수 있는 단위) */
  value: string;
  /** 값 변경 콜백 */
  onChange: (value: string) => void;
  /** 토큰 소수점 자릿수 */
  decimals: number;
  /** 최대 금액 (raw bigint 단위) */
  maxAmount?: bigint | null;
  /** 토큰 심볼 (예: "CELB") */
  symbol?: string;
  /** 입력 필드 라벨 */
  label?: string;
  /** placeholder 텍스트 */
  placeholder?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

/** 숫자와 소수점만 허용하는 정규식 */
const VALID_AMOUNT_REGEX = /^[0-9]*\.?[0-9]*$/;

/**
 * 토큰 수량 입력 컴포넌트
 *
 * @example
 * <TokenAmountInput
 *   value={amount}
 *   onChange={setAmount}
 *   decimals={18}
 *   maxAmount={balance}
 *   symbol="CELB"
 *   label="전송할 수량"
 * />
 */
export function TokenAmountInput({
  value,
  onChange,
  decimals,
  maxAmount,
  symbol,
  label,
  placeholder = '0.0',
  className,
}: TokenAmountInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue === '' || VALID_AMOUNT_REGEX.test(newValue)) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  const handleMax = useCallback(() => {
    if (maxAmount != null) {
      onChange(formatTokenAmount(maxAmount, decimals));
    }
  }, [maxAmount, decimals, onChange]);

  const formattedMax =
    maxAmount != null ? formatTokenAmount(maxAmount, decimals) : null;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <Label>{label}</Label>}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            aria-label={label ?? '토큰 수량'}
          />
          {symbol && (
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
              {symbol}
            </span>
          )}
        </div>

        {maxAmount != null && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMax}
            aria-label="최대 금액 입력"
          >
            최대
          </Button>
        )}
      </div>

      {formattedMax != null && (
        <p className="text-xs text-muted-foreground">
          잔액: {formattedMax}
          {symbol ? ` ${symbol}` : ''}
        </p>
      )}
    </div>
  );
}
