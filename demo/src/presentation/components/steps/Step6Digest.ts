import { BaseStep } from '../BaseStep';
import type { AppState, AppStateData } from '../../state/AppState';
import { DigestService } from '../../../domain/services/DigestService';
import * as UIHelper from '../../utils/UIHelper';
import type { Hash } from '../../../domain/types';
import { hexToSignature } from 'viem';

/**
 * Step 6: Final Digest 계산 및 Executor 서명 컴포넌트
 *
 * Step 4와 5의 결과를 결합하여 최종 서명할 해시를 생성하고 Executor가 서명합니다.
 */
export class Step6Digest extends BaseStep {
  constructor(state: AppState) {
    super(state);
  }

  render(): string {
    return `
      <div id="step6" class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-green-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-green-500">STEP 6</span>
          <i data-lucide="shield" class="w-5 h-5 inline"></i> Final Digest 및 Executor 서명
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
                   placeholder="Step 4를 먼저 완료해주세요"
                   readonly>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Struct Hash (Step 5에서 자동 복사)
            </label>
            <input type="text" id="structHashInput"
                   class="w-full px-3 py-2 border rounded-md font-mono text-xs bg-yellow-50"
                   placeholder="Step 5를 먼저 완료해주세요"
                   readonly>
          </div>
        </div>

        <!-- Digest 계산 버튼 -->
        <button id="calculateDigestBtn"
                class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 mr-2">
          <i data-lucide="hash" class="w-4 h-4 inline"></i> Final Digest 계산
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
          <button id="generateSignatureBtn"
                  class="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600">
            <i data-lucide="pen-tool" class="w-4 h-4 inline"></i> Executor 서명 생성
          </button>

          <div id="signatureResult" class="mt-4 hidden">
            <div class="bg-purple-50 border border-purple-200 rounded p-4">
              <p class="font-semibold text-purple-900 mb-2">
                <i data-lucide="lock" class="w-4 h-4 inline"></i> ECDSA 서명 컴포넌트:
              </p>

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
            <i data-lucide="book-open" class="w-4 h-4 inline"></i> 계산 과정 보기
          </summary>
          <div id="digestExplanation" class="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <p class="text-sm text-gray-600">Digest 계산 버튼을 클릭하면 여기에 상세한 계산 과정이 표시됩니다.</p>
          </div>
        </details>
      </div>
    `;
  }

  init(): void {
    super.init();

    // Digest 계산 버튼 이벤트 리스너
    UIHelper.safeAddEventListener('calculateDigestBtn', 'click', () => {
      this.calculateDigest();
    });

    // 서명 생성 버튼 이벤트 리스너
    UIHelper.safeAddEventListener('generateSignatureBtn', 'click', () => {
      this.generateSignature();
    });

    // 초기 로드 시 이전 단계 결과 가져오기
    this.loadPreviousResults();
  }

  protected onStateChange(state: Readonly<AppStateData>): void {
    // domainSeparator 또는 structHash 변경 시 자동 로드
    if (state.domainSeparator) {
      UIHelper.setInputValue('domainSeparatorInput', state.domainSeparator);
    }

    if (state.structHash) {
      UIHelper.setInputValue('structHashInput', state.structHash);
    }

    // finalDigest 변경 시 결과 표시
    if (state.finalDigest) {
      UIHelper.setInputValue('finalDigest', state.finalDigest);
      UIHelper.setElementVisibility('digestResult', true);
      UIHelper.setElementVisibility('signatureSection', true);
    }

    // executorSig 변경 시 서명 결과 표시
    if (state.executorSig && state.executorWallet) {
      this.displaySignature(state.executorSig, state.executorWallet.address);
    }
  }

  /**
   * Step 4, 5 결과를 자동으로 가져오기
   */
  private loadPreviousResults(): void {
    const state = this.state.getState();

    if (state.domainSeparator) {
      UIHelper.setInputValue('domainSeparatorInput', state.domainSeparator);
    }

    if (state.structHash) {
      UIHelper.setInputValue('structHashInput', state.structHash);
    }
  }

  private calculateDigest(): void {
    try {
      const state = this.state.getState();

      const domainSeparator =
        UIHelper.getInputValue('domainSeparatorInput') || state.domainSeparator;
      const structHash = UIHelper.getInputValue('structHashInput') || state.structHash;

      if (!domainSeparator || !structHash) {
        alert('Step 4와 5를 먼저 완료해주세요!');
        return;
      }

      // Final Digest 계산
      const finalDigest = DigestService.calculateDigest(
        domainSeparator as Hash,
        structHash as Hash
      ) as Hash;

      // State에 저장
      this.state.setState({ finalDigest });

      // UI 업데이트
      UIHelper.setInputValue('finalDigest', finalDigest);
      UIHelper.setElementVisibility('digestResult', true);
      UIHelper.setElementVisibility('signatureSection', true);

      // 계산 과정 설명
      const explanation = UIHelper.generateExplanation('digest', {});

      const explanationDiv = document.getElementById('digestExplanation');
      if (explanationDiv) {
        explanationDiv.innerHTML = explanation;
      }
    } catch (error) {
      console.error('[ERROR] Digest calculation failed:', error);
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`계산 실패: ${message}`);
    }
  }

  private async generateSignature(): Promise<void> {
    try {
      const state = this.state.getState();

      if (!state.finalDigest) {
        alert('먼저 Final Digest를 계산해주세요!');
        return;
      }

      if (!state.executorWallet) {
        alert('Executor 지갑이 초기화되지 않았습니다!');
        return;
      }

      if (!state.contractAddress) {
        alert('컨트랙트 주소가 설정되지 않았습니다!');
        return;
      }

      // EIP-712 서명 생성
      const domain = {
        name: 'MainVoting',
        version: '1',
        chainId: 5611,
        verifyingContract: state.contractAddress,
      };

      const types = {
        Batch: [{ name: 'batchNonce', type: 'uint256' }],
      };

      const message = {
        batchNonce: state.batchNonce,
      };

      const signature = await state.executorWallet.signTypedData({
        domain,
        types,
        primaryType: 'Batch',
        message,
      });

      // State에 저장
      this.state.setState({ executorSig: signature as Hash });

      // UI 업데이트
      this.displaySignature(signature as Hash, state.executorWallet.address);
    } catch (error) {
      console.error('[ERROR] Signature generation failed:', error);
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`서명 생성 실패: ${message}`);
    }
  }

  /**
   * 서명 결과를 UI에 표시
   */
  private displaySignature(signature: Hash, signerAddress: string): void {
    try {
      // 서명 분해 (r, s, v)
      const sig = hexToSignature(signature);

      // UI 업데이트
      UIHelper.showValue('sigR', sig.r);
      UIHelper.showValue('sigS', sig.s);
      UIHelper.showValue('sigV', sig.v?.toString() ?? '');
      UIHelper.setInputValue('executorSignature', signature);
      UIHelper.showValue('executorSignerAddress', signerAddress);
      UIHelper.setElementVisibility('signatureResult', true);
    } catch (error) {
      console.error('[ERROR] Failed to display signature:', error);
    }
  }
}
