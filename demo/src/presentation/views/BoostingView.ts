/**
 * Boosting View
 *
 * Boosting 데모 화면 - 모든 Step 컴포넌트를 통합
 */

import { AppState } from '../state/AppState';
import type { BaseStep } from '../components/BaseStep';

// Step 컴포넌트 imports
import { BoostStep0Setup } from '../components/steps/boosting/BoostStep0Setup';
import { Step1Executor } from '../components/steps/Step1Executor';
import { BoostStep2Record } from '../components/steps/boosting/BoostStep2Record';
import { Step4Domain } from '../components/steps/Step4Domain';
import { Step6Digest } from '../components/steps/Step6Digest';

/**
 * BoostingView - 전체 데모 화면 관리
 */
export class BoostingView {
  private steps: BaseStep[] = [];
  private container: HTMLElement | null = null;

  constructor(private readonly state: AppState) {}

  /**
   * Step 컴포넌트들 초기화
   */
  private initializeSteps(): void {
    // Step 컴포넌트 인스턴스 생성
    const step0 = new BoostStep0Setup(this.state);
    const step1 = new Step1Executor(this.state); // MainVoting의 Step1 재사용
    const step2 = new BoostStep2Record(this.state);
    const step4 = new Step4Domain(this.state); // MainVoting의 Step4 재사용
    const step6 = new Step6Digest(this.state); // MainVoting의 Step6 재사용

    this.steps = [step0, step1, step2, step4, step6];
  }

  /**
   * 메인 레이아웃 렌더링
   */
  render(): string {
    return `
      <div class="max-w-7xl mx-auto px-4 py-6">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            Boosting Demo (TypeScript)
          </h1>
          <p class="text-gray-600">
            EIP-712 Typed Data 서명 및 Boosting 컨트랙트 상호작용 데모
          </p>
        </div>

        <!-- Contract Address Input -->
        <div class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-gray-500">
          <h2 class="text-lg font-semibold mb-4">Contract Address</h2>
          <div class="flex gap-4">
            <input
              type="text"
              id="contractAddress"
              class="flex-1 px-4 py-2 border rounded-lg font-mono text-sm"
              placeholder="0x..."
            >
            <button
              id="loadContractBtn"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Load Contract
            </button>
          </div>
          <p id="contractStatus" class="mt-2 text-sm text-gray-500"></p>
        </div>

        <!-- Boosting 특징 안내 -->
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow p-6 mb-6 border-l-4 border-purple-500">
          <h2 class="text-lg font-semibold mb-3 text-purple-800">
            <i data-lucide="zap" class="w-5 h-5 inline"></i> Boosting vs MainVoting 핵심 차이
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="bg-white rounded p-3 border border-purple-200">
              <h3 class="font-semibold text-purple-700 mb-2">
                <i data-lucide="layers" class="w-4 h-4 inline"></i> 레코드 구조
              </h3>
              <ul class="text-gray-700 space-y-1 text-xs">
                <li>• <strong>단일 레코드 배치:</strong> UserBoostBatch의 record는 1개만</li>
                <li>• <strong>amt 필드 추가:</strong> 부스팅 포인트/토큰 수량</li>
                <li>• <strong>boostingWith 필드:</strong> 0=BP, 1=CELB</li>
              </ul>
            </div>
            <div class="bg-white rounded p-3 border border-purple-200">
              <h3 class="font-semibold text-purple-700 mb-2">
                <i data-lucide="bar-chart-3" class="w-4 h-4 inline"></i> 집계 방식
              </h3>
              <ul class="text-gray-700 space-y-1 text-xs">
                <li>• <strong>artistBpAmt:</strong> BP 총합</li>
                <li>• <strong>artistCelbAmt:</strong> CELB 총합</li>
                <li>• <strong>artistTotalAmt:</strong> 전체 부스팅 총합</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Step 컴포넌트들이 렌더링될 컨테이너 -->
        <div id="stepsContainer">
          <!-- Steps will be rendered here -->
        </div>

        <!-- Navigation Dots -->
        <div id="navDots" class="fixed right-4 top-1/2 transform -translate-y-1/2 space-y-2">
          ${this.renderNavDots()}
        </div>
      </div>
    `;
  }

  /**
   * 네비게이션 도트 렌더링
   */
  private renderNavDots(): string {
    const colors = [
      'bg-purple-500',
      'bg-indigo-500',
      'bg-blue-500',
      'bg-emerald-500',
      'bg-green-500',
    ];

    const stepLabels = ['Step 0', 'Step 1', 'Step 2', 'Step 4', 'Step 6'];

    return Array.from({ length: 5 }, (_, i) => `
      <a href="#boostStep${i}" class="block w-3 h-3 rounded-full ${colors[i]} opacity-70 hover:opacity-100 transition-opacity" title="${stepLabels[i]}"></a>
    `).join('');
  }

  /**
   * 화면 마운트
   */
  mount(container: HTMLElement): void {
    this.container = container;

    // 메인 레이아웃 렌더링
    container.innerHTML = this.render();

    // Step 컴포넌트 초기화
    this.initializeSteps();

    // Steps 컨테이너에 각 Step 렌더링
    const stepsContainer = document.getElementById('stepsContainer');
    if (stepsContainer) {
      stepsContainer.innerHTML = this.steps.map(step => step.render()).join('');
    }

    // 각 Step 초기화 (이벤트 리스너 등록)
    this.steps.forEach(step => step.init());

    // Contract Address 이벤트 리스너
    this.attachContractAddressListener();

    // Lucide 아이콘 초기화
    if (typeof (window as any).lucide !== 'undefined') {
      (window as any).lucide.createIcons();
    }
  }

  /**
   * Contract Address 이벤트 리스너 등록
   */
  private attachContractAddressListener(): void {
    const input = document.getElementById('contractAddress') as HTMLInputElement | null;
    const loadBtn = document.getElementById('loadContractBtn');
    const status = document.getElementById('contractStatus');

    if (input) {
      input.addEventListener('input', () => {
        const address = input.value.trim();
        if (address && address.startsWith('0x') && address.length === 42) {
          this.state.setState({ contractAddress: address as `0x${string}` });
          if (status) status.textContent = `Contract Address set: ${address}`;
        }
      });
    }

    if (loadBtn) {
      loadBtn.addEventListener('click', () => {
        const address = input?.value.trim();
        if (address && address.startsWith('0x') && address.length === 42) {
          this.state.setState({ contractAddress: address as `0x${string}` });
          if (status) {
            status.textContent = `Contract loaded: ${address}`;
            status.className = 'mt-2 text-sm text-green-600';
          }
        } else {
          if (status) {
            status.textContent = 'Invalid contract address';
            status.className = 'mt-2 text-sm text-red-600';
          }
        }
      });
    }
  }

  /**
   * 화면 언마운트
   */
  unmount(): void {
    // 각 Step destroy 호출
    this.steps.forEach(step => step.destroy());
    this.steps = [];

    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}
