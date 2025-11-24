/**
 * STEP 0: 컨트랙트 초기 설정
 * Executor 등록, 질문/답변 등록
 */

import { CONFIG, getContractInstance } from '../config.js';

export class Step0Setup {
  constructor(state) {
    this.state = state;
  }

  init() {
    // Owner 지갑 자동 로드
    const ownerPkInput = document.getElementById('ownerPrivateKey');
    if (ownerPkInput && ownerPkInput.value) {
      this.loadOwnerWallet();
    }

    // 버튼 이벤트 연결
    this.attachEventListeners();
  }

  attachEventListeners() {
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
      alert('Owner 지갑을 먼저 로드해주세요!');
      return;
    }

    const executorAddress = document.getElementById('executorAddressToSet').value.trim();

    // 정규식으로 주소 검증 (ENS 문제 회피)
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!executorAddress || !addressRegex.test(executorAddress)) {
      alert('올바른 Executor 주소를 입력해주세요!');
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
      alert('Owner 지갑을 먼저 로드해주세요!');
      return;
    }

    const missionId = document.getElementById('questionMissionId').value;
    const questionId = document.getElementById('questionQuestionId').value;
    const questionText = document.getElementById('questionText').value.trim();

    if (!questionText) {
      alert('질문 텍스트를 입력해주세요!');
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
      alert('Owner 지갑을 먼저 로드해주세요!');
      return;
    }

    const missionId = document.getElementById('optionMissionId').value;
    const questionId = document.getElementById('optionQuestionId').value;
    const optionId = document.getElementById('optionOptionId').value;
    const optionText = document.getElementById('optionText').value.trim();

    if (!optionText) {
      alert('답변 텍스트를 입력해주세요!');
      return;
    }

    if (optionId < 1 || optionId > 10) {
      alert('Option ID는 1~10 사이여야 합니다!');
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
}
