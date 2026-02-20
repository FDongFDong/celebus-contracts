/**
 * useAppStore 타입 정의
 */

import type { Address, Hash } from '@/domain/types';
import type { WalletAdapter } from '@/infrastructure/viem/WalletAdapter';
import { VoteRecord } from '@/domain/entities/VoteRecord';
import { SubVoteRecord } from '@/domain/entities/SubVoteRecord';
import { BoostRecord } from '@/domain/entities/BoostRecord';

// =============================================================================
// Signature Types
// =============================================================================

/**
 * 사용자별 배치 서명 데이터
 * 사용자 지갑 주소와 서명값을 매핑
 */
export interface UserBatchSignature {
  userAddress: Address;
  signature: Hash;
  userIndex?: number;
  userNonce?: bigint;
}

// =============================================================================
// View-Specific Types (MainVoting)
// =============================================================================

/**
 * MainVoting에서 사용하는 투표 타입 정보
 */
export interface VoteTypeInfo {
  voteType: 0 | 1; // 0=Forget, 1=Remember
  label: string;
  color: string;
}

/**
 * MainVoting에서 사용하는 아티스트 정보
 */
export interface ArtistInfo {
  optionId: bigint;
  name: string;
  votingAmt: bigint;
}

// =============================================================================
// Store State Interface
// =============================================================================

export interface AppState {
  // ---------------------------------------------------------------------------
  // Network (Header에서 관리)
  // ---------------------------------------------------------------------------
  selectedChainId: number;

  // ---------------------------------------------------------------------------
  // Connected Wallet (Header에서 관리)
  // ---------------------------------------------------------------------------
  connectedWalletAddress: Address | null;

  // ---------------------------------------------------------------------------
  // Wallets
  // ---------------------------------------------------------------------------
  ownerWallet: WalletAdapter | null;
  executorWallet: WalletAdapter | null;
  userWallets: Array<WalletAdapter | null>;

  // ---------------------------------------------------------------------------
  // MainVoting MetaMask Roles
  // ---------------------------------------------------------------------------
  mainVotingExecutorAddress: Address | null;
  mainVotingUserAddresses: Array<Address | null>;
  mainVotingCustomUserAddress: Address | null;
  mainVotingUserNonces: {
    user1: bigint | null;
    user2: bigint | null;
    custom: bigint | null;
  };

  // ---------------------------------------------------------------------------
  // Contract Setup
  // ---------------------------------------------------------------------------
  contractAddress: Address | null;
  contractExecutorAddress: Address | null;

  // ---------------------------------------------------------------------------
  // Records (각 뷰별 레코드)
  // ---------------------------------------------------------------------------
  mainVotingRecords: VoteRecord[];
  subVotingRecords: SubVoteRecord[];
  boostingRecords: BoostRecord[];

  // ---------------------------------------------------------------------------
  // User Signatures
  // ---------------------------------------------------------------------------
  mainVotingSignatures: UserBatchSignature[];
  subVotingSignatures: UserBatchSignature[];
  boostingSignatures: UserBatchSignature[];

  // ---------------------------------------------------------------------------
  // Domain Data (EIP-712)
  // ---------------------------------------------------------------------------
  domainName: string;
  domainVersion: string;
  domainChainId: bigint;
  domainVerifyingContract: Address | null;
  domainSalt: Hash | null;

  // ---------------------------------------------------------------------------
  // Batch Submit Data (Executor 서명 및 Nonce)
  // ---------------------------------------------------------------------------
  mainVotingBatchNonce: bigint;
  mainVotingExecutorSig: Hash | null;
  subVotingBatchNonce: bigint;
  subVotingExecutorSig: Hash | null;
  boostingBatchNonce: bigint;
  boostingExecutorSig: Hash | null;

  // ---------------------------------------------------------------------------
  // Digest Data
  // ---------------------------------------------------------------------------
  mainVotingDigest: Hash | null;
  subVotingDigest: Hash | null;
  boostingDigest: Hash | null;

  // ---------------------------------------------------------------------------
  // Transaction Data
  // ---------------------------------------------------------------------------
  mainVotingTxHash: Hash | null;
  subVotingTxHash: Hash | null;
  boostingTxHash: Hash | null;

  // ---------------------------------------------------------------------------
  // Query Results
  // ---------------------------------------------------------------------------
  mainVotingQueryResults: Array<{ recordId: bigint; exists: boolean }>;
  subVotingQueryResults: Array<{ recordId: bigint; exists: boolean }>;
  boostingQueryResults: Array<{ recordId: bigint; exists: boolean }>;

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------
  mainVotingEvents: Array<{
    blockNumber: bigint;
    transactionHash: Hash;
    recordId: bigint;
  }>;
  subVotingEvents: Array<{
    blockNumber: bigint;
    transactionHash: Hash;
    recordId: bigint;
  }>;
  boostingEvents: Array<{
    blockNumber: bigint;
    transactionHash: Hash;
    recordId: bigint;
  }>;

