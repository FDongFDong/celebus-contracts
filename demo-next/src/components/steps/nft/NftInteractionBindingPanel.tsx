'use client';

import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InteractionContractBinding } from '@/components/shared';
import { formatAddress } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

export function NftInteractionBindingPanel() {
  const nftContractAddress = useAppStore((s) => s.nftContractAddress);
  const setNftContractAddress = useAppStore((s) => s.setNftContractAddress);
  const connectedWalletAddress = useAppStore((s) => s.connectedWalletAddress);
  const nftWalletType = useAppStore((s) => s.nftWalletType);
  const nftWalletAddress = useAppStore((s) => s.nftWalletAddress);
  const setNftWallet = useAppStore((s) => s.setNftWallet);

  useEffect(() => {
    if (!connectedWalletAddress) {
      if (nftWalletType === 'metamask' && nftWalletAddress) {
        setNftWallet({
          walletType: null,
          walletAddress: null,
          privateKey: null,
        });
      } else if (nftWalletType === 'detached') {
        setNftWallet({
          walletType: null,
          walletAddress: null,
          privateKey: null,
        });
      }
      return;
    }

    if (nftWalletType === null || nftWalletType === 'metamask') {
      if (
        nftWalletType === 'metamask' &&
        nftWalletAddress?.toLowerCase() === connectedWalletAddress.toLowerCase()
      ) {
        return;
      }

      setNftWallet({
        walletType: 'metamask',
        walletAddress: connectedWalletAddress,
        privateKey: null,
      });
    }
  }, [connectedWalletAddress, nftWalletAddress, nftWalletType, setNftWallet]);

  return (
    <div className="space-y-4">
      <InteractionContractBinding
        title="NFT 인터랙션 대상 컨트랙트"
        description="배포 단계에서 등록한 주소가 있으면 상단에 표시됩니다. 이미 배포된 NFT 컨트랙트 주소를 직접 등록할 수도 있습니다."
        address={nftContractAddress}
        onChangeAddress={setNftContractAddress}
      />

      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">인터랙션 지갑</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">현재 지갑:</span>
            {nftWalletAddress ? (
              <>
                <Badge variant="secondary">{nftWalletType ?? 'wallet'}</Badge>
                <code className="text-xs font-mono">{formatAddress(nftWalletAddress)}</code>
              </>
            ) : (
              <Badge variant="outline">미설정</Badge>
            )}
          </div>

          {connectedWalletAddress ? (
            <p className="text-xs text-muted-foreground">
              헤더 MetaMask 연결 주소가 자동으로 NFT 지갑에 동기화됩니다:{' '}
              <code className="font-mono">{formatAddress(connectedWalletAddress)}</code>
            </p>
          ) : (
            <p className="text-xs text-amber-600">헤더 지갑 미연결</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
