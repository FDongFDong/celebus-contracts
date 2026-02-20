'use client';

import { useCallback, useEffect } from 'react';
import {
  usePersistedPhase,
  type UsePersistedPhaseOptions,
} from '@/hooks/usePersistedMode';
import { trackUxEvent, type UxTab } from '@/lib/ux-metrics';
import { DEFAULT_VIEW_PHASE, type ViewPhase } from '@/lib/view-phase';

interface UseVotingPhaseArgs extends UsePersistedPhaseOptions {
  tab: UxTab;
  storageKey: string;
  defaultPhase?: ViewPhase;
  onBeforeChange?: (nextPhase: ViewPhase, currentPhase: ViewPhase) => void;
}

export function useVotingPhase({
  tab,
  storageKey,
  defaultPhase = DEFAULT_VIEW_PHASE,
  legacyKeys,
  onBeforeChange,
}: UseVotingPhaseArgs) {
  const [phase, setPersistedPhase] = usePersistedPhase(storageKey, defaultPhase, {
    legacyKeys,
  });

  useEffect(() => {
    trackUxEvent({ name: 'phase_view', tab, phase });
  }, [phase, tab]);

  const setPhase = useCallback(
    (nextPhase: ViewPhase) => {
      if (nextPhase === phase) return;
      onBeforeChange?.(nextPhase, phase);
      trackUxEvent({ name: 'phase_toggle', tab, phase: nextPhase });
      setPersistedPhase(nextPhase);
    },
    [onBeforeChange, phase, setPersistedPhase, tab]
  );

  return [phase, setPhase] as const;
}
