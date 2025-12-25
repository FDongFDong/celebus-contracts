import type { Address } from 'viem';

/**
 * SubVoteRecord 엔티티
 *
 * SubVoting 컨트랙트의 VoteRecord 구조체와 일치하는 도메인 엔티티
 * EIP-712 서명을 위한 TypedData 생성 기능 포함
 *
 * MainVoting과의 주요 차이점:
 * - voteType 필드 없음
 * - questionId 필드 추가
 */

export interface SubVoteRecordData {
  recordId: bigint;
  timestamp: bigint;
  missionId: bigint;
  votingId: bigint;
  questionId: bigint;
  optionId: bigint;
  userId: string;
  votingAmt: bigint;
}

export interface SubVoteRecordTypedData {
  types: {
    SubVoteRecord: Array<{ name: string; type: string }>;
  };
  primaryType: 'SubVoteRecord';
  message: {
    timestamp: bigint;
    missionId: bigint;
    votingId: bigint;
    questionId: bigint;
    optionId: bigint;
    votingAmt: bigint;
    user: Address;
  };
}

export class SubVoteRecord {
  readonly recordId: bigint;
  readonly timestamp: bigint;
  readonly missionId: bigint;
  readonly votingId: bigint;
  readonly questionId: bigint;
  readonly optionId: bigint;
  readonly userId: string;
  readonly votingAmt: bigint;

  constructor(data: SubVoteRecordData) {
    this.recordId = data.recordId;
    this.timestamp = data.timestamp;
    this.missionId = data.missionId;
    this.votingId = data.votingId;
    this.questionId = data.questionId;
    this.optionId = data.optionId;
    this.userId = data.userId;
    this.votingAmt = data.votingAmt;
  }

  /**
   * SubVoteRecord 유효성 검증
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

    // questionId 검증
    if (this.questionId === 0n) return false;

    // optionId 검증
    if (this.optionId === 0n) return false;

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
   * - voteType은 SubVoting에서 사용하지 않음
   *
   * @param userAddress - 서명자의 지갑 주소
   * @returns EIP-712 TypedData
   */
  toTypedData(userAddress: Address): SubVoteRecordTypedData {
    return {
      types: {
        SubVoteRecord: [
          { name: 'timestamp', type: 'uint256' },
          { name: 'missionId', type: 'uint256' },
          { name: 'votingId', type: 'uint256' },
          { name: 'questionId', type: 'uint256' },
          { name: 'optionId', type: 'uint256' },
          { name: 'votingAmt', type: 'uint256' },
          { name: 'user', type: 'address' },
        ],
      },
      primaryType: 'SubVoteRecord',
      message: {
        timestamp: this.timestamp,
        missionId: this.missionId,
        votingId: this.votingId,
        questionId: this.questionId,
        optionId: this.optionId,
        votingAmt: this.votingAmt,
        user: userAddress,
      },
    };
  }
}
