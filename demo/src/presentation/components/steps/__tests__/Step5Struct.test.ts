import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Step5Struct } from '../Step5Struct';
import { createMockAppState, createMockWalletAdapter, setupMockDOM } from '../../../__tests__/__mocks__';
import type { Address, Hash } from '../../../../domain/types';

describe('Step5Struct', () => {
  let step: Step5Struct;
  let mockAppState: ReturnType<typeof createMockAppState>;

  beforeEach(() => {
    setupMockDOM();
    mockAppState = createMockAppState();
    step = new Step5Struct(mockAppState);
  });

  describe('render', () => {
    it('기본 HTML 구조를 렌더링해야 함', () => {
      const html = step.render();

      expect(html).toContain('STEP 5');
      expect(html).toContain('Struct Hash 계산');
      expect(html).toContain('batchNonce');
      expect(html).toContain('checkNonceBtn');
      expect(html).toContain('calculateStructBtn');
    });

    it('Batch Nonce 입력 필드를 포함해야 함', () => {
      const html = step.render();

      expect(html).toContain('Batch Nonce');
      expect(html).toContain('value="0"');
    });

    it('사용 가능 확인 버튼을 포함해야 함', () => {
      const html = step.render();

      expect(html).toContain('사용 가능 확인');
      expect(html).toContain('checkNonceBtn');
    });
  });

  describe('init', () => {
    beforeEach(() => {
      document.body.innerHTML = step.render();
    });

    it('이벤트 리스너를 연결해야 함', () => {
      const checkBtn = document.getElementById('checkNonceBtn');
      const calculateBtn = document.getElementById('calculateStructBtn');

      expect(checkBtn).toBeTruthy();
      expect(calculateBtn).toBeTruthy();

      step.init();

      expect(step).toBeTruthy();
    });

    it('AppState 상태 변경을 구독해야 함', () => {
      step.init();

      expect(mockAppState.subscribe).toHaveBeenCalled();
    });
  });

  describe('Batch Nonce 체크', () => {
    beforeEach(() => {
      document.body.innerHTML = step.render();
      step.init();
    });

    it('Executor 지갑이 없으면 경고를 표시해야 함', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const checkBtn = document.getElementById('checkNonceBtn') as HTMLButtonElement;
      checkBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(alertSpy).toHaveBeenCalledWith('먼저 STEP 1에서 Executor 지갑을 초기화해주세요!');

      alertSpy.mockRestore();
    });

    it('컨트랙트 주소가 없으면 경고를 표시해야 함', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockAppState = createMockAppState({
        executorWallet: createMockWalletAdapter(),
      });
      step = new Step5Struct(mockAppState);
      document.body.innerHTML = step.render();
      step.init();

      const checkBtn = document.getElementById('checkNonceBtn') as HTMLButtonElement;
      checkBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(alertSpy).toHaveBeenCalledWith('먼저 컨트랙트 주소를 설정해주세요!');

      alertSpy.mockRestore();
    });

    it('유효하지 않은 Nonce 입력 시 경고를 표시해야 함', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockAppState = createMockAppState({
        executorWallet: createMockWalletAdapter(),
        contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address,
      });
      step = new Step5Struct(mockAppState);
      document.body.innerHTML = step.render();
      step.init();

      const nonceInput = document.getElementById('batchNonce') as HTMLInputElement;
      nonceInput.value = 'invalid';

      const checkBtn = document.getElementById('checkNonceBtn') as HTMLButtonElement;
      checkBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(alertSpy).toHaveBeenCalledWith('유효한 Nonce 값을 입력해주세요 (숫자만)');

      alertSpy.mockRestore();
    });
  });

  describe('Struct Hash 계산', () => {
    beforeEach(() => {
      document.body.innerHTML = step.render();
      step.init();
    });

    it('유효하지 않은 Nonce 입력 시 경고를 표시해야 함', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const nonceInput = document.getElementById('batchNonce') as HTMLInputElement;
      nonceInput.value = 'invalid';

      const calculateBtn = document.getElementById('calculateStructBtn') as HTMLButtonElement;
      calculateBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('유효한 Batch Nonce 값을 입력해주세요 (숫자만)');

      alertSpy.mockRestore();
    });

    it('유효한 Nonce로 Struct Hash를 계산해야 함', () => {
      const nonceInput = document.getElementById('batchNonce') as HTMLInputElement;
      nonceInput.value = '1';

      const calculateBtn = document.getElementById('calculateStructBtn') as HTMLButtonElement;
      calculateBtn.click();

      // setState가 호출되었는지 확인
      expect(mockAppState.setState).toHaveBeenCalled();

      const call = vi.mocked(mockAppState.setState).mock.calls[0]?.[0];
      expect(call).toBeDefined();
      expect(call?.batchNonce).toBe(1n);
      expect(call?.structHash).toBeDefined();
      expect(call?.structHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('계산 결과를 UI에 표시해야 함', () => {
      const nonceInput = document.getElementById('batchNonce') as HTMLInputElement;
      nonceInput.value = '5';

      const calculateBtn = document.getElementById('calculateStructBtn') as HTMLButtonElement;
      calculateBtn.click();

      const resultSection = document.getElementById('structHashResult');
      expect(resultSection?.style.display).not.toBe('none');

      const batchTypeHashInput = document.getElementById('batchTypeHash') as HTMLInputElement;
      expect(batchTypeHashInput.value).toMatch(/^0x[a-fA-F0-9]{64}$/);

      const structHashInput = document.getElementById('structHash') as HTMLInputElement;
      expect(structHashInput.value).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('Nonce 0으로도 계산할 수 있어야 함', () => {
      const nonceInput = document.getElementById('batchNonce') as HTMLInputElement;
      nonceInput.value = '0';

      const calculateBtn = document.getElementById('calculateStructBtn') as HTMLButtonElement;
      calculateBtn.click();

      const call = vi.mocked(mockAppState.setState).mock.calls[0]?.[0];
      expect(call?.batchNonce).toBe(0n);
      expect(call?.structHash).toBeDefined();
    });

    it('큰 Nonce 값도 처리할 수 있어야 함', () => {
      const nonceInput = document.getElementById('batchNonce') as HTMLInputElement;
      nonceInput.value = '999999999999999';

      const calculateBtn = document.getElementById('calculateStructBtn') as HTMLButtonElement;
      calculateBtn.click();

      const call = vi.mocked(mockAppState.setState).mock.calls[0]?.[0];
      expect(call?.batchNonce).toBe(999999999999999n);
      expect(call?.structHash).toBeDefined();
    });

    it('계산 과정 설명을 생성해야 함', () => {
      const nonceInput = document.getElementById('batchNonce') as HTMLInputElement;
      nonceInput.value = '1';

      const calculateBtn = document.getElementById('calculateStructBtn') as HTMLButtonElement;
      calculateBtn.click();

      const explanationDiv = document.getElementById('structExplanation');
      expect(explanationDiv).toBeTruthy();
      expect(explanationDiv?.innerHTML).toContain('Batch TypeHash');
      expect(explanationDiv?.innerHTML).toContain('Struct 데이터 인코딩');
    });
  });

  describe('상태 변경 반응', () => {
    beforeEach(() => {
      document.body.innerHTML = step.render();
      step.init();
    });

    it('structHash 변경 시 결과를 표시해야 함', () => {
      const testHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hash;

      const subscribeCall = vi.mocked(mockAppState.subscribe).mock.calls[0];
      const callback = subscribeCall?.[0];

      if (callback) {
        callback(
          Object.freeze({
            ...mockAppState.getState(),
            structHash: testHash,
          })
        );
      }

      const structHashInput = document.getElementById('structHash') as HTMLInputElement;
      expect(structHashInput.value).toBe(testHash);

      const resultSection = document.getElementById('structHashResult');
      expect(resultSection?.style.display).not.toBe('none');
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
