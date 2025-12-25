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
      <div id="step2" class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-blue-500">
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

        <!-- Custom Private Key 섹션 (그리드 외부) -->
        <div id="customPrivateKeySection" class="hidden mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <label class="block text-sm font-medium text-purple-700 mb-1"><i data-lucide="key" class="w-4 h-4 inline"></i> Custom Private Key</label>
          <input type="text" id="customPrivateKey" class="w-full px-3 py-2 border border-purple-300 rounded-md font-mono text-sm bg-white" placeholder="0x..." onchange="step2.updateCustomAddress()">
          <p class="text-xs text-purple-600 mt-1">Address: <span id="customUserAddress" class="font-mono text-xs break-all block">-</span></p>
        </div>

        <!-- userId는 숨김 처리, 백엔드가 자동 설정 -->
        <input type="hidden" id="userId" value="${CONFIG.DEFAULT_VALUES.user1Id}">

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"><i data-lucide="user" class="w-4 h-4 inline"></i> 사용자 선택</label>
            <select id="selectedUser" class="w-full px-3 py-2 border rounded-md bg-yellow-50" onchange="step2.onUserSelectionChange()">
              <option value="0">User 1 (STEP 1)</option>
              <option value="1">User 2 (STEP 1)</option>
              <option value="custom">직접 입력 (Private Key)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"><i data-lucide="hash" class="w-4 h-4 inline"></i> User Nonce</label>
            <input type="text" id="userNonce" class="w-full px-3 py-2 border rounded-md mb-1" placeholder="직접 입력 또는 자동 생성">
            <div class="flex gap-1">
              <button onclick="step2.generateUserNonce()" class="flex-1 px-2 py-1 bg-purple-500 text-white rounded text-xs" title="타임스탬프 기반 유니크 Nonce 생성">
                🎲 생성
              </button>
              <button onclick="step2.checkUserNonce()" class="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-xs" title="해당 Nonce가 이미 사용되었는지 확인">
                🔍 중복확인
              </button>
            </div>
            <div id="nonceCheckResult" class="hidden mt-1"></div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
            <input type="text" id="recordTimestamp" class="w-full px-3 py-2 border rounded-md font-mono text-sm mb-1" placeholder="직접 입력 또는 자동 생성">
            <button onclick="step2.generateTimestamp()" class="w-full px-2 py-1 bg-gray-500 text-white rounded text-xs" title="현재 시간 기준 타임스탬프 생성">
              ⏰ 현재 시간 생성
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mission ID</label>
            <input type="text" id="missionId" class="w-full px-3 py-2 border rounded-md" value="${CONFIG.DEFAULT_VALUES.missionId}">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Voting ID</label>
            <input type="text" id="votingId" class="w-full px-3 py-2 border rounded-md font-mono text-sm mb-1" placeholder="직접 입력 또는 자동 생성">
            <button onclick="step2.generateVotingId()" class="w-full px-2 py-1 bg-purple-500 text-white rounded text-xs" title="타임스탬프 + 사용자 인덱스 기반 유니크 ID 생성">
              🎲 자동 생성
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Artist ID (optionId)</label>
            <input type="text" id="optionId" class="w-full px-3 py-2 border rounded-md" value="${CONFIG.DEFAULT_VALUES.optionId}">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Vote Type</label>
            <select id="voteType" class="w-full px-3 py-2 border rounded-md">
              <option value="1">Remember (1)</option>
              <option value="0">Forget (0)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Voting Amount</label>
            <input type="text" id="votingAmt" class="w-full px-3 py-2 border rounded-md" value="${CONFIG.DEFAULT_VALUES.votingAmt}">
          </div>
        </div>

        <button onclick="step2.addRecord()" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
          + 레코드 추가
        </button>

        <div class="mt-4">
          <p class="text-sm font-medium text-gray-700 mb-2">
            작성된 레코드 (<span id="recordCount">0</span>/${CONFIG.MAX_RECORDS_PER_BATCH})
          </p>

          <div class="grid grid-cols-3 gap-4">
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

            <!-- Custom 사용자 레코드 -->
            <div class="bg-purple-50 rounded-lg border-2 border-purple-200 p-3">
              <p class="text-sm font-semibold text-purple-800 mb-2">
                <i data-lucide="key" class="w-4 h-4 inline"></i> Custom 레코드 (<span id="customRecordCount">0</span>개)
              </p>
              <div id="customRecordsList" class="space-y-2 min-h-[80px]">
                <p class="text-purple-400 text-xs">Custom 레코드가 없습니다</p>
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

    const selectedUserValue = document.getElementById('selectedUser').value;
    let wallet;
    let selectedUserIndex;

    if (selectedUserValue === 'custom') {
      // 직접 입력한 Private Key 사용
      const customPrivateKey = document.getElementById('customPrivateKey').value.trim();
      if (!customPrivateKey) {
        alert('Private Key를 입력해주세요!');
        return;
      }
      try {
        wallet = new ethers.Wallet(customPrivateKey);
        // custom 사용자는 userIndex를 99로 설정 (별도 그룹)
        selectedUserIndex = 99;
        // state에 저장
        this.state.customWallet = wallet;
      } catch (e) {
        alert('유효하지 않은 Private Key입니다.');
        return;
      }
    } else {
      selectedUserIndex = parseInt(selectedUserValue);
      wallet = selectedUserIndex === 0 ? this.state.user1Wallet : this.state.user2Wallet;

      if (!wallet) {
        alert('먼저 Step 1에서 지갑을 초기화해주세요!');
        return;
      }
    }

    // userNonce 가져오기 및 검증
    const userNonceValue = document.getElementById('userNonce').value.trim();
    if (!userNonceValue || userNonceValue === '') {
      alert('User Nonce를 입력하거나 🎲 생성 버튼을 눌러주세요!');
      return;
    }

    // 숫자 형식 검증 (BigInt 지원)
    if (!/^\d+$/.test(userNonceValue)) {
      alert('유효하지 않은 User Nonce입니다. 숫자만 입력해주세요.');
      return;
    }

    // state에 저장 (문자열로 저장, 사용 시 BigInt 변환)
    if (selectedUserIndex === 0) {
      this.state.user1Nonce = userNonceValue;
    } else if (selectedUserIndex === 1) {
      this.state.user2Nonce = userNonceValue;
    } else {
      this.state.customNonce = userNonceValue;
    }

    // votingId 검증 (유저 배치 단위 원자성: 한 유저의 records는 votingId가 모두 같아야 함)
    const votingIdValue = document.getElementById('votingId').value;
    if (!votingIdValue || votingIdValue === '') {
      alert('먼저 🎲 생성 버튼을 눌러 Voting ID를 생성해주세요!\n(유저 배치 내 모든 레코드는 같은 votingId여야 합니다)');
      return;
    }

    // votingId는 문자열로 저장 (큰 숫자 지원, eip712.js에서 BigInt 변환)
    const parsedVotingId = votingIdValue.trim();

    // 숫자 형식 검증
    if (!/^\d+$/.test(parsedVotingId)) {
      alert('유효하지 않은 Voting ID입니다. 숫자만 입력해주세요.');
      return;
    }

    // 이미 해당 유저에 레코드가 있으면 votingId 고정
    const existing = this.records.find(r => r.userIndex === selectedUserIndex);
    if (existing && existing.votingId !== parsedVotingId) {
      alert(
        `같은 유저(User ${selectedUserIndex + 1})의 레코드는 모두 같은 votingId여야 합니다.\n` +
        `기존 votingId: ${existing.votingId}\n` +
        `입력 votingId: ${parsedVotingId}\n\n` +
        `기존 votingId로 자동 맞춥니다.`
      );
      document.getElementById('votingId').value = existing.votingId;
    }

    // timestamp: 입력값이 있으면 사용, 없으면 자동 생성
    const timestampInput = document.getElementById('recordTimestamp').value.trim();
    const timestamp = timestampInput || String(Date.now());

    const record = {
      userIndex: selectedUserIndex,
      userAddress: wallet.address,  // step7 필터링용 (컨트랙트에는 제출 안 함)
      // 모든 uint256 필드는 문자열로 저장 (큰 숫자 지원, eip712.js에서 BigInt 변환)
      timestamp: timestamp,
      missionId: document.getElementById('missionId').value,
      votingId: existing ? existing.votingId : parsedVotingId,
      optionId: document.getElementById('optionId').value,
      voteType: parseInt(document.getElementById('voteType').value),  // uint8은 작은 숫자
      userId: document.getElementById('userId').value,
      votingAmt: document.getElementById('votingAmt').value
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

    // Custom 사용자 레코드 표시
    const customRecords = this.records.filter(r => r.userIndex === 99);
    document.getElementById('customRecordCount').textContent = customRecords.length;
    const customList = document.getElementById('customRecordsList');
    if (customRecords.length === 0) {
      customList.innerHTML = '<p class="text-purple-400 text-xs">Custom 레코드가 없습니다</p>';
    } else {
      customList.innerHTML = customRecords.map((r, idx) => {
        const globalIndex = this.records.findIndex(rec => rec === r);
        return `
        <div class="record-card border-purple-300 relative group">
          <button onclick="step2.deleteRecord(${globalIndex})"
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="삭제">
            ×
          </button>
          <p class="text-xs font-mono text-purple-700">
            #${idx + 1}: M${r.missionId} V${r.votingId} C${r.optionId}
            ${r.voteType === 1 ? '<i data-lucide="thumbs-up" class="w-3 h-3 inline"></i>' : '<i data-lucide="thumbs-down" class="w-3 h-3 inline"></i>'} ${r.votingAmt}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Addr: <span class="font-mono">${r.userAddress.slice(0, 8)}...</span>
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
    const userName = record.userIndex === 0 ? 'User 1' : (record.userIndex === 1 ? 'User 2' : 'Custom');

    if (confirm(`${userName}의 레코드를 삭제하시겠습니까?`)) {
      this.records.splice(index, 1);
      this.state.records = this.records;
      this.updateUI();
      console.log(`[SUCCESS] Record deleted at index ${index}`);
    }
  }

  /**
   * 사용자 선택 변경 시 호출
   */
  onUserSelectionChange() {
    const selectedValue = document.getElementById('selectedUser').value;
    const customSection = document.getElementById('customPrivateKeySection');

    if (selectedValue === 'custom') {
      customSection.classList.remove('hidden');
    } else {
      customSection.classList.add('hidden');
    }
  }

  /**
   * Custom Private Key 입력 시 주소 업데이트
   */
  updateCustomAddress() {
    const privateKey = document.getElementById('customPrivateKey').value.trim();
    const addressSpan = document.getElementById('customUserAddress');

    try {
      const wallet = new ethers.Wallet(privateKey);
      addressSpan.textContent = wallet.address;
      this.state.customWallet = wallet;
    } catch (e) {
      addressSpan.textContent = 'Invalid key';
    }
  }

  /**
   * Timestamp 자동 생성 (현재 시간)
   */
  generateTimestamp() {
    const timestamp = Date.now().toString();
    document.getElementById('recordTimestamp').value = timestamp;
    console.log(`[SUCCESS] Timestamp generated:`, timestamp);
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

      // 숫자 형식 검증 (BigInt 지원)
      if (!/^\d+$/.test(nonceValue)) {
        alert('유효하지 않은 Nonce 값입니다. 숫자만 입력해주세요.');
        return;
      }

      // BigInt로 변환 (큰 숫자 지원)
      const nonceBigInt = BigInt(nonceValue);

      // 컨트랙트 인스턴스 생성
      const provider = this.state.provider;
      const contract = new ethers.Contract(
        this.state.contractAddress,
        ['function usedUserNonces(address, uint256) view returns (bool)'],
        provider
      );

      // usedUserNonces 조회 (중복 체크 - true면 이미 사용됨)
      console.log(`[SEARCH] Checking if nonce ${nonceValue} is used for ${wallet.address}...`);
      const isUsed = await contract.usedUserNonces(wallet.address, nonceBigInt);

      // UI 업데이트
      resultDiv.classList.remove('hidden');
      if (isUsed) {
        resultDiv.innerHTML = `
          <span class="text-red-600 text-xs font-semibold">
            ❌ 이미 사용된 Nonce입니다. 다른 값을 사용해주세요.
          </span>
        `;
        console.log(`[WARNING] Nonce ${nonceValue} is already used for User ${selectedUserIndex + 1}`);
      } else {
        resultDiv.innerHTML = `
          <span class="text-green-600 text-xs font-semibold">
            ✅ 사용 가능한 Nonce입니다.
          </span>
        `;
        console.log(`[SUCCESS] Nonce ${nonceValue} is available for User ${selectedUserIndex + 1}`);

        // state에도 저장 (문자열로 저장, 사용 시 BigInt 변환)
        if (selectedUserIndex === 0) {
          this.state.user1Nonce = nonceValue;
        } else {
          this.state.user2Nonce = nonceValue;
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
