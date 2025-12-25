import { describe, test, expect } from 'vitest';
import {
  mainVotingAbi,
  subVotingAbi,
  boostingAbi,
} from '../index';

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
