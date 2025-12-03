/**
 * Main Application Entry Point
 * 모든 Step 컴포넌트를 통합하고 애플리케이션을 초기화합니다
 */

import { CONFIG } from './config.js';
import { Step0Setup } from './components/step0-setup.js';
import { Step1Executor } from './components/step1-executor.js';
import { Step2Records } from './components/step2-records.js';
import { Step3UserSigs } from './components/step3-user-sigs.js';
import { Step4Domain } from './components/step4-domain.js';
import { Step5Struct } from './components/step5-struct.js';
import { Step6Digest } from './components/step6-digest.js';
import { Step7Submit } from './components/step7-submit.js';
import { Step8Query } from './components/step8-query.js';

class SubVotingApp {
  constructor() {
    // Global State
    this.state = {
      // Wallets
      ownerWallet: null,
      executorWallet: null,
      user1Wallet: null,
      user2Wallet: null,

      // Records (1차원 배열 - SubVoting 특성)
      records: [],
      userSigs: [],

      // EIP-712 Components
      domain: null,
      domainSeparator: null,
      batchNonce: 0,
      batchTypeHash: null,
      structHash: null,
      finalDigest: null,

      // Signatures
      executorSig: null,

      // Contract - CONFIG에서 가져옴 (배포 후 "배포된 주소 적용" 버튼으로 갱신)
      contractAddress: CONFIG.VOTING_ADDRESS,

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

  init() {
    console.log('🚀 SubVoting App Initializing...');
    this.render();
    this.attachEventListeners();
    this.setupInterStepCommunication();
    this.setupContractAddressSync();

    // STEP 0 초기화
    if (this.steps.step0) {
      this.steps.step0.init();
    }

    console.log('✅ SubVoting App Ready!');
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
          // State 업데이트
          this.state.contractAddress = newAddress;

          // STEP 4의 Verifying Contract 필드 업데이트
          const verifyingContractInput = document.getElementById('verifyingContract');
          if (verifyingContractInput) {
            verifyingContractInput.value = newAddress;
          }

          console.log('📝 Contract address updated:', newAddress);
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
    console.log('📡 Event Listeners Attached');
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

    // Step 6 Digest 계산 완료 시 Step 7 요약 업데이트
    const digestCalcBtn = document.querySelector('[onclick="step6.calculateDigest()"]');
    if (digestCalcBtn) {
      digestCalcBtn.addEventListener('click', () => {
        setTimeout(() => {
          if (this.state.finalDigest) {
            this.steps.step7.updateSummary();
            this.steps.step7.generateRemixParams();
          }
        }, 100);
      });
    }

    // Step 6 Executor 서명 완료 시 Step 7 요약 업데이트
    const sigGenBtn = document.querySelector('[onclick="step6.generateSignature()"]');
    if (sigGenBtn) {
      sigGenBtn.addEventListener('click', () => {
        setTimeout(() => {
          this.steps.step7.updateSummary();
          this.steps.step7.generateRemixParams();
        }, 100);
      });
    }

    // Step 2 레코드 추가 시 Step 7 요약 업데이트
    const createRecordBtn = document.querySelector('[onclick="step2.createRecord()"]');
    if (createRecordBtn) {
      createRecordBtn.addEventListener('click', () => {
        setTimeout(() => {
          this.steps.step7.updateSummary();
          this.steps.step7.generateRemixParams();
        }, 100);
      });
    }

    // Step 3 사용자 서명 완료 시 Step 7 요약 업데이트
    const userASignBtn = document.querySelector('[onclick="step3.signUserBatch(0)"]');
    const userBSignBtn = document.querySelector('[onclick="step3.signUserBatch(1)"]');

    if (userASignBtn) {
      userASignBtn.addEventListener('click', () => {
        setTimeout(() => {
          this.steps.step7.updateSummary();
          this.steps.step7.generateRemixParams();
        }, 100);
      });
    }

    if (userBSignBtn) {
      userBSignBtn.addEventListener('click', () => {
        setTimeout(() => {
          this.steps.step7.updateSummary();
          this.steps.step7.generateRemixParams();
        }, 100);
      });
    }

    console.log('🔗 Inter-Step Communication Setup Complete');
  }

  // Utility: Show Toast Notification
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);

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
  window.app = new SubVotingApp();
});

// Export for debugging
export { SubVotingApp };
