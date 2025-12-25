import type { AppState, AppStateData } from '../state/AppState';

/**
 * Step 컴포넌트의 추상 기본 클래스
 *
 * 모든 Step 컴포넌트가 상속받아 구현해야 하는 기본 구조
 */
export abstract class BaseStep {
  protected state: AppState;
  protected unsubscribe: (() => void) | null = null;

  constructor(state: AppState) {
    this.state = state;
  }

  /**
   * Step 컴포넌트 초기화
   *
   * 이벤트 리스너 등록, 초기 데이터 로드 등
   */
  init(): void {
    // 상태 변경 구독
    this.unsubscribe = this.state.subscribe(this.onStateChange.bind(this));
  }

  /**
   * 상태 변경 시 호출되는 콜백
   *
   * @param _state - 변경된 상태
   */
  protected onStateChange(_state: Readonly<AppStateData>): void {
    // 하위 클래스에서 필요시 오버라이드
  }

  /**
   * Step UI 렌더링
   *
   * @returns HTML 문자열
   */
  abstract render(): string;

  /**
   * Step 정리 (구독 해제 등)
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
