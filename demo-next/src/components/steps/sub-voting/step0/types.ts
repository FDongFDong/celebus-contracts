export type {
  SetupStatusMessage as StatusMessage,
  SetupStatusType as StatusType,
} from '@/components/steps/shared/step0/types';

export interface QuestionData {
  missionId: bigint;
  questionId: number;
  text: string;
  allowed: boolean;
}

export interface OptionData {
  missionId: bigint;
  questionId: number;
  optionId: number;
  text: string;
  allowed: boolean;
}
