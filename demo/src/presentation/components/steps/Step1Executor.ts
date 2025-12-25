/**
 * STEP 1: Executor and User Wallet Setup
 *
 * Executor와 사용자 지갑 설정 컴포넌트
 * - Executor wallet initialization
 * - User1, User2 wallet setup
 * - WalletAdapter 사용
 * - 결과를 AppState에 저장
 */

import { BaseStep } from '../BaseStep';
import { WalletAdapter } from '../../../infrastructure/viem/WalletAdapter';
import * as UIHelper from '../../utils/UIHelper';

// Default values for testing
const DEFAULT_VALUES = {
  executorPrivateKey: '0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef',
  user1PrivateKey: '0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef',
  user2PrivateKey: '0xb43112fd82593f95dea3ba1a25eed28a6a75d6763677a42560b5d7815fea7977',
};

/**
 * Step 1: Executor and User Wallet Setup Component
 */
export class Step1Executor extends BaseStep {
  /**
   * Render Step 1 UI
   */
  render(): string {
    return `
      <div id="step1" class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-yellow-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-yellow-500">STEP 1</span>
          Executor Wallet Initialization
        </h2>
        <p class="text-sm text-gray-600 mb-4">Executor와 사용자 지갑을 설정합니다</p>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Executor -->
          <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 class="text-md font-semibold text-yellow-800 mb-3">Executor</h3>
            <div class="mb-3">
              <label class="block text-sm font-medium text-gray-700 mb-2">Private Key (0x...)</label>
              <input
                type="text"
                id="executorPrivateKey"
                class="w-full px-3 py-2 border rounded-md text-xs font-mono"
                value="${DEFAULT_VALUES.executorPrivateKey}"
              >
              <p class="text-xs text-gray-500 mt-1">
                Address: <span id="executorAddress" class="font-mono text-xs break-all block">-</span>
              </p>
            </div>
          </div>

          <!-- User 1 -->
          <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 class="text-md font-semibold text-blue-800 mb-3">User 1</h3>
            <div class="mb-3">
              <label class="block text-sm font-medium text-gray-700 mb-2">Private Key (0x...)</label>
              <input
                type="text"
                id="user1PrivateKey"
                class="w-full px-3 py-2 border rounded-md text-xs font-mono"
                value="${DEFAULT_VALUES.user1PrivateKey}"
              >
              <p class="text-xs text-gray-500 mt-1">
                Address: <span id="user1Address" class="font-mono text-xs break-all block">-</span>
              </p>
            </div>
          </div>

          <!-- User 2 -->
          <div class="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 class="text-md font-semibold text-green-800 mb-3">User 2</h3>
            <div class="mb-3">
              <label class="block text-sm font-medium text-gray-700 mb-2">Private Key (0x...)</label>
              <input
                type="text"
                id="user2PrivateKey"
                class="w-full px-3 py-2 border rounded-md text-xs font-mono"
                value="${DEFAULT_VALUES.user2PrivateKey}"
              >
              <p class="text-xs text-gray-500 mt-1">
                Address: <span id="user2Address" class="font-mono text-xs break-all block">-</span>
              </p>
            </div>
          </div>
        </div>

        <button id="initWalletsBtn" class="mt-4 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">
          Initialize Wallets
        </button>

        <div id="walletStatus" class="mt-4 hidden"></div>
      </div>
    `;
  }

  /**
   * Initialize event listeners
   */
  init(): void {
    super.init();
    this.attachEventListeners();
    this.updateWalletAddresses();
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Executor wallet input
    UIHelper.safeAddEventListener('executorPrivateKey', 'input', () => {
      this.updateExecutorAddress();
    });

    // User 1 wallet input
    UIHelper.safeAddEventListener('user1PrivateKey', 'input', () => {
      this.updateUser1Address();
    });

    // User 2 wallet input
    UIHelper.safeAddEventListener('user2PrivateKey', 'input', () => {
      this.updateUser2Address();
    });

    // Initialize wallets button
    UIHelper.safeAddEventListener('initWalletsBtn', 'click', () => {
      void this.initWallets();
    });
  }

  /**
   * Update all wallet addresses on init
   */
  private updateWalletAddresses(): void {
    this.updateExecutorAddress();
    this.updateUser1Address();
    this.updateUser2Address();
  }

  /**
   * Update executor address display
   */
  private updateExecutorAddress(): void {
    const privateKey = UIHelper.getInputValue('executorPrivateKey').trim();

    if (!privateKey) {
      UIHelper.showValue('executorAddress', '-');
      return;
    }

    try {
      const wallet = new WalletAdapter(privateKey as `0x${string}`);
      UIHelper.showValue('executorAddress', wallet.address);
    } catch (error) {
      console.error('Executor wallet address update failed:', error);
      UIHelper.showValue('executorAddress', '-');
    }
  }

  /**
   * Update user 1 address display
   */
  private updateUser1Address(): void {
    const privateKey = UIHelper.getInputValue('user1PrivateKey').trim();

    if (!privateKey) {
      UIHelper.showValue('user1Address', '-');
      return;
    }

    try {
      const wallet = new WalletAdapter(privateKey as `0x${string}`);
      UIHelper.showValue('user1Address', wallet.address);
    } catch (error) {
      console.error('User 1 wallet address update failed:', error);
      UIHelper.showValue('user1Address', '-');
    }
  }

  /**
   * Update user 2 address display
   */
  private updateUser2Address(): void {
    const privateKey = UIHelper.getInputValue('user2PrivateKey').trim();

    if (!privateKey) {
      UIHelper.showValue('user2Address', '-');
      return;
    }

    try {
      const wallet = new WalletAdapter(privateKey as `0x${string}`);
      UIHelper.showValue('user2Address', wallet.address);
    } catch (error) {
      console.error('User 2 wallet address update failed:', error);
      UIHelper.showValue('user2Address', '-');
    }
  }

  /**
   * Initialize all wallets and save to state
   */
  private async initWallets(): Promise<void> {
    try {
      // Get private keys
      const executorKey = UIHelper.getInputValue('executorPrivateKey').trim();
      const user1Key = UIHelper.getInputValue('user1PrivateKey').trim();
      const user2Key = UIHelper.getInputValue('user2PrivateKey').trim();

      // Validate
      if (!executorKey || !user1Key || !user2Key) {
        alert('Please enter all private keys');
        return;
      }

      // Create wallets
      const executorWallet = new WalletAdapter(executorKey as `0x${string}`);
      const user1Wallet = new WalletAdapter(user1Key as `0x${string}`);
      const user2Wallet = new WalletAdapter(user2Key as `0x${string}`);

      // Update displays
      UIHelper.showValue('executorAddress', executorWallet.address);
      UIHelper.showValue('user1Address', user1Wallet.address);
      UIHelper.showValue('user2Address', user2Wallet.address);

      // Save to state
      this.state.setState({
        executorWallet,
        userWallets: [user1Wallet, user2Wallet],
      });

      // Show success message
      UIHelper.showSuccess('walletStatus', 'Wallets successfully initialized!');
    } catch (error) {
      console.error('[ERROR] Wallet initialization failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Wallet initialization failed: ${message}`);
    }
  }
}