  // ---------------------------------------------------------------------------
  // View-Specific Data (MainVoting)
  // ---------------------------------------------------------------------------
  voteTypeInfo: VoteTypeInfo | null;
  artistsInfo: ArtistInfo[];

  // ---------------------------------------------------------------------------
  // NFT (VIBENFT Demo)
  // ---------------------------------------------------------------------------
  nftContractAddress: Address | null;
  nftName: string | null;
  nftSymbol: string | null;
  nftOwner: Address | null;
  nftPaused: boolean | null;
  nftBalance: bigint | null;
  nftOperatorAddress: Address | null;
  nftIsApprovedForAll: boolean | null;
  nftTokenIdForApprove: bigint | null;
  nftApprovedAddress: Address | null;
  nftTxHash: Hash | null;

  // NFT Wallet State (window 전역 대신 스토어에서 관리)
  nftWalletType: 'metamask' | 'privatekey' | 'mnemonic' | 'detached' | null;
  nftWalletAddress: Address | null;
  nftWalletPrivateKey: `0x${string}` | null;

  // ---------------------------------------------------------------------------
  // ERC20 (ERC-20 Permit Extension)
  // ---------------------------------------------------------------------------
  erc20TokenAddress: Address | null;
  erc20TokenName: string | null;
  erc20TokenSymbol: string | null;
  erc20TokenDecimals: number | null;
  erc20TotalSupply: bigint | null;
  erc20OwnerWallet: WalletAdapter | null;
  erc20SpenderWallet: WalletAdapter | null;
  erc20OwnerBalance: bigint | null;
  erc20CurrentAllowance: bigint | null;
  erc20DomainSeparator: Hash | null;
  erc20Nonce: bigint | null;
  erc20Value: bigint | null;
  erc20Deadline: bigint | null;
  erc20Signature: Hash | null;
  erc20V: number | null;
  erc20R: Hash | null;
  erc20S: Hash | null;
  erc20TxHash: Hash | null;
  erc20NewAllowance: bigint | null;

  // ---------------------------------------------------------------------------
  // Actions - Network
  // ---------------------------------------------------------------------------
  setSelectedChainId: (chainId: number) => void;

  // ---------------------------------------------------------------------------
  // Actions - Connected Wallet
  // ---------------------------------------------------------------------------
  setConnectedWalletAddress: (address: Address | null) => void;

  // ---------------------------------------------------------------------------
  // Actions - Wallets
  // ---------------------------------------------------------------------------
  setOwnerWallet: (wallet: WalletAdapter | null) => void;
  setExecutorWallet: (wallet: WalletAdapter | null) => void;
  addUserWallet: (wallet: WalletAdapter) => void;
  updateUserWallet: (index: number, wallet: WalletAdapter | null) => void;
  clearUserWallets: () => void;

  // ---------------------------------------------------------------------------
  // Actions - MainVoting MetaMask Roles
  // ---------------------------------------------------------------------------
  setMainVotingExecutorAddress: (address: Address | null) => void;
  setMainVotingUserAddress: (index: 0 | 1, address: Address | null) => void;
  setMainVotingCustomUserAddress: (address: Address | null) => void;
  setMainVotingUserNonce: (index: 0 | 1 | 99, nonce: bigint | null) => void;
  clearMainVotingUserNonces: () => void;

  // ---------------------------------------------------------------------------
  // Actions - Contract
  // ---------------------------------------------------------------------------
  setContractAddress: (address: Address | null) => void;
  setContractExecutorAddress: (address: Address | null) => void;

  // ---------------------------------------------------------------------------
  // Actions - Records
  // ---------------------------------------------------------------------------
  addMainVotingRecord: (record: VoteRecord) => void;
  setMainVotingRecords: (records: VoteRecord[]) => void;
  clearMainVotingRecords: () => void;

  addSubVotingRecord: (record: SubVoteRecord) => void;
  setSubVotingRecords: (records: SubVoteRecord[]) => void;
  clearSubVotingRecords: () => void;

  addBoostingRecord: (record: BoostRecord) => void;
  setBoostingRecords: (records: BoostRecord[]) => void;
  clearBoostingRecords: () => void;

  // ---------------------------------------------------------------------------
  // Actions - Signatures
  // ---------------------------------------------------------------------------
  setMainVotingSignatures: (signatures: UserBatchSignature[]) => void;
  setSubVotingSignatures: (signatures: UserBatchSignature[]) => void;
  setBoostingSignatures: (signatures: UserBatchSignature[]) => void;

