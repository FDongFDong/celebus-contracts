/**
 * Header Component
 *
 * 글래스모피즘 배경의 헤더 컴포넌트
 * 네트워크 상태 배지, 다크모드 토글 포함
 */

'use client';

import { useCallback, useState, useEffect, useSyncExternalStore } from 'react';
import { Moon, Sun, Wallet, LogOut, RefreshCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { requestActiveAddress } from '@/lib/injected-wallet';
import { useNativeBalance } from '@/hooks/useNativeBalance';
import { toast } from 'sonner';
import type { Address } from '@/domain/types';
import { formatAddress } from '@/lib/format';
import { NetworkSelector } from './NetworkSelector';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

// 서버 렌더링 시 기본값
const getServerOnlineSnapshot = () => true;
const getServerMountedSnapshot = () => false;
const getServerDarkSnapshot = () => false;

// 온라인 상태 구독
function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineStatus() {
  return navigator.onLine;
}

// 마운트 상태 (항상 true on client)
function subscribeMounted() {
  return () => {};
}

function getMountedSnapshot() {
  return true;
}

// 다크모드 상태 구독
function subscribeToDarkMode(callback: () => void) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);

  // storage 이벤트로 다른 탭 동기화
  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'theme') callback();
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    mediaQuery.removeEventListener('change', callback);
    window.removeEventListener('storage', handleStorage);
  };
}

function getDarkModeSnapshot() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') return true;
  if (savedTheme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * 메인 헤더 컴포넌트
 */
export function Header({
  title = 'Celebus Voting Demo',
  subtitle = 'EIP-712 Batch Signature Demo for Celebus Voting Platform',
  className = '',
}: HeaderProps) {
  // -------------------------------------------------------------------------
  // Store State - 전역 지갑 연결 상태
  // -------------------------------------------------------------------------
  const connectedWalletAddress = useAppStore((s) => s.connectedWalletAddress);
  const setConnectedWalletAddress = useAppStore((s) => s.setConnectedWalletAddress);
  const { formattedBalance, symbol, isLoading: isBalanceLoading, error: balanceError } = useNativeBalance(
    connectedWalletAddress
  );

  // -------------------------------------------------------------------------
  // Local State
  // -------------------------------------------------------------------------
  const [isConnecting, setIsConnecting] = useState(false);

  // useSyncExternalStore로 모든 외부 상태 구독
  const isOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineStatus,
    getServerOnlineSnapshot
  );

  const mounted = useSyncExternalStore(
    subscribeMounted,
    getMountedSnapshot,
    getServerMountedSnapshot
  );

  const isDark = useSyncExternalStore(
    subscribeToDarkMode,
    getDarkModeSnapshot,
    getServerDarkSnapshot
  );

  // 다크모드 토글 (DOM 직접 조작 - 외부 시스템 업데이트)
  const toggleDarkMode = useCallback(() => {
    const newDark = !isDark;

    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // storage 이벤트 트리거하여 재렌더링
    window.dispatchEvent(new StorageEvent('storage', { key: 'theme' }));
  }, [isDark]);

  // 초기 다크모드 클래스 설정 (렌더 중 DOM 변경 방지)
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', isDark);
  }, [mounted, isDark]);

  // -------------------------------------------------------------------------
  // Effects - MetaMask 계정 변경 감지 (지갑 연결 후에만 활성화)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!connectedWalletAddress) return;
    if (typeof window === 'undefined' || !window.ethereum?.on) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const list = Array.isArray(accounts) ? accounts : [];
      setConnectedWalletAddress((list[0] as Address) ?? null);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
    };
  }, [connectedWalletAddress, setConnectedWalletAddress]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const address = await requestActiveAddress();
      setConnectedWalletAddress(address);
      toast.success('지갑 연결 완료!');
    } catch (error) {
      // 사용자가 연결을 거부한 경우 (MetaMask error code 4001)
      const errorCode = (error as { code?: number })?.code;
      const message = error instanceof Error ? error.message : '연결 실패';

      if (errorCode === 4001 || message.includes('User rejected') || message.includes('User denied')) {
        toast.info('지갑 연결이 취소되었습니다');
      } else {
        toast.error(message);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setConnectedWalletAddress(null);
    toast.info('지갑 연결 해제됨');
  };

  /**
   * 계정 변경 - wallet_requestPermissions로 계정 선택 UI 표시
   */
  const handleSwitchAccount = async () => {
    try {
      if (!window.ethereum) {
        toast.error('지갑을 찾을 수 없습니다');
        return;
      }

      setIsConnecting(true);

      // wallet_requestPermissions를 호출하면 MetaMask가 계정 선택 UI를 표시
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      // 새로 선택된 계정 가져오기
      const accounts = (await window.ethereum.request({
        method: 'eth_accounts',
      })) as string[];

      const newAddress = accounts[0] as Address | undefined;
      if (newAddress) {
        setConnectedWalletAddress(newAddress);
        toast.success('계정이 변경되었습니다');
      }
    } catch (error) {
      // 사용자가 취소한 경우
      if ((error as { code?: number })?.code === 4001) {
        toast.info('계정 변경이 취소되었습니다');
      } else {
        const message = error instanceof Error ? error.message : '계정 변경 실패';
        toast.error(message);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const balanceLabel = (() => {
    if (!connectedWalletAddress) return null;
    if (formattedBalance) return `${formattedBalance} ${symbol}`;
    if (isBalanceLoading) return '잔고 조회 중...';
    if (balanceError) return '잔고 조회 실패';
    return `- ${symbol}`;
  })();

  return (
    <header
      className={cn(
        'sticky top-0 z-50',
        'glass border-b',
        'transition-all duration-300',
        className
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {/* Logo with gradient */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.6_0.2_250)] to-[oklch(0.5_0.25_280)] shadow-lg">
              <span className="text-lg font-bold text-white">C</span>
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="hidden truncate text-sm text-muted-foreground md:block">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="ml-auto flex max-w-full items-center gap-2 sm:gap-3">
            {/* Network Selector */}
            {mounted && <NetworkSelector isOnline={isOnline} />}

            {/* Wallet Connection Button */}
            {mounted && (
              connectedWalletAddress ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto max-w-[12.5rem] min-h-9 items-center gap-2 py-1.5 sm:max-w-[15rem]"
                      disabled={isConnecting}
                    >
                      <Wallet className="h-4 w-4" />
                      <span className="min-w-0 flex flex-col items-start leading-tight">
                        <span className="max-w-[8rem] truncate font-mono text-xs sm:max-w-[10rem]">
                          {formatAddress(connectedWalletAddress)}
                        </span>
                        <span className="max-w-[8rem] truncate text-[10px] text-muted-foreground sm:max-w-[10rem]">
                          {balanceLabel}
                        </span>
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleSwitchAccount}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      계정 변경
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      연결 해제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  {isConnecting ? '연결 중...' : '지갑 연결'}
                </Button>
              )
            )}

            {/* Dark Mode Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className={cn(
                  'rounded-full',
                  'hover:bg-accent',
                  'transition-all duration-200'
                )}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-slate-600" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Compact Header (간단한 타이틀만 표시)
 */
export function CompactHeader({
  title,
  className = '',
}: {
  title: string;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 glass border-b py-3',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>
    </header>
  );
}
