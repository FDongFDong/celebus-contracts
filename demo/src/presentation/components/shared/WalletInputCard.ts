/**
 * WalletInputCard - Private Key 입력 UI 공통 컴포넌트
 *
 * 지갑 Private Key 입력 및 주소 표시 UI
 */

import { icon, userIcon, renderIcons } from './icons';
import { WalletAdapter } from '../../../infrastructure/viem/WalletAdapter';
import * as UIHelper from '../../utils/UIHelper';

/**
 * 지갑 카드 색상 테마
 */
export type WalletTheme = 'blue' | 'green' | 'purple' | 'yellow' | 'gray' | 'pink';

/**
 * 테마별 스타일 설정
 */
interface ThemeStyle {
  bgClass: string;
  borderClass: string;
  textClass: string;
  buttonBgClass: string;
  buttonHoverClass: string;
}

const THEME_STYLES: Record<WalletTheme, ThemeStyle> = {
  blue: {
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-800',
    buttonBgClass: 'bg-blue-500',
    buttonHoverClass: 'hover:bg-blue-600',
  },
  green: {
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textClass: 'text-green-800',
    buttonBgClass: 'bg-green-500',
    buttonHoverClass: 'hover:bg-green-600',
  },
  purple: {
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    textClass: 'text-purple-800',
    buttonBgClass: 'bg-purple-500',
    buttonHoverClass: 'hover:bg-purple-600',
  },
  yellow: {
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-200',
    textClass: 'text-yellow-800',
    buttonBgClass: 'bg-yellow-500',
    buttonHoverClass: 'hover:bg-yellow-600',
  },
  gray: {
    bgClass: 'bg-gray-50',
    borderClass: 'border-gray-200',
    textClass: 'text-gray-800',
    buttonBgClass: 'bg-gray-600',
    buttonHoverClass: 'hover:bg-gray-700',
  },
  pink: {
    bgClass: 'bg-pink-50',
    borderClass: 'border-pink-200',
    textClass: 'text-pink-800',
    buttonBgClass: 'bg-pink-500',
    buttonHoverClass: 'hover:bg-pink-600',
  },
};

/**
 * WalletInputCard 옵션
 */
export interface WalletCardOptions {
  /** 고유 ID (DOM 요소 ID prefix) */
  id: string;
  /** 카드 제목 */
  title: string;
  /** 색상 테마 */
  theme?: WalletTheme;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 설명 텍스트 */
  description?: string;
  /** 아이콘 이름 (Lucide) */
  iconName?: string;
  /** 추가 버튼 렌더링 여부 */
  showActionButton?: boolean;
  /** 추가 버튼 텍스트 */
  actionButtonText?: string;
  /** 추가 버튼 클릭 시 호출할 콜백 ID */
  actionButtonId?: string;
}

/**
 * Wallet Input Card HTML 생성
 *
 * @param options - 카드 옵션
 * @returns HTML 문자열
 */
export function walletInputCard(options: WalletCardOptions): string {
  const {
    id,
    title,
    theme = 'blue',
    placeholder = '0x...',
    description,
    iconName = 'wallet',
    showActionButton = false,
    actionButtonText = 'Submit',
    actionButtonId,
  } = options;

  const style = THEME_STYLES[theme];
  const inputId = `${id}PrivateKey`;
  const addressId = `${id}Address`;
  const statusId = `${id}Status`;
  const btnId = actionButtonId ?? `${id}ActionBtn`;

  return `
    <div class="p-4 ${style.bgClass} rounded-lg border ${style.borderClass}">
      <h3 class="text-md font-semibold ${style.textClass} mb-3">
        ${icon(iconName, 'sm')} ${title}
      </h3>

      <label class="block text-sm font-medium text-gray-700 mb-2">
        ${userIcon.key('xs')} Private Key (0x...)
      </label>

      <input
        type="text"
        id="${inputId}"
        class="w-full px-3 py-2 border rounded-md text-xs font-mono mb-2"
        placeholder="${placeholder}"
      >

      <p class="text-xs text-gray-500 mb-2">
        Address: <span id="${addressId}" class="font-mono text-xs break-all">-</span>
      </p>

      ${description ? `<p class="text-xs text-gray-600 mb-2">${description}</p>` : ''}

      ${showActionButton ? `
        <button
          id="${btnId}"
          class="mt-2 ${style.buttonBgClass} text-white px-4 py-2 rounded-md ${style.buttonHoverClass}"
        >
          ${actionButtonText}
        </button>
      ` : ''}

      <div id="${statusId}" class="mt-3 hidden"></div>
    </div>
  `;
}

/**
 * 간단한 지갑 입력 필드 (카드 없이)
 */
export function walletInputField(
  id: string,
  label: string,
  placeholder = '0x...'
): string {
  const inputId = `${id}PrivateKey`;
  const addressId = `${id}Address`;

  return `
    <div class="mb-3">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        ${userIcon.key('xs')} ${label}
      </label>
      <input
        type="text"
        id="${inputId}"
        class="w-full px-3 py-2 border border-purple-300 rounded-md font-mono text-sm bg-white"
        placeholder="${placeholder}"
      >
      <p class="text-xs text-gray-500 mt-1">
        Address: <span id="${addressId}" class="font-mono text-xs break-all">-</span>
      </p>
    </div>
  `;
}

