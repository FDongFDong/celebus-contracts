import { describe, it, expect, beforeEach } from 'vitest';
import { AppState } from '../state/AppState';
import { WalletAdapter } from '../../infrastructure/viem/WalletAdapter';

describe('AppState', () => {
  let appState: AppState;

  beforeEach(() => {
    appState = new AppState();
  });

  it('초기 상태가 올바르게 설정되어야 함', () => {
    const state = appState.getState();

    expect(state.ownerWallet).toBeNull();
    expect(state.executorWallet).toBeNull();
    expect(state.userWallets).toEqual([]);
    expect(state.records).toEqual([]);
    expect(state.userBatchSigs).toEqual([]);
    expect(state.contractAddress).toBeNull();
    expect(state.batchNonce).toBe(0n);
    expect(state.domainSeparator).toBeNull();
    expect(state.structHash).toBeNull();
    expect(state.finalDigest).toBeNull();
    expect(state.executorSig).toBeNull();
  });

  it('상태를 부분적으로 업데이트할 수 있어야 함', () => {
    const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as const;

    appState.setState({
      contractAddress: testAddress,
      batchNonce: 1n,
    });

    const state = appState.getState();
    expect(state.contractAddress).toBe(testAddress);
    expect(state.batchNonce).toBe(1n);
    expect(state.ownerWallet).toBeNull(); // 다른 필드는 유지
  });

  it('리스너가 상태 변경을 감지해야 함', () => {
    let callCount = 0;
    let lastState = appState.getState();

    const unsubscribe = appState.subscribe((state) => {
      callCount++;
      lastState = state;
    });

    // 상태 업데이트
    appState.setState({ batchNonce: 2n });

    expect(callCount).toBe(1);
    expect(lastState.batchNonce).toBe(2n);

    // 구독 취소 후에는 호출되지 않아야 함
    unsubscribe();
    appState.setState({ batchNonce: 3n });

    expect(callCount).toBe(1); // 여전히 1
  });

  it('reset()으로 초기 상태로 되돌릴 수 있어야 함', () => {
    // 상태 변경
    appState.setState({
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      batchNonce: 5n,
    });

    // 초기화
    appState.reset();

    const state = appState.getState();
    expect(state.contractAddress).toBeNull();
    expect(state.batchNonce).toBe(0n);
  });

  it('getState()는 읽기 전용 객체를 반환해야 함', () => {
    const state = appState.getState();

    // Object.freeze로 인해 수정 시도 시 에러 발생 (strict mode)
    expect(() => {
      (state as unknown as { batchNonce: bigint }).batchNonce = 99n;
    }).toThrow();
  });

  it('여러 리스너를 등록하고 모두 호출되어야 함', () => {
    let listener1Called = false;
    let listener2Called = false;

    appState.subscribe(() => {
      listener1Called = true;
    });

    appState.subscribe(() => {
      listener2Called = true;
    });

    appState.setState({ batchNonce: 1n });

    expect(listener1Called).toBe(true);
    expect(listener2Called).toBe(true);
  });

  it('WalletAdapter를 상태에 저장할 수 있어야 함', () => {
    const wallet = new WalletAdapter(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );

    appState.setState({ ownerWallet: wallet });

    const state = appState.getState();
    expect(state.ownerWallet).toBe(wallet);
    expect(state.ownerWallet?.address).toBeDefined();
  });
});
