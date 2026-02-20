import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
} from 'viem';
import { getChainById } from '@/infrastructure/config/chains';

export const createStepWalletClient = (
  selectedChainId: number,
  connectedWalletAddress: Address | null
) => {
  if (!window.ethereum) {
    throw new Error('MetaMask가 설치되어 있지 않습니다');
  }

  if (!connectedWalletAddress) {
    throw new Error('먼저 헤더에서 지갑을 연결해주세요');
  }

  const chain = getChainById(selectedChainId);
  return createWalletClient({
    account: connectedWalletAddress,
    chain,
    transport: custom(window.ethereum),
  });
};

export const createStepPublicClient = (selectedChainId: number) => {
  const chain = getChainById(selectedChainId);
  return createPublicClient({
    chain,
    transport: http(),
  });
};

export const loadPublicBytecode = async (
  bytecodePath: string
): Promise<string> => {
  const response = await fetch(bytecodePath);
  return (await response.text()).trim();
};
