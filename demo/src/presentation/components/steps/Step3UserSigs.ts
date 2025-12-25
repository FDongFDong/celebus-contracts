/**
 * Step 3: User Batch Signatures 생성
 *
 * 각 사용자가 자신의 레코드 배치에 대해 EIP-712 서명을 생성하는 컴포넌트
 */

import { BaseStep } from '../BaseStep';
import type { AppState, UserBatchSignature } from '../../state/AppState';
import { DigestService } from '../../../domain/services/DigestService';
import type { WalletAdapter } from '../../../infrastructure/viem/WalletAdapter';
import { keccak256, concat, type TypedDataDomain } from 'viem';
import type { Address, Hash } from '../../../domain/types';
import type { Step2Records } from './Step2Records';

/**
 * 백엔드 전송 데이터 구조
 */
interface BackendSubmitData {
  records: Array<{
    timestamp: string;
    missionId: string;
    votingId: string;
    optionId: string;
    voteType: number;
    votingAmt: string;
  }>;
  userBatchSig: {
    user: Address;
    userNonce: string;
    signature: Hash;
  };
}

export class Step3UserSigs extends BaseStep {
  private userBatchSigs: UserBatchSignature[] = [];
  private step2?: Step2Records;

  constructor(state: AppState, step2?: Step2Records) {
    super(state);
    this.step2 = step2;
  }

