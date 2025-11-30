/**
 * STEP 7: 컨트랙트 제출
 * SubVoting: 1차원 배열로 제출
 */

import { CONFIG, getContractInstance } from '../config.js';

export class Step7Submit {
  constructor(state) {
    this.state = state;
  }

  render() {
    return `
      <section class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-red-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-red-500">STEP 7</span>
          🚀 컨트랙트 제출(Backend)
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          모든 데이터를 컨트랙트에 제출합니다
        </p>

        <!-- 백엔드 userId 주입 시뮬레이션 -->
        <div class="mb-6 p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded">
          <h3 class="font-semibold text-indigo-900 mb-2">
            🔄 Backend: userId 자동 주입
          </h3>
          <p class="text-sm text-indigo-800 mb-3">
            백엔드가 각 userAddress를 기반으로 DB에서 userId를 조회하여 레코드에 주입합니다.
          </p>
          <div id="userIdInjectionStatus" class="bg-white rounded border border-indigo-200 p-3">
            <p class="text-xs text-gray-600 mb-2">DB 조회 결과:</p>
            <div id="userIdMappingList" class="text-xs font-mono space-y-1">
              <!-- 동적으로 채워짐 -->
            </div>
          </div>
        </div>

        <!-- 제출 전 요약 -->
        <div class="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
          <p class="font-semibold text-gray-800 mb-2">📋 제출 데이터 요약:</p>
          <ul class="text-sm text-gray-700 space-y-1">
            <li>• 총 레코드: <span id="submitRecordCount">0</span>개</li>
            <li>• User 서명: <span id="submitUserSigCount">0</span>개</li>
            <li>• 사용자별 레코드: <span id="submitUserRecordBreakdown">-</span></li>
            <li>• Batch Nonce: <span id="submitBatchNonce">-</span></li>
            <li>• Executor 서명: <span id="submitExecutorSig">없음</span></li>
          </ul>
        </div>

        <!-- Remix 파라미터 표시 -->
        <details class="mb-4">
          <summary class="cursor-pointer text-blue-600 font-semibold hover:text-blue-800">
            🔧 Remix 제출용 파라미터 보기
          </summary>
          <div id="remixParams" class="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p class="text-xs text-gray-600 mb-3">
              📝 각 파라미터를 개별적으로 복사하여 Remix IDE에 붙여넣으세요
            </p>

            <!-- 1. batches 파라미터 (UserVoteBatch[]) -->
            <div class="mb-4 bg-white rounded border border-blue-300 p-3">
              <div class="flex items-center justify-between mb-2">
                <p class="font-semibold text-sm text-blue-900">1️⃣ batches (UserVoteBatch[])</p>
                <button onclick="step7.copyParam('batches')"
                        class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                  📋 복사
                </button>
              </div>
              <textarea id="remixParam_batches"
                        class="w-full h-48 p-2 font-mono text-xs bg-gray-50 border rounded"
                        readonly></textarea>
            </div>

            <!-- 2. batchNonce 파라미터 -->
            <div class="mb-4 bg-white rounded border border-blue-300 p-3">
              <div class="flex items-center justify-between mb-2">
                <p class="font-semibold text-sm text-blue-900">2️⃣ batchNonce (uint256)</p>
                <button onclick="step7.copyParam('batchNonce')"
                        class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                  📋 복사
                </button>
              </div>
              <input id="remixParam_batchNonce"
                     type="text"
                     class="w-full p-2 font-mono text-sm bg-gray-50 border rounded"
                     readonly>
            </div>

            <!-- 3. executorSig 파라미터 -->
            <div class="mb-4 bg-white rounded border border-blue-300 p-3">
              <div class="flex items-center justify-between mb-2">
                <p class="font-semibold text-sm text-blue-900">3️⃣ executorSig (bytes)</p>
                <button onclick="step7.copyParam('executorSig')"
                        class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                  📋 복사
                </button>
              </div>
              <input id="remixParam_executorSig"
                     type="text"
                     class="w-full p-2 font-mono text-xs bg-gray-50 border rounded"
                     readonly>
            </div>

            <div class="mt-3 bg-yellow-50 border border-yellow-300 rounded p-2">
              <p class="text-xs text-yellow-900">
                💡 <strong>Remix 사용법:</strong> 각 파라미터를 위에서 아래 순서대로 복사하여 Remix IDE의 submitMultiUserBatch 함수 입력란에 붙여넣으세요
              </p>
            </div>
          </div>
        </details>

        <!-- 제출 버튼 -->
        <button id="submitButton" onclick="step7.submit()"
                class="bg-red-500 text-white px-6 py-3 rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed w-full">
          <span id="submitButtonText">🚀 컨트랙트에 제출</span>
        </button>
        
        <!-- 로딩 상태 -->
        <div id="submitLoading" class="mt-4 hidden">
          <div class="bg-blue-50 border border-blue-200 rounded p-4">
            <div class="flex items-center">
              <svg class="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div>
                <p class="font-semibold text-blue-900">트랜잭션 처리 중...</p>
                <p class="text-sm text-blue-700" id="loadingStatusText">가스 추정 중...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 제출 결과 -->
        <div id="submitResult" class="mt-4 hidden"></div>
      </section>
    `;
  }

