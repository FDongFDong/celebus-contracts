import type { BoostingWith } from '@/domain/entities/BoostRecord';
import type { Address } from '@/domain/types';
import type { SelectedUser } from '@/lib/user-step-helpers';

export type RecordBucketKey = 'user1' | 'user2' | 'custom';
export type BoostingWithInput = '0' | '1';

export interface UIBoostRecord {
  userIndex: number;
  userAddress: Address;
  userNonce: string;
  timestamp: string;
  missionId: string;
  boostingId: string;
  optionId: string;
  boostingWith: BoostingWith;
  amt: string;
  userId: string;
}

export interface IndexedBoostRecord {
  record: UIBoostRecord;
  globalIndex: number;
}

export interface NonceCheckStatus {
  type: 'success' | 'error' | null;
  message: string;
}

export interface BoostStep2State {
  selectedUser: SelectedUser;
  setSelectedUser: (value: SelectedUser) => void;
  customPrivateKey: string;
  setCustomPrivateKey: (value: string) => void;
  customAddress: string | null;
  userNonce: string;
  setUserNonce: (value: string) => void;
  timestamp: string;
  setTimestamp: (value: string) => void;
  boostingId: string;
  setBoostingId: (value: string) => void;
  missionId: string;
  setMissionId: (value: string) => void;
  optionId: string;
  setOptionId: (value: string) => void;
  boostingWith: BoostingWithInput;
  setBoostingWith: (value: BoostingWithInput) => void;
  amt: string;
  setAmt: (value: string) => void;
  recordsCount: number;
  user1Record: IndexedBoostRecord | null;
  user2Record: IndexedBoostRecord | null;
  customRecord: IndexedBoostRecord | null;
  nonceCheckStatus: NonceCheckStatus;
  handleGenerateTimestamp: () => void;
  handleGenerateBoostingId: () => void;
  handleGenerateNonce: () => void;
  handleCheckNonce: () => Promise<void>;
  handleAddRecord: () => void;
  handleDeleteRecord: (index: number) => void;
}
