/**
 * BigInt 안전 변환 유틸리티
 *
 * 사용자 입력을 BigInt로 변환할 때 오버플로우 및 유효성 검사를 수행합니다.
 */

/** uint256 최댓값 */
export const MAX_UINT256 = 2n ** 256n - 1n;

/** JavaScript Number.MAX_SAFE_INTEGER */
export const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * 문자열을 안전하게 BigInt로 변환
 *
 * @param value - 변환할 문자열
 * @param options - 옵션
 * @returns 변환된 BigInt 또는 에러
 * @throws 유효하지 않은 입력 시 에러
 */
export function parseSafeBigInt(
  value: string,
  options?: {
    maxValue?: bigint;
    allowNegative?: boolean;
    fieldName?: string;
  }
): bigint {
  const { maxValue = MAX_UINT256, allowNegative = false, fieldName = 'value' } = options ?? {};

  // 빈 문자열 체크
  if (!value || value.trim() === '') {
    throw new Error(`${fieldName}: 값이 비어있습니다`);
  }

  const trimmed = value.trim();

  // 숫자 패턴 검증 (음수 허용 여부에 따라)
  const pattern = allowNegative ? /^-?\d+$/ : /^\d+$/;
  if (!pattern.test(trimmed)) {
    throw new Error(`${fieldName}: 유효한 숫자가 아닙니다`);
  }

  const n = BigInt(trimmed);

  // 음수 체크
  if (!allowNegative && n < 0n) {
    throw new Error(`${fieldName}: 음수는 허용되지 않습니다`);
  }

  // 최댓값 체크
  if (n > maxValue) {
    throw new Error(`${fieldName}: 값이 최대 허용값을 초과합니다`);
  }

  return n;
}

/**
 * BigInt를 안전하게 Number로 변환
 *
 * MAX_SAFE_INTEGER를 초과하면 에러를 발생시킵니다.
 *
 * @param value - 변환할 BigInt
 * @param fieldName - 에러 메시지에 사용할 필드명
 * @returns 변환된 Number
 * @throws MAX_SAFE_INTEGER 초과 시 에러
 */
export function bigIntToSafeNumber(value: bigint, fieldName = 'value'): number {
  if (value > MAX_SAFE_INTEGER) {
    throw new Error(`${fieldName}: Number.MAX_SAFE_INTEGER를 초과하여 정밀도가 손실될 수 있습니다`);
  }
  if (value < -MAX_SAFE_INTEGER) {
    throw new Error(`${fieldName}: Number.MIN_SAFE_INTEGER 미만으로 정밀도가 손실될 수 있습니다`);
  }
  return Number(value);
}

/**
 * 문자열이 유효한 BigInt로 변환 가능한지 확인
 *
 * @param value - 확인할 문자열
 * @returns 유효 여부
 */
export function isValidBigIntString(value: string): boolean {
  if (!value || value.trim() === '') return false;
  return /^\d+$/.test(value.trim());
}
