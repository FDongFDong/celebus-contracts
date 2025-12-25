import { BaseStep } from '../BaseStep';
import type { AppState, AppStateData } from '../../state/AppState';
import { EIP712Domain } from '../../../domain/value-objects/EIP712Domain';
import * as UIHelper from '../../utils/UIHelper';
import type { Address, Hash } from '../../../domain/types';

/**
 * Step 4: Domain Separator 계산 컴포넌트
 *
 * EIP-712 Domain을 입력받아 Domain Separator를 계산합니다.
 */
export class Step4Domain extends BaseStep {
  constructor(state: AppState) {
    super(state);
  }

  render(): string {
    const stateData = this.state.getState();
    const contractAddress = stateData.contractAddress || '';

    return `
      <div id="step4" class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-indigo-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-indigo-500">STEP 4</span>
          <i data-lucide="lock" class="w-5 h-5 inline"></i> Domain Separator 계산
        </h2>
        <p class="text-sm text-gray-600 mb-4">EIP-712 Domain을 식별하는 고유 해시를 계산합니다</p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <!-- 입력 필드들 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Domain Name</label>
            <input type="text" id="domainName" class="w-full px-3 py-2 border rounded-md"
                   value="MainVoting">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Domain Version</label>
            <input type="text" id="domainVersion" class="w-full px-3 py-2 border rounded-md"
                   value="1">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Chain ID</label>
            <input type="number" id="chainId" class="w-full px-3 py-2 border rounded-md"
                   value="5611">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Verifying Contract</label>
            <input type="text" id="verifyingContract" class="w-full px-3 py-2 border rounded-md text-xs"
                   value="${contractAddress}">
          </div>
        </div>

        <!-- 계산 버튼 -->
        <button id="calculateDomainBtn"
                class="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600">
          <i data-lucide="hash" class="w-4 h-4 inline"></i> Domain Separator 계산
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
            <i data-lucide="check-circle" class="w-3 h-3 inline"></i> 이 값이 Step 6에서 자동으로 사용됩니다
          </p>
        </div>

        <!-- 계산 과정 설명 (접을 수 있음) -->
        <details class="mt-4">
          <summary class="cursor-pointer text-indigo-600 font-semibold hover:text-indigo-800">
            <i data-lucide="book-open" class="w-4 h-4 inline"></i> 계산 과정 보기
          </summary>
          <div id="domainExplanation" class="mt-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <p class="text-sm text-gray-600">계산 버튼을 클릭하면 여기에 상세한 계산 과정이 표시됩니다.</p>
          </div>
        </details>
      </div>
    `;
  }

  init(): void {
    super.init();

    // 계산 버튼 이벤트 리스너
    UIHelper.safeAddEventListener('calculateDomainBtn', 'click', () => {
      this.calculate();
    });
  }

  protected onStateChange(state: Readonly<AppStateData>): void {
    // contractAddress 변경 시 verifyingContract 필드 업데이트
    if (state.contractAddress) {
      UIHelper.setInputValue('verifyingContract', state.contractAddress);
    }

    // domainSeparator 변경 시 결과 표시
    if (state.domainSeparator) {
      UIHelper.setInputValue('domainSeparator', state.domainSeparator);
      UIHelper.setElementVisibility('domainSeparatorResult', true);
    }
  }

  private calculate(): void {
    try {
      // 입력값 가져오기
      const name = UIHelper.getInputValue('domainName');
      const version = UIHelper.getInputValue('domainVersion');
      const chainIdStr = UIHelper.getInputValue('chainId');
      const verifyingContract = UIHelper.getInputValue('verifyingContract') as Address;

      // 유효성 검증
      if (!name || !version || !chainIdStr || !verifyingContract) {
        alert('모든 필드를 입력해주세요!');
        return;
      }

      const chainId = BigInt(chainIdStr);

      // EIP712Domain 생성 및 Domain Separator 계산
      const domain = new EIP712Domain(name, version, chainId, verifyingContract);
      const domainSeparator = domain.calculateDomainSeparator() as Hash;

      // State에 저장
      this.state.setState({ domainSeparator });

      // UI 업데이트
      UIHelper.setInputValue('domainSeparator', domainSeparator);
      UIHelper.setElementVisibility('domainSeparatorResult', true);

      // 계산 과정 설명 생성
      const explanation = UIHelper.generateExplanation('domain', {
        name,
        version,
        chainId: chainId.toString(),
        verifyingContract,
      });

      const explanationDiv = document.getElementById('domainExplanation');
      if (explanationDiv) {
        explanationDiv.innerHTML = explanation;
      }
    } catch (error) {
      console.error('[ERROR] Domain Separator calculation failed:', error);
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`계산 실패: ${message}`);
    }
  }
}
