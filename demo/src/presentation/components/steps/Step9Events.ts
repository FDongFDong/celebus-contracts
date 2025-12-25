/**
 * Step 9: UserMissionResult 이벤트 조회 및 알림 처리
 *
 * 기능:
 * 1. 트랜잭션 해시로 이벤트 조회
 * 2. 블록 범위로 이벤트 조회
 * 3. 실패 알림 처리 (success=false인 경우)
 */

import { BaseStep } from '../BaseStep';
import type { AppState } from '../../state/AppState';
import * as UIHelper from '../../utils/UIHelper';
import type { PublicClient, Hash } from 'viem';
import { parseAbiItem, parseEventLogs } from 'viem';

/**
 * UserMissionResult 이벤트 타입
 */
interface UserMissionResultEvent {
  votingId: string;
  success: boolean;
  failedRecordIds: bigint[];
  reasonCode: number;
  blockNumber?: bigint;
  transactionHash?: string;
}

/**
 * 실패 알림 데이터
 */
interface AlertData {
  votingId: string;
  failedCount: number;
  reasonCode: number;
  reasonName: string;
  reasonMessage: string;
  blockNumber?: bigint;
  transactionHash?: string;
  timestamp: string;
}

/**
 * REASON_CODES 매핑
 */
const REASON_CODES: Record<number, { name: string; message: string }> = {
  0: { name: 'NONE', message: '오류 없음' },
  1: { name: 'EMPTY_OR_OVERFLOW', message: '레코드 수가 0개이거나 20개 초과' },
  2: { name: 'INVALID_SIGNATURE', message: '유저 서명이 유효하지 않음' },
  3: { name: 'NONCE_USED', message: 'Nonce 중복 사용 (이미 사용된 nonce)' },
  4: { name: 'INVALID_VOTE_TYPE', message: 'VoteType이 유효하지 않음 (0,1 외의 값)' },
  5: { name: 'ARTIST_NOT_ALLOWED', message: '허용되지 않은 아티스트에게 투표' },
  6: { name: 'STRING_TOO_LONG', message: '문자열 길이 초과 (userId > 100자)' },
};

/**
 * Step 9: UserMissionResult 이벤트 조회 컴포넌트
 */
export class Step9Events extends BaseStep {
  private alerts: AlertData[] = [];

  constructor(state: AppState) {
    super(state);
  }

