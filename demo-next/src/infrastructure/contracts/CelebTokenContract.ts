/**
 * CelebToken Contract Interface
 *
 * ERC20 + ERC20Permit (EIP-2612) + Ownable + Burnable + Pausable
 */

import CelebTokenABI from '@contracts/CelebToken.sol/CelebToken.json';
import { getContract, parseAbi } from 'viem';
import type { PublicClient, WalletClient, Address } from 'viem';

export const celebTokenAbi = CelebTokenABI.abi;

/**
 * ERC20 + Permit + Admin 최소 ABI
 */
export const ERC20_PERMIT_ABI = parseAbi([
  'constructor(string tokenName, string tokenSymbol, address recipient, address initialOwner)',

  // ERC20
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',

  // ERC20Permit (EIP-2612)
  'function nonces(address owner) view returns (uint256)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)',
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  'error ERC2612ExpiredSignature(uint256 deadline)',
  'error ERC2612InvalidSigner(address signer, address owner)',

  // Ownable
  'function owner() view returns (address)',
  'function transferOwnership(address newOwner)',

  // Burnable
  'function burn(uint256 value)',
  'function burnFrom(address account, uint256 value)',

  // Pausable
  'function paused() view returns (bool)',
  'function pause()',
  'function unpause()',

  // Mintable
  'function mint(address to, uint256 amount)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event Paused(address account)',
  'event Unpaused(address account)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
]);

/**
 * EIP-712 Permit TypedData Types
 */
export const ERC20_PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export function getCelebTokenContract(
  address: Address,
  publicClient: PublicClient,
  walletClient?: WalletClient
) {
  return getContract({
    address,
    abi: celebTokenAbi,
    client: { public: publicClient, wallet: walletClient },
  });
}

export function createErc20PermitDomain(
  tokenAddress: Address,
  chainId: number,
  tokenName: string
) {
  return {
    name: tokenName,
    version: '1',
    chainId,
    verifyingContract: tokenAddress,
  };
}
