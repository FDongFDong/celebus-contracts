/**
 * Step 5: Struct Hash 계산
 */

import { CONFIG } from '../config.js';
import { calculateStructHash, generateExplanation } from '../utils/eip712.js';

export class Step5Struct {
  constructor(state) {
    this.state = state;
  }

  render() {
    return `
      <div class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-yellow-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-yellow-500">STEP 5</span>
          <i data-lucide="bar-chart-2" class="w-5 h-5 inline"></i> Struct Hash 계산
        </h2>
        <p class="text-sm text-gray-600 mb-4">서명할 데이터 구조의 해시를 계산합니다</p>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Batch Nonce</label>
          <div class="flex gap-2">
            <input type="number" id="batchNonce" class="flex-1 px-3 py-2 border rounded-md" value="0" min="0">
            <button onclick="step5.findNextNonce()"
                    class="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 whitespace-nowrap">
              <i data-lucide="search" class="w-4 h-4 inline"></i> 다음 Nonce 찾기
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            배치의 고유 번호 (재전송 방지용) - 사용된 nonce는 재사용 불가
          </p>
          <div id="nonceCheckResult" class="hidden mt-2"></div>
        </div>

        <!-- 계산 버튼 -->
        <button onclick="step5.calculate()"
                class="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">
          <i data-lucide="hash" class="w-4 h-4 inline"></i> Struct Hash 계산
        </button>

        <!-- 계산 결과 -->
        <div id="structHashResult" class="mt-4 hidden">
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Batch TypeHash
            </label>
            <input type="text" id="batchTypeHash"
                   class="w-full px-3 py-2 border rounded-md font-mono text-xs bg-gray-50"
                   readonly>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Struct Hash (계산 결과)
            </label>
            <input type="text" id="structHash"
                   class="w-full px-3 py-2 border rounded-md font-mono text-xs bg-green-50"
                   readonly>
            <p class="text-xs text-green-600 mt-1">
              <i data-lucide="check-circle" class="w-3 h-3 inline"></i> 이 값이 Step 6에서 자동으로 사용됩니다
            </p>
          </div>
        </div>

        <!-- 계산 과정 설명 -->
        <details class="mt-4">
          <summary class="cursor-pointer text-yellow-600 font-semibold hover:text-yellow-800">
            <i data-lucide="book-open" class="w-4 h-4 inline"></i> 계산 과정 보기
          </summary>
          <div id="structExplanation" class="mt-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p class="text-sm text-gray-600">계산 버튼을 클릭하면 여기에 상세한 계산 과정이 표시됩니다.</p>
          </div>
        </details>
      </div>
    `;
  }

  async findNextNonce() {
    try {
      if (!this.state.executorWallet) {
        alert('먼저 STEP 1에서 Executor 지갑을 초기화해주세요!');
        return;
      }

      const resultDiv = document.getElementById('nonceCheckResult');
      resultDiv.innerHTML = '<p class="text-sm text-blue-600"><i data-lucide="search" class="w-4 h-4 inline"></i> 다음 nonce를 조회하는 중...</p>';
      resultDiv.classList.remove('hidden');

      const provider = new ethers.JsonRpcProvider('https://opbnb-testnet-rpc.bnbchain.org');
      const contract = new ethers.Contract(
        this.state.contractAddress,
        ['function batchNonce(address) view returns (uint256)'],
        provider
      );

      const executorAddress = this.state.executorWallet.address;

      // 순차 카운터 방식: batchNonce(address)로 다음 사용할 Nonce 직접 조회
      const nextNonce = await contract.batchNonce(executorAddress);
      const nonceValue = parseInt(nextNonce.toString());

      document.getElementById('batchNonce').value = nonceValue;
      resultDiv.innerHTML = `<p class="text-sm text-green-600"><i data-lucide="check-circle" class="w-4 h-4 inline"></i> 다음 사용할 nonce: ${nonceValue}</p>`;
      console.log('[SUCCESS] Next batch nonce:', nonceValue);

    } catch (error) {
      console.error('[ERROR] Nonce check failed:', error);
      document.getElementById('nonceCheckResult').innerHTML =
        `<p class="text-sm text-red-600"><i data-lucide="x-circle" class="w-4 h-4 inline"></i> 조회 실패: ${error.message}</p>`;
    }
  }

  calculate() {
    try {
      // Batch Nonce 가져오기
      const batchNonce = parseInt(document.getElementById('batchNonce').value);

      // Batch TypeHash 계산
      const batchTypeHash = ethers.keccak256(
        ethers.toUtf8Bytes('Batch(uint256 batchNonce)')
      );

      // Struct Hash 계산
      const structHash = calculateStructHash(batchNonce);

      // State에 저장
      this.state.batchNonce = batchNonce;
      this.state.batchTypeHash = batchTypeHash;
      this.state.structHash = structHash;

      // UI 업데이트
      document.getElementById('batchTypeHash').value = batchTypeHash;
      document.getElementById('structHash').value = structHash;
      document.getElementById('structHashResult').classList.remove('hidden');

      // 계산 과정 설명 생성
      const explanation = generateExplanation('struct', { batchNonce });
      document.getElementById('structExplanation').innerHTML = explanation;

      console.log('[SUCCESS] Struct Hash calculated:', {
        batchNonce,
        batchTypeHash,
        structHash
      });

    } catch (error) {
      console.error('[ERROR] Struct Hash calculation failed:', error);
      alert('계산 실패: ' + error.message);
    }
  }
}
