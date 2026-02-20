'use client';

import { useCallback, useState } from 'react';
import { decodeEventLog, parseAbiItem, type Hash } from 'viem';
import type { Address } from '@/domain/types';
import { useChainClient } from '@/hooks/useChainClient';
import { ERC20_PERMIT_ABI } from '@/infrastructure/contracts/CelebTokenContract';
import { getBlockchainErrorMessage, logError } from '@/lib/error-handler';

const MAX_BLOCK_RANGE = 5000n;
const DEFAULT_BLOCK_RANGE = 500n;

export interface Erc20Snapshot {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  owner: Address;
  paused: boolean;
  domainSeparator: Hash;
}

export interface Erc20AddressQueryResult {
  balance: bigint | null;
  nonce: bigint | null;
  allowance: bigint | null;
}

export interface Erc20EventResult {
  eventName: string;
  transactionHash: Hash | null;
  blockNumber: bigint;
  transactionIndex: bigint;
  logIndex: bigint;
  args: Record<string, string>;
}

export function normalizeArgs(args: unknown): Record<string, string> {
  if (!args || typeof args !== 'object') return {};

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(args as Record<string, unknown>)) {
    if (/^\d+$/.test(key)) continue;
    if (typeof value === 'bigint') {
      result[key] = value.toString();
    } else if (typeof value === 'string') {
      result[key] = value;
    } else if (typeof value === 'boolean') {
      result[key] = value ? 'true' : 'false';
    } else if (value == null) {
      result[key] = '-';
    } else {
      result[key] = String(value);
    }
  }
  return result;
}

export function isWithinBlockRange(
  fromBlock: bigint,
  toBlock: bigint,
  maxRange: bigint = MAX_BLOCK_RANGE
): boolean {
  if (fromBlock > toBlock) return false;
  return toBlock - fromBlock <= maxRange;
}

