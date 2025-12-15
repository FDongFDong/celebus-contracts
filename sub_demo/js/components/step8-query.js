/**
 * Step 8: 컨트랙트 조회
 * SubVoting 컨트랙트의 모든 view 함수를 UI에서 호출 가능하게 함
 */

import { CONFIG } from '../config.js?v=2';

export class Step8Query {
  constructor(state) {
    this.state = state;
    this.activeTab = 'voteResults';
  }

  render() {
    return `
      <div class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-purple-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="px-2 py-1 bg-purple-500 text-white rounded text-sm mr-2">STEP 8</span>
          🔍 컨트랙트 조회
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          SubVoting 컨트랙트의 다양한 데이터를 조회합니다
        </p>

        <!-- 탭 네비게이션 -->
        <div class="flex border-b border-gray-200 mb-4 overflow-x-auto">
          <button id="tab-voteResults" onclick="step8.switchTab('voteResults')"
                  class="tab-btn px-4 py-2 text-sm font-medium border-b-2 border-purple-500 text-purple-600">
            📊 투표 결과
          </button>
          <button id="tab-question" onclick="step8.switchTab('question')"
                  class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            ❓ Question/Option
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
      case 'question':
        tabContent.innerHTML = this.renderQuestionTab();
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

  renderVoteResultsTab() {
    return `
      <div class="space-y-6">
        <!-- 질문별 집계 조회 -->
        <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h3 class="font-semibold text-purple-900 mb-3">📊 질문별 집계 조회</h3>
          <p class="text-xs text-gray-600 mb-3">getQuestionAggregates(missionId, questionId)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_questionAgg_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Question ID</label>
              <input id="q_questionAgg_questionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryQuestionAggregates()"
                  class="bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600">
            조회
          </button>
          <div id="result_questionAggregates" class="mt-3"></div>
        </div>

        <!-- 투표 요약 조회 -->
        <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h3 class="font-semibold text-purple-900 mb-3">📈 투표 요약 조회</h3>
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

        <!-- 옵션별 투표 수 조회 -->
        <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h3 class="font-semibold text-purple-900 mb-3">🗳️ 옵션별 투표 수</h3>
          <p class="text-xs text-gray-600 mb-3">getQuestionAggregates(missionId, questionId)[optionId]</p>
          <div class="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_optionVotes_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Question ID</label>
              <input id="q_optionVotes_questionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Option ID (1~10)</label>
              <input id="q_optionVotes_optionId" type="number" value="1" min="1" max="10"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryOptionVotes()"
                  class="bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600">
            조회
          </button>
          <div id="result_optionVotes" class="mt-3"></div>
        </div>
      </div>
    `;
  }

  renderQuestionTab() {
    return `
      <div class="space-y-6">
        <!-- 질문+옵션 전체 조회 -->
        <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h3 class="font-semibold text-indigo-900 mb-3">📋 질문+옵션 전체 조회</h3>
          <p class="text-xs text-gray-600 mb-3">getQuestionWithOptions(missionId, questionId)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_questionWithOptions_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Question ID</label>
              <input id="q_questionWithOptions_questionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryQuestionWithOptions()"
                  class="bg-indigo-500 text-white px-4 py-2 rounded text-sm hover:bg-indigo-600">
            조회
          </button>
          <div id="result_questionWithOptions" class="mt-3"></div>
        </div>

        <!-- 질문 이름 -->
        <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h3 class="font-semibold text-indigo-900 mb-3">🏷️ 질문 이름</h3>
          <p class="text-xs text-gray-600 mb-3">questionName(missionId, questionId)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_questionName_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Question ID</label>
              <input id="q_questionName_questionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryQuestionName()"
                  class="bg-indigo-500 text-white px-4 py-2 rounded text-sm hover:bg-indigo-600">
            조회
          </button>
          <div id="result_questionName" class="mt-3"></div>
        </div>

        <!-- 옵션 이름 -->
        <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h3 class="font-semibold text-indigo-900 mb-3">🏷️ 옵션 이름</h3>
          <p class="text-xs text-gray-600 mb-3">optionName(missionId, questionId, optionId)</p>
          <div class="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_optionName_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Question ID</label>
              <input id="q_optionName_questionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Option ID (1~10)</label>
              <input id="q_optionName_optionId" type="number" value="1" min="1" max="10"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryOptionName()"
                  class="bg-indigo-500 text-white px-4 py-2 rounded text-sm hover:bg-indigo-600">
            조회
          </button>
          <div id="result_optionName" class="mt-3"></div>
        </div>

        <!-- 질문 허용 여부 -->
        <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h3 class="font-semibold text-indigo-900 mb-3">✅ 질문 허용 여부</h3>
          <p class="text-xs text-gray-600 mb-3">allowedQuestion(missionId, questionId)</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_allowedQuestion_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Question ID</label>
              <input id="q_allowedQuestion_questionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryAllowedQuestion()"
                  class="bg-indigo-500 text-white px-4 py-2 rounded text-sm hover:bg-indigo-600">
            조회
          </button>
          <div id="result_allowedQuestion" class="mt-3"></div>
        </div>

        <!-- 옵션 허용 여부 -->
        <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h3 class="font-semibold text-indigo-900 mb-3">✅ 옵션 허용 여부</h3>
          <p class="text-xs text-gray-600 mb-3">allowedOption(missionId, questionId, optionId)</p>
          <div class="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
              <input id="q_allowedOption_missionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Question ID</label>
              <input id="q_allowedOption_questionId" type="number" value="1" min="0"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Option ID (1~10)</label>
              <input id="q_allowedOption_optionId" type="number" value="1" min="1" max="10"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <button onclick="step8.queryAllowedOption()"
                  class="bg-indigo-500 text-white px-4 py-2 rounded text-sm hover:bg-indigo-600">
            조회
          </button>
          <div id="result_allowedOption" class="mt-3"></div>
        </div>
      </div>
    `;
  }

  renderRecordTab() {
    return `
      <div class="space-y-6">
        <!-- 투표 레코드 조회 -->
        <div class="bg-teal-50 rounded-lg p-4 border border-teal-200">
          <h3 class="font-semibold text-teal-900 mb-3">📝 투표 레코드 조회</h3>
          <p class="text-xs text-gray-600 mb-3">getVoteByHash(hash) - bytes32 hash로 특정 레코드 조회</p>
          <div class="mb-3">
            <label class="block text-xs text-gray-600 mb-1">Hash (bytes32)</label>
            <input id="q_votes_hash" type="text" placeholder="0x..."
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
    } else if (format === 'optionVotes') {
      el.innerHTML = this.renderOptionVotesCards(data);
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

  renderOptionVotesCards(data) {
    const { optionVotes, total } = data;
    const optionCards = optionVotes.slice(1, 11).map((votes, idx) => {
      const optionId = idx + 1;
      const voteCount = votes.toString();
      return `
        <div class="bg-blue-50 p-2 rounded text-center border border-blue-200">
          <p class="text-xs text-gray-600">Option ${optionId}</p>
          <p class="text-lg font-bold text-blue-600">${voteCount}</p>
        </div>
      `;
    }).join('');

    return `
      <div class="mt-2">
        <div class="grid grid-cols-5 gap-2 mb-3">
          ${optionCards}
        </div>
        <div class="bg-green-50 p-3 rounded text-center border border-green-200">
          <p class="text-sm text-gray-600">Total Votes</p>
          <p class="text-2xl font-bold text-green-600">${total.toString()}</p>
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

  // ==================== 투표 결과 조회 ====================

  async queryQuestionAggregates() {
    const resultId = 'result_questionAggregates';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_questionAgg_missionId').value;
      const questionId = document.getElementById('q_questionAgg_questionId').value;

      const result = await contract.getQuestionAggregates(missionId, questionId);
      this.showResult(resultId, { optionVotes: result.optionVotes, total: result.total }, 'optionVotes');
    } catch (err) {
      console.error('queryQuestionAggregates error:', err);
      this.showError(resultId, err.message);
    }
  }

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

  async queryOptionVotes() {
    const resultId = 'result_optionVotes';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_optionVotes_missionId').value;
      const questionId = document.getElementById('q_optionVotes_questionId').value;
      const optionId = document.getElementById('q_optionVotes_optionId').value;

      const [optionVotes, total] = await contract.getQuestionAggregates(missionId, questionId);
      const votes = optionVotes[optionId];
      this.showResult(resultId, { optionId, votes: votes.toString(), total: total.toString() });
    } catch (err) {
      console.error('queryOptionVotes error:', err);
      this.showError(resultId, err.message);
    }
  }

  // ==================== Question/Option 조회 ====================

  async queryQuestionWithOptions() {
    const resultId = 'result_questionWithOptions';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_questionWithOptions_missionId').value;
      const questionId = document.getElementById('q_questionWithOptions_questionId').value;

      const result = await contract.getQuestionWithOptions(missionId, questionId);

      const data = {
        questionText: result.questionText || '(등록되지 않음)',
        questionAllowed: result.questionAllowed,
        options: result.options.map(o => ({
          optionId: o.optionId.toString(),
          optionText: o.optionText,
          votes: o.votes.toString(),
          allowed: o.allowed
        }))
      };

      this.showResult(resultId, data);
    } catch (err) {
      console.error('queryQuestionWithOptions error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryQuestionName() {
    const resultId = 'result_questionName';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_questionName_missionId').value;
      const questionId = document.getElementById('q_questionName_questionId').value;

      const name = await contract.questionName(missionId, questionId);
      this.showResult(resultId, { name: name || '(등록되지 않음)' });
    } catch (err) {
      console.error('queryQuestionName error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryOptionName() {
    const resultId = 'result_optionName';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_optionName_missionId').value;
      const questionId = document.getElementById('q_optionName_questionId').value;
      const optionId = document.getElementById('q_optionName_optionId').value;

      const name = await contract.optionName(missionId, questionId, optionId);
      this.showResult(resultId, { name: name || '(등록되지 않음)' });
    } catch (err) {
      console.error('queryOptionName error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryAllowedQuestion() {
    const resultId = 'result_allowedQuestion';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_allowedQuestion_missionId').value;
      const questionId = document.getElementById('q_allowedQuestion_questionId').value;

      const allowed = await contract.allowedQuestion(missionId, questionId);
      this.showResult(resultId, allowed, 'bool');
    } catch (err) {
      console.error('queryAllowedQuestion error:', err);
      this.showError(resultId, err.message);
    }
  }

  async queryAllowedOption() {
    const resultId = 'result_allowedOption';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const missionId = document.getElementById('q_allowedOption_missionId').value;
      const questionId = document.getElementById('q_allowedOption_questionId').value;
      const optionId = document.getElementById('q_allowedOption_optionId').value;

      const allowed = await contract.allowedOption(missionId, questionId, optionId);
      this.showResult(resultId, allowed, 'bool');
    } catch (err) {
      console.error('queryAllowedOption error:', err);
      this.showError(resultId, err.message);
    }
  }

  // ==================== 레코드 조회 ====================

  async queryVoteRecord() {
    const resultId = 'result_voteRecord';
    try {
      this.showLoading(resultId);
      const contract = this.getContract();
      const hash = document.getElementById('q_votes_hash').value;

      if (!hash || !hash.startsWith('0x') || hash.length !== 66) {
        throw new Error('올바른 bytes32 형식의 hash를 입력해주세요 (0x + 64 hex chars)');
      }

      const record = await contract.getVoteByHash(hash);

      // timestamp가 0이면 존재하지 않는 레코드
      if (record.timestamp.toString() === '0') {
        this.showError(resultId, '해당 hash의 레코드가 존재하지 않습니다.');
        return;
      }

      const data = {
        timestamp: new Date(Number(record.timestamp) * 1000).toLocaleString(),
        missionId: record.missionId.toString(),
        votingId: record.votingId.toString(),
        userId: record.userId,
        questionId: record.questionId.toString(),
        optionId: record.optionId.toString(),
        votingAmt: record.votingAmt.toString()
      };

      this.showResult(resultId, data);
    } catch (err) {
      console.error('queryVoteRecord error:', err);
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
}