  render(): string {
    return `
      <div id="step9" class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-blue-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-blue-500">STEP 9</span>
          <i data-lucide="activity" class="w-5 h-5 inline"></i> 이벤트 조회 및 알림
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          UserMissionResult 이벤트를 조회하고 실패 알림을 처리합니다
        </p>

        <!-- 트랜잭션 해시로 조회 -->
        <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 class="font-semibold text-blue-900 mb-3">
            <i data-lucide="hash" class="w-4 h-4 inline"></i> 트랜잭션 해시로 조회
          </h3>
          <div class="mb-3">
            <label class="block text-xs text-gray-600 mb-1">Transaction Hash</label>
            <input id="txHashInput" type="text" placeholder="0x..."
                   class="w-full p-2 border rounded text-sm font-mono">
          </div>
          <button id="queryByTxBtn"
                  class="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600">
            조회
          </button>
        </div>

        <!-- 블록 범위로 조회 -->
        <div class="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 class="font-semibold text-green-900 mb-3">
            <i data-lucide="layers" class="w-4 h-4 inline"></i> 블록 범위로 조회
          </h3>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-600 mb-1">From Block (빈칸: 최근 1000블록)</label>
              <input id="fromBlock" type="number" placeholder="예: 12345678"
                     class="w-full p-2 border rounded text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">To Block (빈칸: latest)</label>
              <input id="toBlock" type="number" placeholder="예: 12346678"
                     class="w-full p-2 border rounded text-sm">
            </div>
          </div>
          <div class="mb-3">
            <label class="block text-xs text-gray-600 mb-1">Voting ID 필터 (선택사항)</label>
            <input id="votingIdFilter" type="number" placeholder="특정 voting ID만 조회"
                   class="w-full p-2 border rounded text-sm">
          </div>
          <button id="queryByBlockBtn"
                  class="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600">
            조회
          </button>
        </div>

        <!-- 이벤트 결과 테이블 -->
        <div class="mb-6">
          <h3 class="font-semibold text-gray-900 mb-3">
            <i data-lucide="list" class="w-4 h-4 inline"></i> 조회 결과: <span id="eventSourceLabel">-</span>
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
              <thead class="bg-gray-100">
                <tr>
                  <th class="p-2 border text-left">#</th>
                  <th class="p-2 border text-left">Voting ID</th>
                  <th class="p-2 border text-left">결과</th>
                  <th class="p-2 border text-left">실패 레코드 수</th>
                  <th class="p-2 border text-left">실패 사유</th>
                  <th class="p-2 border text-left">상세</th>
                </tr>
              </thead>
              <tbody id="eventResultsBody">
                <tr><td colspan="6" class="p-4 text-center text-gray-500">조회된 이벤트가 없습니다</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 실패 알림 -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-red-900">
              <i data-lucide="bell" class="w-4 h-4 inline"></i> 실패 알림
            </h3>
            <button id="clearAlertsBtn"
                    class="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600">
              모두 삭제
            </button>
          </div>
          <div id="failureAlerts" class="space-y-2">
            <!-- 동적으로 알림 카드 추가 -->
          </div>
        </div>

        <!-- 로그 출력 -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-2">
            <i data-lucide="terminal" class="w-4 h-4 inline"></i> 로그
          </h3>
          <div id="step9Log" class="h-32 overflow-y-auto text-xs font-mono bg-white p-2 rounded border">
            <!-- 로그 메시지 -->
          </div>
        </div>

        <!-- 에러 메시지 -->
        <div id="step9Error" class="mt-4 hidden bg-red-50 border border-red-200 rounded p-3">
          <p class="text-red-800 text-sm"></p>
        </div>
      </div>
    `;
  }

  init(): void {
    super.init();
    this.bindEvents();
    this.log('Step 9 초기화 완료');
  }

  private bindEvents(): void {
    // 트랜잭션 해시로 조회
    const queryByTxBtn = document.getElementById('queryByTxBtn');
    if (queryByTxBtn) {
      queryByTxBtn.addEventListener('click', () => this.queryByTxHash());
    }

    // 블록 범위로 조회
    const queryByBlockBtn = document.getElementById('queryByBlockBtn');
    if (queryByBlockBtn) {
      queryByBlockBtn.addEventListener('click', () => this.queryByBlockRange());
    }

    // 알림 클리어
    const clearAlertsBtn = document.getElementById('clearAlertsBtn');
    if (clearAlertsBtn) {
      clearAlertsBtn.addEventListener('click', () => this.clearAlerts());
    }
  }

  /**
   * 트랜잭션 해시로 UserMissionResult 이벤트 조회
   */
  private async queryByTxHash(): Promise<void> {
    const txHashInput = document.getElementById('txHashInput') as HTMLInputElement | null;
    const txHash = txHashInput?.value?.trim();

    if (!txHash || !txHash.startsWith('0x')) {
      this.showError('유효한 트랜잭션 해시를 입력하세요 (0x...)');
      return;
    }

    try {
      this.log(`트랜잭션 이벤트 조회 중: ${txHash}`);

      const publicClient = this.getPublicClient();
      if (!publicClient) {
        throw new Error('PublicClient를 찾을 수 없습니다.');
      }

      const receipt = await publicClient.getTransactionReceipt({ hash: txHash as Hash });
      if (!receipt) {
        this.showError('트랜잭션을 찾을 수 없습니다');
        return;
      }

      const events = this.parseUserMissionResultEvents(receipt.logs);
      this.displayEvents(events, txHash);
      this.processFailureAlerts(events);

      this.log(`이벤트 ${events.length}건 조회 완료`);
    } catch (error) {
      this.showError(`조회 실패: ${(error as Error).message}`);
    }
  }