  updateSummary() {
    // userId 매핑 표시 (백엔드 DB 조회 시뮬레이션)
    if (this.state.records && this.state.records.length > 0) {
      const uniqueUsers = new Map();
      this.state.records.forEach(r => {
        if (!uniqueUsers.has(r.userAddress)) {
          uniqueUsers.set(r.userAddress, r.userId);
        }
      });

      const mappingHTML = Array.from(uniqueUsers.entries()).map(([address, userId]) =>
        `<div class="text-green-700">
          ✓ ${address.slice(0, 6)}...${address.slice(-4)} → userId: "${userId}"
        </div>`
      ).join('');

      const mappingList = document.getElementById('userIdMappingList');
      if (mappingList) {
        mappingList.innerHTML = mappingHTML;
      }
    }

    // 레코드 수
    const recordCount = this.state.records ? this.state.records.length : 0;
    const recordCountEl = document.getElementById('submitRecordCount');
    if (recordCountEl) recordCountEl.textContent = recordCount;

    // User 서명 수
    const userSigCount = this.state.userSigs ? this.state.userSigs.length : 0;
    const userSigCountEl = document.getElementById('submitUserSigCount');
    if (userSigCountEl) userSigCountEl.textContent = userSigCount;

    // 사용자별 레코드 수 계산
    if (this.state.records && this.state.records.length > 0) {
      const userACount = this.state.records.filter(r => r.userIndex === 0).length;
      const userBCount = this.state.records.filter(r => r.userIndex === 1).length;
      const breakdown = [];
      if (userACount > 0) breakdown.push(`사용자 A: ${userACount}개`);
      if (userBCount > 0) breakdown.push(`사용자 B: ${userBCount}개`);
      
      const breakdownEl = document.getElementById('submitUserRecordBreakdown');
      if (breakdownEl) {
        breakdownEl.textContent = breakdown.join(', ') || '-';
      }
    }

    // Batch Nonce
    const batchNonceEl = document.getElementById('submitBatchNonce');
    if (batchNonceEl) {
      batchNonceEl.textContent = this.state.batchNonce !== undefined ? this.state.batchNonce : '-';
    }

    // Executor 서명
    const execSig = this.state.executorSig ? '있음 ✅' : '없음 ❌';
    const execSigEl = document.getElementById('submitExecutorSig');
    if (execSigEl) execSigEl.textContent = execSig;
  }

  generateRemixParams() {
    // UserVoteBatch[] 배열 생성 - record + userSig 쌍으로 묶음 (객체 형태)
    const batches = this.state.records.map((r, idx) => {
      const userSig = this.state.userSigs[idx];
      return {
        record: {
          timestamp: r.timestamp,
          missionId: r.missionId,
          votingId: r.votingId,
          userId: r.userId,
          questionId: r.questionId,
          optionId: r.optionId,
          votingAmt: r.votingAmt
        },
        userSig: {
          user: userSig.user,
          userNonce: userSig.userNonce,
          signature: userSig.signature
        }
      };
    });

    // 각 파라미터를 개별 필드에 설정
    const batchesEl = document.getElementById('remixParam_batches');
    const batchNonceEl = document.getElementById('remixParam_batchNonce');
    const executorSigEl = document.getElementById('remixParam_executorSig');

    if (batchesEl) batchesEl.value = JSON.stringify(batches, null, 2);
    if (batchNonceEl) batchNonceEl.value = this.state.batchNonce !== undefined ? this.state.batchNonce : 0;
    if (executorSigEl) executorSigEl.value = this.state.executorSig || '';

    console.log('📋 Remix params generated (UserVoteBatch format)');
  }

