/**
 * Step 2: 부스팅 레코드 작성 (userId 포함)
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
          📝 부스팅 레코드 생성(Frontend)
        </h2>
        <p class="text-sm text-gray-600 mb-4">각 사용자가 부스팅할 데이터를 입력합니다</p>

        <!-- 백엔드 시뮬레이션 안내 -->
        <div class="mb-4 p-3 bg-purple-50 border-l-4 border-purple-400 rounded">
          <p class="text-sm text-purple-800">
            <strong>💡 백엔드 시뮬레이션:</strong>
          </p>
          <ul class="text-xs text-purple-700 mt-1 ml-4 list-disc space-y-1">
            <li><strong>User Nonce:</strong> 타임스탬프 기반 자동 생성 (중복 방지)</li>
            <li><strong>Boosting ID:</strong> 프론트엔드에서 타임스탬프 기반 자동 생성 (사용자별 유니크)</li>
            <li><strong>userId:</strong> 백엔드가 지갑 주소를 기반으로 DB에서 자동 설정</li>
          </ul>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">👤 사용자 선택</label>
            <select id="selectedUser" class="w-full px-3 py-2 border rounded-md bg-yellow-50">
              <option value="0">User 1</option>
              <option value="1">User 2</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">🔢 User Nonce</label>
            <div class="flex gap-2">
              <input type="text" id="userNonce" class="flex-1 px-3 py-2 border rounded-md bg-gray-100" readonly placeholder="타임스탬프 자동 생성">
              <button onclick="step2.generateUserNonce()" class="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm whitespace-nowrap" title="타임스탬프 기반 Nonce 생성">
                🎲 생성
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">타임스탬프 기반 자동 생성 (중복 방지)</p>
          </div>

          <!-- userId는 숨김 처리, 백엔드가 자동 설정 -->
          <input type="hidden" id="userId" value="${CONFIG.DEFAULT_VALUES.user1Id}">

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mission ID</label>
            <input type="number" id="missionId" class="w-full px-3 py-2 border rounded-md" value="${CONFIG.DEFAULT_VALUES.missionId}">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Boosting ID</label>
            <div class="flex gap-2">
              <input type="text" id="boostingId" class="flex-1 px-3 py-2 border rounded-md bg-gray-100" readonly placeholder="자동 생성 버튼 클릭">
              <button onclick="step2.generateBoostingId()" class="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm whitespace-nowrap" title="타임스탬프 + 사용자 인덱스 기반 유니크 ID 생성">
                🎲 생성
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">타임스탬프 + 사용자 인덱스 (사용자별로 유니크한 8~9자리 숫자)</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">🎨 Artist ID</label>
            <input type="number" id="artistId" class="w-full px-3 py-2 border rounded-md" value="${CONFIG.DEFAULT_VALUES.artistId}">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">💖 Boosting With</label>
            <select id="boostingWith" class="w-full px-3 py-2 border rounded-md">
              <option value="0">💖 CELB</option>
              <option value="1">🔄 BP</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Boosting Amount</label>
            <input type="number" id="amt" class="w-full px-3 py-2 border rounded-md" value="${CONFIG.DEFAULT_VALUES.amt}">
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
                👤 User 1 레코드 (<span id="user1RecordCount">0</span>개)
              </p>
              <div id="user1RecordsList" class="space-y-2 min-h-[80px]">
                <p class="text-blue-400 text-xs">User 1 레코드가 없습니다</p>
              </div>
            </div>

            <!-- User 2 레코드 -->
            <div class="bg-green-50 rounded-lg border-2 border-green-200 p-3">
              <p class="text-sm font-semibold text-green-800 mb-2">
                👤 User 2 레코드 (<span id="user2RecordCount">0</span>개)
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
      alert('먼저 🎲 생성 버튼을 눌러 User Nonce를 생성해주세요!');
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

    // boostingId 검증
    const boostingIdValue = document.getElementById('boostingId').value;
    if (!boostingIdValue || boostingIdValue === '') {
      alert('먼저 🎲 생성 버튼을 눌러 Boosting ID를 생성해주세요!');
      return;
    }

    // 🚨 중복 체크: 한 유저당 1개 레코드만 허용 (1배치 1유저 1부스팅)
    const existingIndex = this.records.findIndex(r => r.userIndex === selectedUserIndex);
    if (existingIndex !== -1) {
      const confirm = window.confirm(
        `이미 ${selectedUserIndex === 0 ? 'User 1' : 'User 2'}의 레코드가 존재합니다.\n` +
        `기존 레코드를 삭제하고 새로 추가하시겠습니까?\n\n` +
        `⚠️ 1배치에 1유저당 1개 레코드만 허용됩니다.`
      );

      if (!confirm) {
        return;
      }

      // 기존 레코드 삭제
      this.records.splice(existingIndex, 1);
      console.log(`🗑️ 기존 레코드 삭제됨 (User ${selectedUserIndex + 1})`);
    }

    const record = {
      userIndex: selectedUserIndex,
      timestamp: Math.floor(Date.now() / 1000),
      missionId: parseInt(document.getElementById('missionId').value),
      boostingId: parseInt(boostingIdValue),
      artistId: parseInt(document.getElementById('artistId').value),
      boostingWith: parseInt(document.getElementById('boostingWith').value), // 0=CELB, 1=BP
      userId: document.getElementById('userId').value, // userId 포함
      amt: parseInt(document.getElementById('amt').value),
      // userAddress는 userSig.user로 식별 (SubVoting 패턴)
      signerAddress: wallet.address
    };

    this.records.push(record);
    this.state.records = this.records;
    this.updateUI();

    console.log('✅ Record added:', record);
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
            #${idx + 1}: M${r.missionId} B${r.boostingId} A${r.artistId}
            ${r.boostingWith === 0 ? '💖' : '🔄'} ${r.amt}
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
            #${idx + 1}: M${r.missionId} B${r.boostingId} A${r.artistId}
            ${r.boostingWith === 0 ? '💖' : '🔄'} ${r.amt}
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
      console.log(`✅ Record deleted at index ${index}`);
    }
  }

  /**
   * Boosting ID 자동 생성 (타임스탬프 + userIndex 기반)
   * 사용자별로 유니크한 ID 생성
   */
  generateBoostingId() {
    // 현재 선택된 사용자 인덱스
    const selectedUserIndex = parseInt(document.getElementById('selectedUser').value);

    // 타임스탬프의 마지막 8자리 사용
    const timestamp = Date.now().toString();
    const timestampPart = timestamp.slice(-8);

    // 타임스탬프 + userIndex (사용자별로 다른 boostingId 보장)
    const boostingId = timestampPart + selectedUserIndex;

    document.getElementById('boostingId').value = boostingId;
    console.log(`✅ Boosting ID generated for User ${selectedUserIndex + 1}:`, boostingId);
  }

  /**
   * User Nonce 생성 (타임스탬프 기반)
   *
   * ✅ 중복 체크 방식에서는 순차적 nonce 불필요
   * - 타임스탬프를 nonce로 사용하면 자동으로 유니크
   * - 컨트랙트 조회 없이 즉시 생성 가능
   */
  generateUserNonce() {
    const selectedUserIndex = parseInt(document.getElementById('selectedUser').value);

    // Unix timestamp (초 단위) 사용
    const nonce = Math.floor(Date.now() / 1000);
    document.getElementById('userNonce').value = nonce.toString();

    // state에도 저장
    if (selectedUserIndex === 0) {
      this.state.user1Nonce = nonce;
    } else {
      this.state.user2Nonce = nonce;
    }

    console.log(`🎲 User Nonce generated (timestamp) for User ${selectedUserIndex + 1}:`, nonce);
  }
}
