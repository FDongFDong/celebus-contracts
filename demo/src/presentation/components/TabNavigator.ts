/**
 * Tab Navigator Component
 *
 * 3개 탭(MainVoting, SubVoting, Boosting) 전환 관리
 */

export type TabId = 'main' | 'sub' | 'boosting';

export interface Tab {
  id: TabId;
  label: string;
  active: boolean;
}

export class TabNavigator {
  private tabs: Tab[];
  private activeTab: TabId;
  private onTabChange: ((tabId: TabId) => void) | null = null;

  constructor(initialTab: TabId = 'main') {
    this.activeTab = initialTab;
    this.tabs = [
      { id: 'main', label: 'Main Voting', active: initialTab === 'main' },
      { id: 'sub', label: 'Sub Voting', active: initialTab === 'sub' },
      { id: 'boosting', label: 'Boosting', active: initialTab === 'boosting' },
    ];
  }

  render(): string {
    return `
      <div class="tab-nav">
        ${this.tabs
          .map(
            (tab) => `
          <button
            class="tab-btn ${tab.active ? 'active' : ''}"
            data-tab="${tab.id}"
          >
            ${tab.label}
          </button>
        `
          )
          .join('')}
      </div>
    `;
  }

  switchTo(tabId: TabId): void {
    if (this.activeTab === tabId) return;

    this.tabs = this.tabs.map((tab) => ({
      ...tab,
      active: tab.id === tabId,
    }));

    this.activeTab = tabId;

    // DOM 업데이트
    this.updateDOM();

    // 콜백 실행
    if (this.onTabChange) {
      this.onTabChange(tabId);
    }
  }

  setOnTabChange(callback: (tabId: TabId) => void): void {
    this.onTabChange = callback;
  }

  getActiveTab(): TabId {
    return this.activeTab;
  }

  attachEventListeners(): void {
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tabId = target.dataset['tab'] as TabId;
        if (tabId) {
          this.switchTo(tabId);
        }
      });
    });
  }

  private updateDOM(): void {
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach((btn) => {
      const btnElement = btn as HTMLElement;
      const tabId = btnElement.dataset['tab'];
      if (tabId === this.activeTab) {
        btnElement.classList.add('active');
      } else {
        btnElement.classList.remove('active');
      }
    });
  }
}
