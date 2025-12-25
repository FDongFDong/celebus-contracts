/**
 * Domain Layer - Core Types
 *
 * 비즈니스 로직의 핵심 타입 정의
 */

import type { Address as ViemAddress, Hash as ViemHash } from 'viem';

// Viem Address 타입 재사용
export type Address = ViemAddress;

// Viem Hash 타입 재사용
export type Hash = ViemHash;

// Transaction Hash
export type TransactionHash = Hash;

// Result 타입 (Either 패턴)
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

// Helper functions
export const success = <T>(value: T): Result<T, never> => ({
  success: true,
  value,
});

export const failure = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});

// BigInt 관련 타입
export type TokenAmount = bigint;
export type VotingPower = bigint;
export type Timestamp = bigint;
