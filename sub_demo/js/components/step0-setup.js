/**
 * STEP 0: 컨트랙트 초기 설정
 * 컨트랙트 배포, Executor 등록, 질문/답변 등록
 */

import { CONFIG, loadABI, SUBVOTING_BYTECODE } from '../config.js?v=3';

export class Step0Setup {
  constructor(state) {
    this.state = state;
  }

  init() {
    // Deployer 지갑 자동 로드
    const deployerPkInput = document.getElementById('deployerPrivateKey');
    if (deployerPkInput && deployerPkInput.value) {
      this.loadDeployerWallet();
    }

    // Owner 지갑 자동 로드
    const ownerPkInput = document.getElementById('ownerPrivateKey');
    if (ownerPkInput && ownerPkInput.value) {
      this.loadOwnerWallet();
    }

    // 버튼 이벤트 연결
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Deployer 지갑 로드
    const deployerPkInput = document.getElementById('deployerPrivateKey');
    if (deployerPkInput) {
      deployerPkInput.addEventListener('input', () => this.loadDeployerWallet());
    }

    // 컨트랙트 배포
    const deployContractBtn = document.getElementById('deployContractBtn');
    if (deployContractBtn) {
      deployContractBtn.addEventListener('click', () => this.deployContract());
    }

    // 배포된 주소 적용
    const useDeployedAddressBtn = document.getElementById('useDeployedAddressBtn');
    if (useDeployedAddressBtn) {
      useDeployedAddressBtn.addEventListener('click', () => this.applyDeployedAddress());
    }

    // Owner 지갑 로드
    const ownerPkInput = document.getElementById('ownerPrivateKey');
    if (ownerPkInput) {
      ownerPkInput.addEventListener('input', () => this.loadOwnerWallet());
    }

    // Executor 등록
    const setExecutorBtn = document.getElementById('setExecutorBtn');
    if (setExecutorBtn) {
      setExecutorBtn.addEventListener('click', () => this.setExecutor());
    }

    // 질문 등록
    const registerQuestionBtn = document.getElementById('registerQuestionBtn');
    if (registerQuestionBtn) {
      registerQuestionBtn.addEventListener('click', () => this.registerQuestion());
    }

    // 답변 등록
    const registerOptionBtn = document.getElementById('registerOptionBtn');
    if (registerOptionBtn) {
      registerOptionBtn.addEventListener('click', () => this.registerOption());
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
  }

  // ========================================
  // 컨트랙트 배포 관련
  // ========================================

  loadDeployerWallet() {
    const pk = document.getElementById('deployerPrivateKey').value.trim();
    if (!pk || !pk.startsWith('0x')) {
      return;
    }

    try {
      const wallet = new ethers.Wallet(pk, this.state.provider);
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

  async deployContract() {
    if (!this.state.deployerWallet) {
      // 지갑 로드 시도
      this.loadDeployerWallet();
    }

    if (!this.state.deployerWallet) {
      this.showStatus('배포자 비밀키를 먼저 입력하세요', 'error', 'deployStatus');
      return;
    }

    const statusDiv = document.getElementById('deployStatus');
    statusDiv.className = 'mt-4 p-3 bg-blue-50 border border-blue-200 rounded';
    statusDiv.textContent = '⏳ SubVoting 컨트랙트 배포 중...';
    statusDiv.classList.remove('hidden');

    try {
      // SubVoting ABI (constructor: address initialOwner)
      const abi = ['constructor(address initialOwner)'];

      const factory = new ethers.ContractFactory(
        abi,
        SUBVOTING_BYTECODE,
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

      console.log('✅ SubVoting deployed at:', deployedAddress);

      // ✨ 배포 후 자동으로 주소 적용 (EIP-712 서명에 필수!)
      this.applyDeployedAddress();
    } catch (error) {
      console.error('❌ Failed to deploy contract:', error);
      statusDiv.className = 'mt-4 p-3 bg-red-50 border border-red-200 rounded';
      statusDiv.textContent = `❌ 배포 실패: ${error.message}`;
    }
  }

  applyDeployedAddress() {
    const deployedAddress = document.getElementById('deployedAddress').textContent;
    if (!deployedAddress || deployedAddress === '-') {
      console.error('❌ 배포된 주소가 없습니다');
      return;
    }

    // ⚠️ 주소 유효성 검증
    if (!ethers.isAddress(deployedAddress)) {
      console.error('❌ 유효하지 않은 주소:', deployedAddress);
      alert('❌ 유효하지 않은 컨트랙트 주소입니다: ' + deployedAddress);
      return;
    }

    console.log('🔄 Applying deployed address:', deployedAddress);

    // 1. 컨트랙트 주소 필드에 적용
    const contractAddressInput = document.getElementById('contractAddress');
    if (contractAddressInput) {
      contractAddressInput.value = deployedAddress;
      contractAddressInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 2. state 업데이트
    this.state.contractAddress = deployedAddress;

    // 3. ✨ STEP 4의 verifyingContract도 업데이트 (EIP-712 서명에 필수!)
    const verifyingContractInput = document.getElementById('verifyingContract');
    if (verifyingContractInput) {
      verifyingContractInput.value = deployedAddress;
      console.log('✅ VerifyingContract updated:', deployedAddress);
    }

    // 4. Owner 지갑도 deployer와 동일하게 설정 (배포자 = owner)
    const ownerPkInput = document.getElementById('ownerPrivateKey');
    const deployerPkInput = document.getElementById('deployerPrivateKey');
    if (ownerPkInput && deployerPkInput) {
      ownerPkInput.value = deployerPkInput.value;
      this.loadOwnerWallet();
    }

    // 5. 성공 메시지 (verifyingContract 업데이트 명시)
    const statusDiv = document.getElementById('deployStatus');
    if (statusDiv) {
      statusDiv.className = 'mt-4 p-3 bg-green-50 border border-green-200 rounded';
      statusDiv.textContent = `✅ 컨트랙트 주소가 모든 필드에 적용되었습니다: ${deployedAddress}\n📝 STEP 4의 Verifying Contract도 업데이트되었습니다.`;
      statusDiv.classList.remove('hidden');
    }

    // ✅ 상태 업데이트 검증
    console.log('✅ Applied deployed address to all fields:', deployedAddress);
    console.log('📋 State verification:', {
      'state.contractAddress': this.state.contractAddress,
      'DOM #contractAddress': document.getElementById('contractAddress')?.value,
      'DOM #verifyingContract': document.getElementById('verifyingContract')?.value,
      'Match': this.state.contractAddress === deployedAddress
    });

    if (this.state.contractAddress !== deployedAddress) {
      console.error('❌ State mismatch! contractAddress was not updated correctly');
      alert('❌ 주소 적용 실패! 페이지를 새로고침 후 다시 시도해주세요.');
    }
  }

  loadOwnerWallet() {
    const pk = document.getElementById('ownerPrivateKey').value.trim();
    if (!pk || !pk.startsWith('0x')) {
      return;
    }

    try {
      const wallet = new ethers.Wallet(pk, this.state.provider);
      this.state.ownerWallet = wallet;

      const ownerAddressSpan = document.getElementById('ownerAddress');
      if (ownerAddressSpan) {
        ownerAddressSpan.textContent = wallet.address;
      }

      console.log('✅ Owner wallet loaded:', wallet.address);
    } catch (error) {
      console.error('❌ Failed to load owner wallet:', error);
    }
  }

  async setExecutor() {
    if (!this.state.ownerWallet) {
      this.showStatus('Owner 비밀키를 먼저 입력하세요', 'error', 'executorSetStatus');
      return;
    }

    const executorAddress = document.getElementById('executorAddressToSet').value.trim();

    // 정규식으로 주소 검증 (ENS 문제 회피)
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!executorAddress || !addressRegex.test(executorAddress)) {
      this.showStatus('유효한 Executor 주소를 입력하세요', 'error', 'executorSetStatus');
      return;
    }

    const statusDiv = document.getElementById('executorSetStatus');
    statusDiv.className = 'mt-3 p-3 bg-blue-50 border border-blue-200 rounded';
    statusDiv.textContent = '⏳ Executor 등록 중...';
    statusDiv.classList.remove('hidden');

    try {
      // Contract 직접 생성 (ENS 문제 회피)
      const contract = new ethers.Contract(
        this.state.contractAddress,
        ['function setExecutorSigner(address _executorSigner)'],
        this.state.ownerWallet
      );

      const tx = await contract.setExecutorSigner(executorAddress);

      statusDiv.textContent = `⏳ 트랜잭션 전송됨: ${tx.hash.substring(0, 10)}... 컨펌 대기 중...`;

      const receipt = await tx.wait();

      statusDiv.className = 'mt-3 p-3 bg-green-50 border border-green-200 rounded';
      statusDiv.textContent = `✅ Executor 등록 완료! (${receipt.hash.substring(0, 10)}...)`;

      console.log('✅ Executor set:', executorAddress);
    } catch (error) {
      console.error('❌ Failed to set executor:', error);
      statusDiv.className = 'mt-3 p-3 bg-red-50 border border-red-200 rounded';
      statusDiv.textContent = `❌ 에러: ${error.message}`;
    }
  }

  async registerQuestion() {
    if (!this.state.ownerWallet) {
      this.showStatus('Owner 비밀키를 먼저 입력하세요', 'error', 'questionStatus');
      return;
    }

    const missionId = document.getElementById('questionMissionId').value;
    const questionId = document.getElementById('questionQuestionId').value;
    const questionText = document.getElementById('questionText').value.trim();

    if (!questionText) {
      this.showStatus('질문 텍스트를 입력해주세요', 'error', 'questionStatus');
      return;
    }

    const statusDiv = document.getElementById('questionStatus');
    statusDiv.className = 'mt-3 p-3 bg-blue-50 border border-blue-200 rounded';
    statusDiv.textContent = '⏳ 질문 등록 중...';
    statusDiv.classList.remove('hidden');

    try {
      const contract = new ethers.Contract(
        this.state.contractAddress,
        ['function setQuestion(uint256 missionId, uint256 questionId, string memory text, bool allowed)'],
        this.state.ownerWallet
      );

      const tx = await contract.setQuestion(missionId, questionId, questionText, true);

      statusDiv.textContent = `⏳ 트랜잭션 전송됨: ${tx.hash.substring(0, 10)}... 컨펌 대기 중...`;

      const receipt = await tx.wait();

      statusDiv.className = 'mt-3 p-3 bg-green-50 border border-green-200 rounded';
      statusDiv.textContent = `✅ 질문 등록 완료! Mission ${missionId}, Question ${questionId}: "${questionText}"`;

      console.log('✅ Question registered:', { missionId, questionId, questionText });
    } catch (error) {
      console.error('❌ Failed to register question:', error);
      statusDiv.className = 'mt-3 p-3 bg-red-50 border border-red-200 rounded';
      statusDiv.textContent = `❌ 에러: ${error.message}`;
    }
  }

  async registerOption() {
    if (!this.state.ownerWallet) {
      this.showStatus('Owner 비밀키를 먼저 입력하세요', 'error', 'optionStatus');
      return;
    }

    const missionId = document.getElementById('optionMissionId').value;
    const questionId = document.getElementById('optionQuestionId').value;
    const optionId = document.getElementById('optionOptionId').value;
    const optionText = document.getElementById('optionText').value.trim();

    if (!optionText) {
      this.showStatus('답변 텍스트를 입력해주세요', 'error', 'optionStatus');
      return;
    }

    if (optionId < 1) {
      this.showStatus('Option ID는 1 이상의 정수여야 합니다', 'error', 'optionStatus');
      return;
    }

    const statusDiv = document.getElementById('optionStatus');
    statusDiv.className = 'mt-3 p-3 bg-blue-50 border border-blue-200 rounded';
    statusDiv.textContent = '⏳ 답변 등록 중...';
    statusDiv.classList.remove('hidden');

    try {
      const contract = new ethers.Contract(
        this.state.contractAddress,
        ['function setOption(uint256 missionId, uint256 questionId, uint256 optionId, string memory text, bool allowed)'],
        this.state.ownerWallet
      );

      const tx = await contract.setOption(missionId, questionId, optionId, optionText, true);

      statusDiv.textContent = `⏳ 트랜잭션 전송됨: ${tx.hash.substring(0, 10)}... 컨펌 대기 중...`;

      const receipt = await tx.wait();

      statusDiv.className = 'mt-3 p-3 bg-green-50 border border-green-200 rounded';
      statusDiv.textContent = `✅ 답변 등록 완료! Option ${optionId}: "${optionText}"`;

      console.log('✅ Option registered:', { missionId, questionId, optionId, optionText });
    } catch (error) {
      console.error('❌ Failed to register option:', error);
      statusDiv.className = 'mt-3 p-3 bg-red-50 border border-red-200 rounded';
      statusDiv.textContent = `❌ 에러: ${error.message}`;
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
  async downloadAbi() {
    const abi = await loadABI();
    const blob = new Blob([JSON.stringify(abi, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SubVoting-abi.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Bytecode 다운로드
   */
  downloadBytecode() {
    const blob = new Blob([SUBVOTING_BYTECODE], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SubVoting-bytecode.txt';
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
    let ownerAddress = this.state.deployerWallet?.address;

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
}