/**
 * Private Key 입력 이벤트 핸들러 바인딩
 *
 * @param inputId - input 요소 ID (PrivateKey suffix 포함)
 * @param addressId - address 표시 요소 ID
 * @param onWalletChange - 지갑 변경 콜백
 */
export function bindWalletInput(
  inputId: string,
  addressId: string,
  onWalletChange?: (wallet: WalletAdapter | null) => void
): void {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  const addressSpan = document.getElementById(addressId);

  if (!input) return;

  input.addEventListener('input', () => {
    const privateKey = input.value.trim();

    if (!privateKey) {
      if (addressSpan) addressSpan.textContent = '-';
      onWalletChange?.(null);
      return;
    }

    try {
      const wallet = new WalletAdapter(privateKey as `0x${string}`);
      if (addressSpan) addressSpan.textContent = wallet.address;
      onWalletChange?.(wallet);
    } catch {
      if (addressSpan) addressSpan.textContent = 'Invalid key';
      onWalletChange?.(null);
    }
  });
}

/**
 * 지갑 카드 초기화 (이벤트 바인딩 포함)
 *
 * @param id - 카드 ID prefix
 * @param onWalletChange - 지갑 변경 콜백
 */
export function initWalletCard(
  id: string,
  onWalletChange?: (wallet: WalletAdapter | null) => void
): void {
  const inputId = `${id}PrivateKey`;
  const addressId = `${id}Address`;
  bindWalletInput(inputId, addressId, onWalletChange);
  renderIcons();
}

/**
 * 지갑 카드 상태 표시
 */
export function showWalletCardStatus(
  id: string,
  message: string,
  type: 'success' | 'error' | 'info' = 'info'
): void {
  const statusId = `${id}Status`;
  const element = document.getElementById(statusId);
  if (!element) return;

  element.classList.remove('hidden');

  const colorMap = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  };

  const iconMap = {
    success: icon('check-circle', 'sm', 'text-green-600'),
    error: icon('x-circle', 'sm', 'text-red-600'),
    info: icon('info', 'sm', 'text-blue-600'),
  };

  element.innerHTML = `
    <div class="${colorMap[type]} text-sm flex items-center gap-1">
      ${iconMap[type]}
      <span>${message}</span>
    </div>
  `;
  renderIcons();
}

/**
 * 지갑 카드 상태 숨기기
 */
export function hideWalletCardStatus(id: string): void {
  const statusId = `${id}Status`;
  UIHelper.hide(statusId);
}

/**
 * 다중 지갑 입력 그리드
 */
export interface MultiWalletConfig {
  wallets: Array<{
    id: string;
    title: string;
    theme: WalletTheme;
    iconName?: string;
  }>;
  columns?: 2 | 3 | 4;
}

export function multiWalletGrid(config: MultiWalletConfig): string {
  const { wallets, columns = 2 } = config;
  const gridClass = `grid-cols-${columns}`;

  return `
    <div class="grid ${gridClass} gap-4">
      ${wallets
        .map((w) =>
          walletInputCard({
            id: w.id,
            title: w.title,
            theme: w.theme,
            iconName: w.iconName ?? 'user',
          })
        )
        .join('')}
    </div>
  `;
}

/**
 * 사용자 선택 드롭다운
 */
export interface UserSelectOption {
  value: string;
  label: string;
  isCustom?: boolean;
}

export function userSelectDropdown(
  id: string,
  options: UserSelectOption[],
  label = '사용자 선택'
): string {
  return `
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        ${userIcon.user('xs')} ${label}
      </label>
      <select id="${id}" class="w-full px-3 py-2 border rounded-md bg-yellow-50">
        ${options
          .map(
            (opt) =>
              `<option value="${opt.value}"${opt.isCustom ? ' data-custom="true"' : ''}>${opt.label}</option>`
          )
          .join('')}
      </select>
    </div>
  `;
}

/**
 * 지갑 정보 표시 카드 (읽기 전용)
 */
export function walletInfoCard(
  title: string,
  address: string,
  theme: WalletTheme = 'gray'
): string {
  const style = THEME_STYLES[theme];
  const shortAddress = address
    ? `${address.slice(0, 8)}...${address.slice(-6)}`
    : '-';

  return `
    <div class="p-3 ${style.bgClass} rounded-lg border ${style.borderClass}">
      <p class="text-xs font-medium ${style.textClass} mb-1">${title}</p>
      <p class="font-mono text-sm" title="${address}">${shortAddress}</p>
      ${address ? `
        <button
          onclick="navigator.clipboard.writeText('${address}').then(() => alert('복사되었습니다!'))"
          class="mt-1 text-xs ${style.buttonBgClass} text-white px-2 py-0.5 rounded ${style.buttonHoverClass}"
        >
          ${icon('clipboard', 'xs')} 복사
        </button>
      ` : ''}
    </div>
  `;
}