  copyParam(paramName) {
    const elementId = `remixParam_${paramName}`;
    const element = document.getElementById(elementId);

    if (!element) {
      alert('❌ 파라미터를 찾을 수 없습니다.');
      return;
    }

    // 값 복사
    element.select();
    element.setSelectionRange(0, 99999);

    try {
      document.execCommand('copy');

      // 복사 성공 피드백
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = '✅ 복사됨!';
      button.classList.remove('bg-blue-500', 'hover:bg-blue-600');
      button.classList.add('bg-green-500');

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-500');
        button.classList.add('bg-blue-500', 'hover:bg-blue-600');
      }, 2000);

    } catch (err) {
      alert('❌ 복사에 실패했습니다: ' + err.message);
    }

    window.getSelection().removeAllRanges();
  }

  async submit() {
    if (!this.state.records || this.state.records.length === 0) {
      alert('먼저 STEP 2에서 레코드를 생성해주세요!');
      return;
    }

    if (!this.state.userSigs || this.state.userSigs.length === 0) {
      alert('먼저 STEP 3에서 사용자 서명을 생성해주세요!');
      return;
    }

    if (!this.state.executorSig) {
      alert('먼저 STEP 6에서 Executor 서명을 생성해주세요!');
      return;
    }

    if (!this.state.executorWallet) {
      alert('먼저 STEP 1에서 Executor 지갑을 로드해주세요!');
      return;
    }

    this.setLoadingState(true, '트랜잭션 준비 중...');

    try {
      // UserVoteBatch[] 구조체 배열 - record + userSig 쌍으로 묶음
      const batches = this.state.records.map((r, idx) => ({
        record: {
          timestamp: r.timestamp,
          missionId: r.missionId,
          votingId: r.votingId,
          userId: r.userId,
          questionId: r.questionId,
          optionId: r.optionId,
          votingAmt: r.votingAmt
        },
        userSig: {
          user: this.state.userSigs[idx].user,
          userNonce: this.state.userSigs[idx].userNonce,
          signature: this.state.userSigs[idx].signature
        }
      }));

      console.log('📤 Submitting to contract (UserVoteBatch format):', {
        batches: batches.length,
        batchNonce: this.state.batchNonce
      });

      this.setLoadingState(true, '컨트랙트 호출 중...');
      const contract = getContractInstance(this.state.executorWallet, this.state.contractAddress);

      const tx = await contract.submitMultiUserBatch(
        batches,
        this.state.batchNonce,
        this.state.executorSig
      );

      this.setLoadingState(true, `트랜잭션 확인 대기 중... (${tx.hash.substring(0, 10)}...)`);
      console.log('⏳ Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      this.setLoadingState(false);

      // 성공 결과 표시
      const resultDiv = document.getElementById('submitResult');
      resultDiv.className = 'mt-4 bg-green-50 border border-green-200 rounded p-4';
      resultDiv.innerHTML = `
        <h3 class="font-semibold text-green-800 mb-2">✅ 제출 성공!</h3>
        <div class="text-sm text-gray-700 space-y-1">
          <p>트랜잭션: <span class="font-mono text-xs break-all">${receipt.hash}</span></p>
          <p>블록: ${receipt.blockNumber}</p>
          <p>가스 사용: ${receipt.gasUsed.toString()}</p>
        </div>
      `;
      resultDiv.classList.remove('hidden');

      // 투표 결과 확인
      await this.checkVoteResults();

    } catch (error) {
      console.error('❌ Transaction failed:', error);
      this.setLoadingState(false);

      const resultDiv = document.getElementById('submitResult');
      resultDiv.className = 'mt-4 bg-red-50 border border-red-200 rounded p-4';
      resultDiv.innerHTML = `
        <p class="font-semibold text-red-900 mb-2">❌ 제출 실패</p>
        <p class="text-sm text-gray-700">${error.message}</p>
      `;
      resultDiv.classList.remove('hidden');
    }
  }

  async checkVoteResults() {
    try {
      const contract = getContractInstance(this.state.provider, this.state.contractAddress);

      // 첫 번째 레코드의 질문 집계 조회
      const firstRecord = this.state.records[0];
      const [optionVotes, total] = await contract.getQuestionAggregates(
        firstRecord.missionId,
        firstRecord.questionId
      );

      console.log('📊 Vote results:', {
        optionVotes: optionVotes.map((v, i) => `Option ${i}: ${v.toString()}`),
        total: total.toString()
      });

      const resultDiv = document.getElementById('submitResult');
      resultDiv.innerHTML += `
        <div class="mt-3 pt-3 border-t">
          <h4 class="font-semibold text-gray-800 mb-2">📊 투표 결과 (Mission ${firstRecord.missionId}, Question ${firstRecord.questionId})</h4>
          <div class="text-sm text-gray-700">
            <p>Total: ${total.toString()} votes</p>
            <div class="mt-2 space-y-1">
              ${optionVotes.map((v, i) =>
                i > 0 && v > 0n ? `<p>Option ${i}: ${v.toString()} votes</p>` : ''
              ).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('❌ Failed to check vote results:', error);
    }
  }

  setLoadingState(isLoading, statusText = '') {
    const submitButton = document.getElementById('submitButton');
    const submitButtonText = document.getElementById('submitButtonText');
    const loadingDiv = document.getElementById('submitLoading');
    const loadingStatusText = document.getElementById('loadingStatusText');

    if (isLoading) {
      submitButton.disabled = true;
      submitButtonText.textContent = '⏳ 처리 중...';
      loadingDiv.classList.remove('hidden');
      if (statusText && loadingStatusText) {
        loadingStatusText.textContent = statusText;
      }
    } else {
      submitButton.disabled = false;
      submitButtonText.textContent = '🚀 컨트랙트에 제출';
      loadingDiv.classList.add('hidden');
    }
  }
}
