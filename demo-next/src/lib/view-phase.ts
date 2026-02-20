export type ViewPhase = 'deploy' | 'interact';

export type CompatViewMode = 'simple' | 'developer';

export const DEFAULT_VIEW_PHASE: ViewPhase = 'deploy';

export const VIEW_PHASE_LABELS: Record<ViewPhase, string> = {
  deploy: '컨트랙트 배포',
  interact: '배포된 컨트랙트 인터랙션',
};

export function isViewPhase(value: string | null): value is ViewPhase {
  return value === 'deploy' || value === 'interact';
}

export function normalizeStoredViewPhase(
  value: string | null,
  fallback: ViewPhase = DEFAULT_VIEW_PHASE
): ViewPhase {
  if (value === 'simple') return 'deploy';
  if (value === 'developer') return 'interact';
  return isViewPhase(value) ? value : fallback;
}
