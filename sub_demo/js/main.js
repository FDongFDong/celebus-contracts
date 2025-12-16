/**
 * Main Application Entry Point
 * 모든 Step 컴포넌트를 통합하고 애플리케이션을 초기화합니다
 */

import { Step0Setup } from './components/step0-setup.js?v=4';
import { Step1Executor } from './components/step1-executor.js?v=4';
import { Step2Records } from './components/step2-records.js?v=4';
import { Step3UserSigs } from './components/step3-user-sigs.js?v=4';
import { Step4Domain } from './components/step4-domain.js?v=4';
import { Step5Struct } from './components/step5-struct.js?v=4';
import { Step6Digest } from './components/step6-digest.js?v=4';
import { Step7Submit } from './components/step7-submit.js?v=4';
import { Step8Query } from './components/step8-query.js?v=4';
import { Step9Events } from './components/step9-events.js?v=4';

class SubVotingApp {
  constructor() {
    // Global State
    this.state = {
      // Wallets
      ownerWallet: null,
      executorWallet: null,
      user1Wallet: null,
      user2Wallet: null,

      // Records
      records: [],
      userBatchSigs: [],

      // EIP-712 Components
      domain: null,
      domainSeparator: null,
      batchNonce: 0,
      batchTypeHash: null,
      structHash: null,
      finalDigest: null,

      // Signatures
      executorSig: null,

      // Contract
      contractAddress: 'NEW_CONTRACT_ADDRESS',

      // Provider
      provider: new ethers.JsonRpcProvider('https://opbnb-testnet-rpc.bnbchain.org')
    };

    // Initialize Step Components
    this.steps = {
      step0: new Step0Setup(this.state),
      step1: new Step1Executor(this.state),
      step2: new Step2Records(this.state),
      step3: new Step3UserSigs(this.state),
      step4: new Step4Domain(this.state),
      step5: new Step5Struct(this.state),
      step6: new Step6Digest(this.state),
      step7: new Step7Submit(this.state),
      step8: new Step8Query(this.state),
      step9: new Step9Events(this.state)
    };

    // Step 7 → Step 9 연동 (자동 이벤트 파싱)
    this.steps.step7.setEventCallback((receipt, txHash) => {
      this.steps.step9.addEventsFromReceipt(receipt, txHash);
    });

    this.init();
  }

  async init() {
    console.log('[INIT] SubVoting App Initializing...');
    this.render();
    this.attachEventListeners();
    this.setupInterStepCommunication();
    this.setupContractAddressSync();

    // STEP 0 초기화 (배포 기능 포함 - async)
    if (this.steps.step0) {
      await this.steps.step0.init();
    }

    console.log('[SUCCESS] SubVoting App Ready!');
  }

