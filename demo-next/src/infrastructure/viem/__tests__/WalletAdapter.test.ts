import { describe, it, expect } from 'vitest';
import { WalletAdapter } from '../WalletAdapter';
import type { Address } from '../../../domain/types';

describe('WalletAdapter', () => {
  const MOCK_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
  const EXPECTED_ADDRESS: Address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  describe('constructor', () => {
    it('유효한 private key로 WalletAdapter 인스턴스를 생성해야 한다', () => {
      const adapter = new WalletAdapter(MOCK_PRIVATE_KEY);
      expect(adapter).toBeInstanceOf(WalletAdapter);
    });
  });

  describe('address getter', () => {
    it('private key로부터 파생된 주소를 반환해야 한다', () => {
      const adapter = new WalletAdapter(MOCK_PRIVATE_KEY);
      expect(adapter.address).toBe(EXPECTED_ADDRESS);
    });

    it('주소는 0x로 시작하는 40자리 hex string이어야 한다', () => {
      const adapter = new WalletAdapter(MOCK_PRIVATE_KEY);
      const address = adapter.address;

      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(address.length).toBe(42);
    });
  });

  describe('signTypedData', () => {
    it('EIP-712 typed data를 서명하고 서명값을 반환해야 한다', async () => {
      const adapter = new WalletAdapter(MOCK_PRIVATE_KEY);

      const domain = {
        name: 'CelebusVoting',
        version: '1',
        chainId: 31337,
        verifyingContract: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address,
      };

      const types = {
        VoteRecord: [
          { name: 'timestamp', type: 'uint256' },
          { name: 'missionId', type: 'uint256' },
          { name: 'votingId', type: 'uint256' },
          { name: 'optionId', type: 'uint256' },
          { name: 'voteType', type: 'uint8' },
          { name: 'votingAmt', type: 'uint256' },
          { name: 'user', type: 'address' },
        ],
      } as const;

      const message = {
        timestamp: 1234567890n,
        missionId: 100n,
        votingId: 200n,
        optionId: 1n,
        voteType: 1,
        votingAmt: 1000000000000000000n,
        user: EXPECTED_ADDRESS,
      };

      const signature = await adapter.signTypedData({
        domain,
        types,
        primaryType: 'VoteRecord',
        message,
      });

      // 서명은 0x로 시작하는 130자리 hex string (65 bytes)
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
      expect(signature.length).toBe(132);
    });

    it('Batch 타입의 EIP-712 데이터를 서명할 수 있어야 한다', async () => {
      const adapter = new WalletAdapter(MOCK_PRIVATE_KEY);

      const domain = {
        name: 'CelebusVoting',
        version: '1',
        chainId: 31337,
        verifyingContract: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address,
      };

      const types = {
        Batch: [
          { name: 'batchNonce', type: 'uint256' },
          { name: 'votes', type: 'VoteRecord[]' },
        ],
        VoteRecord: [
          { name: 'timestamp', type: 'uint256' },
          { name: 'missionId', type: 'uint256' },
          { name: 'votingId', type: 'uint256' },
          { name: 'optionId', type: 'uint256' },
          { name: 'voteType', type: 'uint8' },
          { name: 'votingAmt', type: 'uint256' },
          { name: 'user', type: 'address' },
        ],
      } as const;

      const message = {
        batchNonce: 0n,
        votes: [
          {
            timestamp: 1234567890n,
            missionId: 100n,
            votingId: 200n,
            optionId: 1n,
            voteType: 1,
            votingAmt: 1000000000000000000n,
            user: EXPECTED_ADDRESS,
          },
        ],
      };

      const signature = await adapter.signTypedData({
        domain,
        types,
        primaryType: 'Batch',
        message,
      });

      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
      expect(signature.length).toBe(132);
    });

    it('동일한 데이터에 대해 항상 동일한 서명을 생성해야 한다 (deterministic)', async () => {
      const adapter = new WalletAdapter(MOCK_PRIVATE_KEY);

      const domain = {
        name: 'CelebusVoting',
        version: '1',
        chainId: 31337,
        verifyingContract: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address,
      };

      const types = {
        VoteRecord: [
          { name: 'timestamp', type: 'uint256' },
          { name: 'missionId', type: 'uint256' },
          { name: 'votingId', type: 'uint256' },
          { name: 'optionId', type: 'uint256' },
          { name: 'voteType', type: 'uint8' },
          { name: 'votingAmt', type: 'uint256' },
          { name: 'user', type: 'address' },
        ],
      } as const;

      const message = {
        timestamp: 1234567890n,
        missionId: 100n,
        votingId: 200n,
        optionId: 1n,
        voteType: 1,
        votingAmt: 1000000000000000000n,
        user: EXPECTED_ADDRESS,
      };

      const signature1 = await adapter.signTypedData({
        domain,
        types,
        primaryType: 'VoteRecord',
        message,
      });

      const signature2 = await adapter.signTypedData({
        domain,
        types,
        primaryType: 'VoteRecord',
        message,
      });

      expect(signature1).toBe(signature2);
    });
  });

  describe('getPublicClient', () => {
    it('PublicClient 인스턴스를 반환해야 한다', () => {
      const adapter = new WalletAdapter(MOCK_PRIVATE_KEY);
      const client = adapter.getPublicClient();

      expect(client).toBeDefined();
      expect(typeof client.getChainId).toBe('function');
    });

    it('동일한 PublicClient 인스턴스를 재사용해야 한다 (캐싱)', () => {
      const adapter = new WalletAdapter(MOCK_PRIVATE_KEY);
      const client1 = adapter.getPublicClient();
      const client2 = adapter.getPublicClient();

      expect(client1).toBe(client2);
    });
  });

  describe('getWalletClient', () => {
    it('WalletClient 인스턴스를 반환해야 한다', () => {
      const adapter = new WalletAdapter(MOCK_PRIVATE_KEY);
      const client = adapter.getWalletClient();

      expect(client).toBeDefined();
      expect(client.account).toBeDefined();
      expect(client.account?.address).toBe(EXPECTED_ADDRESS);
    });

    it('동일한 WalletClient 인스턴스를 재사용해야 한다 (캐싱)', () => {
      const adapter = new WalletAdapter(MOCK_PRIVATE_KEY);
      const client1 = adapter.getWalletClient();
      const client2 = adapter.getWalletClient();

      expect(client1).toBe(client2);
    });
  });
});
