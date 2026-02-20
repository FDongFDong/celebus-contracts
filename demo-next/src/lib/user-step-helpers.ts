import type { Address } from '@/domain/types';

export type SelectedUser = '0' | '1' | 'custom';
export type SelectedUserIndex = 0 | 1 | 99;

export const CUSTOM_USER_INDEX: SelectedUserIndex = 99;

export function getSelectedUserIndex(
  selectedUser: SelectedUser
): SelectedUserIndex {
  return selectedUser === 'custom' ? CUSTOM_USER_INDEX : (Number(selectedUser) as 0 | 1);
}

export function resolveUserAddress(
  userIndex: number,
  userAddresses: readonly (Address | null | undefined)[],
  customAddress: Address | null | undefined
): Address | null {
  if (userIndex === 0) return userAddresses[0] ?? null;
  if (userIndex === 1) return userAddresses[1] ?? null;
  return customAddress ?? null;
}

export function generateTimestamp(now: number = Date.now()): string {
  return now.toString();
}

export function generateUserNonce(
  selectedUser: SelectedUser,
  now: number = Date.now()
): string {
  const userIndex = getSelectedUserIndex(selectedUser);
  const nonceBase = Number.parseInt(generateTimestamp(now).slice(-9), 10);
  return (nonceBase * 10 + userIndex).toString();
}

export function generateTimestampBasedId(
  selectedUser: SelectedUser,
  now: number = Date.now()
): string {
  const userIndex = getSelectedUserIndex(selectedUser);
  return `${generateTimestamp(now).slice(-8)}${userIndex}`;
}
