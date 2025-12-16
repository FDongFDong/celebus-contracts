/**
 * STEP 0: 컨트랙트 초기 설정
 * 컨트랙트 배포, Executor 등록, Boosting Type, Artist를 설정합니다
 */

import { BOOSTING_BYTECODE, CONFIG } from '../config.js';

export class Step0Setup {
  constructor(state) {
    this.state = state;
    this.ownerWallet = null;
    this.deployerWallet = null;
  }

  // ========================================
  // 컨트랙트 배포 관련
  // ========================================

  /**
   * Deployer 지갑 초기화
   */
  loadDeployerWallet() {
    const pk = document.getElementById('deployerPrivateKey').value.trim();
    if (!pk || !pk.startsWith('0x')) {
      return;
    }

    try {
      const wallet = new ethers.Wallet(pk, this.state.provider);
      this.deployerWallet = wallet;
      this.state.deployerWallet = wallet;

      const deployerAddressSpan = document.getElementById('deployerAddress');
      if (deployerAddressSpan) {
        deployerAddressSpan.textContent = wallet.address;
      }

      console.log('✅ Deployer wallet loaded:', wallet.address);
    } catch (error) {
      console.error('❌ Failed to load deployer wallet:', error);
    }
  }

  /**
   * Boosting 컨트랙트 배포
   */
  async deployContract() {
    if (!this.state.deployerWallet) {
      this.loadDeployerWallet();
    }

    if (!this.state.deployerWallet) {
      this.showStatus('배포자 비밀키를 먼저 입력하세요', 'error', 'deployStatus');
      return;
    }

    const statusDiv = document.getElementById('deployStatus');
    statusDiv.className = 'mt-4 p-3 bg-blue-50 border border-blue-200 rounded';
    statusDiv.textContent = '⏳ Boosting 컨트랙트 배포 중...';
    statusDiv.classList.remove('hidden');

    try {
      // Boosting ABI (constructor: address initialOwner)
      const abi = ['constructor(address initialOwner)'];

      const factory = new ethers.ContractFactory(
        abi,
        BOOSTING_BYTECODE,
        this.state.deployerWallet
      );

      // Deploy with deployer address as initialOwner
      const contract = await factory.deploy(this.state.deployerWallet.address);

      statusDiv.textContent = `⏳ 트랜잭션 전송됨, 컨펌 대기 중...`;

      await contract.waitForDeployment();
      const deployedAddress = await contract.getAddress();

      // 성공 UI 표시
      document.getElementById('deployedAddress').textContent = deployedAddress;
      document.getElementById('deployedAddressDisplay').classList.remove('hidden');
      statusDiv.className = 'mt-4 p-3 bg-green-50 border border-green-200 rounded';
      statusDiv.textContent = `✅ 배포 완료! 주소: ${deployedAddress}`;

      console.log('✅ Boosting deployed at:', deployedAddress);
    } catch (error) {
      console.error('❌ Failed to deploy contract:', error);
      statusDiv.className = 'mt-4 p-3 bg-red-50 border border-red-200 rounded';
      statusDiv.textContent = `❌ 배포 실패: ${error.message}`;
    }
  }

