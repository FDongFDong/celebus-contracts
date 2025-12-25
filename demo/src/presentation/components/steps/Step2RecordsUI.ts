/**
 * Step2RecordsUI - Step2Records 컴포넌트의 UI 렌더링 헬퍼
 *
 * 레코드 카드, 사용자별 레코드 목록 등 UI 렌더링 함수
 */

import { icon, renderIcons } from '../shared/icons';
import type { VoteType } from '../../../domain/entities/VoteRecord';
import type { Address } from '../../../domain/types';

/**
 * UI에서 사용할 레코드 데이터
 */
export interface UIVoteRecord {
  userIndex: number;
  userAddress: Address;
  timestamp: string;
  missionId: string;
  votingId: string;
  optionId: string;
  voteType: VoteType;
  userId: string;
  votingAmt: string;
}

/**
 * 설정 상수
 */
export const CONFIG = {
  MAX_RECORDS_PER_BATCH: 20,
  DEFAULT_VALUES: {
    user1Id: '1',
    missionId: '1',
    optionId: '1',
    votingAmt: '100',
  },
};

/**
 * 레코드 카드 색상 타입
 */
export type RecordColor = 'blue' | 'green' | 'purple';

/**
 * 사용자별 레코드 목록 렌더링
 */
export function renderUserRecordsList(
  userKey: 'user1' | 'user2' | 'custom',
  records: UIVoteRecord[],
  color: RecordColor,
  allRecords: UIVoteRecord[],
  onDeleteCallback: string
): { count: number; html: string } {
  if (records.length === 0) {
    const emptyMessages: Record<string, string> = {
      user1: 'User 1 레코드가 없습니다',
      user2: 'User 2 레코드가 없습니다',
      custom: 'Custom 레코드가 없습니다',
    };

    return {
      count: 0,
      html: `<p class="text-${color}-400 text-xs">${emptyMessages[userKey]}</p>`,
    };
  }

  const html = records
    .map((r, idx) => {
      const globalIndex = allRecords.findIndex((rec) => rec === r);
      const thumbIcon = r.voteType === 1 ? 'thumbs-up' : 'thumbs-down';
      const displayInfo =
        userKey === 'custom'
          ? `<p class="text-xs text-gray-500 mt-1">Addr: <span class="font-mono">${r.userAddress.slice(0, 8)}...</span></p>`
          : `<p class="text-xs text-gray-500 mt-1">User: <span class="font-mono">${r.userId}</span></p>`;

      return `
        <div class="record-card border-${color}-300 relative group">
          <button onclick="${onDeleteCallback}(${globalIndex})"
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="삭제">
            x
          </button>
          <p class="text-xs font-mono text-${color}-700">
            #${idx + 1}: M${r.missionId} V${r.votingId} C${r.optionId}
            ${icon(thumbIcon, 'xs')} ${r.votingAmt}
          </p>
          ${displayInfo}
        </div>
      `;
    })
    .join('');

  return { count: records.length, html };
}

/**
 * 메인 폼 렌더링
 */
export function renderRecordForm(): string {
  return `
    <div id="step2" class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-blue-500">
      <h2 class="text-xl font-semibold mb-4">
        <span class="step-badge">STEP 2</span>
        ${icon('file-text', 'md')} 투표 레코드 생성(Frontend)
      </h2>
      <p class="text-sm text-gray-600 mb-4">각 사용자가 투표할 데이터를 입력합니다</p>

      <!-- 백엔드 시뮬레이션 안내 -->
      ${renderBackendSimulationInfo()}

      <!-- Custom Private Key 섹션 -->
      ${renderCustomPrivateKeySection()}

      <!-- userId는 숨김 처리 -->
      <input type="hidden" id="userId" value="${CONFIG.DEFAULT_VALUES.user1Id}">

      <!-- 입력 필드 그리드 -->
      ${renderInputFields()}

      <button id="addRecordBtn" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
        + 레코드 추가
      </button>

      <!-- 레코드 목록 -->
      ${renderRecordLists()}
    </div>
  `;
}

/**
 * 백엔드 시뮬레이션 안내 렌더링
 */
