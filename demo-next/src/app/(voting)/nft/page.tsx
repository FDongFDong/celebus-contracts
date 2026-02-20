'use client';

import dynamic from 'next/dynamic';
import { StepSkeleton } from '@/components/shared/StepSkeleton';
import { ModeToggle } from '@/components/shared/ModeToggle';
import { useVotingPhase } from '@/hooks/useVotingPhase';
import { NftInteractionBindingPanel } from '@/components/steps/nft/NftInteractionBindingPanel';

// Critical Step - 즉시 로드
import { NFTStep0Register } from '@/components/steps/nft/NFTStep0Register';

// Dynamic Import
const NFTStep1Wallet = dynamic(
  () => import('@/components/steps/nft/NFTStep1Wallet').then(m => ({ default: m.NFTStep1Wallet })),
  { loading: () => <StepSkeleton stepNumber={1} title="Wallet" category="setup" />, ssr: false }
);

const NFTStep2ApprovalForAll = dynamic(
  () => import('@/components/steps/nft/NFTStep2ApprovalForAll').then(m => ({ default: m.NFTStep2ApprovalForAll })),
  { loading: () => <StepSkeleton stepNumber={2} title="Approval For All" category="action" />, ssr: false }
);

const NFTStep3Approve = dynamic(
  () => import('@/components/steps/nft/NFTStep3Approve').then(m => ({ default: m.NFTStep3Approve })),
  { loading: () => <StepSkeleton stepNumber={3} title="Approve" category="action" />, ssr: false }
);

const NFTStep4CheckApproval = dynamic(
  () => import('@/components/steps/nft/NFTStep4CheckApproval').then(m => ({ default: m.NFTStep4CheckApproval })),
  { loading: () => <StepSkeleton stepNumber={4} title="Check Approval" category="result" />, ssr: false }
);

export default function NFTPage() {
  const [phase, setPhase] = useVotingPhase({
    tab: 'nft',
    storageKey: 'vibe:nft:phase:v1',
    fallbackKeys: ['celebus:nft:phase:v1', 'celebus:nft:mode:v2'],
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">NFT</h2>
          <p className="text-sm text-muted-foreground">
            {phase === 'deploy'
              ? 'NFT 컨트랙트 등록/지갑 연결 단계'
              : '배포된 NFT 컨트랙트 대상 조회/승인/검증 인터랙션 단계'}
          </p>
        </div>
        <ModeToggle phase={phase} onToggle={setPhase} />
      </div>

      <section hidden={phase !== 'deploy'} aria-hidden={phase !== 'deploy'}>
        <NFTStep0Register />
      </section>

      <section hidden={phase !== 'interact'} aria-hidden={phase !== 'interact'}>
        <>
          <NftInteractionBindingPanel />
          <NFTStep1Wallet />
          <NFTStep2ApprovalForAll />
          <NFTStep3Approve />
          <NFTStep4CheckApproval />
        </>
      </section>
    </div>
  );
}
