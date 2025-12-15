/**
 * Step 4: Domain Separator 계산
 */

import { CONFIG } from '../config.js?v=2';
import { calculateDomainSeparator, generateExplanation } from '../utils/eip712.js';

export class Step4Domain {
  constructor(state) {
    this.state = state;
  }

  render() {
    return `
      <div class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-indigo-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-indigo-500">STEP 4</span>
          🔐 Domain Separator 계산
        </h2>
        <p class="text-sm text-gray-600 mb-4">EIP-712 Domain을 식별하는 고유 해시를 계산합니다</p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <!-- 입력 필드들 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Domain Name</label>
            <input type="text" id="domainName" class="w-full px-3 py-2 border rounded-md"
                   value="${CONFIG.DOMAIN.name}">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Domain Version</label>
            <input type="text" id="domainVersion" class="w-full px-3 py-2 border rounded-md"
                   value="${CONFIG.DOMAIN.version}">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Chain ID</label>
            <input type="number" id="chainId" class="w-full px-3 py-2 border rounded-md"
                   value="${CONFIG.DOMAIN.chainId}">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Verifying Contract</label>
            <input type="text" id="verifyingContract" class="w-full px-3 py-2 border rounded-md text-xs"
                   value="${CONFIG.DOMAIN.verifyingContract}">
          </div>
        </div>

        <!-- 계산 버튼 -->
        <button onclick="step4.calculate()"
                class="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600">
          🔢 Domain Separator 계산
        </button>

        <!-- 계산 결과 -->
        <div id="domainSeparatorResult" class="mt-4 hidden">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Domain Separator (계산 결과)
          </label>
          <input type="text" id="domainSeparator"
                 class="w-full px-3 py-2 border rounded-md font-mono text-xs bg-green-50"
                 readonly>
          <p class="text-xs text-green-600 mt-1">
            ✅ 이 값이 Step 6에서 자동으로 사용됩니다
          </p>
        </div>

        <!-- 계산 과정 설명 (접을 수 있음) -->
        <details class="mt-4">
          <summary class="cursor-pointer text-indigo-600 font-semibold hover:text-indigo-800">
            📖 계산 과정 보기
          </summary>
          <div id="domainExplanation" class="mt-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <p class="text-sm text-gray-600">계산 버튼을 클릭하면 여기에 상세한 계산 과정이 표시됩니다.</p>
          </div>
        </details>
      </div>
    `;
  }

  calculate() {
    try {
      // 입력값 가져오기
      const domain = {
        name: document.getElementById('domainName').value,
        version: document.getElementById('domainVersion').value,
        chainId: parseInt(document.getElementById('chainId').value),
        verifyingContract: document.getElementById('verifyingContract').value
      };

      // Domain Separator 계산
      const domainSeparator = calculateDomainSeparator(domain);

      // State에 저장
      this.state.domain = domain;
      this.state.domainSeparator = domainSeparator;

      // UI 업데이트
      document.getElementById('domainSeparator').value = domainSeparator;
      document.getElementById('domainSeparatorResult').classList.remove('hidden');

      // 계산 과정 설명 생성
      const explanation = generateExplanation('domain', domain);
      document.getElementById('domainExplanation').innerHTML = explanation;

      console.log('✅ Domain Separator calculated:', {
        domain,
        domainSeparator
      });

    } catch (error) {
      console.error('❌ Domain Separator calculation failed:', error);
      alert('계산 실패: ' + error.message);
    }
  }
}
