/**
 * DigestService - EIP-712 Digest 계산 서비스
 *
 * 순수 함수로 구현된 EIP-712 digest 계산 유틸리티
 * 기존 ethers.js 구현을 viem으로 변환
 */

import {
  keccak256,
  encodeAbiParameters,
  encodePacked,
  toBytes,
  type Hash,
} from 'viem';
import type { Address } from '../types';

/**
 * VoteRecord 타입 (userId 제외 - 프론트엔드에서 서명)
 */
export interface VoteRecord {
  timestamp: bigint;
  missionId: bigint;
  votingId: bigint;
  optionId: bigint;
  voteType: number;
  votingAmt: bigint;
}

export interface SubVoteRecordForHash {
  timestamp: bigint;
  missionId: bigint;
  votingId: bigint;
  questionId: bigint;
  optionId: bigint;
  votingAmt: bigint;
}

export interface BoostRecordForHash {
  timestamp: bigint;
  missionId: bigint;
  boostingId: bigint;
  optionId: bigint;
  boostingWith: number;
  amt: bigint;
}

/**
 * DigestService - EIP-712 digest 계산
 */
export class DigestService {
  /**
   * Struct Hash 계산 (Batch 타입)
   *
   * @param batchNonce - Batch nonce 값
   * @returns Struct hash
   *
   * 계산 과정:
   * 1. BATCH_TYPEHASH = keccak256("Batch(uint256 batchNonce)")
   * 2. encoded = abi.encode(BATCH_TYPEHASH, batchNonce)
   * 3. structHash = keccak256(encoded)
   */
  static calculateStructHash(batchNonce: bigint): Hash {
    // 1. BATCH_TYPEHASH 계산
    const typeHash = keccak256(toBytes('Batch(uint256 batchNonce)'));

    // 2. Batch 데이터 인코딩
    const encoded = encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'uint256' }],
      [typeHash, batchNonce]
    );

    // 3. 최종 해시
    return keccak256(encoded);
  }

  /**
   * Final Digest 계산 (EIP-191 형식)
   *
   * @param domainSeparator - Domain separator hash
   * @param structHash - Struct hash
   * @returns Final digest
   *
   * 계산 과정:
   * EIP-191: keccak256("\x19\x01" + domainSeparator + structHash)
   */
  static calculateDigest(domainSeparator: Hash, structHash: Hash): Hash {
    // EIP-191 형식으로 인코딩
    const packed = encodePacked(
      ['bytes2', 'bytes32', 'bytes32'],
      ['0x1901', domainSeparator, structHash]
    );

    return keccak256(packed);
  }

  /**
   * Vote Record Hash 계산
   *
   * @param record - Vote record 객체 (userId 제외)
   * @param userAddress - 서명자의 지갑 주소
   * @returns Record hash
   *
   * 참고:
   * - userId는 서명 대상에서 제외됨
   * - 프론트엔드에서 userId 없이 서명
   * - 백엔드가 나중에 userId를 주입
   *
   * 계산 과정:
   * 1. VOTE_RECORD_TYPEHASH = keccak256("VoteRecord(...,address user)")
   * 2. encoded = abi.encode(TYPEHASH, ...fields, userAddress)
   * 3. recordHash = keccak256(encoded)
   */
  static hashVoteRecord(record: VoteRecord, userAddress: Address): Hash {
    // 1. VOTE_RECORD_TYPEHASH 계산 (userId 제외)
    const VOTE_RECORD_TYPEHASH = keccak256(
      toBytes(
        'VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 optionId,uint8 voteType,uint256 votingAmt,address user)'
      )
    );

    // 2. Record 데이터 인코딩 (user address 포함, userId 제외)
    const encoded = encodeAbiParameters(
      [
        { type: 'bytes32' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint8' },
        { type: 'uint256' },
        { type: 'address' },
      ],
      [
        VOTE_RECORD_TYPEHASH,
        record.timestamp,
        record.missionId,
        record.votingId,
        record.optionId,
        record.voteType,
        record.votingAmt,
        userAddress,
      ]
    );

    // 3. 최종 해시
    return keccak256(encoded);
  }

  /**
   * SubVoting VoteRecord Hash 계산
   */
  static hashSubVoteRecord(
    record: SubVoteRecordForHash,
    userAddress: Address
  ): Hash {
    const SUB_VOTE_RECORD_TYPEHASH = keccak256(
      toBytes(
        'VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 questionId,uint256 optionId,uint256 votingAmt,address user)'
      )
    );

    const encoded = encodeAbiParameters(
      [
        { type: 'bytes32' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'address' },
      ],
      [
        SUB_VOTE_RECORD_TYPEHASH,
        record.timestamp,
        record.missionId,
        record.votingId,
        record.questionId,
        record.optionId,
        record.votingAmt,
        userAddress,
      ]
    );

    return keccak256(encoded);
  }

  /**
   * Boosting BoostRecord Hash 계산
   */
  static hashBoostRecord(
    record: BoostRecordForHash,
    userAddress: Address
  ): Hash {
    const BOOST_RECORD_TYPEHASH = keccak256(
      toBytes(
        'BoostRecord(uint256 timestamp,uint256 missionId,uint256 boostingId,uint256 optionId,uint8 boostingWith,uint256 amt,address user)'
      )
    );

    const encoded = encodeAbiParameters(
      [
        { type: 'bytes32' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint8' },
        { type: 'uint256' },
        { type: 'address' },
      ],
      [
        BOOST_RECORD_TYPEHASH,
        record.timestamp,
        record.missionId,
        record.boostingId,
        record.optionId,
        record.boostingWith,
        record.amt,
        userAddress,
      ]
    );

    return keccak256(encoded);
  }
}
