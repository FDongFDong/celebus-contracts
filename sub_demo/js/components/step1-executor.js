/**
 * Step 1: Executor 및 User 지갑 설정
 */

import { CONFIG } from '../config.js?v=4';

export class Step1Executor {
  constructor(state) {
    this.state = state;
    this.executorWallet = null;
    this.user1Wallet = null;
    this.user2Wallet = null;
  }

  render() {
    return `
      <div class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-yellow-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-yellow-500">STEP 1</span>
          ⚡ Executor 지갑 초기화
        </h2>
        <p class="text-sm text-gray-600 mb-4">Executor와 사용자 지갑을 설정합니다</p>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Executor -->
          <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 class="text-md font-semibold text-yellow-800 mb-3">🔑 Executor</h3>
            <div class="mb-3">
              <label class="block text-sm font-medium text-gray-700 mb-2">비밀키 (0x...)</label>
              <input
                type="text"
                id="executorPrivateKey"
                class="w-full px-3 py-2 border rounded-md text-xs"
                value="${CONFIG.DEFAULT_VALUES.executorPrivateKey}"
              >
              <p class="text-xs text-gray-500 mt-1">
                주소: <span id="executorAddress" class="font-mono">-</span>
              </p>
            </div>
          </div>

          <!-- User 1 -->
          <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 class="text-md font-semibold text-blue-800 mb-3">👤 User 1</h3>
            <div class="mb-3">
              <label class="block text-sm font-medium text-gray-700 mb-2">비밀키 (0x...)</label>
              <input
                type="text"
                id="user1PrivateKey"
                class="w-full px-3 py-2 border rounded-md text-xs"
                value="${CONFIG.DEFAULT_VALUES.user1PrivateKey}"
              >
              <p class="text-xs text-gray-500 mt-1">
                주소: <span id="user1Address" class="font-mono">-</span>
              </p>
            </div>
          </div>

          <!-- User 2 -->
          <div class="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 class="text-md font-semibold text-green-800 mb-3">👤 User 2</h3>
            <div class="mb-3">
              <label class="block text-sm font-medium text-gray-700 mb-2">비밀키 (0x...)</label>
              <input
                type="text"
                id="user2PrivateKey"
                class="w-full px-3 py-2 border rounded-md text-xs"
                value="${CONFIG.DEFAULT_VALUES.user2PrivateKey}"
              >
              <p class="text-xs text-gray-500 mt-1">
                주소: <span id="user2Address" class="font-mono">-</span>
              </p>
            </div>
          </div>
        </div>

        <button onclick="step1.initWallets()" class="mt-4 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">
          ✅ 지갑 초기화
        </button>

        <div id="walletStatus" class="mt-4 hidden">
          <div class="bg-green-50 border border-green-200 rounded p-3">
            <p class="text-green-800 font-semibold">✅ 지갑이 성공적으로 초기화되었습니다!</p>
          </div>
        </div>
      </div>
    `;
  }

  async initWallets() {
    try {
      // Executor 지갑
      const executorKey = document.getElementById('executorPrivateKey').value;
      this.executorWallet = new ethers.Wallet(executorKey, this.state.provider);
      document.getElementById('executorAddress').textContent = this.executorWallet.address;

      // User 1 지갑
      const user1Key = document.getElementById('user1PrivateKey').value;
      this.user1Wallet = new ethers.Wallet(user1Key, this.state.provider);
      document.getElementById('user1Address').textContent = this.user1Wallet.address;

      // User 2 지갑
      const user2Key = document.getElementById('user2PrivateKey').value;
      this.user2Wallet = new ethers.Wallet(user2Key, this.state.provider);
      document.getElementById('user2Address').textContent = this.user2Wallet.address;

      // State에 저장
      this.state.executorWallet = this.executorWallet;
      this.state.user1Wallet = this.user1Wallet;
      this.state.user2Wallet = this.user2Wallet;

      // 성공 메시지 표시
      document.getElementById('walletStatus').classList.remove('hidden');

      console.log('✅ Wallets initialized:', {
        executor: this.executorWallet.address,
        user1: this.user1Wallet.address,
        user2: this.user2Wallet.address
      });

    } catch (error) {
      console.error('❌ Wallet initialization failed:', error);
      alert('지갑 초기화 실패: ' + error.message);
    }
  }
}
