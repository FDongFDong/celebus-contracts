/**
 * STEP 6: Batch Digest 계산 및 Executor 서명
 * Foundry 테스트와 동일한 패턴: contract.hashBatchPreview() + vm.sign
 */

import { CONFIG } from '../config.js';

export class Step6Digest {
  constructor(state) {
    this.state = state;
  }

  render() {
    return `
      <section class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-green-500">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <span class="step-badge bg-green-500">STEP 6</span>
          🔐 Batch Digest 및 Executor 서명
        </h2>

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
   * Batch Digest 계산 - 컨트랙트의 hashBatchPreview 직접 호출 (Foundry 패턴)
   */
  async calculateDigest() {
    // STEP 5에서 batchNonce 가져오기
    if (!this.state.batchNonce && this.state.batchNonce !== 0) {
      alert('먼저 STEP 5에서 Struct Hash를 계산해주세요!');
      return;
    }

    const batchNonce = this.state.batchNonce;

    // UI에 표시
    document.getElementById('batchNonceDisplay').value = batchNonce;

    try {
      // 컨트랙트 연결
      const contract = new ethers.Contract(
        this.state.contractAddress,
        CONFIG.ABI,
        this.state.provider
      );

      // Foundry 테스트와 동일: 컨트랙트의 hashBatchPreview 호출
      const digest = await contract.hashBatchPreview(batchNonce);
      console.log('🔍 [STEP6] Contract hashBatchPreview digest:', digest);

      this.state.finalDigest = digest;

      this.updateResult();

      console.log('✅ Batch digest calculated:', digest);
    } catch (error) {
      console.error('❌ Batch digest calculation failed:', error);
      alert('Batch digest 계산 실패: ' + error.message);
    }
  }

  /**
   * Executor 서명 생성 - Foundry의 vm.sign과 동일한 패턴
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
      const executorWallet = this.state.executorWallet;
      const batchNonce = this.state.batchNonce || 0;

      // 컨트랙트 연결
      const contract = new ethers.Contract(
        this.state.contractAddress,
        CONFIG.ABI,
        this.state.provider
      );

      // 1. 컨트랙트의 hashBatchPreview 호출 → digest 얻기 (Foundry 테스트 패턴)
      const digest = await contract.hashBatchPreview(batchNonce);
      console.log('🔍 [STEP6] Contract hashBatchPreview digest:', digest);

      // 2. digest에 직접 ECDSA 서명 (Foundry의 vm.sign과 동일)
      const sig = executorWallet.signingKey.sign(digest);

      // 3. r, s, v를 연결하여 서명 생성 (abi.encodePacked(r, s, v) 형식 - Foundry와 동일)
      const signature = ethers.concat([sig.r, sig.s, ethers.toBeHex(sig.v)]);
      console.log('🔍 [STEP6] Executor Signature:', signature);

      // State에 저장
      this.state.executorSig = signature;
      this.state.finalDigest = digest;

      // UI 업데이트
      this.updateResult();

      console.log('✅ Executor signature generated:', {
        signature,
        signer: executorWallet.address,
        digest,
        r: sig.r,
        s: sig.s,
        v: sig.v
      });
    } catch (error) {
      console.error('❌ Signature generation failed:', error);
      alert('서명 생성 실패: ' + error.message);
    }
  }

  updateResult() {
    const resultEl = document.getElementById('digestResult');
    if (!resultEl) return;

    let html = '';

    if (this.state.finalDigest) {
      html += `
        <div class="bg-green-50 border border-green-200 rounded p-4 mb-4">
          <h3 class="font-bold text-green-800 mb-2">Batch Digest</h3>
          <p class="font-mono text-xs break-all">${this.state.finalDigest}</p>
        </div>
      `;
    }

    if (this.state.executorSig) {
      html += `
        <div class="bg-purple-50 border border-purple-200 rounded p-4">
          <h3 class="font-bold text-purple-800 mb-2">Executor Signature</h3>
          <p class="font-mono text-xs break-all">${this.state.executorSig}</p>
        </div>
      `;
    }

    resultEl.innerHTML = html;
  }
}
