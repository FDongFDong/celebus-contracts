// Permit 서명 검증 및 on-chain permit() 직접 호출 디버깅 도구
'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  isAddress,
  recoverTypedDataAddress,
  domainSeparator as computeDomainSeparator,
} from 'viem';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/shared/SectionCard';
import { AddressDisplay } from '@/components/shared/AddressDisplay';
import { TransactionTracker } from '@/components/shared/TransactionTracker';
import { WalletRequiredGuard } from '@/components/shared/WalletRequiredGuard';
import { TechDetail } from '@/components/shared/TechDetail';
import { useErc20Store } from '@/store/useErc20Store';
import { useInjectedWallet } from '@/hooks/useInjectedWallet';
import { useChainClient } from '@/hooks/useChainClient';
import {
  ERC20_PERMIT_ABI,
  ERC20_PERMIT_TYPES,
  createErc20PermitDomain,
} from '@/infrastructure/contracts/CelebTokenContract';
import { getBlockchainErrorMessage, logError } from '@/lib/error-handler';

type VerifyStatus = 'idle' | 'verifying' | 'match' | 'mismatch' | 'error';
type PermitTxStatus = 'idle' | 'submitting' | 'confirmed' | 'error';

function isBytes32Hex(value: string): value is `0x${string}` {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

function toPermitV(input: string): number {
  const parsed = Number(input.trim());
  if (!Number.isInteger(parsed)) {
    throw new Error('v는 정수여야 합니다');
  }
  if (parsed === 0 || parsed === 1) {
    return parsed + 27;
  }
  if (parsed === 27 || parsed === 28) {
    return parsed;
  }
  throw new Error('v는 0/1 또는 27/28만 허용됩니다');
}

function toUint256(input: string, label: string): bigint {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error(`${label} 값이 비어있습니다`);
  }
  return BigInt(trimmed);
}

