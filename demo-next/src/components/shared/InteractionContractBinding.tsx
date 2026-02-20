'use client';

import { useState } from 'react';
import { getAddress, isAddress } from 'viem';
import type { Address } from '@/domain/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddressDisplay } from '@/components/shared/AddressDisplay';

interface InteractionContractBindingProps {
  title: string;
  description: string;
  address: Address | null;
  onChangeAddress: (address: Address | null) => void;
  inputPlaceholder?: string;
  applyLabel?: string;
}

export function InteractionContractBinding({
  title,
  description,
  address,
  onChangeAddress,
  inputPlaceholder = '0x...',
  applyLabel = '기존 배포 컨트랙트 등록',
}: InteractionContractBindingProps) {
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null
  );
  const effectiveInput = inputValue.length > 0 ? inputValue : (address ?? '');

  const handleApply = () => {
    const trimmed = effectiveInput.trim();
    if (!trimmed) {
      setMessage({
        type: 'error',
        text: '등록할 컨트랙트 주소를 입력해주세요.',
      });
      return;
    }

    if (!isAddress(trimmed)) {
      setMessage({
        type: 'error',
        text: '유효한 컨트랙트 주소 형식이 아닙니다.',
      });
      return;
    }

    const normalized = getAddress(trimmed) as Address;
    onChangeAddress(normalized);
    setInputValue('');
    setMessage({
      type: 'success',
      text: '컨트랙트 주소가 인터랙션 대상으로 등록되었습니다.',
    });
  };

  const handleClear = () => {
    onChangeAddress(null);
    setInputValue('');
    setMessage({
      type: 'success',
      text: '현재 컨트랙트 바인딩을 해제했습니다.',
    });
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">현재 바인딩:</span>
          {address ? (
            <>
              <Badge variant="secondary">등록됨</Badge>
              <AddressDisplay address={address} showCopy chars={8} />
            </>
          ) : (
            <Badge variant="outline">미등록</Badge>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="text"
            value={effectiveInput}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={inputPlaceholder}
            className="font-mono text-xs"
            autoComplete="off"
          />
          <Button type="button" onClick={handleApply}>
            {applyLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={!address}
          >
            해제
          </Button>
        </div>

        {message && (
          <p
            className={`text-xs ${
              message.type === 'error' ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
