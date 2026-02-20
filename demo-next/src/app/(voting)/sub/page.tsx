'use client';

import { ModeToggle } from '@/components/shared/ModeToggle';
import { useVotingPhase } from '@/hooks/useVotingPhase';
import { SubSimpleView } from '@/components/steps/sub-voting/SubSimpleView';
import { SubDeveloperView } from '@/components/steps/sub-voting/SubDeveloperView';

export default function SubVotingPage() {
  const [phase, setPhase] = useVotingPhase({
    tab: 'sub',
    storageKey: 'vibe:sub:phase:v1',
    fallbackKeys: ['celebus:sub:phase:v1', 'celebus:sub:mode:v2'],
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sub Voting</h2>
          <p className="text-sm text-muted-foreground">
            {phase === 'deploy'
              ? 'SubVoting 컨트랙트 배포/Executor/질문/옵션 설정 단계'
              : '배포된 SubVoting 컨트랙트 대상 관리자 설정/역할 할당/레코드/서명/제출/조회/검증 단계'}
          </p>
        </div>
        <ModeToggle phase={phase} onToggle={setPhase} />
      </div>

      <section hidden={phase !== 'deploy'} aria-hidden={phase !== 'deploy'}>
        <SubSimpleView />
      </section>

      <section hidden={phase !== 'interact'} aria-hidden={phase !== 'interact'}>
        <SubDeveloperView />
      </section>
    </div>
  );
}
