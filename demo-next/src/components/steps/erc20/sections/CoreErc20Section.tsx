'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseUnits, isAddress } from 'viem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionCard } from '@/components/shared/SectionCard';
import { TokenAmountInput } from '@/components/shared/TokenAmountInput';
import { TransactionTracker } from '@/components/shared/TransactionTracker';
import { WalletRequiredGuard } from '@/components/shared/WalletRequiredGuard';
import { useErc20Store } from '@/store/useErc20Store';
import { useErc20TransferActions } from '@/hooks/useErc20TransferActions';
import { useChainClient } from '@/hooks/useChainClient';
import { useInjectedWallet } from '@/hooks/useInjectedWallet';
import { ERC20_PERMIT_ABI } from '@/infrastructure/contracts/CelebTokenContract';
import { formatTokenAmountDisplay } from '@/lib/format';
import { logError } from '@/lib/error-handler';
import type { Address } from '@/domain/types';

export function CoreErc20Section() {
  const { publicClient, chainId } = useChainClient();
  const { address } = useInjectedWallet();
  const {
    states,
    approve,
    transfer,
    transferFrom,
    burn,
    burnFrom,
  } = useErc20TransferActions();

  const tokenAddress = useErc20Store((s) => s.tokenAddress);
  const tokenInfo = useErc20Store((s) => s.tokenInfo);
  const ownerBalance = useErc20Store((s) => s.ownerBalance);
  const setOwnerBalance = useErc20Store((s) => s.setOwnerBalance);
  const currentAllowance = useErc20Store((s) => s.currentAllowance);
  const setCurrentAllowance = useErc20Store((s) => s.setCurrentAllowance);

  const [approveSpender, setApproveSpender] = useState('');
  const [approveAmount, setApproveAmount] = useState('');

  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const [transferFromOwner, setTransferFromOwner] = useState('');
  const [transferFromTo, setTransferFromTo] = useState('');
  const [transferFromAmount, setTransferFromAmount] = useState('');

  const [burnAmount, setBurnAmount] = useState('');
  const [burnFromOwner, setBurnFromOwner] = useState('');
  const [burnFromAmount, setBurnFromAmount] = useState('');

  const decimals = tokenInfo?.decimals ?? 18;

  const toAmount = useCallback(
    (value: string): bigint | null => {
      const trimmed = value.trim();
      if (!trimmed) return null;

      try {
        return parseUnits(trimmed, decimals);
      } catch {
        return null;
      }
    },
    [decimals]
  );
  
  const parsedApproveAmount = useMemo(() => toAmount(approveAmount), [approveAmount, toAmount]);
  const parsedTransferAmount = useMemo(() => toAmount(transferAmount), [toAmount, transferAmount]);
  const parsedTransferFromAmount = useMemo(() => toAmount(transferFromAmount), [toAmount, transferFromAmount]);
  const parsedBurnAmount = useMemo(() => toAmount(burnAmount), [toAmount, burnAmount]);
  const parsedBurnFromAmount = useMemo(() => toAmount(burnFromAmount), [toAmount, burnFromAmount]);

  const runSafe = useCallback((label: string, action: () => Promise<void>) => {
    action().catch((error) => logError(label, error));
  }, []);

  const refreshOwnerBalance = useCallback(async () => {
    if (!tokenAddress || !address) return;

    const balance = (await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_PERMIT_ABI,
      functionName: 'balanceOf',
      args: [address],
    })) as bigint;

    setOwnerBalance(balance);
  }, [address, publicClient, setOwnerBalance, tokenAddress]);

  const refreshAllowance = useCallback(
    async (owner: Address, spender: Address) => {
      if (!tokenAddress) return;

      const allowance = (await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_PERMIT_ABI,
        functionName: 'allowance',
        args: [owner, spender],
      })) as bigint;

      setCurrentAllowance(allowance);
    },
    [publicClient, setCurrentAllowance, tokenAddress]
  );

  useEffect(() => {
    if (!tokenAddress || !address) return;
    runSafe('CoreErc20Section.refreshOwnerBalance', refreshOwnerBalance);
    if (approveSpender && isAddress(approveSpender)) {
      runSafe('CoreErc20Section.refreshAllowance', () =>
        refreshAllowance(address, approveSpender as Address)
      );
    }
  }, [
    address,
    approveSpender,
    refreshAllowance,
    refreshOwnerBalance,
    runSafe,
    tokenAddress,
  ]);

  const runApprove = async () => {
    if (
      !tokenAddress ||
      !address ||
      !isAddress(approveSpender) ||
      !parsedApproveAmount
    ) {
      return;
    }
    await approve(tokenAddress, approveSpender as Address, parsedApproveAmount);
    await refreshAllowance(address, approveSpender as Address);
  };

  const runTransfer = async () => {
    if (!tokenAddress || !isAddress(transferTo) || !parsedTransferAmount) return;
    await transfer(tokenAddress, transferTo as Address, parsedTransferAmount);
    await refreshOwnerBalance();
  };

  const runTransferFrom = async () => {
    if (
      !tokenAddress ||
      !isAddress(transferFromOwner) ||
      !isAddress(transferFromTo) ||
      !parsedTransferFromAmount
    ) {
      return;
    }
    await transferFrom(
      tokenAddress,
      transferFromOwner as Address,
      transferFromTo as Address,
      parsedTransferFromAmount
    );

    await refreshOwnerBalance();
    await refreshAllowance(transferFromOwner as Address, address as Address);
  };

  const runBurn = async () => {
    if (!tokenAddress || !parsedBurnAmount) return;
    await burn(tokenAddress, parsedBurnAmount);
    await refreshOwnerBalance();
  };

  const runBurnFrom = async () => {
    if (!tokenAddress || !isAddress(burnFromOwner) || !parsedBurnFromAmount) return;
    await burnFrom(tokenAddress, burnFromOwner as Address, parsedBurnFromAmount);
    await refreshOwnerBalance();
    await refreshAllowance(burnFromOwner as Address, address as Address);
  };

  return (
    <SectionCard
      type="config"
      title="2. 코어 ERC20"
      description="approve / transfer / transferFrom / burn / burnFrom"
    >
      <WalletRequiredGuard message="ERC20 코어 트랜잭션을 위해 지갑을 연결해주세요">
        <div className="space-y-4">
          {tokenInfo && (
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 text-xs">
              <div>
                <span className="text-muted-foreground">내 잔액:</span>{' '}
                <span className="font-mono">
                  {ownerBalance !== null
                    ? `${formatTokenAmountDisplay(ownerBalance, tokenInfo.decimals)} ${tokenInfo.symbol}`
                    : '-'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">현재 Allowance:</span>{' '}
                <span className="font-mono">
                  {currentAllowance !== null
                    ? `${formatTokenAmountDisplay(currentAllowance, tokenInfo.decimals)} ${tokenInfo.symbol}`
                    : '-'}
                </span>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">approve(spender, amount)</CardTitle>
              <p className="text-xs text-muted-foreground">
                `spender`에게 `amount`만큼 토큰 사용 권한(allowance)을 부여합니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Spender</Label>
                <Input
                  value={approveSpender}
                  onChange={(e) => setApproveSpender(e.target.value.trim())}
                  placeholder="0x..."
                  className="font-mono text-sm"
                />
              </div>
              <TokenAmountInput
                value={approveAmount}
                onChange={setApproveAmount}
                decimals={decimals}
                symbol={tokenInfo?.symbol}
                label="승인 수량"
              />
              <Button
                onClick={() => runSafe('CoreErc20Section.runApprove', runApprove)}
                disabled={!tokenAddress || parsedApproveAmount === null || !isAddress(approveSpender)}
                className="w-full"
              >
                approve 실행
              </Button>
              <TransactionTracker
                status={states.approve.status}
                txHash={states.approve.txHash}
                chainId={chainId}
                error={states.approve.error}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">transfer(to, amount)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>받는 주소</Label>
                <Input
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value.trim())}
                  placeholder="0x..."
                  className="font-mono text-sm"
                />
              </div>
              <TokenAmountInput
                value={transferAmount}
                onChange={setTransferAmount}
                decimals={decimals}
                symbol={tokenInfo?.symbol}
                label="전송 수량"
              />
              <Button
                onClick={() => runSafe('CoreErc20Section.runTransfer', runTransfer)}
                disabled={!tokenAddress || parsedTransferAmount === null || !isAddress(transferTo)}
                className="w-full"
              >
                transfer 실행
              </Button>
              <TransactionTracker
                status={states.transfer.status}
                txHash={states.transfer.txHash}
                chainId={chainId}
                error={states.transfer.error}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">transferFrom(from, to, amount)</CardTitle>
              <p className="text-xs text-muted-foreground">
                승인된 allowance 범위 내에서 `from` 계정의 토큰을 `to`로 전송합니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>From (owner)</Label>
                  <Input
                    value={transferFromOwner}
                    onChange={(e) => setTransferFromOwner(e.target.value.trim())}
                    placeholder="0x..."
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>To</Label>
                  <Input
                    value={transferFromTo}
                    onChange={(e) => setTransferFromTo(e.target.value.trim())}
                    placeholder="0x..."
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <TokenAmountInput
                value={transferFromAmount}
                onChange={setTransferFromAmount}
                decimals={decimals}
                symbol={tokenInfo?.symbol}
                label="전송 수량"
              />
              <Button
                onClick={() => runSafe('CoreErc20Section.runTransferFrom', runTransferFrom)}
                disabled={
                  !tokenAddress ||
                  parsedTransferFromAmount === null ||
                  !isAddress(transferFromOwner) ||
                  !isAddress(transferFromTo)
                }
                className="w-full"
              >
                transferFrom 실행
              </Button>
              <TransactionTracker
                status={states.transferFrom.status}
                txHash={states.transferFrom.txHash}
                chainId={chainId}
                error={states.transferFrom.error}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">burn(amount)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TokenAmountInput
                value={burnAmount}
                onChange={setBurnAmount}
                decimals={decimals}
                symbol={tokenInfo?.symbol}
                label="소각 수량"
              />
              <Button
                onClick={() => runSafe('CoreErc20Section.runBurn', runBurn)}
                disabled={!tokenAddress || parsedBurnAmount === null}
                className="w-full"
              >
                burn 실행
              </Button>
              <TransactionTracker
                status={states.burn.status}
                txHash={states.burn.txHash}
                chainId={chainId}
                error={states.burn.error}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">burnFrom(account, amount)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>소각 대상 계정</Label>
                <Input
                  value={burnFromOwner}
                  onChange={(e) => setBurnFromOwner(e.target.value.trim())}
                  placeholder="0x..."
                  className="font-mono text-sm"
                />
              </div>
              <TokenAmountInput
                value={burnFromAmount}
                onChange={setBurnFromAmount}
                decimals={decimals}
                symbol={tokenInfo?.symbol}
                label="소각 수량"
              />
              <Button
                onClick={() => runSafe('CoreErc20Section.runBurnFrom', runBurnFrom)}
                disabled={!tokenAddress || parsedBurnFromAmount === null || !isAddress(burnFromOwner)}
                className="w-full"
              >
                burnFrom 실행
              </Button>
              <TransactionTracker
                status={states.burnFrom.status}
                txHash={states.burnFrom.txHash}
                chainId={chainId}
                error={states.burnFrom.error}
              />
            </CardContent>
          </Card>
        </div>
      </WalletRequiredGuard>
    </SectionCard>
  );
}
