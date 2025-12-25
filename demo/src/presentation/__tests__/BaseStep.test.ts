import { describe, it, expect, beforeEach } from 'vitest';
import { BaseStep } from '../components/BaseStep';
import { AppState, AppStateData } from '../state/AppState';

// 테스트용 구체 클래스
class TestStep extends BaseStep {
  public stateChangeCount = 0;
  public lastState: Readonly<AppStateData> | null = null;

  render(): string {
    return '<div>Test Step</div>';
  }

  protected onStateChange(state: Readonly<AppStateData>): void {
    this.stateChangeCount++;
    this.lastState = state;
  }
}

describe('BaseStep', () => {
  let appState: AppState;
  let testStep: TestStep;

  beforeEach(() => {
    appState = new AppState();
    testStep = new TestStep(appState);
  });

  it('생성자에서 state를 받아야 함', () => {
    expect(testStep['state']).toBe(appState);
  });

  it('render() 메서드를 구현해야 함', () => {
    const html = testStep.render();
    expect(html).toBe('<div>Test Step</div>');
  });

  it('init() 호출 시 상태 변경을 구독해야 함', () => {
    testStep.init();

    // 상태 변경
    appState.setState({ batchNonce: 1n });

    expect(testStep.stateChangeCount).toBe(1);
    expect(testStep.lastState?.batchNonce).toBe(1n);
  });

  it('destroy() 호출 시 구독을 해제해야 함', () => {
    testStep.init();

    // 첫 번째 상태 변경
    appState.setState({ batchNonce: 1n });
    expect(testStep.stateChangeCount).toBe(1);

    // 구독 해제
    testStep.destroy();

    // 두 번째 상태 변경 (구독 해제 후)
    appState.setState({ batchNonce: 2n });
    expect(testStep.stateChangeCount).toBe(1); // 여전히 1
  });

  it('여러 Step 인스턴스가 독립적으로 동작해야 함', () => {
    const step1 = new TestStep(appState);
    const step2 = new TestStep(appState);

    step1.init();
    step2.init();

    appState.setState({ batchNonce: 1n });

    expect(step1.stateChangeCount).toBe(1);
    expect(step2.stateChangeCount).toBe(1);

    // step1만 구독 해제
    step1.destroy();

    appState.setState({ batchNonce: 2n });

    expect(step1.stateChangeCount).toBe(1); // 변화 없음
    expect(step2.stateChangeCount).toBe(2); // 계속 증가
  });

  it('onStateChange를 오버라이드하지 않아도 동작해야 함', () => {
    class MinimalStep extends BaseStep {
      render(): string {
        return '<div>Minimal</div>';
      }
    }

    const minimalStep = new MinimalStep(appState);
    minimalStep.init();

    // 에러 없이 동작해야 함
    expect(() => {
      appState.setState({ batchNonce: 1n });
    }).not.toThrow();

    minimalStep.destroy();
  });
});
