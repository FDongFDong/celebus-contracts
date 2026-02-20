/**
 * SectionHeader Component
 *
 * 클라이언트 컴포넌트로 분리된 섹션 헤더
 * pathname에 따라 현재 탭 정보를 표시
 */

'use client';

import { usePathname } from 'next/navigation';
import { Vote, MessageSquare, Rocket, KeyRound, Hexagon, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabConfig {
  value: string;
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

const tabConfig: TabConfig[] = [
  { value: 'main', href: '/main', label: 'Main Voting', icon: Vote, description: 'Forget/Remember 투표' },
  { value: 'sub', href: '/sub', label: 'Sub Voting', icon: MessageSquare, description: '질문별 투표' },
  { value: 'boost', href: '/boost', label: 'Boosting', icon: Rocket, description: 'BP/CELB 부스팅' },
  { value: 'erc20', href: '/erc20', label: 'ERC20', icon: KeyRound, description: 'ERC20 + ERC20Permit 확장 데모' },
  { value: 'nft', href: '/nft', label: 'NFT', icon: Hexagon, description: 'NFT 관리' },
];

export function SectionHeader() {
  const pathname = usePathname();
  const activeTabConfig = tabConfig.find((tab) => pathname.startsWith(tab.href));

  if (!activeTabConfig) return null;

  const Icon = activeTabConfig.icon;

  return (
    <div className="mb-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            'bg-gradient-to-br from-[oklch(0.6_0.2_250)] to-[oklch(0.5_0.25_280)]',
            'shadow-lg'
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {activeTabConfig.label} Demo
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeTabConfig.description}
          </p>
        </div>
      </div>
    </div>
  );
}
