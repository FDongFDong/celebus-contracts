/**
 * TabNavigation Component
 *
 * 클라이언트 컴포넌트로 분리된 탭 네비게이션
 * usePathname, useRouter 사용
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Vote, MessageSquare, Rocket, KeyRound, Hexagon, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabConfig {
  value: string;
  href: string;
  label: string;
  icon: LucideIcon;
}

const tabConfig: TabConfig[] = [
  { value: 'main', href: '/main', label: 'Main Voting', icon: Vote },
  { value: 'sub', href: '/sub', label: 'Sub Voting', icon: MessageSquare },
  { value: 'boost', href: '/boost', label: 'Boosting', icon: Rocket },
  { value: 'erc20', href: '/erc20', label: 'ERC20', icon: KeyRound },
  { value: 'nft', href: '/nft', label: 'NFT', icon: Hexagon },
];

export function TabNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = tabConfig.find((tab) => pathname.startsWith(tab.href))?.value || 'main';

  return (
    <div className="mb-6">
      <div className="grid w-full grid-cols-5 lg:w-[850px] h-auto p-1 bg-muted/50 backdrop-blur-sm rounded-lg">
        {tabConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.value === activeTab;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => router.push(tab.href)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-2.5',
                'text-xs sm:text-sm transition-all duration-200 rounded-md',
                'cursor-pointer',
                'hover:bg-background/50',
                isActive && 'bg-background shadow-sm text-foreground',
                !isActive && 'text-muted-foreground hover:text-foreground',
                'tab-underline'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
