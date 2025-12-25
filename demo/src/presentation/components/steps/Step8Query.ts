/**
 * Step 8: 컨트랙트 조회
 * 모든 view 함수를 UI에서 호출 가능하게 함
 */

import { BaseStep } from '../BaseStep';
import type { AppState } from '../../state/AppState';
import { mainVotingAbi } from '../../../infrastructure/contracts/MainVotingContract';
import { icon, renderIcons } from '../shared/icons';
import type { PublicClient, Address, Hash } from 'viem';
import { isAddress, parseAbiItem } from 'viem';
import {
  showLoading,
  showError,
  showResult,
  renderVoteResultsTab,
  renderArtistTab,
  renderRecordTab,
  renderNonceTab,
  renderSettingsTab,
  renderFailedLogsTab,
  renderFailedLogsResult,
} from './Step8QueryHelpers';

type TabId = 'voteResults' | 'artist' | 'record' | 'nonce' | 'settings' | 'failedLogs';

/**
 * Step 8: 컨트랙트 조회 컴포넌트
 */
export class Step8Query extends BaseStep {
  constructor(state: AppState) {
    super(state);
  }

  render(): string {
    return `
      <div id="step8" class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-purple-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-purple-500">STEP 8</span>
          ${icon('search', 'md')} 컨트랙트 조회
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          컨트랙트의 다양한 데이터를 조회합니다
        </p>

        <!-- 탭 네비게이션 -->
        <div class="flex border-b border-gray-200 mb-4 overflow-x-auto">
          <button id="tab-voteResults"
                  class="tab-btn px-4 py-2 text-sm font-medium border-b-2 border-purple-500 text-purple-600">
            ${icon('bar-chart-2', 'sm')} 투표 결과
          </button>
          <button id="tab-artist"
                  class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            ${icon('palette', 'sm')} Artist
          </button>
          <button id="tab-record"
                  class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            ${icon('file-text', 'sm')} 레코드
          </button>
          <button id="tab-nonce"
                  class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            ${icon('hash', 'sm')} Nonce
          </button>
          <button id="tab-settings"
                  class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            ${icon('settings', 'sm')} 설정
          </button>
          <button id="tab-failedLogs"
                  class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            ${icon('x-circle', 'sm')} 실패 로그
          </button>
        </div>

        <!-- 탭 콘텐츠 -->
        <div id="tabContent">
          ${renderVoteResultsTab()}
        </div>
      </div>
    `;
  }

  init(): void {
    super.init();
    this.bindTabEvents();
    this.bindVoteResultsEvents();
    renderIcons();
  }

  private bindTabEvents(): void {
    const tabs: TabId[] = ['voteResults', 'artist', 'record', 'nonce', 'settings', 'failedLogs'];
    tabs.forEach((tabId) => {
      const button = document.getElementById(`tab-${tabId}`);
      if (button) {
        button.addEventListener('click', () => this.switchTab(tabId));
      }
    });
  }

