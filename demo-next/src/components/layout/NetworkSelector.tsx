/**
 * NetworkSelector Component
 *
 * 글로벌 네트워크 선택기
 * 헤더에서 사용하며, 드롭다운으로 네트워크 전환 가능
 */

'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { selectableChains, switchNetwork, getChainById } from '@/infrastructure/config/chains';
import {
  MAINNET_NETWORK_CONFIRM_KEY,
  requiresMainnetSafetyConfirm,
} from '@/lib/network-safety';
import { logError } from '@/lib/error-handler';
import { toast } from 'sonner';

interface NetworkSelectorProps {
  isOnline: boolean;
  className?: string;
}

export function NetworkSelector({ isOnline, className }: NetworkSelectorProps) {
  const selectedChainId = useAppStore((s) => s.selectedChainId);
  const setSelectedChainId = useAppStore((s) => s.setSelectedChainId);

  const [isSwitching, setIsSwitching] = useState(false);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [pendingChainId, setPendingChainId] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // 현재 선택된 체인 정보
  const selectedChain = getChainById(selectedChainId);

  // 지갑 연결 상태
  const connectedWalletAddress = useAppStore((s) => s.connectedWalletAddress);
  const isWalletConnected = connectedWalletAddress !== null;

  /**
   * MetaMask 체인 변경 감지 - 지갑 연결 후에만 활성화
   *
   * 페이지 로드 시 window.ethereum에 접근하면 Phantom 등
   * 다중 지갑 확장이 선택 팝업을 띄우므로, 연결 후에만 접근.
   */
  useEffect(() => {
    if (!isWalletConnected) return;
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleChainChanged = (chainIdHex: unknown) => {
      const newChainId = parseInt(chainIdHex as string, 16);
      setWalletChainId(newChainId);

      // 지원하는 체인이면 자동 동기화
      const supported = selectableChains.find((c) => c.id === newChainId);
      if (supported) {
        setSelectedChainId(newChainId);
      }
    };

    // 연결 직후 현재 체인 ID 가져오기
    window.ethereum
      .request({ method: 'eth_chainId' })
      .then((chainIdHex) => {
        const chainId = parseInt(chainIdHex as string, 16);
        setWalletChainId(chainId);
      })
      .catch(() => {
        // 무시
      });

    window.ethereum?.on?.('chainChanged', handleChainChanged);
    return () => {
      window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [isWalletConnected, setSelectedChainId]);

  const handleNetworkChange = async (chainId: number) => {
    if (chainId === selectedChainId) return;

    try {
      setIsSwitching(true);
      const chain = getChainById(chainId);

      if (!isWalletConnected) {
        setSelectedChainId(chainId);
        toast.success(`${chain.name}으로 전환되었습니다 (지갑 미연결)`);
        return;
      }

      // MetaMask 네트워크 전환 요청
      await switchNetwork(chainId);

      // 성공 시 상태 업데이트
      setSelectedChainId(chainId);
      toast.success(`${chain.name}으로 전환되었습니다`);
    } catch (error) {
      // 사용자가 취소한 경우
      if ((error as { code?: number })?.code === 4001) {
        toast.info('네트워크 전환이 취소되었습니다');
      } else {
        const message = error instanceof Error ? error.message : '네트워크 전환 실패';
        toast.error(message);
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const hasMainnetConfirmation = () => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(MAINNET_NETWORK_CONFIRM_KEY) === '1';
    } catch {
      return false;
    }
  };

  const markMainnetConfirmation = () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(MAINNET_NETWORK_CONFIRM_KEY, '1');
    } catch {
      // localStorage 저장 실패 시 무시
    }
  };

  const handleNetworkSelect = (chainId: number) => {
    if (chainId === selectedChainId) return;

    const needsConfirmation =
      requiresMainnetSafetyConfirm(chainId) && !hasMainnetConfirmation();

    if (needsConfirmation) {
      setPendingChainId(chainId);
      setIsConfirmOpen(true);
      return;
    }

    runSafe('NetworkSelector.switchNetwork', () => handleNetworkChange(chainId));
  };

  const closeConfirmModal = () => {
    setIsConfirmOpen(false);
    setPendingChainId(null);
  };

  const handleConfirmMainnetSwitch = async () => {
    if (!pendingChainId) return;
    markMainnetConfirmation();
    const targetChainId = pendingChainId;
    closeConfirmModal();
    await handleNetworkChange(targetChainId);
  };

  const runSafe = (label: string, action: () => Promise<unknown> | unknown) => {
    Promise.resolve()
      .then(action)
      .catch((error) => logError(label, error));
  };

  // 지갑 체인과 선택된 체인이 다른지 확인
  const isChainMismatch =
    isWalletConnected && walletChainId !== null && walletChainId !== selectedChainId;

  const pendingChain = pendingChainId ? getChainById(pendingChainId) : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isSwitching}
            className={cn(
              'flex items-center gap-1.5 px-3',
              'transition-all duration-200',
              isOnline
                ? isChainMismatch
                  ? 'border-[oklch(0.65_0.2_60)] text-[oklch(0.5_0.18_60)] dark:text-[oklch(0.8_0.15_60)]'
                  : 'border-[oklch(0.65_0.18_145)] text-[oklch(0.45_0.15_145)] dark:text-[oklch(0.75_0.15_145)]'
                : 'border-[oklch(0.55_0.22_25)] text-[oklch(0.45_0.18_25)] dark:text-[oklch(0.75_0.18_25)]',
              className
            )}
          >
            {isSwitching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isOnline ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}

            <span className="max-w-[7.5rem] truncate text-xs font-medium sm:max-w-[9rem]">
              {isOnline ? selectedChain.name : 'Offline'}
            </span>

            {isOnline && !isSwitching && (
              <>
                <span className="relative flex h-2 w-2">
                  <span
                    className={cn(
                      'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                      isChainMismatch ? 'bg-[oklch(0.65_0.2_60)]' : 'bg-[oklch(0.65_0.18_145)]'
                    )}
                  />
                  <span
                    className={cn(
                      'relative inline-flex rounded-full h-2 w-2',
                      isChainMismatch ? 'bg-[oklch(0.6_0.2_60)]' : 'bg-[oklch(0.55_0.18_145)]'
                    )}
                  />
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          {selectableChains.map((chain) => (
            <DropdownMenuItem
              key={chain.id}
              onClick={() => handleNetworkSelect(chain.id)}
              className={cn(
                'flex items-center justify-between',
                chain.id === selectedChainId && 'bg-accent'
              )}
            >
              <span>{chain.name}</span>
              {chain.id === selectedChainId && (
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[oklch(0.55_0.18_145)]" />
                </span>
              )}
              {isWalletConnected &&
                chain.id === walletChainId &&
                chain.id !== selectedChainId && (
                <span className="text-xs text-muted-foreground">(지갑)</span>
              )}
            </DropdownMenuItem>
          ))}

          {isChainMismatch && (
            <>
              <div className="h-px bg-border my-1" />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                지갑 네트워크가 다릅니다
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isConfirmOpen && pendingChain && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-base">메인넷 전환 확인</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {pendingChain.name}은 메인넷입니다. 실제 자산이 소모될 수 있습니다.
              </p>
              <p className="text-xs text-muted-foreground">
                확인 후에는 이 경고를 다시 표시하지 않습니다.
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={closeConfirmModal}>
                  취소
                </Button>
                <Button onClick={() => runSafe('NetworkSelector.confirmMainnetSwitch', handleConfirmMainnetSwitch)}>
                  계속 전환
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
