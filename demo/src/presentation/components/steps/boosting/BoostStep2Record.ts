/**
 * BOOST STEP 2: 부스팅 레코드 작성
 *
 * 사용자별로 부스팅 레코드를 생성하고 관리하는 컴포넌트
 * MainVoting과의 차이:
 * - 단일 레코드 배치 (UserBoostBatch의 record는 1개만)
 * - amt 필드 추가 (포인트 수량)
 * - boostingWith 필드 (0: BP, 1: CELB)
 */

import { BaseStep } from '../../BaseStep';
import type { AppState } from '../../../state/AppState';
import { BoostRecord, type BoostRecordData, type BoostingWith } from '../../../../domain/entities/BoostRecord';
import type { WalletAdapter } from '../../../../infrastructure/viem/WalletAdapter';
import * as UIHelper from '../../../utils/UIHelper';
import { createPublicClient, http } from 'viem';
import type { Address } from '../../../../domain/types';

/**
 * UI에서 사용할 레코드 데이터 (userIndex, userAddress 포함)
 */
interface UIBoostRecord {
  userIndex: number;
  userAddress: Address;
  timestamp: string;
  missionId: string;
  boostingId: string;
  optionId: string;
  boostingWith: BoostingWith;
  amt: string;
  userId: string;
}

/**
 * 설정 상수
 */
const CONFIG = {
  MAX_RECORDS_PER_BATCH: 20,
  DEFAULT_VALUES: {
    user1Id: '1',
    missionId: '1',
    optionId: '1',
    amt: '1000',
  },
};

export class BoostStep2Record extends BaseStep {
  private records: UIBoostRecord[] = [];
  private user1Nonce: string = '';
  private user2Nonce: string = '';
  private customNonce: string = '';
  private customWallet: WalletAdapter | null = null;

  constructor(state: AppState) {
    super(state);
  }

