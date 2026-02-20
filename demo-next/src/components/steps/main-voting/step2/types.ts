import type { VoteType } from '@/domain/entities/VoteRecord';
import type { Address } from '@/domain/types';

export interface UIVoteRecord {
  userIndex: number;
  userAddress: Address;
  timestamp: string;
  missionId: string;
  votingId: string;
  optionId: string;
  voteType: VoteType;
  userId: string;
  votingAmt: string;
}

export type RecordCardColor = 'blue' | 'green' | 'purple';

export interface IndexedRecord {
  record: UIVoteRecord;
  globalIndex: number;
}
