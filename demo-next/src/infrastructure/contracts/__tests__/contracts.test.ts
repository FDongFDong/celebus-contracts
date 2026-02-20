import { describe, test, expect } from 'vitest';
import {
  mainVotingAbi,
  subVotingAbi,
  boostingAbi,
  getMainVotingContract,
  getSubVotingContract,
  getBoostingContract,
} from '../index';
import { createPublicClient, createWalletClient, http } from 'viem';
import { opBNBTestnet } from '../../config/chains';
import { privateKeyToAccount } from 'viem/accounts';

describe('Contract ABI Import', () => {
  test('MainVoting ABI가 올바르게 import 되어야 함', () => {
    expect(mainVotingAbi).toBeDefined();
    expect(Array.isArray(mainVotingAbi)).toBe(true);
    expect(mainVotingAbi.length).toBeGreaterThan(0);

    // constructor 존재 확인
    const hasConstructor = mainVotingAbi.some(item => item.type === 'constructor');
    expect(hasConstructor).toBe(true);
  });

  test('SubVoting ABI가 올바르게 import 되어야 함', () => {
    expect(subVotingAbi).toBeDefined();
    expect(Array.isArray(subVotingAbi)).toBe(true);
    expect(subVotingAbi.length).toBeGreaterThan(0);

    // constructor 존재 확인
    const hasConstructor = subVotingAbi.some(item => item.type === 'constructor');
    expect(hasConstructor).toBe(true);
  });

  test('Boosting ABI가 올바르게 import 되어야 함', () => {
    expect(boostingAbi).toBeDefined();
    expect(Array.isArray(boostingAbi)).toBe(true);
    expect(boostingAbi.length).toBeGreaterThan(0);

    // constructor 존재 확인
    const hasConstructor = boostingAbi.some(item => item.type === 'constructor');
    expect(hasConstructor).toBe(true);
  });

  test('MainVoting ABI에 주요 함수들이 존재해야 함', () => {
    const functionNames = mainVotingAbi
      .filter(item => item.type === 'function')
      .map(item => (item as { name: string }).name);

    expect(functionNames).toContain('owner');
    expect(functionNames).toContain('domainSeparator');
    expect(functionNames).toContain('eip712Domain');
  });

  test('SubVoting ABI에 주요 함수들이 존재해야 함', () => {
    const functionNames = subVotingAbi
      .filter(item => item.type === 'function')
      .map(item => (item as { name: string }).name);

    expect(functionNames).toContain('owner');
    expect(functionNames).toContain('domainSeparator');
    expect(functionNames).toContain('eip712Domain');
  });

  test('Boosting ABI에 주요 함수들이 존재해야 함', () => {
    const functionNames = boostingAbi
      .filter(item => item.type === 'function')
      .map(item => (item as { name: string }).name);

    expect(functionNames).toContain('owner');
    expect(functionNames).toContain('domainSeparator');
  });
});

describe('Contract Factory Functions', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as const;
  const mockPrivateKey =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;

  test('getMainVotingContract가 컨트랙트 인스턴스를 반환해야 함', () => {
    const publicClient = createPublicClient({
      chain: opBNBTestnet,
      transport: http(),
    });

    const contract = getMainVotingContract(mockAddress, publicClient);

    expect(contract).toBeDefined();
    expect(contract.address).toBe(mockAddress);
  });

  test('getSubVotingContract가 컨트랙트 인스턴스를 반환해야 함', () => {
    const publicClient = createPublicClient({
      chain: opBNBTestnet,
      transport: http(),
    });

    const contract = getSubVotingContract(mockAddress, publicClient);

    expect(contract).toBeDefined();
    expect(contract.address).toBe(mockAddress);
  });

  test('getBoostingContract가 컨트랙트 인스턴스를 반환해야 함', () => {
    const publicClient = createPublicClient({
      chain: opBNBTestnet,
      transport: http(),
    });

    const contract = getBoostingContract(mockAddress, publicClient);

    expect(contract).toBeDefined();
    expect(contract.address).toBe(mockAddress);
  });

  test('WalletClient와 함께 MainVotingContract를 생성할 수 있어야 함', () => {
    const publicClient = createPublicClient({
      chain: opBNBTestnet,
      transport: http(),
    });

    const account = privateKeyToAccount(mockPrivateKey);
    const walletClient = createWalletClient({
      account,
      chain: opBNBTestnet,
      transport: http(),
    });

    const contract = getMainVotingContract(mockAddress, publicClient, walletClient);

    expect(contract).toBeDefined();
    expect(contract.address).toBe(mockAddress);
  });

  test('WalletClient와 함께 SubVotingContract를 생성할 수 있어야 함', () => {
    const publicClient = createPublicClient({
      chain: opBNBTestnet,
      transport: http(),
    });

    const account = privateKeyToAccount(mockPrivateKey);
    const walletClient = createWalletClient({
      account,
      chain: opBNBTestnet,
      transport: http(),
    });

    const contract = getSubVotingContract(mockAddress, publicClient, walletClient);

    expect(contract).toBeDefined();
    expect(contract.address).toBe(mockAddress);
  });

  test('WalletClient와 함께 BoostingContract를 생성할 수 있어야 함', () => {
    const publicClient = createPublicClient({
      chain: opBNBTestnet,
      transport: http(),
    });

    const account = privateKeyToAccount(mockPrivateKey);
    const walletClient = createWalletClient({
      account,
      chain: opBNBTestnet,
      transport: http(),
    });

    const contract = getBoostingContract(mockAddress, publicClient, walletClient);

    expect(contract).toBeDefined();
    expect(contract.address).toBe(mockAddress);
  });
});
