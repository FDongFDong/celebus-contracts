/**
 * StatusDisplay - 상태 표시 공통 컴포넌트
 *
 * 성공/실패/경고/정보 상태를 일관된 UI로 표시
 */

import { icon, statusIcon, inlineSpinner, renderIcons } from './icons';

/**
 * 상태 타입 정의
 */
export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading';

/**
 * 상태별 스타일 설정
 */
interface StatusStyle {
  bgClass: string;
  borderClass: string;
  textClass: string;
  iconHtml: string;
}

const STATUS_STYLES: Record<StatusType, StatusStyle> = {
  success: {
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textClass: 'text-green-800',
    iconHtml: statusIcon.success('sm'),
  },
  error: {
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    textClass: 'text-red-800',
    iconHtml: statusIcon.error('sm'),
  },
  warning: {
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-200',
    textClass: 'text-yellow-800',
    iconHtml: statusIcon.warning('sm'),
  },
  info: {
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-800',
    iconHtml: statusIcon.info('sm'),
  },
  loading: {
    bgClass: 'bg-gray-50',
    borderClass: 'border-gray-200',
    textClass: 'text-gray-700',
    iconHtml: inlineSpinner('sm'),
  },
};

/**
 * 상태 메시지 HTML 생성
 *
 * @param type - 상태 타입
 * @param message - 표시할 메시지
 * @param details - 추가 세부 정보 (선택)
 * @returns HTML 문자열
 */
