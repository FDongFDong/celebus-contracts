import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Step6Digest } from '../Step6Digest';
import { createMockAppState, createMockWalletAdapter, setupMockDOM } from '../../../__tests__/__mocks__';
import type { Address, Hash } from '../../../../domain/types';

describe('Step6Digest', () => {
  let step: Step6Digest;
  let mockAppState: ReturnType<typeof createMockAppState>;

  beforeEach(() => {
    setupMockDOM();
    mockAppState = createMockAppState();
    step = new Step6Digest(mockAppState);
  });

  describe('render', () => {
    it('기본 HTML 구조를 렌더링해야 함', () => {
      const html = step.render();

      expect(html).toContain('STEP 6');
      expect(html).toContain('Final Digest 및 Executor 서명');
      expect(html).toContain('domainSeparatorInput');
      expect(html).toContain('structHashInput');
      expect(html).toContain('calculateDigestBtn');
      expect(html).toContain('generateSignatureBtn');
    });

    it('Domain Separator 입력 필드를 포함해야 함', () => {
      const html = step.render();

      expect(html).toContain('Domain Separator');
      expect(html).toContain('Step 4를 먼저 완료해주세요');
    });

    it('Struct Hash 입력 필드를 포함해야 함', () => {
      const html = step.render();

      expect(html).toContain('Struct Hash');
      expect(html).toContain('Step 5를 먼저 완료해주세요');
    });

    it('서명 결과 표시 영역을 포함해야 함', () => {
      const html = step.render();

      expect(html).toContain('sigR');
      expect(html).toContain('sigS');
      expect(html).toContain('sigV');
      expect(html).toContain('executorSignature');
    });
  });

  describe('init', () => {
    beforeEach(() => {
      document.body.innerHTML = step.render();
    });

    it('이벤트 리스너를 연결해야 함', () => {
      const calculateBtn = document.getElementById('calculateDigestBtn');
      const signBtn = document.getElementById('generateSignatureBtn');

      expect(calculateBtn).toBeTruthy();
      expect(signBtn).toBeTruthy();

      step.init();

      expect(step).toBeTruthy();
    });

    it('AppState 상태 변경을 구독해야 함', () => {
      step.init();

      expect(mockAppState.subscribe).toHaveBeenCalled();
    });

    it('초기화 시 이전 단계 결과를 로드해야 함', () => {
      const testDomain = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hash;
      const testStruct = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as Hash;

      mockAppState = createMockAppState({
        domainSeparator: testDomain,
        structHash: testStruct,
      });
      step = new Step6Digest(mockAppState);

      document.body.innerHTML = step.render();
      step.init();

      const domainInput = document.getElementById('domainSeparatorInput') as HTMLInputElement;
      const structInput = document.getElementById('structHashInput') as HTMLInputElement;

      expect(domainInput.value).toBe(testDomain);
      expect(structInput.value).toBe(testStruct);
    });
  });

  describe('Final Digest 계산', () => {
    beforeEach(() => {
      document.body.innerHTML = step.render();
      step.init();
    });

    it('Step 4, 5 결과가 없으면 경고를 표시해야 함', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const calculateBtn = document.getElementById('calculateDigestBtn') as HTMLButtonElement;
      calculateBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Step 4와 5를 먼저 완료해주세요!');

      alertSpy.mockRestore();
    });

    it('유효한 입력으로 Final Digest를 계산해야 함', () => {
      const testDomain = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hash;
      const testStruct = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as Hash;

      mockAppState = createMockAppState({
        domainSeparator: testDomain,
        structHash: testStruct,
      });
      step = new Step6Digest(mockAppState);

      document.body.innerHTML = step.render();
      step.init();

      const calculateBtn = document.getElementById('calculateDigestBtn') as HTMLButtonElement;
      calculateBtn.click();

      // setState가 호출되었는지 확인
      expect(mockAppState.setState).toHaveBeenCalled();

      const call = vi.mocked(mockAppState.setState).mock.calls[0]?.[0];
      expect(call).toBeDefined();
      expect(call?.finalDigest).toBeDefined();
      expect(call?.finalDigest).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('계산 결과를 UI에 표시해야 함', () => {
      const testDomain = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hash;
      const testStruct = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as Hash;

      mockAppState = createMockAppState({
        domainSeparator: testDomain,
        structHash: testStruct,
      });
      step = new Step6Digest(mockAppState);

      document.body.innerHTML = step.render();
      step.init();

      const calculateBtn = document.getElementById('calculateDigestBtn') as HTMLButtonElement;
      calculateBtn.click();

      const resultSection = document.getElementById('digestResult');
      expect(resultSection?.style.display).not.toBe('none');

      const digestInput = document.getElementById('finalDigest') as HTMLInputElement;
      expect(digestInput.value).toMatch(/^0x[a-fA-F0-9]{64}$/);

      const signatureSection = document.getElementById('signatureSection');
      expect(signatureSection?.style.display).not.toBe('none');
    });

    it('계산 과정 설명을 생성해야 함', () => {
      const testDomain = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hash;
      const testStruct = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as Hash;

      mockAppState = createMockAppState({
        domainSeparator: testDomain,
        structHash: testStruct,
      });
      step = new Step6Digest(mockAppState);

      document.body.innerHTML = step.render();
      step.init();

      const calculateBtn = document.getElementById('calculateDigestBtn') as HTMLButtonElement;
      calculateBtn.click();

      const explanationDiv = document.getElementById('digestExplanation');
      expect(explanationDiv).toBeTruthy();
      expect(explanationDiv?.innerHTML).toContain('EIP-191');
    });
  });

  describe('Executor 서명 생성', () => {
    beforeEach(() => {
      document.body.innerHTML = step.render();
      step.init();
    });

    it('Final Digest가 없으면 경고를 표시해야 함', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const signBtn = document.getElementById('generateSignatureBtn') as HTMLButtonElement;
      signBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(alertSpy).toHaveBeenCalledWith('먼저 Final Digest를 계산해주세요!');

      alertSpy.mockRestore();
    });

    it('Executor 지갑이 없으면 경고를 표시해야 함', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockAppState = createMockAppState({
        finalDigest: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hash,
      });
      step = new Step6Digest(mockAppState);

      document.body.innerHTML = step.render();
      step.init();

      const signBtn = document.getElementById('generateSignatureBtn') as HTMLButtonElement;
      signBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(alertSpy).toHaveBeenCalledWith('Executor 지갑이 초기화되지 않았습니다!');

      alertSpy.mockRestore();
    });

    it('컨트랙트 주소가 없으면 경고를 표시해야 함', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockAppState = createMockAppState({
        finalDigest: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hash,
        executorWallet: createMockWalletAdapter(),
      });
      step = new Step6Digest(mockAppState);

      document.body.innerHTML = step.render();
      step.init();

      const signBtn = document.getElementById('generateSignatureBtn') as HTMLButtonElement;
      signBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(alertSpy).toHaveBeenCalledWith('컨트랙트 주소가 설정되지 않았습니다!');

      alertSpy.mockRestore();
    });

    it('유효한 조건에서 서명을 생성해야 함', async () => {
      const mockWallet = createMockWalletAdapter();

      mockAppState = createMockAppState({
        finalDigest: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hash,
        executorWallet: mockWallet,
        contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address,
        batchNonce: 1n,
      });
      step = new Step6Digest(mockAppState);

      document.body.innerHTML = step.render();
      step.init();

      const signBtn = document.getElementById('generateSignatureBtn') as HTMLButtonElement;
      signBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockWallet.signTypedData).toHaveBeenCalled();
      expect(mockAppState.setState).toHaveBeenCalled();

      const call = vi.mocked(mockAppState.setState).mock.calls.find((c) => c[0]?.executorSig);
      expect(call?.[0]?.executorSig).toBeDefined();
      expect(call?.[0]?.executorSig).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it('서명 결과를 UI에 표시해야 함', async () => {
      const mockWallet = createMockWalletAdapter();

      mockAppState = createMockAppState({
        finalDigest: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hash,
        executorWallet: mockWallet,
        contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address,
        batchNonce: 1n,
      });
      step = new Step6Digest(mockAppState);

      document.body.innerHTML = step.render();
      step.init();

      const signBtn = document.getElementById('generateSignatureBtn') as HTMLButtonElement;
      signBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const signatureResult = document.getElementById('signatureResult');
      expect(signatureResult?.style.display).not.toBe('none');

      const sigR = document.getElementById('sigR');
      const sigS = document.getElementById('sigS');
      const sigV = document.getElementById('sigV');

      expect(sigR?.textContent).toBeTruthy();
      expect(sigS?.textContent).toBeTruthy();
      expect(sigV?.textContent).toBeTruthy();
    });
  });

  describe('상태 변경 반응', () => {
    beforeEach(() => {
      document.body.innerHTML = step.render();
      step.init();
    });

    it('domainSeparator 변경 시 입력 필드를 업데이트해야 함', () => {
      const testDomain = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hash;

      const subscribeCall = vi.mocked(mockAppState.subscribe).mock.calls[0];
      const callback = subscribeCall?.[0];

      if (callback) {
        callback(
          Object.freeze({
            ...mockAppState.getState(),
            domainSeparator: testDomain,
          })
        );
      }

      const domainInput = document.getElementById('domainSeparatorInput') as HTMLInputElement;
      expect(domainInput.value).toBe(testDomain);
    });

    it('structHash 변경 시 입력 필드를 업데이트해야 함', () => {
      const testStruct = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as Hash;

      const subscribeCall = vi.mocked(mockAppState.subscribe).mock.calls[0];
      const callback = subscribeCall?.[0];

      if (callback) {
        callback(
          Object.freeze({
            ...mockAppState.getState(),
            structHash: testStruct,
          })
        );
      }

      const structInput = document.getElementById('structHashInput') as HTMLInputElement;
      expect(structInput.value).toBe(testStruct);
    });

    it('finalDigest 변경 시 결과를 표시해야 함', () => {
      const testDigest = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hash;

      const subscribeCall = vi.mocked(mockAppState.subscribe).mock.calls[0];
      const callback = subscribeCall?.[0];

      if (callback) {
        callback(
          Object.freeze({
            ...mockAppState.getState(),
            finalDigest: testDigest,
          })
        );
      }

      const digestInput = document.getElementById('finalDigest') as HTMLInputElement;
      expect(digestInput.value).toBe(testDigest);

      const digestResult = document.getElementById('digestResult');
      expect(digestResult?.style.display).not.toBe('none');

      const signatureSection = document.getElementById('signatureSection');
      expect(signatureSection?.style.display).not.toBe('none');
    });
  });

  describe('destroy', () => {
    it('구독을 취소해야 함', () => {
      document.body.innerHTML = step.render();
      step.init();

      const subscribeCalls = vi.mocked(mockAppState.subscribe).mock.calls.length;
      expect(subscribeCalls).toBeGreaterThan(0);

      step.destroy();

      expect(step).toBeTruthy();
    });
  });
});
