'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  DEFAULT_VIEW_PHASE,
  normalizeStoredViewPhase,
  type ViewPhase,
} from '@/lib/view-phase';

export type ViewMode = ViewPhase;
export type CompatViewMode = 'simple' | 'developer';

export interface UsePersistedPhaseOptions {
  fallbackKeys?: string[];
}

const PHASE_CHANGE_EVENT = 'vibe:phase-change';

export function usePersistedPhase(
  storageKey: string,
  defaultPhase: ViewPhase = DEFAULT_VIEW_PHASE,
  options: UsePersistedPhaseOptions = {}
) {
  const subscribe = useCallback(
    (callback: () => void) => {
      const watchedKeys = [storageKey, ...(options.fallbackKeys ?? [])];

      const onStorage = (event: StorageEvent) => {
        if (event.key && watchedKeys.includes(event.key)) callback();
      };

      const onPhaseChange = (event: Event) => {
        const custom = event as CustomEvent<{ key?: string }>;
        if (custom.detail?.key && watchedKeys.includes(custom.detail.key)) callback();
      };

      window.addEventListener('storage', onStorage);
      window.addEventListener(PHASE_CHANGE_EVENT, onPhaseChange);
      return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(PHASE_CHANGE_EVENT, onPhaseChange);
      };
    },
    [options.fallbackKeys, storageKey]
  );

  const getSnapshot = useCallback((): ViewPhase => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored !== null) {
        return normalizeStoredViewPhase(stored, defaultPhase);
      }

      const fallbackKeys = options.fallbackKeys ?? [];
      for (const fallbackKey of fallbackKeys) {
        const fallback = window.localStorage.getItem(fallbackKey);
        if (fallback !== null) {
          return normalizeStoredViewPhase(fallback, defaultPhase);
        }
      }

      return defaultPhase;
    } catch {
      return defaultPhase;
    }
  }, [defaultPhase, options.fallbackKeys, storageKey]);

  const getServerSnapshot = useCallback(
    (): ViewPhase => defaultPhase,
    [defaultPhase]
  );

  const phase = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setPersistedPhase = useCallback(
    (nextPhase: ViewPhase) => {
      try {
        window.localStorage.setItem(storageKey, nextPhase);
        const fallbackKeys = options.fallbackKeys ?? [];
        for (const fallbackKey of fallbackKeys) {
          window.localStorage.removeItem(fallbackKey);
        }
        window.dispatchEvent(
          new CustomEvent(PHASE_CHANGE_EVENT, {
            detail: { key: storageKey },
          })
        );
      } catch {
        // localStorage 저장 실패 시 메모리 상태만 유지
      }
    },
    [options.fallbackKeys, storageKey]
  );

  return [phase, setPersistedPhase] as const;
}

// Backward compatibility alias.
export const usePersistedMode = usePersistedPhase;
