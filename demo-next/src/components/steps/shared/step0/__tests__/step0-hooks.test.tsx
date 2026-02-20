// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { loadPublicBytecode } from '@/components/steps/shared/step0-clients';
import {
  getBlockchainErrorMessage,
  isUserRejectionError,
} from '@/lib/error-handler';
import { useStep0ArtistRegistration } from '@/components/steps/shared/step0/useStep0ArtistRegistration';
import { useStep0Deploy } from '@/components/steps/shared/step0/useStep0Deploy';
import { useStep0DualTypeNames } from '@/components/steps/shared/step0/useStep0DualTypeNames';
import { useStep0Executor } from '@/components/steps/shared/step0/useStep0Executor';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/components/steps/shared/step0-clients', () => ({
  loadPublicBytecode: vi.fn(),
}));

vi.mock('@/lib/error-handler', () => ({
  getBlockchainErrorMessage: vi.fn((error: unknown) =>
    error instanceof Error ? error.message : 'unknown error'
  ),
  isUserRejectionError: vi.fn(() => false),
  logError: vi.fn(),
}));

const OWNER_ADDRESS = '0x1111111111111111111111111111111111111111' as const;
const CONTRACT_ADDRESS = '0x2222222222222222222222222222222222222222' as const;
const EXECUTOR_ADDRESS = '0x3333333333333333333333333333333333333333' as const;
const TX_HASH_0 =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;
const TX_HASH_1 =
  '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as const;

function createWalletClient() {
  return {
    writeContract: vi.fn(),
    deployContract: vi.fn(),
  };
}

function createPublicClient() {
  return {
    waitForTransactionReceipt: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(loadPublicBytecode).mockResolvedValue('0x6000');
  vi.mocked(isUserRejectionError).mockReturnValue(false);
  vi.mocked(getBlockchainErrorMessage).mockImplementation((error: unknown) =>
    error instanceof Error ? error.message : 'unknown error'
  );
});

