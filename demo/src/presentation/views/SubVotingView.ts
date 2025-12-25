/**
 * Sub Voting View
 *
 * SubVoting 데모 화면 - 모든 Step 컴포넌트를 통합
 */

import { AppState } from '../state/AppState';
import type { BaseStep } from '../components/BaseStep';

// MainVoting에서 재사용할 Step 컴포넌트
import { Step1Executor } from '../components/steps/Step1Executor';
import { Step4Domain } from '../components/steps/Step4Domain';
import { Step6Digest } from '../components/steps/Step6Digest';

// SubVoting 전용 Step 컴포넌트
import { SubStep0Setup } from '../components/steps/subvoting/SubStep0Setup';
import { SubStep2Records } from '../components/steps/subvoting/SubStep2Records';

/**
 * SubVotingView - 전체 데모 화면 관리
 */
export class SubVotingView {
  private steps: BaseStep[] = [];
  private container: HTMLElement | null = null;

  constructor(private readonly state: AppState) {}

  /**
   * Step 컴포넌트들 초기화
   */
  private initializeSteps(): void {
    // Step 컴포넌트 인스턴스 생성
    const subStep0 = new SubStep0Setup(this.state);
    const step1 = new Step1Executor(this.state);
    const subStep2 = new SubStep2Records(this.state);
    const step4 = new Step4Domain(this.state);
    const step6 = new Step6Digest(this.state);

    this.steps = [
      subStep0,
      step1,
      subStep2,
      step4,
      step6,
    ];
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
            SubVoting Demo (TypeScript)
          </h1>
          <p class="text-gray-600">
            EIP-712 Typed Data 서명 및 SubVoting 컨트랙트 상호작용 데모
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
   * 네비게이션 도트 렌더링 (5개의 Step만 사용)
   */
  private renderNavDots(): string {
    const colors = [
      'bg-purple-500',  // SubStep0
      'bg-indigo-500',  // Step1
      'bg-blue-500',    // SubStep2
      'bg-emerald-500', // Step4
      'bg-yellow-500',  // Step6
    ];

    return Array.from({ length: 5 }, (_, i) => `
      <a href="#step${i}" class="block w-3 h-3 rounded-full ${colors[i]} opacity-70 hover:opacity-100 transition-opacity" title="Step ${i}"></a>
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
