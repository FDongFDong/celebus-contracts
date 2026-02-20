/**
 * Infrastructure Layer - Viem Client Wrapper
 *
 * viem의 PublicClient와 WalletClient를 감싸는 래퍼 클래스
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Account,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { Address } from '@/domain/types';

/**
 * Viem 클라이언트 설정 옵션
 */
export interface ViemClientOptions {
  chain: Chain;
  rpcUrl?: string;
  privateKey?: `0x${string}`;
}

/**
 * Viem 클라이언트 래퍼
 *
 * PublicClient와 WalletClient 생성을 담당
 * 오버엔지니어링 방지 - 단순한 래퍼만 제공
 */
export class ViemClient {
  private publicClient: PublicClient;
  private walletClient?: WalletClient;
  private account?: Account;

  constructor(options: ViemClientOptions) {
    const { chain, rpcUrl, privateKey } = options;

    // RPC URL 결정 (커스텀 URL 또는 체인 기본값)
    const transport = http(rpcUrl ?? chain.rpcUrls.default.http[0]);

    // PublicClient 생성
    this.publicClient = createPublicClient({
      chain,
      transport,
    });

    // 개인키가 있으면 WalletClient 생성
    if (privateKey) {
      this.account = privateKeyToAccount(privateKey);
      this.walletClient = createWalletClient({
        account: this.account,
        chain,
        transport,
      });
    }
  }

  /**
   * PublicClient 반환
   * 체인 읽기 작업에 사용
   */
  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  /**
   * WalletClient 반환
   * 트랜잭션 서명 및 전송에 사용
   */
  getWalletClient(): WalletClient {
    if (!this.walletClient) {
      throw new Error('WalletClient not initialized. Private key is required.');
    }
    return this.walletClient;
  }

  /**
   * 현재 계정 주소 반환
   */
  getAddress(): Address {
    if (!this.account) {
      throw new Error('Account not initialized. Private key is required.');
    }
    return this.account.address;
  }

  /**
   * 체인 정보 반환
   */
  getChain(): Chain | undefined {
    return this.publicClient.chain;
  }

  /**
   * Account 객체 반환
   */
  getAccount(): Account | undefined {
    return this.account;
  }
}

/**
 * ViemClient 팩토리 함수
 */
export function createViemClient(options: ViemClientOptions): ViemClient {
  return new ViemClient(options);
}
