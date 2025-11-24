/**
 * STEP 0: 컨트랙트 초기 설정
 * Owner 권한으로 Executor, Boosting Type, Artist를 설정합니다
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
