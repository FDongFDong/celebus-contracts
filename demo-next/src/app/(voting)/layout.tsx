/**
 * Voting Layout - Server Component
 *
 * 서버에서 렌더링되는 공통 레이아웃
 * 클라이언트 로직(usePathname, useRouter)은 별도 컴포넌트로 분리됨
 */

import { Header } from '@/components/layout/Header';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { FeatureCardSection } from '@/components/layout/FeatureCardSection';

interface VotingLayoutProps {
  children: React.ReactNode;
}

export default function VotingLayout({ children }: VotingLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header (Client Component) */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tab Navigation (Client Component) */}
        <TabNavigation />

        {/* Section Header (Client Component) */}
        <SectionHeader />

        {/* Page Content */}
        <div className="space-y-6 animate-fade-in-up">{children}</div>

        {/* Feature Cards (Client Component) */}
        <FeatureCardSection />
      </main>

      {/* Footer (Server Component) */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-foreground">
            Celebus Voting Platform - EIP-712 Batch Signature Demo
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Built with Next.js 16 + React 19 + TypeScript + Viem + Zustand
          </p>
        </div>
      </footer>
    </div>
  );
}
