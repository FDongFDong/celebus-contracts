/**
 * STEP 3: 사용자 서명 생성
 * SubVoting: 각 레코드마다 개별 서명 (순서 기반 매칭)
 */

import { CONFIG } from '../config.js';

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
        <p class="text-sm text-gray-600 mb-4">각 사용자가 자신의 레코드에 서명합니다</p>

        <div class="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
          <p class="text-sm text-purple-700">
            💡 <strong>SubVoting 서명:</strong> 1레코드 = 1서명 (순서 기반 매칭)
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <!-- 사용자 A 서명 -->
          <div class="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h3 class="text-lg font-semibold text-blue-800 mb-3">👤 사용자 A 서명</h3>
            <button onclick="step3.signUserBatch(0)" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 w-full">
              🔐 사용자 A 서명 생성
            </button>
            <div id="userASigResult" class="mt-3 hidden">
              <p class="text-xs text-gray-600">서명 개수:</p>
              <p class="text-sm font-semibold bg-white p-2 rounded mt-1" id="userASigCount">0개</p>
              <p class="text-xs text-gray-600 mt-2">첫 번째 서명 샘플:</p>
              <p class="text-xs font-mono bg-white p-2 rounded mt-1 break-all" id="userASigSample">-</p>
            </div>
          </div>

          <!-- 사용자 B 서명 -->
          <div class="bg-green-50 rounded-lg border border-green-200 p-4">
            <h3 class="text-lg font-semibold text-green-800 mb-3">👤 사용자 B 서명</h3>
            <button onclick="step3.signUserBatch(1)" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 w-full">
              🔐 사용자 B 서명 생성
            </button>
            <div id="userBSigResult" class="mt-3 hidden">
              <p class="text-xs text-gray-600">서명 개수:</p>
              <p class="text-sm font-semibold bg-white p-2 rounded mt-1" id="userBSigCount">0개</p>
              <p class="text-xs text-gray-600 mt-2">첫 번째 서명 샘플:</p>
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
   * 사용자별 서명 생성 (해당 사용자의 모든 레코드)
   */
  async signUserBatch(userIndex) {
    try {
      // 해당 사용자의 레코드만 필터링
      const userRecords = this.state.records.filter(r => r.userIndex === userIndex);

      if (userRecords.length === 0) {
        alert(`사용자 ${userIndex === 0 ? 'A' : 'B'}의 레코드가 없습니다. STEP 2에서 레코드를 추가해주세요.`);
        return;
      }

      const wallet = userIndex === 0 ? this.state.user1Wallet : this.state.user2Wallet;
      if (!wallet) {
        alert('먼저 STEP 1에서 지갑을 초기화해주세요!');
        return;
      }

      // 해당 사용자의 기존 서명 제거 (재생성 대비)
      if (!this.state.userSigs) {
        this.state.userSigs = [];
      }

      // 기존 서명 중 해당 사용자 것만 제거
      this.state.userSigs = this.state.userSigs.filter(
        sig => sig.user !== wallet.address
      );

      const userSigs = [];

      // 각 레코드마다 개별 서명 생성 (SubVoting: 1레코드 = 1서명)
      for (let i = 0; i < userRecords.length; i++) {
        const record = userRecords[i];

        // VoteRecord 해시 계산 (userAddress 제거됨)
        const recordHash = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              'bytes32', 'uint256', 'uint256', 'uint256',
              'uint256', 'uint256', 'uint256'
            ],
            [
              ethers.id('VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 questionId,uint256 optionId,uint256 votingAmt)'),
              record.timestamp,
              record.missionId,
              record.votingId,
              record.questionId,
              record.optionId,
              record.votingAmt
            ]
          )
        );

        // UserSig 타입 해시
        const domain = {
          name: 'SubVoting',
          version: '1',
          chainId: CONFIG.CHAIN_ID,
          verifyingContract: this.state.contractAddress
        };

        const types = {
          UserSig: [
            { name: 'user', type: 'address' },
            { name: 'userNonce', type: 'uint256' },
            { name: 'recordHash', type: 'bytes32' }
          ]
        };

        const value = {
          user: wallet.address,
          userNonce: record.userNonce,
          recordHash: recordHash
        };

        // EIP-712 서명
        const signature = await wallet.signTypedData(domain, types, value);

        // UserSig 저장
        userSigs.push({
          user: wallet.address,
          userNonce: record.userNonce,
          signature: signature
        });

        console.log(`✅ User signature generated for record #${i}:`, signature.substring(0, 20) + '...');
      }

      // 전체 서명 배열에 추가
      this.state.userSigs.push(...userSigs);

      // UI 업데이트
      const userName = userIndex === 0 ? 'A' : 'B';
      const sigCountId = `user${userName}SigCount`;
      const sigSampleId = `user${userName}SigSample`;
      const sigResultId = `user${userName}SigResult`;

      document.getElementById(sigCountId).textContent = `${userSigs.length}개`;
      document.getElementById(sigSampleId).textContent = userSigs[0].signature;
      document.getElementById(sigResultId).classList.remove('hidden');

      this.updateSummary();

      console.log(`✅ 사용자 ${userName} 서명 완료:`, {
        user: wallet.address,
        signatureCount: userSigs.length
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
    if (!this.state.userSigs || this.state.userSigs.length === 0) {
      return;
    }

    // 사용자별로 서명 그룹화
    const userAAddress = this.state.user1Wallet?.address;
    const userBAddress = this.state.user2Wallet?.address;

    const userASigs = this.state.userSigs.filter(sig => sig.user === userAAddress);
    const userBSigs = this.state.userSigs.filter(sig => sig.user === userBAddress);

    const totalSigs = this.state.userSigs.length;

    // 서명 완료 요약 표시
    let summaryText = `총 ${totalSigs}개 서명 완료`;
    if (userASigs.length > 0) summaryText += ` (사용자 A: ${userASigs.length}개`;
    if (userBSigs.length > 0) summaryText += userASigs.length > 0 ? `, 사용자 B: ${userBSigs.length}개)` : ` (사용자 B: ${userBSigs.length}개)`;
    else if (userASigs.length > 0) summaryText += ')';

    document.getElementById('sigSummaryText').textContent = summaryText;
    document.getElementById('batchSigSummary').classList.remove('hidden');

    // 백엔드 전송 데이터 생성 (사용자별)
    this.generateBackendData();

    document.getElementById('backendDataSection').classList.remove('hidden');
  }

  /**
   * 백엔드 전송 데이터 생성 (사용자별) - UserVoteBatch 구조
   */
  generateBackendData() {
    const userAAddress = this.state.user1Wallet?.address;
    const userBAddress = this.state.user2Wallet?.address;

    // 사용자 A 데이터 - UserVoteBatch[] 형태
    const userARecords = this.state.records.filter(r => r.userAddress === userAAddress);
    const userASigs = this.state.userSigs.filter(sig => sig.user === userAAddress);

    if (userARecords.length > 0 && userASigs.length > 0) {
      // record와 userSig를 쌍으로 묶어서 UserVoteBatch 생성
      const userABatches = userARecords.map((r, idx) => ({
        record: {
          timestamp: r.timestamp,
          missionId: r.missionId,
          votingId: r.votingId,
          questionId: r.questionId,
          optionId: r.optionId,
          votingAmt: r.votingAmt
          // userId는 백엔드가 자동 주입
        },
        userSig: {
          user: userASigs[idx].user,
          userNonce: userASigs[idx].userNonce,
          signature: userASigs[idx].signature
        }
      }));

      document.getElementById('userABackendData').textContent =
        JSON.stringify(userABatches, null, 2);
    }

    // 사용자 B 데이터 - UserVoteBatch[] 형태
    const userBRecords = this.state.records.filter(r => r.userAddress === userBAddress);
    const userBSigs = this.state.userSigs.filter(sig => sig.user === userBAddress);

    if (userBRecords.length > 0 && userBSigs.length > 0) {
      // record와 userSig를 쌍으로 묶어서 UserVoteBatch 생성
      const userBBatches = userBRecords.map((r, idx) => ({
        record: {
          timestamp: r.timestamp,
          missionId: r.missionId,
          votingId: r.votingId,
          questionId: r.questionId,
          optionId: r.optionId,
          votingAmt: r.votingAmt
          // userId는 백엔드가 자동 주입
        },
        userSig: {
          user: userBSigs[idx].user,
          userNonce: userBSigs[idx].userNonce,
          signature: userBSigs[idx].signature
        }
      }));

      document.getElementById('userBBackendData').textContent =
        JSON.stringify(userBBatches, null, 2);
    }
  }
}