describe('shared Step0 hooks', () => {
  it('useStep0Deploy validates missing wallet and shows toast', async () => {
    const setContractAddress = vi.fn();
    const { result } = renderHook(() =>
      useStep0Deploy({
        bytecodePath: '/MainVoting-bytecode.txt',
        connectedWalletAddress: null,
        deployContract: vi.fn(),
        deployingStatusMessage: '배포 중',
        ensureNetwork: vi.fn(),
        failedToastMessage: '배포 실패',
        getPublicClient: vi.fn() as never,
        getWalletClient: vi.fn() as never,
        logContext: 'test.deploy',
        setContractAddress,
        showValidationToasts: true,
        successToastMessage: '배포 완료',
      })
    );

    await act(async () => {
      await result.current.handleDeployContract();
    });

    expect(result.current.deployStatus).toEqual({
      type: 'error',
      message: '먼저 헤더에서 지갑을 연결해주세요',
    });
    expect(setContractAddress).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('먼저 헤더에서 지갑을 연결해주세요');
  });

  it('useStep0Deploy deploys successfully and updates state', async () => {
    const walletClient = createWalletClient();
    const publicClient = createPublicClient();
    const setContractAddress = vi.fn();
    const deployContract = vi.fn(async () => TX_HASH_0);
    publicClient.waitForTransactionReceipt.mockResolvedValue({
      contractAddress: CONTRACT_ADDRESS,
    });

    const { result } = renderHook(() =>
      useStep0Deploy({
        bytecodePath: '/MainVoting-bytecode.txt',
        connectedWalletAddress: OWNER_ADDRESS,
        deployContract,
        deployingStatusMessage: '배포 중',
        ensureNetwork: vi.fn(async () => undefined),
        failedToastMessage: '배포 실패',
        getPublicClient: () => publicClient as never,
        getWalletClient: () => walletClient as never,
        logContext: 'test.deploy',
        setContractAddress,
        successToastMessage: '배포 완료',
      })
    );

    await waitFor(() => {
      expect(loadPublicBytecode).toHaveBeenCalledWith('/MainVoting-bytecode.txt');
    });
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.handleDeployContract();
    });

    expect(deployContract).toHaveBeenCalledWith(walletClient, OWNER_ADDRESS, '0x6000');
    expect(publicClient.waitForTransactionReceipt).toHaveBeenCalledWith({ hash: TX_HASH_0 });
    expect(setContractAddress).toHaveBeenCalledWith(CONTRACT_ADDRESS);
    expect(result.current.deployTxHash).toBe(TX_HASH_0);
    expect(result.current.deployedAddress).toBe(CONTRACT_ADDRESS);
    expect(result.current.deployStatus).toEqual({
      type: 'success',
      message: `배포 완료!\n주소: ${CONTRACT_ADDRESS}`,
    });
    expect(toast.success).toHaveBeenCalledWith('배포 완료');
  });

  it('useStep0Deploy handles user rejection as info', async () => {
    const rejectError = new Error('User rejected');
    vi.mocked(isUserRejectionError).mockReturnValue(true);
    vi.mocked(getBlockchainErrorMessage).mockReturnValue('사용자 거절');

    const { result } = renderHook(() =>
      useStep0Deploy({
        bytecodePath: '/MainVoting-bytecode.txt',
        connectedWalletAddress: OWNER_ADDRESS,
        deployContract: vi.fn(async () => {
          throw rejectError;
        }),
        deployingStatusMessage: '배포 중',
        ensureNetwork: vi.fn(async () => undefined),
        failedToastMessage: '배포 실패',
        getPublicClient: () => createPublicClient() as never,
        getWalletClient: () => createWalletClient() as never,
        logContext: 'test.deploy',
        setContractAddress: vi.fn(),
        successToastMessage: '배포 완료',
      })
    );
    await waitFor(() => {
      expect(loadPublicBytecode).toHaveBeenCalledWith('/MainVoting-bytecode.txt');
    });
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.handleDeployContract();
    });

    expect(result.current.deployStatus).toEqual({
      type: 'info',
      message: '사용자 거절',
    });
    expect(toast.info).toHaveBeenCalledWith('배포가 취소되었습니다');
  });

  it('useStep0Executor validates blank executor and shows toast', async () => {
    const { result } = renderHook(() =>
      useStep0Executor({
        connectedWalletAddress: OWNER_ADDRESS,
        contractAddress: CONTRACT_ADDRESS,
        ensureNetwork: vi.fn(async () => undefined),
        failedToastMessage: '실패',
        getPublicClient: vi.fn() as never,
        getWalletClient: vi.fn() as never,
        logContext: 'test.executor',
        setContractExecutorAddress: vi.fn(),
        showValidationToasts: true,
        successToastMessage: '성공',
        writeExecutor: vi.fn(),
      })
    );

    act(() => {
      result.current.setExecutorAddress('   ');
    });

    await act(async () => {
      await result.current.handleSetExecutor();
    });

    expect(result.current.executorStatus).toEqual({
      type: 'error',
      message: 'Executor 주소를 입력해주세요',
    });
    expect(toast.error).toHaveBeenCalledWith('Executor 주소를 입력해주세요');
  });

  it('useStep0Executor validates invalid address format', async () => {
    const { result } = renderHook(() =>
      useStep0Executor({
        connectedWalletAddress: OWNER_ADDRESS,
        contractAddress: CONTRACT_ADDRESS,
        ensureNetwork: vi.fn(async () => undefined),
        failedToastMessage: '실패',
        getPublicClient: vi.fn() as never,
        getWalletClient: vi.fn() as never,
        logContext: 'test.executor',
        setContractExecutorAddress: vi.fn(),
        showValidationToasts: true,
        successToastMessage: '성공',
        writeExecutor: vi.fn(),
      })
    );

    act(() => {
      result.current.setExecutorAddress('0x123');
    });

    await act(async () => {
      await result.current.handleSetExecutor();
    });

    expect(result.current.executorStatus).toEqual({
      type: 'error',
      message: '유효한 Executor 주소를 입력해주세요',
    });
    expect(toast.error).toHaveBeenCalledWith('유효한 Executor 주소를 입력해주세요');
  });

  it('useStep0Executor sets executor successfully', async () => {
    const walletClient = createWalletClient();
    const publicClient = createPublicClient();
    const setContractExecutorAddress = vi.fn();

    walletClient.writeContract.mockResolvedValue(TX_HASH_0);
    publicClient.waitForTransactionReceipt.mockResolvedValue({
      transactionHash: TX_HASH_0,
    });

    const { result } = renderHook(() =>
      useStep0Executor({
        connectedWalletAddress: OWNER_ADDRESS,
        contractAddress: CONTRACT_ADDRESS,
        ensureNetwork: vi.fn(async () => undefined),
        failedToastMessage: '실패',
        getPublicClient: () => publicClient as never,
        getWalletClient: () => walletClient as never,
        logContext: 'test.executor',
        setContractExecutorAddress,
        successToastMessage: 'Executor 성공',
        writeExecutor: async () => TX_HASH_0,
      })
    );

    act(() => {
      result.current.setExecutorAddress(EXECUTOR_ADDRESS);
    });

    await act(async () => {
      await result.current.handleSetExecutor();
    });

    expect(setContractExecutorAddress).toHaveBeenCalledWith(EXECUTOR_ADDRESS);
    expect(result.current.executorTxHash).toBe(TX_HASH_0);
    expect(result.current.executorStatus).toEqual({
      type: 'success',
      message: 'Executor 설정 완료!',
    });
    expect(toast.success).toHaveBeenCalledWith('Executor 성공');
  });

  it('useStep0Executor handles user rejection as info', async () => {
    const rejectError = new Error('User rejected');
    vi.mocked(isUserRejectionError).mockReturnValue(true);
    vi.mocked(getBlockchainErrorMessage).mockReturnValue('사용자 거절');

    const { result } = renderHook(() =>
      useStep0Executor({
        connectedWalletAddress: OWNER_ADDRESS,
        contractAddress: CONTRACT_ADDRESS,
        ensureNetwork: vi.fn(async () => undefined),
        failedToastMessage: '실패',
        getPublicClient: () => createPublicClient() as never,
        getWalletClient: () => createWalletClient() as never,
        logContext: 'test.executor',
        setContractExecutorAddress: vi.fn(),
        successToastMessage: 'Executor 성공',
        writeExecutor: async () => {
          throw rejectError;
        },
      })
    );

    await act(async () => {
      await result.current.handleSetExecutor();
    });

    expect(result.current.executorStatus).toEqual({
      type: 'info',
      message: '사용자 거절',
    });
    expect(toast.info).toHaveBeenCalledWith('Executor 설정이 취소되었습니다');
  });

  it('useStep0DualTypeNames validates missing type names', async () => {
    const writeTypeName = vi.fn();

    const { result } = renderHook(() =>
      useStep0DualTypeNames({
        connectedWalletAddress: OWNER_ADDRESS,
        contractAddress: CONTRACT_ADDRESS,
        ensureNetwork: vi.fn(async () => undefined),
        failedToastMessage: '타입 실패',
        getPublicClient: vi.fn() as never,
        getWalletClient: vi.fn() as never,
        initialName0: ' ',
        initialName1: '',
        logContext: 'test.type',
        missingBothNamesMessage: '두 개 모두 필요',
        settingStatusMessage: '설정 중',
        successStatusMessage: (a, b) => `${a}/${b}`,
        successToastMessage: '성공',
        waitingFirstStatusMessage: (hash) => hash,
        waitingSecondStatusMessage: (hash) => hash,
        writeTypeName,
      })
    );

    await act(async () => {
      await result.current.handleSetTypeNames();
    });

    expect(result.current.typeNameStatus).toEqual({
      type: 'error',
      message: '두 개 모두 필요',
    });
    expect(writeTypeName).not.toHaveBeenCalled();
  });

  it('useStep0DualTypeNames writes both names and stores tx hashes', async () => {
    const walletClient = createWalletClient();
    const publicClient = createPublicClient();

    const writeTypeName = vi.fn(async (_walletClient, _contractAddress, typeId: 0 | 1) =>
      typeId === 0 ? TX_HASH_0 : TX_HASH_1
    );

    publicClient.waitForTransactionReceipt.mockResolvedValue({});

    const { result } = renderHook(() =>
      useStep0DualTypeNames({
        connectedWalletAddress: OWNER_ADDRESS,
        contractAddress: CONTRACT_ADDRESS,
        ensureNetwork: vi.fn(async () => undefined),
        failedToastMessage: '타입 실패',
        getPublicClient: () => publicClient as never,
        getWalletClient: () => walletClient as never,
        initialName0: 'Forget',
        initialName1: 'Remember',
        logContext: 'test.type',
        missingBothNamesMessage: '두 개 모두 필요',
        settingStatusMessage: '설정 중',
        successStatusMessage: (a, b) => `${a}/${b}`,
        successToastMessage: '타입 성공',
        waitingFirstStatusMessage: (hash) => `first:${hash}`,
        waitingSecondStatusMessage: (hash) => `second:${hash}`,
        writeTypeName,
      })
    );

    await act(async () => {
      await result.current.handleSetTypeNames();
    });

    expect(writeTypeName).toHaveBeenNthCalledWith(
      1,
      walletClient,
      CONTRACT_ADDRESS,
      0,
      'Forget'
    );
    expect(writeTypeName).toHaveBeenNthCalledWith(
      2,
      walletClient,
      CONTRACT_ADDRESS,
      1,
      'Remember'
    );
    expect(result.current.typeNameTxHashes).toEqual([TX_HASH_0, TX_HASH_1]);
    expect(result.current.typeNameStatus).toEqual({
      type: 'success',
      message: 'Forget/Remember',
    });
    expect(toast.success).toHaveBeenCalledWith('타입 성공');
  });

  it('useStep0DualTypeNames handles non-rejection error', async () => {
    const writeTypeName = vi.fn(async () => {
      throw new Error('타입 설정 실패');
    });

    const { result } = renderHook(() =>
      useStep0DualTypeNames({
        connectedWalletAddress: OWNER_ADDRESS,
        contractAddress: CONTRACT_ADDRESS,
        ensureNetwork: vi.fn(async () => undefined),
        failedToastMessage: '타입 실패',
        getPublicClient: () => createPublicClient() as never,
        getWalletClient: () => createWalletClient() as never,
        initialName0: 'Forget',
        initialName1: 'Remember',
        logContext: 'test.type',
        missingBothNamesMessage: '두 개 모두 필요',
        settingStatusMessage: '설정 중',
        successStatusMessage: (a, b) => `${a}/${b}`,
        successToastMessage: '타입 성공',
        waitingFirstStatusMessage: (hash) => `first:${hash}`,
        waitingSecondStatusMessage: (hash) => `second:${hash}`,
        writeTypeName,
      })
    );

    await act(async () => {
      await result.current.handleSetTypeNames();
    });

    expect(result.current.typeNameStatus).toEqual({
      type: 'error',
      message: '타입 설정 실패',
    });
    expect(toast.error).toHaveBeenCalledWith('타입 실패');
  });

  it('useStep0ArtistRegistration validates invalid mission/artist id', async () => {
    const writeArtist = vi.fn();

    const { result } = renderHook(() =>
      useStep0ArtistRegistration({
        connectedWalletAddress: OWNER_ADDRESS,
        contractAddress: CONTRACT_ADDRESS,
        ensureNetwork: vi.fn(async () => undefined),
        failedToastMessage: '아티스트 실패',
        getPublicClient: vi.fn() as never,
        getWalletClient: vi.fn() as never,
        initialMissionId: 'x',
        logContext: 'test.artist',
        successToastMessage: '아티스트 성공',
        writeArtist,
      })
    );

    await act(async () => {
      await result.current.handleRegisterArtist();
    });

    expect(result.current.candidateStatus).toEqual({
      type: 'error',
      message: '미션 ID와 아티스트 ID는 0 이상의 정수여야 합니다',
    });
    expect(writeArtist).not.toHaveBeenCalled();
  });

  it('useStep0ArtistRegistration registers artist successfully', async () => {
    const walletClient = createWalletClient();
    const publicClient = createPublicClient();
    const writeArtist = vi.fn(async () => TX_HASH_0);

    publicClient.waitForTransactionReceipt.mockResolvedValue({});

    const { result } = renderHook(() =>
      useStep0ArtistRegistration({
        connectedWalletAddress: OWNER_ADDRESS,
        contractAddress: CONTRACT_ADDRESS,
        ensureNetwork: vi.fn(async () => undefined),
        failedToastMessage: '아티스트 실패',
        getPublicClient: () => publicClient as never,
        getWalletClient: () => walletClient as never,
        logContext: 'test.artist',
        successToastMessage: '아티스트 성공',
        writeArtist,
      })
    );

    await act(async () => {
      await result.current.handleRegisterArtist();
    });

    expect(writeArtist).toHaveBeenCalledWith(
      walletClient,
      CONTRACT_ADDRESS,
      1n,
      1n,
      'Artist A'
    );
    expect(result.current.artistTxHash).toBe(TX_HASH_0);
    expect(result.current.candidateStatus).toEqual({
      type: 'success',
      message: '아티스트 등록 완료!\n이름: Artist A\n미션 ID: 1\n아티스트 ID: 1',
    });
    expect(toast.success).toHaveBeenCalledWith('아티스트 성공');
  });

  it('useStep0ArtistRegistration handles user rejection as info', async () => {
    const rejectError = new Error('User rejected');
    vi.mocked(isUserRejectionError).mockReturnValue(true);
    vi.mocked(getBlockchainErrorMessage).mockReturnValue('사용자 거절');

    const { result } = renderHook(() =>
      useStep0ArtistRegistration({
        connectedWalletAddress: OWNER_ADDRESS,
        contractAddress: CONTRACT_ADDRESS,
        ensureNetwork: vi.fn(async () => undefined),
        failedToastMessage: '아티스트 실패',
        getPublicClient: () => createPublicClient() as never,
        getWalletClient: () => createWalletClient() as never,
        logContext: 'test.artist',
        successToastMessage: '아티스트 성공',
        writeArtist: async () => {
          throw rejectError;
        },
      })
    );

    await act(async () => {
      await result.current.handleRegisterArtist();
    });

    expect(result.current.candidateStatus).toEqual({
      type: 'info',
      message: '사용자 거절',
    });
    expect(toast.info).toHaveBeenCalledWith('아티스트 등록이 취소되었습니다');
  });
});
