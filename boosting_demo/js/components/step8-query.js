/**
 * Step 8: 컨트랙트 조회
 * Boosting 컨트랙트의 모든 view 함수를 UI에서 호출 가능하게 함
 */

import { CONFIG } from '../config.js';

export class Step8Query {
  constructor(state) {
    this.state = state;
    this.activeTab = 'boostResults';
  }

  render() {
    return `
      <div class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-purple-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="px-2 py-1 bg-purple-500 text-white rounded text-sm mr-2">STEP 8</span>
          🔍 컨트랙트 조회
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          Boosting 컨트랙트의 다양한 데이터를 조회합니다
        </p>

        <!-- 탭 네비게이션 -->
        <div class="flex border-b border-gray-200 mb-4 overflow-x-auto">
          <button id="tab-boostResults" onclick="step8.switchTab('boostResults')"
                  class="tab-btn px-4 py-2 text-sm font-medium border-b-2 border-purple-500 text-purple-600">
            📊 부스팅 결과
          </button>
          <button id="tab-artist" onclick="step8.switchTab('artist')"
                  class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            🎨 아티스트
          </button>
          <button id="tab-record" onclick="step8.switchTab('record')"
                  class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            📝 레코드
          </button>
          <button id="tab-nonce" onclick="step8.switchTab('nonce')"
                  class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            🔢 Nonce
          </button>
          <button id="tab-settings" onclick="step8.switchTab('settings')"
                  class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            ⚙️ 설정
          </button>
        </div>

        <!-- 탭 콘텐츠 -->
        <div id="tabContent">
          ${this.renderBoostResultsTab()}
        </div>
      </div>
    `;
  }

