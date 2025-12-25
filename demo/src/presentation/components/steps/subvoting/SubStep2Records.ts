/**
 * SUB STEP 2: SubVoting 투표 레코드 작성
 *
 * 사용자별로 SubVoting 레코드를 생성하고 관리하는 컴포넌트
 * - SubVoteRecord entity 사용
 * - questionId 필드 추가
 * - 다중 옵션 선택 지원
 */

import { BaseStep } from '../../BaseStep';
import type { AppState } from '../../../state/AppState';
import { SubVoteRecord, type SubVoteRecordData } from '../../../../domain/entities/SubVoteRecord';
import type { WalletAdapter } from '../../../../infrastructure/viem/WalletAdapter';
import * as UIHelper from '../../../utils/UIHelper';
import { renderIcons } from '../../shared/icons';
import { createPublicClient, http } from 'viem';

/**
 * UI용 SubVote Record 인터페이스
 */
interface UISubVoteRecord {
  userIndex: number;
  userAddress: string;
  timestamp: string;
  missionId: string;
  votingId: string;
  questionId: string;
  options: string[]; // 다중 옵션 선택
  userId: string;
  votingAmt: string;
}

const CONFIG = {
  MAX_RECORDS_PER_BATCH: 10,
  MAX_OPTIONS_PER_RECORD: 5,
} as const;

export class SubStep2Records extends BaseStep {
  private records: UISubVoteRecord[] = [];
  private user1Nonce: string = '';
  private user2Nonce: string = '';
  private customNonce: string = '';
  private customWallet: WalletAdapter | null = null;

  constructor(state: AppState) {
    super(state);
  }

  render(): string {
    return this.renderRecordForm();
  }

  init(): void {
    super.init();
    this.bindEvents();
    renderIcons();
  }

