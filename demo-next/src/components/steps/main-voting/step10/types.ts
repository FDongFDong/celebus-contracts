export interface UserBatchResult {
  recordsHash: string;
  signature: string;
  recovered: string;
  isValid: boolean;
}

export interface ExecutorResult {
  batchDigest: string;
  signature: string;
  recovered: string;
  isValid: boolean;
}

export interface VerifyResult {
  r: `0x${string}`;
  s: `0x${string}`;
  v: bigint | undefined;
  isValid: boolean;
  recoveredAddress: `0x${string}`;
  expectedAddress: `0x${string}`;
  target: 'userBatch' | 'executor';
  info: string;
}

export type TabType = 'userBatch' | 'executor' | 'verify';