  /**
   * 블록 범위로 UserMissionResult 이벤트 조회
   */
  private async queryByBlockRange(): Promise<void> {
    const fromBlockInput = document.getElementById('fromBlock') as HTMLInputElement | null;
    const toBlockInput = document.getElementById('toBlock') as HTMLInputElement | null;

    let fromBlockValue = fromBlockInput?.value?.trim();
    let toBlockValue = toBlockInput?.value?.trim();

    try {
      this.log('블록 범위 이벤트 조회 시작...');

      const publicClient = this.getPublicClient();
      const contractAddress = this.getContractAddress();
      if (!publicClient || !contractAddress) {
        throw new Error('PublicClient 또는 컨트랙트 주소가 없습니다.');
      }

      // 현재 블록 가져오기
      const currentBlock = await publicClient.getBlockNumber();

      // 기본값 설정 (최근 1000 블록)
      const toBlock: bigint | 'latest' = toBlockValue ? BigInt(toBlockValue) : 'latest';
      let fromBlock: bigint = fromBlockValue ? BigInt(fromBlockValue) : currentBlock - 1000n;

      // 음수 방지
      if (fromBlock < 0n) fromBlock = 0n;

      this.log(`블록 범위: ${fromBlock} ~ ${toBlock === 'latest' ? currentBlock : toBlock}`);

      // UserMissionResult 이벤트 로그 조회
      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem(
          'event UserMissionResult(uint256 indexed votingId, bool success, uint256[] failedRecordIds, uint8 reasonCode)'
        ),
        fromBlock,
        toBlock,
      });

      const events = logs.map((log) => this.parseLog(log as any));

      this.displayEvents(events, `블록 ${fromBlock} ~ ${toBlock === 'latest' ? currentBlock : toBlock}`);
      this.processFailureAlerts(events);

