/**
 * Step8QueryHelpers - Step8Query 컴포넌트의 헬퍼 함수 및 탭 렌더링
 *
 * 조회 결과 렌더링, 탭 콘텐츠 생성 등의 유틸리티 함수
 */

import { icon, statusIcon, inlineSpinner, renderIcons } from '../shared/icons';
import {
  statsCards,
  addressResult,
  bytes32Result,
  booleanResult,
  jsonResult,
  renderTable,
} from '../shared/StatusDisplay';

/**
 * 조회 결과 표시 포맷
 */
export type ResultFormat = 'json' | 'table' | 'stats' | 'address' | 'bool' | 'bytes32';

/**
 * 로딩 상태 표시
 */
export function showLoading(elementId: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div class="flex items-center mt-2">
        ${inlineSpinner('sm')}
        <span class="text-sm text-gray-600">조회 중...</span>
      </div>
    `;
  }
}

/**
 * 에러 표시
 */
export function showError(elementId: string, message: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div class="bg-red-50 border border-red-200 rounded p-3 mt-2">
        <p class="text-red-800 text-sm">${statusIcon.error('sm')} ${message}</p>
      </div>
    `;
    renderIcons();
  }
}

/**
 * 결과 표시
 */
export function showResult(
  elementId: string,
  data: unknown,
  format: ResultFormat = 'json'
): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  let html: string;

  switch (format) {
    case 'table':
      html = Array.isArray(data) ? renderTable(data) : jsonResult(data);
      break;
    case 'stats':
      html = statsCards(data as { remember: bigint; forget: bigint; total: bigint });
      break;
    case 'address':
      html = addressResult(data as string);
      break;
    case 'bool':
      html = booleanResult(
        data as boolean,
        'True (사용됨/허용됨)',
        'False (미사용/비허용)'
      );
      break;
    case 'bytes32':
      html = bytes32Result(data as string);
      break;
    default:
      html = jsonResult(data);
  }

  element.innerHTML = `<div class="mt-2">${html}</div>`;
  renderIcons();
}

// ==================== 탭 렌더링 ====================

/**
 * 투표 결과 탭 렌더링
 */
export function renderVoteResultsTab(): string {
  return `
    <div class="space-y-6">
      <!-- 투표 요약 조회 -->
      <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <h3 class="font-semibold text-purple-900 mb-3">${icon('bar-chart-2', 'sm')} 투표 요약 조회</h3>
        <p class="text-xs text-gray-600 mb-3">getVoteSummariesByMissionVotingId(missionId, votingId)</p>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
            <input id="q_voteSummary_missionId" type="number" value="1" min="0"
                   class="w-full p-2 border rounded text-sm">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Voting ID</label>
            <input id="q_voteSummary_votingId" type="number" value="1" min="0"
                   class="w-full p-2 border rounded text-sm">
          </div>
        </div>
        <button id="queryVoteSummariesBtn"
                class="bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600">
          조회
        </button>
        <div id="result_voteSummaries" class="mt-3"></div>
      </div>

      <!-- Artist 집계 조회 -->
      <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <h3 class="font-semibold text-purple-900 mb-3">${icon('trending-up', 'sm')} Artist 집계 조회</h3>
        <p class="text-xs text-gray-600 mb-3">getArtistAggregates(missionId, optionId)</p>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
            <input id="q_artistAgg_missionId" type="number" value="1" min="0"
                   class="w-full p-2 border rounded text-sm">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Artist ID</label>
            <input id="q_artistAgg_optionId" type="number" value="1" min="0"
                   class="w-full p-2 border rounded text-sm">
          </div>
        </div>
        <button id="queryArtistAggregatesBtn"
                class="bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600">
          조회
        </button>
        <div id="result_artistAggregates" class="mt-3"></div>
      </div>
    </div>
  `;
}

/**
 * Artist 탭 렌더링
 */
