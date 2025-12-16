/**
 * STEP 2: 투표 레코드 생성
 * SubVoting N:1 구조: 유저당 최대 5개 레코드 = 1개 서명
 */

import { CONFIG } from '../config.js?v=3';

export class Step2Records {
  constructor(state) {
    this.state = state;
  }

  render() {
    return `
      <section class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-blue-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge">STEP 2</span>
          📝 투표 레코드 생성(Frontend)
        </h2>
        <p class="text-sm text-gray-600 mb-4">각 사용자가 투표할 데이터를 입력합니다</p>

        <!-- 백엔드 시뮬레이션 안내 -->
        <div class="mb-4 p-3 bg-purple-50 border-l-4 border-purple-400 rounded">
          <p class="text-sm text-purple-800">
            <strong>💡 백엔드 시뮬레이션:</strong>
          </p>
          <ul class="text-xs text-purple-700 mt-1 ml-4 list-disc space-y-1">
            <li><strong>User Nonce:</strong> 컨트랙트에서 자동 조회 (재사용 방지)</li>
            <li><strong>Voting ID:</strong> 타임스탬프 기반 자동 생성 (사용자별 유니크)</li>
            <li><strong>userId:</strong> 백엔드가 지갑 주소를 기반으로 DB에서 자동 설정</li>
          </ul>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">👤 사용자 선택</label>
            <select id="selectedUser" class="w-full px-3 py-2 border rounded-md bg-yellow-50">
              <option value="0">사용자 A</option>
              <option value="1">사용자 B</option>
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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">🎲 Voting ID</label>
            <div class="flex gap-2">
              <input type="text" id="votingId" class="flex-1 px-3 py-2 border rounded-md bg-gray-100" readonly placeholder="자동 생성 버튼 클릭">
              <button onclick="step2.generateVotingId()" class="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm whitespace-nowrap" title="타임스탬프 + 사용자 인덱스 기반 유니크 ID 생성">
                🎲 생성
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">타임스탬프 + 사용자 인덱스 (유니크한 8~9자리 숫자)</p>
          </div>

          <!-- userId는 숨김 처리, 백엔드가 자동 설정 -->
          <input type="hidden" id="userId" value="${CONFIG.DEFAULT_VALUES?.user1Id || '사용자A'}">

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mission ID</label>
            <input type="number" id="missionId" class="w-full px-3 py-2 border rounded-md" value="1">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Question ID</label>
            <input type="number" id="questionId" class="w-full px-3 py-2 border rounded-md" value="1">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Option ID (1 이상 정수)</label>
            <input type="number" id="optionId" class="w-full px-3 py-2 border rounded-md" value="1" min="1">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Voting Amount</label>
            <input type="number" id="votingAmt" class="w-full px-3 py-2 border rounded-md" value="100">
          </div>
        </div>

        <button
          onclick="step2.createRecord()"
          class="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition font-medium"
        >
          ✅ 레코드 추가
        </button>

        <div class="mt-4">
          <p class="text-sm font-medium text-gray-700 mb-2">
            작성된 레코드 (<span id="recordCount">0</span>개)
          </p>

          <div class="grid grid-cols-2 gap-4">
            <!-- 사용자 A 레코드 -->
            <div class="bg-blue-50 rounded-lg border-2 border-blue-200 p-3">
              <p class="text-sm font-semibold text-blue-800 mb-2">
                👤 사용자 A 레코드 (<span id="userARecordCount">0</span>개)
              </p>
              <div id="userARecordsList" class="space-y-2 min-h-[80px]">
                <p class="text-blue-400 text-xs">사용자 A 레코드가 없습니다</p>
              </div>
            </div>

            <!-- 사용자 B 레코드 -->
            <div class="bg-green-50 rounded-lg border-2 border-green-200 p-3">
              <p class="text-sm font-semibold text-green-800 mb-2">
                👤 사용자 B 레코드 (<span id="userBRecordCount">0</span>개)
              </p>
              <div id="userBRecordsList" class="space-y-2 min-h-[80px]">
                <p class="text-green-400 text-xs">사용자 B 레코드가 없습니다</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Voting ID 자동 생성 (타임스탬프 + userIndex)
   */
  generateVotingId() {
    const selectedUserIndex = parseInt(document.getElementById('selectedUser').value);
    const timestamp = Date.now().toString();
    const timestampPart = timestamp.slice(-8);
    const votingId = timestampPart + selectedUserIndex; // 사용자별 고유

    document.getElementById('votingId').value = votingId;
    console.log('🎲 Voting ID generated:', votingId);
  }

  /**
   * User Nonce 생성 (타임스탬프 기반)
   *
   * ✅ 중복 체크 방식에서는 순차적 nonce 불필요
   * - 타임스탬프를 nonce로 사용하면 자동으로 유니크
   * - 컨트랙트 조회 없이 즉시 생성 가능
   */
  generateUserNonce() {
    // Unix timestamp (초 단위) 사용
    const nonce = Math.floor(Date.now() / 1000);
    document.getElementById('userNonce').value = nonce.toString();
    console.log('🎲 User Nonce generated (timestamp):', nonce);
  }

  /**
   * 레코드 생성
   */
  createRecord() {
    // 유효성 검사
    const userNonceValue = document.getElementById('userNonce').value;
    if (!userNonceValue || userNonceValue === '') {
      alert('먼저 🔄 조회 버튼을 눌러 User Nonce를 조회해주세요!');
      return;
    }

    const votingIdValue = document.getElementById('votingId').value;
    if (!votingIdValue || votingIdValue === '') {
      alert('먼저 🎲 생성 버튼을 눌러 Voting ID를 생성해주세요!');
      return;
    }

    const selectedUserIndex = parseInt(document.getElementById('selectedUser').value);
    const wallet = selectedUserIndex === 0 ? this.state.user1Wallet : this.state.user2Wallet;

    if (!wallet) {
      alert('먼저 STEP 1에서 사용자 지갑을 로드해주세요!');
      return;
    }

    // ⭐ SubVoting N:1 구조: 사용자당 최대 5개 레코드 허용
    const userRecordCount = this.state.records.filter(r => r.userIndex === selectedUserIndex).length;
    if (userRecordCount >= 5) {
      const userName = selectedUserIndex === 0 ? 'A' : 'B';
      alert(`사용자 ${userName}는 최대 5개 레코드만 추가할 수 있습니다.\n현재: ${userRecordCount}개\n\n기존 레코드를 삭제 후 다시 추가해주세요.`);
      return;
    }

    const record = {
      recordId: userRecordCount + 1,  // 사용자별 1부터 시작하는 recordId
      timestamp: Math.floor(Date.now() / 1000),
      missionId: parseInt(document.getElementById('missionId').value),
      votingId: parseInt(votingIdValue),
      userAddress: wallet.address,
      userId: document.getElementById('userId').value,
      questionId: parseInt(document.getElementById('questionId').value),
      optionId: parseInt(document.getElementById('optionId').value),
      votingAmt: parseInt(document.getElementById('votingAmt').value),
      userNonce: parseInt(userNonceValue),
      userIndex: selectedUserIndex
    };

    // 배열에 추가 (1차원 배열)
    this.state.records.push(record);

    this.updateUI();
    console.log('✅ Record created:', record);
  }

  /**
   * UI 업데이트 (사용자별 레코드 분리 표시)
   */
  updateUI() {
    // 전체 레코드 수 업데이트
    document.getElementById('recordCount').textContent = this.state.records.length;

    // 사용자별 레코드 필터링
    const userARecords = this.state.records.filter(r => r.userIndex === 0);
    const userBRecords = this.state.records.filter(r => r.userIndex === 1);

    // 사용자 A 레코드 표시
    document.getElementById('userARecordCount').textContent = userARecords.length;
    const userAList = document.getElementById('userARecordsList');
    if (userARecords.length === 0) {
      userAList.innerHTML = '<p class="text-blue-400 text-xs">사용자 A 레코드가 없습니다</p>';
    } else {
      userAList.innerHTML = userARecords.map((r, idx) => {
        // 전체 records 배열에서의 실제 인덱스 찾기
        const globalIndex = this.state.records.findIndex(rec => rec === r);
        return `
        <div class="bg-white p-2 rounded border border-blue-300 relative group">
          <button onclick="step2.deleteRecord(${globalIndex})" 
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="삭제">
            ×
          </button>
          <p class="text-xs font-mono text-blue-700">
            #${idx + 1}: M${r.missionId} V${r.votingId} Q${r.questionId}→A${r.optionId} 💰${r.votingAmt}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            User: <span class="font-mono">${r.userId}</span> | Nonce: ${r.userNonce}
          </p>
        </div>
      `;
      }).join('');
    }

    // 사용자 B 레코드 표시
    document.getElementById('userBRecordCount').textContent = userBRecords.length;
    const userBList = document.getElementById('userBRecordsList');
    if (userBRecords.length === 0) {
      userBList.innerHTML = '<p class="text-green-400 text-xs">사용자 B 레코드가 없습니다</p>';
    } else {
      userBList.innerHTML = userBRecords.map((r, idx) => {
        // 전체 records 배열에서의 실제 인덱스 찾기
        const globalIndex = this.state.records.findIndex(rec => rec === r);
        return `
        <div class="bg-white p-2 rounded border border-green-300 relative group">
          <button onclick="step2.deleteRecord(${globalIndex})" 
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="삭제">
            ×
          </button>
          <p class="text-xs font-mono text-green-700">
            #${idx + 1}: M${r.missionId} V${r.votingId} Q${r.questionId}→A${r.optionId} 💰${r.votingAmt}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            User: <span class="font-mono">${r.userId}</span> | Nonce: ${r.userNonce}
          </p>
        </div>
      `;
      }).join('');
    }
  }

  /**
   * 레코드 삭제 (전역 인덱스 기반)
   */
  deleteRecord(index) {
    if (index < 0 || index >= this.state.records.length) {
      alert('잘못된 레코드 인덱스입니다.');
      return;
    }

    const record = this.state.records[index];
    const userName = record.userIndex === 0 ? '사용자 A' : '사용자 B';

    if (confirm(`${userName}의 레코드를 삭제하시겠습니까?`)) {
      this.state.records.splice(index, 1);
      this.updateUI();
      console.log(`🗑️ Record deleted at index ${index}`);
    }
  }
}
