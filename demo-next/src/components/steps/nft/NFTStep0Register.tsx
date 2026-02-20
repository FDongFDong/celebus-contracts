/**
 * NFT Step 0: VIBENFT 컨트랙트 배포/등록 및 지갑 연결
 *
 * VIBENFT 컨트랙트 배포 또는 기존 주소 등록/조회
 * MetaMask 또는 비밀키를 통한 지갑 연결
 */

'use client';

import { useId } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { formatAddress } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TxHashDisplay } from '@/components/shared';
import { useNftStep0Register } from './step0/useNftStep0Register';
import { getStatusColor } from './step0/types';

export function NFTStep0Register() {
  const contractAddressInputId = useId();
  const privateKeyInputId = useId();
  const deployNameInputId = useId();
  const deploySymbolInputId = useId();
  const deployBaseUriInputId = useId();
  const deployOwnerInputId = useId();

  const {
    isMounted,
    connectedWalletAddress,
    nftWalletType,
    nftWalletAddress,
    nftContractAddress,
    nftName,
    nftSymbol,
    nftOwner,
    nftPaused,
    contractAddressInput,
    setContractAddressInput,
    privateKeyInput,
    setPrivateKeyInput,
    mnemonicWords,
    mnemonicWordCount,
    passphraseInput,
    setPassphraseInput,
    showPrivateKey,
    setShowPrivateKey,
    showMnemonic,
    setShowMnemonic,
    showPassphrase,
    setShowPassphrase,
    loadStatus,
    deployStatus,
    deployTxHash,
    isDeploying,
    deployName,
    setDeployName,
    deploySymbol,
    setDeploySymbol,
    deployBaseURI,
    setDeployBaseURI,
    deployOwner,
    isDeployOwnerAutoSync,
    handleDeployOwnerChange,
    handleSyncDeployOwnerToWallet,
    chainId,
    deployedAddress,
    walletStatus,
    showContractInfo,
    handleWordChange,
    handleMnemonicPaste,
    handleWordCountToggle,
    handleConnectPrivateKey,
    handleConnectMnemonic,
    handleDisconnectWallet,
    handleLoadContract,
    handleDeployContract,
    applyDeployedAddress,
    isMnemonicValid,
  } = useNftStep0Register();

  return (
    <StepCard stepNumber={0} title="컨트랙트 배포/등록 및 지갑 연결" badgeColor="outline">
      <p className="text-sm text-muted-foreground mb-4">
        VIBENFT 컨트랙트를 배포하거나 등록하고 지갑을 연결합니다.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">지갑 연결</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isMounted && nftWalletAddress ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-500">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    {nftWalletType === 'metamask'
                      ? 'MetaMask'
                      : nftWalletType === 'mnemonic'
                        ? '니모닉'
                        : '비밀키'}{' '}
                    연결됨
                  </p>
                  <p className="font-mono text-xs">{nftWalletAddress}</p>
                </div>
                <Badge variant="secondary">
                  {nftWalletType === 'metamask'
                    ? '🦊'
                    : nftWalletType === 'mnemonic'
                      ? '📝'
                      : '🔑'}
                </Badge>
              </div>
              <Button
                variant="outline"
                onClick={handleDisconnectWallet}
                className="w-full"
              >
                지갑 연결 해제
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="metamask" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="metamask">🦊 MetaMask</TabsTrigger>
                <TabsTrigger value="privatekey">🔑 비밀키</TabsTrigger>
                <TabsTrigger value="mnemonic">📝 니모닉</TabsTrigger>
              </TabsList>

              <TabsContent value="metamask" className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  헤더에서 MetaMask 지갑을 연결하면 NFT 지갑으로 자동 반영됩니다.
                </p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                  <span className="text-sm text-muted-foreground">현재 연결:</span>
                  {connectedWalletAddress ? (
                    <Badge variant="secondary" className="font-mono text-xs">
                      {formatAddress(connectedWalletAddress)}
                    </Badge>
                  ) : (
                    <span className="text-sm text-amber-600">미연결</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  별도 버튼 없이 자동 연결됩니다.
                </p>
              </TabsContent>

              <TabsContent value="privatekey" className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  비밀키를 입력하여 지갑을 연결합니다.
                  <br />
                  <span className="text-amber-600">
                    * 비밀키는 이 탭이 열린 현재 세션 메모리에만 저장됩니다.
                  </span>
                </p>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={privateKeyInputId}>Private Key (0x...)</Label>
                  <div className="relative">
                    <Input
                      id={privateKeyInputId}
                      type={showPrivateKey ? 'text' : 'password'}
                      value={privateKeyInput}
                      onChange={(e) => setPrivateKeyInput(e.target.value)}
                      placeholder="0x..."
                      className="font-mono text-sm pr-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                    >
                      {showPrivateKey ? '숨기기' : '보기'}
                    </Button>
                  </div>
                </div>
                <Button onClick={handleConnectPrivateKey} className="w-full">
                  비밀키로 연결
                </Button>
              </TabsContent>

              <TabsContent value="mnemonic" className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  니모닉(시드 구문)과 선택적 패스프레이즈를 입력하여 지갑을 연결합니다.
                  <br />
                  <span className="text-amber-600">
                    * 니모닉과 패스프레이즈는 현재 세션 메모리에만 저장됩니다.
                  </span>
                </p>

                <div className="flex items-center justify-between">
                  <Label>Secret Recovery Phrase</Label>
                  <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
                    <button
                      type="button"
                      onClick={() => handleWordCountToggle(12)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        mnemonicWordCount === 12
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      12 words
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWordCountToggle(24)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        mnemonicWordCount === 24
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      24 words
                    </button>
                  </div>
                </div>

                <div className="relative rounded-lg border bg-muted/30 p-3">
                  <div
                    className={`grid gap-2 ${
                      mnemonicWordCount === 24
                        ? 'grid-cols-3 sm:grid-cols-4'
                        : 'grid-cols-3'
                    }`}
                  >
                    {mnemonicWords.map((word, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground w-5 text-right shrink-0">
                          {index + 1}.
                        </span>
                        <input
                          type={showMnemonic ? 'text' : 'password'}
                          value={word}
                          onChange={(e) => handleWordChange(index, e.target.value)}
                          onPaste={(e) => {
                            const pasted = e.clipboardData.getData('text');
                            if (pasted.trim().split(/\s+/).length > 1) {
                              e.preventDefault();
                              handleMnemonicPaste(pasted, index);
                            }
                          }}
                          className="w-full h-8 px-2 text-xs font-mono rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-[10px] text-muted-foreground">
                      {mnemonicWords.filter((word) => word.trim() !== '').length} /{' '}
                      {mnemonicWordCount} 단어
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setShowMnemonic(!showMnemonic)}
                    >
                      {showMnemonic ? '숨기기' : '보기'}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Passphrase (선택사항)</Label>
                  <div className="relative">
                    <Input
                      type={showPassphrase ? 'text' : 'password'}
                      value={passphraseInput}
                      onChange={(e) => setPassphraseInput(e.target.value)}
                      placeholder="BIP-39 패스프레이즈 (선택)"
                      className="font-mono text-sm pr-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                    >
                      {showPassphrase ? '숨기기' : '보기'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    패스프레이즈를 입력하면 같은 니모닉이라도 다른 주소가 생성됩니다.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Derivation Path:{' '}
                  <code className="bg-muted px-1 rounded">m/44&apos;/60&apos;/0&apos;/0/0</code>{' '}
                  (기본값)
                </p>
                <Button
                  onClick={handleConnectMnemonic}
                  className="w-full"
                  disabled={!isMnemonicValid}
                >
                  니모닉으로 연결
                </Button>
              </TabsContent>
            </Tabs>
          )}

          {walletStatus && (
            <Alert className={getStatusColor(walletStatus.type)}>
              <AlertDescription>{walletStatus.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">새 컨트랙트 배포</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            ERC20과 동일하게 생성자 인자를 직접 입력하고, 현재 NFT 지갑으로 배포 트랜잭션에 서명합니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={deployNameInputId}>Token Name</Label>
              <Input
                id={deployNameInputId}
                value={deployName}
                onChange={(e) => setDeployName(e.target.value)}
                placeholder="VIBENFT"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={deploySymbolInputId}>Token Symbol</Label>
              <Input
                id={deploySymbolInputId}
                value={deploySymbol}
                onChange={(e) => setDeploySymbol(e.target.value)}
                placeholder="VIBE"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={deployBaseUriInputId}>Base URI (선택)</Label>
            <Input
              id={deployBaseUriInputId}
              value={deployBaseURI}
              onChange={(e) => setDeployBaseURI(e.target.value)}
              placeholder="ipfs://.../ 또는 https://.../"
              className="font-mono text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={deployOwnerInputId}>Initial Owner</Label>
            <Input
              id={deployOwnerInputId}
              value={deployOwner}
              onChange={(e) => handleDeployOwnerChange(e.target.value)}
              placeholder="0x..."
              className="font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Owner 자동 동기화</span>
              <Badge variant={isDeployOwnerAutoSync ? 'secondary' : 'outline'}>
                {isDeployOwnerAutoSync ? 'ON' : 'OFF'}
              </Badge>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSyncDeployOwnerToWallet}
              disabled={!nftWalletAddress}
            >
              현재 NFT 지갑 주소로 동기화
            </Button>
          </div>
          <Button
            onClick={handleDeployContract}
            disabled={isDeploying || !nftWalletAddress}
            className="w-full"
          >
            {isDeploying ? '배포 중...' : 'VIBENFT 배포'}
          </Button>

          {deployStatus && (
            <Alert className={getStatusColor(deployStatus.type)}>
              <AlertDescription className="whitespace-pre-line">
                {deployStatus.message}
              </AlertDescription>
            </Alert>
          )}

          {deployTxHash && (
            <div className="pt-1">
              <TxHashDisplay txHash={deployTxHash} chainId={chainId} />
            </div>
          )}

          {deployedAddress && (
            <Card className="border-green-500 bg-green-50/70 dark:bg-green-900/20">
              <CardContent className="pt-4 space-y-2">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  배포된 컨트랙트 주소
                </p>
                <p className="text-xs font-mono break-all">{deployedAddress}</p>
                <Button variant="outline" size="sm" className="w-full" onClick={applyDeployedAddress}>
                  이 주소 사용하기
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">컨트랙트 주소 입력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={contractAddressInputId}>Contract Address (0x...)</Label>
            <Input
              id={contractAddressInputId}
              type="text"
              value={contractAddressInput}
              onChange={(e) => setContractAddressInput(e.target.value)}
              placeholder="0x..."
              className="font-mono text-sm"
            />
          </div>
          <Button onClick={handleLoadContract} className="w-full">
            컨트랙트 정보 조회
          </Button>

          {loadStatus && (
            <Alert className={getStatusColor(loadStatus.type)}>
              <AlertDescription className="whitespace-pre-line">
                {loadStatus.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {showContractInfo && nftName && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="text-base text-green-700 dark:text-green-400">
              컨트랙트 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-xs font-mono">{nftName}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Symbol</p>
                <p className="text-xs font-mono">{nftSymbol}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Owner</p>
                <p className="text-xs font-mono">{formatAddress(nftOwner)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Paused</p>
                <Badge variant={nftPaused ? 'destructive' : 'secondary'}>
                  {nftPaused ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Contract Address</p>
              <p className="text-xs font-mono break-all">{nftContractAddress}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </StepCard>
  );
}
