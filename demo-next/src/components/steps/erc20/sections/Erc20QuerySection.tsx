'use client';

import { useMemo, useState } from 'react';
import { isAddress } from 'viem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusAlert } from '@/components/shared/StatusAlert';
import { TechDetail } from '@/components/shared/TechDetail';
import { TxHashDisplay } from '@/components/shared/TxHashDisplay';
import { useErc20Store } from '@/store/useErc20Store';
import { useErc20Query } from '@/hooks/useErc20Query';
import {
  formatBigIntWithCommas,
  formatTokenAmountDisplay,
} from '@/lib/format';
import { useChainClient } from '@/hooks/useChainClient';
import type { Address, Hash } from '@/domain/types';
import { logError } from '@/lib/error-handler';

export function Erc20QuerySection() {
  const tokenAddress = useErc20Store((s) => s.tokenAddress);
  const { chainId } = useChainClient();

  const {
    isLoading,
    error,
    snapshot,
    addressQuery,
    receipt,
    events,
    loadSnapshot,
    loadAddressQuery,
    loadReceiptWithEvents,
    loadEventsByRange,
  } = useErc20Query();

  const [balanceAddress, setBalanceAddress] = useState('');
  const [nonceOwner, setNonceOwner] = useState('');
  const [allowanceOwner, setAllowanceOwner] = useState('');
  const [allowanceSpender, setAllowanceSpender] = useState('');
  const [txHash, setTxHash] = useState('');
  const [fromBlock, setFromBlock] = useState('');
  const [toBlock, setToBlock] = useState('');
  const [rangeError, setRangeError] = useState<string | null>(null);

  const parsedRange = useMemo(() => {
    const parsed: { from?: bigint; to?: bigint; error: string | null } = { error: null };

    try {
      parsed.from = fromBlock.trim() ? BigInt(fromBlock) : undefined;
    } catch {
      return {
        error: 'fromBlock은 숫자만 입력 가능합니다',
        to: parsed.to,
      };
    }

    try {
      parsed.to = toBlock.trim() ? BigInt(toBlock) : undefined;
    } catch {
      return {
        error: 'toBlock은 숫자만 입력 가능합니다',
        from: parsed.from,
      };
    }

    return parsed;
  }, [fromBlock, toBlock]);

  const runSafe = (label: string, action: () => Promise<void>) => {
    action().catch((error) => logError(label, error));
  };

  const runBasicQuery = async () => {
    if (!tokenAddress) return;

    await loadSnapshot(tokenAddress);
    await loadAddressQuery(tokenAddress, {
      balanceAddress: isAddress(balanceAddress) ? (balanceAddress as Address) : null,
      nonceOwner: isAddress(nonceOwner) ? (nonceOwner as Address) : null,
      allowanceOwner: isAddress(allowanceOwner) ? (allowanceOwner as Address) : null,
      allowanceSpender: isAddress(allowanceSpender) ? (allowanceSpender as Address) : null,
    });
  };

  const runReceiptQuery = async () => {
    if (!txHash.trim()) return;
    await loadReceiptWithEvents(txHash.trim() as Hash);
  };

  const runEventQuery = async () => {
    if (!tokenAddress) return;
    if (parsedRange.error) {
      setRangeError(parsedRange.error);
      return;
    }
    setRangeError(null);
    await loadEventsByRange(tokenAddress, {
      fromBlock: parsedRange.from,
      toBlock: parsedRange.to,
    });
  };

  return (
    <SectionCard
      type="config"
      title="5. 조회/검증"
      description="기본 조회(상시) + 고급 조회(접기)"
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">기본 조회</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>balanceOf 대상 주소</Label>
                <Input
                  value={balanceAddress}
                  onChange={(e) => setBalanceAddress(e.target.value.trim())}
                  placeholder="0x..."
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label>nonces(owner) 주소</Label>
                <Input
                  value={nonceOwner}
                  onChange={(e) => setNonceOwner(e.target.value.trim())}
                  placeholder="0x..."
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label>allowance owner</Label>
                <Input
                  value={allowanceOwner}
                  onChange={(e) => setAllowanceOwner(e.target.value.trim())}
                  placeholder="0x..."
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label>allowance spender</Label>
                <Input
                  value={allowanceSpender}
                  onChange={(e) => setAllowanceSpender(e.target.value.trim())}
                  placeholder="0x..."
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <Button
              onClick={() => runSafe('Erc20QuerySection.runBasicQuery', runBasicQuery)}
              disabled={!tokenAddress || isLoading}
              className="w-full"
            >
              기본 조회 실행
            </Button>

            {snapshot && (
              <div className="grid grid-cols-1 gap-2 rounded-lg border p-3 text-xs md:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Name:</span> <span className="font-mono">{snapshot.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Symbol:</span> <span className="font-mono">{snapshot.symbol}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Decimals:</span> <span className="font-mono">{snapshot.decimals}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Supply:</span>{' '}
                  <span className="font-mono">
                    {formatTokenAmountDisplay(snapshot.totalSupply, snapshot.decimals)} {snapshot.symbol}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-muted-foreground">Owner:</span>{' '}
                  <span className="font-mono break-all">{snapshot.owner}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Paused:</span>{' '}
                  <span className="font-mono">{snapshot.paused ? 'true' : 'false'}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-muted-foreground">DOMAIN_SEPARATOR:</span>{' '}
                  <span className="font-mono break-all">{snapshot.domainSeparator}</span>
                </div>
              </div>
            )}

            {addressQuery && (
              <div className="grid grid-cols-1 gap-2 rounded-lg border p-3 text-xs md:grid-cols-3">
                <div>
                  <span className="text-muted-foreground">Balance:</span>{' '}
                  <span className="font-mono">
                    {addressQuery.balance != null
                      ? formatBigIntWithCommas(addressQuery.balance)
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Nonce:</span>{' '}
                  <span className="font-mono">
                    {addressQuery.nonce != null
                      ? formatBigIntWithCommas(addressQuery.nonce)
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Allowance:</span>{' '}
                  <span className="font-mono">
                    {addressQuery.allowance != null
                      ? formatBigIntWithCommas(addressQuery.allowance)
                      : '-'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <TechDetail label="고급 조회 (Tx 영수증 / 이벤트)">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tx 영수증 조회</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Tx Hash</Label>
                  <Input
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value.trim())}
                    placeholder="0x..."
                    className="font-mono text-sm"
                  />
                </div>
            <Button
              onClick={() => runSafe('Erc20QuerySection.runReceiptQuery', runReceiptQuery)}
              disabled={!txHash || isLoading}
              className="w-full"
            >
                  영수증 조회
                </Button>

                {receipt && (
                  <div className="space-y-2 rounded-lg border p-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Status:</span>{' '}
                      <span className="font-mono">{receipt.status}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Block:</span>{' '}
                      <span className="font-mono">{formatBigIntWithCommas(receipt.blockNumber)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gas Used:</span>{' '}
                      <span className="font-mono">{formatBigIntWithCommas(receipt.gasUsed)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Effective Gas Price:</span>{' '}
                      <span className="font-mono">
                        {receipt.effectiveGasPrice != null
                          ? formatBigIntWithCommas(receipt.effectiveGasPrice)
                          : '-'}
                      </span>
                    </div>
                    <TxHashDisplay txHash={receipt.transactionHash} chainId={chainId} variant="compact" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">이벤트 조회</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>fromBlock (기본: 최근 500)</Label>
                    <Input
                      value={fromBlock}
                      onChange={(e) => setFromBlock(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="예: 1234567"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>toBlock (기본: latest)</Label>
                    <Input
                      value={toBlock}
                      onChange={(e) => setToBlock(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="예: 1235567"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => runSafe('Erc20QuerySection.runEventQuery', runEventQuery)}
                  disabled={!tokenAddress || isLoading}
                  className="w-full"
                >
                  이벤트 조회
                </Button>

                {events.length > 0 && (
                  <div className="space-y-2 rounded-lg border p-3">
                    {events.map((event, index) => (
                      <div key={`${event.eventName}-${event.transactionHash}-${index}`} className="rounded border p-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Event:</span>{' '}
                          <span className="font-mono">{event.eventName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Block:</span>{' '}
                          <span className="font-mono">{formatBigIntWithCommas(event.blockNumber)}</span>
                        </div>
                        {event.transactionHash && (
                          <TxHashDisplay
                            txHash={event.transactionHash}
                            chainId={chainId}
                            variant="compact"
                          />
                        )}
                        <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-[11px]">
{JSON.stringify(event.args, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TechDetail>

                {error && <StatusAlert type="error" message={error} />}
                {rangeError && <StatusAlert type="error" message={rangeError} />}
      </div>
    </SectionCard>
  );
}
