/**
 * Step 3: User Signatures 생성 (1투표 1서명 패턴)
 */

import { CONFIG, getDomain } from '../config.js';
import { hashBoostRecord, calculateUserSigDigest } from '../utils/eip712.js';

export class Step3UserSigs {
  constructor(state) {
    this.state = state;
    this.userSigs = [];
  }

  render() {
    return `
      <div class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-purple-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-purple-500">STEP 3</span>
          ✍️ User Signatures 생성 (Frontend)
        </h2>
        <p class="text-sm text-gray-600 mb-2">
          각 사용자가 <strong>자신의 레코드에</strong> 개별 서명을 생성합니다 (1레코드 1서명)
        </p>
        <p class="text-xs text-orange-600 mb-4">
          ⚠️ <strong>주의:</strong> 1배치에 1유저당 1개 레코드이므로 각 유저는 1번만 서명합니다
        </p>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <!-- User 1 서명 -->
          <div class="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h3 class="text-lg font-semibold text-blue-800 mb-3">👤 User 1 서명</h3>
            <button onclick="step3.signUserRecords(0)" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 w-full">
              🔐 User 1 서명 생성
            </button>
            <div id="user1SigResult" class="mt-3 hidden">
              <p class="text-xs text-gray-600">생성된 서명:</p>
              <p class="text-xs font-mono bg-white p-2 rounded mt-1" id="user1SignatureCount">-</p>
            </div>
          </div>

          <!-- User 2 서명 -->
          <div class="bg-green-50 rounded-lg border border-green-200 p-4">
            <h3 class="text-lg font-semibold text-green-800 mb-3">👤 User 2 서명</h3>
            <button onclick="step3.signUserRecords(1)" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 w-full">
              🔐 User 2 서명 생성
            </button>
            <div id="user2SigResult" class="mt-3 hidden">
              <p class="text-xs text-gray-600">생성된 서명:</p>
              <p class="text-xs font-mono bg-white p-2 rounded mt-1" id="user2SignatureCount">-</p>
            </div>
          </div>
        </div>

        <div id="batchSigSummary" class="mt-4 hidden">
          <div class="bg-purple-50 border border-purple-200 rounded p-4">
            <p class="font-semibold text-purple-900 mb-2">📋 서명 완료:</p>
            <p class="text-sm" id="sigSummaryText">-</p>
          </div>
        </div>

        <!-- 백엔드로 전달할 데이터 -->
        <div id="backendDataSection" class="mt-6 hidden">
          <div class="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-purple-400 rounded p-4">
            <h3 class="font-semibold text-gray-900 mb-2">
              🚀 Frontend → Backend 전달 데이터
            </h3>
            <p class="text-sm text-gray-700 mb-4">
              <strong>⚠️ 실제 프로덕션:</strong> 각 사용자는 <strong>자신의 기기</strong>에서 별도로 백엔드 API에 전송합니다
            </p>

            <div class="grid grid-cols-2 gap-4" id="backendDataGrid">
              <!-- User 1 전송 데이터 -->
              <div class="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <div class="flex items-center mb-3">
                  <span class="text-2xl mr-2">📱</span>
                  <div>
                    <h4 class="font-bold text-blue-900">User 1의 기기</h4>
                    <p class="text-xs text-blue-700">iPhone, Seoul, 10:00:01</p>
                  </div>
                </div>
                <div class="mb-2">
                  <code class="text-xs text-blue-800 font-semibold">POST /api/boost/submit</code>
                </div>
                <div class="bg-white rounded border border-blue-200 p-3 max-h-96 overflow-y-auto">
                  <pre class="text-xs font-mono" id="user1BackendData">-</pre>
                </div>
              </div>

              <!-- User 2 전송 데이터 -->
              <div class="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div class="flex items-center mb-3">
                  <span class="text-2xl mr-2">💻</span>
                  <div>
                    <h4 class="font-bold text-green-900">User 2의 기기</h4>
                    <p class="text-xs text-green-700">Desktop, Busan, 10:00:05</p>
                  </div>
                </div>
                <div class="mb-2">
                  <code class="text-xs text-green-800 font-semibold">POST /api/boost/submit</code>
                </div>
                <div class="bg-white rounded border border-green-200 p-3 max-h-96 overflow-y-auto">
                  <pre class="text-xs font-mono" id="user2BackendData">-</pre>
                </div>
              </div>
            </div>

            <!-- 백엔드 배치 처리 설명 -->
            <div class="mt-4 bg-yellow-50 border border-yellow-300 rounded p-3">
              <p class="text-sm text-yellow-900">
                <strong>💡 백엔드가 처리:</strong> 서버가 여러 사용자의 제출을 수집 → userId 자동 주입 → 배치로 결합 → Executor 서명 → 컨트랙트 제출
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async signUserRecords(userIndex) {
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

      // User base nonce 가져오기 - STEP 2에서 설정한 값 사용
      let userNonce = userIndex === 0 ? (this.state.user1Nonce || 0) : (this.state.user2Nonce || 0);

      // EIP-712 도메인
      const domain = getDomain(this.state.contractAddress);
      const types = {
        UserSig: [
          { name: 'user', type: 'address' },
          { name: 'userNonce', type: 'uint256' },
          { name: 'recordHash', type: 'bytes32' }
        ]
      };

      // 이 사용자의 기존 서명 제거
      this.userSigs = this.userSigs.filter(sig => sig.user !== wallet.address);

      // 각 레코드마다 개별 서명 생성
      for (let i = 0; i < userRecords.length; i++) {
        const record = userRecords[i];

        // 레코드 해시 계산
        const recordHash = hashBoostRecord(record);

        // EIP-712 서명 (컨트랙트 규격: UserSig(address user,uint256 userNonce,bytes32 recordHash))
        const value = {
          user: wallet.address,
          userNonce: userNonce + i,
          recordHash
        };

        const signature = await wallet.signTypedData(domain, types, value);

        // UserSig 저장
        this.userSigs.push({
          user: wallet.address,
          userNonce: userNonce + i,
          signature
        });

        console.log(`✅ Record ${i + 1}/${userRecords.length} signed:`, {
          user: wallet.address,
          userNonce: userNonce + i,
          recordHash,
          signature: signature.slice(0, 20) + '...'
        });
      }

      // State 업데이트
      this.state.userSigs = this.userSigs;

      // UI 업데이트
      const countId = `user${userIndex + 1}SignatureCount`;
      const resultId = `user${userIndex + 1}SigResult`;
      document.getElementById(countId).textContent = `${userRecords.length}개 레코드 서명 완료`;
      document.getElementById(resultId).classList.remove('hidden');

      this.updateSummary();

      console.log(`✅ User ${userIndex + 1} - ${userRecords.length}개 레코드 서명 완료`);

    } catch (error) {
      console.error('❌ Signature creation failed:', error);
      alert('서명 생성 실패: ' + error.message);
    }
  }

  updateSummary() {
    if (this.userSigs.length > 0) {
      // 사용자별 서명 개수 계산
      const user1Sigs = this.userSigs.filter(sig => sig.user === this.state.user1Wallet?.address);
      const user2Sigs = this.userSigs.filter(sig => sig.user === this.state.user2Wallet?.address);

      document.getElementById('sigSummaryText').textContent =
        `총 ${this.userSigs.length}개 서명 완료 (User1: ${user1Sigs.length}개, User2: ${user2Sigs.length}개)`;
      document.getElementById('batchSigSummary').classList.remove('hidden');

      // 각 사용자별로 백엔드 전송 데이터 생성
      [this.state.user1Wallet, this.state.user2Wallet].forEach((wallet, index) => {
        if (!wallet) return;

        const userRecords = this.state.records.filter(r => r.userAddress === wallet.address);
        const userSignatures = this.userSigs.filter(sig => sig.user === wallet.address);

        if (userRecords.length === 0) return;

        const userBackendData = {
          userAddress: wallet.address,
          records: userRecords.map(r => ({
            timestamp: r.timestamp,
            missionId: r.missionId,
            boostingId: r.boostingId,
            userAddress: r.userAddress,
            artistId: r.artistId,
            boostingWith: r.boostingWith,
            amt: r.amt
            // 주의: userId는 프론트엔드에서 전송하지 않음!
            // 백엔드가 userAddress로 DB 조회하여 자동 주입
          })),
          userSigs: userSignatures.map(sig => ({
            user: sig.user,
            userNonce: sig.userNonce,
            signature: sig.signature
          }))
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
}
