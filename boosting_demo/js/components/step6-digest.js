/**
 * Step 6: Final Digest 계산 및 Executor 서명
 */

import { CONFIG, getDomain } from '../config.js';
import { calculateDigest, generateExplanation } from '../utils/eip712.js';

export class Step6Digest {
  constructor(state) {
    this.state = state;
  }

  render() {
    return `
      <div class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-green-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-green-500">STEP 6</span>
          🔏 Final Digest 및 Executor 서명
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          Step 4와 5의 결과를 결합하여 최종 서명할 해시를 생성합니다
        </p>

        <!-- Step 4, 5 결과 자동 복사 -->
        <div class="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Domain Separator (Step 4에서 자동 복사)
            </label>
            <input type="text" id="domainSeparatorInput"
                   class="w-full px-3 py-2 border rounded-md font-mono text-xs bg-blue-50"
                   placeholder="Step 4를 먼저 완료해주세요">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Struct Hash (Step 5에서 자동 복사)
            </label>
            <input type="text" id="structHashInput"
                   class="w-full px-3 py-2 border rounded-md font-mono text-xs bg-yellow-50"
                   placeholder="Step 5를 먼저 완료해주세요">
          </div>
        </div>

        <!-- Digest 계산 버튼 -->
        <button onclick="step6.calculateDigest()"
                class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 mr-2">
          🔢 Final Digest 계산
        </button>

        <!-- 계산 결과 -->
        <div id="digestResult" class="mt-4 hidden">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Final Digest (EIP-191)
          </label>
          <input type="text" id="finalDigest"
                 class="w-full px-3 py-2 border rounded-md font-mono text-xs bg-green-50"
                 readonly>
        </div>

        <!-- 서명 생성 버튼 -->
        <div id="signatureSection" class="mt-4 hidden">
          <button onclick="step6.generateSignature()"
                  class="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600">
            ✍️ Executor 서명 생성
          </button>

          <div id="signatureResult" class="mt-4 hidden">
            <div class="bg-purple-50 border border-purple-200 rounded p-4">
              <p class="font-semibold text-purple-900 mb-2">🔐 ECDSA 서명 컴포넌트:</p>

              <div class="space-y-2 text-xs">
                <div>
                  <p class="text-purple-700 font-semibold">r:</p>
                  <p class="font-mono bg-white p-2 rounded break-all" id="sigR">-</p>
                </div>
                <div>
                  <p class="text-purple-700 font-semibold">s:</p>
                  <p class="font-mono bg-white p-2 rounded break-all" id="sigS">-</p>
                </div>
                <div>
                  <p class="text-purple-700 font-semibold">v:</p>
                  <p class="font-mono bg-white p-2 rounded" id="sigV">-</p>
                </div>
              </div>

              <div class="mt-3">
                <p class="text-purple-700 font-semibold">최종 서명 (65 bytes):</p>
                <input type="text" id="executorSignature"
                       class="w-full px-3 py-2 border rounded-md font-mono text-xs bg-white mt-1"
                       readonly>
              </div>

              <div class="mt-3">
                <p class="text-purple-700 font-semibold">서명자:</p>
                <p class="font-mono text-xs" id="executorSignerAddress">-</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 계산 과정 설명 -->
        <details class="mt-4">
          <summary class="cursor-pointer text-green-600 font-semibold hover:text-green-800">
            📖 계산 과정 보기
          </summary>
          <div id="digestExplanation" class="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <p class="text-sm text-gray-600">Digest 계산 버튼을 클릭하면 여기에 상세한 계산 과정이 표시됩니다.</p>
          </div>
        </details>
      </div>
    `;
  }

  // Step 4, 5 결과를 자동으로 가져오기
  loadPreviousResults() {
    if (this.state.domainSeparator) {
      document.getElementById('domainSeparatorInput').value = this.state.domainSeparator;
    }
    if (this.state.structHash) {
      document.getElementById('structHashInput').value = this.state.structHash;
    }
  }

  calculateDigest() {
    try {
      const domainSeparator = document.getElementById('domainSeparatorInput').value ||
                              this.state.domainSeparator;
      const structHash = document.getElementById('structHashInput').value ||
                         this.state.structHash;

      if (!domainSeparator || !structHash) {
        alert('Step 4와 5를 먼저 완료해주세요!');
        return;
      }

      // Final Digest 계산
      const finalDigest = calculateDigest(domainSeparator, structHash);

      // State에 저장
      this.state.finalDigest = finalDigest;

      // UI 업데이트
      document.getElementById('finalDigest').value = finalDigest;
      document.getElementById('digestResult').classList.remove('hidden');
      document.getElementById('signatureSection').classList.remove('hidden');

      // 계산 과정 설명
      const explanation = generateExplanation('digest', {});
      document.getElementById('digestExplanation').innerHTML = explanation;

      console.log('✅ Final Digest calculated:', finalDigest);

    } catch (error) {
      console.error('❌ Digest calculation failed:', error);
      alert('계산 실패: ' + error.message);
    }
  }

  async generateSignature() {
    try {
      const finalDigest = this.state.finalDigest;
      if (!finalDigest) {
        alert('먼저 Final Digest를 계산해주세요!');
        return;
      }

      const executorWallet = this.state.executorWallet;
      if (!executorWallet) {
        alert('Executor 지갑이 초기화되지 않았습니다!');
        return;
      }

      // EIP-712 서명 생성
      const domain = getDomain(this.state.contractAddress);
      const types = {
        Batch: [{ name: 'batchNonce', type: 'uint256' }]
      };
      const value = { batchNonce: this.state.batchNonce || 0 };

      const signature = await executorWallet.signTypedData(domain, types, value);

      // 서명 분해 (r, s, v)
      const sig = ethers.Signature.from(signature);

      // State에 저장
      this.state.executorSig = signature;

      // UI 업데이트
      document.getElementById('sigR').textContent = sig.r;
      document.getElementById('sigS').textContent = sig.s;
      document.getElementById('sigV').textContent = sig.v;
      document.getElementById('executorSignature').value = signature;
      document.getElementById('executorSignerAddress').textContent = executorWallet.address;
      document.getElementById('signatureResult').classList.remove('hidden');

      console.log('✅ Executor signature generated:', {
        signature,
        signer: executorWallet.address,
        r: sig.r,
        s: sig.s,
        v: sig.v
      });

    } catch (error) {
      console.error('❌ Signature generation failed:', error);
      alert('서명 생성 실패: ' + error.message);
    }
  }
}
