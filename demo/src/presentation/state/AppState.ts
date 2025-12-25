/**
 * Application State Management
 *
 * 전역 애플리케이션 상태 관리
 * 기존 main.js의 state 객체를 TypeScript 클래스로 변환
 */

import type { Address, Hash } from '../../domain/types';
import type { WalletAdapter } from '../../infrastructure/viem/WalletAdapter';
import type { VoteRecord } from '../../domain/entities/VoteRecord';
import type { SubVoteRecord } from '../../domain/entities/SubVoteRecord';

/**
 * 유저 배치 서명 데이터
 */
export interface UserBatchSignature {
  user: Address;
  signature: Hash;
  nonce: bigint;
}

/**
 * 전역 애플리케이션 상태 데이터
 */
export interface AppStateData {
  // Wallets
  ownerWallet: WalletAdapter | null;
  executorWallet: WalletAdapter | null;
  userWallets: WalletAdapter[];

  // Records
  records: VoteRecord[];
  userBatchSigs: UserBatchSignature[];

  // SubVoting Records
  subRecords: SubVoteRecord[];
  subContractAddress: Address | null;

  // EIP-712
  contractAddress: Address | null;
  batchNonce: bigint;
  domainSeparator: Hash | null;
  structHash: Hash | null;
  finalDigest: Hash | null;

  // Signatures
  executorSig: Hash | null;
}

/**
 * 상태 변경 리스너 타입
 */
type StateListener = (state: Readonly<AppStateData>) => void;

/**
 * 전역 상태 관리 클래스
 *
 * 옵저버 패턴을 사용하여 상태 변경을 리스너에게 통지
 */
export class AppState {
  private state: AppStateData;
  private listeners: StateListener[] = [];

  constructor() {
    this.state = {
      ownerWallet: null,
      executorWallet: null,
      userWallets: [],
      records: [],
      userBatchSigs: [],
      subRecords: [],
      subContractAddress: null,
      contractAddress: null,
      batchNonce: 0n,
      domainSeparator: null,
      structHash: null,
      finalDigest: null,
      executorSig: null,
    };
  }

  /**
   * 현재 상태를 읽기 전용으로 반환
   */
  getState(): Readonly<AppStateData> {
    return Object.freeze({ ...this.state });
  }

  /**
   * 상태를 부분적으로 업데이트
   *
   * @param partial - 업데이트할 상태의 일부
   */
  setState(partial: Partial<AppStateData>): void {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  /**
   * 상태 변경 리스너 등록
   *
   * @param listener - 상태 변경 시 호출될 콜백
   * @returns 구독 취소 함수
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);

    // 구독 취소 함수 반환
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * 모든 리스너에게 상태 변경 통지
   */
  private notifyListeners(): void {
    const frozenState = this.getState();
    this.listeners.forEach((listener) => listener(frozenState));
  }

  /**
   * 상태 초기화
   */
  reset(): void {
    this.state = {
      ownerWallet: null,
      executorWallet: null,
      userWallets: [],
      records: [],
      userBatchSigs: [],
      subRecords: [],
      subContractAddress: null,
      contractAddress: null,
      batchNonce: 0n,
      domainSeparator: null,
      structHash: null,
      finalDigest: null,
      executorSig: null,
    };
    this.notifyListeners();
  }
}
