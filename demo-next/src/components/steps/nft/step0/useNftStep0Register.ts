'use client';

import {
  startTransition,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { isAddress, type Address } from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { vibeNftAbi } from '@/infrastructure/contracts';
import {
  getBlockchainErrorMessage,
  isUserRejectionError,
  logError,
} from '@/lib/error-handler';
import { ensureCorrectChain, getInjectedWalletClient } from '@/lib/injected-wallet';
import { useSelectedChain } from '@/hooks/useSelectedChain';
import { useAppStore } from '@/store/useAppStore';
import {
  isValidPrivateKey,
  isValidMnemonic,
  saveEncryptedKey,
  loadEncryptedKey,
  removeEncryptedKey,
} from '@/lib/crypto-wallet';
import {
  applyMnemonicPaste,
  joinMnemonicWords,
  resizeMnemonicWords,
} from './mnemonic-words';
import { createStepWalletClient } from '@/components/steps/shared/step0-clients';
import type { MnemonicWordCount, StatusMessage } from './types';

const NFT_PRIVATE_KEY_KEY = 'nft_wallet';
const NFT_MNEMONIC_KEY = 'nft_wallet_mnemonic';
const NFT_PASSPHRASE_KEY = 'nft_wallet_passphrase';
const NFT_BYTECODE_FILE = '/VIBENFT-bytecode.txt';

export function useNftStep0Register() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { chainId: selectedChainId, publicClient } = useSelectedChain();

  const connectedWalletAddress = useAppStore((s) => s.connectedWalletAddress);
  const nftWalletType = useAppStore((s) => s.nftWalletType);
  const nftWalletAddress = useAppStore((s) => s.nftWalletAddress);
  const setNftWallet = useAppStore((s) => s.setNftWallet);
  const clearNftWallet = useAppStore((s) => s.clearNftWallet);
  const {
    nftContractAddress,
    nftName,
    nftSymbol,
    nftOwner,
    nftPaused,
    setNftContractAddress,
    setNftInfo,
  } = useAppStore(
    useShallow((s) => ({
      nftContractAddress: s.nftContractAddress,
      nftName: s.nftName,
      nftSymbol: s.nftSymbol,
      nftOwner: s.nftOwner,
      nftPaused: s.nftPaused,
      setNftContractAddress: s.setNftContractAddress,
      setNftInfo: s.setNftInfo,
    }))
  );

  const [contractAddressInput, setContractAddressInput] = useState('');
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [mnemonicInput, setMnemonicInput] = useState('');
  const [mnemonicWords, setMnemonicWords] = useState<string[]>(Array(12).fill(''));
  const [mnemonicWordCount, setMnemonicWordCount] = useState<MnemonicWordCount>(12);
  const [passphraseInput, setPassphraseInput] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);

  const [loadStatus, setLoadStatus] = useState<StatusMessage | null>(null);
  const [deployStatus, setDeployStatus] = useState<StatusMessage | null>(null);
  const [deployTxHash, setDeployTxHash] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployName, setDeployName] = useState('VIBENFT');
  const [deploySymbol, setDeploySymbol] = useState('VIBE');
  const [deployBaseURI, setDeployBaseURI] = useState('');
  const [deployOwner, setDeployOwner] = useState('');
  const [bytecode, setBytecode] = useState('');
  const [deployedAddress, setDeployedAddress] = useState<Address | null>(null);
  const [walletStatus, setWalletStatus] = useState<StatusMessage | null>(null);
  const [showContractInfo, setShowContractInfo] = useState(false);

  const syncMnemonicFromWords = (words: string[]) => {
    setMnemonicInput(joinMnemonicWords(words));
  };

  const handleMnemonicPaste = (pastedText: string, startIndex: number = 0) => {
    const { words: newWords, wordCount } = applyMnemonicPaste({
      currentWords: mnemonicWords,
      currentWordCount: mnemonicWordCount,
      pastedText,
      startIndex,
    });

    if (wordCount !== mnemonicWordCount) {
      setMnemonicWordCount(wordCount);
    }
    setMnemonicWords(newWords);
    syncMnemonicFromWords(newWords);
  };

  const handleWordChange = (index: number, value: string) => {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (normalized.includes(' ')) {
      handleMnemonicPaste(normalized, index);
      return;
    }

    const newWords = [...mnemonicWords];
    newWords[index] = value.toLowerCase();
    setMnemonicWords(newWords);
    syncMnemonicFromWords(newWords);
  };

  const handleWordCountToggle = (count: MnemonicWordCount) => {
    setMnemonicWordCount(count);
    const nextWords = resizeMnemonicWords(mnemonicWords, count);

    setMnemonicWords(nextWords);
    syncMnemonicFromWords(nextWords);
  };

  useEffect(() => {
    fetch(NFT_BYTECODE_FILE)
      .then((res) => res.text())
      .then((text) => setBytecode(text.trim()))
      .catch((error) => logError('useNftStep0Register.loadBytecode', error));
  }, []);

  useEffect(() => {
    if (nftWalletAddress) return;

    const savedKey = loadEncryptedKey(NFT_PRIVATE_KEY_KEY);
    if (savedKey && isValidPrivateKey(savedKey)) {
      try {
        const account = privateKeyToAccount(savedKey as `0x${string}`);
        startTransition(() => {
          setNftWallet({
            walletType: 'privatekey',
            walletAddress: account.address,
            privateKey: null,
          });
          setWalletStatus({
            type: 'success',
            message: '현재 세션 지갑이 복원되었습니다.',
          });
        });
        return;
      } catch {
        removeEncryptedKey(NFT_PRIVATE_KEY_KEY);
      }
    }

    const savedMnemonic = loadEncryptedKey(NFT_MNEMONIC_KEY);
    const savedPassphrase = loadEncryptedKey(NFT_PASSPHRASE_KEY);
    if (savedMnemonic && isValidMnemonic(savedMnemonic)) {
      try {
        const account = mnemonicToAccount(savedMnemonic, {
          passphrase: savedPassphrase ?? undefined,
        });

        startTransition(() => {
          setNftWallet({
            walletType: 'mnemonic',
            walletAddress: account.address,
            privateKey: null,
          });
          setWalletStatus({
            type: 'success',
            message: '현재 세션 니모닉 지갑이 복원되었습니다.',
          });
        });
      } catch {
        removeEncryptedKey(NFT_MNEMONIC_KEY);
        removeEncryptedKey(NFT_PASSPHRASE_KEY);
      }
    }
  }, [nftWalletAddress, setNftWallet]);

  useEffect(() => {
    if (!connectedWalletAddress) {
      if (nftWalletType === 'metamask' && nftWalletAddress) {
        clearNftWallet();
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
  }, [
    clearNftWallet,
    connectedWalletAddress,
    nftWalletAddress,
    nftWalletType,
    setNftWallet,
  ]);

  useEffect(() => {
    if (!deployOwner && connectedWalletAddress) {
      setDeployOwner(connectedWalletAddress);
    }
  }, [connectedWalletAddress, deployOwner]);

  const handleConnectPrivateKey = () => {
    const privateKey = privateKeyInput.trim();
    if (!privateKey) {
      setWalletStatus({ type: 'error', message: '비밀키를 입력해주세요' });
      return;
    }

    if (!isValidPrivateKey(privateKey)) {
      setWalletStatus({
        type: 'error',
        message: '유효하지 않은 비밀키 형식입니다. 0x로 시작하는 64자리 hex여야 합니다.',
      });
      return;
    }

    try {
      const account = privateKeyToAccount(privateKey as `0x${string}`);

      saveEncryptedKey(NFT_PRIVATE_KEY_KEY, privateKey);
      setNftWallet({
        walletType: 'privatekey',
        walletAddress: account.address,
        privateKey: null,
      });

      setPrivateKeyInput('');
      setWalletStatus({
        type: 'success',
        message: '비밀키 지갑이 연결되었습니다. (현재 세션 저장됨)',
      });
      toast.success('비밀키 지갑 연결됨');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setWalletStatus({ type: 'error', message: `오류: ${message}` });
    }
  };

  const handleConnectMnemonic = () => {
    const mnemonic = mnemonicInput.trim();
    const passphrase = passphraseInput.trim();

    if (!mnemonic) {
      setWalletStatus({ type: 'error', message: '니모닉을 입력해주세요' });
      return;
    }

    if (!isValidMnemonic(mnemonic)) {
      setWalletStatus({
        type: 'error',
        message: '유효하지 않은 니모닉입니다. 12개 또는 24개 단어여야 합니다.',
      });
      return;
    }

    try {
      const account = mnemonicToAccount(mnemonic, {
        passphrase: passphrase || undefined,
      });

      setNftWallet({
        walletType: 'mnemonic',
        walletAddress: account.address,
        privateKey: null,
      });

      saveEncryptedKey(NFT_MNEMONIC_KEY, mnemonic);
      if (passphrase) {
        saveEncryptedKey(NFT_PASSPHRASE_KEY, passphrase);
      } else {
        removeEncryptedKey(NFT_PASSPHRASE_KEY);
      }

      setMnemonicInput('');
      setMnemonicWords(resizeMnemonicWords([], mnemonicWordCount));
      setPassphraseInput('');
      setWalletStatus({
        type: 'success',
        message: passphrase
          ? '니모닉 + 패스프레이즈 지갑이 연결되었습니다. (현재 세션 저장됨)'
          : '니모닉 지갑이 연결되었습니다. (현재 세션 저장됨)',
      });
      toast.success('니모닉 지갑 연결됨');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setWalletStatus({ type: 'error', message: `오류: ${message}` });
    }
  };

  const handleDisconnectWallet = () => {
    if (nftWalletType === 'metamask') {
      setNftWallet({
        walletType: 'detached',
        walletAddress: null,
        privateKey: null,
      });
    } else {
      clearNftWallet();
    }
    removeEncryptedKey(NFT_PRIVATE_KEY_KEY);
    removeEncryptedKey(NFT_MNEMONIC_KEY);
    removeEncryptedKey(NFT_PASSPHRASE_KEY);
    setWalletStatus(null);
    toast.info('지갑 연결 해제됨');
  };

  const loadContractInfo = useCallback(
    async (targetAddress: Address) => {
      const [name, symbol, owner, paused] = await Promise.all([
        publicClient.readContract({
          address: targetAddress,
          abi: vibeNftAbi,
          functionName: 'name',
        }),
        publicClient.readContract({
          address: targetAddress,
          abi: vibeNftAbi,
          functionName: 'symbol',
        }),
        publicClient.readContract({
          address: targetAddress,
          abi: vibeNftAbi,
          functionName: 'owner',
        }),
        publicClient.readContract({
          address: targetAddress,
          abi: vibeNftAbi,
          functionName: 'paused',
        }),
      ]);

      setNftContractAddress(targetAddress);
      setNftInfo({
        name: name as string,
        symbol: symbol as string,
        owner: owner as Address,
        paused: paused as boolean,
      });
      setShowContractInfo(true);
    },
    [publicClient, setNftContractAddress, setNftInfo]
  );

  const handleLoadContract = async () => {
    const address = contractAddressInput.trim();
    if (!address) {
      setLoadStatus({ type: 'error', message: '컨트랙트 주소를 입력해주세요' });
      return;
    }

    if (!isAddress(address)) {
      setLoadStatus({ type: 'error', message: '유효한 컨트랙트 주소를 입력해주세요' });
      return;
    }

    setLoadStatus({ type: 'info', message: '컨트랙트 정보 조회 중...' });

    try {
      await loadContractInfo(address as Address);
      setLoadStatus({ type: 'success', message: '컨트랙트 정보 조회 완료!' });
      toast.success('VIBENFT 컨트랙트 로드 완료!');
    } catch (error) {
      logError('useNftStep0Register.handleLoadContract', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLoadStatus({ type: 'error', message: `오류: ${message}` });
      toast.error('컨트랙트 정보 조회 실패');
    }
  };

  const handleDeployContract = async () => {
    if (!connectedWalletAddress) {
      const message = '먼저 헤더에서 지갑을 연결해주세요';
      setDeployStatus({ type: 'error', message });
      toast.error(message);
      return;
    }

    const tokenName = deployName.trim();
    const tokenSymbol = deploySymbol.trim();
    const tokenBaseURI = deployBaseURI.trim();
    const ownerAddress = deployOwner.trim();

    if (!tokenName) {
      const message = 'Token Name을 입력해주세요';
      setDeployStatus({ type: 'error', message });
      toast.error(message);
      return;
    }

    if (!tokenSymbol) {
      const message = 'Token Symbol을 입력해주세요';
      setDeployStatus({ type: 'error', message });
      toast.error(message);
      return;
    }

    if (!ownerAddress || !isAddress(ownerAddress)) {
      const message = '유효한 Initial Owner 주소를 입력해주세요';
      setDeployStatus({ type: 'error', message });
      toast.error(message);
      return;
    }

    if (!bytecode) {
      setDeployStatus({
        type: 'error',
        message: 'NFT bytecode가 로드되지 않았습니다. 페이지를 새로고침 해주세요.',
      });
      return;
    }

    setIsDeploying(true);
    setDeployTxHash(null);
    setDeployStatus({ type: 'info', message: '네트워크 확인 중...' });

    try {
      const tempWalletClient = getInjectedWalletClient(selectedChainId);
      await ensureCorrectChain(tempWalletClient, selectedChainId);

      const walletClient = createStepWalletClient(
        selectedChainId,
        connectedWalletAddress
      );

      const hash = await walletClient.deployContract({
        abi: vibeNftAbi,
        bytecode: bytecode as `0x${string}`,
        args: [tokenName, tokenSymbol, tokenBaseURI, ownerAddress as Address],
      });

      setDeployTxHash(hash);
      setDeployStatus({
        type: 'info',
        message: `트랜잭션 전송됨. 대기 중...\nTX: ${hash}`,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = receipt.contractAddress;

      if (!address) {
        throw new Error('배포 영수증에서 컨트랙트 주소를 찾을 수 없습니다');
      }

      setDeployedAddress(address);
      setContractAddressInput(address);
      await loadContractInfo(address);

      setDeployStatus({
        type: 'success',
        message: `VIBENFT 배포 완료!\n주소: ${address}`,
      });
      toast.success('VIBENFT 컨트랙트 배포 완료!');
    } catch (error) {
      if (isUserRejectionError(error)) {
        setDeployStatus({ type: 'info', message: '사용자가 트랜잭션을 취소했습니다' });
        toast.info('배포가 취소되었습니다');
        return;
      }

      logError('useNftStep0Register.handleDeployContract', error);

      const message = getBlockchainErrorMessage(error);
      setDeployStatus({ type: 'error', message });
      toast.error(message);
    } finally {
      setIsDeploying(false);
    }
  };

  const applyDeployedAddress = async () => {
    if (!deployedAddress) return;

    setContractAddressInput(deployedAddress);
    setLoadStatus({ type: 'info', message: '컨트랙트 정보 조회 중...' });

    try {
      await loadContractInfo(deployedAddress);
      setLoadStatus({ type: 'success', message: '컨트랙트 정보 조회 완료!' });
      toast.success('배포된 컨트랙트 주소가 적용되었습니다.');
    } catch (error) {
      logError('useNftStep0Register.applyDeployedAddress', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLoadStatus({ type: 'error', message: `오류: ${message}` });
    }
  };

  return {
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
    mnemonicInput,
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
    setDeployOwner,
    deployedAddress,
    walletStatus,
    showContractInfo,
    chainId: selectedChainId,
    handleWordChange,
    handleMnemonicPaste,
    handleWordCountToggle,
    handleConnectPrivateKey,
    handleConnectMnemonic,
    handleDisconnectWallet,
    handleLoadContract,
    handleDeployContract,
    applyDeployedAddress,
    isMnemonicValid: isValidMnemonic(mnemonicInput),
  };
}
