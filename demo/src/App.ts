/**
 * Main Application Entry
 *
 * TabNavigator와 각 Demo View를 통합
 */

import { TabNavigator } from './presentation/components/TabNavigator';
import { AppState } from './presentation/state/AppState';
import { MainVotingView } from './presentation/views/MainVotingView';
import { SubVotingView } from './presentation/views/SubVotingView';
import { BoostingView } from './presentation/views/BoostingView';

export class App {
  private tabNav: TabNavigator;
  private appState: AppState;
  private mainView: MainVotingView;
  private subView: SubVotingView;
  private boostingView: BoostingView;
  private currentView: MainVotingView | SubVotingView | BoostingView | null = null;

  constructor() {
    this.tabNav = new TabNavigator('main');

    // 전역 상태 초기화 (모든 탭이 공유)
    this.appState = new AppState();

    // 각 뷰 초기화
    this.mainView = new MainVotingView(this.appState);
    this.subView = new SubVotingView(this.appState);
    this.boostingView = new BoostingView(this.appState);
  }

  init(): void {
    this.render();
    this.attachEventListeners();
    this.renderActiveView();
  }

  private render(): void {
    const app = document.getElementById('app');
    if (!app) {
      throw new Error('App container not found');
    }

    app.innerHTML = `
      <div class="container">
        <header>
          <h1>Celebus Demo Application</h1>
        </header>
        ${this.tabNav.render()}
        <div id="tab-content"></div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // TabNavigator 이벤트 리스너 등록
    this.tabNav.attachEventListeners();

    // 탭 변경 콜백 설정
    this.tabNav.setOnTabChange(() => {
      this.renderActiveView();
    });
  }

  private renderActiveView(): void {
    const container = document.getElementById('tab-content');
    if (!container) return;

    // 이전 뷰 언마운트
    if (this.currentView) {
      this.currentView.unmount();
    }

    // 활성 탭에 따라 뷰 마운트
    const activeTab = this.tabNav.getActiveTab();
    switch (activeTab) {
      case 'main':
        this.currentView = this.mainView;
        break;
      case 'sub':
        this.currentView = this.subView;
        break;
      case 'boosting':
        this.currentView = this.boostingView;
        break;
    }

    this.currentView.mount(container);
  }
}