export function renderArtistTab(): string {
  return `
    <div class="space-y-6">
      <!-- Artist 통계 -->
      <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <h3 class="font-semibold text-indigo-900 mb-3">${icon('bar-chart-2', 'sm')} Artist 통계</h3>
        <p class="text-xs text-gray-600 mb-3">artistStats(missionId, optionId)</p>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
            <input id="q_artistStats_missionId" type="number" value="1" min="0"
                   class="w-full p-2 border rounded text-sm">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Artist ID</label>
            <input id="q_artistStats_optionId" type="number" value="1" min="0"
                   class="w-full p-2 border rounded text-sm">
          </div>
        </div>
        <button id="queryArtistStatsBtn"
                class="bg-indigo-500 text-white px-4 py-2 rounded text-sm hover:bg-indigo-600">
          조회
        </button>
        <div id="result_artistStats" class="mt-3"></div>
      </div>

      <!-- Artist 이름 -->
      <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <h3 class="font-semibold text-indigo-900 mb-3">${icon('tag', 'sm')} Artist 이름</h3>
        <p class="text-xs text-gray-600 mb-3">artistName(missionId, optionId)</p>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
            <input id="q_artistName_missionId" type="number" value="1" min="0"
                   class="w-full p-2 border rounded text-sm">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Artist ID</label>
            <input id="q_artistName_optionId" type="number" value="1" min="0"
                   class="w-full p-2 border rounded text-sm">
          </div>
        </div>
        <button id="queryArtistNameBtn"
                class="bg-indigo-500 text-white px-4 py-2 rounded text-sm hover:bg-indigo-600">
          조회
        </button>
        <div id="result_artistName" class="mt-3"></div>
      </div>

      <!-- Artist 허용 여부 -->
      <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <h3 class="font-semibold text-indigo-900 mb-3">${icon('check-circle', 'sm')} Artist 허용 여부</h3>
        <p class="text-xs text-gray-600 mb-3">allowedArtist(missionId, optionId)</p>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Mission ID</label>
            <input id="q_allowedArtist_missionId" type="number" value="1" min="0"
                   class="w-full p-2 border rounded text-sm">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Artist ID</label>
            <input id="q_allowedArtist_optionId" type="number" value="1" min="0"
                   class="w-full p-2 border rounded text-sm">
          </div>
        </div>
        <button id="queryAllowedArtistBtn"
                class="bg-indigo-500 text-white px-4 py-2 rounded text-sm hover:bg-indigo-600">
          조회
        </button>
        <div id="result_allowedArtist" class="mt-3"></div>
      </div>
    </div>
  `;
}

/**
 * 레코드 탭 렌더링
 */
export function renderRecordTab(): string {
  return `
    <div class="space-y-6">
      <!-- 투표 레코드 조회 -->
      <div class="bg-teal-50 rounded-lg p-4 border border-teal-200">
        <h3 class="font-semibold text-teal-900 mb-3">${icon('file-text', 'sm')} 투표 레코드 조회</h3>
        <p class="text-xs text-gray-600 mb-3">votes(digest) - bytes32 digest로 특정 레코드 조회</p>
        <div class="mb-3">
          <label class="block text-xs text-gray-600 mb-1">Digest (bytes32)</label>
          <input id="q_votes_digest" type="text" placeholder="0x..."
                 class="w-full p-2 border rounded text-sm font-mono">
        </div>
        <button id="queryVoteRecordBtn"
                class="bg-teal-500 text-white px-4 py-2 rounded text-sm hover:bg-teal-600">
          조회
        </button>
        <div id="result_voteRecord" class="mt-3"></div>
      </div>
    </div>
  `;
}

/**
 * Nonce 탭 렌더링
 */
export function renderNonceTab(): string {
  return `
    <div class="space-y-6">
      <!-- 중복 체크 방식 안내 -->
      <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 class="font-semibold text-blue-900 mb-2">${icon('info', 'sm')} Nonce 시스템 안내</h3>
        <p class="text-sm text-blue-800">
          <strong>User Nonce:</strong> 중복 체크 방식 - 한 번 사용된 Nonce는 재사용 불가능합니다.
          조회 결과가 <strong>true</strong>면 이미 사용된 Nonce입니다.
        </p>
        <p class="text-sm text-blue-800 mt-1">
          <strong>Batch Nonce:</strong> 중복 체크 방식 - Executor가 원하는 숫자를 사용 가능하며, 사용된 Nonce는 재사용 불가능합니다.
        </p>
      </div>

      <!-- User Nonce (중복 체크 방식) -->
      <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <h3 class="font-semibold text-orange-900 mb-3">${icon('hash', 'sm')} User Nonce 사용 여부</h3>
        <p class="text-xs text-gray-600 mb-3">usedUserNonces(user, nonce) - 해당 Nonce가 사용되었는지 확인</p>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">User Address</label>
            <input id="q_userNonce_user" type="text" placeholder="0x..."
                   class="w-full p-2 border rounded text-sm font-mono">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Nonce</label>
            <input id="q_userNonce_nonce" type="number" placeholder="검사할 Nonce" min="0"
                   class="w-full p-2 border rounded text-sm">
          </div>
        </div>
        <button id="queryUserNonceBtn"
                class="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600">
          사용 여부 조회
        </button>
        <div id="result_userNonce" class="mt-3"></div>
      </div>

      <!-- Batch Nonce -->
      <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <h3 class="font-semibold text-orange-900 mb-3">${icon('hash', 'sm')} Batch Nonce 사용 여부</h3>
        <p class="text-xs text-gray-600 mb-3">usedBatchNonces(executor, nonce) - 해당 Nonce가 사용되었는지 확인</p>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Executor Address</label>
            <input id="q_batchNonce_executor" type="text" placeholder="0x..."
                   class="w-full p-2 border rounded text-sm font-mono">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Nonce</label>
            <input id="q_batchNonce_nonce" type="number" placeholder="검사할 Nonce" min="0"
                   class="w-full p-2 border rounded text-sm">
          </div>
        </div>
        <button id="queryBatchNonceBtn"
                class="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600">
          사용 여부 조회
        </button>
        <div id="result_batchNonce" class="mt-3"></div>
      </div>
    </div>
  `;
}

