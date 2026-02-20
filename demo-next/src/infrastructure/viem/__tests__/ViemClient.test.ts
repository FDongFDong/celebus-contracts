/**
 * ViemClient 기본 생성 테스트
 */

import { describe, it, expect } from 'vitest';
import { createViemClient } from '../ViemClient';
import { anvil, opBNBTestnet } from '../../config/chains';

describe('ViemClient', () => {
  describe('생성 테스트', () => {
    it('PublicClient만 생성 (개인키 없음)', () => {
      const client = createViemClient({
        chain: anvil,
      });

      expect(client.getPublicClient()).toBeDefined();
      expect(client.getChain()).toEqual(anvil);
      expect(client.getAccount()).toBeUndefined();
    });

    it('PublicClient + WalletClient 생성 (개인키 있음)', () => {
      const testPrivateKey =
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Anvil 기본 계정

      const client = createViemClient({
        chain: anvil,
        privateKey: testPrivateKey,
      });

      expect(client.getPublicClient()).toBeDefined();
      expect(client.getWalletClient()).toBeDefined();
      expect(client.getAccount()).toBeDefined();
      expect(client.getAddress()).toBe(
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
      );
    });

    it('opBNB Testnet 체인으로 생성', () => {
      const client = createViemClient({
        chain: opBNBTestnet,
      });

      const chain = client.getChain();
      expect(chain).toEqual(opBNBTestnet);
      expect(chain?.id).toBe(5611);
    });

    it('커스텀 RPC URL 사용', () => {
      const customRpcUrl = 'http://localhost:8545';

      const client = createViemClient({
        chain: anvil,
        rpcUrl: customRpcUrl,
      });

      expect(client.getPublicClient()).toBeDefined();
    });
  });

  describe('에러 처리', () => {
    it('WalletClient가 없는 상태에서 getWalletClient 호출 시 에러', () => {
      const client = createViemClient({
        chain: anvil,
      });

      expect(() => client.getWalletClient()).toThrow(
        'WalletClient not initialized'
      );
    });

    it('Account가 없는 상태에서 getAddress 호출 시 에러', () => {
      const client = createViemClient({
        chain: anvil,
      });

      expect(() => client.getAddress()).toThrow('Account not initialized');
    });
  });
});
