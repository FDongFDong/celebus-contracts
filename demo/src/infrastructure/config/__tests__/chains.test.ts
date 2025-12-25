/**
 * Chain Configuration 테스트
 */

import { describe, it, expect } from 'vitest';
import { anvil, opBNBTestnet, supportedChains, getChainById } from '../chains';

describe('Chain Configurations', () => {
  describe('opBNB Testnet', () => {
    it('올바른 체인 ID', () => {
      expect(opBNBTestnet.id).toBe(5611);
    });

    it('올바른 이름', () => {
      expect(opBNBTestnet.name).toBe('opBNB Testnet');
    });

    it('네이티브 통화 설정', () => {
      expect(opBNBTestnet.nativeCurrency).toEqual({
        name: 'tBNB',
        symbol: 'tBNB',
        decimals: 18,
      });
    });

    it('RPC URL 설정', () => {
      expect(opBNBTestnet.rpcUrls.default.http).toContain(
        'https://opbnb-testnet-rpc.bnbchain.org'
      );
    });

    it('테스트넷 플래그', () => {
      expect(opBNBTestnet.testnet).toBe(true);
    });
  });

  describe('Anvil', () => {
    it('로컬 체인 ID', () => {
      expect(anvil.id).toBe(31337);
    });

    it('Foundry 체인 사용', () => {
      expect(anvil.name).toBe('Foundry');
    });
  });

  describe('getChainById', () => {
    it('opBNB Testnet 조회', () => {
      const chain = getChainById(5611);
      expect(chain).toEqual(opBNBTestnet);
    });

    it('Anvil 조회', () => {
      const chain = getChainById(31337);
      expect(chain).toEqual(anvil);
    });

    it('지원하지 않는 체인 ID 조회 시 에러', () => {
      expect(() => getChainById(9999)).toThrow('Unsupported chain ID: 9999');
    });
  });

  describe('supportedChains', () => {
    it('모든 지원 체인 포함', () => {
      expect(supportedChains).toHaveProperty('opBNBTestnet');
      expect(supportedChains).toHaveProperty('anvil');
    });
  });
});