function renderBackendSimulationInfo(): string {
  return `
    <div class="mb-4 p-3 bg-purple-50 border-l-4 border-purple-400 rounded">
      <p class="text-sm text-purple-800">
        <strong>${icon('lightbulb', 'sm')} 백엔드 시뮬레이션:</strong>
      </p>
      <ul class="text-xs text-purple-700 mt-1 ml-4 list-disc space-y-1">
        <li><strong>User Nonce:</strong> 사용자 입력 또는 자동 생성 후 중복 확인 (재사용 방지)</li>
        <li><strong>Voting ID:</strong> 프론트엔드에서 타임스탬프 기반 자동 생성 (사용자별 유니크)</li>
        <li><strong>userId:</strong> 백엔드가 지갑 주소를 기반으로 DB에서 자동 설정</li>
      </ul>
    </div>
  `;
}

/**
 * Custom Private Key 섹션 렌더링
 */
function renderCustomPrivateKeySection(): string {
  return `
    <div id="customPrivateKeySection" class="hidden mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
      <label class="block text-sm font-medium text-purple-700 mb-1">${icon('key', 'sm')} Custom Private Key</label>
      <input type="text" id="customPrivateKey" class="w-full px-3 py-2 border border-purple-300 rounded-md font-mono text-sm bg-white" placeholder="0x...">
      <p class="text-xs text-purple-600 mt-1">Address: <span id="customUserAddress" class="font-mono text-xs break-all block">-</span></p>
    </div>
  `;
}

/**
 * 입력 필드 그리드 렌더링
 */
function renderInputFields(): string {
  return `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">${icon('user', 'sm')} 사용자 선택</label>
        <select id="selectedUser" class="w-full px-3 py-2 border rounded-md bg-yellow-50">
          <option value="0">User 1 (STEP 1)</option>
          <option value="1">User 2 (STEP 1)</option>
          <option value="custom">직접 입력 (Private Key)</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">${icon('hash', 'sm')} User Nonce</label>
        <input type="text" id="userNonce" class="w-full px-3 py-2 border rounded-md mb-1" placeholder="직접 입력 또는 자동 생성">
        <div class="flex gap-1">
          <button id="generateNonceBtn" class="flex-1 px-2 py-1 bg-purple-500 text-white rounded text-xs" title="타임스탬프 기반 유니크 Nonce 생성">
            생성
          </button>
          <button id="checkNonceBtn" class="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-xs" title="해당 Nonce가 이미 사용되었는지 확인">
            중복확인
          </button>
        </div>
        <div id="nonceCheckResult" class="hidden mt-1"></div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
        <input type="text" id="recordTimestamp" class="w-full px-3 py-2 border rounded-md font-mono text-sm mb-1" placeholder="직접 입력 또는 자동 생성">
        <button id="generateTimestampBtn" class="w-full px-2 py-1 bg-gray-500 text-white rounded text-xs" title="현재 시간 기준 타임스탬프 생성">
          현재 시간 생성
        </button>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Mission ID</label>
        <input type="text" id="missionId" class="w-full px-3 py-2 border rounded-md" value="${CONFIG.DEFAULT_VALUES.missionId}">
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Voting ID</label>
        <input type="text" id="votingId" class="w-full px-3 py-2 border rounded-md font-mono text-sm mb-1" placeholder="직접 입력 또는 자동 생성">
        <button id="generateVotingIdBtn" class="w-full px-2 py-1 bg-purple-500 text-white rounded text-xs" title="타임스탬프 + 사용자 인덱스 기반 유니크 ID 생성">
          자동 생성
        </button>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Artist ID (optionId)</label>
        <input type="text" id="optionId" class="w-full px-3 py-2 border rounded-md" value="${CONFIG.DEFAULT_VALUES.optionId}">
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Vote Type</label>
        <select id="voteType" class="w-full px-3 py-2 border rounded-md">
          <option value="1">Remember (1)</option>
          <option value="0">Forget (0)</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Voting Amount</label>
        <input type="text" id="votingAmt" class="w-full px-3 py-2 border rounded-md" value="${CONFIG.DEFAULT_VALUES.votingAmt}">
      </div>
    </div>
  `;
}

/**
 * 레코드 목록 컨테이너 렌더링
 */
