/**
 * STEP 0: 컨트랙트 초기 설정
 * Owner 권한으로 Executor, Vote Type, Artist를 설정합니다
 */

export class Step0Setup {
  constructor(state) {
    this.state = state;
    this.ownerWallet = null;
  }

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
   * Vote Type 이름 설정
   */
  async setVoteTypeNames() {
    try {
      if (!this.ownerWallet) {
        this.showStatus('Owner 비밀키를 먼저 입력하세요', 'error', 'voteTypeStatus');
        return;
      }

      const name0 = document.getElementById('voteTypeName0').value.trim();
      const name1 = document.getElementById('voteTypeName1').value.trim();

      if (!name0 || !name1) {
        this.showStatus('두 Vote Type 이름을 모두 입력하세요', 'error', 'voteTypeStatus');
        return;
      }

      this.showStatus('Vote Type 이름 설정 중...', 'info', 'voteTypeStatus');

      const contract = new ethers.Contract(
        this.state.contractAddress,
        ['function setVoteTypeName(uint8 voteType, string memory name)'],
        this.ownerWallet
      );

      // Type 0 설정
      const tx0 = await contract.setVoteTypeName(0, name0);
      this.showStatus(`Type 0 설정 중... (${tx0.hash.substring(0, 10)}...)`, 'info', 'voteTypeStatus');
      await tx0.wait();

      // Type 1 설정
      const tx1 = await contract.setVoteTypeName(1, name1);
      this.showStatus(`Type 1 설정 중... (${tx1.hash.substring(0, 10)}...)`, 'info', 'voteTypeStatus');
      await tx1.wait();

      this.showStatus(`✅ Vote Type 이름 설정 완료!\n0: ${name0}\n1: ${name1}`, 'success', 'voteTypeStatus');

    } catch (error) {
      console.error('Vote Type 설정 실패:', error);
      this.showStatus(`❌ 오류: ${error.message}`, 'error', 'voteTypeStatus');
    }
  }

  /**
   * 후보 등록
   */
  async registerArtist() {
    try {
      if (!this.ownerWallet) {
        this.showStatus('Owner 비밀키를 먼저 입력하세요', 'error', 'candidateStatus');
        return;
      }

      const missionId = parseInt(document.getElementById('candidateMissionId').value);
      const artistId = parseInt(document.getElementById('candidateArtistId').value);
      const name = document.getElementById('candidateName').value.trim();

      if (isNaN(missionId) || isNaN(artistId) || !name) {
        this.showStatus('모든 필드를 올바르게 입력하세요', 'error', 'candidateStatus');
        return;
      }

      this.showStatus('후보 등록 중...', 'info', 'candidateStatus');

      const contract = new ethers.Contract(
        this.state.contractAddress,
        ['function setArtist(uint256 missionId, uint256 artistId, string memory name, bool allowed)'],
        this.ownerWallet
      );

      const tx = await contract.setArtist(missionId, artistId, name, true);
      this.showStatus(`트랜잭션 전송됨. 대기 중... (${tx.hash.substring(0, 10)}...)`, 'info', 'candidateStatus');

      await tx.wait();
      this.showStatus(`✅ 후보 등록 완료!\n이름: ${name}\nMission ID: ${missionId}\nArtist ID: ${artistId}\nTX: ${tx.hash}`, 'success', 'candidateStatus');

    } catch (error) {
      console.error('후보 등록 실패:', error);
      this.showStatus(`❌ 오류: ${error.message}`, 'error', 'candidateStatus');
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
   * 이벤트 리스너 등록
   */
  attachEventListeners() {
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

    // Vote Type 설정 버튼
    const voteTypeBtn = document.getElementById('setVoteTypeBtn');
    if (voteTypeBtn) {
      voteTypeBtn.addEventListener('click', () => this.setVoteTypeNames());
    }

    // 후보 등록 버튼
    const candidateBtn = document.getElementById('registerArtistBtn');
    if (candidateBtn) {
      candidateBtn.addEventListener('click', () => this.registerArtist());
    }

    console.log('📝 STEP 0 Event Listeners Attached');
  }

  /**
   * 초기화
   */
  init() {
    this.attachEventListeners();
    this.updateOwnerWallet();
    console.log('✅ STEP 0 Setup Component Initialized');
  }
}
