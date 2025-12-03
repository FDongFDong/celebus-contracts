/**
 * CelebusNFT Demo Main Application
 * 앱 초기화, 지갑 연결, 탭 전환, 컨트랙트 인스턴스 관리
 */

import { CONFIG, parseContractError, getExplorerTxUrl, formatAddress } from './config.js';
import { initInfoTab } from './tabs/info.js';
import { initMintingTab } from './tabs/minting.js';
import { initApprovalTab } from './tabs/approval.js';
import { initTransferTab } from './tabs/transfer.js';
import { initAdminTab } from './tabs/admin.js';

class CelebusNFTApp {
  constructor() {
    // State
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.readContract = null;
    this.connectedAddress = null;
    this.isOwner = false;
    this.contractAddress = null;
    this.isDisconnected = false; // 수동 연결 해제 플래그

    // Initialize
    this.init();
  }

  async init() {
    console.log('CelebusNFT Demo Initializing...');

    // Setup event listeners
    this.setupEventListeners();

    // Setup tab navigation
    this.setupTabNavigation();

    // Initialize all tabs
    this.initializeTabs();

    // Restore saved contract address
    const savedContractAddress = localStorage.getItem('nft_demo_contract_address');
    if (savedContractAddress) {
      document.getElementById('contractAddress').value = savedContractAddress;
      this.contractAddress = savedContractAddress;
    }

    // Check if already connected (e.g., page refresh)
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          await this.connectWallet();
        } else if (savedContractAddress) {
          // 지갑 미연결 상태에서도 읽기 전용으로 컨트랙트 로드
          await this.loadContract(true);
        }
      } catch (error) {
        console.log('Auto-connect check failed:', error);
      }
    } else if (savedContractAddress) {
      // MetaMask 없어도 읽기 전용으로 컨트랙트 로드
      await this.loadContract(true);
    }

    console.log('CelebusNFT Demo Ready!');
  }

  setupEventListeners() {
    // Wallet connection
    document.getElementById('connectWalletBtn').addEventListener('click', () => this.connectWallet());
    document.getElementById('disconnectBtn')?.addEventListener('click', () => this.disconnectWallet());

    // Contract loading
    document.getElementById('loadContractBtn').addEventListener('click', () => this.loadContract());

    // Handle Enter key on contract address input
    document.getElementById('contractAddress').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.loadContract();
    });

    // MetaMask events
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.disconnectWallet();
        } else {
          this.connectWallet();
        }
      });

      window.ethereum.on('chainChanged', async () => {
        // 네트워크 변경 시 지갑 재연결 (컨트랙트 유지)
        if (!this.isDisconnected) {
          await this.connectWallet();
        }
      });
    }
  }

  setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.dataset.tab;
        this.switchTab(tabId);
      });
    });
  }

  switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.add('hidden');
    });

    // Remove active from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(`tab-${tabId}`);
    if (selectedTab) {
      selectedTab.classList.remove('hidden');
    }

    // Activate button
    const selectedBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add('active');
    }
  }

  initializeTabs() {
    // Pass app instance to each tab
    initInfoTab(this);
    initMintingTab(this);
    initApprovalTab(this);
    initTransferTab(this);
    initAdminTab(this);
  }

  async connectWallet() {
    if (!window.ethereum) {
      this.showToast('MetaMask가 설치되어 있지 않습니다', 'error');
      return;
    }

    // 수동 해제 플래그 초기화
    this.isDisconnected = false;

    try {
      // Request accounts - 항상 새로 요청
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);

      // Check network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== CONFIG.CHAIN_ID) {
        await this.switchNetwork();
        return;
      }

      this.provider = provider;
      this.signer = await provider.getSigner();
      this.connectedAddress = await this.signer.getAddress();

      // Update UI
      this.updateWalletUI();

      // Reload contract if address is set (use stored address)
      if (this.contractAddress) {
        await this.loadContract(true);
      }

      this.showToast('지갑이 연결되었습니다', 'success');
    } catch (error) {
      console.error('Wallet connection error:', error);
      this.showToast('지갑 연결 실패: ' + error.message, 'error');
    }
  }

  async switchNetwork() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CONFIG.CHAIN_ID.toString(16)}` }]
      });
      // 네트워크 전환 성공 후 재연결 (chainChanged 이벤트가 처리함)
    } catch (switchError) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${CONFIG.CHAIN_ID.toString(16)}`,
              chainName: CONFIG.CHAIN_NAME,
              nativeCurrency: CONFIG.CURRENCY,
              rpcUrls: [CONFIG.RPC_URL],
              blockExplorerUrls: [CONFIG.EXPLORER_URL]
            }]
          });
          // 네트워크 추가 성공 후 재연결 (chainChanged 이벤트가 처리함)
        } catch (addError) {
          this.showToast('네트워크 추가 실패', 'error');
        }
      } else {
        this.showToast('네트워크 전환 실패', 'error');
      }
    }
  }

  async disconnectWallet() {
    // MetaMask 권한 해제 시도
    if (window.ethereum) {
      try {
        // wallet_revokePermissions로 연결 권한 해제
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        });
      } catch (error) {
        console.log('권한 해제 실패 (MetaMask가 지원하지 않을 수 있음):', error);
      }
    }

    // 앱 상태 초기화
    this.provider = null;
    this.signer = null;
    this.connectedAddress = null;
    this.isOwner = false;
    this.contract = null;
    this.isDisconnected = true; // 수동 해제 플래그

    // Update UI
    document.getElementById('walletInfo').classList.add('hidden');
    document.getElementById('walletBtnText').textContent = '지갑 연결';
    document.getElementById('isOwnerBadge').classList.add('hidden');

    this.showToast('지갑 연결이 해제되었습니다', 'info');
  }

  async updateWalletUI() {
    if (!this.connectedAddress) return;

    // Show wallet info
    document.getElementById('walletInfo').classList.remove('hidden');
    document.getElementById('connectedAddress').textContent = formatAddress(this.connectedAddress);
    document.getElementById('walletBtnText').textContent = '연결됨';

    // Get balance
    if (this.provider) {
      const balance = await this.provider.getBalance(this.connectedAddress);
      const formattedBalance = ethers.formatEther(balance);
      document.getElementById('walletBalance').textContent = parseFloat(formattedBalance).toFixed(4);
    }
  }

  async loadContract(useStoredAddress = false) {
    let address;

    if (useStoredAddress && this.contractAddress) {
      // 저장된 주소 사용 (지갑 재연결 시)
      address = this.contractAddress;
    } else {
      // 입력창에서 주소 가져오기
      const addressInput = document.getElementById('contractAddress');
      address = addressInput.value.trim();

      if (!address) {
        this.showToast('컨트랙트 주소를 입력해주세요', 'warning');
        return;
      }

      if (!ethers.isAddress(address)) {
        this.showToast('유효한 주소 형식이 아닙니다', 'error');
        return;
      }
    }

    try {
      this.contractAddress = address;

      // Save to localStorage for persistence
      localStorage.setItem('nft_demo_contract_address', address);

      // Create read-only contract (always available)
      const readProvider = this.provider || new ethers.JsonRpcProvider(CONFIG.RPC_URL);
      this.readContract = new ethers.Contract(address, CONFIG.ABI, readProvider);

      // Create write contract if connected
      if (this.signer) {
        this.contract = new ethers.Contract(address, CONFIG.ABI, this.signer);
      }

      // Check if connected user is owner
      await this.checkOwnership();

      this.showToast('컨트랙트가 로드되었습니다', 'success');

      // Trigger info refresh
      document.getElementById('refreshInfoBtn')?.click();
    } catch (error) {
      console.error('Contract load error:', error);
      this.showToast('컨트랙트 로드 실패: ' + parseContractError(error), 'error');
    }
  }

  async checkOwnership() {
    if (!this.readContract || !this.connectedAddress) {
      this.isOwner = false;
      return;
    }

    try {
      const owner = await this.readContract.owner();
      this.isOwner = owner.toLowerCase() === this.connectedAddress.toLowerCase();

      // Update UI
      const badge = document.getElementById('isOwnerBadge');
      if (this.isOwner) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    } catch (error) {
      console.error('Ownership check error:', error);
      this.isOwner = false;
    }
  }

  // Helper method to execute transactions
  async executeTransaction(method, args = [], options = {}) {
    if (!this.contract) {
      throw new Error('컨트랙트가 로드되지 않았습니다');
    }

    if (!this.signer) {
      throw new Error('지갑을 먼저 연결해주세요');
    }

    const tx = await this.contract[method](...args, options);
    const receipt = await tx.wait();
    return receipt;
  }

  // Toast notification system
  showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <i data-lucide="${this.getToastIcon(type)}" class="w-5 h-5 flex-shrink-0"></i>
        <span>${message}</span>
        <button class="ml-auto text-gray-400 hover:text-gray-600">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>
    `;

    // Close button event
    toast.querySelector('button').addEventListener('click', () => toast.remove());

    container.appendChild(toast);

    // Initialize Lucide icons in the new toast
    if (window.lucide) {
      window.lucide.createIcons({ nodes: [toast] });
    }

    // Auto remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  getToastIcon(type) {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'x-circle';
      case 'warning': return 'alert-triangle';
      default: return 'info';
    }
  }

  // Utility method for tabs to show results
  showResult(elementId, content, type = 'info') {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.classList.remove('hidden', 'success', 'error', 'pending');
    element.classList.add(type);
    element.innerHTML = content;
  }

  // Create explorer link for transaction
  createTxLink(txHash) {
    const url = getExplorerTxUrl(txHash);
    return `<a href="${url}" target="_blank" class="text-blue-600 hover:underline">Explorer에서 보기</a>`;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new CelebusNFTApp();
});

// Export for modules
export { CelebusNFTApp };
