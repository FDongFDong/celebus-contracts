import { privateKeyToAccount } from 'viem/accounts';
import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type TypedDataDomain,
} from 'viem';
import { opBNBTestnet } from 'viem/chains';
import type { Address } from '../../domain/types';

/**
 * EIP-712 TypedData 타입 정의
 */
export interface TypedDataParameter {
  name: string;
  type: string;
}

export type TypedData = Record<string, readonly TypedDataParameter[]>;

/**
 * signTypedData 파라미터 타입
 */
export interface SignTypedDataParams {
  domain: TypedDataDomain;
  types: TypedData;
  primaryType: string;
  message: Record<string, unknown>;
}

/**
 * viem의 privateKeyToAccount를 래핑한 지갑 어댑터
 * EIP-712 서명 기능을 제공
 */
export class WalletAdapter {
  private account: ReturnType<typeof privateKeyToAccount>;
  private publicClient: PublicClient | null = null;
  private walletClient: WalletClient | null = null;

  constructor(privateKey: `0x${string}`) {
    this.account = privateKeyToAccount(privateKey);
  }

  /**
   * 지갑 주소를 반환
   */
  get address(): Address {
    return this.account.address as Address;
  }

  /**
   * EIP-712 typed data 서명
   * @param params - 서명할 typed data 파라미터
   * @returns 서명값 (0x로 시작하는 hex string)
   */
  async signTypedData(params: SignTypedDataParams): Promise<`0x${string}`> {
    const { domain, types, primaryType, message } = params;

    return this.account.signTypedData({
      domain,
      types,
      primaryType,
      message,
    });
  }

  /**
   * opBNBTestnet에 연결된 PublicClient 반환
   * 캐시된 클라이언트가 있으면 재사용
   */
  getPublicClient(): PublicClient {
    if (!this.publicClient) {
      this.publicClient = createPublicClient({
        chain: opBNBTestnet,
        transport: http(),
      });
    }
    return this.publicClient;
  }

  /**
   * opBNBTestnet에 연결된 WalletClient 반환
   * 현재 account를 사용하며, 캐시된 클라이언트가 있으면 재사용
   */
  getWalletClient(): WalletClient {
    if (!this.walletClient) {
      this.walletClient = createWalletClient({
        account: this.account,
        chain: opBNBTestnet,
        transport: http(),
      });
    }
    return this.walletClient;
  }
}