/**
 * 설정 탭 렌더링
 */
export function renderSettingsTab(): string {
  return `
    <div class="space-y-6">
      <!-- Vote Type Name -->
      <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 class="font-semibold text-gray-900 mb-3">${icon('tag', 'sm')} Vote Type 이름</h3>
        <p class="text-xs text-gray-600 mb-3">voteTypeName(voteType)</p>
        <div class="mb-3">
          <label class="block text-xs text-gray-600 mb-1">Vote Type (0=Forget, 1=Remember)</label>
          <input id="q_voteTypeName_type" type="number" value="1" min="0" max="255"
                 class="w-full p-2 border rounded text-sm">
        </div>
        <button id="queryVoteTypeNameBtn"
                class="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
          조회
        </button>
        <div id="result_voteTypeName" class="mt-3"></div>
      </div>

      <!-- Executor Signer -->
      <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 class="font-semibold text-gray-900 mb-3">${icon('user', 'sm')} Executor Signer</h3>
        <p class="text-xs text-gray-600 mb-3">executorSigner() - 현재 등록된 Executor 주소</p>
        <button id="queryExecutorSignerBtn"
                class="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
          조회
        </button>
        <div id="result_executorSigner" class="mt-3"></div>
      </div>

      <!-- Owner -->
      <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 class="font-semibold text-gray-900 mb-3">${icon('crown', 'sm')} Owner</h3>
        <p class="text-xs text-gray-600 mb-3">owner() - 컨트랙트 소유자 주소</p>
        <button id="queryOwnerBtn"
                class="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
          조회
        </button>
        <div id="result_owner" class="mt-3"></div>
      </div>

      <!-- Domain Separator -->
      <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 class="font-semibold text-gray-900 mb-3">${icon('lock', 'sm')} Domain Separator</h3>
        <p class="text-xs text-gray-600 mb-3">domainSeparator() - EIP-712 Domain Separator</p>
        <button id="queryDomainSeparatorBtn"
                class="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
          조회
        </button>
        <div id="result_domainSeparator" class="mt-3"></div>
      </div>
    </div>
  `;
}

/**
 * 실패 로그 탭 렌더링
 */
