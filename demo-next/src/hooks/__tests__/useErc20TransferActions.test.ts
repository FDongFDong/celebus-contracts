import { describe, expect, it } from 'vitest';
import {
  getErc20ActionErrorMessage,
  getInitialErc20ActionStates,
} from '@/hooks/useErc20TransferActions';

describe('useErc20TransferActions helpers', () => {
  it('creates initial action states', () => {
    const initial = getInitialErc20ActionStates();

    expect(Object.keys(initial)).toEqual([
      'approve',
      'transfer',
      'transferFrom',
      'burn',
      'burnFrom',
    ]);

    for (const state of Object.values(initial)) {
      expect(state.status).toBe('idle');
      expect(state.txHash).toBeNull();
      expect(state.error).toBeNull();
    }
  });

  it('maps user rejection error to friendly message', () => {
    const message = getErc20ActionErrorMessage({ code: 4001 });
    expect(message).toBe('사용자가 트랜잭션을 거부했습니다');
  });
});
