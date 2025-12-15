/**
 * Step 2: 투표 레코드 작성 (userId 포함)
 */

import { CONFIG } from '../config.js';

export class Step2Records {
  constructor(state) {
    this.state = state;
    this.records = [];
  }

  render() {
    return `
      <div class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-blue-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge">STEP 2</span>
          <i data-lucide="file-text" class="w-5 h-5 inline"></i> 투표 레코드 생성(Frontend)
        </h2>
        <p class="text-sm text-gray-600 mb-4">각 사용자가 투표할 데이터를 입력합니다</p>

        <!-- 백엔드 시뮬레이션 안내 -->
        <div class="mb-4 p-3 bg-purple-50 border-l-4 border-purple-400 rounded">
          <p class="text-sm text-purple-800">
            <strong><i data-lucide="lightbulb" class="w-4 h-4 inline"></i> 백엔드 시뮬레이션:</strong>
          </p>
          <ul class="text-xs text-purple-700 mt-1 ml-4 list-disc space-y-1">
            <li><strong>User Nonce:</strong> 사용자 입력 또는 자동 생성 후 중복 확인 (재사용 방지)</li>
            <li><strong>Voting ID:</strong> 프론트엔드에서 타임스탬프 기반 자동 생성 (사용자별 유니크)</li>
            <li><strong>userId:</strong> 백엔드가 지갑 주소를 기반으로 DB에서 자동 설정</li>
          </ul>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"><i data-lucide="user" class="w-4 h-4 inline"></i> 사용자 선택</label>
            <select id="selectedUser" class="w-full px-3 py-2 border rounded-md bg-yellow-50">
              <option value="0">User 1</option>
              <option value="1">User 2</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"><i data-lucide="hash" class="w-4 h-4 inline"></i> User Nonce</label>
            <div class="flex gap-2">
              <input type="number" id="userNonce" class="flex-1 px-3 py-2 border rounded-md" placeholder="직접 입력 또는 자동 생성" min="0">
              <button onclick="step2.generateUserNonce()" class="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm whitespace-nowrap" title="타임스탬프 기반 유니크 Nonce 생성">
                <i data-lucide="dice-3" class="w-4 h-4 inline"></i> 생성
              </button>
              <button onclick="step2.checkUserNonce()" class="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm whitespace-nowrap" title="해당 Nonce가 이미 사용되었는지 확인">
                <i data-lucide="search" class="w-4 h-4 inline"></i> 중복확인
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">이미 사용된 Nonce는 재사용 불가 (중복 체크 방식)</p>
            <div id="nonceCheckResult" class="hidden mt-1"></div>
          </div>

          <!-- userId는 숨김 처리, 백엔드가 자동 설정 -->
          <input type="hidden" id="userId" value="${CONFIG.DEFAULT_VALUES.user1Id}">

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mission ID</label>
            <input type="number" id="missionId" class="w-full px-3 py-2 border rounded-md" value="${CONFIG.DEFAULT_VALUES.missionId}">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Voting ID</label>
            <div class="flex gap-2">
              <input type="text" id="votingId" class="flex-1 px-3 py-2 border rounded-md bg-gray-100" readonly placeholder="자동 생성 버튼 클릭">
              <button onclick="step2.generateVotingId()" class="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm whitespace-nowrap" title="타임스탬프 + 사용자 인덱스 기반 유니크 ID 생성">
                <i data-lucide="dice-3" class="w-4 h-4 inline"></i> 생성
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">타임스탬프 + 사용자 인덱스 (사용자별로 유니크한 8~9자리 숫자)</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Artist ID</label>
            <input type="number" id="optionId" class="w-full px-3 py-2 border rounded-md" value="${CONFIG.DEFAULT_VALUES.optionId}">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Vote Type</label>
            <select id="voteType" class="w-full px-3 py-2 border rounded-md">
              <option value="1">Remember</option>
              <option value="0">Forget</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Voting Amount</label>
            <input type="number" id="votingAmt" class="w-full px-3 py-2 border rounded-md" value="${CONFIG.DEFAULT_VALUES.votingAmt}">
          </div>
        </div>

        <button onclick="step2.addRecord()" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
          + 레코드 추가
        </button>

        <div class="mt-4">
          <p class="text-sm font-medium text-gray-700 mb-2">
            작성된 레코드 (<span id="recordCount">0</span>/${CONFIG.MAX_RECORDS_PER_BATCH})
          </p>

          <div class="grid grid-cols-2 gap-4">
            <!-- User 1 레코드 -->
            <div class="bg-blue-50 rounded-lg border-2 border-blue-200 p-3">
              <p class="text-sm font-semibold text-blue-800 mb-2">
                <i data-lucide="user" class="w-4 h-4 inline"></i> User 1 레코드 (<span id="user1RecordCount">0</span>개)
              </p>
              <div id="user1RecordsList" class="space-y-2 min-h-[80px]">
                <p class="text-blue-400 text-xs">User 1 레코드가 없습니다</p>
              </div>
            </div>

            <!-- User 2 레코드 -->
            <div class="bg-green-50 rounded-lg border-2 border-green-200 p-3">
              <p class="text-sm font-semibold text-green-800 mb-2">
                <i data-lucide="user" class="w-4 h-4 inline"></i> User 2 레코드 (<span id="user2RecordCount">0</span>개)
              </p>
              <div id="user2RecordsList" class="space-y-2 min-h-[80px]">
                <p class="text-green-400 text-xs">User 2 레코드가 없습니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  addRecord() {
    if (this.records.length >= CONFIG.MAX_RECORDS_PER_BATCH) {
      alert(`최대 ${CONFIG.MAX_RECORDS_PER_BATCH}개까지만 추가할 수 있습니다.`);
      return;
    }

    const selectedUserIndex = parseInt(document.getElementById('selectedUser').value);
    const wallet = selectedUserIndex === 0 ? this.state.user1Wallet : this.state.user2Wallet;

    if (!wallet) {
      alert('먼저 Step 1에서 지갑을 초기화해주세요!');
      return;
    }

    // userNonce 가져오기 및 검증
    const userNonceValue = document.getElementById('userNonce').value;
    if (!userNonceValue || userNonceValue === '') {
      alert('먼저 🔄 조회 버튼을 눌러 User Nonce를 조회해주세요!');
      return;
    }

    const userNonce = parseInt(userNonceValue);
    if (isNaN(userNonce) || userNonce < 0) {
      alert('유효하지 않은 User Nonce입니다. 다시 조회해주세요.');
      return;
    }

    // state에 저장
    if (selectedUserIndex === 0) {
      this.state.user1Nonce = userNonce;
    } else {
      this.state.user2Nonce = userNonce;
    }

    // votingId 검증
    const votingIdValue = document.getElementById('votingId').value;
    if (!votingIdValue || votingIdValue === '') {
      alert('먼저 🎲 생성 버튼을 눌러 Voting ID를 생성해주세요!');
      return;
    }

    const record = {
      userIndex: selectedUserIndex,
      userAddress: wallet.address,  // step7 필터링용 (컨트랙트에는 제출 안 함)
      timestamp: Math.floor(Date.now() / 1000),
      missionId: parseInt(document.getElementById('missionId').value),
      votingId: parseInt(votingIdValue),
      optionId: parseInt(document.getElementById('optionId').value),
      voteType: parseInt(document.getElementById('voteType').value),
      userId: document.getElementById('userId').value,
      votingAmt: parseInt(document.getElementById('votingAmt').value)
    };

    this.records.push(record);
    this.state.records = this.records;
    this.updateUI();

    console.log('[SUCCESS] Record added:', record);
  }

  updateUI() {
    // 전체 레코드 수 업데이트
    document.getElementById('recordCount').textContent = this.records.length;

    // User별 레코드 필터링
    const user1Records = this.records.filter(r => r.userIndex === 0);
    const user2Records = this.records.filter(r => r.userIndex === 1);

    // User 1 레코드 표시
    document.getElementById('user1RecordCount').textContent = user1Records.length;
    const user1List = document.getElementById('user1RecordsList');
    if (user1Records.length === 0) {
      user1List.innerHTML = '<p class="text-blue-400 text-xs">User 1 레코드가 없습니다</p>';
    } else {
      user1List.innerHTML = user1Records.map((r, idx) => {
        // 전체 records 배열에서의 실제 인덱스 찾기
        const globalIndex = this.records.findIndex(rec => rec === r);
        return `
        <div class="record-card border-blue-300 relative group">
          <button onclick="step2.deleteRecord(${globalIndex})" 
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="삭제">
            ×
          </button>
          <p class="text-xs font-mono text-blue-700">
            #${idx + 1}: M${r.missionId} V${r.votingId} C${r.optionId}
            ${r.voteType === 1 ? '<i data-lucide="thumbs-up" class="w-3 h-3 inline"></i>' : '<i data-lucide="thumbs-down" class="w-3 h-3 inline"></i>'} ${r.votingAmt}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            User: <span class="font-mono">${r.userId}</span>
          </p>
        </div>
      `;
      }).join('');
    }

    // User 2 레코드 표시
    document.getElementById('user2RecordCount').textContent = user2Records.length;
    const user2List = document.getElementById('user2RecordsList');
    if (user2Records.length === 0) {
      user2List.innerHTML = '<p class="text-green-400 text-xs">User 2 레코드가 없습니다</p>';
    } else {
      user2List.innerHTML = user2Records.map((r, idx) => {
        // 전체 records 배열에서의 실제 인덱스 찾기
        const globalIndex = this.records.findIndex(rec => rec === r);
        return `
        <div class="record-card border-green-300 relative group">
          <button onclick="step2.deleteRecord(${globalIndex})" 
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="삭제">
            ×
          </button>
          <p class="text-xs font-mono text-green-700">
            #${idx + 1}: M${r.missionId} V${r.votingId} C${r.optionId}
            ${r.voteType === 1 ? '<i data-lucide="thumbs-up" class="w-3 h-3 inline"></i>' : '<i data-lucide="thumbs-down" class="w-3 h-3 inline"></i>'} ${r.votingAmt}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            User: <span class="font-mono">${r.userId}</span>
          </p>
        </div>
      `;
      }).join('');
    }
  }

  deleteRecord(index) {
    if (index < 0 || index >= this.records.length) {
      alert('잘못된 레코드 인덱스입니다.');
      return;
    }

    const record = this.records[index];
    const userName = record.userIndex === 0 ? 'User 1' : 'User 2';

    if (confirm(`${userName}의 레코드를 삭제하시겠습니까?`)) {
      this.records.splice(index, 1);
      this.state.records = this.records;
      this.updateUI();
      console.log(`[SUCCESS] Record deleted at index ${index}`);
    }
  }

  /**
   * Voting ID 자동 생성 (타임스탬프 + userIndex 기반)
   * 사용자별로 유니크한 ID 생성
   */
  generateVotingId() {
    // 현재 선택된 사용자 인덱스
    const selectedUserIndex = parseInt(document.getElementById('selectedUser').value);

    // 타임스탬프의 마지막 8자리 사용
    const timestamp = Date.now().toString();
    const timestampPart = timestamp.slice(-8);

    // 타임스탬프 + userIndex (사용자별로 다른 votingId 보장)
    const votingId = timestampPart + selectedUserIndex;

    document.getElementById('votingId').value = votingId;
    console.log(`[SUCCESS] Voting ID generated for User ${selectedUserIndex + 1}:`, votingId);
  }

  /**
   * User Nonce 자동 생성 (타임스탬프 기반)
   * 중복 체크 방식에서는 유니크한 값만 사용하면 됨
   */
  generateUserNonce() {
    // 현재 선택된 사용자 인덱스
    const selectedUserIndex = parseInt(document.getElementById('selectedUser').value);

    // 타임스탬프의 마지막 9자리 + userIndex로 유니크한 값 생성
    const timestamp = Date.now().toString();
    const nonce = parseInt(timestamp.slice(-9)) * 10 + selectedUserIndex;

    document.getElementById('userNonce').value = nonce;

    // 중복 확인 결과 초기화
    const resultDiv = document.getElementById('nonceCheckResult');
    resultDiv.classList.add('hidden');

    console.log(`[SUCCESS] User Nonce generated for User ${selectedUserIndex + 1}:`, nonce);
  }

  /**
   * 컨트랙트에서 User Nonce 중복 확인 (백엔드 시뮬레이션)
   * 중복 체크 방식: usedUserNonces(address, nonce) → bool로 사용 여부 확인
   */
  async checkUserNonce() {
    const resultDiv = document.getElementById('nonceCheckResult');

    try {
      const selectedUserIndex = parseInt(document.getElementById('selectedUser').value);
      const wallet = selectedUserIndex === 0 ? this.state.user1Wallet : this.state.user2Wallet;

      if (!wallet) {
        alert('먼저 Step 1에서 지갑을 초기화해주세요!');
        return;
      }

      const nonceValue = document.getElementById('userNonce').value;
      if (!nonceValue || nonceValue === '') {
        alert('먼저 Nonce 값을 입력하거나 생성해주세요!');
        return;
      }

      const nonce = parseInt(nonceValue);
      if (isNaN(nonce) || nonce < 0) {
        alert('유효하지 않은 Nonce 값입니다. 0 이상의 정수를 입력해주세요.');
        return;
      }

      // 컨트랙트 인스턴스 생성
      const provider = this.state.provider;
      const contract = new ethers.Contract(
        this.state.contractAddress,
        ['function usedUserNonces(address, uint256) view returns (bool)'],
        provider
      );

      // usedUserNonces 조회 (중복 체크 - true면 이미 사용됨)
      console.log(`[SEARCH] Checking if nonce ${nonce} is used for ${wallet.address}...`);
      const isUsed = await contract.usedUserNonces(wallet.address, nonce);

      // UI 업데이트
      resultDiv.classList.remove('hidden');
      if (isUsed) {
        resultDiv.innerHTML = `
          <span class="text-red-600 text-xs font-semibold">
            ❌ 이미 사용된 Nonce입니다. 다른 값을 사용해주세요.
          </span>
        `;
        console.log(`[WARNING] Nonce ${nonce} is already used for User ${selectedUserIndex + 1}`);
      } else {
        resultDiv.innerHTML = `
          <span class="text-green-600 text-xs font-semibold">
            ✅ 사용 가능한 Nonce입니다.
          </span>
        `;
        console.log(`[SUCCESS] Nonce ${nonce} is available for User ${selectedUserIndex + 1}`);

        // state에도 저장
        if (selectedUserIndex === 0) {
          this.state.user1Nonce = nonce;
        } else {
          this.state.user2Nonce = nonce;
        }
      }

    } catch (error) {
      console.error('[ERROR] Failed to check user nonce:', error);
      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = `
        <span class="text-red-600 text-xs">
          ⚠️ 중복 확인 실패: ${error.message}
        </span>
      `;
    }
  }
}
