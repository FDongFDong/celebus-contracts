/**
 * Mock Utilities for Testing
 *
 * Step 컴포넌트 테스트용 Mock 객체 및 헬퍼 함수
 */

import { vi } from 'vitest';
import type { AppState, AppStateData } from '../../state/AppState';
import type { WalletAdapter } from '../../../infrastructure/viem/WalletAdapter';
import type { VoteRecord, VoteRecordData } from '../../../domain/entities/VoteRecord';
import type { Address, Hash } from '../../../domain/types';

/**
 * Mock AppState 생성
 */
export function createMockAppState(initialState?: Partial<AppStateData>): AppState {
  const defaultState: AppStateData = {
    ownerWallet: null,
    executorWallet: null,
    userWallets: [],
    records: [],
    userBatchSigs: [],
    contractAddress: null,
    batchNonce: 0n,
    domainSeparator: null,
    structHash: null,
    finalDigest: null,
    executorSig: null,
    ...initialState,
  };

  let currentState = { ...defaultState };
  const listeners: Array<(state: Readonly<AppStateData>) => void> = [];

  return {
    getState: vi.fn(() => Object.freeze({ ...currentState })),
    setState: vi.fn((partial: Partial<AppStateData>) => {
      currentState = { ...currentState, ...partial };
      listeners.forEach((listener) => listener(Object.freeze({ ...currentState })));
    }),
    subscribe: vi.fn((listener) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    }),
    reset: vi.fn(() => {
      currentState = { ...defaultState };
      listeners.forEach((listener) => listener(Object.freeze({ ...currentState })));
    }),
  } as unknown as AppState;
}

/**
 * Mock WalletAdapter 생성
 */
export function createMockWalletAdapter(address?: Address): WalletAdapter {
  const mockAddress = (address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb') as Address;

  return {
    address: mockAddress,
    signTypedData: vi.fn(async () => {
      return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12' as Hash;
    }),
    getPublicClient: vi.fn(),
    getWalletClient: vi.fn(),
  } as unknown as WalletAdapter;
}

/**
 * Mock VoteRecord 생성
 */
export function createMockVoteRecord(partial?: Partial<VoteRecordData>): VoteRecord {
  const defaultData: VoteRecordData = {
    recordId: 1n,
    timestamp: BigInt(Date.now() / 1000),
    missionId: 1n,
    votingId: 1n,
    optionId: 1n,
    voteType: 1,
    userId: 'user123',
    votingAmt: 100n,
    ...partial,
  };

  return {
    recordId: defaultData.recordId,
    timestamp: defaultData.timestamp,
    missionId: defaultData.missionId,
    votingId: defaultData.votingId,
    optionId: defaultData.optionId,
    voteType: defaultData.voteType,
    userId: defaultData.userId,
    votingAmt: defaultData.votingAmt,
    isValid: vi.fn(() => true),
    toTypedData: vi.fn((userAddress: Address) => ({
      types: {
        VoteRecord: [
          { name: 'timestamp', type: 'uint256' },
          { name: 'missionId', type: 'uint256' },
          { name: 'votingId', type: 'uint256' },
          { name: 'optionId', type: 'uint256' },
          { name: 'voteType', type: 'uint8' },
          { name: 'votingAmt', type: 'uint256' },
          { name: 'user', type: 'address' },
        ],
      },
      primaryType: 'VoteRecord' as const,
      message: {
        timestamp: defaultData.timestamp,
        missionId: defaultData.missionId,
        votingId: defaultData.votingId,
        optionId: defaultData.optionId,
        voteType: defaultData.voteType,
        votingAmt: defaultData.votingAmt,
        user: userAddress,
      },
    })),
  } as VoteRecord;
}

/**
 * Mock DOM 환경 설정
 */
export function setupMockDOM(): void {
  document.body.innerHTML = '';
}

/**
 * Mock DOM 요소 생성 헬퍼
 */
export function createMockElement(
  id: string,
  tagName: keyof HTMLElementTagNameMap = 'div',
  value?: string
): HTMLElement {
  const element = document.createElement(tagName);
  element.id = id;

  if (value !== undefined && (tagName === 'input' || tagName === 'textarea')) {
    (element as HTMLInputElement).value = value;
  }

  document.body.appendChild(element);
  return element;
}

/**
 * 여러 Mock DOM 요소를 한 번에 생성
 */
export function createMockElements(
  elements: Array<{ id: string; tagName?: keyof HTMLElementTagNameMap; value?: string }>
): void {
  elements.forEach(({ id, tagName = 'div', value }) => {
    createMockElement(id, tagName, value);
  });
}
