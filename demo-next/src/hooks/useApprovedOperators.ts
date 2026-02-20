/**
 * useApprovedOperators Hook
 *
 * NFT 컨트랙트의 ApprovalForAll 이벤트 로그를 조회하여
 * 현재 승인된 operator 목록을 반환합니다.
 *
 * ERC-721에는 "모든 승인된 operator 조회" 함수가 없으므로
 * viem getLogs (eth_getLogs JSON-RPC)로 이벤트 로그를 조회합니다.
 *
 * BSCScan API는 2025년 deprecated → JSON-RPC가 무료 대안
 */

import { useState, useCallback } from 'react';
import { type Address, type PublicClient, parseAbiItem } from 'viem';
import { vibeNftAbi } from '@/infrastructure/contracts';

/**
 * ApprovalForAll 이벤트 ABI
 */
const APPROVAL_FOR_ALL_EVENT = parseAbiItem(
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)'
);

interface ApprovedOperator {
  address: Address;
  isApproved: boolean;
}

interface UseApprovedOperatorsResult {
  operators: ApprovedOperator[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * viem getLogs로 ApprovalForAll 이벤트 로그 조회
 * 최근 10,000 블록 범위에서 조회 (RPC 제한 고려)
 */
async function fetchApprovalLogs(
  publicClient: PublicClient,
  contractAddress: Address,
  ownerAddress: Address
): Promise<{ operator: Address; approved: boolean }[]> {
  // 현재 블록 번호 조회
  const currentBlock = await publicClient.getBlockNumber();

  // 최근 10,000 블록 범위 (RPC 제한 고려)
  const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;

  try {
    const logs = await publicClient.getLogs({
      address: contractAddress,
      event: APPROVAL_FOR_ALL_EVENT,
      args: {
        owner: ownerAddress,
      },
      fromBlock,
      toBlock: 'latest',
    });

    return logs.map((log) => ({
      operator: log.args.operator as Address,
      approved: log.args.approved as boolean,
    }));
  } catch (error) {
    // 블록 범위가 너무 크면 더 작은 범위로 재시도
    console.warn('getLogs failed, trying smaller range:', error);

    const smallerFromBlock = currentBlock > 5000n ? currentBlock - 5000n : 0n;

    const logs = await publicClient.getLogs({
      address: contractAddress,
      event: APPROVAL_FOR_ALL_EVENT,
      args: {
        owner: ownerAddress,
      },
      fromBlock: smallerFromBlock,
      toBlock: 'latest',
    });

    return logs.map((log) => ({
      operator: log.args.operator as Address,
      approved: log.args.approved as boolean,
    }));
  }
}

/**
 * RPC로 현재 승인 상태 확인
 */
async function verifyApprovalStatus(
  publicClient: PublicClient,
  contractAddress: Address,
  ownerAddress: Address,
  operatorAddress: Address
): Promise<boolean> {
  try {
    const isApproved = await publicClient.readContract({
      address: contractAddress,
      abi: vibeNftAbi,
      functionName: 'isApprovedForAll',
      args: [ownerAddress, operatorAddress],
    });
    return isApproved as boolean;
  } catch {
    return false;
  }
}

/**
 * 승인된 Operator 목록을 조회하는 훅
 *
 * @param contractAddress - NFT 컨트랙트 주소
 * @param ownerAddress - 소유자 주소
 * @param publicClient - viem PublicClient
 */
export function useApprovedOperators(
  contractAddress: Address | null,
  ownerAddress: Address | null,
  publicClient: PublicClient
): UseApprovedOperatorsResult {
  const [operators, setOperators] = useState<ApprovedOperator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!contractAddress || !ownerAddress) {
      setOperators([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. viem getLogs로 이벤트 로그 조회
      const logs = await fetchApprovalLogs(
        publicClient,
        contractAddress,
        ownerAddress
      );

      // 2. 고유한 operator 주소 추출 (최신 상태만)
      const operatorMap = new Map<string, boolean>();
      for (const log of logs) {
        // 나중에 발생한 이벤트가 덮어씀
        operatorMap.set(log.operator.toLowerCase(), log.approved);
      }

      // 3. 실제 온체인 상태 확인
      const verifiedOperators: ApprovedOperator[] = [];

      for (const [operatorAddr, lastKnownApproved] of operatorMap) {
        // 이벤트상 approved=true였던 경우에만 온체인 확인
        if (lastKnownApproved) {
          const currentStatus = await verifyApprovalStatus(
            publicClient,
            contractAddress,
            ownerAddress,
            operatorAddr as Address
          );

          if (currentStatus) {
            verifiedOperators.push({
              address: operatorAddr as Address,
              isApproved: true,
            });
          }
        }
      }

      setOperators(verifiedOperators);
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(message);
      setOperators([]);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, ownerAddress, publicClient]);

  return {
    operators,
    isLoading,
    error,
    refresh,
  };
}
