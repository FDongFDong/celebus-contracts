'use client';

import { ModeToggle } from '@/components/shared/ModeToggle';
import { Erc20SimpleView } from '@/components/steps/erc20/Erc20SimpleView';
import { Erc20DeveloperView } from '@/components/steps/erc20/Erc20DeveloperView';
import { useVotingPhase } from '@/hooks/useVotingPhase';

export default function Erc20Page() {
  const [phase, setPhase] = useVotingPhase({
    tab: 'erc20',
    storageKey: 'vibe:erc20:phase:v1',
    legacyKeys: ['vibe:permit:phase:v2', 'celebus:permit:phase:v2'],
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">ERC20</h2>
          <p className="text-sm text-muted-foreground">
            {phase === 'deploy'
              ? 'ERC20 토큰 배포 단계'
              : '배포된 ERC20 토큰 대상 코어 기능/Permit 확장/관리자/조회 인터랙션 단계'}
          </p>
        </div>
        <ModeToggle phase={phase} onToggle={setPhase} />
      </div>

      <section hidden={phase !== 'deploy'} aria-hidden={phase !== 'deploy'}>
        <Erc20SimpleView />
      </section>

      <section hidden={phase !== 'interact'} aria-hidden={phase !== 'interact'}>
        <Erc20DeveloperView />
      </section>
    </div>
  );
}
