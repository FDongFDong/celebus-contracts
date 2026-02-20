'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExplorerLink } from '@/components/shared/ExplorerLink';
import { formatTxHash } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface TxHashDisplayProps {
  txHash: string;
  chainId?: number;
  label?: string;
  showCopy?: boolean;
  showExplorer?: boolean;
  variant?: 'compact' | 'default';
  className?: string;
}

export async function copyTxHashToClipboard(txHash: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(txHash);
    return true;
  } catch {
    return false;
  }
}

export function TxHashDisplay({
  txHash,
  chainId,
  label = 'TX ID',
  showCopy = true,
  showExplorer = true,
  variant = 'compact',
  className,
}: TxHashDisplayProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleCopy = async () => {
    const success = await copyTxHashToClipboard(txHash);
    if (success) {
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } else {
      setCopied(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        variant === 'default' ? 'text-sm' : 'text-xs',
        className
      )}
    >
      <span className="text-muted-foreground">{label}:</span>
      <code className="font-mono break-all" title={txHash}>
        {formatTxHash(txHash)}
      </code>

      {showCopy && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          aria-label={copied ? '복사됨' : '트랜잭션 해시 복사'}
          className="text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3 text-green-500" />
          ) : (
            <Copy className="size-3" />
          )}
        </Button>
      )}

      {showExplorer && (
        <ExplorerLink
          type="tx"
          value={txHash}
          chainId={chainId}
          variant="button"
          className={variant === 'compact' ? 'h-6 px-2 text-xs' : undefined}
        />
      )}
    </div>
  );
}
