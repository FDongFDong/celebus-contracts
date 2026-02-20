import { createWalletClient, custom, http, type Address } from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { getChainById } from '@/infrastructure/config/chains';
import {
  loadEncryptedKey,
  isValidMnemonic,
  isValidPrivateKey,
} from '@/lib/crypto-wallet';
import { useAppStore } from '@/store/useAppStore';

const NFT_PRIVATE_KEY_KEY = 'nft_wallet';
const NFT_MNEMONIC_KEY = 'nft_wallet_mnemonic';
const NFT_PASSPHRASE_KEY = 'nft_wallet_passphrase';

export function getNftWalletClient() {
  const { nftWalletType, nftWalletAddress, nftWalletPrivateKey, selectedChainId } =
    useAppStore.getState();

  if (!nftWalletAddress) return null;

  const chain = getChainById(selectedChainId);

  if (nftWalletType === 'metamask') {
    if (typeof window === 'undefined' || !window.ethereum) return null;
    return createWalletClient({
      account: nftWalletAddress,
      chain,
      transport: custom(window.ethereum),
    });
  }

  const sessionPrivateKey = loadEncryptedKey(NFT_PRIVATE_KEY_KEY);
  const privateKey =
    sessionPrivateKey && isValidPrivateKey(sessionPrivateKey)
      ? (sessionPrivateKey as `0x${string}`)
      : nftWalletPrivateKey;

  if (nftWalletType === 'privatekey' && privateKey) {
    const account = privateKeyToAccount(privateKey);
    return createWalletClient({
      account,
      chain,
      transport: http(),
    });
  }

  if (nftWalletType === 'mnemonic') {
    const savedMnemonic = loadEncryptedKey(NFT_MNEMONIC_KEY);
    const savedPassphrase = loadEncryptedKey(NFT_PASSPHRASE_KEY);
    if (savedMnemonic && isValidMnemonic(savedMnemonic)) {
      const account = mnemonicToAccount(savedMnemonic, {
        passphrase: savedPassphrase ?? undefined,
      });
      return createWalletClient({
        account,
        chain,
        transport: http(),
      });
    }
  }

  return null;
}

export function getNftWalletAddress(): Address | null {
  const { nftWalletAddress } = useAppStore.getState();
  return nftWalletAddress;
}
