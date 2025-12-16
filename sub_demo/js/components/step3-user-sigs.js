/**
 * STEP 3: 사용자 서명 생성
 * SubVoting N:1 구조: 유저당 1개의 서명으로 여러 레코드 처리
 */

import { CONFIG } from '../config.js?v=4';
import { hashVoteRecord, hashRecordsArray } from '../utils/eip712.js?v=4';

export class Step3UserSigs {
  constructor(state) {
    this.state = state;
  }

  render() {
    return `
      <section class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-purple-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-purple-500">STEP 3</span>
          ✍️ 사용자 서명 생성(Frontend)
        </h2>
        <p class="text-sm text-gray-600 mb-4">각 사용자가 자신의 모든 레코드에 대해 한 번 서명합니다</p>

        <div class="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
          <p class="text-sm text-purple-700">
            💡 <strong>SubVoting N:1 구조:</strong> 유저당 1개 서명 = N개 레코드 (최대 5개)
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <!-- 사용자 A 서명 -->
          <div class="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h3 class="text-lg font-semibold text-blue-800 mb-3">👤 사용자 A 서명</h3>
            <button onclick="step3.signUserBatch(0)" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 w-full">
              🔐 사용자 A 배치 서명 생성
            </button>
            <div id="userASigResult" class="mt-3 hidden">
              <p class="text-xs text-gray-600">레코드 개수:</p>
              <p class="text-sm font-semibold bg-white p-2 rounded mt-1" id="userASigRecordCount">0개</p>
              <p class="text-xs text-gray-600 mt-2">서명 (1개):</p>
              <p class="text-xs font-mono bg-white p-2 rounded mt-1 break-all" id="userASigSample">-</p>
            </div>
          </div>

          <!-- 사용자 B 서명 -->
          <div class="bg-green-50 rounded-lg border border-green-200 p-4">
            <h3 class="text-lg font-semibold text-green-800 mb-3">👤 사용자 B 서명</h3>
            <button onclick="step3.signUserBatch(1)" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 w-full">
              🔐 사용자 B 배치 서명 생성
            </button>
            <div id="userBSigResult" class="mt-3 hidden">
              <p class="text-xs text-gray-600">레코드 개수:</p>
              <p class="text-sm font-semibold bg-white p-2 rounded mt-1" id="userBSigRecordCount">0개</p>
              <p class="text-xs text-gray-600 mt-2">서명 (1개):</p>
              <p class="text-xs font-mono bg-white p-2 rounded mt-1 break-all" id="userBSigSample">-</p>
            </div>
          </div>
        </div>

        <div id="batchSigSummary" class="mt-4 hidden">
          <div class="bg-purple-50 border border-purple-200 rounded p-4">
            <p class="font-semibold text-purple-900 mb-2">📋 서명 완료:</p>
            <p class="text-sm" id="sigSummaryText">-</p>
          </div>
        </div>

        <!-- 백엔드로 전달할 데이터 (2개 열로 분리) -->
        <div id="backendDataSection" class="mt-6 hidden">
          <div class="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-purple-400 rounded p-4">
            <h3 class="font-semibold text-gray-900 mb-2">
              🚀 Frontend → Backend 전달 데이터
            </h3>
            <p class="text-sm text-gray-700 mb-4">
              <strong>⚠️ 실제 프로덕션:</strong> 각 사용자는 <strong>자신의 기기</strong>에서 별도로 백엔드 API에 전송합니다
            </p>

            <div class="grid grid-cols-2 gap-4">
              <!-- 사용자 A 전송 데이터 -->
              <div class="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <div class="flex items-center mb-3">
                  <span class="text-2xl mr-2">📱</span>
                  <div>
                    <h4 class="font-bold text-blue-900">사용자 A의 기기</h4>
                    <p class="text-xs text-blue-700">iPhone, Seoul, 10:00:01</p>
                  </div>
                </div>
                <div class="mb-2">
                  <code class="text-xs text-blue-800 font-semibold">POST /api/vote/submit</code>
                </div>
                <div class="bg-white rounded border border-blue-200 p-3 max-h-96 overflow-y-auto">
                  <pre class="text-xs font-mono" id="userABackendData">-</pre>
                </div>
              </div>

              <!-- 사용자 B 전송 데이터 -->
              <div class="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div class="flex items-center mb-3">
                  <span class="text-2xl mr-2">💻</span>
                  <div>
                    <h4 class="font-bold text-green-900">사용자 B의 기기</h4>
                    <p class="text-xs text-green-700">Desktop, Busan, 10:00:05</p>
                  </div>
                </div>
                <div class="mb-2">
                  <code class="text-xs text-green-800 font-semibold">POST /api/vote/submit</code>
                </div>
                <div class="bg-white rounded border border-green-200 p-3 max-h-96 overflow-y-auto">
                  <pre class="text-xs font-mono" id="userBBackendData">-</pre>
                </div>
              </div>
            </div>

            <!-- 백엔드 배치 처리 설명 -->
            <div class="mt-4 bg-yellow-50 border border-yellow-300 rounded p-3">
              <p class="text-sm text-yellow-900">
                <strong>💡 백엔드가 처리:</strong> 서버가 여러 사용자의 제출을 수집 → userId 자동 주입 → 순서 정렬 → Executor 서명 → 컨트랙트 제출
              </p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * 사용자별 배치 서명 생성 (해당 사용자의 모든 레코드를 한 번에 서명)
   */
  async signUserBatch(userIndex) {
    try {
      // 해당 사용자의 레코드만 필터링
      const userRecords = this.state.records.filter(r => r.userIndex === userIndex);

      if (userRecords.length === 0) {
        alert(`사용자 ${userIndex === 0 ? 'A' : 'B'}의 레코드가 없습니다. STEP 2에서 레코드를 추가해주세요.`);
        return;
      }

      if (userRecords.length > 5) {
        alert(`사용자당 최대 5개 레코드만 가능합니다. 현재: ${userRecords.length}개`);
        return;
      }

      const wallet = userIndex === 0 ? this.state.user1Wallet : this.state.user2Wallet;
      if (!wallet) {
        alert('먼저 STEP 1에서 지갑을 초기화해주세요!');
        return;
      }

      // 초기화
      if (!this.state.userBatchSigs) {
        this.state.userBatchSigs = [];
      }

      // 기존 서명 중 해당 사용자 것만 제거
      this.state.userBatchSigs = this.state.userBatchSigs.filter(
        sig => sig.user !== wallet.address
      );

      // 1. 각 레코드의 해시 계산
      const recordHashes = userRecords.map(record =>
        hashVoteRecord(record, wallet.address)
      );

      // 2. recordsHash 통합 (abi.encodePacked)
      const recordsHash = hashRecordsArray(recordHashes);

      // 3. 유저 nonce 결정 (첫 번째 레코드의 nonce 사용)
      const userNonce = userRecords[0].userNonce;

      // 4. EIP-712 서명
      const domain = {
        name: 'SubVoting',
        version: '1',
        chainId: CONFIG.CHAIN_ID,
        verifyingContract: this.state.contractAddress
      };

      // 🔍 디버깅: 서명 생성 시 사용된 도메인 확인
      console.log('🔍 User Signature Domain:', {
        name: domain.name,
        version: domain.version,
        chainId: domain.chainId,
        verifyingContract: domain.verifyingContract
      });

      const types = {
        UserBatch: [
          { name: 'user', type: 'address' },
          { name: 'userNonce', type: 'uint256' },
          { name: 'recordsHash', type: 'bytes32' }
        ]
      };

      const value = {
        user: wallet.address,
        userNonce: userNonce,
        recordsHash: recordsHash
      };

      const signature = await wallet.signTypedData(domain, types, value);

      // 5. UserBatchSig 저장 (유저당 1개)
      const userBatchSig = {
        user: wallet.address,
        userNonce: userNonce,
        signature: signature,
        recordCount: userRecords.length,
        recordHashes: recordHashes,
        recordsHash: recordsHash
      };

      this.state.userBatchSigs.push(userBatchSig);

      // UI 업데이트
      const userName = userIndex === 0 ? 'A' : 'B';
      document.getElementById(`user${userName}SigRecordCount`).textContent = `${userRecords.length}개`;
      document.getElementById(`user${userName}SigSample`).textContent = signature;
      document.getElementById(`user${userName}SigResult`).classList.remove('hidden');

      this.updateSummary();

      console.log(`✅ 사용자 ${userName} 배치 서명 완료:`, {
        user: wallet.address,
        recordCount: userRecords.length,
        userNonce: userNonce,
        recordsHash: recordsHash.substring(0, 20) + '...'
      });

    } catch (error) {
      console.error('❌ 서명 생성 실패:', error);
      alert('서명 생성 실패: ' + error.message);
    }
  }

  /**
   * 서명 완료 요약 및 백엔드 전송 데이터 업데이트
   */
  updateSummary() {
    if (!this.state.userBatchSigs || this.state.userBatchSigs.length === 0) {
      return;
    }

    // 사용자별로 서명 그룹화
    const userAAddress = this.state.user1Wallet?.address;
    const userBAddress = this.state.user2Wallet?.address;

    const userASig = this.state.userBatchSigs.find(sig => sig.user === userAAddress);
    const userBSig = this.state.userBatchSigs.find(sig => sig.user === userBAddress);

    // 서명 완료 요약 표시
    let summaryParts = [];
    if (userASig) summaryParts.push(`사용자 A: ${userASig.recordCount}개 레코드 → 1개 서명`);
    if (userBSig) summaryParts.push(`사용자 B: ${userBSig.recordCount}개 레코드 → 1개 서명`);

    document.getElementById('sigSummaryText').textContent = summaryParts.join(', ') || '-';
    document.getElementById('batchSigSummary').classList.remove('hidden');

    // 백엔드 전송 데이터 생성 (사용자별)
    this.generateBackendData();

    document.getElementById('backendDataSection').classList.remove('hidden');
  }

  /**
   * 백엔드 전송 데이터 생성 (사용자별) - UserVoteBatch N:1 구조
   */
  generateBackendData() {
    const userAAddress = this.state.user1Wallet?.address;
    const userBAddress = this.state.user2Wallet?.address;

    // 사용자 A 데이터 - { records: [...], userBatchSig: {...} }
    const userARecords = this.state.records.filter(r => r.userAddress === userAAddress);
    const userASig = this.state.userBatchSigs.find(sig => sig.user === userAAddress);

    if (userARecords.length > 0 && userASig) {
      const userABatch = {
        records: userARecords.map(r => ({
          timestamp: r.timestamp,
          missionId: r.missionId,
          votingId: r.votingId,
          questionId: r.questionId,
          optionId: r.optionId,
          votingAmt: r.votingAmt
          // userId는 백엔드가 자동 주입
        })),
        userBatchSig: {
          user: userASig.user,
          userNonce: userASig.userNonce,
          signature: userASig.signature
        }
      };

      document.getElementById('userABackendData').textContent =
        JSON.stringify(userABatch, null, 2);
    }

    // 사용자 B 데이터 - { records: [...], userBatchSig: {...} }
    const userBRecords = this.state.records.filter(r => r.userAddress === userBAddress);
    const userBSig = this.state.userBatchSigs.find(sig => sig.user === userBAddress);

    if (userBRecords.length > 0 && userBSig) {
      const userBBatch = {
        records: userBRecords.map(r => ({
          timestamp: r.timestamp,
          missionId: r.missionId,
          votingId: r.votingId,
          questionId: r.questionId,
          optionId: r.optionId,
          votingAmt: r.votingAmt
          // userId는 백엔드가 자동 주입
        })),
        userBatchSig: {
          user: userBSig.user,
          userNonce: userBSig.userNonce,
          signature: userBSig.signature
        }
      };

      document.getElementById('userBBackendData').textContent =
        JSON.stringify(userBBatch, null, 2);
    }
  }
}
