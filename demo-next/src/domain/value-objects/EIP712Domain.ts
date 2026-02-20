import {
  type Address,
  type Hash,
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  toHex,
} from 'viem';

/** JavaScript Number.MAX_SAFE_INTEGER를 bigint로 변환 */
const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * EIP-712 Domain 구조
 * viem의 TypedDataDomain과 호환
 */
export interface TypedDataDomain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: Address;
}

/**
 * EIP-712 Domain Separator Value Object
 *
 * EIP-712 표준에 따라 Domain Separator를 계산하고 관리합니다.
 * - Domain은 어떤 컨트랙트에서 서명이 사용될지 정의
 * - viem의 signTypedData와 호환되는 형식 제공
 *
 * @see https://eips.ethereum.org/EIPS/eip-712
 */
export class EIP712Domain {
  readonly name: string;
  readonly version: string;
  readonly chainId: bigint;
  readonly verifyingContract: Address;

  constructor(
    name: string,
    version: string,
    chainId: bigint,
    verifyingContract: Address
  ) {
    this.name = name;
    this.version = version;
    this.chainId = chainId;
    this.verifyingContract = verifyingContract;
  }

  /**
   * EIP-712 Domain Separator 계산
   *
   * 계산 방식:
   * 1. EIP712Domain typeHash 계산
   * 2. Domain 데이터 인코딩 (typeHash, name hash, version hash, chainId, verifyingContract)
   * 3. 최종 keccak256 해시
   *
   * @returns Domain separator hash (0x로 시작하는 66자 hex string)
   */
  calculateDomainSeparator(): Hash {
    // 1. EIP712Domain typeHash
    const typeHash = keccak256(
      toHex(
        'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
      )
    );

    // 2. Domain 데이터 인코딩
    const encoded = encodeAbiParameters(
      parseAbiParameters('bytes32, bytes32, bytes32, uint256, address'),
      [
        typeHash,
        keccak256(toHex(this.name)),
        keccak256(toHex(this.version)),
        this.chainId,
        this.verifyingContract,
      ]
    );

    // 3. 최종 해시
    return keccak256(encoded);
  }

  /**
   * viem TypedDataDomain 형식으로 변환
   *
   * viem의 signTypedData 함수에서 사용할 수 있는 형식으로 변환합니다.
   * chainId를 number 타입으로 변환합니다.
   *
   * @returns viem TypedDataDomain 객체
   * @throws chainId가 MAX_SAFE_INTEGER를 초과하는 경우 에러
   */
  toTypedDataDomain(): TypedDataDomain {
    // 보안: chainId가 Number.MAX_SAFE_INTEGER를 초과하면 정밀도 손실 발생
    if (this.chainId > MAX_SAFE_INTEGER_BIGINT) {
      throw new Error(
        `chainId(${this.chainId})가 Number.MAX_SAFE_INTEGER(${Number.MAX_SAFE_INTEGER})를 초과합니다. ` +
        `EIP-712 서명에서 chainId 불일치가 발생할 수 있습니다.`
      );
    }

    return {
      name: this.name,
      version: this.version,
      chainId: Number(this.chainId),
      verifyingContract: this.verifyingContract,
    };
  }
}
