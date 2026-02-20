import type { Address } from 'viem';

/**
 * VoteRecord 엔티티
 *
 * 컨트랙트의 VoteRecord 구조체와 일치하는 도메인 엔티티
 * EIP-712 서명을 위한 TypedData 생성 기능 포함
 */

export type VoteType = 0 | 1; // 0=Forget, 1=Remember

export interface VoteRecordData {
  recordId: bigint;
  timestamp: bigint;
  missionId: bigint;
  votingId: bigint;
  optionId: bigint;
  voteType: VoteType;
  userId: string;
  votingAmt: bigint;
  userIndex?: number; // UI에서 사용하는 사용자 인덱스 (0, 1, 99)
}

export interface VoteRecordTypedData {
  types: {
    VoteRecord: Array<{ name: string; type: string }>;
  };
  primaryType: 'VoteRecord';
  message: {
    timestamp: bigint;
    missionId: bigint;
    votingId: bigint;
    optionId: bigint;
    voteType: VoteType;
    votingAmt: bigint;
    user: Address;
  };
}

export class VoteRecord {
  readonly recordId: bigint;
  readonly timestamp: bigint;
  readonly missionId: bigint;
  readonly votingId: bigint;
  readonly optionId: bigint;
  readonly voteType: VoteType;
  readonly userId: string;
  readonly votingAmt: bigint;
  readonly userIndex?: number; // UI에서 사용하는 사용자 인덱스

  constructor(data: VoteRecordData) {
    this.recordId = data.recordId;
    this.timestamp = data.timestamp;
    this.missionId = data.missionId;
    this.votingId = data.votingId;
    this.optionId = data.optionId;
    this.voteType = data.voteType;
    this.userId = data.userId;
    this.votingAmt = data.votingAmt;
    this.userIndex = data.userIndex;
  }

  /**
   * VoteRecord 유효성 검증
   *
   * @returns 모든 필드가 유효하면 true
   */
  isValid(): boolean {
    // timestamp 검증
    if (this.timestamp === 0n) return false;

    // missionId 검증
    if (this.missionId === 0n) return false;

    // votingId 검증
    if (this.votingId === 0n) return false;

    // optionId 검증
    if (this.optionId === 0n) return false;

    // voteType 검증 (0 또는 1만 허용)
    if (this.voteType !== 0 && this.voteType !== 1) return false;

    // userId 검증
    if (!this.userId || this.userId.trim() === '') return false;

    // votingAmt 검증
    if (this.votingAmt === 0n) return false;

    return true;
  }

  /**
   * EIP-712 서명용 TypedData 생성
   *
   * 참고:
   * - recordId는 백엔드가 생성하므로 서명 데이터에서 제외
   * - userId는 off-chain 데이터이므로 서명 데이터에서 제외
   * - user address는 서명자 주소로 서명 데이터에 포함 (보안 강화)
   *
   * @param userAddress - 서명자의 지갑 주소
   * @returns EIP-712 TypedData
   */
  toTypedData(userAddress: Address): VoteRecordTypedData {
    return {
      types: {
        VoteRecord: [
          { name: 'timestamp', type: 'uint256' },
          { name: 'missionId', type: 'uint256' },
          { name: 'votingId', type: 'uint256' },
          { name: 'optionId', type: 'uint256' },
          { name: 'voteType', type: 'uint8' },
          { name: 'votingAmt', type: 'uint256' },
          { name: 'user', type: 'address' },
        ],
      },
      primaryType: 'VoteRecord',
      message: {
        timestamp: this.timestamp,
        missionId: this.missionId,
        votingId: this.votingId,
        optionId: this.optionId,
        voteType: this.voteType,
        votingAmt: this.votingAmt,
        user: userAddress,
      },
    };
  }
}
