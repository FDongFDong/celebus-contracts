/**
 * Main Application Entry Point
 * 모든 Step 컴포넌트를 통합하고 애플리케이션을 초기화합니다
 */

import { Step0Setup } from './components/step0-setup.js';
import { Step1Executor } from './components/step1-executor.js';
import { Step2Records } from './components/step2-records.js';
import { Step3UserSigs } from './components/step3-user-sigs.js';
import { Step4Domain } from './components/step4-domain.js';
import { Step5Struct } from './components/step5-struct.js';
import { Step6Digest } from './components/step6-digest.js';
import { Step7Submit } from './components/step7-submit.js';
import { Step8Query } from './components/step8-query.js';

class MainVotingApp {
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
      contractAddress: '0x509c27A029620Ac71F42653440892dcb73E13BEf',

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
      step8: new Step8Query(this.state)
    };

    this.init();
  }

  async init() {
    console.log('[INIT] MainVoting App Initializing...');
    this.render();
    this.attachEventListeners();
    this.setupInterStepCommunication();
    this.setupContractAddressSync();

    // STEP 0 초기화 (배포 기능 포함 - async)
    if (this.steps.step0) {
      await this.steps.step0.init();
    }

    console.log('[SUCCESS] MainVoting App Ready!');
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
      </div>
    `;
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
            this.steps.step6.loadPreviousResults();
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
            this.steps.step6.loadPreviousResults();
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
}

// Initialize App on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new MainVotingApp();

  // Lucide 아이콘 초기화
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

// Export for debugging
export { MainVotingApp };
