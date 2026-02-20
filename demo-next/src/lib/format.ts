/**
 * 공통 포맷팅 유틸리티
 *
 * 주소 축약, 토큰 금액, 타임스탬프 등 프로젝트 전반에서 사용하는 포맷 함수
 */

import { formatUnits } from 'viem';
import type { Address } from '@/domain/types';

/**
 * 블록체인 주소를 축약 표시
 * 기본: 0x1234...5678 (앞 6자, 뒤 4자)
 */
export function formatAddress(address: Address | null, chars = 6): string {
  if (!address) return '-';
  return `${address.slice(0, chars)}...${address.slice(-(chars - 2))}`;
}

/**
 * 트랜잭션 해시를 축약 표시
 * 기본: 0x12345678...90abcdef (앞 10자, 뒤 8자)
 */
export function formatTxHash(hash: string, front = 10, back = 8): string {
  if (!hash) return '-';
  const minLength = front + back;
  if (hash.length <= minLength) return hash;
  return `${hash.slice(0, front)}...${hash.slice(-back)}`;
}

/**
 * bigint 토큰 금액을 사람이 읽을 수 있는 형태로 변환
 * 예: formatTokenAmount(1000000000000000000n, 18) → "1"
 *     formatTokenAmount(1500000000000000000n, 18) → "1.5"
 *
 * 주의: 입력 필드 값 계산에도 사용되므로 쉼표를 넣지 않은 raw 문자열을 반환합니다.
 */
export function formatTokenAmount(amount: bigint, decimals: number): string {
  return formatUnits(amount, decimals);
}

/**
 * 숫자 문자열에 천 단위 구분자(,)를 추가
 * 예: "5000000000" -> "5,000,000,000"
 *     "12345.67" -> "12,345.67"
 */
export function formatNumberWithCommas(value: string): string {
  if (!/^-?\d+(\.\d+)?$/.test(value)) return value;

  const [integerPart, fractionPart] = value.split('.');
  const sign = integerPart.startsWith('-') ? '-' : '';
  const digits = sign ? integerPart.slice(1) : integerPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (!fractionPart) {
    return `${sign}${grouped}`;
  }
  return `${sign}${grouped}.${fractionPart}`;
}

/**
 * 토큰 금액 표시 전용 포맷 (천 단위 구분자 포함)
 */
export function formatTokenAmountDisplay(amount: bigint, decimals: number): string {
  return formatNumberWithCommas(formatTokenAmount(amount, decimals));
}

/**
 * bigint 정수 표시 전용 포맷 (천 단위 구분자 포함)
 */
export function formatBigIntWithCommas(value: bigint): string {
  return formatNumberWithCommas(value.toString());
}

/**
 * Unix timestamp (초 단위 bigint)를 한국 시간 문자열로 변환
 */
export function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}
