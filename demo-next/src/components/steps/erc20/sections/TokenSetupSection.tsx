'use client';

/**
 * Section 1: 토큰 설정
 *
 * 탭 모드에 따라:
 * - deploy: 토큰 초기값 입력 + 배포
 * - interact: 토큰 주소 입력/조회
 */

import { useEffect } from 'react';
import { isAddress } from 'viem';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { SectionCard } from '@/components/shared/SectionCard';
import { AddressDisplay } from '@/components/shared/AddressDisplay';
import { useErc20Store } from '@/store/useErc20Store';
import { useErc20TokenInfo } from '@/hooks/useErc20TokenInfo';
import { useInjectedWallet } from '@/hooks/useInjectedWallet';
import { DeployTokenSheet } from '@/components/steps/erc20/DeployTokenSheet';
import { formatTokenAmountDisplay } from '@/lib/format';
import type { Address } from '@/domain/types';

interface TokenSetupSectionProps {
  /** 토큰 주소 직접 입력 필드 노출 여부 */
  showAddressInput?: boolean;
  /** 새 토큰 배포 버튼 노출 여부 */
  showDeployButton?: boolean;
}

export function TokenSetupSection({
  showAddressInput = true,
  showDeployButton = true,
}: TokenSetupSectionProps = {}) {
  const deployInlineMode = !showAddressInput && showDeployButton;

  const { address } = useInjectedWallet();
  const tokenAddress = useErc20Store((s) => s.tokenAddress);
  const setTokenAddress = useErc20Store((s) => s.setTokenAddress);
  const setTokenInfo = useErc20Store((s) => s.setTokenInfo);
  const setOwnerBalance = useErc20Store((s) => s.setOwnerBalance);

  const { tokenInfo, balance, isLoading, error } = useErc20TokenInfo(
    tokenAddress,
    address
  );

  useEffect(() => {
    setTokenInfo(tokenInfo);
  }, [tokenInfo, setTokenInfo]);

  useEffect(() => {
    setOwnerBalance(balance);
  }, [balance, setOwnerBalance]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val === '') {
      setTokenAddress(null);
    } else if (isAddress(val)) {
      setTokenAddress(val as Address);
    } else {
      setTokenAddress(null);
    }
  };

  const handleDeployed = (addr: Address) => {
    setTokenAddress(addr);
  };

  return (
    <SectionCard
      type="deploy"
      title={
        deployInlineMode
          ? '1. 토큰 초기값'
          : showAddressInput || showDeployButton
            ? '1. 토큰 설정'
            : '1. 토큰 정보'
      }
    >
      <div className="space-y-4">
        {showAddressInput && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label>토큰 주소</Label>
            </div>
            <Input
              type="text"
              value={tokenAddress ?? ''}
              onChange={handleAddressChange}
              placeholder="0x... (42자리 주소를 입력하면 자동 조회)"
              className="font-mono text-sm"
            />
          </div>
        )}

        {deployInlineMode && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              토큰명/심볼/수령자/소유자를 설정하고 즉시 배포합니다.
            </p>
            <DeployTokenSheet onDeployed={handleDeployed} />
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            토큰 정보 조회 중...
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {tokenInfo && (
          <div className="space-y-3 rounded-lg border border-green-300 bg-green-50 p-3 dark:border-green-700 dark:bg-green-950/30">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{tokenInfo.symbol}</Badge>
              <span className="text-sm font-medium">{tokenInfo.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Decimals:</span>{' '}
                <span className="font-mono">{tokenInfo.decimals}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Supply:</span>{' '}
                <span className="font-mono">
                  {formatTokenAmountDisplay(tokenInfo.totalSupply, tokenInfo.decimals)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">주소:</span>{' '}
                <AddressDisplay address={tokenAddress} showCopy chars={8} />
              </div>
              {balance != null && (
                <div>
                  <span className="text-muted-foreground">내 잔액:</span>{' '}
                  <span className="font-mono">
                    {formatTokenAmountDisplay(balance, tokenInfo.decimals)}{' '}
                    {tokenInfo.symbol}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
