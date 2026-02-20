'use client';

import { ModeToggle } from '@/components/shared/ModeToggle';
import { MainSimpleView } from '@/components/steps/main-voting/MainSimpleView';
import { MainDeveloperView } from '@/components/steps/main-voting/MainDeveloperView';
import { useVotingPhase } from '@/hooks/useVotingPhase';

export default function MainVotingPage() {
  const [phase, setPhase] = useVotingPhase({
    tab: 'main',
    storageKey: 'vibe:main:phase:v1',
    fallbackKeys: ['celebus:main:phase:v1', 'celebus:main:mode:v2'],
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Main Voting</h2>
          <p className="text-sm text-muted-foreground">
            {phase === 'deploy'
              ? '컨트랙트 배포/초기 설정 단계'
              : '배포된 컨트랙트 대상 관리자 설정/역할 할당/레코드/서명/제출/검증 단계'}
          </p>
        </div>
        <ModeToggle phase={phase} onToggle={setPhase} />
      </div>

      <section hidden={phase !== 'deploy'} aria-hidden={phase !== 'deploy'}>
        <MainSimpleView />
      </section>

      <section hidden={phase !== 'interact'} aria-hidden={phase !== 'interact'}>
        <MainDeveloperView />
      </section>
    </div>
  );
}
