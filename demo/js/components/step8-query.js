/**
 * Step 8: 컨트랙트 조회
 * 모든 view 함수를 UI에서 호출 가능하게 함
 */

import { CONFIG } from '../config.js';

export class Step8Query {
  constructor(state) {
    this.state = state;
    this.activeTab = 'voteResults';
  }

  render() {
    return `
      <div class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-purple-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-purple-500">STEP 8</span>
          <i data-lucide="search" class="w-5 h-5 inline"></i> 컨트랙트 조회
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          컨트랙트의 다양한 데이터를 조회합니다
        </p>

        <!-- 탭 네비게이션 -->
        <div class="flex border-b border-gray-200 mb-4 overflow-x-auto">
          <button id="tab-voteResults" onclick="step8.switchTab('voteResults')"
                  class="tab-btn px-4 py-2 text-sm font-medium border-b-2 border-purple-500 text-purple-600">
            <i data-lucide="bar-chart-2" class="w-4 h-4 inline"></i> 투표 결과
          </button>
          <button id="tab-artist" onclick="step8.switchTab('artist')"
                  class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            <i data-lucide="palette" class="w-4 h-4 inline"></i> Artist
          </button>
          <button id="tab-record" onclick="step8.switchTab('record')"
                  class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            <i data-lucide="file-text" class="w-4 h-4 inline"></i> 레코드
          </button>
          <button id="tab-nonce" onclick="step8.switchTab('nonce')"
                  class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            <i data-lucide="hash" class="w-4 h-4 inline"></i> Nonce
          </button>
          <button id="tab-settings" onclick="step8.switchTab('settings')"
                  class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            <i data-lucide="settings" class="w-4 h-4 inline"></i> 설정
          </button>
          <button id="tab-failedLogs" onclick="step8.switchTab('failedLogs')"
                  class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            <i data-lucide="x-circle" class="w-4 h-4 inline"></i> 실패 로그
          </button>
        </div>

        <!-- 탭 콘텐츠 -->
        <div id="tabContent">
          ${this.renderVoteResultsTab()}
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
      case 'voteResults':
        tabContent.innerHTML = this.renderVoteResultsTab();
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
      case 'failedLogs':
        tabContent.innerHTML = this.renderFailedLogsTab();
        break;
    }
  }

  // ==================== 탭 렌더링 ====================

  renderVoteResultsTab() {
    return `
      <div class="space-y-6">
        <!-- 투표 요약 조회 -->
        <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h3 class="font-semibold text-purple-900 mb-3"><i data-lucide="bar-chart-2" class="w-4 h-4 inline"></i> 투표 요약 조회</h3>
          <p class="text-xs text-gray-600 mb-3">getVoteSummariesByMissionVotingId(missionId, votingId)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_voteSummary_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Voting ID</label>
              <input id="q_voteSummary_votingId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryVoteSummaries()"
                  class="bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600">
            조회
          </button>
          <div id="result_voteSummaries" class="mt-3"></div>
        </div>

        <!-- Artist 집계 조회 -->
        <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h3 class="font-semibold text-purple-900 mb-3"><i data-lucide="trending-up" class="w-4 h-4 inline"></i> Artist 집계 조회</h3>
          <p class="text-xs text-gray-600 mb-3">getArtistAggregates(missionId, optionId)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_artistAgg_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Artist ID</label>
              <input id="q_artistAgg_optionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryArtistAggregates()"
                  class="bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600">
            조회
          </button>
          <div id="result_artistAggregates" class="mt-3"></div>
        </div>
      </div>
    `;
  }

  renderArtistTab() {
    return `
      <div class="space-y-6">
        <!-- Artist 통계 -->
        <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h3 class="font-semibold text-indigo-900 mb-3"><i data-lucide="bar-chart-2" class="w-4 h-4 inline"></i> Artist 통계</h3>
          <p class="text-xs text-gray-600 mb-3">artistStats(missionId, optionId)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_artistStats_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Artist ID</label>
              <input id="q_artistStats_optionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryArtistStats()"
                  class="bg-indigo-500 text-white px-4 py-2 rounded text-sm hover:bg-indigo-600">
            조회
          </button>
          <div id="result_artistStats" class="mt-3"></div>
        </div>

        <!-- Artist 이름 -->
        <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h3 class="font-semibold text-indigo-900 mb-3"><i data-lucide="tag" class="w-4 h-4 inline"></i> Artist 이름</h3>
          <p class="text-xs text-gray-600 mb-3">artistName(missionId, optionId)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_artistName_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Artist ID</label>
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

        <!-- Artist 허용 여부 -->
        <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h3 class="font-semibold text-indigo-900 mb-3"><i data-lucide="check-circle" class="w-4 h-4 inline"></i> Artist 허용 여부</h3>
          <p class="text-xs text-gray-600 mb-3">allowedArtist(missionId, optionId)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_allowedArtist_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Artist ID</label>
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
      </div>
    `;
  }

  renderRecordTab() {
    return `
      <div class="space-y-6">
        <!-- 투표 레코드 조회 -->
        <div class="bg-teal-50 rounded-lg p-4 border border-teal-200">
          <h3 class="font-semibold text-teal-900 mb-3"><i data-lucide="file-text" class="w-4 h-4 inline"></i> 투표 레코드 조회</h3>
          <p class="text-xs text-gray-600 mb-3">votes(digest) - bytes32 digest로 특정 레코드 조회</p>
          <div class="mb-3">
            <label class="block text-xs text-gray-600 mb-1">Digest (bytes32)</label>
            <input id="q_votes_digest" type="text" placeholder="0x..."
                   class="w-full p-2 border rounded text-sm font-mono">
          </div>
          <button onclick="step8.queryVoteRecord()"
                  class="bg-teal-500 text-white px-4 py-2 rounded text-sm hover:bg-teal-600">
            조회
          </button>
          <div id="result_voteRecord" class="mt-3"></div>
        </div>
      </div>
    `;
  }

  renderNonceTab() {
    return `
      <div class="space-y-6">
        <!-- 순차 카운터 방식 안내 -->
        <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 class="font-semibold text-blue-900 mb-2"><i data-lucide="info" class="w-4 h-4 inline"></i> Nonce 시스템 안내</h3>
          <p class="text-sm text-blue-800">
            순차 카운터 방식: 각 사용자/Executor는 0부터 시작하여 순서대로 Nonce를 사용합니다.
            조회되는 값은 <strong>다음에 사용할 Nonce</strong>입니다.
          </p>
        </div>

        <!-- User Nonce -->
        <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <h3 class="font-semibold text-orange-900 mb-3"><i data-lucide="hash" class="w-4 h-4 inline"></i> User Nonce</h3>
          <p class="text-xs text-gray-600 mb-3">userNonce(user) - 다음 사용할 Nonce 반환</p>
          <div class="mb-3">
            <label class="block text-xs text-gray-600 mb-1">User Address</label>
            <input id="q_userNonce_user" type="text" placeholder="0x..."
                   class="w-full p-2 border rounded text-sm font-mono">
          </div>
          <button onclick="step8.queryUserNonce()"
                  class="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600">
            조회
          </button>
          <div id="result_userNonce" class="mt-3"></div>
        </div>

        <!-- Batch Nonce -->
        <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <h3 class="font-semibold text-orange-900 mb-3"><i data-lucide="hash" class="w-4 h-4 inline"></i> Batch Nonce</h3>
          <p class="text-xs text-gray-600 mb-3">batchNonce(executor) - 다음 사용할 Nonce 반환</p>
          <div class="mb-3">
            <label class="block text-xs text-gray-600 mb-1">Executor Address</label>
            <input id="q_batchNonce_executor" type="text" placeholder="0x..."
                   class="w-full p-2 border rounded text-sm font-mono">
          </div>
          <button onclick="step8.queryBatchNonce()"
                  class="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600">
            조회
          </button>
          <div id="result_batchNonce" class="mt-3"></div>
        </div>
      </div>
    `;
  }

  renderSettingsTab() {
    return `
      <div class="space-y-6">
        <!-- Vote Type Name -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-3"><i data-lucide="tag" class="w-4 h-4 inline"></i> Vote Type 이름</h3>
          <p class="text-xs text-gray-600 mb-3">voteTypeName(voteType)</p>
          <div class="mb-3">
            <label class="block text-xs text-gray-600 mb-1">Vote Type (0=Forget, 1=Remember)</label>
            <input id="q_voteTypeName_type" type="number" value="1" min="0" max="255"
                   class="w-full p-2 border rounded text-sm">
          </div>
          <button onclick="step8.queryVoteTypeName()"
                  class="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
            조회
          </button>
          <div id="result_voteTypeName" class="mt-3"></div>
        </div>

        <!-- Executor Signer -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-3"><i data-lucide="user" class="w-4 h-4 inline"></i> Executor Signer</h3>
          <p class="text-xs text-gray-600 mb-3">executorSigner() - 현재 등록된 Executor 주소</p>
          <button onclick="step8.queryExecutorSigner()"
                  class="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
            조회
          </button>
          <div id="result_executorSigner" class="mt-3"></div>
        </div>

        <!-- Owner -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-3"><i data-lucide="crown" class="w-4 h-4 inline"></i> Owner</h3>
          <p class="text-xs text-gray-600 mb-3">owner() - 컨트랙트 소유자 주소</p>
          <button onclick="step8.queryOwner()"
                  class="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
            조회
          </button>
          <div id="result_owner" class="mt-3"></div>
        </div>

        <!-- Domain Separator -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-3"><i data-lucide="lock" class="w-4 h-4 inline"></i> Domain Separator</h3>
          <p class="text-xs text-gray-600 mb-3">domainSeparator() - EIP-712 Domain Separator</p>
          <button onclick="step8.queryDomainSeparator()"
                  class="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
            조회
          </button>
          <div id="result_domainSeparator" class="mt-3"></div>
        </div>
      </div>
    `;
  }

  renderFailedLogsTab() {
    return `
      <div class="space-y-6">
        <!-- UserBatchFailed 이벤트 조회 -->
        <div class="bg-red-50 rounded-lg p-4 border border-red-200">
          <h3 class="font-semibold text-red-900 mb-3"><i data-lucide="x-circle" class="w-4 h-4 inline"></i> 실패한 유저 배치 조회</h3>
          <p class="text-xs text-gray-600 mb-3">UserBatchFailed 이벤트 - Soft Fail로 처리된 유저 목록</p>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">From Block (빈칸: 최근 1000블록)</label>
              <input id="q_failedLogs_fromBlock" type="number" placeholder="예: 12345678"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">To Block (빈칸: latest)</label>
              <input id="q_failedLogs_toBlock" type="number" placeholder="예: 12346678"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>

          <div class="mb-3">
            <label class="block text-xs text-gray-600 mb-1">또는 특정 Batch Digest로 필터링 (선택사항)</label>
            <input id="q_failedLogs_batchDigest" type="text" placeholder="0x..."
                   class="w-full p-2 border rounded text-sm font-mono">
          </div>

          <button onclick="step8.queryFailedUsers()"
                  class="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600">
            실패 로그 조회
          </button>
          <div id="result_failedLogs" class="mt-3"></div>
        </div>

        <!-- REASON 코드 설명 -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-3"><i data-lucide="clipboard" class="w-4 h-4 inline"></i> 실패 사유 코드 안내</h3>
          <div class="text-sm space-y-1">
            <div class="flex"><span class="w-12 font-mono text-red-600">1</span><span>레코드 수가 0개이거나 20개 초과</span></div>
            <div class="flex"><span class="w-12 font-mono text-red-600">2</span><span>유저 서명이 유효하지 않음</span></div>
            <div class="flex"><span class="w-12 font-mono text-red-600">3</span><span>Nonce 순서 위반 (순차 카운터 불일치)</span></div>
            <div class="flex"><span class="w-12 font-mono text-red-600">5</span><span>VoteType이 유효하지 않음 (0,1 외의 값)</span></div>
            <div class="flex"><span class="w-12 font-mono text-red-600">6</span><span>허용되지 않은 아티스트에게 투표</span></div>
          </div>
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
    } else if (format === 'stats') {
      el.innerHTML = this.renderStatsCards(data);
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
        <p class="text-red-800 text-sm"><i data-lucide="x-circle" class="w-4 h-4 inline"></i> ${message}</p>
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

  renderStatsCards(data) {
    return `
      <div class="grid grid-cols-3 gap-3 mt-2">
        <div class="bg-green-50 p-3 rounded-lg text-center border border-green-200">
          <p class="text-xl font-bold text-green-600">${data.remember?.toString() || '0'}</p>
          <p class="text-xs text-gray-600">Remember</p>
        </div>
        <div class="bg-red-50 p-3 rounded-lg text-center border border-red-200">
          <p class="text-xl font-bold text-red-600">${data.forget?.toString() || '0'}</p>
          <p class="text-xs text-gray-600">Forget</p>
        </div>
        <div class="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
          <p class="text-xl font-bold text-blue-600">${data.total?.toString() || '0'}</p>
          <p class="text-xs text-gray-600">Total</p>
        </div>
      </div>
    `;
  }

  renderAddressResult(address) {
    return `
      <div class="bg-white rounded border p-3 mt-2 flex items-center justify-between">
        <span class="font-mono text-sm">${address}</span>
        <button onclick="step8.copyToClipboard('${address}')"
                class="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs">
          <i data-lucide="clipboard" class="w-3 h-3 inline"></i> 복사
        </button>
      </div>
    `;
  }

  renderBoolResult(value) {
    const isTrue = value === true;
    return `
      <div class="mt-2 p-3 rounded ${isTrue ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border">
        <span class="font-semibold ${isTrue ? 'text-green-700' : 'text-red-700'}">
          ${isTrue ? 'True (사용됨/허용됨)' : 'False (미사용/비허용)'}
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
            <i data-lucide="clipboard" class="w-3 h-3 inline"></i> 복사
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
      alert('복사되었습니다!');
    }).catch(err => {
      console.error('복사 실패:', err);
    });
  }

  // ==================== 투표 결과 조회 ====================

  async queryVoteSummaries() {
    const resultId = 'result_voteSummaries';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_voteSummary_missionId').value;
      const votingId = document.getElementById('q_voteSummary_votingId').value;

      const summaries = await contract.getVoteSummariesByMissionVotingId(missionId, votingId);

      // 결과 변환
      const data = summaries.map(s => ({
        timestamp: new Date(Number(s.timestamp) * 1000).toLocaleString(),
        missionId: s.missionId.toString(),
        votingId: s.votingId.toString(),
        userId: s.userId,
        votingFor: s.votingFor,
        votedOn: s.votedOn,
        votingAmt: s.votingAmt.toString()
      }));

      this.showResult(resultId, data, 'table');
    } catch (err) {
      console.error('queryVoteSummaries error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryArtistAggregates() {
    const resultId = 'result_artistAggregates';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_artistAgg_missionId').value;
      const optionId = document.getElementById('q_artistAgg_optionId').value;

      const [remember, forget, total] = await contract.getArtistAggregates(missionId, optionId);
      this.showResult(resultId, { remember, forget, total }, 'stats');
    } catch (err) {
      console.error('queryArtistAggregates error:', err);
      this.showError(resultId, err.message);
    }
  }

  // ==================== Artist 조회 ====================

  async queryArtistStats() {
    const resultId = 'result_artistStats';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_artistStats_missionId').value;
      const optionId = document.getElementById('q_artistStats_optionId').value;

      const [remember, forget, total] = await contract.artistStats(missionId, optionId);
      this.showResult(resultId, { remember, forget, total }, 'stats');
    } catch (err) {
      console.error('queryArtistStats error:', err);
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

  // ==================== 레코드 조회 ====================

  async queryVoteRecord() {
    const resultId = 'result_voteRecord';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const digest = document.getElementById('q_votes_digest').value;

      if (!digest || !digest.startsWith('0x') || digest.length !== 66) {
        throw new Error('올바른 bytes32 형식의 digest를 입력해주세요 (0x + 64 hex chars)');
      }

      const record = await contract.votes(digest);

      // timestamp가 0이면 존재하지 않는 레코드
      if (record.timestamp.toString() === '0') {
        this.showError(resultId, '해당 digest의 레코드가 존재하지 않습니다.');
        return;
      }

      const data = {
        timestamp: new Date(Number(record.timestamp) * 1000).toLocaleString(),
        missionId: record.missionId.toString(),
        votingId: record.votingId.toString(),
        optionId: record.optionId.toString(),
        voteType: record.voteType === 0 ? '0 (Forget)' : '1 (Remember)',
        userId: record.userId,
        votingAmt: record.votingAmt.toString()
      };

      this.showResult(resultId, data);
    } catch (err) {
      console.error('queryVoteRecord error:', err);
      this.showError(resultId, err.message);
    }
  }

  // ==================== Nonce 조회 ====================

  async queryUserNonce() {
    const resultId = 'result_userNonce';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const user = document.getElementById('q_userNonce_user').value;

      if (!ethers.isAddress(user)) {
        throw new Error('올바른 주소를 입력해주세요');
      }

      const nonce = await contract.userNonce(user);
      this.showResult(resultId, {
        nextNonce: nonce.toString(),
        description: `이 사용자의 다음 투표는 nonce ${nonce.toString()}을 사용해야 합니다`
      });
    } catch (err) {
      console.error('queryUserNonce error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryBatchNonce() {
    const resultId = 'result_batchNonce';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const executor = document.getElementById('q_batchNonce_executor').value;

      if (!ethers.isAddress(executor)) {
        throw new Error('올바른 주소를 입력해주세요');
      }

      const nonce = await contract.batchNonce(executor);
      this.showResult(resultId, {
        nextNonce: nonce.toString(),
        description: `이 Executor의 다음 배치는 nonce ${nonce.toString()}을 사용해야 합니다`
      });
    } catch (err) {
      console.error('queryBatchNonce error:', err);
      this.showError(resultId, err.message);
    }
  }

  // ==================== 설정 조회 ====================

  async queryVoteTypeName() {
    const resultId = 'result_voteTypeName';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const voteType = document.getElementById('q_voteTypeName_type').value;

      const name = await contract.voteTypeName(voteType);
      this.showResult(resultId, { voteType, name: name || '(설정되지 않음)' });
    } catch (err) {
      console.error('queryVoteTypeName error:', err);
      this.showError(resultId, err.message);
    }
  }

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

  // ==================== 실패 로그 조회 ====================

  getReasonDescription(reasonCode) {
    const reasons = {
      1: '레코드 수가 0개이거나 20개 초과',
      2: '유저 서명이 유효하지 않음',
      3: 'Nonce 순서 위반 (순차 카운터 불일치)',
      5: 'VoteType이 유효하지 않음',
      6: '허용되지 않은 아티스트'
    };
    return reasons[reasonCode] || `알 수 없는 사유 (${reasonCode})`;
  }

  async queryFailedUsers() {
    const resultId = 'result_failedLogs';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();

      // 블록 범위 설정
      const fromBlockInput = document.getElementById('q_failedLogs_fromBlock').value;
      const toBlockInput = document.getElementById('q_failedLogs_toBlock').value;
      const batchDigestInput = document.getElementById('q_failedLogs_batchDigest').value.trim();

      // 현재 블록 가져오기
      const currentBlock = await this.state.provider.getBlockNumber();

      let fromBlock = fromBlockInput ? parseInt(fromBlockInput) : currentBlock - 1000;
      let toBlock = toBlockInput ? parseInt(toBlockInput) : 'latest';

      // 음수 방지
      if (fromBlock < 0) fromBlock = 0;

      // UserBatchFailed 이벤트 필터 생성
      const filter = contract.filters.UserBatchFailed(
        batchDigestInput || null,  // batchDigest (indexed)
        null                        // user (indexed)
      );

      console.log(`Querying UserBatchFailed events from block ${fromBlock} to ${toBlock}`);

      // 이벤트 조회
      const events = await contract.queryFilter(filter, fromBlock, toBlock);

      if (events.length === 0) {
        const el = document.getElementById(resultId);
        el.innerHTML = `
          <div class="bg-green-50 border border-green-200 rounded p-3 mt-2">
            <p class="text-green-800 text-sm"><i data-lucide="check-circle" class="w-4 h-4 inline"></i> 해당 블록 범위에서 실패한 유저가 없습니다.</p>
            <p class="text-xs text-gray-500 mt-1">조회 범위: 블록 ${fromBlock} ~ ${toBlock === 'latest' ? currentBlock : toBlock}</p>
          </div>
        `;
        return;
      }

      // 이벤트 데이터 변환
      const data = events.map(event => ({
        blockNumber: event.blockNumber,
        txHash: event.transactionHash.slice(0, 10) + '...' + event.transactionHash.slice(-8),
        fullTxHash: event.transactionHash,
        batchDigest: event.args.batchDigest.slice(0, 10) + '...' + event.args.batchDigest.slice(-8),
        fullBatchDigest: event.args.batchDigest,
        user: event.args.user.slice(0, 6) + '...' + event.args.user.slice(-4),
        fullUser: event.args.user,
        userNonce: event.args.userNonce.toString(),
        reasonCode: event.args.reasonCode,
        reasonDesc: this.getReasonDescription(event.args.reasonCode)
      }));

      // 테이블 렌더링
      const el = document.getElementById(resultId);
      el.innerHTML = `
        <div class="mt-2">
          <p class="text-sm text-gray-600 mb-2">총 ${data.length}건의 실패 로그 (블록 ${fromBlock} ~ ${toBlock === 'latest' ? currentBlock : toBlock})</p>
          <div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
              <thead class="bg-red-100">
                <tr>
                  <th class="p-2 border text-left">블록</th>
                  <th class="p-2 border text-left">Tx Hash</th>
                  <th class="p-2 border text-left">User</th>
                  <th class="p-2 border text-left">Nonce</th>
                  <th class="p-2 border text-left">사유</th>
                </tr>
              </thead>
              <tbody>
                ${data.map(row => `
                  <tr class="hover:bg-red-50">
                    <td class="p-2 border font-mono">${row.blockNumber}</td>
                    <td class="p-2 border font-mono cursor-pointer" title="${row.fullTxHash}" onclick="step8.copyToClipboard('${row.fullTxHash}')">${row.txHash}</td>
                    <td class="p-2 border font-mono cursor-pointer" title="${row.fullUser}" onclick="step8.copyToClipboard('${row.fullUser}')">${row.user}</td>
                    <td class="p-2 border font-mono">${row.userNonce}</td>
                    <td class="p-2 border">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        ${row.reasonCode}: ${row.reasonDesc}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('queryFailedUsers error:', err);
      this.showError(resultId, err.message);
    }
  }
}
