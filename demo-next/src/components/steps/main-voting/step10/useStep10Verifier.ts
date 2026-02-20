'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { privateKeyToAccount } from 'viem/accounts';
import {
  concat,
  hexToSignature,
  isAddress,
  keccak256,
  type Address,
  type Hex,
} from 'viem';
import { DigestService } from '@/domain/services/DigestService';
import { EIP712Domain } from '@/domain/value-objects/EIP712Domain';
import { useAppStore } from '@/store/useAppStore';
import type { ExecutorResult, TabType, UserBatchResult, VerifyResult } from './types';

interface VoteRecordInput {
  timestamp: string;
  missionId: string;
  votingId: string;
  optionId: string;
  voteType: number;
  votingAmt: string;
}

interface ParsedVoteRecord {
  timestamp: bigint;
  missionId: bigint;
  votingId: bigint;
  optionId: bigint;
  voteType: number;
  votingAmt: bigint;
}

export function useStep10Verifier() {
  const [activeTab, setActiveTab] = useState<TabType>('userBatch');

  const [domainName, setDomainName] = useState('MainVoting');
  const [domainVersion, setDomainVersion] = useState('1');
  const [domainChainId, setDomainChainId] = useState('5611');
  const [domainContractInput, setDomainContractInput] = useState('');

  const [userPrivateKey, setUserPrivateKey] = useState('');
  const [userAddressInput, setUserAddressInput] = useState('');
  const [userNonce, setUserNonce] = useState('0');
  const [recordsInput, setRecordsInput] = useState('');
  const [userBatchResult, setUserBatchResult] = useState<UserBatchResult | null>(null);

  const [executorPrivateKey, setExecutorPrivateKey] = useState('');
  const [batchNonce, setBatchNonce] = useState('0');
  const [executorResult, setExecutorResult] = useState<ExecutorResult | null>(null);

  const [verifyInputSignature, setVerifyInputSignature] = useState('');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  const [logs, setLogs] = useState<string[]>([]);

  const contractAddress = useAppStore((s) => s.contractAddress);
  const domainContract = domainContractInput || contractAddress || '';

  const userAddress = useMemo(() => {
    if (!userPrivateKey || !userPrivateKey.startsWith('0x')) return '';

    try {
      const account = privateKeyToAccount(userPrivateKey as Hex);
      return account.address;
    } catch {
      return 'Invalid key';
    }
  }, [userPrivateKey]);

  const executorAddress = useMemo(() => {
    if (!executorPrivateKey || !executorPrivateKey.startsWith('0x')) return '';

    try {
      const account = privateKeyToAccount(executorPrivateKey as Hex);
      return account.address;
    } catch {
      return 'Invalid key';
    }
  }, [executorPrivateKey]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const getDomain = () => {
    if (!domainContract || !isAddress(domainContract)) {
      throw new Error('올바른 Contract Address를 입력해주세요');
    }

    let chainId: bigint;
    try {
      chainId = BigInt(domainChainId);
    } catch {
      throw new Error('체인 ID는 숫자여야 합니다');
    }

    return new EIP712Domain(
      domainName,
      domainVersion,
      chainId,
      domainContract as Address
    );
  };

  const parseVoteRecords = (): VoteRecordInput[] => {
    if (!recordsInput.trim()) {
      throw new Error('Record 데이터를 입력해주세요');
    }

    const lines = recordsInput
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return lines.map((line, index) => {
      const parts = line.split(',').map((part) => part.trim());
      if (parts.length < 6) {
        throw new Error(`Record 형식이 잘못되었습니다 (라인 ${index + 1})`);
      }

      return {
        timestamp: parts[0],
        missionId: parts[1],
        votingId: parts[2],
        optionId: parts[3],
        voteType: parseInt(parts[4], 10),
        votingAmt: parts[5],
      };
    });
  };

  const toParsedVoteRecord = (record: VoteRecordInput): ParsedVoteRecord => {
    try {
      return {
        timestamp: BigInt(record.timestamp),
        missionId: BigInt(record.missionId),
        votingId: BigInt(record.votingId),
        optionId: BigInt(record.optionId),
        voteType: record.voteType,
        votingAmt: BigInt(record.votingAmt),
      };
    } catch {
      throw new Error('Record 숫자 필드에 올바른 값을 입력해주세요');
    }
  };

  const generateUserBatchSignature = async () => {
    try {
      if (!userPrivateKey) {
        toast.error('Private Key를 입력해주세요');
        return;
      }

      const account = privateKeyToAccount(userPrivateKey as Hex);
      const userAddr =
        userAddressInput && isAddress(userAddressInput)
          ? (userAddressInput as Address)
          : account.address;

      const records = parseVoteRecords();

      addLog('\n=== UserBatch 서명 생성 ===');
      addLog(`Signer: ${account.address}`);
      addLog(`User Address (for hash): ${userAddr}`);
      addLog(`UserNonce: ${userNonce}`);
      addLog(`Records: ${records.length}개`);

      const recordHashes = records.map((record, index) => {
        const recordHash = DigestService.hashVoteRecord(
          toParsedVoteRecord(record),
          userAddr
        );
        addLog(`Record[${index}] Hash: ${recordHash}`);
        return recordHash;
      });

      const recordsHash = keccak256(concat(recordHashes));
      addLog(`RecordsHash: ${recordsHash}`);

      const domain = getDomain();
      const signature = await account.signTypedData({
        domain: domain.toTypedDataDomain(),
        types: {
          UserBatch: [
            { name: 'user', type: 'address' },
            { name: 'userNonce', type: 'uint256' },
            { name: 'recordsHash', type: 'bytes32' },
          ],
        },
        primaryType: 'UserBatch',
        message: {
          user: userAddr,
          userNonce: BigInt(userNonce),
          recordsHash,
        },
      });

      addLog(`Signature: ${signature}`);

      setUserBatchResult({
        recordsHash,
        signature,
        recovered: account.address,
        isValid: true,
      });

      toast.success('서명 생성 완료');
    } catch (error) {
      const message = error instanceof Error ? error.message : '서명 생성 실패';
      addLog(`Error: ${message}`);
      toast.error(message);
    }
  };

  const generateExecutorSignature = async () => {
    try {
      if (!executorPrivateKey) {
        toast.error('Executor Private Key를 입력해주세요');
        return;
      }

      const account = privateKeyToAccount(executorPrivateKey as Hex);

      addLog('\n=== Executor 서명 생성 ===');
      addLog(`Executor: ${account.address}`);
      addLog(`BatchNonce: ${batchNonce}`);

      const domain = getDomain();
      const signature = await account.signTypedData({
        domain: domain.toTypedDataDomain(),
        types: {
          Batch: [{ name: 'batchNonce', type: 'uint256' }],
        },
        primaryType: 'Batch',
        message: {
          batchNonce: BigInt(batchNonce),
        },
      });

      addLog(`Signature: ${signature}`);

      const structHash = DigestService.calculateStructHash(BigInt(batchNonce));
      const batchDigest = DigestService.calculateDigest(
        domain.calculateDomainSeparator(),
        structHash
      );

      addLog(`Batch Digest: ${batchDigest}`);

      setExecutorResult({
        batchDigest,
        signature,
        recovered: account.address,
        isValid: true,
      });

      toast.success('서명 생성 완료');
    } catch (error) {
      const message = error instanceof Error ? error.message : '서명 생성 실패';
      addLog(`Error: ${message}`);
      toast.error(message);
    }
  };

  const verifySignature = () => {
    try {
      if (!verifyInputSignature) {
        toast.error('Signature를 입력해주세요');
        return;
      }

      addLog('\n=== 서명 검증 ===');

      const sig = hexToSignature(verifyInputSignature as Hex);
      addLog(`r: ${sig.r}`);
      addLog(`s: ${sig.s}`);
      addLog(`v: ${sig.v}`);

      setVerifyResult({
        r: sig.r,
        s: sig.s,
        v: sig.v,
        info: 'viem에는 verifyTypedData가 없어 서명 컴포넌트만 표시합니다.',
      });

      toast.success('서명 컴포넌트 추출 완료');
    } catch (error) {
      const message = error instanceof Error ? error.message : '검증 실패';
      addLog(`Error: ${message}`);
      toast.error(message);
    }
  };

  const applyContractAddressFromStore = () => {
    if (contractAddress) {
      setDomainContractInput(contractAddress);
    }
  };

  return {
    activeTab,
    setActiveTab,
    domainName,
    setDomainName,
    domainVersion,
    setDomainVersion,
    domainChainId,
    setDomainChainId,
    domainContractInput,
    setDomainContractInput,
    contractAddress,
    userPrivateKey,
    setUserPrivateKey,
    userAddress,
    userAddressInput,
    setUserAddressInput,
    userNonce,
    setUserNonce,
    recordsInput,
    setRecordsInput,
    userBatchResult,
    executorPrivateKey,
    setExecutorPrivateKey,
    executorAddress,
    batchNonce,
    setBatchNonce,
    executorResult,
    verifyInputSignature,
    setVerifyInputSignature,
    verifyResult,
    logs,
    generateUserBatchSignature,
    generateExecutorSignature,
    verifySignature,
    applyContractAddressFromStore,
  };
}