  render(): string {
    return `
      <div id="boostStep2" class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-blue-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge">BOOST STEP 2</span>
          <i data-lucide="zap" class="w-5 h-5 inline"></i> 부스팅 레코드 생성(Frontend)
        </h2>
        <p class="text-sm text-gray-600 mb-4">각 사용자가 부스팅할 데이터를 입력합니다</p>

        <!-- Boosting 특징 안내 -->
        <div class="mb-4 p-3 bg-purple-50 border-l-4 border-purple-400 rounded">
          <p class="text-sm text-purple-800">
            <strong><i data-lucide="lightbulb" class="w-4 h-4 inline"></i> Boosting 레코드 특징:</strong>
          </p>
          <ul class="text-xs text-purple-700 mt-1 ml-4 list-disc space-y-1">
            <li><strong>단일 레코드:</strong> 각 사용자당 1개의 레코드만 배치에 포함 (MainVoting과 차이)</li>
            <li><strong>amt 필드:</strong> 부스팅 포인트/토큰 수량 (0보다 커야 함)</li>
            <li><strong>boostingWith:</strong> 0=BP(Boosting Point), 1=CELB(Celebus Token)</li>
            <li><strong>User Nonce:</strong> 사용자 입력 또는 자동 생성 후 중복 확인 (재사용 방지)</li>
            <li><strong>Boosting ID:</strong> 타임스탬프 기반 자동 생성 (사용자별 유니크)</li>
          </ul>
        </div>

        <!-- Custom Private Key 섹션 -->
        <div id="boostCustomPrivateKeySection" class="hidden mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <label class="block text-sm font-medium text-purple-700 mb-1"><i data-lucide="key" class="w-4 h-4 inline"></i> Custom Private Key</label>
          <input type="text" id="boostCustomPrivateKey" class="w-full px-3 py-2 border border-purple-300 rounded-md font-mono text-sm bg-white" placeholder="0x...">
          <p class="text-xs text-purple-600 mt-1">Address: <span id="boostCustomUserAddress" class="font-mono text-xs break-all block">-</span></p>
        </div>

        <!-- userId는 숨김 처리 -->
        <input type="hidden" id="boostUserId" value="${CONFIG.DEFAULT_VALUES.user1Id}">

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"><i data-lucide="user" class="w-4 h-4 inline"></i> 사용자 선택</label>
            <select id="boostSelectedUser" class="w-full px-3 py-2 border rounded-md bg-yellow-50">
              <option value="0">User 1 (STEP 1)</option>
              <option value="1">User 2 (STEP 1)</option>
              <option value="custom">직접 입력 (Private Key)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"><i data-lucide="hash" class="w-4 h-4 inline"></i> User Nonce</label>
            <input type="text" id="boostUserNonce" class="w-full px-3 py-2 border rounded-md mb-1" placeholder="직접 입력 또는 자동 생성">
            <div class="flex gap-1">
              <button id="boostGenerateNonceBtn" class="flex-1 px-2 py-1 bg-purple-500 text-white rounded text-xs" title="타임스탬프 기반 유니크 Nonce 생성">
                🎲 생성
              </button>
              <button id="boostCheckNonceBtn" class="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-xs" title="해당 Nonce가 이미 사용되었는지 확인">
                🔍 중복확인
              </button>
            </div>
            <div id="boostNonceCheckResult" class="hidden mt-1"></div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
            <input type="text" id="boostRecordTimestamp" class="w-full px-3 py-2 border rounded-md font-mono text-sm mb-1" placeholder="직접 입력 또는 자동 생성">
            <button id="boostGenerateTimestampBtn" class="w-full px-2 py-1 bg-gray-500 text-white rounded text-xs" title="현재 시간 기준 타임스탬프 생성">
              ⏰ 현재 시간 생성
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mission ID</label>
            <input type="text" id="boostMissionId" class="w-full px-3 py-2 border rounded-md" value="${CONFIG.DEFAULT_VALUES.missionId}">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Boosting ID</label>
            <input type="text" id="boostBoostingId" class="w-full px-3 py-2 border rounded-md font-mono text-sm mb-1" placeholder="직접 입력 또는 자동 생성">
            <button id="boostGenerateBoostingIdBtn" class="w-full px-2 py-1 bg-purple-500 text-white rounded text-xs" title="타임스탬프 + 사용자 인덱스 기반 유니크 ID 생성">
              🎲 자동 생성
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Artist ID (optionId)</label>
            <input type="text" id="boostOptionId" class="w-full px-3 py-2 border rounded-md" value="${CONFIG.DEFAULT_VALUES.optionId}">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              <i data-lucide="zap" class="w-4 h-4 inline"></i> Boosting With
            </label>
            <select id="boostBoostingWith" class="w-full px-3 py-2 border rounded-md">
              <option value="0">BP (0)</option>
              <option value="1">CELB (1)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              <i data-lucide="coins" class="w-4 h-4 inline"></i> Amount
            </label>
            <input type="text" id="boostAmt" class="w-full px-3 py-2 border rounded-md" value="${CONFIG.DEFAULT_VALUES.amt}">
          </div>
        </div>

        <button id="boostAddRecordBtn" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
          + 레코드 추가
        </button>

        <div class="mt-4">
          <p class="text-sm font-medium text-gray-700 mb-2">
            작성된 레코드 (<span id="boostRecordCount">0</span>/${CONFIG.MAX_RECORDS_PER_BATCH})
            <span class="text-xs text-purple-600 ml-2">※ 각 사용자당 1개의 레코드만 추가 가능</span>
          </p>

          <div class="grid grid-cols-3 gap-4">
            <!-- User 1 레코드 -->
            <div class="bg-blue-50 rounded-lg border-2 border-blue-200 p-3">
              <p class="text-sm font-semibold text-blue-800 mb-2">
                <i data-lucide="user" class="w-4 h-4 inline"></i> User 1 레코드
              </p>
              <div id="boostUser1RecordsList" class="space-y-2 min-h-[80px]">
                <p class="text-blue-400 text-xs">User 1 레코드가 없습니다</p>
              </div>
            </div>

            <!-- User 2 레코드 -->
            <div class="bg-green-50 rounded-lg border-2 border-green-200 p-3">
              <p class="text-sm font-semibold text-green-800 mb-2">
                <i data-lucide="user" class="w-4 h-4 inline"></i> User 2 레코드
              </p>
              <div id="boostUser2RecordsList" class="space-y-2 min-h-[80px]">
                <p class="text-green-400 text-xs">User 2 레코드가 없습니다</p>
              </div>
            </div>

            <!-- Custom 사용자 레코드 -->
            <div class="bg-purple-50 rounded-lg border-2 border-purple-200 p-3">
              <p class="text-sm font-semibold text-purple-800 mb-2">
                <i data-lucide="key" class="w-4 h-4 inline"></i> Custom 레코드
              </p>
              <div id="boostCustomRecordsList" class="space-y-2 min-h-[80px]">
                <p class="text-purple-400 text-xs">Custom 레코드가 없습니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  init(): void {
    super.init();

    // 이벤트 리스너 등록
    UIHelper.safeAddEventListener('boostSelectedUser', 'change', () => this.onUserSelectionChange());
    UIHelper.safeAddEventListener('boostCustomPrivateKey', 'change', () => this.updateCustomAddress());
    UIHelper.safeAddEventListener('boostGenerateNonceBtn', 'click', () => this.generateUserNonce());
    UIHelper.safeAddEventListener('boostCheckNonceBtn', 'click', () => this.checkUserNonce());
    UIHelper.safeAddEventListener('boostGenerateTimestampBtn', 'click', () => this.generateTimestamp());
    UIHelper.safeAddEventListener('boostGenerateBoostingIdBtn', 'click', () => this.generateBoostingId());
    UIHelper.safeAddEventListener('boostAddRecordBtn', 'click', () => this.addRecord());
  }

  /**
   * 사용자 선택 변경 시 호출
   */
  private onUserSelectionChange(): void {
    const selectedValue = UIHelper.getInputValue('boostSelectedUser');
    const customSection = document.getElementById('boostCustomPrivateKeySection');

    if (selectedValue === 'custom') {
      customSection?.classList.remove('hidden');
    } else {
      customSection?.classList.add('hidden');
    }
  }

  /**
   * Custom Private Key 입력 시 주소 업데이트
   */
  private updateCustomAddress(): void {
    const privateKey = UIHelper.getInputValue('boostCustomPrivateKey').trim() as `0x${string}`;
    const addressSpan = document.getElementById('boostCustomUserAddress');

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

  /**
   * Timestamp 자동 생성 (현재 시간)
   */
  private generateTimestamp(): void {
    const timestamp = Date.now().toString();
    UIHelper.setInputValue('boostRecordTimestamp', timestamp);
  }

  /**
   * Boosting ID 자동 생성 (타임스탬프 + userIndex 기반)
   */
  private generateBoostingId(): void {
    const selectedUserValue = UIHelper.getInputValue('boostSelectedUser');
    const selectedUserIndex = selectedUserValue === 'custom' ? 99 : parseInt(selectedUserValue);

    const timestamp = Date.now().toString();
    const timestampPart = timestamp.slice(-8);
    const boostingId = timestampPart + selectedUserIndex;

    UIHelper.setInputValue('boostBoostingId', boostingId);
  }

  /**
   * User Nonce 자동 생성 (타임스탬프 기반)
   */
  private generateUserNonce(): void {
    const selectedUserValue = UIHelper.getInputValue('boostSelectedUser');
    const selectedUserIndex = selectedUserValue === 'custom' ? 99 : parseInt(selectedUserValue);

    const timestamp = Date.now().toString();
    const nonce = parseInt(timestamp.slice(-9)) * 10 + selectedUserIndex;

    UIHelper.setInputValue('boostUserNonce', nonce.toString());

    // 중복 확인 결과 초기화
    const resultDiv = document.getElementById('boostNonceCheckResult');
    resultDiv?.classList.add('hidden');
  }

  /**
   * 컨트랙트에서 User Nonce 중복 확인
   */
  private async checkUserNonce(): Promise<void> {
    const resultDiv = document.getElementById('boostNonceCheckResult');
    if (!resultDiv) return;

    try {
      const selectedUserValue = UIHelper.getInputValue('boostSelectedUser');
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
        if (selectedUserIndex === 99) {
          alert('Custom 지갑이 설정되지 않았습니다. Private Key를 입력해주세요!');
        } else {
          alert('먼저 Step 1에서 지갑을 초기화해주세요!');
        }
        return;
      }

      const nonceValue = UIHelper.getInputValue('boostUserNonce');
      if (!nonceValue || nonceValue === '') {
        alert('먼저 Nonce 값을 입력하거나 생성해주세요!');
        return;
      }

      if (!/^\d+$/.test(nonceValue)) {
        alert('유효하지 않은 Nonce 값입니다. 숫자만 입력해주세요.');
        return;
      }

      const nonceBigInt = BigInt(nonceValue);
      const contractAddress = currentState.contractAddress;

      if (!contractAddress) {
        alert('컨트랙트 주소가 설정되지 않았습니다!');
        return;
      }

      // viem PublicClient 생성
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
        address: contractAddress,
        abi: [
          {
            name: 'usedUserNonces',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'user', type: 'address' },
              { name: 'nonce', type: 'uint256' },
            ],
            outputs: [{ name: '', type: 'bool' }],
          },
        ],
        functionName: 'usedUserNonces',
        args: [wallet.address, nonceBigInt],
      });

      resultDiv.classList.remove('hidden');

      if (isUsed) {
        resultDiv.innerHTML = `
          <span class="text-red-600 text-xs font-semibold">
            ❌ 이미 사용된 Nonce입니다. 다른 값을 사용해주세요.
          </span>
        `;
      } else {
        resultDiv.innerHTML = `
          <span class="text-green-600 text-xs font-semibold">
            ✅ 사용 가능한 Nonce입니다.
          </span>
        `;

        // state에 저장
        if (selectedUserIndex === 0) {
          this.user1Nonce = nonceValue;
        } else if (selectedUserIndex === 1) {
          this.user2Nonce = nonceValue;
        } else {
          this.customNonce = nonceValue;
        }
      }
    } catch (error) {
      console.error('[ERROR] Failed to check user nonce:', error);
      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = `
        <span class="text-red-600 text-xs">
          ⚠️ 중복 확인 실패: ${error instanceof Error ? error.message : 'Unknown error'}
        </span>
      `;
    }
  }

  /**
   * 레코드 추가 (단일 레코드 배치)
   */
  private addRecord(): void {
    const selectedUserValue = UIHelper.getInputValue('boostSelectedUser');
    let wallet: WalletAdapter | null = null;
    let selectedUserIndex: number;

    if (selectedUserValue === 'custom') {
      const customPrivateKey = UIHelper.getInputValue('boostCustomPrivateKey').trim();
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

    // 단일 레코드 배치: 같은 사용자의 레코드가 이미 있으면 추가 불가
    const existing = this.records.find((r) => r.userIndex === selectedUserIndex);
    if (existing) {
      alert(
        `Boosting은 각 사용자당 1개의 레코드만 추가할 수 있습니다.\n` +
        `User ${selectedUserIndex === 0 ? '1' : selectedUserIndex === 1 ? '2' : 'Custom'}의 레코드가 이미 존재합니다.\n\n` +
        `기존 레코드를 삭제한 후 새로 추가해주세요.`
      );
      return;
    }

    // userNonce 검증
    const userNonceValue = UIHelper.getInputValue('boostUserNonce').trim();
    if (!userNonceValue || userNonceValue === '') {
      alert('User Nonce를 입력하거나 🎲 생성 버튼을 눌러주세요!');
      return;
    }

    if (!/^\d+$/.test(userNonceValue)) {
      alert('유효하지 않은 User Nonce입니다. 숫자만 입력해주세요.');
      return;
    }

    // state에 nonce 저장
    if (selectedUserIndex === 0) {
      this.user1Nonce = userNonceValue;
    } else if (selectedUserIndex === 1) {
      this.user2Nonce = userNonceValue;
    } else {
      this.customNonce = userNonceValue;
    }

    // boostingId 검증
    const boostingIdValue = UIHelper.getInputValue('boostBoostingId');
    if (!boostingIdValue || boostingIdValue === '') {
      alert('먼저 🎲 생성 버튼을 눌러 Boosting ID를 생성해주세요!');
      return;
    }

    const parsedBoostingId = boostingIdValue.trim();

    if (!/^\d+$/.test(parsedBoostingId)) {
      alert('유효하지 않은 Boosting ID입니다. 숫자만 입력해주세요.');
      return;
    }

    // timestamp 가져오기
    const timestampInput = UIHelper.getInputValue('boostRecordTimestamp').trim();
    const timestamp = timestampInput || Date.now().toString();

    const boostingWithValue = parseInt(UIHelper.getInputValue('boostBoostingWith'));
    const boostingWith: BoostingWith = (boostingWithValue === 0 || boostingWithValue === 1) ? boostingWithValue : 0;

    // amt 검증
    const amtValue = UIHelper.getInputValue('boostAmt').trim();
    if (!amtValue || amtValue === '' || amtValue === '0') {
      alert('Amount는 0보다 큰 값이어야 합니다!');
      return;
    }

    if (!/^\d+$/.test(amtValue)) {
      alert('유효하지 않은 Amount 값입니다. 숫자만 입력해주세요.');
      return;
    }

    const record: UIBoostRecord = {
      userIndex: selectedUserIndex,
      userAddress: wallet.address,
      timestamp: timestamp,
      missionId: UIHelper.getInputValue('boostMissionId'),
      boostingId: parsedBoostingId,
      optionId: UIHelper.getInputValue('boostOptionId'),
      boostingWith: boostingWith,
      amt: amtValue,
      userId: UIHelper.getInputValue('boostUserId'),
    };

    this.records.push(record);
    this.updateState();
    this.updateUI();
  }

  /**
   * 레코드 삭제
   */
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

  /**
   * AppState 업데이트
   */
  private updateState(): void {
    // UI 레코드를 BoostRecord 엔티티로 변환
    const boostRecords: BoostRecord[] = this.records.map((r, idx) => {
      const data: BoostRecordData = {
        recordId: BigInt(idx),
        timestamp: BigInt(r.timestamp),
        missionId: BigInt(r.missionId),
        boostingId: BigInt(r.boostingId),
        optionId: BigInt(r.optionId),
        boostingWith: r.boostingWith,
        amt: BigInt(r.amt),
        userId: r.userId,
      };
      return new BoostRecord(data);
    });

    // state에 boostRecords로 저장
    this.state.setState({ records: boostRecords as any });
  }

  /**
   * UI 업데이트
   */
  private updateUI(): void {
    // 전체 레코드 수 업데이트
    const recordCountEl = document.getElementById('boostRecordCount');
    if (recordCountEl) {
      recordCountEl.textContent = this.records.length.toString();
    }

    // User별 레코드 필터링 (각 사용자당 1개만 가능)
    const user1Record = this.records.find((r) => r.userIndex === 0);
    const user2Record = this.records.find((r) => r.userIndex === 1);
    const customRecord = this.records.find((r) => r.userIndex === 99);

    // User 1 레코드 표시
    this.renderUserRecord('boostUser1', user1Record, 'blue');

    // User 2 레코드 표시
    this.renderUserRecord('boostUser2', user2Record, 'green');

    // Custom 레코드 표시
    this.renderUserRecord('boostCustom', customRecord, 'purple');
  }

  /**
   * 사용자별 레코드 렌더링 (단일 레코드)
   */
  private renderUserRecord(
    userKey: 'boostUser1' | 'boostUser2' | 'boostCustom',
    record: UIBoostRecord | undefined,
    color: 'blue' | 'green' | 'purple'
  ): void {
    const listEl = document.getElementById(`${userKey}RecordsList`);

    if (!listEl) return;

    if (!record) {
      const emptyMessage =
        userKey === 'boostUser1'
          ? 'User 1 레코드가 없습니다'
          : userKey === 'boostUser2'
          ? 'User 2 레코드가 없습니다'
          : 'Custom 레코드가 없습니다';

      listEl.innerHTML = `<p class="text-${color}-400 text-xs">${emptyMessage}</p>`;
    } else {
      const globalIndex = this.records.findIndex((rec) => rec === record);
      const boostIcon = record.boostingWith === 0 ? 'zap' : 'coins';
      const boostLabel = record.boostingWith === 0 ? 'BP' : 'CELB';
      const displayInfo =
        userKey === 'boostCustom'
          ? `<p class="text-xs text-gray-500 mt-1">Addr: <span class="font-mono">${record.userAddress.slice(0, 8)}...</span></p>`
          : `<p class="text-xs text-gray-500 mt-1">User: <span class="font-mono">${record.userId}</span></p>`;

      listEl.innerHTML = `
        <div class="record-card border-${color}-300 relative group">
          <button onclick="window.boostStep2?.deleteRecord(${globalIndex})"
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="삭제">
            ×
          </button>
          <p class="text-xs font-mono text-${color}-700">
            M${record.missionId} B${record.boostingId} C${record.optionId}
          </p>
          <p class="text-xs font-semibold text-${color}-800 mt-1">
            <i data-lucide="${boostIcon}" class="w-3 h-3 inline"></i> ${boostLabel}: ${record.amt}
          </p>
          ${displayInfo}
        </div>
      `;

      // Lucide 아이콘 재렌더링
      if (typeof (window as any).lucide !== 'undefined') {
        (window as any).lucide.createIcons();
      }
    }
  }

  /**
   * 외부에서 접근 가능하도록 nonce 값들을 반환
   */
  getUserNonces(): { user1: string; user2: string; custom: string } {
    return {
      user1: this.user1Nonce,
      user2: this.user2Nonce,
      custom: this.customNonce,
    };
  }

  /**
   * Custom 지갑 반환
   */
  getCustomWallet(): WalletAdapter | null {
    return this.customWallet;
  }
}

// 전역에 노출 (HTML onclick에서 사용)
declare global {
  interface Window {
    boostStep2?: BoostStep2Record;
  }
}
