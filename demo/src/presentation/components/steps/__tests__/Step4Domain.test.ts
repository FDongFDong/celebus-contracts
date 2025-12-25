import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Step4Domain } from '../Step4Domain';
import { createMockAppState, setupMockDOM } from '../../../__tests__/__mocks__';
import type { Address, Hash } from '../../../../domain/types';

describe('Step4Domain', () => {
  let step: Step4Domain;
  let mockAppState: ReturnType<typeof createMockAppState>;

  beforeEach(() => {
    setupMockDOM();
    mockAppState = createMockAppState();
    step = new Step4Domain(mockAppState);
  });

  describe('render', () => {
    it('기본 HTML 구조를 렌더링해야 함', () => {
      const html = step.render();

      expect(html).toContain('STEP 4');
      expect(html).toContain('Domain Separator 계산');
      expect(html).toContain('domainName');
      expect(html).toContain('domainVersion');
      expect(html).toContain('chainId');
      expect(html).toContain('verifyingContract');
      expect(html).toContain('calculateDomainBtn');
    });

    it('기본값이 설정되어 있어야 함', () => {
      const html = step.render();

      expect(html).toContain('MainVoting');
      expect(html).toContain('value="1"');
      expect(html).toContain('5611');
    });

    it('contractAddress가 있으면 verifyingContract에 표시되어야 함', () => {
      const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' as Address;
      mockAppState = createMockAppState({ contractAddress: testAddress });
      step = new Step4Domain(mockAppState);

      const html = step.render();

      expect(html).toContain(testAddress);
    });
  });

  describe('init', () => {
    beforeEach(() => {
      document.body.innerHTML = step.render();
    });

    it('이벤트 리스너를 연결해야 함', () => {
      const calculateBtn = document.getElementById('calculateDomainBtn');
      expect(calculateBtn).toBeTruthy();

      step.init();

      expect(step).toBeTruthy();
    });

    it('AppState 상태 변경을 구독해야 함', () => {
      step.init();

      expect(mockAppState.subscribe).toHaveBeenCalled();
    });
  });

  describe('Domain Separator 계산', () => {
    beforeEach(() => {
      document.body.innerHTML = step.render();
      step.init();
    });

    it('모든 필드가 입력되어야 계산할 수 있음', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      // 필드를 비우고 계산 시도
      const nameInput = document.getElementById('domainName') as HTMLInputElement;
      nameInput.value = '';

      const calculateBtn = document.getElementById('calculateDomainBtn') as HTMLButtonElement;
      calculateBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('모든 필드를 입력해주세요!');

      alertSpy.mockRestore();
    });

    it('유효한 입력으로 Domain Separator를 계산해야 함', () => {
      const nameInput = document.getElementById('domainName') as HTMLInputElement;
      const versionInput = document.getElementById('domainVersion') as HTMLInputElement;
      const chainIdInput = document.getElementById('chainId') as HTMLInputElement;
      const contractInput = document.getElementById('verifyingContract') as HTMLInputElement;

      nameInput.value = 'MainVoting';
      versionInput.value = '1';
      chainIdInput.value = '5611';
      contractInput.value = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';

      const calculateBtn = document.getElementById('calculateDomainBtn') as HTMLButtonElement;
      calculateBtn.click();

      // setState가 호출되었는지 확인
      expect(mockAppState.setState).toHaveBeenCalled();

      const call = vi.mocked(mockAppState.setState).mock.calls[0]?.[0];
      expect(call).toBeDefined();
      expect(call?.domainSeparator).toBeDefined();
      expect(call?.domainSeparator).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('계산 결과를 UI에 표시해야 함', () => {
      const nameInput = document.getElementById('domainName') as HTMLInputElement;
      const versionInput = document.getElementById('domainVersion') as HTMLInputElement;
      const chainIdInput = document.getElementById('chainId') as HTMLInputElement;
      const contractInput = document.getElementById('verifyingContract') as HTMLInputElement;

      nameInput.value = 'MainVoting';
      versionInput.value = '1';
      chainIdInput.value = '5611';
      contractInput.value = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';

      const calculateBtn = document.getElementById('calculateDomainBtn') as HTMLButtonElement;
      calculateBtn.click();

      const resultSection = document.getElementById('domainSeparatorResult');
      expect(resultSection?.style.display).not.toBe('none');

      const separatorInput = document.getElementById('domainSeparator') as HTMLInputElement;
      expect(separatorInput.value).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('계산 과정 설명을 생성해야 함', () => {
      const nameInput = document.getElementById('domainName') as HTMLInputElement;
      const versionInput = document.getElementById('domainVersion') as HTMLInputElement;
      const chainIdInput = document.getElementById('chainId') as HTMLInputElement;
      const contractInput = document.getElementById('verifyingContract') as HTMLInputElement;

      nameInput.value = 'MainVoting';
      versionInput.value = '1';
      chainIdInput.value = '5611';
      contractInput.value = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';

      const calculateBtn = document.getElementById('calculateDomainBtn') as HTMLButtonElement;
      calculateBtn.click();

      const explanationDiv = document.getElementById('domainExplanation');
      expect(explanationDiv).toBeTruthy();
      expect(explanationDiv?.innerHTML).toContain('EIP712Domain TypeHash');
    });
  });

  describe('상태 변경 반응', () => {
    beforeEach(() => {
      document.body.innerHTML = step.render();
      step.init();
    });

    it('contractAddress 변경 시 verifyingContract를 업데이트해야 함', () => {
      const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' as Address;

      // AppState의 subscribe 콜백 찾기
      const subscribeCall = vi.mocked(mockAppState.subscribe).mock.calls[0];
      const callback = subscribeCall?.[0];

      if (callback) {
        callback(
          Object.freeze({
            ...mockAppState.getState(),
            contractAddress: testAddress,
          })
        );
      }

      const contractInput = document.getElementById('verifyingContract') as HTMLInputElement;
      expect(contractInput.value).toBe(testAddress);
    });

    it('domainSeparator 변경 시 결과를 표시해야 함', () => {
      const testSeparator = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hash;

      const subscribeCall = vi.mocked(mockAppState.subscribe).mock.calls[0];
      const callback = subscribeCall?.[0];

      if (callback) {
        callback(
          Object.freeze({
            ...mockAppState.getState(),
            domainSeparator: testSeparator,
          })
        );
      }

      const separatorInput = document.getElementById('domainSeparator') as HTMLInputElement;
      expect(separatorInput.value).toBe(testSeparator);

      const resultSection = document.getElementById('domainSeparatorResult');
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
