/**
 * Block Explorer URL 생성 유틸리티
 *
 * 지원하는 체인의 블록 익스플로러 URL을 동적으로 생성합니다.
 * - 트랜잭션 해시 → TX 탐색기 URL
 * - 주소 → 주소 탐색기 URL
 * - 로컬 체인(Anvil)의 경우 null 반환
 */

import {
  getChainById,
  opBNBTestnet,
} from '@/infrastructure/config/chains';

/**
 * 체인 ID로 체인 정보 조회 (에러 없이 undefined 반환)
 */
function getChainByIdSafe(chainId?: number) {
  if (chainId === undefined) {
    // 기본값: opBNB Testnet
    return opBNBTestnet;
  }
  try {
    return getChainById(chainId);
  } catch {
    return undefined;
  }
}

/**
 * 트랜잭션 해시로 블록 익스플로러 URL 생성
 *
 * @param txHash - 트랜잭션 해시
 * @param chainId - 체인 ID (기본값: opBNBTestnet)
 * @returns 블록 익스플로러 TX URL 또는 null (로컬 체인인 경우)
 *
 * @example
 * getTxExplorerUrl('0x123...') // opBNBTestnet
 * // => 'https://testnet.opbnbscan.com/tx/0x123...'
 *
 * getTxExplorerUrl('0x123...', 97) // BSC Testnet
 * // => 'https://testnet.bscscan.com/tx/0x123...'
 *
 * getTxExplorerUrl('0x123...', 31337) // Anvil (local)
 * // => null
 */
export function getTxExplorerUrl(
  txHash: string,
  chainId?: number
): string | null {
  const chain = getChainByIdSafe(chainId);

  if (!chain) {
    return null;
  }

  const baseUrl = chain.blockExplorers?.default?.url;
  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}/tx/${txHash}`;
}

/**
 * 주소로 블록 익스플로러 URL 생성
 *
 * @param address - 이더리움 주소
 * @param chainId - 체인 ID (기본값: opBNBTestnet)
 * @returns 블록 익스플로러 주소 URL 또는 null (로컬 체인인 경우)
 *
 * @example
 * getAddressExplorerUrl('0xABC...')
 * // => 'https://testnet.opbnbscan.com/address/0xABC...'
 */
export function getAddressExplorerUrl(
  address: string,
  chainId?: number
): string | null {
  const chain = getChainByIdSafe(chainId);

  if (!chain) {
    return null;
  }

  const baseUrl = chain.blockExplorers?.default?.url;
  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}/address/${address}`;
}

/**
 * 블록 번호로 블록 익스플로러 URL 생성
 *
 * @param blockNumber - 블록 번호
 * @param chainId - 체인 ID (기본값: opBNBTestnet)
 * @returns 블록 익스플로러 블록 URL 또는 null (로컬 체인인 경우)
 */
export function getBlockExplorerUrl(
  blockNumber: number | bigint,
  chainId?: number
): string | null {
  const chain = getChainByIdSafe(chainId);

  if (!chain) {
    return null;
  }

  const baseUrl = chain.blockExplorers?.default?.url;
  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}/block/${blockNumber.toString()}`;
}
