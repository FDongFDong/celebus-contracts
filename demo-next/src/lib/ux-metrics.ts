'use client';

import type { ViewPhase } from '@/lib/view-phase';

const UX_METRICS_KEY = 'vibe:ux:events';
const UX_METRICS_MAX = 300;

export type UxEventName = 'phase_view' | 'phase_toggle';
export type UxTab = 'erc20' | 'main' | 'nft' | 'sub' | 'boost';

export interface UxEvent {
  name: UxEventName;
  tab: UxTab;
  phase: ViewPhase;
  timestamp: string;
}

export function trackUxEvent(event: Omit<UxEvent, 'timestamp'>) {
  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(UX_METRICS_KEY);
    const parsed = raw ? (JSON.parse(raw) as UxEvent[]) : [];

    const next: UxEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    const merged = [...parsed, next].slice(-UX_METRICS_MAX);
    window.localStorage.setItem(UX_METRICS_KEY, JSON.stringify(merged));
  } catch {
    // 측정 실패는 사용자 플로우에 영향 주지 않음
  }
}
