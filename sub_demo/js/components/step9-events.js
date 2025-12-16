/**
 * Step 9: UserMissionResult 이벤트 조회 및 알림 처리
 *
 * 기능:
 * 1. 트랜잭션 해시로 이벤트 조회
 * 2. 블록 범위로 이벤트 조회
 * 3. 실패 알림 처리 (success=false인 경우)
 */

import { CONFIG } from '../config.js?v=4';

export class Step9Events {
  constructor(state) {
    this.state = state;
    this.events = [];
    this.alerts = [];
  }

  init() {
    this.bindEvents();
    this.log('Step 9 초기화 완료');
  }

  bindEvents() {
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
  async queryByTxHash() {
    const txHashInput = document.getElementById('txHashInput');
    const txHash = txHashInput?.value?.trim();

    if (!txHash || !txHash.startsWith('0x')) {
      this.showError('유효한 트랜잭션 해시를 입력하세요 (0x...)');
      return;
    }

    try {
      this.log(`트랜잭션 이벤트 조회 중: ${txHash}`);

      const receipt = await this.state.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        this.showError('트랜잭션을 찾을 수 없습니다');
        return;
      }

      const events = this.parseUserMissionResultEvents(receipt.logs);
      this.displayEvents(events, txHash);
      this.processFailureAlerts(events);

      this.log(`이벤트 ${events.length}건 조회 완료`);
    } catch (error) {
      this.showError(`조회 실패: ${error.message}`);
    }
  }

  /**
   * 블록 범위로 UserMissionResult 이벤트 조회
   */
  async queryByBlockRange() {
    const fromBlockInput = document.getElementById('fromBlock');
    const toBlockInput = document.getElementById('toBlock');
    const votingIdFilter = document.getElementById('votingIdFilter')?.value?.trim();

    let fromBlock = fromBlockInput?.value?.trim();
    let toBlock = toBlockInput?.value?.trim();

    // 기본값 설정 (최근 1000 블록)
    if (!toBlock) {
      toBlock = 'latest';
    }
    if (!fromBlock) {
      const currentBlock = await this.state.provider.getBlockNumber();
      fromBlock = Math.max(0, currentBlock - 1000);
    }

    try {
      this.log(`블록 범위 이벤트 조회 중: ${fromBlock} ~ ${toBlock}`);

      const contractAddress = this.state.contractAddress || CONFIG.VOTING_ADDRESS;

      // UserMissionResult 이벤트 토픽
      const eventSignature = ethers.id("UserMissionResult(uint256,bool,uint256[],uint8)");

      const filter = {
        address: contractAddress,
        topics: [eventSignature],
        fromBlock: parseInt(fromBlock) || fromBlock,
        toBlock: toBlock === 'latest' ? toBlock : parseInt(toBlock)
      };

      // votingId 필터 적용
      if (votingIdFilter) {
        filter.topics.push(ethers.zeroPadValue(ethers.toBeHex(BigInt(votingIdFilter)), 32));
      }

      const logs = await this.state.provider.getLogs(filter);
      const events = logs.map(log => this.parseLog(log));

      this.displayEvents(events, `블록 ${fromBlock} ~ ${toBlock}`);
      this.processFailureAlerts(events);

      this.log(`이벤트 ${events.length}건 조회 완료`);
    } catch (error) {
      this.showError(`조회 실패: ${error.message}`);
    }
  }

  /**
   * 트랜잭션 receipt에서 UserMissionResult 이벤트 파싱
   */
  parseUserMissionResultEvents(logs) {
    const iface = new ethers.Interface([
      "event UserMissionResult(uint256 indexed votingId, bool success, uint256[] failedRecordIds, uint8 reasonCode)"
    ]);

    const events = [];
    const eventSignature = ethers.id("UserMissionResult(uint256,bool,uint256[],uint8)");

    for (const log of logs) {
      if (log.topics[0] === eventSignature) {
        try {
          const parsed = iface.parseLog(log);
          events.push({
            votingId: parsed.args.votingId.toString(),
            success: parsed.args.success,
            failedRecordIds: parsed.args.failedRecordIds,
            reasonCode: Number(parsed.args.reasonCode),
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash
          });
        } catch (e) {
          console.warn('이벤트 파싱 실패:', e);
        }
      }
    }

    return events;
  }

