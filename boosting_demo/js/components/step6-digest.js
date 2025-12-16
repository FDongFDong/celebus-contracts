/**
 * STEP 6: Batch Digest 계산 및 Executor 서명
 * demo와 동일한 방식: signTypedData 사용 (컨트랙트 호출 없이 프론트엔드에서 직접 계산)
 */

import { CONFIG, getDomain } from "../config.js";

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
   * Batch Digest 계산 - 프론트엔드에서 직접 EIP-712 digest 계산
   */
  calculateDigest() {
    // STEP 5에서 batchNonce 가져오기
    if (!this.state.batchNonce && this.state.batchNonce !== 0) {
      alert("먼저 STEP 5에서 Struct Hash를 계산해주세요!");
      return;
    }

    const batchNonce = this.state.batchNonce;

    // UI에 표시
    document.getElementById("batchNonceDisplay").value = batchNonce;

    try {
      // 프론트엔드에서 직접 EIP-712 digest 계산
      const domain = getDomain(this.state.contractAddress);

      // Domain Separator 계산
      const domainSeparator = this._calculateDomainSeparator(domain);

      // Struct Hash 계산 (Batch typeHash + batchNonce)
      const structHash = this._calculateStructHash(batchNonce);

      // Final Digest 계산 (EIP-191)
      const digest = this._calculateDigest(domainSeparator, structHash);

      console.log("🔍 [STEP6] Calculated digest:", {
        domainSeparator,
        structHash,
        digest,
      });

      this.state.finalDigest = digest;
      this.state.domainSeparator = domainSeparator;
      this.state.structHash = structHash;

      this.updateResult();

      console.log("✅ Batch digest calculated:", digest);
    } catch (error) {
      console.error("❌ Batch digest calculation failed:", error);
      alert("Batch digest 계산 실패: " + error.message);
    }
  }

  /**
   * Domain Separator 계산
   */
  _calculateDomainSeparator(domain) {
    const typeHash = ethers.keccak256(
      ethers.toUtf8Bytes(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
      )
    );

    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "bytes32", "bytes32", "uint256", "address"],
      [
        typeHash,
        ethers.keccak256(ethers.toUtf8Bytes(domain.name)),
        ethers.keccak256(ethers.toUtf8Bytes(domain.version)),
        domain.chainId,
        domain.verifyingContract,
      ]
    );

    return ethers.keccak256(encoded);
  }

  /**
   * Struct Hash 계산 (Batch 타입)
   */
  _calculateStructHash(batchNonce) {
    const typeHash = ethers.keccak256(
      ethers.toUtf8Bytes("Batch(uint256 batchNonce)")
    );

    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "uint256"],
      [typeHash, batchNonce]
    );

    return ethers.keccak256(encoded);
  }

  /**
   * Final Digest 계산 (EIP-191)
   */
  _calculateDigest(domainSeparator, structHash) {
    return ethers.keccak256(
      ethers.solidityPacked(
        ["bytes2", "bytes32", "bytes32"],
        ["0x1901", domainSeparator, structHash]
      )
    );
  }

  /**
   * Executor 서명 생성 - signTypedData 사용 (demo와 동일 방식)
   */
  async generateSignature() {
    if (!this.state.executorWallet) {
      alert("먼저 STEP 1에서 Executor 지갑을 로드해주세요!");
      return;
    }

    // batchNonce가 없으면 먼저 계산
    if (!this.state.batchNonce && this.state.batchNonce !== 0) {
      alert("먼저 STEP 5에서 Struct Hash를 계산해주세요!");
      return;
    }

    try {
      const executorWallet = this.state.executorWallet;
      const batchNonce = this.state.batchNonce;

      // EIP-712 서명 생성 (signTypedData 사용)
      const domain = getDomain(this.state.contractAddress);
      const types = {
        Batch: [{ name: "batchNonce", type: "uint256" }],
      };
      const value = { batchNonce: batchNonce };

      const signature = await executorWallet.signTypedData(
        domain,
        types,
        value
      );
      console.log("🔍 [STEP6] Executor Signature (signTypedData):", signature);

      // 서명 분해 (r, s, v)
      const sig = ethers.Signature.from(signature);

      // State에 저장
      this.state.executorSig = signature;

      // Digest도 계산해서 저장 (표시용)
      if (!this.state.finalDigest) {
        this.calculateDigest();
      }

      // UI 업데이트
      this.updateResult();

      console.log("✅ Executor signature generated:", {
        signature,
        signer: executorWallet.address,
        r: sig.r,
        s: sig.s,
        v: sig.v,
      });
    } catch (error) {
      console.error("❌ Signature generation failed:", error);
      alert("서명 생성 실패: " + error.message);
    }
  }

  /**
   * 이전 단계의 결과를 UI에 로드 (STEP 4, STEP 5 완료 후 자동 호출)
   */
  loadPreviousResults() {
    // batchNonce가 설정되어 있으면 UI에 표시
    const batchNonceDisplay = document.getElementById("batchNonceDisplay");
    if (
      batchNonceDisplay &&
      (this.state.batchNonce || this.state.batchNonce === 0)
    ) {
      batchNonceDisplay.value = this.state.batchNonce;
    }

    console.log("📝 [STEP6] Previous results loaded:", {
      batchNonce: this.state.batchNonce,
      domainSeparator: this.state.domainSeparator,
      structHash: this.state.structHash,
    });
  }

  updateResult() {
    const resultEl = document.getElementById("digestResult");
    if (!resultEl) return;

    let html = "";

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