function renderRecordLists(): string {
  return `
    <div class="mt-4">
      <p class="text-sm font-medium text-gray-700 mb-2">
        작성된 레코드 (<span id="recordCount">0</span>/${CONFIG.MAX_RECORDS_PER_BATCH})
      </p>

      <div class="grid grid-cols-3 gap-4">
        <!-- User 1 레코드 -->
        <div class="bg-blue-50 rounded-lg border-2 border-blue-200 p-3">
          <p class="text-sm font-semibold text-blue-800 mb-2">
            ${icon('user', 'sm')} User 1 레코드 (<span id="user1RecordCount">0</span>개)
          </p>
          <div id="user1RecordsList" class="space-y-2 min-h-[80px]">
            <p class="text-blue-400 text-xs">User 1 레코드가 없습니다</p>
          </div>
        </div>

        <!-- User 2 레코드 -->
        <div class="bg-green-50 rounded-lg border-2 border-green-200 p-3">
          <p class="text-sm font-semibold text-green-800 mb-2">
            ${icon('user', 'sm')} User 2 레코드 (<span id="user2RecordCount">0</span>개)
          </p>
          <div id="user2RecordsList" class="space-y-2 min-h-[80px]">
            <p class="text-green-400 text-xs">User 2 레코드가 없습니다</p>
          </div>
        </div>

        <!-- Custom 사용자 레코드 -->
        <div class="bg-purple-50 rounded-lg border-2 border-purple-200 p-3">
          <p class="text-sm font-semibold text-purple-800 mb-2">
            ${icon('key', 'sm')} Custom 레코드 (<span id="customRecordCount">0</span>개)
          </p>
          <div id="customRecordsList" class="space-y-2 min-h-[80px]">
            <p class="text-purple-400 text-xs">Custom 레코드가 없습니다</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Nonce 중복 확인 결과 렌더링
 */
export function renderNonceCheckResult(isUsed: boolean): string {
  if (isUsed) {
    return `
      <span class="text-red-600 text-xs font-semibold">
        ${icon('x-circle', 'xs', 'text-red-600')} 이미 사용된 Nonce입니다. 다른 값을 사용해주세요.
      </span>
    `;
  }
  return `
    <span class="text-green-600 text-xs font-semibold">
      ${icon('check-circle', 'xs', 'text-green-600')} 사용 가능한 Nonce입니다.
    </span>
  `;
}

/**
 * Nonce 중복 확인 에러 렌더링
 */
export function renderNonceCheckError(message: string): string {
  return `
    <span class="text-red-600 text-xs">
      ${icon('alert-triangle', 'xs', 'text-red-600')} 중복 확인 실패: ${message}
    </span>
  `;
}

/**
 * 레코드 UI 업데이트
 */
export function updateRecordListsUI(
  allRecords: UIVoteRecord[],
  onDeleteCallback: string
): void {
  // 전체 레코드 수 업데이트
  const recordCountEl = document.getElementById('recordCount');
  if (recordCountEl) {
    recordCountEl.textContent = allRecords.length.toString();
  }

  // User별 레코드 필터링
  const user1Records = allRecords.filter((r) => r.userIndex === 0);
  const user2Records = allRecords.filter((r) => r.userIndex === 1);
  const customRecords = allRecords.filter((r) => r.userIndex === 99);

  // User 1 레코드 표시
  updateUserRecordList('user1', user1Records, 'blue', allRecords, onDeleteCallback);

  // User 2 레코드 표시
  updateUserRecordList('user2', user2Records, 'green', allRecords, onDeleteCallback);

  // Custom 레코드 표시
  updateUserRecordList('custom', customRecords, 'purple', allRecords, onDeleteCallback);

  // Lucide 아이콘 재렌더링
  renderIcons();
}

/**
 * 사용자별 레코드 목록 DOM 업데이트
 */
function updateUserRecordList(
  userKey: 'user1' | 'user2' | 'custom',
  records: UIVoteRecord[],
  color: RecordColor,
  allRecords: UIVoteRecord[],
  onDeleteCallback: string
): void {
  const countEl = document.getElementById(`${userKey}RecordCount`);
  const listEl = document.getElementById(`${userKey}RecordsList`);

  if (!countEl || !listEl) return;

  const result = renderUserRecordsList(userKey, records, color, allRecords, onDeleteCallback);
  countEl.textContent = result.count.toString();
  listEl.innerHTML = result.html;
}
