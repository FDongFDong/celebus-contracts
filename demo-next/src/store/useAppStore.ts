/**
 * Zustand Store - 애플리케이션 전역 상태 관리
 *
 * MainVoting, SubVoting, Boosting 3가지 뷰의 상태를 통합 관리
 */

import { create } from 'zustand';
import type { AppState } from './useAppStore.types';
import { initialState } from './useAppStore.initialState';

export type {
  AppState,
  UserBatchSignature,
  VoteTypeInfo,
  ArtistInfo,
} from './useAppStore.types';

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  // Network
  setSelectedChainId: (chainId) => set({ selectedChainId: chainId }),

  // Connected Wallet
  setConnectedWalletAddress: (address) => set({ connectedWalletAddress: address }),

  // Wallets
  setOwnerWallet: (wallet) => set({ ownerWallet: wallet }),
  setExecutorWallet: (wallet) => set({ executorWallet: wallet }),
  addUserWallet: (wallet) =>
    set((state) => ({ userWallets: [...state.userWallets, wallet] })),
  updateUserWallet: (index, wallet) =>
    set((state) => {
      const newWallets = [...state.userWallets];
      // 배열 크기가 부족하면 확장
      while (newWallets.length <= index) {
        newWallets.push(null);
      }
      newWallets[index] = wallet;
      return { userWallets: newWallets };
    }),
  clearUserWallets: () => set({ userWallets: [] }),

  // MainVoting MetaMask Roles
  setMainVotingExecutorAddress: (address) =>
    set({ mainVotingExecutorAddress: address }),
  setMainVotingUserAddress: (index, address) =>
    set((state) => {
      const next = [...state.mainVotingUserAddresses];
      next[index] = address;
      return { mainVotingUserAddresses: next };
    }),
  setMainVotingCustomUserAddress: (address) =>
    set({ mainVotingCustomUserAddress: address }),
  setMainVotingUserNonce: (index, nonce) =>
    set((state) => {
      if (index === 0) {
        return { mainVotingUserNonces: { ...state.mainVotingUserNonces, user1: nonce } };
      }
      if (index === 1) {
        return { mainVotingUserNonces: { ...state.mainVotingUserNonces, user2: nonce } };
      }
      return { mainVotingUserNonces: { ...state.mainVotingUserNonces, custom: nonce } };
    }),
  clearMainVotingUserNonces: () =>
    set({
      mainVotingUserNonces: { user1: null, user2: null, custom: null },
    }),

  // Contract
  setContractAddress: (address) => set({ contractAddress: address }),
  setContractExecutorAddress: (address) =>
    set({ contractExecutorAddress: address }),

  // Records
  addMainVotingRecord: (record) =>
    set((state) => ({
      mainVotingRecords: [...state.mainVotingRecords, record],
    })),
  setMainVotingRecords: (records) => set({ mainVotingRecords: records }),
  clearMainVotingRecords: () => set({ mainVotingRecords: [] }),

  addSubVotingRecord: (record) =>
    set((state) => ({
      subVotingRecords: [...state.subVotingRecords, record],
    })),
  setSubVotingRecords: (records) => set({ subVotingRecords: records }),
  clearSubVotingRecords: () => set({ subVotingRecords: [] }),

  addBoostingRecord: (record) =>
    set((state) => ({
      boostingRecords: [...state.boostingRecords, record],
    })),
  setBoostingRecords: (records) => set({ boostingRecords: records }),
  clearBoostingRecords: () => set({ boostingRecords: [] }),

  // Signatures
  setMainVotingSignatures: (signatures) =>
    set({ mainVotingSignatures: signatures }),
  setSubVotingSignatures: (signatures) =>
    set({ subVotingSignatures: signatures }),
  setBoostingSignatures: (signatures) => set({ boostingSignatures: signatures }),

  // Domain
  setDomainData: (data) =>
    set({
      domainName: data.name,
      domainVersion: data.version,
      domainChainId: data.chainId,
      domainVerifyingContract: data.verifyingContract,
      domainSalt: data.salt ?? null,
    }),

  // Batch Submit Data
  setMainVotingBatchNonce: (nonce) => set({ mainVotingBatchNonce: nonce }),
  setMainVotingExecutorSig: (sig) => set({ mainVotingExecutorSig: sig }),
  setSubVotingBatchNonce: (nonce) => set({ subVotingBatchNonce: nonce }),
  setSubVotingExecutorSig: (sig) => set({ subVotingExecutorSig: sig }),
  setBoostingBatchNonce: (nonce) => set({ boostingBatchNonce: nonce }),
  setBoostingExecutorSig: (sig) => set({ boostingExecutorSig: sig }),

  // Digest
  setMainVotingDigest: (digest) => set({ mainVotingDigest: digest }),
  setSubVotingDigest: (digest) => set({ subVotingDigest: digest }),
  setBoostingDigest: (digest) => set({ boostingDigest: digest }),

  // Transaction
  setMainVotingTxHash: (hash) => set({ mainVotingTxHash: hash }),
  setSubVotingTxHash: (hash) => set({ subVotingTxHash: hash }),
  setBoostingTxHash: (hash) => set({ boostingTxHash: hash }),

  // Query Results
  setMainVotingQueryResults: (results) =>
    set({ mainVotingQueryResults: results }),
  setSubVotingQueryResults: (results) => set({ subVotingQueryResults: results }),
  setBoostingQueryResults: (results) => set({ boostingQueryResults: results }),

  // Events
  setMainVotingEvents: (events) => set({ mainVotingEvents: events }),
  setSubVotingEvents: (events) => set({ subVotingEvents: events }),
  setBoostingEvents: (events) => set({ boostingEvents: events }),

  // View-Specific (MainVoting)
  setVoteTypeInfo: (info) => set({ voteTypeInfo: info }),
  setArtistsInfo: (artists) => set({ artistsInfo: artists }),

  // NFT
  setNftContractAddress: (address) => set({ nftContractAddress: address }),
  setNftInfo: (info) =>
    set({
      nftName: info.name,
      nftSymbol: info.symbol,
      nftOwner: info.owner,
      nftPaused: info.paused,
    }),
  setNftBalance: (balance) => set({ nftBalance: balance }),
  setNftOperatorAddress: (address) => set({ nftOperatorAddress: address }),
  setNftIsApprovedForAll: (approved) => set({ nftIsApprovedForAll: approved }),
  setNftTokenIdForApprove: (tokenId) => set({ nftTokenIdForApprove: tokenId }),
  setNftApprovedAddress: (address) => set({ nftApprovedAddress: address }),
  setNftTxHash: (hash) => set({ nftTxHash: hash }),
  setNftWallet: (wallet) =>
    set({
      nftWalletType: wallet.walletType,
      nftWalletAddress: wallet.walletAddress,
      nftWalletPrivateKey: wallet.privateKey,
    }),
  clearNftWallet: () =>
    set({
      nftWalletType: null,
      nftWalletAddress: null,
      nftWalletPrivateKey: null,
    }),
  resetNft: () =>
    set({
      nftContractAddress: null,
      nftName: null,
      nftSymbol: null,
      nftOwner: null,
      nftPaused: null,
      nftBalance: null,
      nftOperatorAddress: null,
      nftIsApprovedForAll: null,
      nftTokenIdForApprove: null,
      nftApprovedAddress: null,
      nftTxHash: null,
      nftWalletType: null,
      nftWalletAddress: null,
      nftWalletPrivateKey: null,
    }),

  // ERC20
  setErc20TokenAddress: (address) => set({ erc20TokenAddress: address }),
  setErc20TokenInfo: (info) =>
    set({
      erc20TokenName: info.name,
      erc20TokenSymbol: info.symbol,
      erc20TokenDecimals: info.decimals,
      erc20TotalSupply: info.totalSupply,
    }),
  setErc20OwnerWallet: (wallet) => set({ erc20OwnerWallet: wallet }),
  setErc20SpenderWallet: (wallet) => set({ erc20SpenderWallet: wallet }),
  setErc20OwnerBalance: (balance) => set({ erc20OwnerBalance: balance }),
  setErc20CurrentAllowance: (allowance) =>
    set({ erc20CurrentAllowance: allowance }),
  setErc20DomainSeparator: (separator) =>
    set({ erc20DomainSeparator: separator }),
  setErc20Nonce: (nonce) => set({ erc20Nonce: nonce }),
  setErc20Signature: (data) =>
    set({
      erc20Signature: data.signature,
      erc20V: data.v,
      erc20R: data.r,
      erc20S: data.s,
      erc20Value: data.value,
      erc20Deadline: data.deadline,
    }),
  setErc20TxHash: (hash) => set({ erc20TxHash: hash }),
  setErc20NewAllowance: (allowance) => set({ erc20NewAllowance: allowance }),
  resetErc20: () =>
    set({
      erc20TokenAddress: null,
      erc20TokenName: null,
      erc20TokenSymbol: null,
      erc20TokenDecimals: null,
      erc20TotalSupply: null,
      erc20OwnerWallet: null,
      erc20SpenderWallet: null,
      erc20OwnerBalance: null,
      erc20CurrentAllowance: null,
      erc20DomainSeparator: null,
      erc20Nonce: null,
      erc20Value: null,
      erc20Deadline: null,
      erc20Signature: null,
      erc20V: null,
      erc20R: null,
      erc20S: null,
      erc20TxHash: null,
      erc20NewAllowance: null,
    }),

  // Reset
  reset: () => set(initialState),
  resetMainVoting: () =>
    set({
      mainVotingRecords: [],
      mainVotingSignatures: [],
      mainVotingBatchNonce: 0n,
      mainVotingExecutorSig: null,
      mainVotingDigest: null,
      mainVotingTxHash: null,
      mainVotingQueryResults: [],
      mainVotingEvents: [],
      voteTypeInfo: null,
      artistsInfo: [],
      mainVotingExecutorAddress: null,
      mainVotingUserAddresses: [null, null],
      mainVotingCustomUserAddress: null,
      mainVotingUserNonces: { user1: null, user2: null, custom: null },
    }),
  resetSubVoting: () =>
    set({
      subVotingRecords: [],
      subVotingSignatures: [],
      subVotingBatchNonce: 0n,
      subVotingExecutorSig: null,
      subVotingDigest: null,
      subVotingTxHash: null,
      subVotingQueryResults: [],
      subVotingEvents: [],
    }),
  resetBoosting: () =>
    set({
      boostingRecords: [],
      boostingSignatures: [],
      boostingBatchNonce: 0n,
      boostingExecutorSig: null,
      boostingDigest: null,
      boostingTxHash: null,
      boostingQueryResults: [],
      boostingEvents: [],
    }),
}));