export function PermitVerifySection() {
  const { getWalletClient } = useInjectedWallet();
  const { publicClient, chainId } = useChainClient();
  const tokenAddress = useErc20Store((s) => s.tokenAddress);
  const tokenInfo = useErc20Store((s) => s.tokenInfo);

  // 입력 필드 state
  const [owner, setOwner] = useState('');
  const [spender, setSpender] = useState('');
  const [value, setValue] = useState('');
  const [deadline, setDeadline] = useState('');
  const [nonce, setNonce] = useState('');
  const [v, setV] = useState('');
  const [r, setR] = useState('');
  const [s, setS] = useState('');

  // 검증 결과 state
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle');
  const [recoveredAddress, setRecoveredAddress] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // permit TX state
  const [permitStatus, setPermitStatus] = useState<PermitTxStatus>('idle');
  const [permitTxHash, setPermitTxHash] = useState<string | null>(null);
  const [permitError, setPermitError] = useState<string | null>(null);

  // on-chain 데이터 state
  const [onChainNonce, setOnChainNonce] = useState<bigint | null>(null);
  const [onChainDomainSep, setOnChainDomainSep] = useState<string | null>(null);
  const [computedDomainSep, setComputedDomainSep] = useState<string | null>(null);

  // on-chain nonce + DOMAIN_SEPARATOR 자동 조회
  useEffect(() => {
    if (!tokenAddress || !isAddress(owner)) {
      setOnChainNonce(null);
      setOnChainDomainSep(null);
      setComputedDomainSep(null);
      return;
    }

    const fetchOnChainData = async () => {
      try {
        const [nonce, domSep] = await Promise.all([
          publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20_PERMIT_ABI,
            functionName: 'nonces',
            args: [owner as `0x${string}`],
          }),
          publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20_PERMIT_ABI,
            functionName: 'DOMAIN_SEPARATOR',
          }),
        ]);
        setOnChainNonce(nonce);
        setOnChainDomainSep(domSep);
      } catch (err) {
        logError('PermitVerifySection.fetchOnChainData', err);
      }
    };

    fetchOnChainData();
  }, [tokenAddress, owner, publicClient]);

  // computed domain separator
  useEffect(() => {
    if (!tokenAddress || !tokenInfo) {
      setComputedDomainSep(null);
      return;
    }

    try {
      const domain = createErc20PermitDomain(
        tokenAddress as `0x${string}`,
        chainId,
        tokenInfo.name,
      );
      const computed = computeDomainSeparator({ domain });
      setComputedDomainSep(computed);
    } catch (err) {
      logError('PermitVerifySection.computeDomainSep', err);
    }
  }, [tokenAddress, tokenInfo, chainId]);

  // 서명 검증 (recoverTypedDataAddress)
  const handleVerifySignature = useCallback(async () => {
    if (!tokenAddress || !tokenInfo || !isAddress(owner) || !isAddress(spender)) return;
    if (!value || !deadline || !v || !r || !s) return;

    setVerifyStatus('verifying');
    setRecoveredAddress(null);
    setVerifyError(null);

    try {
      const domain = createErc20PermitDomain(
        tokenAddress as `0x${string}`,
        chainId,
        tokenInfo.name,
      );

      const permitValue = toUint256(value, 'value');
      const permitDeadline = toUint256(deadline, 'deadline');
      const permitV = toPermitV(v);
      if (!isBytes32Hex(r) || !isBytes32Hex(s)) {
        throw new Error('r/s는 32바이트 hex(0x + 64자리)여야 합니다');
      }

      // 사용자가 nonce를 입력했으면 그 값 사용, 아니면 on-chain nonce
      const nonceValue = nonce.trim()
        ? toUint256(nonce, 'nonce')
        : onChainNonce;
      if (nonceValue == null) {
        throw new Error('nonce를 입력하거나 on-chain nonce 조회 후 다시 시도해주세요');
      }

      const recovered = await recoverTypedDataAddress({
        domain,
        types: ERC20_PERMIT_TYPES,
        primaryType: 'Permit',
        message: {
          owner: owner as `0x${string}`,
          spender: spender as `0x${string}`,
          value: permitValue,
          nonce: nonceValue,
          deadline: permitDeadline,
        },
        signature: {
          v: BigInt(permitV),
          r,
          s,
        },
      });

      setRecoveredAddress(recovered);
      setVerifyStatus(
        recovered.toLowerCase() === owner.toLowerCase() ? 'match' : 'mismatch',
      );
    } catch (err) {
      const message = getBlockchainErrorMessage(err);
      setVerifyError(message);
      setVerifyStatus('error');
      logError('PermitVerifySection.handleVerifySignature', err);
    }
  }, [tokenAddress, tokenInfo, chainId, owner, spender, value, deadline, nonce, v, r, s, onChainNonce]);

  // on-chain permit() 직접 호출
  const handlePermitCall = useCallback(async () => {
    if (!tokenAddress || !isAddress(owner) || !isAddress(spender)) return;
    if (!value || !deadline || !v || !r || !s) return;

    setPermitStatus('submitting');
    setPermitTxHash(null);
    setPermitError(null);

    try {
      const permitValue = toUint256(value, 'value');
      const permitDeadline = toUint256(deadline, 'deadline');
      const permitV = toPermitV(v);
      if (!isBytes32Hex(r) || !isBytes32Hex(s)) {
        throw new Error('r/s는 32바이트 hex(0x + 64자리)여야 합니다');
      }

      const walletClient = getWalletClient();
      const account = walletClient.account?.address;

      // account가 없으면 requestAddresses로 가져오기
      const [sender] = account
        ? [account]
        : await walletClient.requestAddresses();

      const { request } = await publicClient.simulateContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_PERMIT_ABI,
        functionName: 'permit',
        args: [
          owner as `0x${string}`,
          spender as `0x${string}`,
          permitValue,
          permitDeadline,
          permitV,
          r,
          s,
        ],
        account: sender,
      });

      const txHash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      setPermitTxHash(txHash);
      setPermitStatus('confirmed');
    } catch (err) {
      const message = getBlockchainErrorMessage(err);
      setPermitError(message);
      setPermitStatus('error');
      logError('PermitVerifySection.handlePermitCall', err);
    }
  }, [tokenAddress, owner, spender, value, deadline, v, r, s, publicClient, getWalletClient]);

  const domainSepMatch =
    onChainDomainSep && computedDomainSep
      ? onChainDomainSep.toLowerCase() === computedDomainSep.toLowerCase()
      : null;

  const canVerify =
    Boolean(tokenAddress) &&
    Boolean(tokenInfo) &&
    isAddress(owner) &&
    isAddress(spender) &&
    Boolean(value) &&
    Boolean(deadline) &&
    Boolean(v) &&
    isBytes32Hex(r) &&
    isBytes32Hex(s);

  return (
    <SectionCard
      type="config"
      title="4. Permit 검증 (디버깅)"
      description="celebus-pwa가 보내는 permit 파라미터를 직접 검증합니다. 서명 복원 및 on-chain permit() 호출을 분리 테스트합니다."
    >
      <WalletRequiredGuard message="permit() 호출을 위해 지갑을 연결해주세요">
        <div className="space-y-4">
          {/* 입력 필드 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Owner (서명자 주소)</Label>
              <Input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value.trim())}
                placeholder="0x..."
                className="font-mono text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Spender (승인 대상)</Label>
              <Input
                type="text"
                value={spender}
                onChange={(e) => setSpender(e.target.value.trim())}
                placeholder="0x..."
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Value (wei 단위)</Label>
              <Input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value.trim())}
                placeholder="1000000000000000000"
                className="font-mono text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Deadline (Unix timestamp)</Label>
              <Input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value.trim())}
                placeholder="1700000000"
                className="font-mono text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Nonce (서명 시점)</Label>
              <Input
                type="text"
                value={nonce}
                onChange={(e) => setNonce(e.target.value.trim())}
                placeholder="서명 시 사용된 nonce"
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">v (27 or 28)</Label>
              <Input
                type="text"
                value={v}
                onChange={(e) => setV(e.target.value.trim())}
                placeholder="27"
                className="font-mono text-xs"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs">r (hex)</Label>
              <Input
                type="text"
                value={r}
                onChange={(e) => setR(e.target.value.trim())}
                placeholder="0x..."
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">s (hex)</Label>
            <Input
              type="text"
              value={s}
              onChange={(e) => setS(e.target.value.trim())}
              placeholder="0x..."
              className="font-mono text-xs"
            />
          </div>

          {/* 액션 버튼 */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                handleVerifySignature().catch((err) =>
                  logError('PermitVerifySection.verify', err),
                );
              }}
              disabled={!canVerify || verifyStatus === 'verifying'}
              variant="outline"
              className="w-full"
            >
              {verifyStatus === 'verifying' ? '검증 중...' : '서명 검증'}
            </Button>
            <Button
              onClick={() => {
                handlePermitCall().catch((err) =>
                  logError('PermitVerifySection.permit', err),
                );
              }}
              disabled={!canVerify || permitStatus === 'submitting'}
              className="w-full"
            >
              {permitStatus === 'submitting' ? '실행 중...' : 'permit() 실행'}
            </Button>
          </div>

          {/* 서명 검증 결과 */}
          {verifyStatus === 'match' && recoveredAddress && (
            <div className="space-y-1 rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-800 dark:bg-green-950/30">
              <div className="flex items-center gap-2">
                <span className="text-green-700 dark:text-green-300">✅ 서명자 일치</span>
                <AddressDisplay
                  address={recoveredAddress as `0x${string}`}
                  showCopy
                  showExplorer={false}
                  chars={8}
                />
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                nonce used: {nonce.trim() || (onChainNonce?.toString() ?? '0')}
              </div>
            </div>
          )}

          {verifyStatus === 'mismatch' && recoveredAddress && (
            <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-950/30">
              <div className="text-red-700 dark:text-red-300">❌ 서명자 불일치</div>
              <div className="space-y-1 font-mono text-xs">
                <div>
                  <span className="text-muted-foreground">Expected (owner):</span>{' '}
                  <AddressDisplay
                    address={owner as `0x${string}`}
                    showCopy
                    showExplorer={false}
                    chars={8}
                  />
                </div>
                <div>
                  <span className="text-muted-foreground">Recovered:</span>{' '}
                  <AddressDisplay
                    address={recoveredAddress as `0x${string}`}
                    showCopy
                    showExplorer={false}
                    chars={8}
                  />
                </div>
                <div className="text-muted-foreground">
                  nonce used: {nonce.trim() || (onChainNonce?.toString() ?? '0')}
                  {!nonce.trim() && ' (on-chain, 서명 시 nonce가 달랐을 수 있음)'}
                </div>
              </div>
            </div>
          )}

          {verifyStatus === 'error' && verifyError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-950/30">
              <span className="text-red-700 dark:text-red-300">❌ 검증 오류: {verifyError}</span>
            </div>
          )}

          {/* permit TX 결과 */}
          <TransactionTracker
            status={
              permitStatus === 'submitting'
                ? 'submitting'
                : permitStatus === 'confirmed'
                  ? 'confirmed'
                  : permitStatus === 'error'
                    ? 'error'
                    : 'idle'
            }
            txHash={permitTxHash}
            chainId={chainId}
            error={permitError}
          />

          {/* On-chain 데이터 */}
          <TechDetail label="On-chain 데이터" defaultOpen>
            <div className="space-y-2 font-mono text-xs">
              {onChainNonce != null && (
                <div>
                  <span className="text-muted-foreground">Nonce (on-chain):</span>{' '}
                  {onChainNonce.toString()}
                </div>
              )}

              {onChainDomainSep && (
                <div>
                  <span className="text-muted-foreground">DOMAIN_SEPARATOR (on-chain):</span>{' '}
                  <span className="break-all">{onChainDomainSep}</span>
                </div>
              )}

              {computedDomainSep && (
                <div>
                  <span className="text-muted-foreground">DOMAIN_SEPARATOR (computed):</span>{' '}
                  <span className="break-all">{computedDomainSep}</span>
                  {domainSepMatch != null && (
                    <span className="ml-2">
                      {domainSepMatch ? '✅ 일치' : '❌ 불일치'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </TechDetail>
        </div>
      </WalletRequiredGuard>
    </SectionCard>
  );
}
