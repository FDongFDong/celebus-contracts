/**
 * FeatureCardSection Component
 *
 * 클라이언트 컴포넌트로 분리된 기능 카드 섹션
 * usePathname, useRouter 사용
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Vote, MessageSquare, Rocket, KeyRound, Hexagon, type LucideIcon } from 'lucide-react';
import { FeatureCard, FeatureCardGrid } from '@/components/shared/FeatureCard';

interface TabConfig {
  value: string;
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  details: string;
}

const tabConfig: TabConfig[] = [
  {
    value: 'main',
    href: '/main',
    label: 'Main Voting',
    icon: Vote,
    description: 'Forget/Remember 투표',
    details: 'voteType 기반 투표',
  },
  {
    value: 'sub',
    href: '/sub',
    label: 'Sub Voting',
    icon: MessageSquare,
    description: '질문별 투표',
    details: 'questionId 기반 투표',
  },
  {
    value: 'boost',
    href: '/boost',
    label: 'Boosting',
    icon: Rocket,
    description: 'BP/CELB 부스팅',
    details: 'boostingWith 기반',
  },
  {
    value: 'erc20',
    href: '/erc20',
    label: 'ERC20',
    icon: KeyRound,
    description: 'ERC20 코어/Permit/관리자',
    details: 'EIP-2612 + 조회',
  },
  {
    value: 'nft',
    href: '/nft',
    label: 'NFT',
    icon: Hexagon,
    description: 'NFT 관리',
    details: 'VIBENFT',
  },
];

export function FeatureCardSection() {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = tabConfig.find((tab) => pathname.startsWith(tab.href))?.value || 'main';

  return (
    <div className="mt-12">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Available Features
      </h3>
      <FeatureCardGrid columns={5}>
        {tabConfig.map((tab) => (
          <FeatureCard
            key={tab.value}
            icon={tab.icon}
            title={tab.label}
            description={tab.description}
            details={tab.details}
            isActive={activeTab === tab.value}
            onClick={() => router.push(tab.href)}
          />
        ))}
      </FeatureCardGrid>
    </div>
  );
}
