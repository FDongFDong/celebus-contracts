'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAddress, parseUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionCard } from '@/components/shared/SectionCard';
import { TransactionTracker } from '@/components/shared/TransactionTracker';
import { useErc20Store } from '@/store/useErc20Store';
import { useErc20AdminActions } from '@/hooks/useErc20AdminActions';
import { useChainClient } from '@/hooks/useChainClient';
import { logError } from '@/lib/error-handler';

export function AdminSection() {
  const { chainId } = useChainClient();
  const tokenAddress = useErc20Store((s) => s.tokenAddress);
  const tokenInfo = useErc20Store((s) => s.tokenInfo);

  const {
    ownerAddress,
    paused,
    isOwner,
    states,
    refreshOwnerState,
    mint,
    pause,
    unpause,
    transferOwnership,
  } = useErc20AdminActions(tokenAddress);

  const [mintTo, setMintTo] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [newOwner, setNewOwner] = useState('');

  const decimals = tokenInfo?.decimals ?? 18;
  const parsedMintAmount = useMemo(() => {
    const trimmed = mintAmount.trim();
    if (!trimmed) return null;
    try {
      return parseUnits(trimmed, decimals);
    } catch {
      return null;
    }
  }, [decimals, mintAmount]);

  const runSafe = useCallback((label: string, action: () => Promise<void>) => {
    action().catch((error) => logError(label, error));
  }, []);

  useEffect(() => {
    if (!tokenAddress) return;
    runSafe('AdminSection.refreshOwnerState', refreshOwnerState);
  }, [refreshOwnerState, runSafe, tokenAddress]);

  return (
    <SectionCard
      type="entity"
      title="4. 관리자 기능"
      description="owner 전용: mint / pause / unpause / transferOwnership"
    >
      <div className="space-y-4">
        <div className="rounded-lg border p-3 text-xs">
          <div>
            <span className="text-muted-foreground">현재 Owner:</span>{' '}
            <span className="font-mono break-all">{ownerAddress ?? '-'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Paused:</span>{' '}
            <span className="font-mono">{paused == null ? '-' : paused ? 'true' : 'false'}</span>
          </div>
          {!isOwner && (
            <p className="mt-2 text-amber-600 dark:text-amber-400">
              현재 연결된 지갑은 owner가 아니므로 관리자 기능은 비활성화됩니다.
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">mint(to, amount)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>받는 주소</Label>
              <Input
                value={mintTo}
                onChange={(e) => setMintTo(e.target.value.trim())}
                placeholder="0x..."
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>발행 수량</Label>
              <Input
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                placeholder="1000"
              />
            </div>
            <Button
              onClick={() => {
                if (!parsedMintAmount) return;
                runSafe('AdminSection.mint', () => mint(mintTo as `0x${string}`, parsedMintAmount));
              }}
              disabled={!isOwner || !isAddress(mintTo) || parsedMintAmount === null}
              className="w-full"
            >
              mint 실행
            </Button>
            <TransactionTracker
              status={states.mint.status}
              txHash={states.mint.txHash}
              chainId={chainId}
              error={states.mint.error}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">pause()</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => runSafe('AdminSection.pause', pause)}
                disabled={!isOwner || paused === true}
                className="w-full"
              >
                pause 실행
              </Button>
              <TransactionTracker
                status={states.pause.status}
                txHash={states.pause.txHash}
                chainId={chainId}
                error={states.pause.error}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">unpause()</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => runSafe('AdminSection.unpause', unpause)}
                disabled={!isOwner || paused === false}
                className="w-full"
              >
                unpause 실행
              </Button>
              <TransactionTracker
                status={states.unpause.status}
                txHash={states.unpause.txHash}
                chainId={chainId}
                error={states.unpause.error}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">transferOwnership(newOwner)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>새 Owner 주소</Label>
              <Input
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value.trim())}
                placeholder="0x..."
                className="font-mono text-sm"
              />
            </div>
            <Button
              onClick={() =>
                runSafe('AdminSection.transferOwnership', () =>
                  transferOwnership(newOwner as `0x${string}`)
                )
              }
              disabled={!isOwner || !isAddress(newOwner)}
              className="w-full"
            >
              ownership 이전 실행
            </Button>
            <TransactionTracker
              status={states.transferOwnership.status}
              txHash={states.transferOwnership.txHash}
              chainId={chainId}
              error={states.transferOwnership.error}
            />
          </CardContent>
        </Card>
      </div>
    </SectionCard>
  );
}
