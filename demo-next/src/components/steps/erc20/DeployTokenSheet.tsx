'use client';

/**
 * DeployTokenSheet - CelebToken 배포 폼 (인라인)
 *
 * 기존 Erc20Step0Setup의 배포 로직을 인라인 폼으로 제공.
 * MetaMask로 CelebToken을 배포하고 배포된 주소를 반환.
 */

import { useState, useEffect, useCallback } from 'react';
import { parseAbi, type Address } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WalletRequiredGuard } from '@/components/shared/WalletRequiredGuard';
import { TransactionTracker } from '@/components/shared/TransactionTracker';
import { useChainClient } from '@/hooks/useChainClient';
import { useInjectedWallet } from '@/hooks/useInjectedWallet';
import {
  logError,
  getBlockchainErrorMessage,
  isUserRejectionError,
} from '@/lib/error-handler';
import { toast } from 'sonner';

const DEPLOY_ABI = parseAbi([
  'constructor(string tokenName, string tokenSymbol, address recipient, address initialOwner)',
]);

const CELEB_TOKEN_BYTECODE_FILE = '/CelebToken-bytecode.txt';

interface DeployTokenSheetProps {
  onDeployed: (address: Address) => void;
}

export function DeployTokenSheet({ onDeployed }: DeployTokenSheetProps) {
  const { publicClient, chainId } = useChainClient();
  const { getWalletClient, address, ensureChain } = useInjectedWallet();

  const [bytecode, setBytecode] = useState('');
  const [tokenName, setTokenName] = useState('CelebToken');
  const [tokenSymbol, setTokenSymbol] = useState('CELEB');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'confirmed' | 'error'
  >('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<Address | null>(null);

  useEffect(() => {
    fetch(CELEB_TOKEN_BYTECODE_FILE)
      .then((res) => res.text())
      .then((text) => setBytecode(text.trim()))
      .catch((err) => logError('DeployTokenSheet.loadBytecode', err));
  }, []);

  useEffect(() => {
    if (address) {
      setRecipientAddress(address);
      setOwnerAddress(address);
    }
  }, [address]);

  const handleDeploy = useCallback(async () => {
    if (!bytecode) {
      setError('Bytecode가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
      setStatus('error');
      return;
    }

    if (!tokenName.trim() || !tokenSymbol.trim()) {
      setError('Token Name과 Symbol을 입력해주세요.');
      setStatus('error');
      return;
    }

    if (!recipientAddress || !ownerAddress) {
      setError('Recipient과 Owner 주소를 입력해주세요.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setError(null);
    setTxHash(null);
    setDeployedAddress(null);

    try {
      await ensureChain();
      const walletClient = getWalletClient();

      const hash = await walletClient.deployContract({
        abi: DEPLOY_ABI,
        bytecode: bytecode as `0x${string}`,
        args: [
          tokenName.trim(),
          tokenSymbol.trim(),
          recipientAddress as Address,
          ownerAddress as Address,
        ],
        account: address!,
        chain: undefined,
      });
      setTxHash(hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (!receipt.contractAddress) {
        throw new Error('배포 영수증에서 컨트랙트 주소를 찾을 수 없습니다');
      }

      setDeployedAddress(receipt.contractAddress);
      onDeployed(receipt.contractAddress);
      setStatus('confirmed');
      toast.success('CelebToken이 성공적으로 배포되었습니다!');
    } catch (err) {
      logError('DeployTokenSheet.handleDeploy', err);
      if (isUserRejectionError(err)) {
        setStatus('idle');
        setError(null);
        setTxHash(null);
        toast.info('트랜잭션 서명이 취소되었습니다');
        return;
      }

      const message = getBlockchainErrorMessage(err);
      setError(message);
      setStatus('error');
      toast.error(message);
    }
  }, [
    bytecode,
    tokenName,
    tokenSymbol,
    recipientAddress,
    ownerAddress,
    address,
    ensureChain,
    getWalletClient,
    onDeployed,
    publicClient,
  ]);

  return (
    <WalletRequiredGuard message="배포를 위해 지갑을 연결해주세요">
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <Label>Token Name</Label>
          <Input
            type="text"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="CelebToken"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Token Symbol</Label>
          <Input
            type="text"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            placeholder="CELEB"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Recipient (토큰 수령자)</Label>
          <Input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x..."
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            초기 토큰 수령 주소
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Owner (컨트랙트 소유자)</Label>
          <Input
            type="text"
            value={ownerAddress}
            onChange={(e) => setOwnerAddress(e.target.value)}
            placeholder="0x..."
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            컨트랙트 관리 권한 주소
          </p>
        </div>

        <Button
          onClick={handleDeploy}
          disabled={status === 'submitting'}
          className="w-full"
        >
          {status === 'submitting' ? '배포 중...' : 'CelebToken 배포'}
        </Button>

        <TransactionTracker
          status={status}
          txHash={txHash}
          chainId={chainId}
          error={error}
        />

        {deployedAddress && (
          <div className="space-y-3 rounded-lg border border-green-300 bg-green-50 p-3 dark:bg-green-950/30">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              배포된 주소 (자동 반영됨)
            </p>
            <p className="break-all font-mono text-xs">
              {deployedAddress}
            </p>
          </div>
        )}
      </div>
    </WalletRequiredGuard>
  );
}
