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
      <div class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-purple-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-purple-500">STEP 3</span>
          <i data-lucide="pen-tool" class="w-5 h-5 inline"></i> User Batch Signatures 생성(Frontend)
        </h2>
        <p class="text-sm text-gray-600 mb-4">각 사용자가 자신의 레코드에 서명합니다</p>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <!-- User 1 서명 -->
          <div class="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h3 class="text-lg font-semibold text-blue-800 mb-3"><i data-lucide="user" class="w-4 h-4 inline"></i> User 1 서명</h3>
            <button onclick="step3.signUserBatch(0)" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 w-full">
              <i data-lucide="lock" class="w-4 h-4 inline"></i> User 1 서명 생성
            </button>
            <div id="user1SigResult" class="mt-3 hidden">
              <p class="text-xs text-gray-600">서명:</p>
              <p class="text-xs font-mono bg-white p-2 rounded mt-1 break-all" id="user1Signature">-</p>
            </div>
          </div>

          <!-- User 2 서명 -->
          <div class="bg-green-50 rounded-lg border border-green-200 p-4">
            <h3 class="text-lg font-semibold text-green-800 mb-3"><i data-lucide="user" class="w-4 h-4 inline"></i> User 2 서명</h3>
            <button onclick="step3.signUserBatch(1)" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 w-full">
              <i data-lucide="lock" class="w-4 h-4 inline"></i> User 2 서명 생성
            </button>
            <div id="user2SigResult" class="mt-3 hidden">
              <p class="text-xs text-gray-600">서명:</p>
              <p class="text-xs font-mono bg-white p-2 rounded mt-1 break-all" id="user2Signature">-</p>
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

            <div class="grid grid-cols-2 gap-4" id="backendDataGrid">
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

      if (userRecords.length === 0) {
        alert(`User ${userIndex + 1}의 레코드가 없습니다. Step 2에서 레코드를 추가해주세요.`);
        return;
      }

      const wallet = userIndex === 0 ? this.state.user1Wallet : this.state.user2Wallet;
      if (!wallet) {
        alert('지갑이 초기화되지 않았습니다!');
        return;
      }

      // User nonce 가져오기 - STEP 2에서 설정한 값 사용
      const userNonce = userIndex === 0 ? (this.state.user1Nonce || 0) : (this.state.user2Nonce || 0);

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
      console.log(`\n========== User ${userIndex + 1} 서명 디버그 ==========`);
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
        userNonce,
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

      // UI 업데이트
      const sigId = `user${userIndex + 1}Signature`;
      const resultId = `user${userIndex + 1}SigResult`;
      document.getElementById(sigId).textContent = signature;
      document.getElementById(resultId).classList.remove('hidden');

      this.updateSummary();

      console.log(`[SUCCESS] User ${userIndex + 1} batch signature created:`, {
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
      const summary = this.userBatchSigs.map((sig, idx) =>
        `User ${idx + 1}: ${sig.signature.slice(0, 20)}...`
      ).join(', ');

      document.getElementById('sigSummaryText').textContent =
        `${this.userBatchSigs.length}명의 사용자 서명 완료`;
      document.getElementById('batchSigSummary').classList.remove('hidden');

      // 각 사용자별로 백엔드 전송 데이터 생성
      this.userBatchSigs.forEach((sig, index) => {
        const userRecords = this.state.records.filter(r => r.userIndex === index);

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

        // User 1 또는 User 2 데이터 표시
        const elementId = index === 0 ? 'user1BackendData' : 'user2BackendData';
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
}
