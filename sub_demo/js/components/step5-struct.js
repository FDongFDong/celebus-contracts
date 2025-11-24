/**
 * STEP 5: Struct Hash 계산
 * SubVoting도 MainVoting과 동일: Batch(uint256 batchNonce) 구조체 해시 계산
 */

export class Step5Struct {
  constructor(state) {
    this.state = state;
  }

  render() {
    return `
      <section class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-yellow-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-yellow-500">STEP 5</span>
          📊 Struct Hash 계산
        </h2>
        <p class="text-sm text-gray-600 mb-4">서명할 데이터 구조의 해시를 계산합니다</p>

        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p class="text-sm text-yellow-700">
            💡 <strong>SubVoting:</strong> MainVoting과 동일하게 Batch(uint256 batchNonce) 사용
          </p>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Batch Nonce</label>
          <div class="flex gap-2">
            <input type="number" id="batchNonce" class="flex-1 px-3 py-2 border rounded-md" value="0" min="0">
            <button onclick="step5.findNextNonce()" 
                    class="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 whitespace-nowrap">
              🔍 다음 Nonce 찾기
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
          🔢 Struct Hash 계산
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
              ✅ 이 값이 Step 6에서 자동으로 사용됩니다
            </p>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Batch Nonce 조회 (컨트랙트에서)
   */
  async findNextNonce() {
    try {
      if (!this.state.executorWallet) {
        alert('먼저 STEP 1에서 Executor 지갑을 초기화해주세요!');
        return;
      }

      const resultDiv = document.getElementById('nonceCheckResult');
      resultDiv.innerHTML = '<p class="text-sm text-blue-600">🔍 사용 가능한 nonce를 찾는 중...</p>';
      resultDiv.classList.remove('hidden');

      const provider = this.state.provider;
      const contract = new ethers.Contract(
        this.state.contractAddress,
        ['function batchNonceUsed(address,uint256) view returns (bool)'],
        provider
      );

      const executorAddress = this.state.executorWallet.address;
      
      // 0부터 20까지 확인
      let nextNonce = null;
      for (let i = 0; i < 20; i++) {
        const used = await contract.batchNonceUsed(executorAddress, i);
        if (!used) {
          nextNonce = i;
          break;
        }
      }

      if (nextNonce !== null) {
        document.getElementById('batchNonce').value = nextNonce;
        resultDiv.innerHTML = `<p class="text-sm text-green-600">✅ 사용 가능한 nonce: ${nextNonce}</p>`;
        console.log('✅ Next available batch nonce:', nextNonce);
      } else {
        resultDiv.innerHTML = '<p class="text-sm text-red-600">❌ 0-19 범위에서 사용 가능한 nonce를 찾을 수 없습니다</p>';
      }

    } catch (error) {
      console.error('❌ Nonce check failed:', error);
      document.getElementById('nonceCheckResult').innerHTML = 
        `<p class="text-sm text-red-600">❌ 확인 실패: ${error.message}</p>`;
    }
  }

  /**
   * Struct Hash 계산 (MainVoting과 동일)
   */
  calculate() {
    try {
      // Batch Nonce 가져오기
      const batchNonce = parseInt(document.getElementById('batchNonce').value);

      // Batch TypeHash 계산
      const batchTypeHash = ethers.keccak256(
        ethers.toUtf8Bytes('Batch(uint256 batchNonce)')
      );

      // Struct Hash 계산: keccak256(abi.encode(BATCH_TYPEHASH, batchNonce))
      const structHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes32', 'uint256'],
          [batchTypeHash, batchNonce]
        )
      );

      // State에 저장
      this.state.batchNonce = batchNonce;
      this.state.batchTypeHash = batchTypeHash;
      this.state.structHash = structHash;

      // UI 업데이트
      document.getElementById('batchTypeHash').value = batchTypeHash;
      document.getElementById('structHash').value = structHash;
      document.getElementById('structHashResult').classList.remove('hidden');

      console.log('✅ Struct Hash calculated:', {
        batchNonce,
        batchTypeHash,
        structHash
      });

    } catch (error) {
      console.error('❌ Struct Hash calculation failed:', error);
      alert('계산 실패: ' + error.message);
    }
  }
}
