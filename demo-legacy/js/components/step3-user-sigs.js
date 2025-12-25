/**
 * Step 3: User Batch Signatures 생성
 */

import { CONFIG, getDomain } from '../config.js';
import { hashVoteRecord } from '../utils/eip712.js';

export class Step3UserSigs {
  constructor(state) {
    this.state = state;
    this.userBatchSigs = [];
  }

  render() {
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
              <button onclick="step3.signUserBatch(0)" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex-1">
                <i data-lucide="lock" class="w-4 h-4 inline"></i> User 1 서명 생성
              </button>
              <button onclick="step3.clearUserBatch(0)" id="user1ClearBtn" class="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 hidden">
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
              <button onclick="step3.signUserBatch(1)" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex-1">
                <i data-lucide="lock" class="w-4 h-4 inline"></i> User 2 서명 생성
              </button>
              <button onclick="step3.clearUserBatch(1)" id="user2ClearBtn" class="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 hidden">
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
              <button onclick="step3.signUserBatch(99)" class="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 flex-1">
                <i data-lucide="lock" class="w-4 h-4 inline"></i> Custom 서명 생성
              </button>
              <button onclick="step3.clearUserBatch(99)" id="customClearBtn" class="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 hidden">
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

        <!-- 백엔드로 전달할 데이터 (2개 열로 분리) -->
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

  async signUserBatch(userIndex) {
    try {
      // 해당 사용자의 레코드만 필터링
      const userRecords = this.state.records.filter(r => r.userIndex === userIndex);

      const userName = userIndex === 0 ? 'User 1' : (userIndex === 1 ? 'User 2' : 'Custom');
      if (userRecords.length === 0) {
        alert(`${userName}의 레코드가 없습니다. Step 2에서 레코드를 추가해주세요.`);
        return;
      }

      // 지갑 선택: User 1, User 2, 또는 Custom
      let wallet;
      if (userIndex === 0) {
        wallet = this.state.user1Wallet;
      } else if (userIndex === 1) {
        wallet = this.state.user2Wallet;
      } else {
        wallet = this.state.customWallet;
      }

      if (!wallet) {
        if (userIndex === 99) {
          alert('Custom 지갑이 설정되지 않았습니다. Step 2에서 Private Key를 입력해주세요!');
        } else {
          alert('지갑이 초기화되지 않았습니다!');
        }
        return;
      }

      // User nonce 가져오기 - STEP 2에서 설정한 값 사용
      let userNonce;
      if (userIndex === 0) {
        userNonce = this.state.user1Nonce || '0';
      } else if (userIndex === 1) {
        userNonce = this.state.user2Nonce || '0';
      } else {
        userNonce = this.state.customNonce || '0';
      }

      // EIP-712 서명 (컨트랙트 규격: UserBatch(address user,uint256 userNonce,bytes32 recordsHash))
      const domain = getDomain(this.state.contractAddress);
      const types = {
        UserBatch: [
          { name: 'user', type: 'address' },
          { name: 'userNonce', type: 'uint256' },
          { name: 'recordsHash', type: 'bytes32' }
        ]
      };

      // 각 레코드 해시 계산 시 user 주소 포함 (보안 강화)
      const recordHashes = userRecords.map(r => hashVoteRecord(r, wallet.address));
      const recordsHash = ethers.keccak256(ethers.concat(recordHashes));

      // 디버그: 서명에 사용되는 모든 값 출력
      console.log(`\n========== ${userName} 서명 디버그 ==========`);
      console.log('Contract Address:', this.state.contractAddress);
      console.log('Domain:', JSON.stringify(domain));
      console.log('User Address:', wallet.address);
      console.log('User Nonce:', userNonce);
      console.log('Records Count:', userRecords.length);
      userRecords.forEach((r, i) => {
        console.log(`Record[${i}]:`, JSON.stringify({
          timestamp: r.timestamp,
          missionId: r.missionId,
          votingId: r.votingId,
          optionId: r.optionId,
          voteType: r.voteType,
          votingAmt: r.votingAmt
        }));
        console.log(`RecordHash[${i}]:`, recordHashes[i]);
      });
      console.log('ethers.concat(recordHashes):', ethers.concat(recordHashes));
      console.log('recordsHash:', recordsHash);
      console.log('================================================\n');

      const value = {
        user: wallet.address,
        userNonce: BigInt(userNonce),  // BigInt로 변환하여 큰 숫자 지원
        recordsHash
      };

      const signature = await wallet.signTypedData(domain, types, value);

      // 서명 저장
      const userBatchSig = {
        user: wallet.address,
        userNonce,
        signature
      };

      // 기존 서명이 있으면 교체
      const existingIndex = this.userBatchSigs.findIndex(sig => sig.user === wallet.address);
      if (existingIndex >= 0) {
        this.userBatchSigs[existingIndex] = userBatchSig;
      } else {
        this.userBatchSigs.push(userBatchSig);
      }

      this.state.userBatchSigs = this.userBatchSigs;

      // UI 업데이트 - Custom 사용자는 별도 ID 사용
      let sigId, resultId, clearBtnId;
      if (userIndex === 99) {
        sigId = 'customSignature';
        resultId = 'customSigResult';
        clearBtnId = 'customClearBtn';
      } else {
        sigId = `user${userIndex + 1}Signature`;
        resultId = `user${userIndex + 1}SigResult`;
        clearBtnId = `user${userIndex + 1}ClearBtn`;
      }
      document.getElementById(sigId).textContent = signature;
      document.getElementById(resultId).classList.remove('hidden');
      document.getElementById(clearBtnId).classList.remove('hidden');

      this.updateSummary();

      console.log(`[SUCCESS] ${userName} batch signature created:`, {
        user: wallet.address,
        recordCount: userRecords.length,
        signature
      });

    } catch (error) {
      console.error('[ERROR] Signature creation failed:', error);
      alert('서명 생성 실패: ' + error.message);
    }
  }

  updateSummary() {
    if (this.userBatchSigs.length > 0) {
      document.getElementById('sigSummaryText').textContent =
        `${this.userBatchSigs.length}명의 사용자 서명 완료`;
      document.getElementById('batchSigSummary').classList.remove('hidden');

      // 각 사용자별로 백엔드 전송 데이터 생성
      this.userBatchSigs.forEach((sig) => {
        // 해당 서명의 user 주소와 매칭되는 레코드 찾기
        const userRecords = this.state.records.filter(r =>
          r.userAddress && r.userAddress.toLowerCase() === sig.user.toLowerCase()
        );

        // userIndex 찾기 (레코드에서)
        const userIndex = userRecords.length > 0 ? userRecords[0].userIndex : -1;

        // 컨트랙트 규격: UserVoteBatch { records, userBatchSig }
        // user 주소는 userBatchSig.user에만 포함 (중복 제거)
        const userBackendData = {
          records: userRecords.map(r => ({
            timestamp: r.timestamp,
            missionId: r.missionId,
            votingId: r.votingId,
            optionId: r.optionId,
            voteType: r.voteType,
            votingAmt: r.votingAmt
            // 주의: userId는 프론트엔드에서 전송하지 않음!
            // 백엔드가 userBatchSig.user 주소로 DB 조회하여 자동 주입
          })),
          userBatchSig: {
            user: sig.user,
            userNonce: sig.userNonce,
            signature: sig.signature
          }
        };

        // User 1, User 2, 또는 Custom 데이터 표시
        let elementId;
        if (userIndex === 0) {
          elementId = 'user1BackendData';
        } else if (userIndex === 1) {
          elementId = 'user2BackendData';
        } else {
          elementId = 'customBackendData';
        }

        const element = document.getElementById(elementId);
        if (element) {
          element.textContent = JSON.stringify(userBackendData, null, 2);
        }
      });

      document.getElementById('backendDataSection').classList.remove('hidden');
    }
  }

  calculateRecordCounts() {
    // 각 사용자별 레코드 개수 계산
    const counts = [];
    this.userBatchSigs.forEach((sig, index) => {
      const userRecords = this.state.records.filter(r => r.userIndex === index);
      counts.push(userRecords.length);
    });
    return counts;
  }

  clearUserBatch(userIndex) {
    // 지갑 선택: User 1, User 2, 또는 Custom
    let wallet;
    if (userIndex === 0) {
      wallet = this.state.user1Wallet;
    } else if (userIndex === 1) {
      wallet = this.state.user2Wallet;
    } else {
      wallet = this.state.customWallet;
    }
    if (!wallet) return;

    // 해당 사용자의 서명 제거
    const sigIndex = this.userBatchSigs.findIndex(sig => sig.user === wallet.address);
    if (sigIndex >= 0) {
      this.userBatchSigs.splice(sigIndex, 1);
    }

    this.state.userBatchSigs = this.userBatchSigs;

    // UI 초기화 - Custom 사용자는 별도 ID 사용
    let sigId, resultId, clearBtnId, backendDataId;
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

    document.getElementById(sigId).textContent = '-';
    document.getElementById(resultId).classList.add('hidden');
    document.getElementById(clearBtnId).classList.add('hidden');

    const backendDataEl = document.getElementById(backendDataId);
    if (backendDataEl) {
      backendDataEl.textContent = '-';
    }

    const userName = userIndex === 0 ? 'User 1' : (userIndex === 1 ? 'User 2' : 'Custom');

    // 서명이 모두 없어지면 요약 및 백엔드 데이터 섹션 숨기기
    if (this.userBatchSigs.length === 0) {
      document.getElementById('batchSigSummary').classList.add('hidden');
      document.getElementById('backendDataSection').classList.add('hidden');
    } else {
      // 남은 서명으로 요약 업데이트
      this.updateSummary();
    }

    console.log(`[INFO] ${userName} 서명이 삭제되었습니다.`);
  }
}
