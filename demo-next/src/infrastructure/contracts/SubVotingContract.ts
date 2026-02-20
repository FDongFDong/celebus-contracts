import SubVotingABI from '@contracts/SubVoting.sol/SubVoting.json';
import { getContract } from 'viem';
import type { PublicClient, WalletClient, Address } from 'viem';

// ABI 추출 - Foundry JSON에서 abi 배열 가져오기
export const subVotingAbi = SubVotingABI.abi;

/**
 * SubVoting 컨트랙트 인스턴스 생성
 * @param address - 컨트랙트 주소
 * @param publicClient - viem PublicClient
 * @param walletClient - viem WalletClient (optional, read-only인 경우 생략 가능)
 * @returns SubVoting 컨트랙트 인스턴스
 */
export function getSubVotingContract(
  address: Address,
  publicClient: PublicClient,
  walletClient?: WalletClient
) {
  return getContract({
    address,
    abi: subVotingAbi,
    client: { public: publicClient, wallet: walletClient },
  });
}