  /**
   * 컨트랙트 주소 변경 시 STEP 4 Verifying Contract도 자동 업데이트
   */
  setupContractAddressSync() {
    const contractAddressInput = document.getElementById('contractAddress');
    if (contractAddressInput) {
      contractAddressInput.addEventListener('input', (e) => {
        const newAddress = e.target.value.trim();
        if (newAddress && ethers.isAddress(newAddress)) {
          const oldAddress = this.state.contractAddress;

          // State 업데이트
          this.state.contractAddress = newAddress;

          // STEP 4의 Verifying Contract 필드 업데이트
          const verifyingContractInput = document.getElementById('verifyingContract');
          if (verifyingContractInput) {
            verifyingContractInput.value = newAddress;
          }

          // 주소가 실제로 변경된 경우 기존 서명 무효화
          if (oldAddress && oldAddress.toLowerCase() !== newAddress.toLowerCase()) {
            if (this.state.userBatchSigs && this.state.userBatchSigs.length > 0) {
              this.state.userBatchSigs = [];
              console.log('[WARN] 컨트랙트 주소 변경으로 기존 서명이 초기화되었습니다');

              // STEP 3 UI 초기화
              const user1Sig = document.getElementById('user1Signature');
              const user2Sig = document.getElementById('user2Signature');
              const user1Result = document.getElementById('user1SigResult');
              const user2Result = document.getElementById('user2SigResult');

              if (user1Sig) user1Sig.value = '';
              if (user2Sig) user2Sig.value = '';
              if (user1Result) user1Result.innerHTML = '<p class="text-yellow-600"><i data-lucide="alert-triangle" class="w-4 h-4 inline"></i> 컨트랙트 주소 변경됨 - 서명 재생성 필요</p>';
              if (user2Result) user2Result.innerHTML = '<p class="text-yellow-600"><i data-lucide="alert-triangle" class="w-4 h-4 inline"></i> 컨트랙트 주소 변경됨 - 서명 재생성 필요</p>';
            }

            // Executor 서명도 초기화
            if (this.state.executorSig) {
              this.state.executorSig = null;
              const executorSigEl = document.getElementById('executorSignature');
              if (executorSigEl) executorSigEl.value = '';
            }
          }

          console.log('[INFO] Contract address updated:', newAddress);
        }
      });
    }
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="space-y-6">
        ${this.steps.step1.render()}
        ${this.steps.step2.render()}
        ${this.steps.step3.render()}
        ${this.steps.step4.render()}
        ${this.steps.step5.render()}
        ${this.steps.step6.render()}
        ${this.steps.step7.render()}
        ${this.steps.step8.render()}
        ${this.renderStep9()}
      </div>
    `;
    // Step 9 초기화
    if (this.steps.step9) {
      this.steps.step9.init();
    }
    // 동적으로 생성된 아이콘 초기화
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  attachEventListeners() {
    // 전역 스코프에 step 인스턴스 노출 (onclick 동작용)
    window.step0 = this.steps.step0;
    window.step1 = this.steps.step1;
    window.step2 = this.steps.step2;
    window.step3 = this.steps.step3;
    window.step4 = this.steps.step4;
    window.step5 = this.steps.step5;
    window.step6 = this.steps.step6;
    window.step7 = this.steps.step7;
    window.step8 = this.steps.step8;
    window.step9 = this.steps.step9;

    // State 변경 감지 (디버깅용)
    console.log('[EVENT] Event Listeners Attached');
  }

  setupInterStepCommunication() {
    // Step 간 데이터 자동 전파 설정

    // User 선택 변경 시 userId 자동 업데이트 및 User Nonce 조회
    const userSelect = document.getElementById('selectedUser');
    if (userSelect) {
      userSelect.addEventListener('change', (e) => {
        const userIndex = parseInt(e.target.value);
        const userIdInput = document.getElementById('userId');
        if (userIdInput) {
          userIdInput.value = userIndex === 0 ? '사용자A' : '사용자B';
        }

        // User Nonce 자동 조회
        if (this.steps.step2 && this.steps.step2.fetchUserNonce) {
          this.steps.step2.fetchUserNonce();
        }
      });
    }

    // Step 4 완료 시 Step 6에 자동 복사
    const domainSeparatorCalcBtn = document.querySelector('[onclick="step4.calculate()"]');
    if (domainSeparatorCalcBtn) {
      domainSeparatorCalcBtn.addEventListener('click', () => {
        setTimeout(() => {
          if (this.state.domainSeparator) {
            if (typeof this.steps.step6?.loadPreviousResults === 'function') {
              this.steps.step6.loadPreviousResults();
            }
          }
        }, 100);
      });
    }

    // Step 5 완료 시 Step 6에 자동 복사
    const structHashCalcBtn = document.querySelector('[onclick="step5.calculate()"]');
    if (structHashCalcBtn) {
      structHashCalcBtn.addEventListener('click', () => {
        setTimeout(() => {
          if (this.state.structHash) {
            if (typeof this.steps.step6?.loadPreviousResults === 'function') {
              this.steps.step6.loadPreviousResults();
            }
          }
        }, 100);
      });
    }

    // Step 6 완료 시 Step 7 요약 업데이트
    const digestCalcBtn = document.querySelector('[onclick="step6.calculateDigest()"]');
    if (digestCalcBtn) {
      digestCalcBtn.addEventListener('click', () => {
        setTimeout(() => {
          this.steps.step7.updateSummary();
          this.steps.step7.generateRemixParams();
        }, 100);
      });
    }

    // Step 6 서명 완료 시 Step 7 요약 업데이트
    const sigGenBtn = document.querySelector('[onclick="step6.generateSignature()"]');
    if (sigGenBtn) {
      sigGenBtn.addEventListener('click', () => {
        setTimeout(() => {
          this.steps.step7.updateSummary();
          this.steps.step7.generateRemixParams();
        }, 100);
      });
    }

    console.log('[LINK] Inter-Step Communication Setup Complete');
  }

  // Utility: Show Toast Notification
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="flex items-center">
        <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}" class="w-4 h-4 inline mr-2"></i>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Utility: Reset All Steps
  resetAll() {
    if (confirm('모든 데이터를 초기화하시겠습니까?')) {
      location.reload();
    }
  }

  /**
   * Step 9: UserMissionResult 이벤트 조회 UI 렌더링
   */
  renderStep9() {
    return `
      <div class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-purple-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-purple-500">STEP 9</span>
          <i data-lucide="bell" class="w-5 h-5 inline"></i> UserMissionResult 이벤트 조회
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          트랜잭션의 UserMissionResult 이벤트를 조회하고 실패 알림을 확인합니다
        </p>

        <!-- 트랜잭션 해시로 조회 -->
        <div class="mb-6 p-4 bg-purple-50 rounded-lg">
          <h3 class="font-semibold text-purple-900 mb-3">
            <i data-lucide="search" class="w-4 h-4 inline"></i> 트랜잭션 해시로 조회
          </h3>
          <div class="flex gap-2">
            <input
              type="text"
              id="txHashInput"
              class="flex-1 px-3 py-2 border rounded-md font-mono text-sm"
              placeholder="0x..."
            >
            <button
              id="queryByTxBtn"
              class="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition"
            >
              <i data-lucide="search" class="w-4 h-4 inline"></i> 조회
            </button>
          </div>
        </div>

        <!-- 블록 범위로 조회 -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold text-gray-700 mb-3">
            <i data-lucide="layers" class="w-4 h-4 inline"></i> 블록 범위로 조회
          </h3>
          <div class="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">From Block</label>
              <input
                type="number"
                id="fromBlock"
                class="w-full px-3 py-2 border rounded-md"
                placeholder="시작 블록"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">To Block</label>
              <input
                type="number"
                id="toBlock"
                class="w-full px-3 py-2 border rounded-md"
                placeholder="latest"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Voting ID (선택)</label>
              <input
                type="number"
                id="votingIdFilter"
                class="w-full px-3 py-2 border rounded-md"
                placeholder="필터링"
              >
            </div>
          </div>
          <button
            id="queryByBlockBtn"
            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
          >
            <i data-lucide="search" class="w-4 h-4 inline"></i> 블록 범위 조회
          </button>
        </div>

        <!-- 조회 결과 테이블 -->
        <div class="mb-6">
          <h3 class="font-semibold text-gray-800 mb-3">
            <i data-lucide="list" class="w-4 h-4 inline"></i> 조회 결과
            <span id="eventSourceLabel" class="text-sm font-normal text-gray-500"></span>
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="bg-gray-100">
                  <th class="border px-3 py-2 text-left">#</th>
                  <th class="border px-3 py-2 text-left">Voting ID</th>
                  <th class="border px-3 py-2 text-left">성공여부</th>
                  <th class="border px-3 py-2 text-left">실패 레코드 수</th>
                  <th class="border px-3 py-2 text-left">실패 사유</th>
                  <th class="border px-3 py-2 text-left">상세</th>
                </tr>
              </thead>
              <tbody id="eventResultsBody">
                <tr><td colspan="6" class="border px-3 py-4 text-center text-gray-500">조회된 이벤트가 없습니다</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 실패 알림 영역 -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-red-800">
              <i data-lucide="alert-triangle" class="w-4 h-4 inline"></i> 실패 알림
            </h3>
            <button
              id="clearAlertsBtn"
              class="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition"
            >
              <i data-lucide="trash-2" class="w-3 h-3 inline"></i> 알림 클리어
            </button>
          </div>
          <div id="failureAlerts" class="space-y-3">
            <!-- 알림 카드가 동적으로 추가됩니다 -->
          </div>
        </div>

        <!-- 에러 메시지 -->
        <div id="step9Error" class="hidden bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p class="text-red-700 text-sm"></p>
        </div>

        <!-- 로그 출력 -->
        <details class="mt-4">
          <summary class="cursor-pointer text-gray-600 text-sm hover:text-gray-800">
            <i data-lucide="terminal" class="w-4 h-4 inline"></i> 로그 보기
          </summary>
          <div id="step9Log" class="mt-2 p-3 bg-gray-900 text-green-400 rounded font-mono text-xs h-32 overflow-y-auto">
          </div>
        </details>
      </div>
    `;
  }
}

// Initialize App on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new SubVotingApp();

  // Lucide 아이콘 초기화
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

// Export for debugging
export { SubVotingApp };
