/**
 * Step 7: 컨트랙트 제출
 * UserVoteBatch[] 구조 사용
 */

import { CONFIG, getContractInstance } from '../config.js';

/**
 * recordId 생성 유틸리티
 * 백엔드에서 생성하는 단순 유니크 ID를 시뮬레이션
 * @param {number} index - 레코드 인덱스
 * @returns {bigint} uint256 형식의 recordId
 */
function generateRecordId(index) {
  // 단순히 타임스탬프 + 인덱스를 사용
  // 실제 백엔드에서는 UUID나 DB auto-increment ID 사용
  // String으로 반환해야 JSON.stringify()에서 정상 동작
  return String(Date.now() * 1000 + index);
}

export class Step7Submit {
  constructor(state) {
    this.state = state;
    this.onEventsReceived = null; // Step 9 연동 콜백
  }

  /**
   * Step 9 연동을 위한 콜백 설정
   */
  setEventCallback(callback) {
    this.onEventsReceived = callback;
  }

  render() {
    return `
      <div class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-red-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-red-500">STEP 7</span>
          <i data-lucide="rocket" class="w-5 h-5 inline"></i> 컨트랙트 제출(Backend)
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          모든 데이터를 컨트랙트에 제출합니다
        </p>

        <!-- 백엔드 userId 주입 시뮬레이션 -->
        <div class="mb-6 p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded">
          <h3 class="font-semibold text-indigo-900 mb-2">
            <i data-lucide="refresh-cw" class="w-4 h-4 inline"></i> Backend: userId 자동 주입
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
          <p class="font-semibold text-gray-800 mb-2"><i data-lucide="clipboard" class="w-4 h-4 inline"></i> 제출 데이터 요약:</p>
          <ul class="text-sm text-gray-700 space-y-1">
            <li>• 총 레코드: <span id="submitRecordCount">0</span>개</li>
            <li>• User Batches: <span id="submitUserBatchCount">0</span>개</li>
            <li>• 사용자별 레코드: <span id="submitUserRecordBreakdown">-</span></li>
            <li>• Batch Nonce: <span id="submitBatchNonce">-</span></li>
            <li>• Executor 서명: <span id="submitExecutorSig">없음</span></li>
          </ul>
        </div>

        <!-- Remix 파라미터 표시 -->
        <details class="mb-4">
          <summary class="cursor-pointer text-blue-600 font-semibold hover:text-blue-800">
            <i data-lucide="wrench" class="w-4 h-4 inline"></i> Remix 제출용 파라미터 보기
          </summary>
          <div id="remixParams" class="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p class="text-xs text-gray-600 mb-3">
              <i data-lucide="file-text" class="w-4 h-4 inline"></i> 각 파라미터를 개별적으로 복사하여 Remix IDE에 붙여넣으세요
            </p>

            <!-- 1. batches 파라미터 (UserVoteBatch[]) -->
            <div class="mb-4 bg-white rounded border border-blue-300 p-3">
              <div class="flex items-center justify-between mb-2">
                <p class="font-semibold text-sm text-blue-900">1. batches (UserVoteBatch[])</p>
                <button onclick="step7.copyParam('batches')"
                        class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                  <i data-lucide="clipboard" class="w-3 h-3 inline"></i> 복사
                </button>
              </div>
              <textarea id="remixParam_batches"
                        class="w-full h-32 p-2 font-mono text-xs bg-gray-50 border rounded"
                        readonly></textarea>
            </div>

            <!-- 2. batchNonce 파라미터 -->
            <div class="mb-4 bg-white rounded border border-blue-300 p-3">
              <div class="flex items-center justify-between mb-2">
                <p class="font-semibold text-sm text-blue-900">2. batchNonce (uint256)</p>
                <button onclick="step7.copyParam('batchNonce')"
                        class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                  <i data-lucide="clipboard" class="w-3 h-3 inline"></i> 복사
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
                <p class="font-semibold text-sm text-blue-900">3. executorSig (bytes)</p>
                <button onclick="step7.copyParam('executorSig')"
                        class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                  <i data-lucide="clipboard" class="w-3 h-3 inline"></i> 복사
                </button>
              </div>
              <input id="remixParam_executorSig"
                     type="text"
                     class="w-full p-2 font-mono text-xs bg-gray-50 border rounded"
                     readonly>
            </div>

            <div class="mt-3 bg-yellow-50 border border-yellow-300 rounded p-2">
              <p class="text-xs text-yellow-900">
                <i data-lucide="lightbulb" class="w-4 h-4 inline"></i> <strong>Remix 사용법:</strong> 각 파라미터를 위에서 아래 순서대로 복사하여 Remix IDE의 submitMultiUserBatch 함수 입력란에 붙여넣으세요
              </p>
            </div>
          </div>
        </details>

        <!-- 제출 버튼 -->
        <button id="submitButton" onclick="step7.submit()"
                class="bg-red-500 text-white px-6 py-3 rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">
          <span id="submitButtonText"><i data-lucide="rocket" class="w-4 h-4 inline"></i> 컨트랙트에 제출</span>
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
        <div id="submitResult" class="mt-4 hidden">
          <div class="bg-green-50 border border-green-200 rounded p-4">
            <p class="font-semibold text-green-900 mb-2"><i data-lucide="check-circle" class="w-4 h-4 inline"></i> 제출 성공!</p>
            <p class="text-sm text-gray-700">
              Transaction Hash: <span id="txHash" class="font-mono text-xs">-</span>
            </p>
            <a id="txLink" href="#" target="_blank"
               class="text-blue-600 hover:underline text-sm">
              <i data-lucide="search" class="w-4 h-4 inline"></i> Explorer에서 보기
            </a>
          </div>
        </div>

        <div id="submitError" class="mt-4 hidden">
          <div class="bg-red-50 border border-red-200 rounded p-4">
            <p class="font-semibold text-red-900 mb-2"><i data-lucide="x-circle" class="w-4 h-4 inline"></i> 제출 실패</p>
            <p class="text-sm text-gray-700" id="errorMessage">-</p>
          </div>
        </div>
      </div>
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

      document.getElementById('userIdMappingList').innerHTML = mappingHTML;
    }

    // 레코드 수
    const recordCount = this.state.records ? this.state.records.length : 0;
    document.getElementById('submitRecordCount').textContent = recordCount;

    // User Batch 수
    const userBatchCount = this.state.userBatchSigs ? this.state.userBatchSigs.length : 0;
    document.getElementById('submitUserBatchCount').textContent = userBatchCount;

    // 사용자별 레코드 수 계산
    if (this.state.records && this.state.records.length > 0) {
      const user1Count = this.state.records.filter(r => r.userIndex === 0).length;
      const user2Count = this.state.records.filter(r => r.userIndex === 1).length;
      const breakdown = [];
      if (user1Count > 0) breakdown.push(`User 1: ${user1Count}개`);
      if (user2Count > 0) breakdown.push(`User 2: ${user2Count}개`);
      document.getElementById('submitUserRecordBreakdown').textContent = breakdown.join(', ');
    }

    // Batch Nonce
    document.getElementById('submitBatchNonce').textContent = 
      this.state.batchNonce !== undefined ? this.state.batchNonce : '-';

    // Executor 서명
    const execSig = this.state.executorSig ? '있음' : '없음';
    document.getElementById('submitExecutorSig').textContent = execSig;
  }

  /**
   * UserVoteBatch[] 구조로 데이터 생성 (Remix 표시용)
   */
  buildUserVoteBatches() {
    const batches = [];
    let globalIndex = 0;

    // 각 userBatchSig에 대해 UserVoteBatch 생성
    this.state.userBatchSigs.forEach(sig => {
      // 해당 사용자의 레코드 필터링
      const userRecords = this.state.records
        .filter(r => r.userAddress === sig.user)
        .map(r => {
          const recordId = generateRecordId(globalIndex++);
          return {
            recordId: recordId,
            timestamp: r.timestamp,
            missionId: r.missionId,
            votingId: r.votingId,
            optionId: r.optionId,
            voteType: r.voteType,
            userId: r.userId,
            votingAmt: r.votingAmt
          };
        });

      if (userRecords.length > 0) {
        batches.push({
          records: userRecords,
          userBatchSig: {
            user: sig.user,
            userNonce: sig.userNonce,
            signature: sig.signature
          }
        });
      }
    });

    return batches;
  }

  generateRemixParams() {
    // UserVoteBatch[] 구조로 생성
    const batches = this.buildUserVoteBatches();

    // 각 파라미터를 개별적으로 설정
    const batchesElement = document.getElementById('remixParam_batches');
    const batchNonceElement = document.getElementById('remixParam_batchNonce');
    const executorSigElement = document.getElementById('remixParam_executorSig');

    if (batchesElement) {
      batchesElement.value = JSON.stringify(batches, null, 2);
    }

    if (batchNonceElement) {
      batchNonceElement.value = this.state.batchNonce !== undefined ? this.state.batchNonce : 0;
    }

    if (executorSigElement) {
      executorSigElement.value = this.state.executorSig || '';
    }
  }

  copyParam(paramName) {
    const elementId = `remixParam_${paramName}`;
    const element = document.getElementById(elementId);

    if (!element) {
      alert('[ERROR] 파라미터를 찾을 수 없습니다.');
      return;
    }

    // 값 복사
    element.select();
    element.setSelectionRange(0, 99999); // 모바일 대응

    try {
      document.execCommand('copy');

      // 복사 성공 피드백
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = '복사됨!';
      button.classList.remove('bg-blue-500', 'hover:bg-blue-600');
      button.classList.add('bg-green-500');

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-500');
        button.classList.add('bg-blue-500', 'hover:bg-blue-600');
      }, 2000);

    } catch (err) {
      alert('[ERROR] 복사에 실패했습니다: ' + err.message);
    }

    // 선택 해제
    window.getSelection().removeAllRanges();
  }

  async submit() {
    try {
      // 데이터 검증
      if (!this.state.records || this.state.records.length === 0) {
        alert('레코드가 없습니다. Step 2에서 레코드를 추가해주세요.');
        return;
      }

      if (!this.state.userBatchSigs || this.state.userBatchSigs.length === 0) {
        alert('User Batch 서명이 없습니다. Step 3에서 서명해주세요.');
        return;
      }

      if (!this.state.executorSig) {
        alert('Executor 서명이 없습니다. Step 6에서 서명을 생성해주세요.');
        return;
      }

      // Batch Nonce 검증
      if (this.state.batchNonce === undefined || this.state.batchNonce === null) {
        alert('Batch Nonce가 설정되지 않았습니다. Step 5에서 Struct Hash를 계산해주세요.');
        return;
      }

      // 로딩 상태 시작
      this.setLoadingState(true, '가스 추정 중...');
      
      // preflight: 유저별로 votingId가 하나로 고정돼야 함 (원자성 정책)
      if (this.state.records && this.state.records.length > 0) {
        const byUser = new Map();
        for (const r of this.state.records) {
          const prev = byUser.get(r.userAddress);
          if (prev === undefined) byUser.set(r.userAddress, r.votingId);
          else if (prev !== r.votingId) {
            throw new Error(
              `같은 유저의 레코드는 votingId가 모두 같아야 합니다.\n` +
              `user=${r.userAddress}\n` +
              `votingId=${prev} vs ${r.votingId}\n\n` +
              `STEP 2에서 votingId를 하나만 생성해서 그 유저의 모든 레코드에 사용하세요.`
            );
          }
        }
      }
	      
      // 기존 결과/에러 숨기기
      document.getElementById('submitResult').classList.add('hidden');
      document.getElementById('submitError').classList.add('hidden');

      // UserVoteBatch[] 구조로 변환 (recordId 포함)
      let globalIndex = 0;
      const batches = this.state.userBatchSigs.map(sig => {
        // 해당 사용자의 레코드 필터링
        const userRecords = this.state.records
          .filter(r => r.userAddress === sig.user)
          .map(r => {
            const recordId = generateRecordId(globalIndex++);
            // 모든 uint256 필드를 BigInt로 변환 (큰 숫자 지원)
            return [
              recordId,                // recordId: bytes32
              BigInt(r.timestamp),     // timestamp: uint256
              BigInt(r.missionId),     // missionId: uint256
              BigInt(r.votingId),      // votingId: uint256
              BigInt(r.optionId),      // optionId: uint256
              r.voteType,              // voteType: uint8 (작은 숫자)
              r.userId,                // userId: string
              BigInt(r.votingAmt)      // votingAmt: uint256
            ];
          });

        return [
          userRecords,  // records: VoteRecord[]
          [             // userBatchSig: UserBatchSig
            sig.user,
            BigInt(sig.userNonce),  // userNonce: uint256
            sig.signature
          ]
        ];
      });

      const batchNonce = BigInt(this.state.batchNonce);  // uint256
      const executorSig = this.state.executorSig;

      console.log('[TX] Submitting to contract (UserVoteBatch[]):', {
        batchCount: batches.length,
        totalRecords: batches.reduce((sum, b) => sum + b[0].length, 0),
        batchNonce,
        executorSig
      });

      // 컨트랙트 인스턴스 생성 (state의 contractAddress 사용)
      this.setLoadingState(true, '컨트랙트 인스턴스 생성 중...');
      const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
      const signer = this.state.executorWallet.connect(provider);
      const contract = getContractInstance(signer, this.state.contractAddress);

      // 트랜잭션 제출 (새로운 시그니처: batches, batchNonce, executorSig)
      this.setLoadingState(true, '트랜잭션 전송 중...');
      const tx = await contract.submitMultiUserBatch(
        batches,
        batchNonce,
        executorSig
      );

      console.log('[PENDING] Transaction sent:', tx.hash);

      // 트랜잭션 대기
      this.setLoadingState(true, `트랜잭션 확인 대기 중... (TX: ${tx.hash.slice(0, 10)}...)`);
      const receipt = await tx.wait();

      console.log('[SUCCESS] Transaction confirmed:', receipt);

      // 성공 UI 업데이트
      this.setLoadingState(false);
      document.getElementById('txHash').textContent = tx.hash;
      const explorerUrl = `https://testnet.opbnbscan.com/tx/${tx.hash}`;
      document.getElementById('txLink').href = explorerUrl;
      document.getElementById('submitResult').classList.remove('hidden');
      document.getElementById('submitError').classList.add('hidden');

      // Step 9로 이벤트 전달 (자동 파싱)
      if (this.onEventsReceived && receipt) {
        this.setLoadingState(true, 'UserMissionResult 이벤트 파싱 중...');
        try {
          this.onEventsReceived(receipt, tx.hash);
          console.log('[EVENT] UserMissionResult events sent to Step 9');
        } catch (eventError) {
          console.warn('[EVENT] Event parsing warning:', eventError);
        }
        this.setLoadingState(false);
      }

    } catch (error) {
      console.error('[ERROR] Submit failed:', error);
      this.setLoadingState(false);
      // ethers가 custom error를 ABI 없이 "unknown custom error"로 출력하는 경우가 많아서 보강
      const selector = error?.data?.slice?.(0, 10);
      if (selector === '0x8894779f') {
        error.message =
          'NoSuccessfulUser(): 모든 유저 배치가 실패하여 저장된 레코드가 0개입니다.\n' +
          '- 각 유저 배치(records[]) 안에서 votingId가 모두 같은지 확인\n' +
          '- voteType(0/1), optionId(0 금지), votingAmt(0 금지), allowedArtist 여부 확인\n' +
          '- 동일한 레코드(동일 필드) 중복 제출이 없는지 확인\n\n' +
          (error.message || '');
      }
      document.getElementById('errorMessage').textContent = error.message;
      document.getElementById('submitError').classList.remove('hidden');
      document.getElementById('submitResult').classList.add('hidden');
    }
  }

  setLoadingState(isLoading, statusText = '') {
    const submitButton = document.getElementById('submitButton');
    const submitButtonText = document.getElementById('submitButtonText');
    const loadingDiv = document.getElementById('submitLoading');
    const loadingStatusText = document.getElementById('loadingStatusText');

    if (isLoading) {
      // 로딩 시작
      submitButton.disabled = true;
      submitButtonText.innerHTML = '<i data-lucide="clock" class="w-4 h-4 inline animate-spin"></i> 처리 중...';
      loadingDiv.classList.remove('hidden');
      if (statusText) {
        loadingStatusText.textContent = statusText;
      }
    } else {
      // 로딩 종료
      submitButton.disabled = false;
      submitButtonText.innerHTML = '<i data-lucide="rocket" class="w-4 h-4 inline"></i> 컨트랙트에 제출';
      loadingDiv.classList.add('hidden');
    }
  }
}
