import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

/**
 * 민감 지갑 데이터 유틸리티
 *
 * 보안상 비밀키/니모닉을 localStorage에 영구 저장하지 않습니다.
 * 세션 동안만 유지되는 메모리 저장소를 사용합니다.
 */

const ephemeralSecretStore = new Map<string, string>();

/**
 * 호환성용 API (암호화 미사용)
 *
 * 기존 호출부를 깨지 않기 위해 동일 값을 반환합니다.
 */
export function encryptPrivateKey(privateKey: string): string {
  return privateKey;
}

/**
 * 호환성용 API (복호화 미사용)
 */
export function decryptPrivateKey(encrypted: string): string {
  return encrypted;
}

/**
 * 비밀키 유효성 검사
 * @param privateKey - 검사할 비밀키
 * @returns 유효 여부
 */
export function isValidPrivateKey(privateKey: string): boolean {
  const regex = /^0x[a-fA-F0-9]{64}$/;
  return regex.test(privateKey);
}

/**
 * 니모닉 유효성 검사 (12 또는 24 단어)
 * @param mnemonic - 검사할 니모닉
 * @returns 유효 여부
 */
export function isValidMnemonic(mnemonic: string): boolean {
  const normalized = mnemonic.trim().toLowerCase();
  const words = normalized.split(/\s+/);
  if (words.length !== 12 && words.length !== 24) {
    return false;
  }
  return validateMnemonic(normalized, wordlist);
}

/**
 * 민감값을 현재 세션 메모리에만 저장
 */
export function saveEncryptedKey(key: string, secret: string): void {
  if (!secret) return;
  ephemeralSecretStore.set(key, secret);
}

/**
 * 현재 세션 메모리에서 민감값 조회
 */
export function loadEncryptedKey(key: string): string | null {
  return ephemeralSecretStore.get(key) ?? null;
}

/**
 * 현재 세션 메모리에서 민감값 삭제
 */
export function removeEncryptedKey(key: string): void {
  ephemeralSecretStore.delete(key);
}