  /**
   * 배포된 주소 적용
   */
  applyDeployedAddress() {
    const deployedAddress = document.getElementById('deployedAddress').textContent;
    if (!deployedAddress || deployedAddress === '-') {
      console.error('배포된 주소가 없습니다');
      return;
    }

    // 컨트랙트 주소 필드에 적용
    const contractAddressInput = document.getElementById('contractAddress');
    if (contractAddressInput) {
      contractAddressInput.value = deployedAddress;
      contractAddressInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // state 업데이트
    this.state.contractAddress = deployedAddress;

    // Owner 지갑도 deployer와 동일하게 설정 (배포자 = owner)
    const ownerPkInput = document.getElementById('ownerPrivateKey');
    const deployerPkInput = document.getElementById('deployerPrivateKey');
    if (ownerPkInput && deployerPkInput) {
      ownerPkInput.value = deployerPkInput.value;
      this.updateOwnerWallet();
    }

    // 상태 메시지 표시
    const statusDiv = document.getElementById('deployStatus');
    if (statusDiv) {
      statusDiv.className = 'mt-4 p-3 bg-green-50 border border-green-200 rounded';
      statusDiv.textContent = `✅ 컨트랙트 주소가 업데이트되었습니다: ${deployedAddress}`;
      statusDiv.classList.remove('hidden');
    }

    console.log('✅ Applied deployed address:', deployedAddress);
  }

  // ========================================
  // Owner 설정 관련
  // ========================================

  /**
   * Owner 지갑 초기화
   */
  updateOwnerWallet() {
    const privateKey = document.getElementById('ownerPrivateKey').value.trim();

    if (!privateKey) {
      this.ownerWallet = null;
      document.getElementById('ownerAddress').textContent = '-';
      return;
    }

    try {
      this.ownerWallet = new ethers.Wallet(privateKey, this.state.provider);
      document.getElementById('ownerAddress').textContent = this.ownerWallet.address;
      this.state.ownerWallet = this.ownerWallet;
    } catch (error) {
      console.error('Owner 지갑 초기화 실패:', error);
      this.showStatus('유효하지 않은 비밀키입니다', 'error', 'ownerWalletStatus');
      this.ownerWallet = null;
      document.getElementById('ownerAddress').textContent = '-';
    }
  }

  /**
   * Executor 등록
   */
  async setExecutor() {
    try {
      if (!this.ownerWallet) {
        this.showStatus('Owner 비밀키를 먼저 입력하세요', 'error', 'executorSetStatus');
        return;
      }

      const executorAddress = document.getElementById('executorAddressToSet').value.trim();

      if (!executorAddress || !ethers.isAddress(executorAddress)) {
        this.showStatus('유효한 Executor 주소를 입력하세요', 'error', 'executorSetStatus');
        return;
      }

      this.showStatus('Executor 등록 중...', 'info', 'executorSetStatus');

      const contract = new ethers.Contract(
        this.state.contractAddress,
        ['function setExecutorSigner(address _executorSigner)'],
        this.ownerWallet
      );

      const tx = await contract.setExecutorSigner(executorAddress);
      this.showStatus(`트랜잭션 전송됨. 대기 중... (${tx.hash.substring(0, 10)}...)`, 'info', 'executorSetStatus');

      await tx.wait();
      this.showStatus(`✅ Executor 등록 완료!\nTX: ${tx.hash}`, 'success', 'executorSetStatus');

    } catch (error) {
      console.error('Executor 등록 실패:', error);
      this.showStatus(`❌ 오류: ${error.message}`, 'error', 'executorSetStatus');
    }
  }

  /**
   * Boosting Type 이름 설정
   */
  async setBoostingTypeNames() {
    try {
      if (!this.ownerWallet) {
        this.showStatus('Owner 비밀키를 먼저 입력하세요', 'error', 'boostingTypeStatus');
        return;
      }

      const name0 = document.getElementById('boostingTypeName0').value.trim();
      const name1 = document.getElementById('boostingTypeName1').value.trim();

      if (!name0 || !name1) {
        this.showStatus('두 Boosting Type 이름을 모두 입력하세요', 'error', 'boostingTypeStatus');
        return;
      }

      this.showStatus('Boosting Type 이름 설정 중...', 'info', 'boostingTypeStatus');

      const contract = new ethers.Contract(
        this.state.contractAddress,
        ['function setBoostingTypeName(uint8 typeId, string memory name)'],
        this.ownerWallet
      );

      // Type 0 설정
      const tx0 = await contract.setBoostingTypeName(0, name0);
      this.showStatus(`Type 0 설정 중... (${tx0.hash.substring(0, 10)}...)`, 'info', 'boostingTypeStatus');
      await tx0.wait();

      // Type 1 설정
      const tx1 = await contract.setBoostingTypeName(1, name1);
      this.showStatus(`Type 1 설정 중... (${tx1.hash.substring(0, 10)}...)`, 'info', 'boostingTypeStatus');
      await tx1.wait();

      this.showStatus(`✅ Boosting Type 이름 설정 완료!\n0: ${name0}\n1: ${name1}`, 'success', 'boostingTypeStatus');

    } catch (error) {
      console.error('Boosting Type 설정 실패:', error);
      this.showStatus(`❌ 오류: ${error.message}`, 'error', 'boostingTypeStatus');
    }
  }

  /**
   * 아티스트 등록
   */
  async registerArtist() {
    try {
      if (!this.ownerWallet) {
        this.showStatus('Owner 비밀키를 먼저 입력하세요', 'error', 'artistStatus');
        return;
      }

      const missionId = parseInt(document.getElementById('artistMissionId').value);
      const artistId = parseInt(document.getElementById('artistArtistId').value);
      const name = document.getElementById('artistName').value.trim();

      if (isNaN(missionId) || isNaN(artistId) || !name) {
        this.showStatus('모든 필드를 올바르게 입력하세요', 'error', 'artistStatus');
        return;
      }

      this.showStatus('아티스트 등록 중...', 'info', 'artistStatus');

      const contract = new ethers.Contract(
        this.state.contractAddress,
        ['function setArtist(uint256 missionId, uint256 artistId, string memory name, bool allowed)'],
        this.ownerWallet
      );

      const tx = await contract.setArtist(missionId, artistId, name, true);
      this.showStatus(`트랜잭션 전송됨. 대기 중... (${tx.hash.substring(0, 10)}...)`, 'info', 'artistStatus');

      await tx.wait();
      this.showStatus(`✅ 아티스트 등록 완료!\n이름: ${name}\nMission ID: ${missionId}\nArtist ID: ${artistId}\nTX: ${tx.hash}`, 'success', 'artistStatus');

    } catch (error) {
      console.error('아티스트 등록 실패:', error);
      this.showStatus(`❌ 오류: ${error.message}`, 'error', 'artistStatus');
    }
  }

  /**
   * 상태 메시지 표시
   */
  showStatus(message, type, elementId) {
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

  /**
   * ABI JSON 다운로드
   */
  downloadAbi() {
    const abi = CONFIG.ABI;
    const blob = new Blob([JSON.stringify(abi, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Boosting-abi.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Bytecode 다운로드
   */
  downloadBytecode() {
    const blob = new Blob([BOOSTING_BYTECODE], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Boosting-bytecode.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Standard JSON Input 다운로드 (Etherscan 검증용)
   */
  async downloadStandardJsonInput() {
    try {
      const response = await fetch('./standard-json-input.json');
      if (!response.ok) throw new Error('파일을 찾을 수 없습니다');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'standard-json-input.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Standard JSON Input 다운로드 실패:', error);
      alert('Standard JSON Input 파일을 다운로드할 수 없습니다.\n로컬 서버에서 실행 중인지 확인하세요.');
    }
  }

  /**
   * Constructor Args 다운로드 (Etherscan 검증용)
   * constructor(address initialOwner) 형식의 ABI-encoded 인자
   */
  downloadConstructorArgs() {
    // 배포자 주소 가져오기
    let ownerAddress = this.deployerWallet?.address || this.state.deployerWallet?.address;

    if (!ownerAddress) {
      alert('배포자 지갑 주소가 필요합니다.\n배포자 비밀키를 먼저 입력하세요.');
      return;
    }

    // ABI-encode address (32 bytes, left-padded with zeros)
    const addressWithoutPrefix = ownerAddress.toLowerCase().replace('0x', '');
    const encodedArgs = '0x' + addressWithoutPrefix.padStart(64, '0');

    const blob = new Blob([encodedArgs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'constructor-args.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 이벤트 리스너 등록
   */
  attachEventListeners() {
    // Deployer 지갑 입력 변경 시
    const deployerPkInput = document.getElementById('deployerPrivateKey');
    if (deployerPkInput) {
      deployerPkInput.addEventListener('input', () => this.loadDeployerWallet());
    }

    // 컨트랙트 배포 버튼
    const deployContractBtn = document.getElementById('deployContractBtn');
    if (deployContractBtn) {
      deployContractBtn.addEventListener('click', () => this.deployContract());
    }

    // 배포된 주소 적용 버튼
    const useDeployedAddressBtn = document.getElementById('useDeployedAddressBtn');
    if (useDeployedAddressBtn) {
      useDeployedAddressBtn.addEventListener('click', () => this.applyDeployedAddress());
    }

    // Owner 지갑 입력 변경 시
    const ownerInput = document.getElementById('ownerPrivateKey');
    if (ownerInput) {
      ownerInput.addEventListener('input', () => this.updateOwnerWallet());
    }

    // Executor 등록 버튼
    const executorBtn = document.getElementById('setExecutorBtn');
    if (executorBtn) {
      executorBtn.addEventListener('click', () => this.setExecutor());
    }

    // Boosting Type 설정 버튼
    const boostingTypeBtn = document.getElementById('setBoostingTypeBtn');
    if (boostingTypeBtn) {
      boostingTypeBtn.addEventListener('click', () => this.setBoostingTypeNames());
    }

    // 아티스트 등록 버튼
    const artistBtn = document.getElementById('registerArtistBtn');
    if (artistBtn) {
      artistBtn.addEventListener('click', () => this.registerArtist());
    }

    // 다운로드 버튼들
    const downloadAbiBtn = document.getElementById('downloadAbiBtn');
    if (downloadAbiBtn) {
      downloadAbiBtn.addEventListener('click', () => this.downloadAbi());
    }

    const downloadBytecodeBtn = document.getElementById('downloadBytecodeBtn');
    if (downloadBytecodeBtn) {
      downloadBytecodeBtn.addEventListener('click', () => this.downloadBytecode());
    }

    const downloadStandardJsonBtn = document.getElementById('downloadStandardJsonBtn');
    if (downloadStandardJsonBtn) {
      downloadStandardJsonBtn.addEventListener('click', () => this.downloadStandardJsonInput());
    }

    const downloadConstructorArgsBtn = document.getElementById('downloadConstructorArgsBtn');
    if (downloadConstructorArgsBtn) {
      downloadConstructorArgsBtn.addEventListener('click', () => this.downloadConstructorArgs());
    }

    console.log('📝 STEP 0 Event Listeners Attached');
  }

  /**
   * 초기화
   */
  init() {
    this.attachEventListeners();

    // Deployer 지갑 자동 로드
    const deployerPkInput = document.getElementById('deployerPrivateKey');
    if (deployerPkInput && deployerPkInput.value) {
      this.loadDeployerWallet();
    }

    // Owner 지갑 자동 로드
    this.updateOwnerWallet();

    console.log('✅ STEP 0 Setup Component Initialized');
  }
}