  private switchTab(tabId: TabId): void {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.remove('border-b-2', 'border-purple-500', 'text-purple-600');
      btn.classList.add('text-gray-500');
    });

    const activeBtn = document.getElementById(`tab-${tabId}`);
    if (activeBtn) {
      activeBtn.classList.remove('text-gray-500');
      activeBtn.classList.add('border-b-2', 'border-purple-500', 'text-purple-600');
    }

    const tabContent = document.getElementById('tabContent');
    if (!tabContent) return;

    switch (tabId) {
      case 'voteResults':
        tabContent.innerHTML = renderVoteResultsTab();
        this.bindVoteResultsEvents();
        break;
      case 'artist':
        tabContent.innerHTML = renderArtistTab();
        this.bindArtistEvents();
        break;
      case 'record':
        tabContent.innerHTML = renderRecordTab();
        this.bindRecordEvents();
        break;
      case 'nonce':
        tabContent.innerHTML = renderNonceTab();
        this.bindNonceEvents();
        break;
      case 'settings':
        tabContent.innerHTML = renderSettingsTab();
        this.bindSettingsEvents();
        break;
      case 'failedLogs':
        tabContent.innerHTML = renderFailedLogsTab();
        this.bindFailedLogsEvents();
        break;
    }
    renderIcons();
  }

  // ==================== 이벤트 바인딩 ====================

  private bindVoteResultsEvents(): void {
    document.getElementById('queryVoteSummariesBtn')?.addEventListener('click', () => this.queryVoteSummaries());
    document.getElementById('queryArtistAggregatesBtn')?.addEventListener('click', () => this.queryArtistAggregates());
  }

  private bindArtistEvents(): void {
    document.getElementById('queryArtistStatsBtn')?.addEventListener('click', () => this.queryArtistStats());
    document.getElementById('queryArtistNameBtn')?.addEventListener('click', () => this.queryArtistName());
    document.getElementById('queryAllowedArtistBtn')?.addEventListener('click', () => this.queryAllowedArtist());
  }

  private bindRecordEvents(): void {
    document.getElementById('queryVoteRecordBtn')?.addEventListener('click', () => this.queryVoteRecord());
  }

  private bindNonceEvents(): void {
    document.getElementById('queryUserNonceBtn')?.addEventListener('click', () => this.queryUserNonce());
    document.getElementById('queryBatchNonceBtn')?.addEventListener('click', () => this.queryBatchNonce());
  }

  private bindSettingsEvents(): void {
    document.getElementById('queryVoteTypeNameBtn')?.addEventListener('click', () => this.queryVoteTypeName());
    document.getElementById('queryExecutorSignerBtn')?.addEventListener('click', () => this.queryExecutorSigner());
    document.getElementById('queryOwnerBtn')?.addEventListener('click', () => this.queryOwner());
    document.getElementById('queryDomainSeparatorBtn')?.addEventListener('click', () => this.queryDomainSeparator());
  }

  private bindFailedLogsEvents(): void {
    document.getElementById('queryFailedUsersBtn')?.addEventListener('click', () => this.queryFailedUsers());
  }

  // ==================== 유틸리티 ====================

  private getPublicClient(): PublicClient | null {
    const state = this.state.getState();
    if (!state.executorWallet) return null;
    return state.executorWallet.getPublicClient() as PublicClient;
  }

  private getContractAddress(): Address | null {
    return this.state.getState().contractAddress;
  }

  private getInputValue(id: string): string {
    return (document.getElementById(id) as HTMLInputElement)?.value ?? '';
  }

  // ==================== 투표 결과 조회 ====================

  private async queryVoteSummaries(): Promise<void> {
    const resultId = 'result_voteSummaries';
    try {
      showLoading(resultId);
      const publicClient = this.getPublicClient();
      const contractAddress = this.getContractAddress();
      if (!publicClient || !contractAddress) throw new Error('PublicClient 또는 컨트랙트 주소가 없습니다.');

      const missionId = BigInt(this.getInputValue('q_voteSummary_missionId'));
      const votingId = BigInt(this.getInputValue('q_voteSummary_votingId'));

      const result = await publicClient.readContract({
        address: contractAddress,
        abi: mainVotingAbi,
        functionName: 'getVoteSummariesByMissionVotingId',
        args: [missionId, votingId],
      });

      const summaries = result as any[];
      const data = summaries.map((s) => ({
        timestamp: new Date(Number(s.timestamp) * 1000).toLocaleString(),
        missionId: s.missionId.toString(),
        votingId: s.votingId.toString(),
        userId: s.userId,
        votingFor: s.votingFor,
        votedOn: s.votedOn,
        votingAmt: s.votingAmt.toString(),
      }));

      showResult(resultId, data, 'table');
    } catch (err) {
      console.error('queryVoteSummaries error:', err);
      showError(resultId, (err as Error).message);
    }
  }

  private async queryArtistAggregates(): Promise<void> {
    const resultId = 'result_artistAggregates';
    try {
      showLoading(resultId);
      const publicClient = this.getPublicClient();
      const contractAddress = this.getContractAddress();
      if (!publicClient || !contractAddress) throw new Error('PublicClient 또는 컨트랙트 주소가 없습니다.');

      const missionId = BigInt(this.getInputValue('q_artistAgg_missionId'));
      const optionId = BigInt(this.getInputValue('q_artistAgg_optionId'));

      const result = await publicClient.readContract({
        address: contractAddress,
        abi: mainVotingAbi,
        functionName: 'getArtistAggregates',
        args: [missionId, optionId],
      });

      const [remember, forget, total] = result as [bigint, bigint, bigint];
      showResult(resultId, { remember, forget, total }, 'stats');
    } catch (err) {
      console.error('queryArtistAggregates error:', err);
      showError(resultId, (err as Error).message);
    }
  }

  // ==================== Artist 조회 ====================

  private async queryArtistStats(): Promise<void> {
    const resultId = 'result_artistStats';
    try {
      showLoading(resultId);
      const publicClient = this.getPublicClient();
      const contractAddress = this.getContractAddress();
      if (!publicClient || !contractAddress) throw new Error('PublicClient 또는 컨트랙트 주소가 없습니다.');

      const missionId = BigInt(this.getInputValue('q_artistStats_missionId'));
      const optionId = BigInt(this.getInputValue('q_artistStats_optionId'));

      const result = await publicClient.readContract({
        address: contractAddress,
        abi: mainVotingAbi,
        functionName: 'artistStats',
        args: [missionId, optionId],
      });

      const [remember, forget, total] = result as [bigint, bigint, bigint];
      showResult(resultId, { remember, forget, total }, 'stats');
    } catch (err) {
      console.error('queryArtistStats error:', err);
      showError(resultId, (err as Error).message);
    }
  }

  private async queryArtistName(): Promise<void> {
    const resultId = 'result_artistName';
    try {
      showLoading(resultId);
      const publicClient = this.getPublicClient();
      const contractAddress = this.getContractAddress();
      if (!publicClient || !contractAddress) throw new Error('PublicClient 또는 컨트랙트 주소가 없습니다.');

      const missionId = BigInt(this.getInputValue('q_artistName_missionId'));
      const optionId = BigInt(this.getInputValue('q_artistName_optionId'));

      const result = await publicClient.readContract({
        address: contractAddress,
        abi: mainVotingAbi,
        functionName: 'artistName',
        args: [missionId, optionId],
      });

      showResult(resultId, { name: (result as string) || '(등록되지 않음)' });
    } catch (err) {
      console.error('queryArtistName error:', err);
      showError(resultId, (err as Error).message);
    }
  }

  private async queryAllowedArtist(): Promise<void> {
    const resultId = 'result_allowedArtist';
    try {
      showLoading(resultId);
      const publicClient = this.getPublicClient();
      const contractAddress = this.getContractAddress();
      if (!publicClient || !contractAddress) throw new Error('PublicClient 또는 컨트랙트 주소가 없습니다.');

      const missionId = BigInt(this.getInputValue('q_allowedArtist_missionId'));
      const optionId = BigInt(this.getInputValue('q_allowedArtist_optionId'));

      const result = await publicClient.readContract({
        address: contractAddress,
        abi: mainVotingAbi,
        functionName: 'allowedArtist',
        args: [missionId, optionId],
      });

      showResult(resultId, result as boolean, 'bool');
    } catch (err) {
      console.error('queryAllowedArtist error:', err);
      showError(resultId, (err as Error).message);
    }
  }

  // ==================== 레코드 조회 ====================

  private async queryVoteRecord(): Promise<void> {
    const resultId = 'result_voteRecord';
    try {
      showLoading(resultId);
      const publicClient = this.getPublicClient();
      const contractAddress = this.getContractAddress();
      if (!publicClient || !contractAddress) throw new Error('PublicClient 또는 컨트랙트 주소가 없습니다.');

      const digestInput = this.getInputValue('q_votes_digest');
      if (!digestInput || !digestInput.startsWith('0x') || digestInput.length !== 66) {
        throw new Error('올바른 bytes32 형식의 digest를 입력해주세요 (0x + 64 hex chars)');
      }

      const result = await publicClient.readContract({
        address: contractAddress,
        abi: mainVotingAbi,
        functionName: 'votes',
        args: [digestInput as Hash],
      });

      const record = result as any;
      if (record.timestamp.toString() === '0') {
        showError(resultId, '해당 digest의 레코드가 존재하지 않습니다.');
        return;
      }

      showResult(resultId, {
        timestamp: new Date(Number(record.timestamp) * 1000).toLocaleString(),
        missionId: record.missionId.toString(),
        votingId: record.votingId.toString(),
        optionId: record.optionId.toString(),
        voteType: record.voteType === 0 ? '0 (Forget)' : '1 (Remember)',
        userId: record.userId,
        votingAmt: record.votingAmt.toString(),
      });
    } catch (err) {
      console.error('queryVoteRecord error:', err);
      showError(resultId, (err as Error).message);
    }
  }

  // ==================== Nonce 조회 ====================

  private async queryUserNonce(): Promise<void> {
    const resultId = 'result_userNonce';
    try {
      showLoading(resultId);
      const publicClient = this.getPublicClient();
      const contractAddress = this.getContractAddress();
      if (!publicClient || !contractAddress) throw new Error('PublicClient 또는 컨트랙트 주소가 없습니다.');

      const userInput = this.getInputValue('q_userNonce_user');
      const nonceInput = this.getInputValue('q_userNonce_nonce');
      if (!isAddress(userInput)) throw new Error('올바른 주소를 입력해주세요');
      if (!nonceInput) throw new Error('Nonce 값을 입력해주세요');

      const nonce = parseInt(nonceInput);
      if (isNaN(nonce) || nonce < 0) throw new Error('0 이상의 정수를 입력해주세요');

      const result = await publicClient.readContract({
        address: contractAddress,
        abi: mainVotingAbi,
        functionName: 'usedUserNonces',
        args: [userInput as Address, BigInt(nonce)],
      });

      showResult(resultId, result as boolean, 'bool');
    } catch (err) {
      console.error('queryUserNonce error:', err);
      showError(resultId, (err as Error).message);
    }
  }

  private async queryBatchNonce(): Promise<void> {
    const resultId = 'result_batchNonce';
    try {
      showLoading(resultId);
      const publicClient = this.getPublicClient();
      const contractAddress = this.getContractAddress();
      if (!publicClient || !contractAddress) throw new Error('PublicClient 또는 컨트랙트 주소가 없습니다.');

      const executorInput = this.getInputValue('q_batchNonce_executor');
      const nonceInput = this.getInputValue('q_batchNonce_nonce');
      if (!isAddress(executorInput)) throw new Error('올바른 주소를 입력해주세요');
      if (!nonceInput) throw new Error('Nonce 값을 입력해주세요');

      const nonce = parseInt(nonceInput);
      if (isNaN(nonce) || nonce < 0) throw new Error('0 이상의 정수를 입력해주세요');

      const result = await publicClient.readContract({
        address: contractAddress,
        abi: mainVotingAbi,
        functionName: 'usedBatchNonces',
        args: [executorInput as Address, BigInt(nonce)],
      });

      showResult(resultId, result as boolean, 'bool');
    } catch (err) {
      console.error('queryBatchNonce error:', err);
      showError(resultId, (err as Error).message);
    }
  }

  // ==================== 설정 조회 ====================

  private async queryVoteTypeName(): Promise<void> {
    const resultId = 'result_voteTypeName';
    try {
      showLoading(resultId);
      const publicClient = this.getPublicClient();
      const contractAddress = this.getContractAddress();
      if (!publicClient || !contractAddress) throw new Error('PublicClient 또는 컨트랙트 주소가 없습니다.');

      const voteTypeInput = this.getInputValue('q_voteTypeName_type');
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: mainVotingAbi,
        functionName: 'voteTypeName',
        args: [Number(voteTypeInput)],
      });

      showResult(resultId, { voteType: voteTypeInput, name: (result as string) || '(설정되지 않음)' });
    } catch (err) {
      console.error('queryVoteTypeName error:', err);
      showError(resultId, (err as Error).message);
    }
  }

  private async queryExecutorSigner(): Promise<void> {
    const resultId = 'result_executorSigner';
    try {
      showLoading(resultId);
      const publicClient = this.getPublicClient();
      const contractAddress = this.getContractAddress();
      if (!publicClient || !contractAddress) throw new Error('PublicClient 또는 컨트랙트 주소가 없습니다.');

      const result = await publicClient.readContract({
        address: contractAddress,
        abi: mainVotingAbi,
        functionName: 'executorSigner',
      });

      showResult(resultId, result as Address, 'address');
    } catch (err) {
      console.error('queryExecutorSigner error:', err);
      showError(resultId, (err as Error).message);
    }
  }

  private async queryOwner(): Promise<void> {
    const resultId = 'result_owner';
    try {
      showLoading(resultId);
      const publicClient = this.getPublicClient();
      const contractAddress = this.getContractAddress();
      if (!publicClient || !contractAddress) throw new Error('PublicClient 또는 컨트랙트 주소가 없습니다.');

      const result = await publicClient.readContract({
        address: contractAddress,
        abi: mainVotingAbi,
        functionName: 'owner',
      });

      showResult(resultId, result as Address, 'address');
    } catch (err) {
      console.error('queryOwner error:', err);
      showError(resultId, (err as Error).message);
    }
  }

  private async queryDomainSeparator(): Promise<void> {
    const resultId = 'result_domainSeparator';
    try {
      showLoading(resultId);
      const publicClient = this.getPublicClient();
      const contractAddress = this.getContractAddress();
      if (!publicClient || !contractAddress) throw new Error('PublicClient 또는 컨트랙트 주소가 없습니다.');

      const result = await publicClient.readContract({
        address: contractAddress,
        abi: mainVotingAbi,
        functionName: 'domainSeparator',
      });

      showResult(resultId, result as Hash, 'bytes32');
    } catch (err) {
      console.error('queryDomainSeparator error:', err);
      showError(resultId, (err as Error).message);
    }
  }

  // ==================== 실패 로그 조회 ====================

  private async queryFailedUsers(): Promise<void> {
    const resultId = 'result_failedLogs';
    try {
      showLoading(resultId);
      const publicClient = this.getPublicClient();
      const contractAddress = this.getContractAddress();
      if (!publicClient || !contractAddress) throw new Error('PublicClient 또는 컨트랙트 주소가 없습니다.');

      const fromBlockInput = this.getInputValue('q_failedLogs_fromBlock');
      const toBlockInput = this.getInputValue('q_failedLogs_toBlock');

      const currentBlock = await publicClient.getBlockNumber();
      let fromBlock = fromBlockInput ? BigInt(fromBlockInput) : currentBlock - 1000n;
      const toBlock: bigint | 'latest' = toBlockInput ? BigInt(toBlockInput) : 'latest';

      if (fromBlock < 0n) fromBlock = 0n;

      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event UserBatchFailed(bytes32 indexed batchDigest, address indexed user, uint256 userNonce, uint8 reasonCode)'),
        fromBlock,
        toBlock,
      });

      const element = document.getElementById(resultId);
      if (element) {
        element.innerHTML = renderFailedLogsResult(
          logs as any[],
          fromBlock,
          toBlock,
          currentBlock
        );
        renderIcons();
      }
    } catch (err) {
      console.error('queryFailedUsers error:', err);
      showError(resultId, (err as Error).message);
    }
  }
}
