/**
 * Lucide Icons Module
 *
 * Lucide 아이콘 라이브러리의 re-export 및 SVG 문자열 생성 유틸리티
 * Vanilla TypeScript 환경에서 사용 (React 컴포넌트가 아님)
 */

// Lucide 아이콘 re-export (ESM)
export {
  // Status & Feedback
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  Check,
  X,
  Bell,
  // Navigation & Actions
  Search,
  Settings,
  Rocket,
  RefreshCw,
  Upload,
  Clipboard,
  Trash2,
  // User & Security
  Wallet,
  User,
  Key,
  Lock,
  Shield,
  ShieldCheck,
  Crown,
  // Data & Charts
  BarChart2,
  TrendingUp,
  Activity,
  Layers,
  // Document & Files
  FileText,
  PenTool,
  BookOpen,
  Terminal,
  Wrench,
  // Communication
  Send,
  Smartphone,
  Monitor,
  // UI Elements
  Hash,
  Tag,
  Palette,
  List,
  Clock,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
} from 'lucide';

/**
 * 아이콘 크기 프리셋
 */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<IconSize, { width: number; height: number; class: string }> = {
  xs: { width: 12, height: 12, class: 'w-3 h-3' },
  sm: { width: 16, height: 16, class: 'w-4 h-4' },
  md: { width: 20, height: 20, class: 'w-5 h-5' },
  lg: { width: 24, height: 24, class: 'w-6 h-6' },
  xl: { width: 32, height: 32, class: 'w-8 h-8' },
};

/**
 * Lucide 아이콘 인라인 HTML 생성
 *
 * @param iconName - Lucide 아이콘 이름 (kebab-case)
 * @param size - 아이콘 크기 프리셋
 * @param className - 추가 CSS 클래스
 * @returns HTML string (<i data-lucide="..."> 형식)
 *
 * @example
 * icon('check-circle', 'sm', 'text-green-600')
 * // => '<i data-lucide="check-circle" class="w-4 h-4 inline text-green-600"></i>'
 */
export function icon(iconName: string, size: IconSize = 'sm', className = ''): string {
  const sizeClass = SIZE_MAP[size].class;
  const classes = `${sizeClass} inline ${className}`.trim();
  return `<i data-lucide="${iconName}" class="${classes}"></i>`;
}

/**
 * 상태 아이콘 프리셋
 */
export const statusIcon = {
  success: (size: IconSize = 'sm') => icon('check-circle', size, 'text-green-600'),
  error: (size: IconSize = 'sm') => icon('x-circle', size, 'text-red-600'),
  warning: (size: IconSize = 'sm') => icon('alert-triangle', size, 'text-yellow-600'),
  info: (size: IconSize = 'sm') => icon('info', size, 'text-blue-600'),
  loading: (size: IconSize = 'sm') => icon('loader-2', size, 'animate-spin text-gray-600'),
} as const;

/**
 * 액션 아이콘 프리셋
 */
export const actionIcon = {
  search: (size: IconSize = 'sm') => icon('search', size),
  settings: (size: IconSize = 'sm') => icon('settings', size),
  refresh: (size: IconSize = 'sm') => icon('refresh-cw', size),
  upload: (size: IconSize = 'sm') => icon('upload', size),
  copy: (size: IconSize = 'sm') => icon('clipboard', size),
  delete: (size: IconSize = 'sm') => icon('trash-2', size),
  submit: (size: IconSize = 'sm') => icon('rocket', size),
  sign: (size: IconSize = 'sm') => icon('pen-tool', size),
} as const;

/**
 * 데이터 아이콘 프리셋
 */
export const dataIcon = {
  chart: (size: IconSize = 'sm') => icon('bar-chart-2', size),
  trend: (size: IconSize = 'sm') => icon('trending-up', size),
  activity: (size: IconSize = 'sm') => icon('activity', size),
  layers: (size: IconSize = 'sm') => icon('layers', size),
  hash: (size: IconSize = 'sm') => icon('hash', size),
  list: (size: IconSize = 'sm') => icon('list', size),
} as const;

/**
 * 사용자 아이콘 프리셋
 */
export const userIcon = {
  wallet: (size: IconSize = 'sm') => icon('wallet', size),
  user: (size: IconSize = 'sm') => icon('user', size),
  key: (size: IconSize = 'sm') => icon('key', size),
  lock: (size: IconSize = 'sm') => icon('lock', size),
  shield: (size: IconSize = 'sm') => icon('shield', size),
  shieldCheck: (size: IconSize = 'sm') => icon('shield-check', size),
} as const;

/**
 * 문서 아이콘 프리셋
 */
export const docIcon = {
  file: (size: IconSize = 'sm') => icon('file-text', size),
  book: (size: IconSize = 'sm') => icon('book-open', size),
  terminal: (size: IconSize = 'sm') => icon('terminal', size),
  tool: (size: IconSize = 'sm') => icon('wrench', size),
} as const;

/**
 * 투표 관련 아이콘
 */
export const voteIcon = {
  remember: (size: IconSize = 'sm') => icon('thumbs-up', size, 'text-green-600'),
  forget: (size: IconSize = 'sm') => icon('thumbs-down', size, 'text-red-600'),
} as const;

/**
 * Lucide 아이콘 렌더링 트리거
 * DOM 변경 후 호출하여 새로운 아이콘을 렌더링
 */
export function renderIcons(): void {
  if (typeof window !== 'undefined' && (window as any).lucide) {
    (window as any).lucide.createIcons();
  }
}

/**
 * 스피너 SVG 문자열 생성 (Lucide 외부 의존성 없음)
 *
 * @param size - 크기 (픽셀)
 * @param className - 추가 CSS 클래스
 * @returns SVG HTML 문자열
 */
export function spinnerSvg(size = 16, className = 'text-purple-600'): string {
  return `
    <svg class="animate-spin h-${Math.round(size / 4)} w-${Math.round(size / 4)} ${className}"
         xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
      </path>
    </svg>
  `;
}

/**
 * 인라인 스피너 (텍스트와 함께 사용)
 */
export function inlineSpinner(size: IconSize = 'sm'): string {
  const sizeClass = SIZE_MAP[size].class;
  return `
    <svg class="animate-spin ${sizeClass} inline mr-1"
         xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
      </path>
    </svg>
  `;
}
