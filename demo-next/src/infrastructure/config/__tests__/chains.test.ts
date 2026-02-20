/**
 * Chain Configuration 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  anvil,
  opBNBMainnet,
  opBNBTestnet,
  bscMainnet,
  supportedChains,
  selectableChains,
  getChainById,
} from '../chains';

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

  describe('Mainnets', () => {
    it('BNB Mainnet 체인 ID와 이름', () => {
      expect(bscMainnet.id).toBe(56);
      expect(bscMainnet.name).toBe('BNB Smart Chain');
      expect(bscMainnet.testnet).toBe(false);
    });

    it('opBNB Mainnet 체인 ID와 이름', () => {
      expect(opBNBMainnet.id).toBe(204);
      expect(opBNBMainnet.name).toBe('opBNB Mainnet');
      expect(opBNBMainnet.testnet).toBe(false);
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

    it('BNB Mainnet 조회', () => {
      const chain = getChainById(56);
      expect(chain).toEqual(bscMainnet);
    });

    it('opBNB Mainnet 조회', () => {
      const chain = getChainById(204);
      expect(chain).toEqual(opBNBMainnet);
    });

    it('지원하지 않는 체인 ID 조회 시 에러', () => {
      expect(() => getChainById(9999)).toThrow('Unsupported chain ID: 9999');
    });
  });

  describe('supportedChains', () => {
    it('모든 지원 체인 포함', () => {
      expect(supportedChains).toHaveProperty('bscMainnet');
      expect(supportedChains).toHaveProperty('opBNBMainnet');
      expect(supportedChains).toHaveProperty('bscTestnet');
      expect(supportedChains).toHaveProperty('opBNBTestnet');
      expect(supportedChains).toHaveProperty('anvil');
    });
  });

  describe('selectableChains', () => {
    it('네트워크 선택기에 mainnet + testnet이 포함된다', () => {
      const ids = selectableChains.map((c) => c.id);
      expect(ids).toContain(56);
      expect(ids).toContain(204);
      expect(ids).toContain(97);
      expect(ids).toContain(5611);
    });
  });
});
