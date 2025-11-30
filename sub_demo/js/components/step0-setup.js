/**
 * STEP 0: 컨트랙트 초기 설정
 * 컨트랙트 배포, Executor 등록, 질문/답변 등록
 */

import { CONFIG, getContractInstance, SUBVOTING_BYTECODE } from '../config.js';

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
    } catch (error) {
      console.error('❌ Failed to deploy contract:', error);
      statusDiv.className = 'mt-4 p-3 bg-red-50 border border-red-200 rounded';
      statusDiv.textContent = `❌ 배포 실패: ${error.message}`;
    }
  }

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
      this.loadOwnerWallet();
    }

    // 상태 메시지 표시 (alert 대신)
    const statusDiv = document.getElementById('deployStatus');
    if (statusDiv) {
      statusDiv.className = 'mt-4 p-3 bg-green-50 border border-green-200 rounded';
      statusDiv.textContent = `✅ 컨트랙트 주소가 업데이트되었습니다: ${deployedAddress}`;
      statusDiv.classList.remove('hidden');
    }

    console.log('✅ Applied deployed address:', deployedAddress);
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

    if (optionId < 1 || optionId > 10) {
      this.showStatus('Option ID는 1~10 사이여야 합니다', 'error', 'optionStatus');
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
}