export function useErc20Query() {
  const { publicClient } = useChainClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [snapshot, setSnapshot] = useState<Erc20Snapshot | null>(null);
  const [addressQuery, setAddressQuery] = useState<Erc20AddressQueryResult | null>(null);
  const [receipt, setReceipt] = useState<Awaited<ReturnType<typeof publicClient.getTransactionReceipt>> | null>(null);
  const [events, setEvents] = useState<Erc20EventResult[]>([]);

  const loadSnapshot = useCallback(
    async (tokenAddress: Address) => {
      setIsLoading(true);
      setError(null);

      try {
        const [name, symbol, decimals, totalSupply, owner, paused, domainSeparator] =
          await publicClient.multicall({
            contracts: [
              { address: tokenAddress, abi: ERC20_PERMIT_ABI, functionName: 'name' },
              { address: tokenAddress, abi: ERC20_PERMIT_ABI, functionName: 'symbol' },
              { address: tokenAddress, abi: ERC20_PERMIT_ABI, functionName: 'decimals' },
              { address: tokenAddress, abi: ERC20_PERMIT_ABI, functionName: 'totalSupply' },
              { address: tokenAddress, abi: ERC20_PERMIT_ABI, functionName: 'owner' },
              { address: tokenAddress, abi: ERC20_PERMIT_ABI, functionName: 'paused' },
              { address: tokenAddress, abi: ERC20_PERMIT_ABI, functionName: 'DOMAIN_SEPARATOR' },
            ],
            allowFailure: false,
          });

        const next: Erc20Snapshot = {
          name: name as string,
          symbol: symbol as string,
          decimals: decimals as number,
          totalSupply: totalSupply as bigint,
          owner: owner as Address,
          paused: paused as boolean,
          domainSeparator: domainSeparator as Hash,
        };

        setSnapshot(next);
        return next;
      } catch (queryError) {
        logError('useErc20Query.loadSnapshot', queryError);
        const message = getBlockchainErrorMessage(queryError);
        setError(message);
        throw queryError;
      } finally {
        setIsLoading(false);
      }
    },
    [publicClient]
  );

  const loadAddressQuery = useCallback(
    async (
      tokenAddress: Address,
      options: {
        balanceAddress?: Address | null;
        nonceOwner?: Address | null;
        allowanceOwner?: Address | null;
        allowanceSpender?: Address | null;
      }
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const [balance, nonce, allowance] = await Promise.all([
          options.balanceAddress
            ? (publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_PERMIT_ABI,
                functionName: 'balanceOf',
                args: [options.balanceAddress],
              }) as Promise<bigint>)
            : Promise.resolve(null),
          options.nonceOwner
            ? (publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_PERMIT_ABI,
                functionName: 'nonces',
                args: [options.nonceOwner],
              }) as Promise<bigint>)
            : Promise.resolve(null),
          options.allowanceOwner && options.allowanceSpender
            ? (publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_PERMIT_ABI,
                functionName: 'allowance',
                args: [options.allowanceOwner, options.allowanceSpender],
              }) as Promise<bigint>)
            : Promise.resolve(null),
        ]);

        const next: Erc20AddressQueryResult = {
          balance,
          nonce,
          allowance,
        };

        setAddressQuery(next);
        return next;
      } catch (queryError) {
        logError('useErc20Query.loadAddressQuery', queryError);
        const message = getBlockchainErrorMessage(queryError);
        setError(message);
        throw queryError;
      } finally {
        setIsLoading(false);
      }
    },
    [publicClient]
  );

  const loadReceiptWithEvents = useCallback(
    async (txHash: Hash) => {
      setIsLoading(true);
      setError(null);

      try {
        const nextReceipt = await publicClient.getTransactionReceipt({ hash: txHash });
        setReceipt(nextReceipt);

        const decoded: Erc20EventResult[] = [];

        for (const log of nextReceipt.logs) {
          try {
            const parsed = decodeEventLog({
              abi: ERC20_PERMIT_ABI,
              data: log.data,
              topics: log.topics,
              strict: false,
            });

            decoded.push({
              eventName: parsed.eventName,
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber ?? 0n,
              transactionIndex: BigInt(log.transactionIndex ?? 0),
              logIndex: BigInt(log.logIndex ?? 0),
              args: normalizeArgs(parsed.args),
            });
          } catch {
            // ABI 매칭되지 않는 로그는 스킵
          }
        }

        setEvents(decoded);
        return { receipt: nextReceipt, events: decoded };
      } catch (queryError) {
        logError('useErc20Query.loadReceiptWithEvents', queryError);
        const message = getBlockchainErrorMessage(queryError);
        setError(message);
        throw queryError;
      } finally {
        setIsLoading(false);
      }
    },
    [publicClient]
  );

  const loadEventsByRange = useCallback(
    async (
      tokenAddress: Address,
      options?: {
        fromBlock?: bigint;
        toBlock?: bigint;
      }
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const latest = await publicClient.getBlockNumber();
        const toBlock = options?.toBlock ?? latest;
        const fromBlock = options?.fromBlock ?? (toBlock > DEFAULT_BLOCK_RANGE ? toBlock - DEFAULT_BLOCK_RANGE : 0n);

        if (!isWithinBlockRange(fromBlock, toBlock)) {
          if (fromBlock > toBlock) {
            throw new Error('fromBlock은 toBlock보다 클 수 없습니다');
          }
          throw new Error(`조회 범위는 최대 ${MAX_BLOCK_RANGE.toString()} 블록입니다`);
        }

        const [transferLogs, approvalLogs, pausedLogs, unpausedLogs, ownershipLogs] = await Promise.all([
          publicClient.getLogs({
            address: tokenAddress,
            event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
            fromBlock,
            toBlock,
          }),
          publicClient.getLogs({
            address: tokenAddress,
            event: parseAbiItem('event Approval(address indexed owner, address indexed spender, uint256 value)'),
            fromBlock,
            toBlock,
          }),
          publicClient.getLogs({
            address: tokenAddress,
            event: parseAbiItem('event Paused(address account)'),
            fromBlock,
            toBlock,
          }),
          publicClient.getLogs({
            address: tokenAddress,
            event: parseAbiItem('event Unpaused(address account)'),
            fromBlock,
            toBlock,
          }),
          publicClient.getLogs({
            address: tokenAddress,
            event: parseAbiItem('event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)'),
            fromBlock,
            toBlock,
          }),
        ]);

        const merged: Erc20EventResult[] = [
          ...transferLogs,
          ...approvalLogs,
          ...pausedLogs,
          ...unpausedLogs,
          ...ownershipLogs,
        ]
          .map((log) => ({
            eventName: log.eventName,
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber ?? 0n,
            transactionIndex: BigInt(log.transactionIndex ?? 0),
            logIndex: BigInt(log.logIndex ?? 0),
            args: normalizeArgs(log.args),
          }))
          .sort((a, b) => {
            if (a.blockNumber !== b.blockNumber) {
              return a.blockNumber < b.blockNumber ? 1 : -1;
            }
            if (a.transactionIndex !== b.transactionIndex) {
              return a.transactionIndex < b.transactionIndex ? 1 : -1;
            }
            if (a.logIndex !== b.logIndex) {
              return a.logIndex < b.logIndex ? 1 : -1;
            }
            return 0;
          });

        setEvents(merged);
        return merged;
      } catch (queryError) {
        logError('useErc20Query.loadEventsByRange', queryError);
        const message = getBlockchainErrorMessage(queryError);
        setError(message);
        throw queryError;
      } finally {
        setIsLoading(false);
      }
    },
    [publicClient]
  );

  return {
    isLoading,
    error,
    snapshot,
    addressQuery,
    receipt,
    events,
    loadSnapshot,
    loadAddressQuery,
    loadReceiptWithEvents,
    loadEventsByRange,
  };
}
