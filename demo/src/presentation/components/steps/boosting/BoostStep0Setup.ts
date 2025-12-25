/**
 * BOOST STEP 0: Boosting Contract Deployment and Setup
 *
 * Boosting 컨트랙트 배포 및 초기 설정 컴포넌트
 * - Contract deployment
 * - Owner authorization
 * - Executor registration
 * - Boosting Type configuration
 * - Artist registration
 */

import { BaseStep } from '../../BaseStep';
import { WalletAdapter } from '../../../../infrastructure/viem/WalletAdapter';
import { createPublicClient, createWalletClient, http, type Address } from 'viem';
import { opBNBTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import * as UIHelper from '../../../utils/UIHelper';

// Boosting Bytecode (embedded) - 실제 값은 빌드 후 업데이트 필요
const BOOSTING_BYTECODE = "0x60806040523480156..." as const; // TODO: 실제 bytecode로 교체

// Boosting ABI (minimal for deployment and setup)
const SETUP_ABI = [
  'constructor(address initialOwner)',
  'function setExecutorSigner(address _executorSigner)',
  'function setBoostingTypeName(uint8 boostType, string memory name)',
  'function setArtist(uint256 missionId, uint256 optionId, string memory name, bool allowed)',
] as const;

type StatusType = 'success' | 'error' | 'info';

/**
 * BoostStep 0: Boosting Contract Deployment and Setup Component
 */
export class BoostStep0Setup extends BaseStep {
  private deployerWallet: WalletAdapter | null = null;
  private deployedAddress: Address | null = null;

  /**
   * Render Step 0 UI
   */
  render(): string {
    return `
      <div id="boostStep0" class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-purple-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-purple-500">BOOST STEP 0</span>
          Boosting Contract Deployment & Setup
        </h2>
        <p class="text-sm text-gray-600 mb-4">Boosting 컨트랙트 배포 및 초기 설정을 진행합니다</p>

        <!-- Boosting 특징 안내 -->
        <div class="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <h3 class="text-md font-semibold text-purple-800 mb-2">
            <i data-lucide="zap" class="w-4 h-4 inline"></i> Boosting Contract 특징
          </h3>
          <ul class="text-xs text-gray-700 space-y-1">
            <li>• <strong>단일 레코드 배치:</strong> 각 UserBoostBatch는 1개의 레코드만 포함</li>
            <li>• <strong>BP/CELB 지원:</strong> boostingWith (0=BP, 1=CELB)</li>
            <li>• <strong>amt 필드:</strong> 부스팅 포인트/토큰 수량</li>
            <li>• <strong>집계 방식:</strong> artistBpAmt, artistCelbAmt, artistTotalAmt</li>
          </ul>
        </div>

        <!-- Deployer Wallet -->
        <div class="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h3 class="text-md font-semibold text-purple-800 mb-3">Deployer Wallet</h3>
          <label class="block text-sm font-medium text-gray-700 mb-2">Private Key (0x...)</label>
          <input
            type="text"
            id="boostDeployerPrivateKey"
            class="w-full px-3 py-2 border rounded-md text-xs font-mono mb-2"
            placeholder="0x..."
          >
          <p class="text-xs text-gray-500">
            Address: <span id="boostDeployerAddress" class="font-mono text-xs">-</span>
          </p>
          <button id="boostDeployContractBtn" class="mt-3 bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600">
            Deploy Boosting Contract
          </button>
          <div id="boostDeployStatus" class="mt-3 hidden"></div>

          <!-- Deployed Address Display -->
          <div id="boostDeployedAddressDisplay" class="mt-4 hidden p-3 bg-green-50 border border-green-200 rounded">
            <p class="text-sm font-semibold text-green-800 mb-1">Deployed Boosting Contract:</p>
            <p id="boostNewContractAddress" class="text-xs font-mono break-all"></p>
            <button id="boostUseDeployedAddressBtn" class="mt-2 text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
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
            id="boostOwnerPrivateKey"
            class="w-full px-3 py-2 border rounded-md text-xs font-mono mb-2"
            placeholder="0x..."
          >
          <p class="text-xs text-gray-500">
            Address: <span id="boostOwnerAddress" class="font-mono text-xs">-</span>
          </p>
        </div>

        <!-- Executor Registration -->
        <div class="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 class="text-md font-semibold text-yellow-800 mb-3">Executor Registration</h3>
          <label class="block text-sm font-medium text-gray-700 mb-2">Executor Address</label>
          <input
            type="text"
            id="boostExecutorAddressToSet"
            class="w-full px-3 py-2 border rounded-md text-xs font-mono mb-2"
            placeholder="0x..."
          >
          <button id="boostSetExecutorBtn" class="mt-2 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">
            Set Executor
          </button>
          <div id="boostExecutorSetStatus" class="mt-3 hidden"></div>
        </div>

        <!-- Boosting Type Names -->
        <div class="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 class="text-md font-semibold text-green-800 mb-3">Boosting Type Names</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Type 0 (BP - Boosting Point)</label>
              <input
                type="text"
                id="boostTypeName0"
                class="w-full px-3 py-2 border rounded-md text-sm"
                value="BP"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Type 1 (CELB - Celebus Token)</label>
              <input
                type="text"
                id="boostTypeName1"
                class="w-full px-3 py-2 border rounded-md text-sm"
                value="CELB"
              >
            </div>
          </div>
          <button id="boostSetTypeBtn" class="mt-3 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
            Set Boosting Types
          </button>
          <div id="boostTypeStatus" class="mt-3 hidden"></div>
        </div>

        <!-- Artist Registration -->
        <div class="mb-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
          <h3 class="text-md font-semibold text-pink-800 mb-3">Artist Registration</h3>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Mission ID</label>
              <input type="number" id="boostCandidateMissionId" class="w-full px-3 py-2 border rounded-md" value="1">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Artist ID</label>
              <input type="number" id="boostCandidateArtistId" class="w-full px-3 py-2 border rounded-md" value="1">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input type="text" id="boostCandidateName" class="w-full px-3 py-2 border rounded-md" value="Artist A">
            </div>
          </div>
          <button id="boostRegisterArtistBtn" class="mt-3 bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600">
            Register Artist
          </button>
          <div id="boostCandidateStatus" class="mt-3 hidden"></div>
        </div>
      </div>
    `;
  }

  /**
   * Initialize event listeners
   */
  init(): void {
    super.init();
    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Deployer wallet input
    UIHelper.safeAddEventListener('boostDeployerPrivateKey', 'input', () => {
      this.updateDeployerWallet();
    });

    // Deploy button
    UIHelper.safeAddEventListener('boostDeployContractBtn', 'click', () => {
      void this.deployContract();
    });

    // Use deployed address button
    UIHelper.safeAddEventListener('boostUseDeployedAddressBtn', 'click', () => {
      this.applyDeployedAddress();
    });

    // Owner wallet input
    UIHelper.safeAddEventListener('boostOwnerPrivateKey', 'input', () => {
      this.updateOwnerWallet();
    });

    // Set executor button
    UIHelper.safeAddEventListener('boostSetExecutorBtn', 'click', () => {
      void this.setExecutor();
    });

    // Set boosting type button
    UIHelper.safeAddEventListener('boostSetTypeBtn', 'click', () => {
      void this.setBoostingTypeNames();
    });

    // Register artist button
    UIHelper.safeAddEventListener('boostRegisterArtistBtn', 'click', () => {
      void this.registerArtist();
    });
  }

  /**
   * Update deployer wallet address display
   */
  private updateDeployerWallet(): void {
    const privateKey = UIHelper.getInputValue('boostDeployerPrivateKey').trim();

    if (!privateKey) {
      this.deployerWallet = null;
      UIHelper.showValue('boostDeployerAddress', '-');
      return;
    }

    try {
      this.deployerWallet = new WalletAdapter(privateKey as `0x${string}`);
      UIHelper.showValue('boostDeployerAddress', this.deployerWallet.address);
    } catch (error) {
      console.error('Deployer wallet initialization failed:', error);
      this.deployerWallet = null;
      UIHelper.showValue('boostDeployerAddress', '-');
    }
  }

  /**
   * Update owner wallet address display
   */
  private updateOwnerWallet(): void {
    const privateKey = UIHelper.getInputValue('boostOwnerPrivateKey').trim();

    if (!privateKey) {
      this.state.setState({ ownerWallet: null });
      UIHelper.showValue('boostOwnerAddress', '-');
      return;
    }

    try {
      const wallet = new WalletAdapter(privateKey as `0x${string}`);
      this.state.setState({ ownerWallet: wallet });
      UIHelper.showValue('boostOwnerAddress', wallet.address);
    } catch (error) {
      console.error('Owner wallet initialization failed:', error);
      this.showStatus('Invalid private key', 'error', 'boostOwnerWalletStatus');
      this.state.setState({ ownerWallet: null });
      UIHelper.showValue('boostOwnerAddress', '-');
    }
  }

  /**
   * Deploy Boosting contract
   */
  private async deployContract(): Promise<void> {
    try {
      if (!this.deployerWallet) {
        this.showStatus('Please enter deployer private key first', 'error', 'boostDeployStatus');
        return;
      }

      this.showStatus('[DEPLOY] Deploying Boosting contract...', 'info', 'boostDeployStatus');

      const account = privateKeyToAccount(UIHelper.getInputValue('boostDeployerPrivateKey') as `0x${string}`);
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
        bytecode: BOOSTING_BYTECODE,
        args: [account.address],
      });

      this.showStatus(`[TX] Transaction sent. Waiting...\nTX: ${hash}`, 'info', 'boostDeployStatus');

      // Wait for deployment
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (!receipt.contractAddress) {
        throw new Error('Contract address not found in receipt');
      }

      this.deployedAddress = receipt.contractAddress;

      // Update UI
      this.showStatus(`[SUCCESS] Deployment complete!\nAddress: ${this.deployedAddress}`, 'success', 'boostDeployStatus');

      const displayEl = document.getElementById('boostDeployedAddressDisplay');
      const addressEl = document.getElementById('boostNewContractAddress');
      const useBtn = document.getElementById('boostUseDeployedAddressBtn');

      if (displayEl) displayEl.classList.remove('hidden');
      if (addressEl) addressEl.textContent = this.deployedAddress;
      if (useBtn) useBtn.classList.remove('hidden');

      // Auto-apply deployed address
      this.applyDeployedAddress();

    } catch (error) {
      console.error('Contract deployment failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.showStatus(`[ERROR] Deployment failed: ${message}`, 'error', 'boostDeployStatus');
    }
  }

  /**
   * Apply deployed address to contract address field
   */
  private applyDeployedAddress(): void {
    if (!this.deployedAddress) {
      console.error('No deployed address');
      return;
    }

    // Update contract address input
    UIHelper.setInputValue('contractAddress', this.deployedAddress);

    // Trigger input event for other components
    const contractInput = document.getElementById('contractAddress') as HTMLInputElement | null;
    contractInput?.dispatchEvent(new Event('input', { bubbles: true }));

    // Update state
    this.state.setState({ contractAddress: this.deployedAddress });

    this.showStatus(`[SUCCESS] Contract address updated: ${this.deployedAddress}`, 'success', 'boostDeployStatus');
  }

  /**
   * Set executor signer
   */
  private async setExecutor(): Promise<void> {
    try {
      const { ownerWallet, contractAddress } = this.state.getState();

      if (!ownerWallet) {
        this.showStatus('Please enter Owner private key first', 'error', 'boostExecutorSetStatus');
        return;
      }

      if (!contractAddress) {
        this.showStatus('Please deploy or set contract address first', 'error', 'boostExecutorSetStatus');
        return;
      }

      const executorAddress = UIHelper.getInputValue('boostExecutorAddressToSet').trim();
      if (!executorAddress) {
        this.showStatus('Please enter Executor address', 'error', 'boostExecutorSetStatus');
        return;
      }

      this.showStatus('Setting executor...', 'info', 'boostExecutorSetStatus');

      const account = privateKeyToAccount(UIHelper.getInputValue('boostOwnerPrivateKey') as `0x${string}`);
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
        address: contractAddress,
        abi: SETUP_ABI,
        functionName: 'setExecutorSigner',
        args: [executorAddress as Address],
      });

      this.showStatus(`Transaction sent. Waiting... (${hash.substring(0, 10)}...)`, 'info', 'boostExecutorSetStatus');

      await publicClient.waitForTransactionReceipt({ hash });
      this.showStatus(`[SUCCESS] Executor set!\nTX: ${hash}`, 'success', 'boostExecutorSetStatus');

    } catch (error) {
      console.error('Set executor failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.showStatus(`[ERROR] ${message}`, 'error', 'boostExecutorSetStatus');
    }
  }

  /**
   * Set boosting type names
   */
  private async setBoostingTypeNames(): Promise<void> {
    try {
      const { ownerWallet, contractAddress } = this.state.getState();

      if (!ownerWallet) {
        this.showStatus('Please enter Owner private key first', 'error', 'boostTypeStatus');
        return;
      }

      if (!contractAddress) {
        this.showStatus('Please deploy or set contract address first', 'error', 'boostTypeStatus');
        return;
      }

      const name0 = UIHelper.getInputValue('boostTypeName0').trim();
      const name1 = UIHelper.getInputValue('boostTypeName1').trim();

      if (!name0 || !name1) {
        this.showStatus('Please enter both boosting type names', 'error', 'boostTypeStatus');
        return;
      }

      this.showStatus('Setting boosting type names...', 'info', 'boostTypeStatus');

      const account = privateKeyToAccount(UIHelper.getInputValue('boostOwnerPrivateKey') as `0x${string}`);
      const walletClient = createWalletClient({
        account,
        chain: opBNBTestnet,
        transport: http(),
      });

      const publicClient = createPublicClient({
        chain: opBNBTestnet,
        transport: http(),
      });

      // Set type 0
      const hash0 = await walletClient.writeContract({
        address: contractAddress,
        abi: SETUP_ABI,
        functionName: 'setBoostingTypeName',
        args: [0, name0],
      });

      this.showStatus(`Type 0 setting... (${hash0.substring(0, 10)}...)`, 'info', 'boostTypeStatus');
      await publicClient.waitForTransactionReceipt({ hash: hash0 });

      // Set type 1
      const hash1 = await walletClient.writeContract({
        address: contractAddress,
        abi: SETUP_ABI,
        functionName: 'setBoostingTypeName',
        args: [1, name1],
      });

      this.showStatus(`Type 1 setting... (${hash1.substring(0, 10)}...)`, 'info', 'boostTypeStatus');
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      this.showStatus(`[SUCCESS] Boosting type names set!\n0: ${name0}\n1: ${name1}`, 'success', 'boostTypeStatus');

    } catch (error) {
      console.error('Set boosting type failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.showStatus(`[ERROR] ${message}`, 'error', 'boostTypeStatus');
    }
  }

  /**
   * Register artist
   */
  private async registerArtist(): Promise<void> {
    try {
      const { ownerWallet, contractAddress } = this.state.getState();

      if (!ownerWallet) {
        this.showStatus('Please enter Owner private key first', 'error', 'boostCandidateStatus');
        return;
      }

      if (!contractAddress) {
        this.showStatus('Please deploy or set contract address first', 'error', 'boostCandidateStatus');
        return;
      }

      const missionId = BigInt(UIHelper.getInputValue('boostCandidateMissionId'));
      const artistId = BigInt(UIHelper.getInputValue('boostCandidateArtistId'));
      const name = UIHelper.getInputValue('boostCandidateName').trim();

      if (!name) {
        this.showStatus('Please enter artist name', 'error', 'boostCandidateStatus');
        return;
      }

      this.showStatus('Registering artist...', 'info', 'boostCandidateStatus');

      const account = privateKeyToAccount(UIHelper.getInputValue('boostOwnerPrivateKey') as `0x${string}`);
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
        address: contractAddress,
        abi: SETUP_ABI,
        functionName: 'setArtist',
        args: [missionId, artistId, name, true],
      });

      this.showStatus(`Transaction sent. Waiting... (${hash.substring(0, 10)}...)`, 'info', 'boostCandidateStatus');

      await publicClient.waitForTransactionReceipt({ hash });
      this.showStatus(`[SUCCESS] Artist registered!\nName: ${name}\nMission ID: ${missionId}\nArtist ID: ${artistId}\nTX: ${hash}`, 'success', 'boostCandidateStatus');

    } catch (error) {
      console.error('Register artist failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.showStatus(`[ERROR] ${message}`, 'error', 'boostCandidateStatus');
    }
  }

  /**
   * Show status message
   */
  private showStatus(message: string, type: StatusType, elementId: string): void {
    const element = document.getElementById(elementId);
    if (!element) return;

    const bgColor = type === 'success' ? 'bg-green-100 border-green-300' :
                    type === 'error' ? 'bg-red-100 border-red-300' :
                    'bg-blue-100 border-blue-300';

    const textColor = type === 'success' ? 'text-green-700' :
                      type === 'error' ? 'text-red-700' :
                      'text-blue-700';

    element.className = `mt-2 p-3 rounded-md border ${bgColor} ${textColor}`;
    element.style.whiteSpace = 'pre-line';
    element.textContent = message;
    element.classList.remove('hidden');
  }
}
