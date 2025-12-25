import { BaseStep } from '../BaseStep';
import type { AppState, AppStateData } from '../../state/AppState';
import { DigestService } from '../../../domain/services/DigestService';
import * as UIHelper from '../../utils/UIHelper';
import type { Hash } from '../../../domain/types';
import { keccak256, toBytes } from 'viem';

/**
 * Step 5: Struct Hash 계산 컴포넌트
 *
 * Batch Nonce를 입력받아 Struct Hash를 계산합니다.
 */
export class Step5Struct extends BaseStep {
  constructor(state: AppState) {
    super(state);
  }

  render(): string {
    return `
      <div id="step5" class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-yellow-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-yellow-500">STEP 5</span>
          <i data-lucide="bar-chart-2" class="w-5 h-5 inline"></i> Struct Hash 계산
        </h2>
        <p class="text-sm text-gray-600 mb-4">서명할 데이터 구조의 해시를 계산합니다</p>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Batch Nonce</label>
          <div class="flex gap-2">
            <input type="text" id="batchNonce" class="flex-1 px-3 py-2 border rounded-md font-mono"
                   value="0" placeholder="숫자 입력">
            <button id="checkNonceBtn"
                    class="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 whitespace-nowrap">
              <i data-lucide="search" class="w-4 h-4 inline"></i> 사용 가능 확인
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            배치의 고유 번호 (재전송 방지용) - 중복 체크 방식으로 원하는 숫자 사용 가능
          </p>
          <div id="batchNonceCheckResult" class="hidden mt-2"></div>
        </div>

        <!-- 계산 버튼 -->
        <button id="calculateStructBtn"
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

  init(): void {
    super.init();

    // Nonce 체크 버튼 이벤트 리스너
    UIHelper.safeAddEventListener('checkNonceBtn', 'click', () => {
      this.checkNonce();
    });

    // 계산 버튼 이벤트 리스너
    UIHelper.safeAddEventListener('calculateStructBtn', 'click', () => {
      this.calculate();
    });
  }

  protected onStateChange(state: Readonly<AppStateData>): void {
    // structHash 변경 시 결과 표시
    if (state.structHash) {
      UIHelper.setInputValue('structHash', state.structHash);
      UIHelper.setElementVisibility('structHashResult', true);
    }
  }

  private async checkNonce(): Promise<void> {
    try {
      const stateData = this.state.getState();

      if (!stateData.executorWallet) {
        alert('먼저 STEP 1에서 Executor 지갑을 초기화해주세요!');
        return;
      }

      if (!stateData.contractAddress) {
        alert('먼저 컨트랙트 주소를 설정해주세요!');
        return;
      }

      const nonceValue = UIHelper.getInputValue('batchNonce').trim();

      // 숫자 형식 검증
      if (!nonceValue || !/^\d+$/.test(nonceValue)) {
        alert('유효한 Nonce 값을 입력해주세요 (숫자만)');
        return;
      }

      const resultDiv = document.getElementById('batchNonceCheckResult');
      if (!resultDiv) return;

      UIHelper.showLoading(
        'batchNonceCheckResult',
        '<i data-lucide="search" class="w-4 h-4 inline"></i> Batch Nonce 사용 여부 확인 중...'
      );
      UIHelper.setElementVisibility('batchNonceCheckResult', true);

      // viem을 사용한 컨트랙트 호출은 추후 구현 예정
      // 현재는 에러 메시지로 대체
      throw new Error('Nonce 체크 기능은 아직 구현되지 않았습니다.');

      // viem을 사용한 실제 구현 (추후)
      // const publicClient = createPublicClient({
      //   chain: opBNBTestnet,
      //   transport: http()
      // });
      //
      // const isUsed = await publicClient.readContract({
      //   address: stateData.contractAddress,
      //   abi: [{
      //     name: 'usedBatchNonces',
      //     type: 'function',
      //     stateMutability: 'view',
      //     inputs: [
      //       { name: 'executor', type: 'address' },
      //       { name: 'nonce', type: 'uint256' }
      //     ],
      //     outputs: [{ type: 'bool' }]
      //   }],
      //   functionName: 'usedBatchNonces',
      //   args: [stateData.executorWallet.address, BigInt(nonceValue)]
      // });
      //
      // if (isUsed) {
      //   UIHelper.showError(
      //     'batchNonceCheckResult',
      //     `<i data-lucide="x-circle" class="w-4 h-4 inline"></i> Nonce ${nonceValue}은(는) 이미 사용되었습니다. 다른 값을 사용하세요.`
      //   );
      // } else {
      //   UIHelper.showSuccess(
      //     'batchNonceCheckResult',
      //     `<i data-lucide="check-circle" class="w-4 h-4 inline"></i> Nonce ${nonceValue}은(는) 사용 가능합니다!`
      //   );
      // }
    } catch (error) {
      console.error('[ERROR] Batch Nonce check failed:', error);
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      UIHelper.showError(
        'batchNonceCheckResult',
        `<i data-lucide="x-circle" class="w-4 h-4 inline"></i> 조회 실패: ${message}`
      );
      UIHelper.setElementVisibility('batchNonceCheckResult', true);
    }
  }

  private calculate(): void {
    try {
      // Batch Nonce 가져오기
      const batchNonceValue = UIHelper.getInputValue('batchNonce').trim();

      // 숫자 형식 검증
      if (!batchNonceValue || !/^\d+$/.test(batchNonceValue)) {
        alert('유효한 Batch Nonce 값을 입력해주세요 (숫자만)');
        return;
      }

      const batchNonce = BigInt(batchNonceValue);

      // Batch TypeHash 계산
      const batchTypeHash = keccak256(toBytes('Batch(uint256 batchNonce)')) as Hash;

      // Struct Hash 계산
      const structHash = DigestService.calculateStructHash(batchNonce) as Hash;

      // State에 저장
      this.state.setState({
        batchNonce,
        structHash,
      });

      // UI 업데이트
      UIHelper.setInputValue('batchTypeHash', batchTypeHash);
      UIHelper.setInputValue('structHash', structHash);
      UIHelper.setElementVisibility('structHashResult', true);

      // 계산 과정 설명 생성
      const explanation = UIHelper.generateExplanation('struct', {
        batchNonce: batchNonce.toString(),
      });

      const explanationDiv = document.getElementById('structExplanation');
      if (explanationDiv) {
        explanationDiv.innerHTML = explanation;
      }
    } catch (error) {
      console.error('[ERROR] Struct Hash calculation failed:', error);
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`계산 실패: ${message}`);
    }
  }
}
