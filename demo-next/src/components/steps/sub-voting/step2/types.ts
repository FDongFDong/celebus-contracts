import type { SelectedUser } from '@/lib/user-step-helpers';

export interface UISubVoteRecord {
  userIndex: number;
  userAddress: string;
  userNonce: string;
  timestamp: string;
  missionId: string;
  votingId: string;
  questionId: string;
  options: string[];
  userId: string;
  votingAmt: string;
}

export interface IndexedSubVoteRecord {
  record: UISubVoteRecord;
  globalIndex: number;
}

export interface NonceCheckResult {
  isUsed: boolean;
  message: string;
}

export interface SubStep2State {
  selectedUser: SelectedUser;
  setSelectedUser: (value: SelectedUser) => void;
  customPrivateKey: string;
  customWalletAddress: string | null;
  handleCustomPrivateKeyChange: (value: string) => void;
  userNonce: string;
  setUserNonce: (value: string) => void;
  isCheckingNonce: boolean;
  nonceCheckResult: NonceCheckResult | null;
  timestamp: string;
  setTimestamp: (value: string) => void;
  missionId: string;
  setMissionId: (value: string) => void;
  votingId: string;
  setVotingId: (value: string) => void;
  questionId: string;
  setQuestionId: (value: string) => void;
  options: string;
  setOptions: (value: string) => void;
  votingAmt: string;
  setVotingAmt: (value: string) => void;
  optionsError: string;
  clearOptionsError: () => void;
  recordsCount: number;
  maxRecordsPerBatch: number;
  maxOptionsPerRecord: number;
  user1Records: IndexedSubVoteRecord[];
  user2Records: IndexedSubVoteRecord[];
  customRecords: IndexedSubVoteRecord[];
  handleGenerateNonce: () => void;
  handleCheckNonce: () => Promise<void>;
  handleGenerateTimestamp: () => void;
  handleGenerateVotingId: () => void;
  handleAddRecord: () => void;
  handleDeleteRecord: (index: number) => void;
}
