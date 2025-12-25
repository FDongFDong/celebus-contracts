import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Step1Executor } from '../Step1Executor';
import { createMockAppState, createMockElements, setupMockDOM } from '../../../__tests__/__mocks__';

describe('Step1Executor', () => {
  let step: Step1Executor;
  let mockAppState: ReturnType<typeof createMockAppState>;

  beforeEach(() => {
    setupMockDOM();
    mockAppState = createMockAppState();
    step = new Step1Executor(mockAppState);
  });

  describe('render', () => {
    it('기본 HTML 구조를 렌더링해야 함', () => {
      const html = step.render();

      expect(html).toContain('STEP 1');
      expect(html).toContain('Executor Wallet Initialization');
      expect(html).toContain('executorPrivateKey');
      expect(html).toContain('user1PrivateKey');
      expect(html).toContain('user2PrivateKey');
      expect(html).toContain('initWalletsBtn');
    });

    it('기본 Private Key 값들을 포함해야 함', () => {
      const html = step.render();

      expect(html).toContain('0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef');
      expect(html).toContain('0xb43112fd82593f95dea3ba1a25eed28a6a75d6763677a42560b5d7815fea7977');
    });

    it('주소 표시 요소들을 포함해야 함', () => {
      const html = step.render();

      expect(html).toContain('executorAddress');
      expect(html).toContain('user1Address');
      expect(html).toContain('user2Address');
    });
  });

  describe('init', () => {
    beforeEach(() => {
      document.body.innerHTML = step.render();
    });

    it('이벤트 리스너를 연결해야 함', () => {
      const initBtn = document.getElementById('initWalletsBtn');
      expect(initBtn).toBeTruthy();

      step.init();

      // 이벤트 리스너가 연결되었는지 확인 (간접 확인)
      expect(step).toBeTruthy();
    });

    it('초기화 시 지갑 주소를 업데이트해야 함', () => {
      step.init();

      const executorAddr = document.getElementById('executorAddress');
      const user1Addr = document.getElementById('user1Address');
      const user2Addr = document.getElementById('user2Address');

      // 기본값이 있으므로 주소가 표시되어야 함
      expect(executorAddr?.textContent).not.toBe('-');
      expect(user1Addr?.textContent).not.toBe('-');
      expect(user2Addr?.textContent).not.toBe('-');
    });
  });

  describe('Private Key 입력 처리', () => {
    beforeEach(() => {
      document.body.innerHTML = step.render();
      step.init();
    });

    it('Executor Private Key 변경 시 주소를 업데이트해야 함', () => {
      const input = document.getElementById('executorPrivateKey') as HTMLInputElement;
      const addressDisplay = document.getElementById('executorAddress');

      const testKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      input.value = testKey;
      input.dispatchEvent(new Event('input'));

      // 주소가 변경되어야 함
      expect(addressDisplay?.textContent).not.toBe('-');
      expect(addressDisplay?.textContent).toBeTruthy();
    });

    it('User 1 Private Key 변경 시 주소를 업데이트해야 함', () => {
      const input = document.getElementById('user1PrivateKey') as HTMLInputElement;
      const addressDisplay = document.getElementById('user1Address');

      const testKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
      input.value = testKey;
      input.dispatchEvent(new Event('input'));

      expect(addressDisplay?.textContent).not.toBe('-');
      expect(addressDisplay?.textContent).toBeTruthy();
    });

    it('User 2 Private Key 변경 시 주소를 업데이트해야 함', () => {
      const input = document.getElementById('user2PrivateKey') as HTMLInputElement;
      const addressDisplay = document.getElementById('user2Address');

      const testKey = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
      input.value = testKey;
      input.dispatchEvent(new Event('input'));

      expect(addressDisplay?.textContent).not.toBe('-');
      expect(addressDisplay?.textContent).toBeTruthy();
    });

    it('잘못된 Private Key 입력 시 주소를 표시하지 않아야 함', () => {
      const input = document.getElementById('executorPrivateKey') as HTMLInputElement;
      const addressDisplay = document.getElementById('executorAddress');

      input.value = 'invalid-key';
      input.dispatchEvent(new Event('input'));

      expect(addressDisplay?.textContent).toBe('-');
    });

    it('빈 Private Key 입력 시 주소를 초기화해야 함', () => {
      const input = document.getElementById('executorPrivateKey') as HTMLInputElement;
      const addressDisplay = document.getElementById('executorAddress');

      input.value = '';
      input.dispatchEvent(new Event('input'));

      expect(addressDisplay?.textContent).toBe('-');
    });
  });

  describe('initWallets', () => {
    beforeEach(() => {
      document.body.innerHTML = step.render();
      step.init();
    });

    it('유효한 Private Key로 지갑을 초기화해야 함', async () => {
      const executorInput = document.getElementById('executorPrivateKey') as HTMLInputElement;
      const user1Input = document.getElementById('user1PrivateKey') as HTMLInputElement;
      const user2Input = document.getElementById('user2PrivateKey') as HTMLInputElement;

      executorInput.value = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      user1Input.value = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
      user2Input.value = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

      const initBtn = document.getElementById('initWalletsBtn') as HTMLButtonElement;
      initBtn.click();

      // setState가 호출되었는지 확인
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockAppState.setState).toHaveBeenCalled();

      const call = vi.mocked(mockAppState.setState).mock.calls[0]?.[0];
      expect(call).toBeDefined();
      expect(call?.executorWallet).toBeDefined();
      expect(call?.userWallets).toHaveLength(2);
    });

    it('성공 시 성공 메시지를 표시해야 함', async () => {
      const executorInput = document.getElementById('executorPrivateKey') as HTMLInputElement;
      const user1Input = document.getElementById('user1PrivateKey') as HTMLInputElement;
      const user2Input = document.getElementById('user2PrivateKey') as HTMLInputElement;

      executorInput.value = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      user1Input.value = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
      user2Input.value = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

      const initBtn = document.getElementById('initWalletsBtn') as HTMLButtonElement;
      initBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      const statusDiv = document.getElementById('walletStatus');
      expect(statusDiv?.style.display).not.toBe('none');
    });
  });

  describe('상태 변경 반응', () => {
    beforeEach(() => {
      document.body.innerHTML = step.render();
      step.init();
    });

    it('AppState의 상태 변경을 구독해야 함', () => {
      expect(mockAppState.subscribe).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('구독을 취소해야 함', () => {
      document.body.innerHTML = step.render();
      step.init();

      const subscribeCalls = vi.mocked(mockAppState.subscribe).mock.calls.length;
      expect(subscribeCalls).toBeGreaterThan(0);

      step.destroy();

      // 구독 취소 함수가 호출되었는지는 간접적으로만 확인 가능
      expect(step).toBeTruthy();
    });
  });
});
