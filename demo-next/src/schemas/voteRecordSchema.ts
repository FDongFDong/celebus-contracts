/**
 * Vote Record Form Schema
 *
 * React Hook Form + Zod를 사용한 투표 레코드 폼 유효성 검사 스키마
 */

import { z } from 'zod';

/** uint256 최댓값 (문자열 비교용) */
const MAX_UINT256_STR = (2n ** 256n - 1n).toString();

/**
 * BigInt 범위를 검증하는 refinement
 * 숫자 문자열이 uint256 범위 내에 있는지 확인
 */
const isWithinUint256Range = (value: string): boolean => {
  // 길이가 MAX_UINT256_STR보다 짧으면 확실히 범위 내
  if (value.length < MAX_UINT256_STR.length) return true;
  // 길이가 같으면 문자열 비교 (숫자 문자열이므로 사전식 비교 가능)
  if (value.length === MAX_UINT256_STR.length) return value <= MAX_UINT256_STR;
  // 길이가 더 길면 범위 초과
  return false;
};

/**
 * 숫자 문자열 검증 헬퍼
 * - 필수 입력
 * - 숫자만 허용
 * - uint256 범위 검증
 */
const numericString = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName}을(를) 입력해주세요`)
    .regex(/^\d+$/, '숫자만 입력 가능합니다')
    .refine(isWithinUint256Range, '값이 허용 범위를 초과합니다');

/**
 * 투표 레코드 폼 스키마
 */
export const voteRecordFormSchema = z.object({
  timestamp: numericString('타임스탬프'),
  missionId: numericString('미션 ID'),
  votingId: numericString('투표 ID'),
  optionId: numericString('옵션 ID'),
  userId: z.string().min(1, '사용자 ID를 입력해주세요'),
  votingAmt: numericString('투표량'),
});

/**
 * 폼 데이터 타입
 */
export type VoteRecordFormData = z.infer<typeof voteRecordFormSchema>;

/**
 * 기본값
 */
export const defaultVoteRecordFormValues: VoteRecordFormData = {
  timestamp: '',
  missionId: '1',
  votingId: '',
  optionId: '1',
  userId: '1',
  votingAmt: '100',
};
