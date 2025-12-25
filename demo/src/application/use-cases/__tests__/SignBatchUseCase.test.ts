import { describe, it, expect } from 'vitest';
import { SignBatchUseCase } from '../SignBatchUseCase';
import { VoteRecord } from '../../../domain/entities/VoteRecord';
import { EIP712Domain } from '../../../domain/value-objects/EIP712Domain';
import type { Address } from '../../../domain/types';

describe('SignBatchUseCase', () => {
  const mockDomain = new EIP712Domain(
    'CelebusVoting',
    '1',
    31337n,
    '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address
  );

  const mockUserAddress: Address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  const createMockVoteRecord = (overrides = {}): VoteRecord => {
    return new VoteRecord({
      recordId: 1n,
      timestamp: 1234567890n,
      missionId: 100n,
      votingId: 200n,
      optionId: 1n,
      voteType: 1,
      userId: 'user123',
      votingAmt: 1000000000000000000n, // 1 ether
      ...overrides,
    });
  };

  describe('execute', () => {
    it('단일 VoteRecord로 SignBatchRequest를 생성해야 한다', () => {
      const useCase = new SignBatchUseCase(mockDomain);
      const voteRecords = [createMockVoteRecord()];

      const result = useCase.execute({
        voteRecords,
        userAddress: mockUserAddress,
        batchNonce: 0n,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const { value: request } = result;

      // Domain 검증
      expect(request.domain).toEqual({
        name: 'CelebusVoting',
        version: '1',
        chainId: 31337,
        verifyingContract: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      });

      // Types 검증
      expect(request.types).toHaveProperty('Batch');
      expect(request.types.Batch).toEqual([
        { name: 'batchNonce', type: 'uint256' },
        { name: 'votes', type: 'VoteRecord[]' },
      ]);

      expect(request.types).toHaveProperty('VoteRecord');
      expect(request.types.VoteRecord).toEqual([
        { name: 'timestamp', type: 'uint256' },
        { name: 'missionId', type: 'uint256' },
        { name: 'votingId', type: 'uint256' },
        { name: 'optionId', type: 'uint256' },
        { name: 'voteType', type: 'uint8' },
        { name: 'votingAmt', type: 'uint256' },
        { name: 'user', type: 'address' },
      ]);

      // PrimaryType 검증
      expect(request.primaryType).toBe('Batch');

      // Message 검증
      expect(request.message).toHaveProperty('batchNonce');
      expect(request.message.batchNonce).toBe(0n);
      expect(request.message).toHaveProperty('votes');
      expect(Array.isArray(request.message.votes)).toBe(true);

      // votes 타입 가드
      const votes = request.message.votes as Array<{
        timestamp: bigint;
        missionId: bigint;
        votingId: bigint;
        optionId: bigint;
        voteType: number;
        votingAmt: bigint;
        user: Address;
      }>;

      expect(votes).toHaveLength(1);

      const vote = votes[0];
      expect(vote).toBeDefined();
      expect(vote.timestamp).toBe(1234567890n);
      expect(vote.missionId).toBe(100n);
      expect(vote.votingId).toBe(200n);
      expect(vote.optionId).toBe(1n);
      expect(vote.voteType).toBe(1);
      expect(vote.votingAmt).toBe(1000000000000000000n);
      expect(vote.user).toBe(mockUserAddress);
    });

    it('여러 VoteRecord로 SignBatchRequest를 생성해야 한다', () => {
      const useCase = new SignBatchUseCase(mockDomain);
      const voteRecords = [
        createMockVoteRecord({ recordId: 1n, optionId: 1n }),
        createMockVoteRecord({ recordId: 2n, optionId: 2n }),
        createMockVoteRecord({ recordId: 3n, optionId: 3n }),
      ];

      const result = useCase.execute({
        voteRecords,
        userAddress: mockUserAddress,
        batchNonce: 5n,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const { value: request } = result;

      expect(request.message.batchNonce).toBe(5n);

      // votes 타입 가드
      const votes = request.message.votes as Array<{
        timestamp: bigint;
        missionId: bigint;
        votingId: bigint;
        optionId: bigint;
        voteType: number;
        votingAmt: bigint;
        user: Address;
      }>;

      expect(votes).toHaveLength(3);
      expect(votes[0]?.optionId).toBe(1n);
      expect(votes[1]?.optionId).toBe(2n);
      expect(votes[2]?.optionId).toBe(3n);

      // 모든 votes가 같은 userAddress를 가져야 함
      expect(votes[0]?.user).toBe(mockUserAddress);
      expect(votes[1]?.user).toBe(mockUserAddress);
      expect(votes[2]?.user).toBe(mockUserAddress);
    });

    it('빈 VoteRecord 배열일 때 ValidationError를 반환해야 한다', () => {
      const useCase = new SignBatchUseCase(mockDomain);

      const result = useCase.execute({
        voteRecords: [],
        userAddress: mockUserAddress,
        batchNonce: 0n,
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toContain('At least one vote record is required');
    });

    it('유효하지 않은 VoteRecord가 포함된 경우 ValidationError를 반환해야 한다', () => {
      const useCase = new SignBatchUseCase(mockDomain);
      const invalidVoteRecord = createMockVoteRecord({ timestamp: 0n }); // invalid timestamp

      const result = useCase.execute({
        voteRecords: [invalidVoteRecord],
        userAddress: mockUserAddress,
        batchNonce: 0n,
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toContain('Invalid vote record');
    });

    it('유효한 VoteRecord와 유효하지 않은 VoteRecord가 섞여있을 때 ValidationError를 반환해야 한다', () => {
      const useCase = new SignBatchUseCase(mockDomain);
      const voteRecords = [
        createMockVoteRecord({ recordId: 1n }), // valid
        createMockVoteRecord({ recordId: 2n, votingAmt: 0n }), // invalid votingAmt
        createMockVoteRecord({ recordId: 3n }), // valid
      ];

      const result = useCase.execute({
        voteRecords,
        userAddress: mockUserAddress,
        batchNonce: 0n,
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toContain('Invalid vote record at index 1');
    });

    it('batchNonce가 음수일 때 ValidationError를 반환해야 한다', () => {
      const useCase = new SignBatchUseCase(mockDomain);
      const voteRecords = [createMockVoteRecord()];

      const result = useCase.execute({
        voteRecords,
        userAddress: mockUserAddress,
        batchNonce: -1n,
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toContain('Batch nonce must be non-negative');
    });
  });
});
