/**
 * UIHelper - UI 공통 유틸리티
 *
 * Step 컴포넌트에서 공통으로 사용하는 UI 헬퍼 함수들
 */

import { renderIcons } from '../components/shared/icons';

/**
 * Lucide 아이콘 HTML 문자열 생성 (data-lucide 방식)
 */
export function getIcon(
  name: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'wallet',
  className = 'w-4 h-4'
): string {
  const iconNames = {
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info',
    loading: 'loader-2',
    wallet: 'wallet',
  };

  const lucideName = iconNames[name];
  const animateClass = name === 'loading' ? ' animate-spin' : '';
  return `<i data-lucide="${lucideName}" class="${className}${animateClass}"></i>`;
}

/**
 * 상태 메시지와 함께 아이콘 표시
 */
export function showStatusWithIcon(
  elementId: string,
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' | 'loading'
): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  const colorClasses = {
    success: 'text-green-600 bg-green-50 border-green-200',
    error: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
    loading: 'text-blue-600 bg-blue-50 border-blue-200',
  };

  const icon = getIcon(type, 'w-5 h-5 inline-block mr-2');
  element.className = `p-3 rounded-md border ${colorClasses[type]}`;
  element.innerHTML = `${icon}<span>${message}</span>`;
  element.classList.remove('hidden');
  renderIcons();
}

/**
 * 로딩 상태 표시
 */
export function showLoading(elementId: string, message = 'Loading...'): void {
  showStatusWithIcon(elementId, message, 'loading');
}

/**
 * 성공 메시지 표시
 */
export function showSuccess(elementId: string, message: string): void {
  showStatusWithIcon(elementId, message, 'success');
}

/**
 * 에러 메시지 표시
 */
export function showError(elementId: string, message: string): void {
  showStatusWithIcon(elementId, message, 'error');
}

/**
 * 경고 메시지 표시
 */
export function showWarning(elementId: string, message: string): void {
  showStatusWithIcon(elementId, message, 'warning');
}

/**
 * 정보 메시지 표시
 */
export function showInfo(elementId: string, message: string): void {
  showStatusWithIcon(elementId, message, 'info');
}

/**
 * 값 표시 (코드 블록 스타일)
 */
export function showValue(elementId: string, value: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

/**
 * 주소 축약 표시 (0x1234...5678)
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * 해시 축약 표시
 */
export function shortenHash(hash: string, chars = 8): string {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

/**
 * BigInt를 포맷된 문자열로 변환
 */
export function formatBigInt(value: bigint, decimals = 18): string {
  const divisor = 10n ** BigInt(decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;

  if (fractionalPart === 0n) {
    return integerPart.toString();
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmed = fractionalStr.replace(/0+$/, '');
  return `${integerPart}.${trimmed}`;
}

/**
 * 타임스탬프를 날짜 문자열로 변환
 */
export function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString();
}

/**
 * 클립보드에 복사
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * 요소에 이벤트 리스너 안전하게 추가
 */
export function safeAddEventListener<K extends keyof HTMLElementEventMap>(
  elementId: string,
  event: K,
  handler: (ev: HTMLElementEventMap[K]) => void
): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.addEventListener(event, handler);
  }
}

/**
 * 버튼 비활성화/활성화
 */
export function setButtonState(
  buttonId: string,
  enabled: boolean,
  loadingText?: string
): void {
  const button = document.getElementById(buttonId) as HTMLButtonElement | null;
  if (button) {
    button.disabled = !enabled;
    if (loadingText && !enabled) {
      button.dataset.originalText = button.textContent || '';
      button.textContent = loadingText;
    } else if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

/**
 * 입력 필드 값 가져오기
 */
export function getInputValue(elementId: string): string {
  const element = document.getElementById(elementId) as HTMLInputElement | null;
  return element?.value || '';
}

/**
 * 입력 필드 값 설정
 */
export function setInputValue(elementId: string, value: string): void {
  const element = document.getElementById(elementId) as HTMLInputElement | null;
  if (element) {
    element.value = value;
  }
}

/**
 * 요소 표시/숨김
 */
export function setElementVisibility(elementId: string, visible: boolean): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = visible ? '' : 'none';
  }
}

/**
 * 요소의 innerHTML 설정
 */
export function setInnerHTML(elementId: string, html: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = html;
  }
}

/**
 * 요소의 텍스트 설정
 */
export function setText(elementId: string, text: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
  }
}

/**
 * 요소 숨김 (hidden 클래스 추가)
 */
export function hide(elementId: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.add('hidden');
  }
}

/**
 * 요소 표시 (hidden 클래스 제거)
 */
export function show(elementId: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.remove('hidden');
  }
}

/**
 * 요소의 속성 설정
 */
export function setAttribute(elementId: string, attr: string, value: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.setAttribute(attr, value);
  }
}

/**
 * HTML 이스케이프
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 계산 과정 설명 생성 (EIP-712)
 */
export function generateExplanation(
  type: 'domain' | 'struct' | 'digest',
  params: Record<string, unknown>
): string {
  const explanations: Record<string, string> = {
    domain: `
      <div class="space-y-2 text-sm">
        <p class="font-semibold">1. EIP712Domain TypeHash 계산:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
        </code>

        <p class="font-semibold mt-3">2. Domain 데이터 인코딩:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          abi.encode(
            typeHash,
            keccak256("${params.name}"),
            keccak256("${params.version}"),
            ${params.chainId},
            ${params.verifyingContract}
          )
        </code>

        <p class="font-semibold mt-3">3. 최종 해시:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          keccak256(encoded) = domainSeparator
        </code>
      </div>
    `,

    struct: `
      <div class="space-y-2 text-sm">
        <p class="font-semibold">1. Batch TypeHash 계산:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          keccak256("Batch(uint256 batchNonce)")
        </code>

        <p class="font-semibold mt-3">2. Struct 데이터 인코딩:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          abi.encode(
            typeHash,
            ${params.batchNonce}
          )
        </code>

        <p class="font-semibold mt-3">3. 최종 해시:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          keccak256(encoded) = structHash
        </code>
      </div>
    `,

    digest: `
      <div class="space-y-2 text-sm">
        <p class="font-semibold">EIP-191 형식으로 최종 Digest 생성:</p>
        <code class="block bg-gray-100 p-2 rounded text-xs">
          keccak256(
            "\\x19\\x01" +        // EIP-191 버전 바이트
            domainSeparator +    // 어느 컨트랙트인지
            structHash           // 무슨 데이터인지
          )
        </code>

        <p class="text-xs text-gray-600 mt-2">
          이 digest를 Private Key로 ECDSA 서명합니다
        </p>
      </div>
    `,
  };

  return explanations[type] || '';
}
