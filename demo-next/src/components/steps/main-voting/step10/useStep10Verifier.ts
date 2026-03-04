'use client';

import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { privateKeyToAccount } from 'viem/accounts';
import {
  concat,
  hexToSignature,
  isAddress,
  keccak256,
  recoverTypedDataAddress,
  verifyTypedData,
  type Address,
  type Hex,
} from 'viem';
import { DigestService } from '@/domain/services/DigestService';
import { EIP712Domain } from '@/domain/value-objects/EIP712Domain';
import {
  ENABLE_STEP10_PRIVATE_KEY_SIGNER,
  maskSensitiveHex,
} from '@/lib/dev-security';
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
  const canUsePrivateKeySigner = ENABLE_STEP10_PRIVATE_KEY_SIGNER;
  const [activeTab, setActiveTab] = useState<TabType>(
    canUsePrivateKeySigner ? 'userBatch' : 'verify'
  );

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
  const [verifyTarget, setVerifyTarget] = useState<'userBatch' | 'executor'>(
    'userBatch'
  );
  const [verifyExpectedAddress, setVerifyExpectedAddress] = useState('');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [logs, setLogs] = useState<string[]>([]);
  const verifyRequestIdRef = useRef(0);
  const isVerifyingRef = useRef(false);

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
      if (!canUsePrivateKeySigner) {
        toast.error(
          '공개 배포에서는 Step10 Private Key 서명 기능이 비활성화되어 있습니다.'
        );
        return;
      }

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

      addLog(`Signature: ${maskSensitiveHex(signature)}`);

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
      if (!canUsePrivateKeySigner) {
        toast.error(
          '공개 배포에서는 Step10 Private Key 서명 기능이 비활성화되어 있습니다.'
        );
        return;
      }

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

      addLog(`Signature: ${maskSensitiveHex(signature)}`);

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

  const verifySignature = async () => {
    setVerifyResult(null);

    if (isVerifyingRef.current) {
      toast.info('서명 검증이 이미 진행 중입니다.');
      return;
    }

    try {
      if (!verifyInputSignature) {
        toast.error('Signature를 입력해주세요');
        return;
      }

      if (!verifyExpectedAddress || !isAddress(verifyExpectedAddress)) {
        toast.error('검증 대상 주소를 올바르게 입력해주세요');
        return;
      }

      const requestId = verifyRequestIdRef.current + 1;
      verifyRequestIdRef.current = requestId;
      isVerifyingRef.current = true;
      setIsVerifying(true);

      addLog('\n=== 서명 검증 ===');
      addLog(`Target: ${verifyTarget}`);

      const sig = hexToSignature(verifyInputSignature as Hex);
      addLog(`r: ${sig.r}`);
      addLog(`s: ${sig.s}`);
      addLog(`v: ${sig.v}`);

      const expectedAddress = verifyExpectedAddress as Address;
      const typedDomain = getDomain().toTypedDataDomain();

      let recoveredAddress: Address;
      let isValid = false;

      if (verifyTarget === 'userBatch') {
        const userAddr =
          userAddressInput && isAddress(userAddressInput)
            ? (userAddressInput as Address)
            : isAddress(userAddress)
              ? (userAddress as Address)
              : null;

        if (!userAddr) {
          throw new Error(
            'UserBatch 검증에는 사용자 주소가 필요합니다. 사용자 주소(해시용)를 입력해주세요.'
          );
        }

        const records = parseVoteRecords();
        const recordHashes = records.map((record) =>
          DigestService.hashVoteRecord(toParsedVoteRecord(record), userAddr)
        );
        const recordsHash = keccak256(concat(recordHashes));

        addLog(`User Address (for hash): ${userAddr}`);
        addLog(`UserNonce: ${userNonce}`);
        addLog(`Records: ${records.length}개`);
        addLog(`RecordsHash: ${recordsHash}`);

        const typedData = {
          domain: typedDomain,
          types: {
            UserBatch: [
              { name: 'user', type: 'address' },
              { name: 'userNonce', type: 'uint256' },
              { name: 'recordsHash', type: 'bytes32' },
            ],
          },
          primaryType: 'UserBatch' as const,
          message: {
            user: userAddr,
            userNonce: BigInt(userNonce),
            recordsHash,
          },
        };

        recoveredAddress = await recoverTypedDataAddress({
          ...typedData,
          signature: verifyInputSignature as Hex,
        });

        isValid = await verifyTypedData({
          ...typedData,
          address: expectedAddress,
          signature: verifyInputSignature as Hex,
        });
      } else {
        addLog(`BatchNonce: ${batchNonce}`);

        const typedData = {
          domain: typedDomain,
          types: {
            Batch: [{ name: 'batchNonce', type: 'uint256' }],
          },
          primaryType: 'Batch' as const,
          message: {
            batchNonce: BigInt(batchNonce),
          },
        };

        recoveredAddress = await recoverTypedDataAddress({
          ...typedData,
          signature: verifyInputSignature as Hex,
        });

        isValid = await verifyTypedData({
          ...typedData,
          address: expectedAddress,
          signature: verifyInputSignature as Hex,
        });
      }

      addLog(`Recovered: ${recoveredAddress}`);
      addLog(`Expected: ${expectedAddress}`);
      addLog(`Result: ${isValid ? 'VALID' : 'INVALID'}`);

      if (verifyRequestIdRef.current !== requestId) {
        return;
      }

      setVerifyResult({
        r: sig.r,
        s: sig.s,
        v: sig.v,
        isValid,
        recoveredAddress,
        expectedAddress,
        target: verifyTarget,
        info: isValid
          ? '서명이 도메인/메시지/주소와 일치합니다.'
          : '서명이 도메인/메시지/주소와 일치하지 않습니다.',
      });

      if (isValid) {
        toast.success('서명 검증 성공');
      } else {
        toast.error('서명 검증 실패');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '검증 실패';
      setVerifyResult(null);
      addLog(`Error: ${message}`);
      toast.error(message);
    } finally {
      isVerifyingRef.current = false;
      setIsVerifying(false);
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
    verifyTarget,
    setVerifyTarget,
    verifyExpectedAddress,
    setVerifyExpectedAddress,
    verifyResult,
    isVerifying,
    canUsePrivateKeySigner,
    logs,
    generateUserBatchSignature,
    generateExecutorSignature,
    verifySignature,
    applyContractAddressFromStore,
  };
}
