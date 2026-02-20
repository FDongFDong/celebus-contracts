import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VIEW_PHASE,
  isViewPhase,
  normalizeStoredViewPhase,
} from '@/lib/view-phase';

describe('view-phase helpers', () => {
  it('detects valid phase values', () => {
    expect(isViewPhase('deploy')).toBe(true);
    expect(isViewPhase('interact')).toBe(true);
    expect(isViewPhase('simple')).toBe(false);
    expect(isViewPhase('developer')).toBe(false);
    expect(isViewPhase(null)).toBe(false);
  });

  it('normalizes previous simple/developer values', () => {
    expect(normalizeStoredViewPhase('simple')).toBe('deploy');
    expect(normalizeStoredViewPhase('developer')).toBe('interact');
  });

  it('keeps deploy/interact values as is', () => {
    expect(normalizeStoredViewPhase('deploy')).toBe('deploy');
    expect(normalizeStoredViewPhase('interact')).toBe('interact');
  });

  it('falls back to default phase for unknown values', () => {
    expect(normalizeStoredViewPhase(null)).toBe(DEFAULT_VIEW_PHASE);
    expect(normalizeStoredViewPhase('unknown')).toBe(DEFAULT_VIEW_PHASE);
    expect(normalizeStoredViewPhase('', 'interact')).toBe('interact');
  });
});
