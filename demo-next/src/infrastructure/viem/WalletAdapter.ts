import { privateKeyToAccount } from 'viem/accounts';
import {
  createPublicClient,
  createWalletClient,
  http,
  type Chain,
  type PublicClient,
  type WalletClient,
  type TypedDataDomain,
} from 'viem';
import type { Address } from '../../domain/types';
import { getChainById } from '../config/chains';

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
  private chain: Chain;
  private publicClient: PublicClient | null = null;
  private walletClient: WalletClient | null = null;

  /**
   * @param privateKey - 0x 접두사가 있는 개인키
   * @param chainId - 대상 체인 ID (기본: 5611 opBNB Testnet)
   */
  constructor(privateKey: `0x${string}`, chainId = 5611) {
    this.account = privateKeyToAccount(privateKey);
    this.chain = getChainById(chainId);
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
   * 설정된 체인에 연결된 PublicClient 반환
   * 캐시된 클라이언트가 있으면 재사용
   */
  getPublicClient(): PublicClient {
    if (!this.publicClient) {
      this.publicClient = createPublicClient({
        chain: this.chain,
        transport: http(),
      });
    }
    return this.publicClient;
  }

  /**
   * 설정된 체인에 연결된 WalletClient 반환
   * 현재 account를 사용하며, 캐시된 클라이언트가 있으면 재사용
   */
  getWalletClient(): WalletClient {
    if (!this.walletClient) {
      this.walletClient = createWalletClient({
        account: this.account,
        chain: this.chain,
        transport: http(),
      });
    }
    return this.walletClient;
  }
}