      this.log(`이벤트 ${events.length}건 조회 완료`);
    } catch (error) {
      this.showError(`조회 실패: ${(error as Error).message}`);
    }
  }

  /**
   * 트랜잭션 receipt에서 UserMissionResult 이벤트 파싱
   */
  private parseUserMissionResultEvents(logs: any[]): UserMissionResultEvent[] {
    const events: UserMissionResultEvent[] = [];

    const eventAbi = parseAbiItem(
      'event UserMissionResult(uint256 indexed votingId, bool success, uint256[] failedRecordIds, uint8 reasonCode)'
    );

    for (const log of logs) {
      try {
        const parsed = parseEventLogs({
          abi: [eventAbi],
          logs: [log],
        });

        if (parsed.length > 0) {
          const args = parsed[0]?.args as any;
          events.push({
            votingId: args?.votingId?.toString() || '0',
            success: args?.success || false,
            failedRecordIds: args?.failedRecordIds || [],
            reasonCode: Number(args?.reasonCode || 0),
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
          });
        }
      } catch (e) {
        console.warn('이벤트 파싱 실패:', e);
      }
    }

    return events;
  }

  /**
   * 단일 로그 파싱
   */
  private parseLog(log: any): UserMissionResultEvent {
    const eventAbi = parseAbiItem(
      'event UserMissionResult(uint256 indexed votingId, bool success, uint256[] failedRecordIds, uint8 reasonCode)'
    );

    const parsed = parseEventLogs({
      abi: [eventAbi],
      logs: [log],
    });

    const args = parsed[0]?.args as any;

    return {
      votingId: args?.votingId?.toString() || '0',
      success: args?.success || false,
      failedRecordIds: args?.failedRecordIds || [],
      reasonCode: Number(args?.reasonCode || 0),
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
    };
  }

  /**
   * 이벤트 테이블 표시
   */
  private displayEvents(events: UserMissionResultEvent[], source: string): void {
    UIHelper.setText('eventSourceLabel', source);

    const tbody = document.getElementById('eventResultsBody');
    if (!tbody) return;

    if (events.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">조회된 이벤트가 없습니다</td></tr>';
      return;
    }

    tbody.innerHTML = events
      .map((event, index) => {
        const reasonInfo = REASON_CODES[event.reasonCode] || { name: 'UNKNOWN', message: '알 수 없는 오류' };
        const statusText = event.success ? '성공' : '실패';
        const failedCount = event.failedRecordIds?.length || 0;

        return `
        <tr class="${event.success ? 'bg-green-50' : 'bg-red-50'}">
          <td class="p-2 border">${index + 1}</td>
          <td class="p-2 border font-mono">${event.votingId}</td>
          <td class="p-2 border">
            <span class="px-2 py-1 rounded text-xs font-semibold ${
              event.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
            }">${statusText}</span>
          </td>
          <td class="p-2 border">${failedCount}</td>
          <td class="p-2 border">
            <span class="text-xs font-mono text-red-600">${event.reasonCode}</span>
            <span class="text-xs text-gray-600 ml-1">${reasonInfo.message}</span>
          </td>
          <td class="p-2 border">
            ${
              event.success
                ? '-'
                : `<button class="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600" data-index="${index}">상세</button>`
            }
          </td>
        </tr>
      `;
      })
      .join('');

    // 상세 버튼 이벤트 바인딩
    tbody.querySelectorAll('button[data-index]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).dataset.index || '0');
        this.showEventDetails(events[index]);
      });
    });
  }

  /**
   * 이벤트 상세 정보 표시
   */
  private showEventDetails(event: UserMissionResultEvent): void {
    const reasonInfo = REASON_CODES[event.reasonCode] || { name: 'UNKNOWN', message: '알 수 없는 오류' };

    let recordIdsHtml = '없음';
    if (event.failedRecordIds && event.failedRecordIds.length > 0) {
      recordIdsHtml = event.failedRecordIds.map((id, i) => `<li>${i + 1}. ${id.toString()}</li>`).join('');
      recordIdsHtml = `<ul class="list-disc list-inside">${recordIdsHtml}</ul>`;
    }

    const detailsHtml = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="eventModal">
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h3 class="text-xl font-bold mb-4">투표 결과 상세</h3>
          <table class="w-full text-sm mb-4">
            <tr class="border-b"><th class="text-left py-2 pr-4">Voting ID</th><td class="py-2">${event.votingId}</td></tr>
            <tr class="border-b"><th class="text-left py-2 pr-4">결과</th><td class="py-2"><span class="px-2 py-1 rounded bg-red-100 text-red-800 text-xs font-semibold">실패</span></td></tr>
            <tr class="border-b"><th class="text-left py-2 pr-4">실패 코드</th><td class="py-2">${event.reasonCode} (${reasonInfo.name})</td></tr>
            <tr class="border-b"><th class="text-left py-2 pr-4">실패 사유</th><td class="py-2">${reasonInfo.message}</td></tr>
            <tr class="border-b"><th class="text-left py-2 pr-4">블록 번호</th><td class="py-2">${event.blockNumber?.toString() || 'N/A'}</td></tr>
            <tr class="border-b"><th class="text-left py-2 pr-4">트랜잭션</th><td class="py-2 font-mono text-xs break-all">${event.transactionHash || 'N/A'}</td></tr>
            <tr class="border-b"><th class="text-left py-2 pr-4">실패 레코드 IDs</th><td class="py-2">${recordIdsHtml}</td></tr>
          </table>
          <button id="closeModalBtn" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">닫기</button>
        </div>
      </div>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = detailsHtml;
    document.body.appendChild(modalContainer.firstElementChild as HTMLElement);

    // 닫기 버튼 이벤트
    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
      document.getElementById('eventModal')?.remove();
    });

    // 모달 외부 클릭 시 닫기
    document.getElementById('eventModal')?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'eventModal') {
        (e.target as HTMLElement).remove();
      }
    });
  }

  /**
   * 실패 알림 처리
   */
  private processFailureAlerts(events: UserMissionResultEvent[]): void {
    const failures = events.filter((e) => !e.success);

    if (failures.length === 0) {
      this.log('모든 투표가 성공적으로 처리되었습니다');
      return;
    }

    failures.forEach((event) => {
      const reasonInfo = REASON_CODES[event.reasonCode] || { name: 'UNKNOWN', message: '알 수 없는 오류' };

      const alertData: AlertData = {
        votingId: event.votingId,
        failedCount: event.failedRecordIds?.length || 0,
        reasonCode: event.reasonCode,
        reasonName: reasonInfo.name,
        reasonMessage: reasonInfo.message,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: new Date().toISOString(),
      };

      this.sendAdminAlert(alertData);
    });
  }

  /**
   * 관리자 알림 발송 (시뮬레이션)
   */
  private sendAdminAlert(alertData: AlertData): void {
    // 중복 알림 방지: 같은 votingId + transactionHash 조합이 이미 있으면 스킵
    const isDuplicate = this.alerts.some(
      (a) => a.votingId === alertData.votingId && a.transactionHash === alertData.transactionHash
    );
    if (isDuplicate) {
      return;
    }

    // 알림 목록에 추가
    this.alerts.push(alertData);

    // UI에 알림 표시
    this.displayAlert(alertData);
  }

  /**
   * 알림 카드 UI 표시
   */
  private displayAlert(alertData: AlertData): void {
    const alertsContainer = document.getElementById('failureAlerts');
    if (!alertsContainer) return;

    const alertCard = document.createElement('div');
    alertCard.className = 'bg-red-50 border border-red-200 rounded p-4';
    alertCard.innerHTML = `
      <div class="flex items-start justify-between mb-2">
        <div class="flex items-center">
          <span class="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">!</span>
          <span class="font-semibold text-red-900">투표 실패 알림</span>
        </div>
        <span class="text-xs text-gray-500">${new Date(alertData.timestamp).toLocaleTimeString()}</span>
      </div>
      <div class="ml-8 space-y-1 text-sm">
        <div class="flex">
          <span class="text-gray-600 w-32">Voting ID:</span>
          <span class="font-mono text-gray-900">${alertData.votingId}</span>
        </div>
        <div class="flex">
          <span class="text-gray-600 w-32">실패 코드:</span>
          <span class="text-gray-900">${alertData.reasonCode} (${alertData.reasonName})</span>
        </div>
        <div class="flex">
          <span class="text-gray-600 w-32">실패 사유:</span>
          <span class="text-gray-900">${alertData.reasonMessage}</span>
        </div>
        <div class="flex">
          <span class="text-gray-600 w-32">실패 레코드 수:</span>
          <span class="text-gray-900">${alertData.failedCount}건</span>
        </div>
      </div>
      <button class="mt-3 ml-8 bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">확인</button>
    `;

    // 확인 버튼 이벤트
    alertCard.querySelector('button')?.addEventListener('click', () => {
      alertCard.remove();
    });

    alertsContainer.prepend(alertCard);
  }

  /**
   * 모든 알림 클리어
   */
  private clearAlerts(): void {
    const alertsContainer = document.getElementById('failureAlerts');
    if (alertsContainer) {
      alertsContainer.innerHTML = '';
    }
    this.alerts = [];
    this.log('알림이 모두 삭제되었습니다');
  }

  /**
   * 외부에서 이벤트 직접 추가 (Step 7 연동용)
   */
  addEventsFromReceipt(receipt: any, txHash: string): UserMissionResultEvent[] {
    const events = this.parseUserMissionResultEvents(receipt.logs);
    if (events.length > 0) {
      this.displayEvents(events, txHash);
      this.processFailureAlerts(events);
    }
    return events;
  }

  /**
   * 로그 출력
   */
  private log(message: string): void {
    const logOutput = document.getElementById('step9Log');
    if (logOutput) {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = document.createElement('div');
      logEntry.textContent = `[${timestamp}] ${message}`;
      logOutput.appendChild(logEntry);
      logOutput.scrollTop = logOutput.scrollHeight;
    }
  }

  /**
   * 에러 표시
   */
  private showError(message: string): void {
    this.log(`ERROR: ${message}`);

    const errorContainer = document.getElementById('step9Error');
    if (errorContainer) {
      const errorText = errorContainer.querySelector('p');
      if (errorText) {
        errorText.textContent = message;
      }
      errorContainer.classList.remove('hidden');
      setTimeout(() => {
        errorContainer.classList.add('hidden');
      }, 5000);
    }
  }

  private getPublicClient(): PublicClient | null {
    const state = this.state.getState();
    if (!state.executorWallet) return null;
    return state.executorWallet.getPublicClient() as PublicClient;
  }

  private getContractAddress() {
    return this.state.getState().contractAddress;
  }
}