  render(): string {
    return `
      <div id="step3" class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-purple-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-purple-500">STEP 3</span>
          <i data-lucide="pen-tool" class="w-5 h-5 inline"></i> User Batch Signatures 생성(Frontend)
        </h2>
        <p class="text-sm text-gray-600 mb-4">각 사용자가 자신의 레코드에 서명합니다</p>

        <div class="grid grid-cols-3 gap-4 mb-4">
          <!-- User 1 서명 -->
          <div class="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h3 class="text-lg font-semibold text-blue-800 mb-3"><i data-lucide="user" class="w-4 h-4 inline"></i> User 1 서명</h3>
            <div class="flex gap-2">
              <button id="signUser1Btn" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex-1">
                <i data-lucide="lock" class="w-4 h-4 inline"></i> User 1 서명 생성
              </button>
              <button id="user1ClearBtn" class="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 hidden">
                <i data-lucide="trash-2" class="w-4 h-4 inline"></i>
              </button>
            </div>
            <div id="user1SigResult" class="mt-3 hidden">
              <p class="text-xs text-gray-600">서명:</p>
              <p class="text-xs font-mono bg-white p-2 rounded mt-1 break-all" id="user1Signature">-</p>
            </div>
          </div>

          <!-- User 2 서명 -->
          <div class="bg-green-50 rounded-lg border border-green-200 p-4">
            <h3 class="text-lg font-semibold text-green-800 mb-3"><i data-lucide="user" class="w-4 h-4 inline"></i> User 2 서명</h3>
            <div class="flex gap-2">
              <button id="signUser2Btn" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex-1">
                <i data-lucide="lock" class="w-4 h-4 inline"></i> User 2 서명 생성
              </button>
              <button id="user2ClearBtn" class="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 hidden">
                <i data-lucide="trash-2" class="w-4 h-4 inline"></i>
              </button>
            </div>
            <div id="user2SigResult" class="mt-3 hidden">
              <p class="text-xs text-gray-600">서명:</p>
              <p class="text-xs font-mono bg-white p-2 rounded mt-1 break-all" id="user2Signature">-</p>
            </div>
          </div>

          <!-- Custom 사용자 서명 -->
          <div class="bg-purple-50 rounded-lg border border-purple-200 p-4">
            <h3 class="text-lg font-semibold text-purple-800 mb-3"><i data-lucide="key" class="w-4 h-4 inline"></i> Custom 서명</h3>
            <div class="flex gap-2">
              <button id="signCustomBtn" class="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 flex-1">
                <i data-lucide="lock" class="w-4 h-4 inline"></i> Custom 서명 생성
              </button>
              <button id="customClearBtn" class="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 hidden">
                <i data-lucide="trash-2" class="w-4 h-4 inline"></i>
              </button>
            </div>
            <div id="customSigResult" class="mt-3 hidden">
              <p class="text-xs text-gray-600">서명:</p>
              <p class="text-xs font-mono bg-white p-2 rounded mt-1 break-all" id="customSignature">-</p>
            </div>
          </div>
        </div>

        <div id="batchSigSummary" class="mt-4 hidden">
          <div class="bg-purple-50 border border-purple-200 rounded p-4">
            <p class="font-semibold text-purple-900 mb-2"><i data-lucide="clipboard" class="w-4 h-4 inline"></i> 서명 완료:</p>
            <p class="text-sm" id="sigSummaryText">-</p>
          </div>
        </div>

        <!-- 백엔드로 전달할 데이터 -->
        <div id="backendDataSection" class="mt-6 hidden">
          <div class="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-purple-400 rounded p-4">
            <h3 class="font-semibold text-gray-900 mb-2">
              <i data-lucide="upload" class="w-4 h-4 inline"></i> Frontend → Backend 전달 데이터
            </h3>
            <p class="text-sm text-gray-700 mb-4">
              <strong><i data-lucide="alert-triangle" class="w-4 h-4 inline"></i> 실제 프로덕션:</strong> 각 사용자는 <strong>자신의 기기</strong>에서 별도로 백엔드 API에 전송합니다
            </p>

            <div class="grid grid-cols-3 gap-4" id="backendDataGrid">
              <!-- User 1 전송 데이터 -->
              <div class="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <div class="flex items-center mb-3">
                  <i data-lucide="smartphone" class="w-8 h-8 mr-2 text-blue-600"></i>
                  <div>
                    <h4 class="font-bold text-blue-900">User 1의 기기</h4>
                    <p class="text-xs text-blue-700">iPhone, Seoul, 10:00:01</p>
                  </div>
                </div>
                <div class="mb-2">
                  <code class="text-xs text-blue-800 font-semibold">POST /api/vote/submit</code>
                </div>
                <div class="bg-white rounded border border-blue-200 p-3 max-h-96 overflow-y-auto">
                  <pre class="text-xs font-mono" id="user1BackendData">-</pre>
                </div>
              </div>

              <!-- User 2 전송 데이터 -->
              <div class="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div class="flex items-center mb-3">
                  <i data-lucide="monitor" class="w-8 h-8 mr-2 text-green-600"></i>
                  <div>
                    <h4 class="font-bold text-green-900">User 2의 기기</h4>
                    <p class="text-xs text-green-700">Desktop, Busan, 10:00:05</p>
                  </div>
                </div>
                <div class="mb-2">
                  <code class="text-xs text-green-800 font-semibold">POST /api/vote/submit</code>
                </div>
                <div class="bg-white rounded border border-green-200 p-3 max-h-96 overflow-y-auto">
                  <pre class="text-xs font-mono" id="user2BackendData">-</pre>
                </div>
              </div>

              <!-- Custom 사용자 전송 데이터 -->
              <div class="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                <div class="flex items-center mb-3">
                  <i data-lucide="key" class="w-8 h-8 mr-2 text-purple-600"></i>
                  <div>
                    <h4 class="font-bold text-purple-900">Custom 기기</h4>
                    <p class="text-xs text-purple-700">직접 입력한 Private Key</p>
                  </div>
                </div>
                <div class="mb-2">
                  <code class="text-xs text-purple-800 font-semibold">POST /api/vote/submit</code>
                </div>
                <div class="bg-white rounded border border-purple-200 p-3 max-h-96 overflow-y-auto">
                  <pre class="text-xs font-mono" id="customBackendData">-</pre>
                </div>
              </div>
            </div>

            <!-- 백엔드 배치 처리 설명 -->
            <div class="mt-4 bg-yellow-50 border border-yellow-300 rounded p-3">
              <p class="text-sm text-yellow-900">
                <strong><i data-lucide="lightbulb" class="w-4 h-4 inline"></i> 백엔드가 처리:</strong> 서버가 여러 사용자의 제출을 수집 → userId 자동 주입 → 배치로 결합 → Executor 서명 → 컨트랙트 제출
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  init(): void {
    super.init();

    // 이벤트 리스너 등록
    const signUser1Btn = document.getElementById('signUser1Btn');
    const signUser2Btn = document.getElementById('signUser2Btn');
    const signCustomBtn = document.getElementById('signCustomBtn');

    const user1ClearBtn = document.getElementById('user1ClearBtn');
    const user2ClearBtn = document.getElementById('user2ClearBtn');
    const customClearBtn = document.getElementById('customClearBtn');

    if (signUser1Btn) {
      signUser1Btn.addEventListener('click', () => this.signUserBatch(0));
    }
    if (signUser2Btn) {
      signUser2Btn.addEventListener('click', () => this.signUserBatch(1));
    }
    if (signCustomBtn) {
      signCustomBtn.addEventListener('click', () => this.signUserBatch(99));
    }

    if (user1ClearBtn) {
      user1ClearBtn.addEventListener('click', () => this.clearUserBatch(0));
    }
    if (user2ClearBtn) {
      user2ClearBtn.addEventListener('click', () => this.clearUserBatch(1));
    }
    if (customClearBtn) {
      customClearBtn.addEventListener('click', () => this.clearUserBatch(99));
    }
  }

  /**
   * User Batch 서명 생성
   */
  private async signUserBatch(userIndex: number): Promise<void> {
    try {
      const currentState = this.state.getState();
      const records = currentState.records;

      // 해당 사용자의 레코드만 필터링 (userIndex 비교 위해 임시로 userAddress 사용)
      const userWallets = currentState.userWallets;
      let wallet: WalletAdapter | null = null;
      let userAddress: Address | null = null;

      if (userIndex === 0) {
        wallet = userWallets[0] ?? null;
        userAddress = wallet?.address ?? null;
      } else if (userIndex === 1) {
        wallet = userWallets[1] ?? null;
        userAddress = wallet?.address ?? null;
      } else {
        wallet = this.step2?.getCustomWallet() ?? null;
        userAddress = wallet?.address ?? null;
      }

      const userName = userIndex === 0 ? 'User 1' : userIndex === 1 ? 'User 2' : 'Custom';

      if (!wallet || !userAddress) {
        if (userIndex === 99) {
          alert('Custom 지갑이 설정되지 않았습니다. Step 2에서 Private Key를 입력해주세요!');
        } else {
          alert('지갑이 초기화되지 않았습니다!');
        }
        return;
      }

      // userAddress와 매칭되는 레코드 찾기 (VoteRecord 엔티티에서 userId 필드 사용)
      const userRecords = records.filter(() => {
        // VoteRecord의 userId가 userAddress와 매칭되는지 확인
        // 실제로는 userId가 문자열이므로 임시로 address 비교 사용
        return true; // 모든 레코드를 포함 (실제로는 필터링 로직 필요)
      });

      if (userRecords.length === 0) {
        alert(`${userName}의 레코드가 없습니다. Step 2에서 레코드를 추가해주세요.`);
        return;
      }

      // User nonce 가져오기
      const nonces = this.step2?.getUserNonces();
      let userNonce: string;

      if (userIndex === 0) {
        userNonce = nonces?.user1 || '0';
      } else if (userIndex === 1) {
        userNonce = nonces?.user2 || '0';
      } else {
        userNonce = nonces?.custom || '0';
      }

      if (!userNonce || userNonce === '0') {
        alert(`${userName}의 User Nonce가 설정되지 않았습니다. Step 2에서 Nonce를 생성해주세요!`);
        return;
      }

      const contractAddress = currentState.contractAddress;
      if (!contractAddress) {
        alert('컨트랙트 주소가 설정되지 않았습니다!');
        return;
      }

      // EIP-712 Domain
      const domain: TypedDataDomain = {
        name: 'MainVoting',
        version: '1',
        chainId: 5611,
        verifyingContract: contractAddress,
      };

      // EIP-712 Types
      const types = {
        UserBatch: [
          { name: 'user', type: 'address' },
          { name: 'userNonce', type: 'uint256' },
          { name: 'recordsHash', type: 'bytes32' },
        ],
      };

      // 각 레코드 해시 계산 (DigestService 사용)
      const recordHashes: Hash[] = userRecords.map((r) => {
        const recordData = {
          timestamp: r.timestamp,
          missionId: r.missionId,
          votingId: r.votingId,
          optionId: r.optionId,
          voteType: r.voteType === 0 ? 0 : 1,
          votingAmt: r.votingAmt,
        };
        return DigestService.hashVoteRecord(recordData, userAddress);
      });

      // recordsHash 계산 (모든 recordHash를 concat하여 keccak256)
      const recordsHash = keccak256(concat(recordHashes));

      // EIP-712 서명 메시지
      const message = {
        user: userAddress,
        userNonce: BigInt(userNonce),
        recordsHash: recordsHash,
      };

      // 서명 생성
      const signature = await wallet.signTypedData({
        domain,
        types,
        primaryType: 'UserBatch',
        message,
      });

      // 서명 저장
      const userBatchSig: UserBatchSignature = {
        user: userAddress,
        signature: signature,
        nonce: BigInt(userNonce),
      };

      // 기존 서명이 있으면 교체
      const existingIndex = this.userBatchSigs.findIndex((sig) => sig.user === userAddress);
      if (existingIndex >= 0) {
        this.userBatchSigs[existingIndex] = userBatchSig;
      } else {
        this.userBatchSigs.push(userBatchSig);
      }

      // AppState 업데이트
      this.state.setState({ userBatchSigs: this.userBatchSigs });

      // UI 업데이트
      let sigId: string, resultId: string, clearBtnId: string;

      if (userIndex === 99) {
        sigId = 'customSignature';
        resultId = 'customSigResult';
        clearBtnId = 'customClearBtn';
      } else {
        sigId = `user${userIndex + 1}Signature`;
        resultId = `user${userIndex + 1}SigResult`;
        clearBtnId = `user${userIndex + 1}ClearBtn`;
      }

      const sigEl = document.getElementById(sigId);
      const resultEl = document.getElementById(resultId);
      const clearBtn = document.getElementById(clearBtnId);

      if (sigEl) sigEl.textContent = signature;
      if (resultEl) resultEl.classList.remove('hidden');
      if (clearBtn) clearBtn.classList.remove('hidden');

      this.updateSummary();
    } catch (error) {
      console.error('[ERROR] Signature creation failed:', error);
      alert(`서명 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 서명 요약 업데이트
   */
  private updateSummary(): void {
    if (this.userBatchSigs.length > 0) {
      const summaryText = document.getElementById('sigSummaryText');
      if (summaryText) {
        summaryText.textContent = `${this.userBatchSigs.length}명의 사용자 서명 완료`;
      }

      const summarySection = document.getElementById('batchSigSummary');
      if (summarySection) {
        summarySection.classList.remove('hidden');
      }

      // 각 사용자별로 백엔드 전송 데이터 생성
      const currentState = this.state.getState();
      const records = currentState.records;

      this.userBatchSigs.forEach((sig) => {
        // 해당 서명의 user 주소와 매칭되는 레코드 찾기
        const userRecords = records.filter(() => {
          // 임시로 모든 레코드 포함 (실제로는 address 매칭 필요)
          return true;
        });

        // userIndex 찾기 (임시로 userWallets 사용)
        const userWallets = currentState.userWallets;
        let userIndex = -1;

        if (userWallets[0]?.address === sig.user) {
          userIndex = 0;
        } else if (userWallets[1]?.address === sig.user) {
          userIndex = 1;
        } else {
          userIndex = 99;
        }

        // 백엔드 전송 데이터 구성
        const backendData: BackendSubmitData = {
          records: userRecords.map((r) => ({
            timestamp: r.timestamp.toString(),
            missionId: r.missionId.toString(),
            votingId: r.votingId.toString(),
            optionId: r.optionId.toString(),
            voteType: r.voteType,
            votingAmt: r.votingAmt.toString(),
          })),
          userBatchSig: {
            user: sig.user,
            userNonce: sig.nonce.toString(),
            signature: sig.signature,
          },
        };

        // 사용자별 데이터 표시
        let elementId: string;
        if (userIndex === 0) {
          elementId = 'user1BackendData';
        } else if (userIndex === 1) {
          elementId = 'user2BackendData';
        } else {
          elementId = 'customBackendData';
        }

        const element = document.getElementById(elementId);
        if (element) {
          element.textContent = JSON.stringify(backendData, null, 2);
        }
      });

      const backendDataSection = document.getElementById('backendDataSection');
      if (backendDataSection) {
        backendDataSection.classList.remove('hidden');
      }
    }
  }

  /**
   * 사용자 서명 삭제
   */
  private clearUserBatch(userIndex: number): void {
    const currentState = this.state.getState();
    const userWallets = currentState.userWallets;
    let wallet: WalletAdapter | null = null;

    if (userIndex === 0) {
      wallet = userWallets[0] ?? null;
    } else if (userIndex === 1) {
      wallet = userWallets[1] ?? null;
    } else {
      wallet = this.step2?.getCustomWallet() ?? null;
    }

    if (!wallet) return;

    // 해당 사용자의 서명 제거
    const sigIndex = this.userBatchSigs.findIndex((sig) => sig.user === wallet?.address);
    if (sigIndex >= 0) {
      this.userBatchSigs.splice(sigIndex, 1);
    }

    // AppState 업데이트
    this.state.setState({ userBatchSigs: this.userBatchSigs });

    // UI 초기화
    let sigId: string, resultId: string, clearBtnId: string, backendDataId: string;

    if (userIndex === 99) {
      sigId = 'customSignature';
      resultId = 'customSigResult';
      clearBtnId = 'customClearBtn';
      backendDataId = 'customBackendData';
    } else {
      sigId = `user${userIndex + 1}Signature`;
      resultId = `user${userIndex + 1}SigResult`;
      clearBtnId = `user${userIndex + 1}ClearBtn`;
      backendDataId = `user${userIndex + 1}BackendData`;
    }

    const sigEl = document.getElementById(sigId);
    const resultEl = document.getElementById(resultId);
    const clearBtn = document.getElementById(clearBtnId);
    const backendDataEl = document.getElementById(backendDataId);

    if (sigEl) sigEl.textContent = '-';
    if (resultEl) resultEl.classList.add('hidden');
    if (clearBtn) clearBtn.classList.add('hidden');
    if (backendDataEl) backendDataEl.textContent = '-';

    // 서명이 모두 없어지면 요약 및 백엔드 데이터 섹션 숨기기
    if (this.userBatchSigs.length === 0) {
      const summarySection = document.getElementById('batchSigSummary');
      const backendSection = document.getElementById('backendDataSection');

      if (summarySection) summarySection.classList.add('hidden');
      if (backendSection) backendSection.classList.add('hidden');
    } else {
      this.updateSummary();
    }
  }
}

// 전역에 노출 (HTML onclick에서 사용 - 필요시)
declare global {
  interface Window {
    step3?: Step3UserSigs;
  }
}
