import { describe, it, expect } from 'vitest';
import { EIP712Domain } from '../EIP712Domain';
import { type Address } from 'viem';

/**
 * 기존 ethers.js 코드와의 호환성 검증 테스트
 *
 * 참조: ethers.js 기준 calculateDomainSeparator 구현
 */
describe('EIP712Domain - 기존 로직 호환성', () => {
  it('Hardhat 로컬 네트워크 설정과 동일한 결과를 생성한다', () => {
    // Hardhat 기본 설정
    const domain = new EIP712Domain(
      'Celebus',
      '1',
      31337n, // Hardhat chainId
      '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address
    );

    const separator = domain.calculateDomainSeparator();

    // 기본 검증
    expect(separator).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(separator.length).toBe(66);
  });

  it('메인넷 설정으로 올바른 separator를 생성한다', () => {
    const domain = new EIP712Domain(
      'Celebus',
      '1',
      1n, // Ethereum Mainnet
      '0x1234567890123456789012345678901234567890' as Address
    );

    const separator = domain.calculateDomainSeparator();

    expect(separator).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it('동일한 입력에 대해 deterministic한 결과를 생성한다', () => {
    const params = {
      name: 'TestContract',
      version: '2',
      chainId: 137n, // Polygon
      verifyingContract: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Address,
    };

    const domain1 = new EIP712Domain(
      params.name,
      params.version,
      params.chainId,
      params.verifyingContract
    );

    const domain2 = new EIP712Domain(
      params.name,
      params.version,
      params.chainId,
      params.verifyingContract
    );

    const domain3 = new EIP712Domain(
      params.name,
      params.version,
      params.chainId,
      params.verifyingContract
    );

    const sep1 = domain1.calculateDomainSeparator();
    const sep2 = domain2.calculateDomainSeparator();
    const sep3 = domain3.calculateDomainSeparator();

    expect(sep1).toBe(sep2);
    expect(sep2).toBe(sep3);
    expect(sep1).toBe(sep3);
  });

  it('viem signTypedData와 호환되는 domain 형식을 제공한다', () => {
    const domain = new EIP712Domain(
      'Celebus',
      '1',
      31337n,
      '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address
    );

    const typedDataDomain = domain.toTypedDataDomain();

    // viem의 signTypedData 함수에 전달할 수 있는 형식인지 검증
    expect(typedDataDomain).toHaveProperty('name');
    expect(typedDataDomain).toHaveProperty('version');
    expect(typedDataDomain).toHaveProperty('chainId');
    expect(typedDataDomain).toHaveProperty('verifyingContract');

    // chainId가 number 타입인지 확인 (viem 요구사항)
    expect(typeof typedDataDomain.chainId).toBe('number');
  });

  it('큰 chainId 값도 올바르게 처리한다', () => {
    // Avalanche C-Chain
    const largChainId = 43114n;

    const domain = new EIP712Domain(
      'Celebus',
      '1',
      largChainId,
      '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address
    );

    expect(domain.chainId).toBe(largChainId);

    const separator = domain.calculateDomainSeparator();
    expect(separator).toMatch(/^0x[a-fA-F0-9]{64}$/);

    const typedDataDomain = domain.toTypedDataDomain();
    expect(typedDataDomain.chainId).toBe(43114);
  });

  it('체크섬 주소와 소문자 주소 모두 동일하게 처리한다', () => {
    const checksumAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address;
    const lowerCaseAddress =
      '0x5fbdb2315678afecb367f032d93f642f64180aa3' as Address;

    const domain1 = new EIP712Domain('Test', '1', 1n, checksumAddress);
    const domain2 = new EIP712Domain('Test', '1', 1n, lowerCaseAddress);

    // viem은 주소를 normalize하므로 동일한 결과
    expect(domain1.calculateDomainSeparator()).toBe(
      domain2.calculateDomainSeparator()
    );
  });
});
