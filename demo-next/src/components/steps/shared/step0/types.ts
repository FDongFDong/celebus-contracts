import type { createStepPublicClient, createStepWalletClient } from '../step0-clients';

export type SetupStatusType = 'success' | 'error' | 'info';

export interface SetupStatusMessage {
  type: SetupStatusType;
  message: string;
}

export type StepWalletClient = ReturnType<typeof createStepWalletClient>;
export type StepPublicClient = ReturnType<typeof createStepPublicClient>;
