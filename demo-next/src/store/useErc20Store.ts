/**
 * ERC20 데모 전용 Zustand 스토어
 *
 * useAppStore의 ERC20 관련 상태를 독립 스토어로 분리합니다.
 * 기존 useAppStore와 병렬 운영 (개발자 모드는 useAppStore 유지)
 */

import { create } from 'zustand';
import type { Address, Hash } from '@/domain/types';

interface Erc20Signature {
  full: Hash;
  v: number;
  r: Hash;
  s: Hash;
}

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
}

type ApproveStatus = 'idle' | 'signing' | 'submitting' | 'confirmed' | 'error';
type TransferStatus = 'idle' | 'submitting' | 'confirmed' | 'error';
type DeadlineOption = 'hour' | 'day' | 'week' | 'unlimited';

interface Erc20State {
  tokenAddress: Address | null;
  tokenInfo: TokenInfo | null;

  spenderAddress: Address | null;
  approveAmount: string;
  deadline: DeadlineOption;
  approveStatus: ApproveStatus;
  approveTxHash: Hash | null;
  approveError: string | null;

  recipientAddress: Address | null;
  transferAmount: string;
  transferStatus: TransferStatus;
  transferTxHash: Hash | null;
  transferError: string | null;

  ownerBalance: bigint | null;
  currentAllowance: bigint | null;

  nonce: bigint | null;
  domainSeparator: Hash | null;
  signature: Erc20Signature | null;

  setTokenAddress: (address: Address | null) => void;
  setTokenInfo: (info: TokenInfo | null) => void;
  setSpenderAddress: (address: Address | null) => void;
  setApproveAmount: (amount: string) => void;
  setDeadline: (deadline: DeadlineOption) => void;
  setApproveStatus: (status: ApproveStatus) => void;
  setApproveTxHash: (hash: Hash | null) => void;
  setApproveError: (error: string | null) => void;
  setRecipientAddress: (address: Address | null) => void;
  setTransferAmount: (amount: string) => void;
  setTransferStatus: (status: TransferStatus) => void;
  setTransferTxHash: (hash: Hash | null) => void;
  setTransferError: (error: string | null) => void;
  setOwnerBalance: (balance: bigint | null) => void;
  setCurrentAllowance: (allowance: bigint | null) => void;
  setNonce: (nonce: bigint | null) => void;
  setDomainSeparator: (separator: Hash | null) => void;
  setSignature: (sig: Erc20Signature | null) => void;
  reset: () => void;
}

const initialState = {
  tokenAddress: null,
  tokenInfo: null,
  spenderAddress: null,
  approveAmount: '',
  deadline: 'hour' as DeadlineOption,
  approveStatus: 'idle' as ApproveStatus,
  approveTxHash: null,
  approveError: null,
  recipientAddress: null,
  transferAmount: '',
  transferStatus: 'idle' as TransferStatus,
  transferTxHash: null,
  transferError: null,
  ownerBalance: null,
  currentAllowance: null,
  nonce: null,
  domainSeparator: null,
  signature: null,
};

export const useErc20Store = create<Erc20State>((set) => ({
  ...initialState,

  setTokenAddress: (tokenAddress) => set({ tokenAddress }),
  setTokenInfo: (tokenInfo) => set({ tokenInfo }),
  setSpenderAddress: (spenderAddress) => set({ spenderAddress }),
  setApproveAmount: (approveAmount) => set({ approveAmount }),
  setDeadline: (deadline) => set({ deadline }),
  setApproveStatus: (approveStatus) => set({ approveStatus }),
  setApproveTxHash: (approveTxHash) => set({ approveTxHash }),
  setApproveError: (approveError) => set({ approveError }),
  setRecipientAddress: (recipientAddress) => set({ recipientAddress }),
  setTransferAmount: (transferAmount) => set({ transferAmount }),
  setTransferStatus: (transferStatus) => set({ transferStatus }),
  setTransferTxHash: (transferTxHash) => set({ transferTxHash }),
  setTransferError: (transferError) => set({ transferError }),
  setOwnerBalance: (ownerBalance) => set({ ownerBalance }),
  setCurrentAllowance: (currentAllowance) => set({ currentAllowance }),
  setNonce: (nonce) => set({ nonce }),
  setDomainSeparator: (domainSeparator) => set({ domainSeparator }),
  setSignature: (signature) => set({ signature }),
  reset: () => set(initialState),
}));
