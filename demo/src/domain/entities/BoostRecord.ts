import type { Address } from 'viem';

/**
 * BoostRecord 엔티티
 *
 * 컨트랙트의 BoostRecord 구조체와 일치하는 도메인 엔티티
 * EIP-712 서명을 위한 TypedData 생성 기능 포함
 */

export type BoostingWith = 0 | 1; // 0=BP, 1=CELB

export interface BoostRecordData {
  recordId: bigint;
  timestamp: bigint;
  missionId: bigint;
  boostingId: bigint;
  optionId: bigint;
  boostingWith: BoostingWith;
  amt: bigint;
  userId: string;
}

export interface BoostRecordTypedData {
  types: {
    BoostRecord: Array<{ name: string; type: string }>;
  };
  primaryType: 'BoostRecord';
  message: {
    timestamp: bigint;
    missionId: bigint;
    boostingId: bigint;
    optionId: bigint;
    boostingWith: BoostingWith;
    amt: bigint;
    user: Address;
  };
}

export class BoostRecord {
  readonly recordId: bigint;
  readonly timestamp: bigint;
  readonly missionId: bigint;
  readonly boostingId: bigint;
  readonly optionId: bigint;
  readonly boostingWith: BoostingWith;
  readonly amt: bigint;
  readonly userId: string;

  constructor(data: BoostRecordData) {
    this.recordId = data.recordId;
    this.timestamp = data.timestamp;
    this.missionId = data.missionId;
    this.boostingId = data.boostingId;
    this.optionId = data.optionId;
    this.boostingWith = data.boostingWith;
    this.amt = data.amt;
    this.userId = data.userId;
  }

  /**
   * BoostRecord 유효성 검증
   *
   * @returns 모든 필드가 유효하면 true
   */
  isValid(): boolean {
    // timestamp 검증
    if (this.timestamp === 0n) return false;

    // missionId 검증
    if (this.missionId === 0n) return false;

    // boostingId 검증
    if (this.boostingId === 0n) return false;

    // optionId 검증
    if (this.optionId === 0n) return false;

    // boostingWith 검증 (0 또는 1만 허용)
    if (this.boostingWith !== 0 && this.boostingWith !== 1) return false;

    // amt 검증 (0보다 커야 함)
    if (this.amt === 0n) return false;

    // userId 검증
    if (!this.userId || this.userId.trim() === '') return false;

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
  toTypedData(userAddress: Address): BoostRecordTypedData {
    return {
      types: {
        BoostRecord: [
          { name: 'timestamp', type: 'uint256' },
          { name: 'missionId', type: 'uint256' },
          { name: 'boostingId', type: 'uint256' },
          { name: 'optionId', type: 'uint256' },
          { name: 'boostingWith', type: 'uint8' },
          { name: 'amt', type: 'uint256' },
          { name: 'user', type: 'address' },
        ],
      },
      primaryType: 'BoostRecord',
      message: {
        timestamp: this.timestamp,
        missionId: this.missionId,
        boostingId: this.boostingId,
        optionId: this.optionId,
        boostingWith: this.boostingWith,
        amt: this.amt,
        user: userAddress,
      },
    };
  }
}