  /**
   * 단일 로그 파싱
   */
  parseLog(log) {
    const iface = new ethers.Interface([
      "event UserMissionResult(uint256 indexed votingId, bool success, uint256[] failedRecordIds, uint8 reasonCode)"
    ]);

    const parsed = iface.parseLog(log);
    return {
      votingId: parsed.args.votingId.toString(),
      success: parsed.args.success,
      failedRecordIds: parsed.args.failedRecordIds,
      reasonCode: Number(parsed.args.reasonCode),
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash
    };
  }

  /**
   * 이벤트 테이블 표시
   */
  displayEvents(events, source) {
    this.events = events;

    const tbody = document.getElementById('eventResultsBody');
    const sourceLabel = document.getElementById('eventSourceLabel');

    if (sourceLabel) {
      sourceLabel.textContent = source;
    }

    if (!tbody) return;

    if (events.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data">조회된 이벤트가 없습니다</td></tr>';
      return;
    }

    tbody.innerHTML = events.map((event, index) => {
      // ===== 여기를 추가해주세요 =====
      console.log(`[Debug] Event[${index}]:`, event);
      console.log(`[Debug] Raw failedRecordIds for Voting ID ${event.votingId}:`, event.failedRecordIds);
      // ============================
      
      const reasonInfo = CONFIG.REASON_CODES[event.reasonCode] || { name: 'UNKNOWN', message: '알 수 없는 오류' };
      const statusClass = event.success ? 'success' : 'failure';
      const statusText = event.success ? '성공' : '실패';
      const failedCount = event.failedRecordIds?.length || 0;

      return `
        <tr class="${statusClass}">
          <td>${index + 1}</td>
          <td>${event.votingId}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>${failedCount}</td>
          <td>
            <span class="reason-code">${event.reasonCode}</span>
            <span class="reason-message">${reasonInfo.message}</span>
          </td>
          <td>
            ${event.success ? '-' : `<button class="view-details-btn" data-index="${index}">상세</button>`}
          </td>
        </tr>
      `;
    }).join('');

    // 상세 버튼 이벤트 바인딩
    tbody.querySelectorAll('.view-details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.showEventDetails(events[index]);
      });
    });
  }

  /**
   * 이벤트 상세 정보 표시
   */
  showEventDetails(event) {
    const reasonInfo = CONFIG.REASON_CODES[event.reasonCode] || { name: 'UNKNOWN', message: '알 수 없는 오류' };

    let recordIdsHtml = '없음';
    if (event.failedRecordIds && event.failedRecordIds.length > 0) {
      recordIdsHtml = event.failedRecordIds.map((id, i) =>
        `<li>${i + 1}. ${id}</li>`
      ).join('');
      recordIdsHtml = `<ul class="record-ids-list">${recordIdsHtml}</ul>`;
    }

    const detailsHtml = `
      <div class="event-details-modal">
        <div class="modal-content">
          <h3>투표 결과 상세</h3>
          <table class="details-table">
            <tr><th>Voting ID</th><td>${event.votingId}</td></tr>
            <tr><th>결과</th><td><span class="status-badge failure">실패</span></td></tr>
            <tr><th>실패 코드</th><td>${event.reasonCode} (${reasonInfo.name})</td></tr>
            <tr><th>실패 사유</th><td>${reasonInfo.message}</td></tr>
            <tr><th>블록 번호</th><td>${event.blockNumber || 'N/A'}</td></tr>
            <tr><th>트랜잭션</th><td class="tx-hash">${event.transactionHash || 'N/A'}</td></tr>
            <tr><th>실패 레코드 IDs</th><td>${recordIdsHtml}</td></tr>
          </table>
          <button class="close-modal-btn">닫기</button>
        </div>
      </div>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = detailsHtml;
    document.body.appendChild(modalContainer.firstElementChild);

    // 닫기 버튼 이벤트
    document.querySelector('.close-modal-btn').addEventListener('click', () => {
      document.querySelector('.event-details-modal').remove();
    });

    // 모달 외부 클릭 시 닫기
    document.querySelector('.event-details-modal').addEventListener('click', (e) => {
      if (e.target.classList.contains('event-details-modal')) {
        e.target.remove();
      }
    });
  }

  /**
   * 실패 알림 처리
   */
  processFailureAlerts(events) {
    const failures = events.filter(e => !e.success);

    if (failures.length === 0) {
      this.log('모든 투표가 성공적으로 처리되었습니다');
      return;
    }

    failures.forEach(event => {
      const reasonInfo = CONFIG.REASON_CODES[event.reasonCode] || { name: 'UNKNOWN', message: '알 수 없는 오류' };

      const alertData = {
        votingId: event.votingId,
        failedCount: event.failedRecordIds?.length || 0,
        reasonCode: event.reasonCode,
        reasonName: reasonInfo.name,
        reasonMessage: reasonInfo.message,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: new Date().toISOString()
      };

      this.sendAdminAlert(alertData);
    });
  }

  /**
   * 관리자 알림 발송 (시뮬레이션)
   */
  sendAdminAlert(alertData) {
    // 중복 알림 방지: 같은 votingId + transactionHash 조합이 이미 있으면 스킵
    const isDuplicate = this.alerts.some(
      a => a.votingId === alertData.votingId && a.transactionHash === alertData.transactionHash
    );
    if (isDuplicate) {
      console.log(`[관리자 알림] 중복 알림 스킵: votingId=${alertData.votingId}`);
      return;
    }

    // 콘솔에 경고 출력
    console.warn(`[관리자 알림] 투표 실패 발생!`, alertData);

    // 알림 목록에 추가
    this.alerts.push(alertData);

    // UI에 알림 표시
    this.displayAlert(alertData);
  }

  /**
   * 알림 카드 UI 표시
   */
  displayAlert(alertData) {
    const alertsContainer = document.getElementById('failureAlerts');
    if (!alertsContainer) return;

    const alertCard = document.createElement('div');
    alertCard.className = 'alert-card';
    alertCard.innerHTML = `
      <div class="alert-header">
        <span class="alert-icon">!</span>
        <span class="alert-title">투표 실패 알림</span>
        <span class="alert-time">${new Date(alertData.timestamp).toLocaleTimeString()}</span>
      </div>
      <div class="alert-body">
        <div class="alert-row">
          <span class="alert-label">Voting ID:</span>
          <span class="alert-value">${alertData.votingId}</span>
        </div>
        <div class="alert-row">
          <span class="alert-label">실패 코드:</span>
          <span class="alert-value">${alertData.reasonCode} (${alertData.reasonName})</span>
        </div>
        <div class="alert-row">
          <span class="alert-label">실패 사유:</span>
          <span class="alert-value">${alertData.reasonMessage}</span>
        </div>
        <div class="alert-row">
          <span class="alert-label">실패 레코드 수:</span>
          <span class="alert-value">${alertData.failedCount}건</span>
        </div>
      </div>
      <button class="dismiss-alert-btn">확인</button>
    `;

    // 확인 버튼 이벤트
    alertCard.querySelector('.dismiss-alert-btn').addEventListener('click', () => {
      alertCard.remove();
    });

    alertsContainer.prepend(alertCard);
  }

  /**
   * 모든 알림 클리어
   */
  clearAlerts() {
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
  addEventsFromReceipt(receipt, txHash) {
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
  log(message) {
    const logOutput = document.getElementById('step9Log');
    if (logOutput) {
      const timestamp = new Date().toLocaleTimeString();
      logOutput.innerHTML += `<div>[${timestamp}] ${message}</div>`;
      logOutput.scrollTop = logOutput.scrollHeight;
    }
    console.log(`[Step9] ${message}`);
  }

  /**
   * 에러 표시
   */
  showError(message) {
    this.log(`ERROR: ${message}`);

    const errorContainer = document.getElementById('step9Error');
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
      setTimeout(() => {
        errorContainer.style.display = 'none';
      }, 5000);
    }
  }
}
