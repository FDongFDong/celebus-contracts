import type { VoteRecord } from '../../domain/entities/VoteRecord';
import type { EIP712Domain, TypedDataDomain } from '../../domain/value-objects/EIP712Domain';
import type { Address, Result } from '../../domain/types';
import { success, failure } from '../../domain/types';
import { ValidationError } from '../errors';

/**
 * EIP-712 TypedData 구조
 */
export interface TypedData {
  [key: string]: Array<{ name: string; type: string }>;
}

/**
 * Batch 서명 요청 데이터
 */
export interface SignBatchRequest {
  domain: TypedDataDomain;
  types: TypedData;
  primaryType: string;
  message: Record<string, unknown>;
}

/**
 * SignBatchUseCase 실행 파라미터
 */
export interface SignBatchParams {
  voteRecords: VoteRecord[];
  userAddress: Address;
  batchNonce: bigint;
}

/**
 * SignBatchUseCase
 *
 * VoteRecord 배열을 받아서 EIP-712 Batch 서명 요청 데이터를 생성합니다.
 *
 * 책임:
 * - VoteRecord 배열 유효성 검증
 * - batchNonce 유효성 검증
 * - EIP-712 TypedData 생성 (Batch + VoteRecord[])
 * - Result<T, E> 패턴으로 에러 처리
 */
export class SignBatchUseCase {
  constructor(private readonly domain: EIP712Domain) {}

  /**
   * Batch 서명 요청 생성
   *
   * @param params - VoteRecord 배열, 사용자 주소, batchNonce
   * @returns SignBatchRequest 또는 ValidationError
   */
  execute(params: SignBatchParams): Result<SignBatchRequest, ValidationError> {
    // 1. batchNonce 검증
    if (params.batchNonce < 0n) {
      return failure(new ValidationError('Batch nonce must be non-negative'));
    }

    // 2. VoteRecord 배열 검증
    if (params.voteRecords.length === 0) {
      return failure(new ValidationError('At least one vote record is required'));
    }

    // 3. 각 VoteRecord 유효성 검증
    for (let i = 0; i < params.voteRecords.length; i++) {
      const record = params.voteRecords[i];
      if (!record || !record.isValid()) {
        return failure(new ValidationError(`Invalid vote record at index ${i}`));
      }
    }

    // 4. EIP-712 TypedData 생성
    const types: TypedData = {
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
    };

    // 5. VoteRecord를 TypedData message로 변환
    const votes = params.voteRecords.map((record) => ({
      timestamp: record.timestamp,
      missionId: record.missionId,
      votingId: record.votingId,
      optionId: record.optionId,
      voteType: record.voteType,
      votingAmt: record.votingAmt,
      user: params.userAddress,
    }));

    // 6. SignBatchRequest 생성
    const request: SignBatchRequest = {
      domain: this.domain.toTypedDataDomain(),
      types,
      primaryType: 'Batch',
      message: {
        batchNonce: params.batchNonce,
        votes,
      },
    };

    return success(request);
  }
}
