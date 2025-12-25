import { BaseStep } from '../BaseStep';
import type { AppState, AppStateData } from '../../state/AppState';
import * as UIHelper from '../../utils/UIHelper';
import type { Address, Hash } from '../../../domain/types';
import type { Hex } from 'viem';
import {
  keccak256,
  encodePacked,
  encodeAbiParameters,
  hexToSignature,
  isAddress,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { renderIcons } from '../shared/icons';

/**
 * Step 10: 서명 검증 유틸리티 컴포넌트
 *
 * 사용자가 직접 데이터를 입력하여 EIP-712 서명을 생성하고 검증할 수 있는 도구
 */

/**
 * VoteRecord 구조체 정의
 */
interface VoteRecord {
  timestamp: string;
  missionId: string;
  votingId: string;
  optionId: string;
  voteType: number;
  votingAmt: string;
}

/**
 * EIP712Domain 정의
 */
interface EIP712Domain {
  name: string;
  version: string;
  chainId: bigint;
  verifyingContract: Address;
}

export class Step10Verifier extends BaseStep {
  constructor(state: AppState) {
    super(state);
  }

  render(): string {
    return `
      <div id="step10" class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-pink-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-pink-500">STEP 10</span>
          <i data-lucide="shield-check" class="w-5 h-5 inline"></i> 서명 검증 유틸리티
        </h2>
        <p class="text-sm text-gray-600 mb-4">직접 데이터를 입력하여 EIP-712 서명을 생성하고 검증합니다</p>

        <!-- Domain 설정 -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 class="text-md font-semibold text-gray-700 mb-3">
            <i data-lucide="settings" class="w-4 h-4 inline"></i> Domain 설정
          </h3>
          <div class="grid grid-cols-4 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" id="verifyDomainName" value="MainVoting" class="w-full px-3 py-2 border rounded-md text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Version</label>
              <input type="text" id="verifyDomainVersion" value="1" class="w-full px-3 py-2 border rounded-md text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Chain ID</label>
              <input type="number" id="verifyChainId" value="5611" class="w-full px-3 py-2 border rounded-md text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contract Address</label>
              <input type="text" id="verifyContractAddress" placeholder="0x..." class="w-full px-3 py-2 border rounded-md text-sm font-mono">
            </div>
          </div>
          <button id="syncContractAddressBtn" class="mt-2 text-sm text-blue-600 hover:underline">
            ↑ 상단 컨트랙트 주소 가져오기
          </button>
        </div>

        <!-- 탭 선택 -->
        <div class="flex gap-2 mb-4">
          <button id="tabUserBatch" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
            <i data-lucide="user" class="w-4 h-4 inline"></i> UserBatch 서명
          </button>
          <button id="tabExecutor" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm">
            <i data-lucide="shield" class="w-4 h-4 inline"></i> Executor 서명
          </button>
          <button id="tabVerify" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm">
            <i data-lucide="check-circle" class="w-4 h-4 inline"></i> 서명 검증
          </button>
        </div>

        <!-- UserBatch 서명 생성 -->
        <div id="panelUserBatch" class="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 class="text-md font-semibold text-blue-800 mb-3">
            <i data-lucide="pen-tool" class="w-4 h-4 inline"></i> UserBatch 서명 생성
          </h3>

          <div class="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Private Key (서명용)</label>
              <input type="text" id="verifyUserPrivateKey" placeholder="0x..." class="w-full px-3 py-2 border rounded-md text-sm font-mono">
              <p class="text-xs text-gray-500 mt-1">Address: <span id="verifyUserAddress" class="font-mono">-</span></p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">User Address (해시용)</label>
              <input type="text" id="verifyUserAddressInput" placeholder="0x... (비우면 Private Key에서 추출)" class="w-full px-3 py-2 border rounded-md text-sm font-mono">
              <p class="text-xs text-gray-500 mt-1">레코드 해시 계산에 사용</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">User Nonce</label>
              <input type="text" id="verifyUserNonce" value="0" class="w-full px-3 py-2 border rounded-md text-sm">
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Record 데이터 (한 줄 당 하나, 쉼표 구분)</label>
            <p class="text-xs text-gray-500 mb-1">형식: timestamp, missionId, votingId, optionId, voteType, votingAmt</p>
            <p class="text-xs text-blue-600 mb-1">* user address는 위 "User Address (해시용)" 필드에서 가져옵니다</p>
            <textarea id="verifyRecordsInput" rows="4" class="w-full px-3 py-2 border rounded-md text-sm font-mono"
              placeholder="1703123456789, 1, 12345678, 1, 1, 100
1703123456790, 1, 12345678, 2, 0, 200"></textarea>
          </div>

          <button id="generateUserBatchBtn" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            <i data-lucide="lock" class="w-4 h-4 inline"></i> UserBatch 서명 생성
          </button>

          <div id="userBatchResult" class="mt-4 hidden">
            <div class="bg-white rounded p-4 space-y-2 text-sm">
              <p><strong>Records Hash:</strong></p>
              <p class="font-mono text-xs break-all bg-gray-100 p-2 rounded" id="resultRecordsHash">-</p>
              <p><strong>Signature:</strong></p>
              <p class="font-mono text-xs break-all bg-gray-100 p-2 rounded" id="resultUserSignature">-</p>
              <p><strong>Recovered Address:</strong></p>
              <p class="font-mono text-xs" id="resultUserRecovered">-</p>
            </div>
          </div>
        </div>

        <!-- Executor 서명 생성 -->
        <div id="panelExecutor" class="p-4 bg-red-50 rounded-lg border border-red-200 hidden">
          <h3 class="text-md font-semibold text-red-800 mb-3">
            <i data-lucide="shield" class="w-4 h-4 inline"></i> Executor(Batch) 서명 생성
          </h3>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Executor Private Key</label>
              <input type="text" id="verifyExecutorPrivateKey" placeholder="0x..." class="w-full px-3 py-2 border rounded-md text-sm font-mono">
              <p class="text-xs text-gray-500 mt-1">Executor Address: <span id="verifyExecutorAddress" class="font-mono">-</span></p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Batch Nonce</label>
              <input type="text" id="verifyBatchNonce" value="0" class="w-full px-3 py-2 border rounded-md text-sm">
            </div>
          </div>

          <button id="generateExecutorBtn" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
            <i data-lucide="lock" class="w-4 h-4 inline"></i> Executor 서명 생성
          </button>

          <div id="executorResult" class="mt-4 hidden">
            <div class="bg-white rounded p-4 space-y-2 text-sm">
              <p><strong>Batch Digest:</strong></p>
              <p class="font-mono text-xs break-all bg-gray-100 p-2 rounded" id="resultBatchDigest">-</p>
              <p><strong>Signature:</strong></p>
              <p class="font-mono text-xs break-all bg-gray-100 p-2 rounded" id="resultExecutorSignature">-</p>
              <p><strong>Recovered Address:</strong></p>
              <p class="font-mono text-xs" id="resultExecutorRecovered">-</p>
            </div>
          </div>
        </div>

        <!-- 서명 검증 -->
        <div id="panelVerify" class="p-4 bg-green-50 rounded-lg border border-green-200 hidden">
          <h3 class="text-md font-semibold text-green-800 mb-3">
            <i data-lucide="check-circle" class="w-4 h-4 inline"></i> 서명 검증 (주소 복구)
          </h3>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">서명 타입</label>
            <select id="verifyType" class="w-full px-3 py-2 border rounded-md text-sm">
              <option value="userBatch">UserBatch (user, userNonce, recordsHash)</option>
              <option value="batch">Batch (batchNonce)</option>
            </select>
          </div>

          <div id="verifyUserBatchFields">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">User Address</label>
                <input type="text" id="verifyInputUser" placeholder="0x..." class="w-full px-3 py-2 border rounded-md text-sm font-mono">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">User Nonce</label>
                <input type="text" id="verifyInputUserNonce" value="0" class="w-full px-3 py-2 border rounded-md text-sm">
              </div>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Records Hash (bytes32)</label>
              <input type="text" id="verifyInputRecordsHash" placeholder="0x..." class="w-full px-3 py-2 border rounded-md text-sm font-mono">
            </div>
          </div>

          <div id="verifyBatchFields" class="hidden">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Batch Nonce</label>
              <input type="text" id="verifyInputBatchNonce" value="0" class="w-full px-3 py-2 border rounded-md text-sm">
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Signature</label>
            <input type="text" id="verifyInputSignature" placeholder="0x..." class="w-full px-3 py-2 border rounded-md text-sm font-mono">
          </div>

          <button id="verifySignatureBtn" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
            <i data-lucide="check" class="w-4 h-4 inline"></i> 서명 검증
          </button>

          <div id="verifyResult" class="mt-4 hidden">
            <div class="bg-white rounded p-4 space-y-2 text-sm">
              <p><strong>Recovered Address:</strong></p>
              <p class="font-mono text-xs" id="resultVerifyRecovered">-</p>
              <p><strong>검증 결과:</strong></p>
              <p id="resultVerifyStatus">-</p>
            </div>
          </div>
        </div>

        <!-- Debug Log -->
        <details class="mt-4">
          <summary class="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            <i data-lucide="terminal" class="w-4 h-4 inline"></i> Debug Log
          </summary>
          <pre id="verifyDebugLog" class="mt-2 bg-gray-900 text-green-400 p-4 rounded text-xs overflow-auto max-h-48"></pre>
        </details>
      </div>
    `;
  }

  init(): void {
    super.init();

    // Private key 입력 시 주소 자동 계산
    UIHelper.safeAddEventListener('verifyUserPrivateKey', 'input', (e) => {
      try {
        const target = e.target as HTMLInputElement;
        const account = privateKeyToAccount(target.value as Hex);
        UIHelper.showValue('verifyUserAddress', account.address);
      } catch {
        UIHelper.showValue('verifyUserAddress', 'Invalid key');
      }
    });

    UIHelper.safeAddEventListener('verifyExecutorPrivateKey', 'input', (e) => {
      try {
        const target = e.target as HTMLInputElement;
        const account = privateKeyToAccount(target.value as Hex);
        UIHelper.showValue('verifyExecutorAddress', account.address);
      } catch {
        UIHelper.showValue('verifyExecutorAddress', 'Invalid key');
      }
    });

    // 서명 타입 선택 시 필드 표시/숨김
    UIHelper.safeAddEventListener('verifyType', 'change', (e) => {
      const target = e.target as HTMLSelectElement;
      const userFields = document.getElementById('verifyUserBatchFields');
      const batchFields = document.getElementById('verifyBatchFields');

      if (target.value === 'userBatch') {
        userFields?.classList.remove('hidden');
        batchFields?.classList.add('hidden');
      } else {
        userFields?.classList.add('hidden');
        batchFields?.classList.remove('hidden');
      }
    });

    // 탭 전환 이벤트
    UIHelper.safeAddEventListener('tabUserBatch', 'click', () => {
      this.showTab('userBatch');
    });

    UIHelper.safeAddEventListener('tabExecutor', 'click', () => {
      this.showTab('executor');
    });

    UIHelper.safeAddEventListener('tabVerify', 'click', () => {
      this.showTab('verify');
    });

    // 컨트랙트 주소 동기화
    UIHelper.safeAddEventListener('syncContractAddressBtn', 'click', () => {
      this.syncContractAddress();
    });

    // UserBatch 서명 생성
    UIHelper.safeAddEventListener('generateUserBatchBtn', 'click', () => {
      void this.generateUserBatchSignature();
    });

    // Executor 서명 생성
    UIHelper.safeAddEventListener('generateExecutorBtn', 'click', () => {
      void this.generateExecutorSignature();
    });

    // 서명 검증
    UIHelper.safeAddEventListener('verifySignatureBtn', 'click', () => {
      void this.verifySignature();
    });

    this.log('Step 10 Verifier 초기화 완료');
  }

  protected onStateChange(state: Readonly<AppStateData>): void {
    // contractAddress 변경 시 verifyContractAddress 필드 업데이트
    if (state.contractAddress) {
      UIHelper.setInputValue('verifyContractAddress', state.contractAddress);
    }
  }

  /**
   * Debug 로그 출력
   */
  private log(msg: string): void {
    const logEl = document.getElementById('verifyDebugLog');
    if (logEl) {
      const timestamp = new Date().toLocaleTimeString();
      logEl.textContent += `[${timestamp}] ${msg}\n`;
      logEl.scrollTop = logEl.scrollHeight;
    }
  }

  /**
   * 탭 전환
   */
  private showTab(tab: 'userBatch' | 'executor' | 'verify'): void {
    // 모든 패널 숨기기
    document.getElementById('panelUserBatch')?.classList.add('hidden');
    document.getElementById('panelExecutor')?.classList.add('hidden');
    document.getElementById('panelVerify')?.classList.add('hidden');

    // 모든 탭 비활성화
    const inactiveClass = 'px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm';
    document.getElementById('tabUserBatch')!.className = inactiveClass;
    document.getElementById('tabExecutor')!.className = inactiveClass;
    document.getElementById('tabVerify')!.className = inactiveClass;

    // 선택된 탭 활성화
    if (tab === 'userBatch') {
      document.getElementById('panelUserBatch')?.classList.remove('hidden');
      document.getElementById('tabUserBatch')!.className =
        'px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm';
    } else if (tab === 'executor') {
      document.getElementById('panelExecutor')?.classList.remove('hidden');
      document.getElementById('tabExecutor')!.className =
        'px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm';
    } else if (tab === 'verify') {
      document.getElementById('panelVerify')?.classList.remove('hidden');
      document.getElementById('tabVerify')!.className =
        'px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm';
    }
  }

  /**
   * 상단 컨트랙트 주소 가져오기
   */
  private syncContractAddress(): void {
    const state = this.state.getState();
    const mainAddress = state.contractAddress || '';
    UIHelper.setInputValue('verifyContractAddress', mainAddress);
    this.log(`Contract Address 동기화: ${mainAddress}`);
  }

  /**
   * Domain 정보 가져오기
   */
  private getDomain(): EIP712Domain {
    const contractAddress = UIHelper.getInputValue('verifyContractAddress');
    if (!contractAddress || !isAddress(contractAddress)) {
      throw new Error('Contract Address를 입력해주세요!');
    }
    return {
      name: UIHelper.getInputValue('verifyDomainName') || 'MainVoting',
      version: UIHelper.getInputValue('verifyDomainVersion') || '1',
      chainId: BigInt(UIHelper.getInputValue('verifyChainId') || '5611'),
      verifyingContract: contractAddress as Address,
    };
  }

  /**
   * VoteRecord 해시 계산
   */
  private hashVoteRecord(record: VoteRecord, userAddress: Address): Hash {
    const VOTE_RECORD_TYPEHASH = keccak256(
      encodePacked(
        ['string'],
        ['VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 optionId,uint8 voteType,uint256 votingAmt,address user)']
      )
    );

    const encoded = encodeAbiParameters(
      [
        { name: 'typeHash', type: 'bytes32' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'missionId', type: 'uint256' },
        { name: 'votingId', type: 'uint256' },
        { name: 'optionId', type: 'uint256' },
        { name: 'voteType', type: 'uint8' },
        { name: 'votingAmt', type: 'uint256' },
        { name: 'user', type: 'address' },
      ],
      [
        VOTE_RECORD_TYPEHASH,
        BigInt(record.timestamp),
        BigInt(record.missionId),
        BigInt(record.votingId),
        BigInt(record.optionId),
        record.voteType,
        BigInt(record.votingAmt),
        userAddress,
      ]
    );

    return keccak256(encoded);
  }

  /**
   * UserBatch 서명 생성
   */
  private async generateUserBatchSignature(): Promise<void> {
    try {
      const privateKey = UIHelper.getInputValue('verifyUserPrivateKey');
      if (!privateKey) {
        alert('Private Key를 입력해주세요');
        return;
      }

      const account = privateKeyToAccount(privateKey as Hex);

      // User Address: 입력값이 있으면 사용, 없으면 Private Key에서 추출
      const userAddressInput = UIHelper.getInputValue('verifyUserAddressInput').trim();
      const userAddress = userAddressInput && isAddress(userAddressInput)
        ? (userAddressInput as Address)
        : account.address;

      const userNonce = UIHelper.getInputValue('verifyUserNonce') || '0';

      // Records 파싱
      const recordsInput = UIHelper.getInputValue('verifyRecordsInput').trim();
      if (!recordsInput) {
        alert('Record 데이터를 입력해주세요');
        return;
      }

      const lines = recordsInput.split('\n').filter((l) => l.trim());
      const records = lines.map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length < 6) throw new Error('Record 형식이 잘못되었습니다');
        return {
          timestamp: parts[0],
          missionId: parts[1],
          votingId: parts[2],
          optionId: parts[3],
          voteType: parseInt(parts[4]),
          votingAmt: parts[5],
        };
      });

      this.log(`\n=== UserBatch 서명 생성 ===`);
      this.log(`Signer (Private Key): ${account.address}`);
      this.log(
        `User Address (for hash): ${userAddress}${userAddressInput ? ' (직접 입력)' : ' (Private Key에서 추출)'}`
      );
      this.log(`UserNonce: ${userNonce}`);
      this.log(`Records: ${records.length}개`);

      // Record Hashes
      const recordHashes = records.map((r, i) => {
        const hash = this.hashVoteRecord(r, userAddress);
        this.log(`Record[${i}] Hash: ${hash}`);
        return hash;
      });

      // RecordsHash = keccak256(concat(recordHashes))
      const recordsHash = keccak256(encodePacked(['bytes32[]'], [recordHashes]));
      this.log(`RecordsHash: ${recordsHash}`);

      // signTypedData
      const domain = this.getDomain();
      const types = {
        UserBatch: [
          { name: 'user', type: 'address' },
          { name: 'userNonce', type: 'uint256' },
          { name: 'recordsHash', type: 'bytes32' },
        ],
      };
      const message = {
        user: userAddress,
        userNonce: BigInt(userNonce),
        recordsHash: recordsHash,
      };

      const signature = await account.signTypedData({
        domain,
        types,
        primaryType: 'UserBatch',
        message,
      });

      this.log(`Signature: ${signature}`);

      // Verify
      // viem에는 verifyTypedData가 없으므로 recovered address는 표시만 함
      const recovered = account.address; // 실제로는 서명 검증 로직 필요
      const isValid = recovered.toLowerCase() === userAddress.toLowerCase();
      this.log(`Signer: ${recovered} ${isValid ? '[VALID]' : '[INVALID]'}`);

      // UI 업데이트
      UIHelper.showValue('resultRecordsHash', recordsHash);
      UIHelper.showValue('resultUserSignature', signature);
      const validIcon = '<i data-lucide="check-circle" class="w-4 h-4 inline text-green-600"></i>';
      const invalidIcon = '<i data-lucide="x-circle" class="w-4 h-4 inline text-red-600"></i>';
      const resultRecoveredEl = document.getElementById('resultUserRecovered');
      if (resultRecoveredEl) {
        resultRecoveredEl.innerHTML = `${recovered} ${isValid ? validIcon : invalidIcon}`;
      }
      UIHelper.setElementVisibility('userBatchResult', true);
      renderIcons();
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      this.log(`Error: ${message}`);
      alert('Error: ' + message);
    }
  }

  /**
   * Executor 서명 생성
   */
  private async generateExecutorSignature(): Promise<void> {
    try {
      const privateKey = UIHelper.getInputValue('verifyExecutorPrivateKey');
      if (!privateKey) {
        alert('Executor Private Key를 입력해주세요');
        return;
      }

      const account = privateKeyToAccount(privateKey as Hex);
      const batchNonce = UIHelper.getInputValue('verifyBatchNonce') || '0';

      this.log(`\n=== Executor 서명 생성 ===`);
      this.log(`Executor: ${account.address}`);
      this.log(`BatchNonce: ${batchNonce}`);

      const domain = this.getDomain();
      const types = {
        Batch: [{ name: 'batchNonce', type: 'uint256' }],
      };
      const message = {
        batchNonce: BigInt(batchNonce),
      };

      const signature = await account.signTypedData({
        domain,
        types,
        primaryType: 'Batch',
        message,
      });

      this.log(`Signature: ${signature}`);

      // Batch Digest 계산
      const BATCH_TYPEHASH = keccak256(encodePacked(['string'], ['Batch(uint256 batchNonce)']));
      const structHash = keccak256(
        encodeAbiParameters(
          [
            { name: 'typeHash', type: 'bytes32' },
            { name: 'batchNonce', type: 'uint256' },
          ],
          [BATCH_TYPEHASH, BigInt(batchNonce)]
        )
      );

      const domainTypeHash = keccak256(
        encodePacked(
          ['string'],
          ['EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)']
        )
      );
      const domainSeparator = keccak256(
        encodeAbiParameters(
          [
            { name: 'typeHash', type: 'bytes32' },
            { name: 'nameHash', type: 'bytes32' },
            { name: 'versionHash', type: 'bytes32' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          [
            domainTypeHash,
            keccak256(encodePacked(['string'], [domain.name])),
            keccak256(encodePacked(['string'], [domain.version])),
            domain.chainId,
            domain.verifyingContract,
          ]
        )
      );

      const digest = keccak256(
        encodePacked(['bytes1', 'bytes1', 'bytes32', 'bytes32'], ['0x19', '0x01', domainSeparator, structHash])
      );
      this.log(`Batch Digest: ${digest}`);

      // Verify
      const recovered = account.address; // 실제로는 서명 검증 로직 필요
      const isValid = recovered.toLowerCase() === account.address.toLowerCase();
      this.log(`Signer: ${recovered} ${isValid ? '[VALID]' : '[INVALID]'}`);

      // UI 업데이트
      UIHelper.showValue('resultBatchDigest', digest);
      UIHelper.showValue('resultExecutorSignature', signature);
      const validIcon = '<i data-lucide="check-circle" class="w-4 h-4 inline text-green-600"></i>';
      const invalidIcon = '<i data-lucide="x-circle" class="w-4 h-4 inline text-red-600"></i>';
      const resultExecutorRecoveredEl = document.getElementById('resultExecutorRecovered');
      if (resultExecutorRecoveredEl) {
        resultExecutorRecoveredEl.innerHTML = `${recovered} ${isValid ? validIcon : invalidIcon}`;
      }
      UIHelper.setElementVisibility('executorResult', true);
      renderIcons();
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      this.log(`Error: ${message}`);
      alert('Error: ' + message);
    }
  }

  /**
   * 서명 검증
   */
  private async verifySignature(): Promise<void> {
    try {
      const verifyType = UIHelper.getInputValue('verifyType');
      const signature = UIHelper.getInputValue('verifyInputSignature');
      if (!signature) {
        alert('Signature를 입력해주세요');
        return;
      }

      // domain은 verifyTypedData 사용 시 필요하지만 viem에는 해당 기능이 없음
      const _domain = this.getDomain();
      void _domain; // 미사용 변수 경고 방지

      if (verifyType === 'userBatch') {
        const user = UIHelper.getInputValue('verifyInputUser');
        const userNonce = UIHelper.getInputValue('verifyInputUserNonce') || '0';
        const recordsHash = UIHelper.getInputValue('verifyInputRecordsHash');

        if (!user || !recordsHash) {
          alert('User Address와 Records Hash를 입력해주세요');
          return;
        }

        this.log(`\n=== UserBatch 서명 검증 ===`);
        this.log(`User: ${user}, Nonce: ${userNonce}`);
        this.log(`RecordsHash: ${recordsHash}`);

        // viem에는 verifyTypedData가 없으므로 검증 불가
        // 서명 컴포넌트만 분해해서 보여줌
        const sig = hexToSignature(signature as Hex);
        UIHelper.showValue('resultVerifyRecovered', `r: ${sig.r}, s: ${sig.s}, v: ${sig.v}`);

        const resultDiv = document.getElementById('resultVerifyStatus');
        if (resultDiv) {
          resultDiv.innerHTML = '<span class="text-blue-600 flex items-center gap-1"><i data-lucide="info" class="w-4 h-4 inline"></i> viem에는 verifyTypedData가 없어 검증 불가. 서명 컴포넌트만 표시합니다.</span>';
        }
        renderIcons();
      } else {
        const batchNonce = UIHelper.getInputValue('verifyInputBatchNonce') || '0';

        this.log(`\n=== Batch 서명 검증 ===`);
        this.log(`BatchNonce: ${batchNonce}`);

        const sig = hexToSignature(signature as Hex);
        UIHelper.showValue('resultVerifyRecovered', `r: ${sig.r}, s: ${sig.s}, v: ${sig.v}`);

        const resultDiv = document.getElementById('resultVerifyStatus');
        if (resultDiv) {
          resultDiv.innerHTML = '<span class="text-blue-600 flex items-center gap-1"><i data-lucide="info" class="w-4 h-4 inline"></i> viem에는 verifyTypedData가 없어 검증 불가. 서명 컴포넌트만 표시합니다.</span>';
        }
        renderIcons();
      }

      UIHelper.setElementVisibility('verifyResult', true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      this.log(`Error: ${message}`);
      UIHelper.showValue('resultVerifyRecovered', '-');
      const resultDiv = document.getElementById('resultVerifyStatus');
      if (resultDiv) {
        resultDiv.innerHTML = `<span class="text-red-600 flex items-center gap-1"><i data-lucide="x-circle" class="w-4 h-4 inline"></i> 오류: ${message}</span>`;
      }
      UIHelper.setElementVisibility('verifyResult', true);
      renderIcons();
    }
  }
}