export function renderFailedLogsTab(): string {
  return `
    <div class="space-y-6">
      <!-- UserBatchFailed 이벤트 조회 -->
      <div class="bg-red-50 rounded-lg p-4 border border-red-200">
        <h3 class="font-semibold text-red-900 mb-3">${icon('x-circle', 'sm')} 실패한 유저 배치 조회</h3>
        <p class="text-xs text-gray-600 mb-3">UserBatchFailed 이벤트 - Soft Fail로 처리된 유저 목록</p>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">From Block (빈칸: 최근 1000블록)</label>
            <input id="q_failedLogs_fromBlock" type="number" placeholder="예: 12345678"
                   class="w-full p-2 border rounded text-sm">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">To Block (빈칸: latest)</label>
            <input id="q_failedLogs_toBlock" type="number" placeholder="예: 12346678"
                   class="w-full p-2 border rounded text-sm">
          </div>
        </div>

        <div class="mb-3">
          <label class="block text-xs text-gray-600 mb-1">또는 특정 Batch Digest로 필터링 (선택사항)</label>
          <input id="q_failedLogs_batchDigest" type="text" placeholder="0x..."
                 class="w-full p-2 border rounded text-sm font-mono">
        </div>

        <button id="queryFailedUsersBtn"
                class="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600">
          실패 로그 조회
        </button>
        <div id="result_failedLogs" class="mt-3"></div>
      </div>

      <!-- REASON 코드 설명 -->
      <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 class="font-semibold text-gray-900 mb-3">${icon('clipboard', 'sm')} 실패 사유 코드 안내</h3>
        <div class="text-sm space-y-1">
          <div class="flex"><span class="w-12 font-mono text-red-600">1</span><span>레코드 수가 0개이거나 20개 초과</span></div>
          <div class="flex"><span class="w-12 font-mono text-red-600">2</span><span>유저 서명이 유효하지 않음</span></div>
          <div class="flex"><span class="w-12 font-mono text-red-600">3</span><span>Nonce 중복 사용 (이미 사용된 nonce)</span></div>
          <div class="flex"><span class="w-12 font-mono text-red-600">4</span><span>VoteType이 유효하지 않음 (0,1 외의 값)</span></div>
          <div class="flex"><span class="w-12 font-mono text-red-600">5</span><span>허용되지 않은 아티스트에게 투표</span></div>
          <div class="flex"><span class="w-12 font-mono text-red-600">6</span><span>문자열 길이 초과 (userId > 100자)</span></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 실패 사유 코드 설명 가져오기
 */
export function getReasonDescription(reasonCode: number): string {
  const reasons: Record<number, string> = {
    1: '레코드 수가 0개이거나 20개 초과',
    2: '유저 서명이 유효하지 않음',
    3: 'Nonce 중복 사용 (이미 사용된 nonce)',
    4: 'VoteType이 유효하지 않음',
    5: '허용되지 않은 아티스트',
    6: '문자열 길이 초과 (userId > 100자)',
  };
  return reasons[reasonCode] ?? `알 수 없는 사유 (${reasonCode})`;
}

/**
 * 실패 로그 결과 렌더링
 */
export function renderFailedLogsResult(
  logs: Array<{
    blockNumber: bigint;
    transactionHash: string | null;
    args: {
      batchDigest?: string;
      user?: string;
      userNonce?: bigint;
      reasonCode?: number;
    };
  }>,
  fromBlock: bigint,
  toBlock: bigint | 'latest',
  currentBlock: bigint
): string {
  if (logs.length === 0) {
    return `
      <div class="bg-green-50 border border-green-200 rounded p-3 mt-2">
        <p class="text-green-800 text-sm">${statusIcon.success('sm')} 해당 블록 범위에서 실패한 유저가 없습니다.</p>
        <p class="text-xs text-gray-500 mt-1">조회 범위: 블록 ${fromBlock.toString()} ~ ${toBlock === 'latest' ? currentBlock.toString() : toBlock.toString()}</p>
      </div>
    `;
  }

  const data = logs.map((event) => ({
    blockNumber: event.blockNumber,
    txHash: event.transactionHash?.slice(0, 10) + '...' + event.transactionHash?.slice(-8),
    fullTxHash: event.transactionHash ?? '',
    batchDigest: event.args.batchDigest?.slice(0, 10) + '...' + event.args.batchDigest?.slice(-8),
    fullBatchDigest: event.args.batchDigest ?? '',
    user: event.args.user?.slice(0, 6) + '...' + event.args.user?.slice(-4),
    fullUser: event.args.user ?? '',
    userNonce: event.args.userNonce?.toString() ?? '0',
    reasonCode: event.args.reasonCode ?? 0,
    reasonDesc: getReasonDescription(Number(event.args.reasonCode ?? 0)),
  }));

  return `
    <div class="mt-2">
      <p class="text-sm text-gray-600 mb-2">총 ${data.length}건의 실패 로그 (블록 ${fromBlock.toString()} ~ ${toBlock === 'latest' ? currentBlock.toString() : toBlock.toString()})</p>
      <div class="overflow-x-auto">
        <table class="w-full text-xs border-collapse">
          <thead class="bg-red-100">
            <tr>
              <th class="p-2 border text-left">블록</th>
              <th class="p-2 border text-left">Tx Hash</th>
              <th class="p-2 border text-left">User</th>
              <th class="p-2 border text-left">Nonce</th>
              <th class="p-2 border text-left">사유</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) => `
              <tr class="hover:bg-red-50">
                <td class="p-2 border font-mono">${row.blockNumber}</td>
                <td class="p-2 border font-mono cursor-pointer" title="${row.fullTxHash}" onclick="navigator.clipboard.writeText('${row.fullTxHash}').then(() => alert('복사됨!'))">${row.txHash}</td>
                <td class="p-2 border font-mono cursor-pointer" title="${row.fullUser}" onclick="navigator.clipboard.writeText('${row.fullUser}').then(() => alert('복사됨!'))">${row.user}</td>
                <td class="p-2 border font-mono">${row.userNonce}</td>
                <td class="p-2 border">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    ${row.reasonCode}: ${row.reasonDesc}
                  </span>
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