export function statusMessage(
  type: StatusType,
  message: string,
  details?: string
): string {
  const style = STATUS_STYLES[type];

  return `
    <div class="${style.bgClass} ${style.borderClass} border rounded-lg p-3">
      <div class="flex items-start gap-2">
        <span class="flex-shrink-0 mt-0.5">${style.iconHtml}</span>
        <div class="flex-1 min-w-0">
          <p class="${style.textClass} text-sm font-medium">${message}</p>
          ${details ? `<p class="text-xs text-gray-600 mt-1">${details}</p>` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * 인라인 상태 표시 (한 줄)
 */
export function statusInline(type: StatusType, message: string): string {
  const style = STATUS_STYLES[type];
  return `<span class="${style.textClass} text-sm">${style.iconHtml} ${message}</span>`;
}

/**
 * 로딩 상태 표시
 */
export function loadingMessage(message = '처리 중...'): string {
  return statusMessage('loading', message);
}

/**
 * 성공 상태 표시
 */
export function successMessage(message: string, details?: string): string {
  return statusMessage('success', message, details);
}

/**
 * 에러 상태 표시
 */
export function errorMessage(message: string, details?: string): string {
  return statusMessage('error', message, details);
}

/**
 * 경고 상태 표시
 */
export function warningMessage(message: string, details?: string): string {
  return statusMessage('warning', message, details);
}

/**
 * 정보 상태 표시
 */
export function infoMessage(message: string, details?: string): string {
  return statusMessage('info', message, details);
}

/**
 * 상태 카드 - 제목과 함께 표시
 */
export function statusCard(
  type: StatusType,
  title: string,
  content: string
): string {
  const style = STATUS_STYLES[type];

  return `
    <div class="${style.bgClass} ${style.borderClass} border rounded-lg overflow-hidden">
      <div class="px-4 py-2 ${style.bgClass} border-b ${style.borderClass}">
        <h4 class="${style.textClass} font-semibold text-sm flex items-center gap-2">
          ${style.iconHtml} ${title}
        </h4>
      </div>
      <div class="p-4 bg-white">
        <div class="text-sm text-gray-700">${content}</div>
      </div>
    </div>
  `;
}

/**
 * 불리언 결과 표시 (True/False)
 */
export function booleanResult(value: boolean, trueLabel = 'True', falseLabel = 'False'): string {
  if (value) {
    return `
      <div class="bg-green-50 border-green-200 border rounded-lg p-3">
        <span class="font-semibold text-green-700">
          ${statusIcon.success('sm')} ${trueLabel}
        </span>
      </div>
    `;
  }
  return `
    <div class="bg-red-50 border-red-200 border rounded-lg p-3">
      <span class="font-semibold text-red-700">
        ${statusIcon.error('sm')} ${falseLabel}
      </span>
    </div>
  `;
}

/**
 * 주소 결과 표시 (복사 버튼 포함)
 */
export function addressResult(address: string): string {
  return `
    <div class="bg-white rounded border p-3 flex items-center justify-between gap-2">
      <span class="font-mono text-sm break-all">${address}</span>
      <button onclick="navigator.clipboard.writeText('${address}').then(() => alert('복사되었습니다!'))"
              class="flex-shrink-0 bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs">
        ${icon('clipboard', 'xs')} 복사
      </button>
    </div>
  `;
}

/**
 * Bytes32 결과 표시 (복사 버튼 포함)
 */
export function bytes32Result(value: string): string {
  return `
    <div class="bg-white rounded border p-3">
      <div class="flex items-center justify-between gap-2">
        <span class="font-mono text-xs break-all flex-1">${value}</span>
        <button onclick="navigator.clipboard.writeText('${value}').then(() => alert('복사되었습니다!'))"
                class="flex-shrink-0 bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs">
          ${icon('clipboard', 'xs')} 복사
        </button>
      </div>
    </div>
  `;
}

/**
 * 통계 카드 (3열 그리드)
 */
export interface StatsData {
  remember: bigint | number | string;
  forget: bigint | number | string;
  total: bigint | number | string;
}

export function statsCards(data: StatsData): string {
  return `
    <div class="grid grid-cols-3 gap-3">
      <div class="bg-green-50 p-3 rounded-lg text-center border border-green-200">
        <p class="text-xl font-bold text-green-600">${data.remember.toString()}</p>
        <p class="text-xs text-gray-600">Remember</p>
      </div>
      <div class="bg-red-50 p-3 rounded-lg text-center border border-red-200">
        <p class="text-xl font-bold text-red-600">${data.forget.toString()}</p>
        <p class="text-xs text-gray-600">Forget</p>
      </div>
      <div class="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
        <p class="text-xl font-bold text-blue-600">${data.total.toString()}</p>
        <p class="text-xs text-gray-600">Total</p>
      </div>
    </div>
  `;
}

/**
 * JSON 데이터 표시
 */
export function jsonResult(data: unknown): string {
  return `
    <div class="bg-white rounded border p-3">
      <pre class="text-xs font-mono whitespace-pre-wrap overflow-x-auto">${JSON.stringify(data, null, 2)}</pre>
    </div>
  `;
}

/**
 * 테이블 렌더링
 */
export function renderTable(data: Record<string, unknown>[], headerClass = 'bg-gray-100'): string {
  if (!data || data.length === 0) {
    return '<p class="text-gray-500 text-sm">데이터가 없습니다.</p>';
  }

  const headers = Object.keys(data[0]);

  return `
    <div class="overflow-x-auto">
      <table class="w-full text-xs border-collapse">
        <thead class="${headerClass}">
          <tr>
            ${headers.map((h) => `<th class="p-2 border text-left">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row) => `
            <tr class="hover:bg-gray-50">
              ${headers
                .map((h) => `<td class="p-2 border font-mono">${formatTableValue(row[h])}</td>`)
                .join('')}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * 테이블 값 포맷팅
 */
function formatTableValue(val: unknown): string {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'bigint') return val.toString();
  return String(val);
}

/**
 * 요소에 상태 메시지 표시
 *
 * @param elementId - 대상 요소 ID
 * @param type - 상태 타입
 * @param message - 메시지
 * @param details - 추가 세부 정보
 */
export function showStatus(
  elementId: string,
  type: StatusType,
  message: string,
  details?: string
): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = statusMessage(type, message, details);
    renderIcons();
  }
}

/**
 * 요소에 로딩 상태 표시
 */
export function showLoading(elementId: string, message = '조회 중...'): void {
  showStatus(elementId, 'loading', message);
}

/**
 * 요소에 성공 상태 표시
 */
export function showSuccess(elementId: string, message: string, details?: string): void {
  showStatus(elementId, 'success', message, details);
}

/**
 * 요소에 에러 상태 표시
 */
export function showError(elementId: string, message: string, details?: string): void {
  showStatus(elementId, 'error', message, details);
}

/**
 * 요소에 HTML 설정 (아이콘 렌더링 포함)
 */
export function setContent(elementId: string, html: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = html;
    renderIcons();
  }
}
