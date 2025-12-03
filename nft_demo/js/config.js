/**
 * CelebusNFT Demo Configuration
 * 네트워크 설정, ABI, 기본값 등을 관리합니다
 */

export const CONFIG = {
  // Network Configuration
  CHAIN_ID: 5611,
  CHAIN_NAME: 'opBNB Testnet',
  RPC_URL: 'https://opbnb-testnet-rpc.bnbchain.org',
  EXPLORER_URL: 'https://testnet.opbnbscan.com',
  CURRENCY: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18
  },

  // Contract Configuration (빈 문자열 = 사용자 입력 필요)
  DEFAULT_CONTRACT_ADDRESS: '',

  // ERC721 Standard ABI + CelebusNFT Custom Functions
  ABI: [
    // ERC165
    'function supportsInterface(bytes4 interfaceId) view returns (bool)',

    // ERC721 - Queries
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function balanceOf(address owner) view returns (uint256)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function getApproved(uint256 tokenId) view returns (address)',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',

    // ERC721 - Transfers
    'function approve(address to, uint256 tokenId)',
    'function setApprovalForAll(address operator, bool approved)',
    'function transferFrom(address from, address to, uint256 tokenId)',
    'function safeTransferFrom(address from, address to, uint256 tokenId)',
    'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',

    // Ownable
    'function owner() view returns (address)',
    'function transferOwnership(address newOwner)',
    'function renounceOwnership()',

    // Pausable
    'function paused() view returns (bool)',
    'function pause()',
    'function unpause()',

    // CelebusNFT - Minting
    'function safeMint(address to) returns (uint256)',
    'function batchMint(address to, uint256 count) returns (uint256)',
    'function MAX_BATCH_SIZE() view returns (uint256)',

    // CelebusNFT - Token Locking
    'function isLocked(uint256 tokenId) view returns (bool)',
    'function lockToken(uint256 tokenId)',
    'function unlockToken(uint256 tokenId)',
    'function batchLockTokens(uint256[] calldata tokenIds)',
    'function batchUnlockTokens(uint256[] calldata tokenIds)',

    // CelebusNFT - Burning
    'function burn(uint256 tokenId)',

    // CelebusNFT - Metadata
    'function setBaseURI(string memory baseURI)',

    // Events
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
    'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
    'event BatchMinted(address indexed to, uint256 indexed startTokenId, uint256 count)',
    'event TokenLocked(uint256 indexed tokenId)',
    'event TokenUnlocked(uint256 indexed tokenId)',
    'event Paused(address account)',
    'event Unpaused(address account)'
  ],

  // Well-known Interface IDs
  INTERFACE_IDS: {
    ERC165: '0x01ffc9a7',
    ERC721: '0x80ac58cd',
    ERC721Metadata: '0x5b5e139f',
    ERC721Enumerable: '0x780e9d63'
  },

  // UI Messages
  MESSAGES: {
    connectWallet: '지갑을 연결해주세요',
    wrongNetwork: 'opBNB Testnet으로 네트워크를 전환해주세요',
    contractRequired: '컨트랙트 주소를 입력해주세요',
    ownerOnly: 'Owner 권한이 필요합니다',
    transactionPending: '트랜잭션 처리 중...',
    transactionSuccess: '트랜잭션 성공!',
    transactionFailed: '트랜잭션 실패'
  },

  // Error Messages (CelebusNFT custom errors)
  CUSTOM_ERRORS: {
    'TokenIsLocked': '토큰이 잠겨 있어 전송할 수 없습니다',
    'TokenDoesNotExist': '해당 토큰이 존재하지 않습니다',
    'OnlyOwnerCanBurn': 'Owner만 토큰을 소각할 수 있습니다',
    'EmptyBatch': '배치에 항목이 없습니다',
    'BatchSizeExceeded': '배치 크기가 최대값(1500)을 초과합니다',
    'OwnableUnauthorizedAccount': 'Owner 권한이 필요합니다',
    'EnforcedPause': '컨트랙트가 일시정지 상태입니다',
    'ERC721InvalidOwner': '유효하지 않은 소유자입니다',
    'ERC721NonexistentToken': '존재하지 않는 토큰입니다',
    'ERC721InsufficientApproval': '승인되지 않은 작업입니다',
    'ERC721InvalidReceiver': '유효하지 않은 수신자입니다',
    'ERC721InvalidApprover': '유효하지 않은 승인자입니다',
    'ERC721InvalidOperator': '유효하지 않은 운영자입니다'
  }
};

/**
 * Parse custom error from contract revert
 * @param {Error} error - The error object
 * @returns {string} Human-readable error message
 */
export function parseContractError(error) {
  const errorMessage = error.message || error.toString();

  // Check for custom errors
  for (const [errorName, message] of Object.entries(CONFIG.CUSTOM_ERRORS)) {
    if (errorMessage.includes(errorName)) {
      return message;
    }
  }

  // Check for common patterns
  if (errorMessage.includes('user rejected')) {
    return '사용자가 트랜잭션을 거부했습니다';
  }
  if (errorMessage.includes('insufficient funds')) {
    return '잔액이 부족합니다';
  }
  if (errorMessage.includes('nonce')) {
    return 'Nonce 오류가 발생했습니다. 잠시 후 다시 시도해주세요';
  }

  // Return shortened original message
  if (errorMessage.length > 100) {
    return errorMessage.substring(0, 100) + '...';
  }

  return errorMessage;
}

/**
 * Get explorer URL for transaction
 * @param {string} txHash - Transaction hash
 * @returns {string} Explorer URL
 */
export function getExplorerTxUrl(txHash) {
  return `${CONFIG.EXPLORER_URL}/tx/${txHash}`;
}

/**
 * Get explorer URL for address
 * @param {string} address - Address
 * @returns {string} Explorer URL
 */
export function getExplorerAddressUrl(address) {
  return `${CONFIG.EXPLORER_URL}/address/${address}`;
}

/**
 * Format address for display
 * @param {string} address - Full address
 * @param {number} chars - Characters to show on each end
 * @returns {string} Shortened address
 */
export function formatAddress(address, chars = 6) {
  if (!address) return '-';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
