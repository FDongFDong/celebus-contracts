/**
 * ModeToggle - 배포/인터랙션 시점 전환 토글
 */

'use client';

import { Eye, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { VIEW_PHASE_LABELS, type ViewPhase } from '@/lib/view-phase';

interface ModeToggleProps {
  /** 현재 phase */
  phase: ViewPhase;
  /** phase 전환 콜백 */
  onToggle: (phase: ViewPhase) => void;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 모드 전환 토글 컴포넌트
 *
 * @example
 * <ModeToggle phase="deploy" onToggle={(phase) => setPhase(phase)} />
 */
export function ModeToggle({ phase, onToggle, className }: ModeToggleProps) {
  return (
    <div
      className={cn(
        'flex items-center rounded-lg border bg-muted p-0.5',
        className
      )}
      role="radiogroup"
      aria-label="단계 선택"
    >
      <Button
        variant={phase === 'deploy' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onToggle('deploy')}
        role="radio"
        aria-checked={phase === 'deploy'}
        aria-label="컨트랙트 배포 단계"
        className="gap-1.5 rounded-md"
      >
        <Eye className="size-3.5" />
        {VIEW_PHASE_LABELS.deploy}
      </Button>
      <Button
        variant={phase === 'interact' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onToggle('interact')}
        role="radio"
        aria-checked={phase === 'interact'}
        aria-label="배포된 컨트랙트 인터랙션 단계"
        className="gap-1.5 rounded-md"
      >
        <Code className="size-3.5" />
        {VIEW_PHASE_LABELS.interact}
      </Button>
    </div>
  );
}
