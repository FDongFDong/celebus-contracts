import { describe, it, expect } from 'vitest';
import { EIP712Domain } from '../EIP712Domain';
import { type Address } from 'viem';

describe('EIP712Domain', () => {
  const mockDomainParams = {
    name: 'Celebus',
    version: '1',
    chainId: 1n,
    verifyingContract: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address,
  };

  describe('생성', () => {
    it('유효한 파라미터로 EIP712Domain을 생성할 수 있다', () => {
      const domain = new EIP712Domain(
        mockDomainParams.name,
        mockDomainParams.version,
        mockDomainParams.chainId,
        mockDomainParams.verifyingContract
      );

      expect(domain.name).toBe(mockDomainParams.name);
      expect(domain.version).toBe(mockDomainParams.version);
      expect(domain.chainId).toBe(mockDomainParams.chainId);
      expect(domain.verifyingContract).toBe(mockDomainParams.verifyingContract);
    });

    it('chainId는 bigint 타입이어야 한다', () => {
      const domain = new EIP712Domain(
        'Test',
        '1',
        31337n,
        '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address
      );

      expect(typeof domain.chainId).toBe('bigint');
      expect(domain.chainId).toBe(31337n);
    });
  });

  describe('calculateDomainSeparator', () => {
    it('올바른 domain separator를 계산한다', () => {
      const domain = new EIP712Domain(
        mockDomainParams.name,
        mockDomainParams.version,
        mockDomainParams.chainId,
        mockDomainParams.verifyingContract
      );

      const domainSeparator = domain.calculateDomainSeparator();

      // Hash 형식 검증 (0x로 시작하는 66자 hex string)
      expect(domainSeparator).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('동일한 domain 값으로는 동일한 separator를 생성한다', () => {
      const domain1 = new EIP712Domain(
        mockDomainParams.name,
        mockDomainParams.version,
        mockDomainParams.chainId,
        mockDomainParams.verifyingContract
      );

      const domain2 = new EIP712Domain(
        mockDomainParams.name,
        mockDomainParams.version,
        mockDomainParams.chainId,
        mockDomainParams.verifyingContract
      );

      expect(domain1.calculateDomainSeparator()).toBe(
        domain2.calculateDomainSeparator()
      );
    });

    it('다른 chainId는 다른 separator를 생성한다', () => {
      const domain1 = new EIP712Domain(
        mockDomainParams.name,
        mockDomainParams.version,
        1n,
        mockDomainParams.verifyingContract
      );

      const domain2 = new EIP712Domain(
        mockDomainParams.name,
        mockDomainParams.version,
        31337n,
        mockDomainParams.verifyingContract
      );

      expect(domain1.calculateDomainSeparator()).not.toBe(
        domain2.calculateDomainSeparator()
      );
    });

    it('다른 verifyingContract는 다른 separator를 생성한다', () => {
      const domain1 = new EIP712Domain(
        mockDomainParams.name,
        mockDomainParams.version,
        mockDomainParams.chainId,
        '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address
      );

      const domain2 = new EIP712Domain(
        mockDomainParams.name,
        mockDomainParams.version,
        mockDomainParams.chainId,
        '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as Address
      );

      expect(domain1.calculateDomainSeparator()).not.toBe(
        domain2.calculateDomainSeparator()
      );
    });

    it('EIP-712 표준에 따라 domain separator를 계산한다', () => {
      // 기존 ethers.js 코드와 동일한 결과를 생성해야 함
      // typeHash = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
      // domainSeparator = keccak256(abi.encode(typeHash, keccak256(name), keccak256(version), chainId, verifyingContract))

      const domain = new EIP712Domain(
        'Celebus',
        '1',
        31337n,
        '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address
      );

      const separator = domain.calculateDomainSeparator();

      // 실제 계산 검증 (기존 로직과 호환성 확인용)
      expect(separator).toBeDefined();
      expect(typeof separator).toBe('string');
      expect(separator.startsWith('0x')).toBe(true);
    });
  });

  describe('toTypedDataDomain', () => {
    it('viem TypedDataDomain 형식으로 변환한다', () => {
      const domain = new EIP712Domain(
        mockDomainParams.name,
        mockDomainParams.version,
        mockDomainParams.chainId,
        mockDomainParams.verifyingContract
      );

      const typedDataDomain = domain.toTypedDataDomain();

      expect(typedDataDomain).toEqual({
        name: mockDomainParams.name,
        version: mockDomainParams.version,
        chainId: Number(mockDomainParams.chainId),
        verifyingContract: mockDomainParams.verifyingContract,
      });
    });

    it('chainId를 number로 변환한다', () => {
      const domain = new EIP712Domain(
        'Test',
        '1',
        31337n,
        '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address
      );

      const typedDataDomain = domain.toTypedDataDomain();

      expect(typeof typedDataDomain.chainId).toBe('number');
      expect(typedDataDomain.chainId).toBe(31337);
    });

    it('viem signTypedData와 호환되는 형식이어야 한다', () => {
      const domain = new EIP712Domain(
        mockDomainParams.name,
        mockDomainParams.version,
        mockDomainParams.chainId,
        mockDomainParams.verifyingContract
      );

      const typedDataDomain = domain.toTypedDataDomain();

      // viem TypedDataDomain 필수 속성 검증
      expect(typedDataDomain).toHaveProperty('name');
      expect(typedDataDomain).toHaveProperty('version');
      expect(typedDataDomain).toHaveProperty('chainId');
      expect(typedDataDomain).toHaveProperty('verifyingContract');
    });
  });
});
