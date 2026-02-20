/**
 * useAppStore 초기 상태
 */

export const initialState = {
  // Network
  selectedChainId: 5611, // opBNB Testnet by default

  // Connected Wallet
  connectedWalletAddress: null,

  // Wallets
  ownerWallet: null,
  executorWallet: null,
  userWallets: [],

  // MainVoting MetaMask Roles
  mainVotingExecutorAddress: null,
  mainVotingUserAddresses: [null, null],
  mainVotingCustomUserAddress: null,
  mainVotingUserNonces: {
    user1: null,
    user2: null,
    custom: null,
  },

  // Contract
  contractAddress: null,
  contractExecutorAddress: null,

  // Records
  mainVotingRecords: [],
  subVotingRecords: [],
  boostingRecords: [],

  // Signatures
  mainVotingSignatures: [],
  subVotingSignatures: [],
  boostingSignatures: [],

  // Domain
  domainName: 'CelebusVoting',
  domainVersion: '1',
  domainChainId: 5611n,
  domainVerifyingContract: null,
  domainSalt: null,

  // Batch Submit Data
  mainVotingBatchNonce: 0n,
  mainVotingExecutorSig: null,
  subVotingBatchNonce: 0n,
  subVotingExecutorSig: null,
  boostingBatchNonce: 0n,
  boostingExecutorSig: null,

  // Digest
  mainVotingDigest: null,
  subVotingDigest: null,
  boostingDigest: null,

  // Transaction
  mainVotingTxHash: null,
  subVotingTxHash: null,
  boostingTxHash: null,

  // Query Results
  mainVotingQueryResults: [],
  subVotingQueryResults: [],
  boostingQueryResults: [],

  // Events
  mainVotingEvents: [],
  subVotingEvents: [],
  boostingEvents: [],

  // View-Specific (MainVoting)
  voteTypeInfo: null,
  artistsInfo: [],

  // NFT
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

  // ERC20
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
};
