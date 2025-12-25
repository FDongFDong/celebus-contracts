/**
 * CreateRecordUseCase
 *
 * VoteRecord 생성을 담당하는 Use Case
 * Domain 계층의 VoteRecord 엔티티를 사용하여 생성하고 유효성 검증
 */

import { VoteRecord, type VoteRecordData } from '../../domain/entities/VoteRecord';
import { ValidationError } from '../errors';
import type { Result } from '../../domain/types';
import { success, failure } from '../../domain/types';

export class CreateRecordUseCase {
  /**
   * VoteRecord 생성 및 유효성 검증
   *
   * @param params - VoteRecord 생성 파라미터
   * @returns Result<VoteRecord, ValidationError>
   */
  execute(params: VoteRecordData): Result<VoteRecord, ValidationError> {
    // VoteRecord 엔티티 생성
    const record = new VoteRecord(params);

    // Domain 계층의 유효성 검증 사용
    if (!record.isValid()) {
      return failure(new ValidationError('Invalid VoteRecord: validation failed'));
    }

    return success(record);
  }
}
