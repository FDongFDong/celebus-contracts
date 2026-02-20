'use client';

import { ModeToggle } from '@/components/shared/ModeToggle';
import { useVotingPhase } from '@/hooks/useVotingPhase';
import { BoostSimpleView } from '@/components/steps/boosting/BoostSimpleView';
import { BoostDeveloperView } from '@/components/steps/boosting/BoostDeveloperView';

export default function BoostingPage() {
  const [phase, setPhase] = useVotingPhase({
    tab: 'boost',
    storageKey: 'vibe:boost:phase:v1',
    fallbackKeys: ['celebus:boost:phase:v1', 'celebus:boost:mode:v2'],
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Boosting</h2>
          <p className="text-sm text-muted-foreground">
            {phase === 'deploy'
              ? 'Boosting 컨트랙트 배포/Executor/타입/아티스트 설정 단계'
              : '배포된 Boosting 컨트랙트 대상 관리자 설정/역할 할당/레코드/서명/제출/조회/검증 단계'}
          </p>
        </div>
        <ModeToggle phase={phase} onToggle={setPhase} />
      </div>

      <section hidden={phase !== 'deploy'} aria-hidden={phase !== 'deploy'}>
        <BoostSimpleView />
      </section>

      <section hidden={phase !== 'interact'} aria-hidden={phase !== 'interact'}>
        <BoostDeveloperView />
      </section>
    </div>
  );
}
