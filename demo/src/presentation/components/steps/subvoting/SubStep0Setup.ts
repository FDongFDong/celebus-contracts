/**
 * SUB STEP 0: SubVoting Contract Deployment and Setup
 *
 * SubVoting 컨트랙트 배포 및 초기 설정 컴포넌트
 * - Contract deployment
 * - Owner authorization
 * - Executor registration
 * - Question configuration
 * - Option registration
 */

import { BaseStep } from '../../BaseStep';
import type { AppState } from '../../../state/AppState';
import { WalletAdapter } from '../../../../infrastructure/viem/WalletAdapter';
import { createPublicClient, createWalletClient, http, type Address } from 'viem';
import { opBNBTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import * as UIHelper from '../../../utils/UIHelper';

// SubVoting Bytecode (import from generated file)
const SUBVOTING_BYTECODE_FILE = '/demo/SubVoting-bytecode.txt';

// SubVoting ABI (minimal for deployment and setup)
const SETUP_ABI = [
  'constructor(address initialOwner)',
  'function setExecutorSigner(address s)',
  'function setQuestion(uint256 missionId, uint256 questionId, string memory text, bool allowed_)',
  'function setOption(uint256 missionId, uint256 questionId, uint256 optionId, string memory text, bool allowed_)',
] as const;

type StatusType = 'success' | 'error' | 'info';

/**
 * SubStep 0: SubVoting Contract Deployment and Setup Component
 */
export class SubStep0Setup extends BaseStep {
  private deployerWallet: WalletAdapter | null = null;
  private deployedAddress: Address | null = null;
  private bytecode: string = '';

  constructor(state: AppState) {
    super(state);
  }

  /**
   * Render SubStep 0 UI
   */
  render(): string {
    return `
      <div id="substep0" class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-purple-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-purple-500">SUB STEP 0</span>
          SubVoting Contract Deployment & Setup
        </h2>
        <p class="text-sm text-gray-600 mb-4">SubVoting 컨트랙트 배포 및 초기 설정을 진행합니다</p>

        <!-- Deployer Wallet -->
        <div class="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h3 class="text-md font-semibold text-purple-800 mb-3">Deployer Wallet</h3>
          <label class="block text-sm font-medium text-gray-700 mb-2">Private Key (0x...)</label>
          <input
            type="text"
            id="subDeployerPrivateKey"
            class="w-full px-3 py-2 border rounded-md text-xs font-mono mb-2"
            placeholder="0x..."
          >
          <p class="text-xs text-gray-500">
            Address: <span id="subDeployerAddress" class="font-mono text-xs">-</span>
          </p>
          <button id="deploySubContractBtn" class="mt-3 bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600">
            Deploy SubVoting Contract
          </button>
          <div id="subDeployStatus" class="mt-3 hidden"></div>

          <!-- Deployed Address Display -->
          <div id="subDeployedAddressDisplay" class="mt-4 hidden p-3 bg-green-50 border border-green-200 rounded">
            <p class="text-sm font-semibold text-green-800 mb-1">Deployed Contract:</p>
            <p id="newSubContractAddress" class="text-xs font-mono break-all"></p>
            <button id="useSubDeployedAddressBtn" class="mt-2 text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
              Use This Address
            </button>
          </div>
        </div>

        <!-- Owner Settings -->
        <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 class="text-md font-semibold text-blue-800 mb-3">Owner Settings</h3>
          <label class="block text-sm font-medium text-gray-700 mb-2">Owner Private Key (0x...)</label>
          <input
            type="text"
            id="subOwnerPrivateKey"
            class="w-full px-3 py-2 border rounded-md text-xs font-mono mb-2"
            placeholder="0x..."
          >
          <p class="text-xs text-gray-500">
            Address: <span id="subOwnerAddress" class="font-mono text-xs">-</span>
          </p>
        </div>

        <!-- Executor Registration -->
        <div class="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 class="text-md font-semibold text-yellow-800 mb-3">Executor Registration</h3>
          <label class="block text-sm font-medium text-gray-700 mb-2">Executor Address</label>
          <input
            type="text"
            id="subExecutorAddressToSet"
            class="w-full px-3 py-2 border rounded-md text-xs font-mono mb-2"
            placeholder="0x..."
          >
          <button id="setSubExecutorBtn" class="mt-2 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">
            Set Executor
          </button>
          <div id="subExecutorSetStatus" class="mt-3 hidden"></div>
        </div>

        <!-- Question Registration -->
        <div class="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 class="text-md font-semibold text-green-800 mb-3">Question Registration</h3>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Mission ID</label>
              <input type="number" id="questionMissionId" class="w-full px-3 py-2 border rounded-md" value="1">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Question ID</label>
              <input type="number" id="questionId" class="w-full px-3 py-2 border rounded-md" value="1">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
              <input type="text" id="questionText" class="w-full px-3 py-2 border rounded-md" value="좋아하는 아티스트는?">
            </div>
          </div>
          <button id="registerQuestionBtn" class="mt-3 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
            Register Question
          </button>
          <div id="questionStatus" class="mt-3 hidden"></div>
        </div>

        <!-- Option Registration -->
        <div class="mb-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
          <h3 class="text-md font-semibold text-pink-800 mb-3">Option Registration</h3>
          <div class="grid grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Mission ID</label>
              <input type="number" id="optionMissionId" class="w-full px-3 py-2 border rounded-md" value="1">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Question ID</label>
              <input type="number" id="optionQuestionId" class="w-full px-3 py-2 border rounded-md" value="1">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Option ID</label>
              <input type="number" id="optionId" class="w-full px-3 py-2 border rounded-md" value="1">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Option Text</label>
              <input type="text" id="optionText" class="w-full px-3 py-2 border rounded-md" value="아티스트 A">
            </div>
          </div>
          <button id="registerOptionBtn" class="mt-3 bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600">
            Register Option
          </button>
          <div id="optionStatus" class="mt-3 hidden"></div>
        </div>
      </div>
    `;
  }

  /**
   * Initialize event listeners
   */
  init(): void {
    super.init();
    this.loadBytecode();
    this.attachEventListeners();
  }

  /**
   * Load SubVoting bytecode from file
   */
  private async loadBytecode(): Promise<void> {
    try {
      const response = await fetch(SUBVOTING_BYTECODE_FILE);
      this.bytecode = await response.text();
    } catch (error) {
      console.error('Failed to load SubVoting bytecode:', error);
      this.bytecode = '';
    }
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Deployer wallet input
    UIHelper.safeAddEventListener('subDeployerPrivateKey', 'input', () => {
      this.updateDeployerWallet();
    });

    // Deploy button
    UIHelper.safeAddEventListener('deploySubContractBtn', 'click', () => {
      void this.deployContract();
    });

    // Use deployed address button
    UIHelper.safeAddEventListener('useSubDeployedAddressBtn', 'click', () => {
      this.applyDeployedAddress();
    });

    // Owner wallet input
    UIHelper.safeAddEventListener('subOwnerPrivateKey', 'input', () => {
      this.updateOwnerWallet();
    });

    // Set executor button
    UIHelper.safeAddEventListener('setSubExecutorBtn', 'click', () => {
      void this.setExecutor();
    });

    // Register question button
    UIHelper.safeAddEventListener('registerQuestionBtn', 'click', () => {
      void this.registerQuestion();
    });

    // Register option button
    UIHelper.safeAddEventListener('registerOptionBtn', 'click', () => {
      void this.registerOption();
    });
  }

  /**
   * Update deployer wallet address display
   */
  private updateDeployerWallet(): void {
    const privateKey = UIHelper.getInputValue('subDeployerPrivateKey').trim();

    if (!privateKey) {
      this.deployerWallet = null;
      UIHelper.showValue('subDeployerAddress', '-');
      return;
    }

    try {
      this.deployerWallet = new WalletAdapter(privateKey as `0x${string}`);
      UIHelper.showValue('subDeployerAddress', this.deployerWallet.address);
    } catch (error) {
      console.error('SubVoting deployer wallet initialization failed:', error);
      this.deployerWallet = null;
      UIHelper.showValue('subDeployerAddress', '-');
    }
  }

  /**
   * Update owner wallet address display
   */
  private updateOwnerWallet(): void {
    const privateKey = UIHelper.getInputValue('subOwnerPrivateKey').trim();

    if (!privateKey) {
      UIHelper.showValue('subOwnerAddress', '-');
      return;
    }

    try {
      const wallet = new WalletAdapter(privateKey as `0x${string}`);
      UIHelper.showValue('subOwnerAddress', wallet.address);
    } catch (error) {
      console.error('SubVoting owner wallet initialization failed:', error);
      UIHelper.showValue('subOwnerAddress', '-');
    }
  }

  /**
   * Deploy SubVoting contract
   */
  private async deployContract(): Promise<void> {
    try {
      if (!this.deployerWallet) {
        this.showStatus('Please enter deployer private key first', 'error', 'subDeployStatus');
        return;
      }

      if (!this.bytecode) {
        this.showStatus('Bytecode not loaded. Please refresh the page.', 'error', 'subDeployStatus');
        return;
      }

      this.showStatus('[DEPLOY] Deploying SubVoting contract...', 'info', 'subDeployStatus');

      const account = privateKeyToAccount(UIHelper.getInputValue('subDeployerPrivateKey') as `0x${string}`);
      const walletClient = createWalletClient({
        account,
        chain: opBNBTestnet,
        transport: http(),
      });

      const publicClient = createPublicClient({
        chain: opBNBTestnet,
        transport: http(),
      });

      // Deploy contract with constructor arg (initialOwner)
      const hash = await walletClient.deployContract({
        abi: SETUP_ABI,
        bytecode: this.bytecode as `0x${string}`,
        args: [account.address],
      });

      this.showStatus(`[TX] Transaction sent. Waiting...\nTX: ${hash}`, 'info', 'subDeployStatus');

      // Wait for deployment
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (!receipt.contractAddress) {
        throw new Error('Contract address not found in receipt');
      }

      this.deployedAddress = receipt.contractAddress;

      // Update UI
      this.showStatus(`[SUCCESS] Deployment complete!\nAddress: ${this.deployedAddress}`, 'success', 'subDeployStatus');

      const displayEl = document.getElementById('subDeployedAddressDisplay');
      const addressEl = document.getElementById('newSubContractAddress');
      const useBtn = document.getElementById('useSubDeployedAddressBtn');

      if (displayEl) displayEl.classList.remove('hidden');
      if (addressEl) addressEl.textContent = this.deployedAddress;
      if (useBtn) useBtn.classList.remove('hidden');

      // Auto-apply deployed address
      this.applyDeployedAddress();

    } catch (error) {
      console.error('SubVoting contract deployment failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.showStatus(`[ERROR] Deployment failed: ${message}`, 'error', 'subDeployStatus');
    }
  }

  /**
   * Apply deployed address to SubVoting contract address field
   */
  private applyDeployedAddress(): void {
    if (!this.deployedAddress) {
      console.error('No deployed address');
      return;
    }

    // Update SubVoting contract address in state
    this.state.setState({ subContractAddress: this.deployedAddress });

    this.showStatus(`[SUCCESS] SubVoting contract address updated: ${this.deployedAddress}`, 'success', 'subDeployStatus');
  }

  /**
   * Set executor signer
   */
  private async setExecutor(): Promise<void> {
    try {
      const privateKey = UIHelper.getInputValue('subOwnerPrivateKey').trim();
      if (!privateKey) {
        this.showStatus('Please enter Owner private key first', 'error', 'subExecutorSetStatus');
        return;
      }

      const { subContractAddress } = this.state.getState();
      if (!subContractAddress) {
        this.showStatus('Please deploy or set SubVoting contract address first', 'error', 'subExecutorSetStatus');
        return;
      }

      const executorAddress = UIHelper.getInputValue('subExecutorAddressToSet').trim();
      if (!executorAddress) {
        this.showStatus('Please enter Executor address', 'error', 'subExecutorSetStatus');
        return;
      }

      this.showStatus('Setting executor...', 'info', 'subExecutorSetStatus');

      const account = privateKeyToAccount(privateKey as `0x${string}`);
      const walletClient = createWalletClient({
        account,
        chain: opBNBTestnet,
        transport: http(),
      });

      const publicClient = createPublicClient({
        chain: opBNBTestnet,
        transport: http(),
      });

      const hash = await walletClient.writeContract({
        address: subContractAddress,
        abi: SETUP_ABI,
        functionName: 'setExecutorSigner',
        args: [executorAddress as Address],
      });

      this.showStatus(`Transaction sent. Waiting... (${hash.substring(0, 10)}...)`, 'info', 'subExecutorSetStatus');

      await publicClient.waitForTransactionReceipt({ hash });
      this.showStatus(`[SUCCESS] Executor set!\nTX: ${hash}`, 'success', 'subExecutorSetStatus');

    } catch (error) {
      console.error('Set executor failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.showStatus(`[ERROR] ${message}`, 'error', 'subExecutorSetStatus');
    }
  }

  /**
   * Register question
   */
  private async registerQuestion(): Promise<void> {
    try {
      const privateKey = UIHelper.getInputValue('subOwnerPrivateKey').trim();
      if (!privateKey) {
        this.showStatus('Please enter Owner private key first', 'error', 'questionStatus');
        return;
      }

      const { subContractAddress } = this.state.getState();
      if (!subContractAddress) {
        this.showStatus('Please deploy or set SubVoting contract address first', 'error', 'questionStatus');
        return;
      }

      const missionId = BigInt(UIHelper.getInputValue('questionMissionId'));
      const questionId = BigInt(UIHelper.getInputValue('questionId'));
      const text = UIHelper.getInputValue('questionText').trim();

      if (!text) {
        this.showStatus('Please enter question text', 'error', 'questionStatus');
        return;
      }

      this.showStatus('Registering question...', 'info', 'questionStatus');

      const account = privateKeyToAccount(privateKey as `0x${string}`);
      const walletClient = createWalletClient({
        account,
        chain: opBNBTestnet,
        transport: http(),
      });

      const publicClient = createPublicClient({
        chain: opBNBTestnet,
        transport: http(),
      });

      const hash = await walletClient.writeContract({
        address: subContractAddress,
        abi: SETUP_ABI,
        functionName: 'setQuestion',
        args: [missionId, questionId, text, true],
      });

      this.showStatus(`Transaction sent. Waiting... (${hash.substring(0, 10)}...)`, 'info', 'questionStatus');

      await publicClient.waitForTransactionReceipt({ hash });
      this.showStatus(`[SUCCESS] Question registered!\nText: ${text}\nMission ID: ${missionId}\nQuestion ID: ${questionId}\nTX: ${hash}`, 'success', 'questionStatus');

    } catch (error) {
      console.error('Register question failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.showStatus(`[ERROR] ${message}`, 'error', 'questionStatus');
    }
  }

  /**
   * Register option
   */
  private async registerOption(): Promise<void> {
    try {
      const privateKey = UIHelper.getInputValue('subOwnerPrivateKey').trim();
      if (!privateKey) {
        this.showStatus('Please enter Owner private key first', 'error', 'optionStatus');
        return;
      }

      const { subContractAddress } = this.state.getState();
      if (!subContractAddress) {
        this.showStatus('Please deploy or set SubVoting contract address first', 'error', 'optionStatus');
        return;
      }

      const missionId = BigInt(UIHelper.getInputValue('optionMissionId'));
      const questionId = BigInt(UIHelper.getInputValue('optionQuestionId'));
      const optionId = BigInt(UIHelper.getInputValue('optionId'));
      const text = UIHelper.getInputValue('optionText').trim();

      if (!text) {
        this.showStatus('Please enter option text', 'error', 'optionStatus');
        return;
      }

      this.showStatus('Registering option...', 'info', 'optionStatus');

      const account = privateKeyToAccount(privateKey as `0x${string}`);
      const walletClient = createWalletClient({
        account,
        chain: opBNBTestnet,
        transport: http(),
      });

      const publicClient = createPublicClient({
        chain: opBNBTestnet,
        transport: http(),
      });

      const hash = await walletClient.writeContract({
        address: subContractAddress,
        abi: SETUP_ABI,
        functionName: 'setOption',
        args: [missionId, questionId, optionId, text, true],
      });

      this.showStatus(`Transaction sent. Waiting... (${hash.substring(0, 10)}...)`, 'info', 'optionStatus');

      await publicClient.waitForTransactionReceipt({ hash });
      this.showStatus(`[SUCCESS] Option registered!\nText: ${text}\nMission ID: ${missionId}\nQuestion ID: ${questionId}\nOption ID: ${optionId}\nTX: ${hash}`, 'success', 'optionStatus');

    } catch (error) {
      console.error('Register option failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.showStatus(`[ERROR] ${message}`, 'error', 'optionStatus');
    }
  }

  /**
   * Show status message
   */
  private showStatus(message: string, type: StatusType, elementId: string): void {
    const element = document.getElementById(elementId);
    if (!element) return;

    const statusType = type === 'info' ? 'loading' : type;
    UIHelper.showStatusWithIcon(elementId, message, statusType);
    element.style.whiteSpace = 'pre-line';
  }
}
