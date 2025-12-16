/**
 * STEP 6: Batch Digest 계산 및 Executor 서명
 */

import { CONFIG } from '../config.js?v=4';

export class Step6Digest {
  constructor(state) {
    this.state = state;
  }

  /**
   * Step 4/5 결과를 Step 6 UI에 반영 (main.js 연동용)
   */
  loadPreviousResults() {
    const batchNonceDisplay = document.getElementById('batchNonceDisplay');
    if (batchNonceDisplay) {
      batchNonceDisplay.value =
        this.state.batchNonce !== undefined ? String(this.state.batchNonce) : '';
    }
    this.updateResult();
  }

  render() {
    return `
      <section class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">STEP 6 🔐 Batch Digest 및 Executor 서명</h2>

        <!-- Batch Nonce (STEP 5에서 자동 복사) -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">🔢 Batch Nonce (STEP 5에서 자동 복사)</label>
          <input
            type="text"
            id="batchNonceDisplay"
            class="w-full px-3 py-2 border rounded-md bg-gray-100"
            readonly
            placeholder="STEP 5를 먼저 완료해주세요"
          >
          <p class="text-xs text-gray-500 mt-1">STEP 5에서 계산한 Batch Nonce를 자동으로 사용합니다</p>
        </div>

        <button
          onclick="step6.calculateDigest()"
          class="w-full px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition font-medium mb-2"
        >
          🔐 Batch Digest 계산
        </button>

        <button
          onclick="step6.generateSignature()"
          class="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition font-medium"
        >
          ✍️ Executor 서명 생성
        </button>

        <div id="digestResult" class="mt-4"></div>
      </section>
    `;
  }

  /**
   * Batch Digest 계산
   */
  calculateDigest() {
    // STEP 5에서 batchNonce 가져오기
    if (!this.state.batchNonce && this.state.batchNonce !== 0) {
      alert('먼저 STEP 5에서 Struct Hash를 계산해주세요!');
      return;
    }

    const batchNonce = this.state.batchNonce;

    // UI에 표시
    document.getElementById('batchNonceDisplay').value = batchNonce;

    const domain = {
      name: 'SubVoting',
      version: '1',
      chainId: CONFIG.CHAIN_ID,
      verifyingContract: this.state.contractAddress
    };

    const types = {
      Batch: [
        { name: 'batchNonce', type: 'uint256' }
      ]
    };

    const value = {
      batchNonce: batchNonce
    };

    // EIP-712 해시 계산
    const digest = ethers.TypedDataEncoder.hash(domain, types, value);

    this.state.finalDigest = digest;

    this.updateResult();

    console.log('✅ Batch digest calculated:', digest);
  }

  /**
   * Executor 서명 생성
   */
  async generateSignature() {
    if (!this.state.finalDigest) {
      alert('먼저 Batch Digest를 계산해주세요!');
      return;
    }

    if (!this.state.executorWallet) {
      alert('먼저 STEP 1에서 Executor 지갑을 로드해주세요!');
      return;
    }

    try {
      const batchNonce = this.state.batchNonce;

      const domain = {
        name: 'SubVoting',
        version: '1',
        chainId: CONFIG.CHAIN_ID,
        verifyingContract: this.state.contractAddress
      };

      const types = {
        Batch: [
          { name: 'batchNonce', type: 'uint256' }
        ]
      };

      const value = {
        batchNonce: batchNonce
      };

      // Executor 서명
      const signature = await this.state.executorWallet.signTypedData(domain, types, value);

      this.state.executorSig = signature;
      this.updateResult();

      console.log('✅ Executor signature generated:', signature);
    } catch (error) {
      console.error('❌ Failed to generate executor signature:', error);
      alert('Executor 서명 생성 실패: ' + error.message);
    }
  }

  /**
   * 결과 표시
   */
  updateResult() {
    const resultDiv = document.getElementById('digestResult');

    let html = '<div class="border rounded-lg p-4 bg-gray-50">';

    if (this.state.finalDigest) {
      html += `
        <div class="mb-3">
          <h3 class="font-semibold text-gray-800 mb-2">Batch Digest</h3>
          <div class="text-xs font-mono break-all bg-white p-2 rounded">${this.state.finalDigest}</div>
        </div>
      `;
    }

    if (this.state.executorSig) {
      html += `
        <div>
          <h3 class="font-semibold text-gray-800 mb-2">Executor Signature</h3>
          <div class="text-xs font-mono break-all bg-white p-2 rounded">${this.state.executorSig}</div>
        </div>
      `;
    }

    html += '</div>';

    resultDiv.innerHTML = html;
  }
}
