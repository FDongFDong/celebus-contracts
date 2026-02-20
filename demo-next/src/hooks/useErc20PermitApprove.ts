'use client';

/**
 * EIP-2612 Permit 승인 훅
 *
 * MetaMask signTypedData → v/r/s 분리 → permit() TX 제출 → allowance 확인
 */

import { useState, useCallback } from 'react';
import { hexToSignature } from 'viem';
import type { Address, Hash } from '@/domain/types';
import { useChainClient } from '@/hooks/useChainClient';
import { useInjectedWallet } from '@/hooks/useInjectedWallet';
import { useErc20Store } from '@/store/useErc20Store';
import {
  ERC20_PERMIT_ABI,
  ERC20_PERMIT_TYPES,
  createErc20PermitDomain,
} from '@/infrastructure/contracts/CelebTokenContract';
import {
  logError,
  getBlockchainErrorMessage,
  isUserRejectionError,
} from '@/lib/error-handler';

interface ApproveParams {
  tokenAddress: Address;
  spenderAddress: Address;
  amount: bigint;
  deadline: bigint;
  ownerAddress: Address;
}

export function useErc20PermitApprove() {
  const { publicClient, chainId } = useChainClient();
  const { getWalletClient, ensureChain } = useInjectedWallet();
  const store = useErc20Store();

  const [isLoading, setIsLoading] = useState(false);

  const approve = useCallback(
    async (params: ApproveParams) => {
      const { tokenAddress, spenderAddress, amount, deadline, ownerAddress } =
        params;

      setIsLoading(true);
      store.setApproveStatus('signing');
      store.setApproveError(null);
      store.setApproveTxHash(null);

      try {
        await ensureChain();

        // 1. Nonce 조회
        const nonce = (await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_PERMIT_ABI,
          functionName: 'nonces',
          args: [ownerAddress],
        })) as bigint;
        store.setNonce(nonce);

        // 2. Domain 구성 (토큰 name을 온체인에서 조회)
        const tokenName = (await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_PERMIT_ABI,
          functionName: 'name',
        })) as string;
        const domain = createErc20PermitDomain(tokenAddress, chainId, tokenName);

        // 3. DOMAIN_SEPARATOR 조회 (개발자 모드용)
        const domainSeparator = (await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_PERMIT_ABI,
          functionName: 'DOMAIN_SEPARATOR',
        })) as Hash;
        store.setDomainSeparator(domainSeparator);

        // 4. MetaMask signTypedData
        const walletClient = getWalletClient();
        const signature = await walletClient.signTypedData({
          account: ownerAddress,
          domain,
          types: ERC20_PERMIT_TYPES,
          primaryType: 'Permit',
          message: {
            owner: ownerAddress,
            spender: spenderAddress,
            value: amount,
            nonce,
            deadline,
          },
        });

        // 5. v/r/s 분리
        const { v, r, s } = hexToSignature(signature);
        store.setSignature({
          full: signature,
          v: Number(v),
          r,
          s,
        });

        // 6. permit() TX 제출
        store.setApproveStatus('submitting');
        const hash = await walletClient.writeContract({
          account: ownerAddress,
          address: tokenAddress,
          abi: ERC20_PERMIT_ABI,
          functionName: 'permit',
          args: [
            ownerAddress,
            spenderAddress,
            amount,
            deadline,
            Number(v),
            r,
            s,
          ],
          chain: undefined,
        });
        store.setApproveTxHash(hash);

        // 7. TX 확인 대기
        await publicClient.waitForTransactionReceipt({ hash });

        // 8. 새 allowance 조회
        const newAllowance = (await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_PERMIT_ABI,
          functionName: 'allowance',
          args: [ownerAddress, spenderAddress],
        })) as bigint;
        store.setCurrentAllowance(newAllowance);

        store.setApproveStatus('confirmed');
      } catch (err) {
        logError('useErc20PermitApprove', err);

        if (isUserRejectionError(err)) {
          store.setApproveError('사용자가 서명을 거부했습니다');
        } else {
          store.setApproveError(getBlockchainErrorMessage(err));
        }
        store.setApproveStatus('error');
      } finally {
        setIsLoading(false);
      }
    },
    [publicClient, chainId, getWalletClient, ensureChain, store]
  );

  return { approve, isLoading };
}
