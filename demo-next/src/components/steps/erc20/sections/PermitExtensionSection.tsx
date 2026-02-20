'use client';

import { useCallback, useMemo } from 'react';
import { parseUnits, isAddress } from 'viem';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/shared/SectionCard';
import { AddressDisplay } from '@/components/shared/AddressDisplay';
import { TokenAmountInput } from '@/components/shared/TokenAmountInput';
import { DeadlinePicker, deadlineToTimestamp } from '@/components/shared/DeadlinePicker';
import { TransactionTracker } from '@/components/shared/TransactionTracker';
import { WalletRequiredGuard } from '@/components/shared/WalletRequiredGuard';
import { TechDetail } from '@/components/shared/TechDetail';
import { useErc20Store } from '@/store/useErc20Store';
import { useErc20PermitApprove } from '@/hooks/useErc20PermitApprove';
import { useInjectedWallet } from '@/hooks/useInjectedWallet';
import { useChainClient } from '@/hooks/useChainClient';
import { formatTokenAmountDisplay } from '@/lib/format';
import { logError } from '@/lib/error-handler';
import type { Address } from '@/domain/types';

export function PermitExtensionSection() {
  const { address } = useInjectedWallet();
  const { chainId } = useChainClient();
  const { approve, isLoading } = useErc20PermitApprove();

  const tokenAddress = useErc20Store((s) => s.tokenAddress);
  const tokenInfo = useErc20Store((s) => s.tokenInfo);
  const spenderAddress = useErc20Store((s) => s.spenderAddress);
  const setSpenderAddress = useErc20Store((s) => s.setSpenderAddress);
  const approveAmount = useErc20Store((s) => s.approveAmount);
  const setApproveAmount = useErc20Store((s) => s.setApproveAmount);
  const deadline = useErc20Store((s) => s.deadline);
  const setDeadline = useErc20Store((s) => s.setDeadline);
  const approveStatus = useErc20Store((s) => s.approveStatus);
  const approveTxHash = useErc20Store((s) => s.approveTxHash);
  const approveError = useErc20Store((s) => s.approveError);
  const ownerBalance = useErc20Store((s) => s.ownerBalance);
  const currentAllowance = useErc20Store((s) => s.currentAllowance);
  const nonce = useErc20Store((s) => s.nonce);
  const domainSeparator = useErc20Store((s) => s.domainSeparator);
  const signature = useErc20Store((s) => s.signature);

  const handleSpenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val === '') {
      setSpenderAddress(null);
      return;
    }

    setSpenderAddress(val as Address);
  };

  const parsedApproveAmount = useMemo(() => {
    const trimmed = approveAmount.trim();
    if (!trimmed || !tokenInfo) return null;

    try {
      return parseUnits(trimmed, tokenInfo.decimals);
    } catch {
      return null;
    }
  }, [approveAmount, tokenInfo]);

  const handlePermitApprove = useCallback(async () => {
    if (
      !tokenAddress ||
      !spenderAddress ||
      !address ||
      !tokenInfo ||
      parsedApproveAmount === null ||
      parsedApproveAmount === 0n
    ) {
      return;
    }
    const deadlineBigint = deadlineToTimestamp(deadline);

    await approve({
      tokenAddress,
      spenderAddress,
      amount: parsedApproveAmount,
      deadline: deadlineBigint,
      ownerAddress: address,
    });
  }, [address, approve, deadline, parsedApproveAmount, spenderAddress, tokenAddress, tokenInfo]);

  const canSubmit = useMemo(
    () =>
      Boolean(tokenAddress) &&
      Boolean(address) &&
      Boolean(tokenInfo) &&
      parsedApproveAmount !== null &&
      parsedApproveAmount > 0n &&
      Boolean(spenderAddress) &&
      isAddress(spenderAddress ?? ''),
    [address, parsedApproveAmount, spenderAddress, tokenAddress, tokenInfo]
  );

  const runSafe = (label: string, action: () => Promise<void>) => {
    action().catch((error) => logError(label, error));
  };

  return (
    <SectionCard
      type="executor"
      title="3. Permit 확장"
      description="ERC20Permit(EIP-2612)로 서명 + permit() 실행"
    >
      <WalletRequiredGuard message="Permit 서명을 위해 지갑을 연결해주세요">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label>Spender 주소</Label>
            <Input
              type="text"
              value={spenderAddress ?? ''}
              onChange={handleSpenderChange}
              placeholder="0x..."
              className="font-mono text-sm"
            />
          </div>

          <TokenAmountInput
            value={approveAmount}
            onChange={setApproveAmount}
            decimals={tokenInfo?.decimals ?? 18}
            maxAmount={ownerBalance}
            symbol={tokenInfo?.symbol}
            label="Permit 승인 수량"
          />

          <div className="flex flex-col gap-1.5">
            <Label>유효 기간</Label>
            <DeadlinePicker value={deadline} onChange={setDeadline} />
          </div>

          <Button
            onClick={() => runSafe('PermitExtensionSection.handlePermitApprove', handlePermitApprove)}
            disabled={!canSubmit || isLoading}
            className="w-full"
          >
            {isLoading ? '처리 중...' : '서명 + permit 실행'}
          </Button>

          <TransactionTracker
            status={approveStatus}
            txHash={approveTxHash}
            chainId={chainId}
            error={approveError}
          />

          {currentAllowance != null && tokenInfo && (
            <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
              <span className="text-muted-foreground">현재 Allowance:</span>
              <span className="font-mono font-medium">
                {formatTokenAmountDisplay(currentAllowance, tokenInfo.decimals)} {tokenInfo.symbol}
              </span>
            </div>
          )}

          <TechDetail label="기술 세부사항">
            <div className="space-y-2 text-xs font-mono">
              {nonce != null && (
                <div>
                  <span className="text-muted-foreground">Nonce:</span> {nonce.toString()}
                </div>
              )}

              {domainSeparator && (
                <div>
                  <span className="text-muted-foreground">DOMAIN_SEPARATOR:</span>{' '}
                  <span className="break-all">{domainSeparator}</span>
                </div>
              )}

              {signature && (
                <>
                  <div>
                    <span className="text-muted-foreground">Signature:</span>{' '}
                    <span className="break-all">{signature.full}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-muted-foreground">v:</span> {signature.v}
                    </div>
                    <div>
                      <span className="text-muted-foreground">r:</span>{' '}
                      <AddressDisplay
                        address={signature.r as `0x${string}`}
                        showCopy
                        showExplorer={false}
                        chars={8}
                      />
                    </div>
                    <div>
                      <span className="text-muted-foreground">s:</span>{' '}
                      <AddressDisplay
                        address={signature.s as `0x${string}`}
                        showCopy
                        showExplorer={false}
                        chars={8}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </TechDetail>
        </div>
      </WalletRequiredGuard>
    </SectionCard>
  );
}