  // ---------------------------------------------------------------------------
  // Actions - Domain
  // ---------------------------------------------------------------------------
  setDomainData: (data: {
    name: string;
    version: string;
    chainId: bigint;
    verifyingContract: Address;
    salt?: Hash;
  }) => void;

  // ---------------------------------------------------------------------------
  // Actions - Batch Submit Data
  // ---------------------------------------------------------------------------
  setMainVotingBatchNonce: (nonce: bigint) => void;
  setMainVotingExecutorSig: (sig: Hash | null) => void;
  setSubVotingBatchNonce: (nonce: bigint) => void;
  setSubVotingExecutorSig: (sig: Hash | null) => void;
  setBoostingBatchNonce: (nonce: bigint) => void;
  setBoostingExecutorSig: (sig: Hash | null) => void;

  // ---------------------------------------------------------------------------
  // Actions - Digest
  // ---------------------------------------------------------------------------
  setMainVotingDigest: (digest: Hash) => void;
  setSubVotingDigest: (digest: Hash) => void;
  setBoostingDigest: (digest: Hash) => void;

  // ---------------------------------------------------------------------------
  // Actions - Transaction
  // ---------------------------------------------------------------------------
  setMainVotingTxHash: (hash: Hash) => void;
  setSubVotingTxHash: (hash: Hash) => void;
  setBoostingTxHash: (hash: Hash) => void;

  // ---------------------------------------------------------------------------
  // Actions - Query Results
  // ---------------------------------------------------------------------------
  setMainVotingQueryResults: (
    results: Array<{ recordId: bigint; exists: boolean }>
  ) => void;
  setSubVotingQueryResults: (
    results: Array<{ recordId: bigint; exists: boolean }>
  ) => void;
  setBoostingQueryResults: (
    results: Array<{ recordId: bigint; exists: boolean }>
  ) => void;

  // ---------------------------------------------------------------------------
  // Actions - Events
  // ---------------------------------------------------------------------------
  setMainVotingEvents: (
    events: Array<{
      blockNumber: bigint;
      transactionHash: Hash;
      recordId: bigint;
    }>
  ) => void;
  setSubVotingEvents: (
    events: Array<{
      blockNumber: bigint;
      transactionHash: Hash;
      recordId: bigint;
    }>
  ) => void;
  setBoostingEvents: (
    events: Array<{
      blockNumber: bigint;
      transactionHash: Hash;
      recordId: bigint;
    }>
  ) => void;

  // ---------------------------------------------------------------------------
  // Actions - View-Specific (MainVoting)
  // ---------------------------------------------------------------------------
  setVoteTypeInfo: (info: VoteTypeInfo) => void;
  setArtistsInfo: (artists: ArtistInfo[]) => void;

  // ---------------------------------------------------------------------------
  // Actions - NFT
  // ---------------------------------------------------------------------------
  setNftContractAddress: (address: Address | null) => void;
  setNftInfo: (info: {
    name: string;
    symbol: string;
    owner: Address;
    paused: boolean;
  }) => void;
  setNftBalance: (balance: bigint | null) => void;
  setNftOperatorAddress: (address: Address | null) => void;
  setNftIsApprovedForAll: (approved: boolean | null) => void;
  setNftTokenIdForApprove: (tokenId: bigint | null) => void;
  setNftApprovedAddress: (address: Address | null) => void;
  setNftTxHash: (hash: Hash | null) => void;
  setNftWallet: (wallet: {
    walletType: 'metamask' | 'privatekey' | 'mnemonic' | 'detached' | null;
    walletAddress: Address | null;
    privateKey: `0x${string}` | null;
  }) => void;
  clearNftWallet: () => void;
  resetNft: () => void;

  // ---------------------------------------------------------------------------
  // Actions - ERC20
  // ---------------------------------------------------------------------------
  setErc20TokenAddress: (address: Address | null) => void;
  setErc20TokenInfo: (info: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
  }) => void;
  setErc20OwnerWallet: (wallet: WalletAdapter | null) => void;
  setErc20SpenderWallet: (wallet: WalletAdapter | null) => void;
  setErc20OwnerBalance: (balance: bigint | null) => void;
  setErc20CurrentAllowance: (allowance: bigint | null) => void;
  setErc20DomainSeparator: (separator: Hash) => void;
  setErc20Nonce: (nonce: bigint) => void;
  setErc20Signature: (data: {
    signature: Hash;
    v: number;
    r: Hash;
    s: Hash;
    value: bigint;
    deadline: bigint;
  }) => void;
  setErc20TxHash: (hash: Hash) => void;
  setErc20NewAllowance: (allowance: bigint) => void;
  resetErc20: () => void;

  // ---------------------------------------------------------------------------
  // Actions - Reset
  // ---------------------------------------------------------------------------
  reset: () => void;
  resetMainVoting: () => void;
  resetSubVoting: () => void;
  resetBoosting: () => void;
}