  private renderRecordForm(): string {
    return `
      <div id="substep2" class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-blue-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-blue-500">SUB STEP 2</span>
          SubVote Records 작성
        </h2>
        <p class="text-sm text-gray-600 mb-4">SubVoting 레코드를 생성하고 관리합니다</p>

        <!-- User Selection -->
        <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 class="text-md font-semibold text-blue-800 mb-3">사용자 선택</h3>
          <select id="subSelectedUser" class="w-full px-3 py-2 border rounded-md mb-2">
            <option value="0">User 1</option>
            <option value="1">User 2</option>
            <option value="custom">Custom User</option>
          </select>

          <!-- Custom Private Key Section -->
          <div id="subCustomPrivateKeySection" class="hidden mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-2">Custom Private Key</label>
            <input
              type="text"
              id="subCustomPrivateKey"
              class="w-full px-3 py-2 border rounded-md text-xs font-mono mb-2"
              placeholder="0x..."
            >
            <p class="text-xs text-gray-500">
              Address: <span id="subCustomUserAddress" class="font-mono text-xs">-</span>
            </p>
          </div>
        </div>

        <!-- User Nonce -->
        <div class="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 class="text-md font-semibold text-yellow-800 mb-3">User Nonce</h3>
          <div class="flex gap-2">
            <input
              type="text"
              id="subUserNonce"
              class="flex-1 px-3 py-2 border rounded-md font-mono text-sm"
              placeholder="User Nonce"
            >
            <button id="subGenerateNonceBtn" class="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">
              자동 생성
            </button>
            <button id="subCheckNonceBtn" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
              사용 여부 확인
            </button>
          </div>
          <div id="subNonceCheckResult" class="mt-3 hidden"></div>
        </div>

        <!-- Voting ID -->
        <div class="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 class="text-md font-semibold text-green-800 mb-3">Voting ID</h3>
          <div class="flex gap-2">
            <input
              type="text"
              id="subVotingId"
              class="flex-1 px-3 py-2 border rounded-md font-mono text-sm"
              placeholder="Voting ID"
            >
            <button id="subGenerateVotingIdBtn" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
              자동 생성
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            같은 유저의 레코드는 모두 동일한 Voting ID를 사용해야 합니다
          </p>
        </div>

        <!-- Record Fields -->
        <div class="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h3 class="text-md font-semibold text-purple-800 mb-3">레코드 정보</h3>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Mission ID</label>
              <input type="text" id="subMissionId" class="w-full px-3 py-2 border rounded-md" value="1">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Question ID</label>
              <input type="text" id="subQuestionId" class="w-full px-3 py-2 border rounded-md" value="1">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">User ID (off-chain)</label>
              <input type="text" id="subUserId" class="w-full px-3 py-2 border rounded-md" value="user123">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Voting Amount</label>
              <input type="text" id="subVotingAmt" class="w-full px-3 py-2 border rounded-md" value="100">
            </div>
          </div>

          <!-- Options (Multiple Selection) -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Options (다중 선택, 쉼표로 구분)
            </label>
            <input
              type="text"
              id="subOptions"
              class="w-full px-3 py-2 border rounded-md"
              placeholder="예: 1,2,3"
            >
            <p class="text-xs text-gray-500 mt-1">
              최대 ${CONFIG.MAX_OPTIONS_PER_RECORD}개까지 선택 가능합니다 (예: 1,2,3)
            </p>
          </div>

          <div class="flex gap-2">
            <input
              type="text"
              id="subRecordTimestamp"
              class="flex-1 px-3 py-2 border rounded-md font-mono text-sm"
              placeholder="Timestamp (자동 생성 권장)"
            >
            <button id="subGenerateTimestampBtn" class="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600">
              자동 생성
            </button>
          </div>
        </div>

        <!-- Add Record Button -->
        <div class="mb-6">
          <button id="subAddRecordBtn" class="w-full bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 font-semibold">
            레코드 추가 (${this.records.length}/${CONFIG.MAX_RECORDS_PER_BATCH})
          </button>
        </div>

        <!-- Records List -->
        <div id="subRecordsListContainer" class="hidden">
          <h3 class="text-md font-semibold text-gray-800 mb-3">생성된 레코드 목록</h3>
          <div id="subRecordsByUser" class="space-y-4"></div>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    UIHelper.safeAddEventListener('subSelectedUser', 'change', () => this.onUserSelectionChange());
    UIHelper.safeAddEventListener('subCustomPrivateKey', 'change', () => this.updateCustomAddress());
    UIHelper.safeAddEventListener('subGenerateNonceBtn', 'click', () => this.generateUserNonce());
    UIHelper.safeAddEventListener('subCheckNonceBtn', 'click', () => this.checkUserNonce());
    UIHelper.safeAddEventListener('subGenerateTimestampBtn', 'click', () => this.generateTimestamp());
    UIHelper.safeAddEventListener('subGenerateVotingIdBtn', 'click', () => this.generateVotingId());
    UIHelper.safeAddEventListener('subAddRecordBtn', 'click', () => this.addRecord());
  }

  private onUserSelectionChange(): void {
    const selectedValue = UIHelper.getInputValue('subSelectedUser');
    const customSection = document.getElementById('subCustomPrivateKeySection');

    if (selectedValue === 'custom') {
      customSection?.classList.remove('hidden');
    } else {
      customSection?.classList.add('hidden');
    }
  }

  private updateCustomAddress(): void {
    const privateKey = UIHelper.getInputValue('subCustomPrivateKey').trim() as `0x${string}`;
    const addressSpan = document.getElementById('subCustomUserAddress');

    if (!addressSpan) return;

    try {
      import('../../../../infrastructure/viem/WalletAdapter').then(({ WalletAdapter }) => {
        const wallet = new WalletAdapter(privateKey);
        addressSpan.textContent = wallet.address;
        this.customWallet = wallet;
      }).catch(() => {
        addressSpan.textContent = 'Invalid key';
      });
    } catch {
      addressSpan.textContent = 'Invalid key';
    }
  }

  private generateTimestamp(): void {
    const timestamp = Date.now().toString();
    UIHelper.setInputValue('subRecordTimestamp', timestamp);
  }

  private generateVotingId(): void {
    const selectedUserValue = UIHelper.getInputValue('subSelectedUser');
    const selectedUserIndex = selectedUserValue === 'custom' ? 99 : parseInt(selectedUserValue);

    const timestamp = Date.now().toString();
    const timestampPart = timestamp.slice(-8);
    const votingId = timestampPart + selectedUserIndex;

    UIHelper.setInputValue('subVotingId', votingId);
  }

  private generateUserNonce(): void {
    const selectedUserValue = UIHelper.getInputValue('subSelectedUser');
    const selectedUserIndex = selectedUserValue === 'custom' ? 99 : parseInt(selectedUserValue);

    const timestamp = Date.now().toString();
    const nonce = parseInt(timestamp.slice(-9)) * 10 + selectedUserIndex;

    UIHelper.setInputValue('subUserNonce', nonce.toString());

    const resultDiv = document.getElementById('subNonceCheckResult');
    resultDiv?.classList.add('hidden');
  }

  private async checkUserNonce(): Promise<void> {
    const resultDiv = document.getElementById('subNonceCheckResult');
    if (!resultDiv) return;

    try {
      const selectedUserValue = UIHelper.getInputValue('subSelectedUser');
      const selectedUserIndex = selectedUserValue === 'custom' ? 99 : parseInt(selectedUserValue);

      const currentState = this.state.getState();
      const userWallets = currentState.userWallets;
      let wallet: WalletAdapter | null = null;

      if (selectedUserIndex === 0) {
        wallet = userWallets[0] ?? null;
      } else if (selectedUserIndex === 1) {
        wallet = userWallets[1] ?? null;
      } else {
        wallet = this.customWallet;
      }

      if (!wallet) {
        const msg = selectedUserIndex === 99
          ? 'Custom 지갑이 설정되지 않았습니다. Private Key를 입력해주세요!'
          : '먼저 Step 1에서 지갑을 초기화해주세요!';
        alert(msg);
        return;
      }

      const nonceValue = UIHelper.getInputValue('subUserNonce');
      if (!nonceValue || nonceValue === '') {
        alert('먼저 Nonce 값을 입력하거나 생성해주세요!');
        return;
      }

      if (!/^\d+$/.test(nonceValue)) {
        alert('유효하지 않은 Nonce 값입니다. 숫자만 입력해주세요.');
        return;
      }

      const nonceBigInt = BigInt(nonceValue);
      const { subContractAddress } = currentState;

      if (!subContractAddress) {
        alert('SubVoting 컨트랙트 주소가 설정되지 않았습니다!');
        return;
      }

      const publicClient = createPublicClient({
        chain: {
          id: 5611,
          name: 'BNB Opbnb Testnet',
          nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
          rpcUrls: {
            default: { http: ['https://opbnb-testnet-rpc.bnbchain.org'] },
            public: { http: ['https://opbnb-testnet-rpc.bnbchain.org'] },
          },
        },
        transport: http(),
      });

      const isUsed = await publicClient.readContract({
        address: subContractAddress,
        abi: [{
          name: 'usedUserNonces',
          type: 'function',
          stateMutability: 'view',
          inputs: [
            { name: 'user', type: 'address' },
            { name: 'nonce', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        }],
        functionName: 'usedUserNonces',
        args: [wallet.address, nonceBigInt],
      });

      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = this.renderNonceCheckResult(isUsed as boolean);
      renderIcons();

      if (!isUsed) {
        if (selectedUserIndex === 0) this.user1Nonce = nonceValue;
        else if (selectedUserIndex === 1) this.user2Nonce = nonceValue;
        else this.customNonce = nonceValue;
      }
    } catch (error) {
      console.error('[ERROR] Failed to check user nonce:', error);
      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = this.renderNonceCheckError(
        error instanceof Error ? error.message : 'Unknown error'
      );
      renderIcons();
    }
  }

  private renderNonceCheckResult(isUsed: boolean): string {
    if (isUsed) {
      return `
        <div class="p-3 rounded-md border bg-red-50 border-red-200 text-red-600">
          ${UIHelper.getIcon('error', 'w-5 h-5 inline-block mr-2')}
          <span>이미 사용된 Nonce입니다. 다시 생성해주세요!</span>
        </div>
      `;
    } else {
      return `
        <div class="p-3 rounded-md border bg-green-50 border-green-200 text-green-600">
          ${UIHelper.getIcon('success', 'w-5 h-5 inline-block mr-2')}
          <span>사용 가능한 Nonce입니다!</span>
        </div>
      `;
    }
  }

  private renderNonceCheckError(message: string): string {
    return `
      <div class="p-3 rounded-md border bg-red-50 border-red-200 text-red-600">
        ${UIHelper.getIcon('error', 'w-5 h-5 inline-block mr-2')}
        <span>Nonce 확인 실패: ${UIHelper.escapeHtml(message)}</span>
      </div>
    `;
  }

  private addRecord(): void {
    if (this.records.length >= CONFIG.MAX_RECORDS_PER_BATCH) {
      alert(`최대 ${CONFIG.MAX_RECORDS_PER_BATCH}개까지만 추가할 수 있습니다.`);
      return;
    }

    const selectedUserValue = UIHelper.getInputValue('subSelectedUser');
    let wallet: WalletAdapter | null = null;
    let selectedUserIndex: number;

    if (selectedUserValue === 'custom') {
      const customPrivateKey = UIHelper.getInputValue('subCustomPrivateKey').trim();
      if (!customPrivateKey) {
        alert('Private Key를 입력해주세요!');
        return;
      }

      selectedUserIndex = 99;
      wallet = this.customWallet;

      if (!wallet) {
        alert('유효하지 않은 Private Key입니다.');
        return;
      }
    } else {
      selectedUserIndex = parseInt(selectedUserValue);
      const currentState = this.state.getState();
      const userWallets = currentState.userWallets;

      wallet = selectedUserIndex === 0 ? (userWallets[0] ?? null) : (userWallets[1] ?? null);

      if (!wallet) {
        alert('먼저 Step 1에서 지갑을 초기화해주세요!');
        return;
      }
    }

    const userNonceValue = UIHelper.getInputValue('subUserNonce').trim();
    if (!userNonceValue || !/^\d+$/.test(userNonceValue)) {
      alert('User Nonce를 입력하거나 생성 버튼을 눌러주세요!');
      return;
    }

    if (selectedUserIndex === 0) this.user1Nonce = userNonceValue;
    else if (selectedUserIndex === 1) this.user2Nonce = userNonceValue;
    else this.customNonce = userNonceValue;

    const votingIdValue = UIHelper.getInputValue('subVotingId');
    if (!votingIdValue || !/^\d+$/.test(votingIdValue.trim())) {
      alert('먼저 자동 생성 버튼을 눌러 Voting ID를 생성해주세요!');
      return;
    }

    const parsedVotingId = votingIdValue.trim();

    const existing = this.records.find((r) => r.userIndex === selectedUserIndex);
    if (existing && existing.votingId !== parsedVotingId) {
      alert(
        `같은 유저의 레코드는 모두 같은 votingId여야 합니다.\n` +
        `기존 votingId: ${existing.votingId}\n` +
        `입력 votingId: ${parsedVotingId}\n\n` +
        `기존 votingId로 자동 맞춥니다.`
      );
      UIHelper.setInputValue('subVotingId', existing.votingId);
    }

    // Parse options (다중 선택)
    const optionsInput = UIHelper.getInputValue('subOptions').trim();
    if (!optionsInput) {
      alert('최소 1개 이상의 옵션을 선택해주세요!');
      return;
    }

    const options = optionsInput.split(',').map(o => o.trim()).filter(o => o !== '');
    if (options.length === 0) {
      alert('유효한 옵션을 입력해주세요! (예: 1,2,3)');
      return;
    }

    if (options.length > CONFIG.MAX_OPTIONS_PER_RECORD) {
      alert(`최대 ${CONFIG.MAX_OPTIONS_PER_RECORD}개까지만 선택할 수 있습니다!`);
      return;
    }

    // Validate all options are numbers
    if (!options.every(o => /^\d+$/.test(o))) {
      alert('옵션은 숫자만 입력해주세요! (예: 1,2,3)');
      return;
    }

    const timestampInput = UIHelper.getInputValue('subRecordTimestamp').trim();
    const timestamp = timestampInput || Date.now().toString();

    const record: UISubVoteRecord = {
      userIndex: selectedUserIndex,
      userAddress: wallet.address,
      timestamp: timestamp,
      missionId: UIHelper.getInputValue('subMissionId'),
      votingId: existing ? existing.votingId : parsedVotingId,
      questionId: UIHelper.getInputValue('subQuestionId'),
      options: options,
      userId: UIHelper.getInputValue('subUserId'),
      votingAmt: UIHelper.getInputValue('subVotingAmt'),
    };

    this.records.push(record);
    this.updateState();
    this.updateUI();
  }

  deleteRecord(index: number): void {
    if (index < 0 || index >= this.records.length) {
      alert('잘못된 레코드 인덱스입니다.');
      return;
    }

    const record = this.records[index];
    const userName = record.userIndex === 0 ? 'User 1' : (record.userIndex === 1 ? 'User 2' : 'Custom');

    if (confirm(`${userName}의 레코드를 삭제하시겠습니까?`)) {
      this.records.splice(index, 1);
      this.updateState();
      this.updateUI();
    }
  }

  private updateState(): void {
    const subVoteRecords: SubVoteRecord[] = this.records.flatMap((r, idx) => {
      // 다중 옵션을 각각의 레코드로 변환
      return r.options.map((optionId, optionIdx) => {
        const data: SubVoteRecordData = {
          recordId: BigInt(idx * 100 + optionIdx), // 고유 recordId 생성
          timestamp: BigInt(r.timestamp),
          missionId: BigInt(r.missionId),
          votingId: BigInt(r.votingId),
          questionId: BigInt(r.questionId),
          optionId: BigInt(optionId),
          userId: r.userId,
          votingAmt: BigInt(r.votingAmt),
        };
        return new SubVoteRecord(data);
      });
    });

    this.state.setState({ subRecords: subVoteRecords });
  }

  private updateUI(): void {
    this.updateRecordListsUI();
  }

  private updateRecordListsUI(): void {
    const container = document.getElementById('subRecordsListContainer');
    const byUserDiv = document.getElementById('subRecordsByUser');

    if (!container || !byUserDiv) return;

    if (this.records.length === 0) {
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');

    const groupedByUser = this.records.reduce((acc, record) => {
      const key = record.userIndex;
      if (!acc[key]) acc[key] = [];
      acc[key].push(record);
      return acc;
    }, {} as Record<number, UISubVoteRecord[]>);

    const userLabels: Record<number, string> = {
      0: 'User 1',
      1: 'User 2',
      99: 'Custom',
    };

    byUserDiv.innerHTML = Object.entries(groupedByUser)
      .map(([userIndexStr, userRecords]) => {
        const userIndex = parseInt(userIndexStr);
        const userLabel = userLabels[userIndex] || `User ${userIndex}`;
        const firstRecord = userRecords[0];

        return `
          <div class="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h4 class="font-semibold text-blue-800 mb-2">
              ${userLabel} (${userRecords.length}개 레코드)
            </h4>
            <p class="text-xs text-gray-600 mb-2">
              Address: <span class="font-mono">${UIHelper.shortenAddress(firstRecord?.userAddress ?? '')}</span>
              | Voting ID: <span class="font-mono">${firstRecord?.votingId ?? ''}</span>
            </p>
            <div class="space-y-2">
              ${userRecords.map((record) => this.renderRecordItem(record, this.records.indexOf(record))).join('')}
            </div>
          </div>
        `;
      })
      .join('');

    renderIcons();
  }

  private renderRecordItem(record: UISubVoteRecord, globalIndex: number): string {
    return `
      <div class="bg-white border border-gray-200 rounded p-3 text-sm">
        <div class="flex justify-between items-start mb-2">
          <div class="flex-1">
            <p class="text-xs text-gray-600 mb-1">
              Mission: ${record.missionId} | Question: ${record.questionId}
            </p>
            <p class="text-xs text-gray-600">
              Options: <span class="font-mono font-semibold">[${record.options.join(', ')}]</span>
              | Amount: ${record.votingAmt}
            </p>
          </div>
          <button
            onclick="window.subStep2?.deleteRecord(${globalIndex})"
            class="text-red-500 hover:text-red-700 ml-2"
            title="삭제"
          >
            ${UIHelper.getIcon('error', 'w-4 h-4')}
          </button>
        </div>
        <p class="text-xs text-gray-500">
          Timestamp: ${record.timestamp} | User ID: ${record.userId}
        </p>
      </div>
    `;
  }

  getUserNonces(): { user1: string; user2: string; custom: string } {
    return {
      user1: this.user1Nonce,
      user2: this.user2Nonce,
      custom: this.customNonce,
    };
  }

  getCustomWallet(): WalletAdapter | null {
    return this.customWallet;
  }
}

declare global {
  interface Window {
    subStep2?: SubStep2Records;
  }
}