  switchTab(tabId) {
    this.activeTab = tabId;

    // 탭 버튼 스타일 업데이트
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('border-b-2', 'border-purple-500', 'text-purple-600');
      btn.classList.add('text-gray-500');
    });

    const activeBtn = document.getElementById(`tab-${tabId}`);
    if (activeBtn) {
      activeBtn.classList.remove('text-gray-500');
      activeBtn.classList.add('border-b-2', 'border-purple-500', 'text-purple-600');
    }

    // 탭 콘텐츠 업데이트
    const tabContent = document.getElementById('tabContent');
    switch (tabId) {
      case 'boostResults':
        tabContent.innerHTML = this.renderBoostResultsTab();
        break;
      case 'artist':
        tabContent.innerHTML = this.renderArtistTab();
        break;
      case 'record':
        tabContent.innerHTML = this.renderRecordTab();
        break;
      case 'nonce':
        tabContent.innerHTML = this.renderNonceTab();
        break;
      case 'settings':
        tabContent.innerHTML = this.renderSettingsTab();
        break;
    }
  }

  // ==================== 탭 렌더링 ====================

  renderBoostResultsTab() {
    return `
      <div class="space-y-6">
        <!-- 부스팅 요약 조회 -->
        <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h3 class="font-semibold text-purple-900 mb-3">📈 부스팅 요약 조회</h3>
          <p class="text-xs text-gray-600 mb-3">getBoostSummariesByBoostingId(missionId, boostingId)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_boostSummary_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Boosting ID</label>
              <input id="q_boostSummary_boostingId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryBoostSummaries()"
                  class="bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600">
            조회
          </button>
          <div id="result_boostSummaries" class="mt-3"></div>
        </div>

        <!-- 아티스트별 총 부스팅 포인트 -->
        <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h3 class="font-semibold text-purple-900 mb-3">🏆 아티스트별 총 부스팅 포인트</h3>
          <p class="text-xs text-gray-600 mb-3">getArtistTotalAmt(missionId, optionId)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_artistTotal_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Artist ID (optionId)</label>
              <input id="q_artistTotal_optionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryArtistTotalAmt()"
                  class="bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600">
            조회
          </button>
          <div id="result_artistTotal" class="mt-3"></div>
        </div>

        <!-- 부스팅 횟수 조회 -->
        <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h3 class="font-semibold text-purple-900 mb-3">📊 부스팅 횟수</h3>
          <p class="text-xs text-gray-600 mb-3">boostCount(missionId, boostingId) / boostCountByMission(missionId)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_boostCount_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Boosting ID</label>
              <input id="q_boostCount_boostingId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryBoostCount()"
                  class="bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600">
            조회
          </button>
          <div id="result_boostCount" class="mt-3"></div>
        </div>
      </div>
    `;
  }

  renderArtistTab() {
    return `
      <div class="space-y-6">
        <!-- 아티스트 정보 조회 -->
        <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h3 class="font-semibold text-indigo-900 mb-3">📋 아티스트 정보 조회</h3>
          <p class="text-xs text-gray-600 mb-3">getArtistInfo(missionId, optionId)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_artistInfo_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Artist ID (optionId)</label>
              <input id="q_artistInfo_optionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryArtistInfo()"
                  class="bg-indigo-500 text-white px-4 py-2 rounded text-sm hover:bg-indigo-600">
            조회
          </button>
          <div id="result_artistInfo" class="mt-3"></div>
        </div>

        <!-- 아티스트 이름 -->
        <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h3 class="font-semibold text-indigo-900 mb-3">🏷️ 아티스트 이름</h3>
          <p class="text-xs text-gray-600 mb-3">artistName(missionId, optionId)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_artistName_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Artist ID (optionId)</label>
              <input id="q_artistName_optionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryArtistName()"
                  class="bg-indigo-500 text-white px-4 py-2 rounded text-sm hover:bg-indigo-600">
            조회
          </button>
          <div id="result_artistName" class="mt-3"></div>
        </div>

        <!-- 아티스트 허용 여부 -->
        <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h3 class="font-semibold text-indigo-900 mb-3">✅ 아티스트 허용 여부</h3>
          <p class="text-xs text-gray-600 mb-3">allowedArtist(missionId, optionId)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_allowedArtist_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Artist ID (optionId)</label>
              <input id="q_allowedArtist_optionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryAllowedArtist()"
                  class="bg-indigo-500 text-white px-4 py-2 rounded text-sm hover:bg-indigo-600">
            조회
          </button>
          <div id="result_allowedArtist" class="mt-3"></div>
        </div>

        <!-- 부스팅 타입 이름 -->
        <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h3 class="font-semibold text-indigo-900 mb-3">🏷️ 부스팅 타입 이름</h3>
          <p class="text-xs text-gray-600 mb-3">boostingTypeName(typeId) - 0=CELB, 1=BP 등</p>
          <div class="mb-3">
            <label class="block text-xs text-gray-600 mb-1">Type ID (0 또는 1)</label>
            <input id="q_boostingTypeName_typeId" type="number" value="0" min="0" max="1"
                   class="w-full p-2 border rounded text-sm">
          </div>
          <button onclick="step8.queryBoostingTypeName()"
                  class="bg-indigo-500 text-white px-4 py-2 rounded text-sm hover:bg-indigo-600">
            조회
          </button>
          <div id="result_boostingTypeName" class="mt-3"></div>
        </div>
      </div>
    `;
  }

  renderRecordTab() {
    return `
      <div class="space-y-6">
        <!-- 부스팅 레코드 조회 -->
        <div class="bg-teal-50 rounded-lg p-4 border border-teal-200">
          <h3 class="font-semibold text-teal-900 mb-3">📝 부스팅 레코드 조회</h3>
          <p class="text-xs text-gray-600 mb-3">getBoostByHash(hash) - bytes32 hash로 특정 레코드 조회</p>
          <div class="mb-3">
            <label class="block text-xs text-gray-600 mb-1">Hash (bytes32)</label>
            <input id="q_boosts_hash" type="text" placeholder="0x..."
                   class="w-full p-2 border rounded text-sm font-mono">
          </div>
          <button onclick="step8.queryBoostRecord()"
                  class="bg-teal-500 text-white px-4 py-2 rounded text-sm hover:bg-teal-600">
            조회
          </button>
          <div id="result_boostRecord" class="mt-3"></div>
        </div>
      </div>
    `;
  }

  renderNonceTab() {
    return `
      <div class="space-y-6">
        <!-- Min User Nonce -->
        <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <h3 class="font-semibold text-orange-900 mb-3">🔢 Min User Nonce</h3>
          <p class="text-xs text-gray-600 mb-3">minUserNonce(user)</p>
          <div class="mb-3">
            <label class="block text-xs text-gray-600 mb-1">User Address</label>
            <input id="q_minUserNonce_user" type="text" placeholder="0x..."
                   class="w-full p-2 border rounded text-sm font-mono">
          </div>
          <button onclick="step8.queryMinUserNonce()"
                  class="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600">
            조회
          </button>
          <div id="result_minUserNonce" class="mt-3"></div>
        </div>

        <!-- Min Batch Nonce -->
        <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <h3 class="font-semibold text-orange-900 mb-3">🔢 Min Batch Nonce</h3>
          <p class="text-xs text-gray-600 mb-3">minBatchNonce(executor)</p>
          <div class="mb-3">
            <label class="block text-xs text-gray-600 mb-1">Executor Address</label>
            <input id="q_minBatchNonce_executor" type="text" placeholder="0x..."
                   class="w-full p-2 border rounded text-sm font-mono">
          </div>
          <button onclick="step8.queryMinBatchNonce()"
                  class="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600">
            조회
          </button>
          <div id="result_minBatchNonce" class="mt-3"></div>
        </div>

        <!-- User Nonce Used -->
        <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <h3 class="font-semibold text-orange-900 mb-3">✅ User Nonce 사용 여부</h3>
          <p class="text-xs text-gray-600 mb-3">userNonceUsed(user, nonce)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">User Address</label>
              <input id="q_userNonceUsed_user" type="text" placeholder="0x..."
                     class="w-full p-2 border rounded text-sm font-mono">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Nonce</label>
              <input id="q_userNonceUsed_nonce" type="number" value="0" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryUserNonceUsed()"
                  class="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600">
            조회
          </button>
          <div id="result_userNonceUsed" class="mt-3"></div>
        </div>

        <!-- Batch Nonce Used -->
        <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <h3 class="font-semibold text-orange-900 mb-3">✅ Batch Nonce 사용 여부</h3>
          <p class="text-xs text-gray-600 mb-3">batchNonceUsed(executor, nonce)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Executor Address</label>
              <input id="q_batchNonceUsed_executor" type="text" placeholder="0x..."
                     class="w-full p-2 border rounded text-sm font-mono">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Nonce</label>
              <input id="q_batchNonceUsed_nonce" type="number" value="0" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryBatchNonceUsed()"
                  class="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600">
            조회
          </button>
          <div id="result_batchNonceUsed" class="mt-3"></div>
        </div>
      </div>
    `;
  }

  renderSettingsTab() {
    return `
      <div class="space-y-6">
        <!-- Executor Signer -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-3">👤 Executor Signer</h3>
          <p class="text-xs text-gray-600 mb-3">executorSigner() - 현재 등록된 Executor 주소</p>
          <button onclick="step8.queryExecutorSigner()"
                  class="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
            조회
          </button>
          <div id="result_executorSigner" class="mt-3"></div>
        </div>

        <!-- Owner -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-3">👑 Owner</h3>
          <p class="text-xs text-gray-600 mb-3">owner() - 컨트랙트 소유자 주소</p>
          <button onclick="step8.queryOwner()"
                  class="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
            조회
          </button>
          <div id="result_owner" class="mt-3"></div>
        </div>

        <!-- Domain Separator -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-3">🔐 Domain Separator</h3>
          <p class="text-xs text-gray-600 mb-3">domainSeparator() - EIP-712 Domain Separator</p>
          <button onclick="step8.queryDomainSeparator()"
                  class="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
            조회
          </button>
          <div id="result_domainSeparator" class="mt-3"></div>
        </div>

        <!-- Chain ID -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-3">🔗 Chain ID</h3>
          <p class="text-xs text-gray-600 mb-3">CHAIN_ID() - 컨트랙트 배포 시 고정된 체인 ID</p>
          <button onclick="step8.queryChainId()"
                  class="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
            조회
          </button>
          <div id="result_chainId" class="mt-3"></div>
        </div>
      </div>
    `;
  }

  // ==================== 조회 메서드 ====================

  getContract() {
    if (!this.state.contractAddress) {
      throw new Error('컨트랙트 주소가 설정되지 않았습니다.');
    }
    return new ethers.Contract(this.state.contractAddress, CONFIG.ABI, this.state.provider);
  }

  showResult(elementId, data, format = 'json') {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (format === 'table' && Array.isArray(data)) {
      el.innerHTML = this.renderTable(data);
    } else if (format === 'address') {
      el.innerHTML = this.renderAddressResult(data);
    } else if (format === 'bool') {
      el.innerHTML = this.renderBoolResult(data);
    } else if (format === 'bytes32') {
      el.innerHTML = this.renderBytes32Result(data);
    } else {
      el.innerHTML = `
        <div class="bg-white rounded border p-3 mt-2">
          <pre class="text-xs font-mono whitespace-pre-wrap overflow-x-auto">${JSON.stringify(data, null, 2)}</pre>
        </div>
      `;
    }
  }

  showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = `
      <div class="bg-red-50 border border-red-200 rounded p-3 mt-2">
        <p class="text-red-800 text-sm">❌ ${message}</p>
      </div>
    `;
  }

  showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = `
      <div class="flex items-center mt-2">
        <svg class="animate-spin h-4 w-4 text-purple-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm text-gray-600">조회 중...</span>
      </div>
    `;
  }

  renderTable(data) {
    if (!data || data.length === 0) {
      return '<p class="text-gray-500 text-sm mt-2">데이터가 없습니다.</p>';
    }

    const headers = Object.keys(data[0]);
    return `
      <div class="overflow-x-auto mt-2">
        <table class="w-full text-xs border-collapse">
          <thead class="bg-gray-100">
            <tr>
              ${headers.map(h => `<th class="p-2 border text-left">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr class="hover:bg-gray-50">
                ${headers.map(h => `<td class="p-2 border font-mono">${this.formatValue(row[h])}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderAddressResult(address) {
    return `
      <div class="bg-white rounded border p-3 mt-2 flex items-center justify-between">
        <span class="font-mono text-sm">${address}</span>
        <button onclick="step8.copyToClipboard('${address}')"
                class="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs">
          📋 복사
        </button>
      </div>
    `;
  }

  renderBoolResult(value) {
    const isTrue = value === true;
    return `
      <div class="mt-2 p-3 rounded ${isTrue ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border">
        <span class="font-semibold ${isTrue ? 'text-green-700' : 'text-red-700'}">
          ${isTrue ? '✅ True (허용됨/사용됨)' : '❌ False (비허용/미사용)'}
        </span>
      </div>
    `;
  }

  renderBytes32Result(value) {
    return `
      <div class="bg-white rounded border p-3 mt-2">
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs break-all">${value}</span>
          <button onclick="step8.copyToClipboard('${value}')"
                  class="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs ml-2 flex-shrink-0">
            📋 복사
          </button>
        </div>
      </div>
    `;
  }

  formatValue(val) {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'bigint') return val.toString();
    if (typeof val === 'object' && val._isBigNumber) return val.toString();
    return String(val);
  }

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert('📋 복사되었습니다!');
    }).catch(err => {
      console.error('복사 실패:', err);
    });
  }

  // ==================== 부스팅 결과 조회 ====================

  async queryBoostSummaries() {
    const resultId = 'result_boostSummaries';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_boostSummary_missionId').value;
      const boostingId = document.getElementById('q_boostSummary_boostingId').value;

      const summaries = await contract.getBoostSummariesByBoostingId(missionId, boostingId);

      // 결과 변환
      const data = summaries.map(s => ({
        timestamp: new Date(Number(s.timestamp) * 1000).toLocaleString(),
        missionId: s.missionId.toString(),
        boostingId: s.boostingId.toString(),
        userId: s.userId,
        boostingFor: s.boostingFor,
        boostingWith: s.boostingWith,
        amt: s.amt.toString()
      }));

      this.showResult(resultId, data, 'table');
    } catch (err) {
      console.error('queryBoostSummaries error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryArtistTotalAmt() {
    const resultId = 'result_artistTotal';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_artistTotal_missionId').value;
      const optionId = document.getElementById('q_artistTotal_optionId').value;

      const totalAmt = await contract.getArtistTotalAmt(missionId, optionId);
      this.showResult(resultId, { missionId, optionId, totalAmt: totalAmt.toString() });
    } catch (err) {
      console.error('queryArtistTotalAmt error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryBoostCount() {
    const resultId = 'result_boostCount';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_boostCount_missionId').value;
      const boostingId = document.getElementById('q_boostCount_boostingId').value;

      const [count, missionCount] = await Promise.all([
        contract.boostCount(missionId, boostingId),
        contract.boostCountByMission(missionId)
      ]);

      this.showResult(resultId, {
        missionId,
        boostingId,
        boostCount: count.toString(),
        missionTotalBoostCount: missionCount.toString()
      });
    } catch (err) {
      console.error('queryBoostCount error:', err);
      this.showError(resultId, err.message);
    }
  }

  // ==================== 아티스트 조회 ====================

  async queryArtistInfo() {
    const resultId = 'result_artistInfo';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_artistInfo_missionId').value;
      const optionId = document.getElementById('q_artistInfo_optionId').value;

      const info = await contract.getArtistInfo(missionId, optionId);

      const data = {
        artistName: info.artistName || '(등록되지 않음)',
        allowed: info.allowed,
        totalAmt: info.totalAmt.toString()
      };

      this.showResult(resultId, data);
    } catch (err) {
      console.error('queryArtistInfo error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryArtistName() {
    const resultId = 'result_artistName';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_artistName_missionId').value;
      const optionId = document.getElementById('q_artistName_optionId').value;

      const name = await contract.artistName(missionId, optionId);
      this.showResult(resultId, { name: name || '(등록되지 않음)' });
    } catch (err) {
      console.error('queryArtistName error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryAllowedArtist() {
    const resultId = 'result_allowedArtist';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_allowedArtist_missionId').value;
      const optionId = document.getElementById('q_allowedArtist_optionId').value;

      const allowed = await contract.allowedArtist(missionId, optionId);
      this.showResult(resultId, allowed, 'bool');
    } catch (err) {
      console.error('queryAllowedArtist error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryBoostingTypeName() {
    const resultId = 'result_boostingTypeName';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const typeId = document.getElementById('q_boostingTypeName_typeId').value;

      const name = await contract.boostingTypeName(typeId);
      this.showResult(resultId, { typeId, name: name || '(등록되지 않음)' });
    } catch (err) {
      console.error('queryBoostingTypeName error:', err);
      this.showError(resultId, err.message);
    }
  }

  // ==================== 레코드 조회 ====================

  async queryBoostRecord() {
    const resultId = 'result_boostRecord';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const hash = document.getElementById('q_boosts_hash').value;

      if (!hash || !hash.startsWith('0x') || hash.length !== 66) {
        throw new Error('올바른 bytes32 형식의 hash를 입력해주세요 (0x + 64 hex chars)');
      }

      const record = await contract.getBoostByHash(hash);

      // timestamp가 0이면 존재하지 않는 레코드
      if (record.timestamp.toString() === '0') {
        this.showError(resultId, '해당 hash의 레코드가 존재하지 않습니다.');
        return;
      }

      const data = {
        timestamp: new Date(Number(record.timestamp) * 1000).toLocaleString(),
        missionId: record.missionId.toString(),
        boostingId: record.boostingId.toString(),
        userId: record.userId,
        optionId: record.optionId.toString(),
        boostingWith: record.boostingWith.toString(),
        amt: record.amt.toString()
      };

      this.showResult(resultId, data);
    } catch (err) {
      console.error('queryBoostRecord error:', err);
      this.showError(resultId, err.message);
    }
  }

  // ==================== Nonce 조회 ====================

  async queryMinUserNonce() {
    const resultId = 'result_minUserNonce';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const user = document.getElementById('q_minUserNonce_user').value;

      if (!ethers.isAddress(user)) {
        throw new Error('올바른 주소를 입력해주세요');
      }

      const nonce = await contract.minUserNonce(user);
      this.showResult(resultId, { minUserNonce: nonce.toString() });
    } catch (err) {
      console.error('queryMinUserNonce error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryMinBatchNonce() {
    const resultId = 'result_minBatchNonce';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const executor = document.getElementById('q_minBatchNonce_executor').value;

      if (!ethers.isAddress(executor)) {
        throw new Error('올바른 주소를 입력해주세요');
      }

      const nonce = await contract.minBatchNonce(executor);
      this.showResult(resultId, { minBatchNonce: nonce.toString() });
    } catch (err) {
      console.error('queryMinBatchNonce error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryUserNonceUsed() {
    const resultId = 'result_userNonceUsed';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const user = document.getElementById('q_userNonceUsed_user').value;
      const nonce = document.getElementById('q_userNonceUsed_nonce').value;

      if (!ethers.isAddress(user)) {
        throw new Error('올바른 주소를 입력해주세요');
      }

      const used = await contract.userNonceUsed(user, nonce);
      this.showResult(resultId, used, 'bool');
    } catch (err) {
      console.error('queryUserNonceUsed error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryBatchNonceUsed() {
    const resultId = 'result_batchNonceUsed';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const executor = document.getElementById('q_batchNonceUsed_executor').value;
      const nonce = document.getElementById('q_batchNonceUsed_nonce').value;

      if (!ethers.isAddress(executor)) {
        throw new Error('올바른 주소를 입력해주세요');
      }

      const used = await contract.batchNonceUsed(executor, nonce);
      this.showResult(resultId, used, 'bool');
    } catch (err) {
      console.error('queryBatchNonceUsed error:', err);
      this.showError(resultId, err.message);
    }
  }

  // ==================== 설정 조회 ====================

  async queryExecutorSigner() {
    const resultId = 'result_executorSigner';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();

      const signer = await contract.executorSigner();
      this.showResult(resultId, signer, 'address');
    } catch (err) {
      console.error('queryExecutorSigner error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryOwner() {
    const resultId = 'result_owner';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();

      const owner = await contract.owner();
      this.showResult(resultId, owner, 'address');
    } catch (err) {
      console.error('queryOwner error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryDomainSeparator() {
    const resultId = 'result_domainSeparator';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();

      const separator = await contract.domainSeparator();
      this.showResult(resultId, separator, 'bytes32');
    } catch (err) {
      console.error('queryDomainSeparator error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryChainId() {
    const resultId = 'result_chainId';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();

      const chainId = await contract.CHAIN_ID();
      this.showResult(resultId, { chainId: chainId.toString() });
    } catch (err) {
      console.error('queryChainId error:', err);
      this.showError(resultId, err.message);
    }
  }
}
