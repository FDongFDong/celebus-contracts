/**
 * Step 10: 서명 검증 유틸리티
 * 사용자가 직접 데이터를 입력하여 서명을 검증할 수 있는 도구
 */

export class Step10Verifier {
  constructor(state) {
    this.state = state;
  }

  render() {
    return `
      <div id="step10" class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-pink-500">
        <h2 class="text-xl font-semibold mb-4">
          <span class="step-badge bg-pink-500">STEP 10</span>
          <i data-lucide="shield-check" class="w-5 h-5 inline"></i> 서명 검증 유틸리티
        </h2>
        <p class="text-sm text-gray-600 mb-4">직접 데이터를 입력하여 EIP-712 서명을 생성하고 검증합니다</p>

        <!-- Domain 설정 -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 class="text-md font-semibold text-gray-700 mb-3">
            <i data-lucide="settings" class="w-4 h-4 inline"></i> Domain 설정
          </h3>
          <div class="grid grid-cols-4 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" id="verifyDomainName" value="MainVoting" class="w-full px-3 py-2 border rounded-md text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Version</label>
              <input type="text" id="verifyDomainVersion" value="1" class="w-full px-3 py-2 border rounded-md text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Chain ID</label>
              <input type="number" id="verifyChainId" value="5611" class="w-full px-3 py-2 border rounded-md text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contract Address</label>
              <input type="text" id="verifyContractAddress" placeholder="0x..." class="w-full px-3 py-2 border rounded-md text-sm font-mono">
            </div>
          </div>
          <button onclick="step10.syncContractAddress()" class="mt-2 text-sm text-blue-600 hover:underline">
            ↑ 상단 컨트랙트 주소 가져오기
          </button>
        </div>

        <!-- 탭 선택 -->
        <div class="flex gap-2 mb-4">
          <button onclick="step10.showTab('userBatch')" id="tabUserBatch" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
            <i data-lucide="user" class="w-4 h-4 inline"></i> UserBatch 서명
          </button>
          <button onclick="step10.showTab('executor')" id="tabExecutor" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm">
            <i data-lucide="shield" class="w-4 h-4 inline"></i> Executor 서명
          </button>
          <button onclick="step10.showTab('verify')" id="tabVerify" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm">
            <i data-lucide="check-circle" class="w-4 h-4 inline"></i> 서명 검증
          </button>
        </div>

        <!-- UserBatch 서명 생성 -->
        <div id="panelUserBatch" class="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 class="text-md font-semibold text-blue-800 mb-3">
            <i data-lucide="pen-tool" class="w-4 h-4 inline"></i> UserBatch 서명 생성
          </h3>

          <div class="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Private Key (서명용)</label>
              <input type="text" id="verifyUserPrivateKey" placeholder="0x..." class="w-full px-3 py-2 border rounded-md text-sm font-mono">
              <p class="text-xs text-gray-500 mt-1">Address: <span id="verifyUserAddress" class="font-mono">-</span></p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">User Address (해시용)</label>
              <input type="text" id="verifyUserAddressInput" placeholder="0x... (비우면 Private Key에서 추출)" class="w-full px-3 py-2 border rounded-md text-sm font-mono">
              <p class="text-xs text-gray-500 mt-1">레코드 해시 계산에 사용</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">User Nonce</label>
              <input type="text" id="verifyUserNonce" value="0" class="w-full px-3 py-2 border rounded-md text-sm">
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Record 데이터 (한 줄 당 하나, 쉼표 구분)</label>
            <p class="text-xs text-gray-500 mb-1">형식: timestamp, missionId, votingId, optionId, voteType, votingAmt</p>
            <p class="text-xs text-blue-600 mb-1">* user address는 위 "User Address (해시용)" 필드에서 가져옵니다</p>
            <textarea id="verifyRecordsInput" rows="4" class="w-full px-3 py-2 border rounded-md text-sm font-mono"
              placeholder="1703123456789, 1, 12345678, 1, 1, 100
1703123456790, 1, 12345678, 2, 0, 200"></textarea>
          </div>

          <button onclick="step10.generateUserBatchSignature()" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            <i data-lucide="lock" class="w-4 h-4 inline"></i> UserBatch 서명 생성
          </button>

          <div id="userBatchResult" class="mt-4 hidden">
            <div class="bg-white rounded p-4 space-y-2 text-sm">
              <p><strong>Records Hash:</strong></p>
              <p class="font-mono text-xs break-all bg-gray-100 p-2 rounded" id="resultRecordsHash">-</p>
              <p><strong>Signature:</strong></p>
              <p class="font-mono text-xs break-all bg-gray-100 p-2 rounded" id="resultUserSignature">-</p>
              <p><strong>Recovered Address:</strong></p>
              <p class="font-mono text-xs" id="resultUserRecovered">-</p>
            </div>
          </div>
        </div>

        <!-- Executor 서명 생성 -->
        <div id="panelExecutor" class="p-4 bg-red-50 rounded-lg border border-red-200 hidden">
          <h3 class="text-md font-semibold text-red-800 mb-3">
            <i data-lucide="shield" class="w-4 h-4 inline"></i> Executor(Batch) 서명 생성
          </h3>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Executor Private Key</label>
              <input type="text" id="verifyExecutorPrivateKey" placeholder="0x..." class="w-full px-3 py-2 border rounded-md text-sm font-mono">
              <p class="text-xs text-gray-500 mt-1">Executor Address: <span id="verifyExecutorAddress" class="font-mono">-</span></p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Batch Nonce</label>
              <input type="text" id="verifyBatchNonce" value="0" class="w-full px-3 py-2 border rounded-md text-sm">
            </div>
          </div>

          <button onclick="step10.generateExecutorSignature()" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
            <i data-lucide="lock" class="w-4 h-4 inline"></i> Executor 서명 생성
          </button>

          <div id="executorResult" class="mt-4 hidden">
            <div class="bg-white rounded p-4 space-y-2 text-sm">
              <p><strong>Batch Digest:</strong></p>
              <p class="font-mono text-xs break-all bg-gray-100 p-2 rounded" id="resultBatchDigest">-</p>
              <p><strong>Signature:</strong></p>
              <p class="font-mono text-xs break-all bg-gray-100 p-2 rounded" id="resultExecutorSignature">-</p>
              <p><strong>Recovered Address:</strong></p>
              <p class="font-mono text-xs" id="resultExecutorRecovered">-</p>
            </div>
          </div>
        </div>

        <!-- 서명 검증 -->
        <div id="panelVerify" class="p-4 bg-green-50 rounded-lg border border-green-200 hidden">
          <h3 class="text-md font-semibold text-green-800 mb-3">
            <i data-lucide="check-circle" class="w-4 h-4 inline"></i> 서명 검증 (주소 복구)
          </h3>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">서명 타입</label>
            <select id="verifyType" class="w-full px-3 py-2 border rounded-md text-sm">
              <option value="userBatch">UserBatch (user, userNonce, recordsHash)</option>
              <option value="batch">Batch (batchNonce)</option>
            </select>
          </div>

          <div id="verifyUserBatchFields">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">User Address</label>
                <input type="text" id="verifyInputUser" placeholder="0x..." class="w-full px-3 py-2 border rounded-md text-sm font-mono">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">User Nonce</label>
                <input type="text" id="verifyInputUserNonce" value="0" class="w-full px-3 py-2 border rounded-md text-sm">
              </div>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Records Hash (bytes32)</label>
              <input type="text" id="verifyInputRecordsHash" placeholder="0x..." class="w-full px-3 py-2 border rounded-md text-sm font-mono">
            </div>
          </div>

          <div id="verifyBatchFields" class="hidden">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Batch Nonce</label>
              <input type="text" id="verifyInputBatchNonce" value="0" class="w-full px-3 py-2 border rounded-md text-sm">
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Signature</label>
            <input type="text" id="verifyInputSignature" placeholder="0x..." class="w-full px-3 py-2 border rounded-md text-sm font-mono">
          </div>

          <button onclick="step10.verifySignature()" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
            <i data-lucide="check" class="w-4 h-4 inline"></i> 서명 검증
          </button>

          <div id="verifyResult" class="mt-4 hidden">
            <div class="bg-white rounded p-4 space-y-2 text-sm">
              <p><strong>Recovered Address:</strong></p>
              <p class="font-mono text-xs" id="resultVerifyRecovered">-</p>
              <p><strong>검증 결과:</strong></p>
              <p id="resultVerifyStatus">-</p>
            </div>
          </div>
        </div>

        <!-- Debug Log -->
        <details class="mt-4">
          <summary class="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            <i data-lucide="terminal" class="w-4 h-4 inline"></i> Debug Log
          </summary>
          <pre id="verifyDebugLog" class="mt-2 bg-gray-900 text-green-400 p-4 rounded text-xs overflow-auto max-h-48"></pre>
        </details>
      </div>
    `;
  }

  init() {
    // Private key 입력 시 주소 자동 계산
    const userKeyInput = document.getElementById('verifyUserPrivateKey');
    const executorKeyInput = document.getElementById('verifyExecutorPrivateKey');
    const verifyTypeSelect = document.getElementById('verifyType');

    if (userKeyInput) {
      userKeyInput.addEventListener('input', (e) => {
        try {
          const wallet = new ethers.Wallet(e.target.value);
          document.getElementById('verifyUserAddress').textContent = wallet.address;
        } catch {
          document.getElementById('verifyUserAddress').textContent = 'Invalid key';
        }
      });
    }

    if (executorKeyInput) {
      executorKeyInput.addEventListener('input', (e) => {
        try {
          const wallet = new ethers.Wallet(e.target.value);
          document.getElementById('verifyExecutorAddress').textContent = wallet.address;
        } catch {
          document.getElementById('verifyExecutorAddress').textContent = 'Invalid key';
        }
      });
    }

    if (verifyTypeSelect) {
      verifyTypeSelect.addEventListener('change', (e) => {
        const userFields = document.getElementById('verifyUserBatchFields');
        const batchFields = document.getElementById('verifyBatchFields');
        if (e.target.value === 'userBatch') {
          userFields.classList.remove('hidden');
          batchFields.classList.add('hidden');
        } else {
          userFields.classList.add('hidden');
          batchFields.classList.remove('hidden');
        }
      });
    }

    this.log('Step 10 Verifier 초기화 완료');
  }

  log(msg) {
    const logEl = document.getElementById('verifyDebugLog');
    if (logEl) {
      const timestamp = new Date().toLocaleTimeString();
      logEl.textContent += `[${timestamp}] ${msg}\n`;
      logEl.scrollTop = logEl.scrollHeight;
    }
    console.log('[Step10]', msg);
  }

  showTab(tab) {
    // 모든 패널 숨기기
    document.getElementById('panelUserBatch').classList.add('hidden');
    document.getElementById('panelExecutor').classList.add('hidden');
    document.getElementById('panelVerify').classList.add('hidden');

    // 모든 탭 비활성화
    document.getElementById('tabUserBatch').className = 'px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm';
    document.getElementById('tabExecutor').className = 'px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm';
    document.getElementById('tabVerify').className = 'px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm';

    // 선택된 탭 활성화
    if (tab === 'userBatch') {
      document.getElementById('panelUserBatch').classList.remove('hidden');
      document.getElementById('tabUserBatch').className = 'px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm';
    } else if (tab === 'executor') {
      document.getElementById('panelExecutor').classList.remove('hidden');
      document.getElementById('tabExecutor').className = 'px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm';
    } else if (tab === 'verify') {
      document.getElementById('panelVerify').classList.remove('hidden');
      document.getElementById('tabVerify').className = 'px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm';
    }
  }

  syncContractAddress() {
    const mainAddress = document.getElementById('contractAddress')?.value || '';
    document.getElementById('verifyContractAddress').value = mainAddress;
    this.log(`Contract Address 동기화: ${mainAddress}`);
  }

  getDomain() {
    const contractAddress = document.getElementById('verifyContractAddress').value;
    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      throw new Error('Contract Address를 입력해주세요!');
    }
    return {
      name: document.getElementById('verifyDomainName').value || 'MainVoting',
      version: document.getElementById('verifyDomainVersion').value || '1',
      chainId: BigInt(document.getElementById('verifyChainId').value || '5611'),
      verifyingContract: contractAddress
    };
  }

  hashVoteRecord(record, userAddress) {
    const VOTE_RECORD_TYPEHASH = ethers.keccak256(
      ethers.toUtf8Bytes('VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 optionId,uint8 voteType,uint256 votingAmt,address user)')
    );
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'uint256', 'uint256', 'uint256', 'uint256', 'uint8', 'uint256', 'address'],
      [
        VOTE_RECORD_TYPEHASH,
        BigInt(record.timestamp),
        BigInt(record.missionId),
        BigInt(record.votingId),
        BigInt(record.optionId),
        record.voteType,
        BigInt(record.votingAmt),
        userAddress
      ]
    );
    return ethers.keccak256(encoded);
  }

  async generateUserBatchSignature() {
    try {
      const privateKey = document.getElementById('verifyUserPrivateKey').value;
      if (!privateKey) {
        alert('Private Key를 입력해주세요');
        return;
      }

      const wallet = new ethers.Wallet(privateKey);

      // User Address: 입력값이 있으면 사용, 없으면 Private Key에서 추출
      const userAddressInput = document.getElementById('verifyUserAddressInput').value.trim();
      const userAddress = userAddressInput && ethers.isAddress(userAddressInput)
        ? userAddressInput
        : wallet.address;

      const userNonce = document.getElementById('verifyUserNonce').value || '0';

      // Records 파싱
      const recordsInput = document.getElementById('verifyRecordsInput').value.trim();
      if (!recordsInput) {
        alert('Record 데이터를 입력해주세요');
        return;
      }

      const lines = recordsInput.split('\n').filter(l => l.trim());
      const records = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 6) throw new Error('Record 형식이 잘못되었습니다');
        return {
          timestamp: parts[0],
          missionId: parts[1],
          votingId: parts[2],
          optionId: parts[3],
          voteType: parseInt(parts[4]),
          votingAmt: parts[5]
        };
      });

      this.log(`\n=== UserBatch 서명 생성 ===`);
      this.log(`Signer (Private Key): ${wallet.address}`);
      this.log(`User Address (for hash): ${userAddress}${userAddressInput ? ' (직접 입력)' : ' (Private Key에서 추출)'}`);
      this.log(`UserNonce: ${userNonce}`);
      this.log(`Records: ${records.length}개`);

      // Record Hashes
      const recordHashes = records.map((r, i) => {
        const hash = this.hashVoteRecord(r, userAddress);
        this.log(`Record[${i}] Hash: ${hash}`);
        return hash;
      });

      // RecordsHash = keccak256(concat(recordHashes))
      const recordsHash = ethers.keccak256(ethers.concat(recordHashes));
      this.log(`RecordsHash: ${recordsHash}`);

      // signTypedData
      const domain = this.getDomain();
      const types = {
        UserBatch: [
          { name: 'user', type: 'address' },
          { name: 'userNonce', type: 'uint256' },
          { name: 'recordsHash', type: 'bytes32' }
        ]
      };
      const value = {
        user: userAddress,
        userNonce: BigInt(userNonce),
        recordsHash: recordsHash
      };

      const signature = await wallet.signTypedData(domain, types, value);
      this.log(`Signature: ${signature}`);

      // Verify
      const recovered = ethers.verifyTypedData(domain, types, value, signature);
      const isValid = recovered.toLowerCase() === userAddress.toLowerCase();
      this.log(`Recovered: ${recovered} ${isValid ? '✅' : '❌'}`);

      // UI 업데이트
      document.getElementById('resultRecordsHash').textContent = recordsHash;
      document.getElementById('resultUserSignature').textContent = signature;
      document.getElementById('resultUserRecovered').textContent = `${recovered} ${isValid ? '✅' : '❌'}`;
      document.getElementById('userBatchResult').classList.remove('hidden');

    } catch (err) {
      this.log(`Error: ${err.message}`);
      alert('Error: ' + err.message);
    }
  }

  async generateExecutorSignature() {
    try {
      const privateKey = document.getElementById('verifyExecutorPrivateKey').value;
      if (!privateKey) {
        alert('Executor Private Key를 입력해주세요');
        return;
      }

      const wallet = new ethers.Wallet(privateKey);
      const batchNonce = document.getElementById('verifyBatchNonce').value || '0';

      this.log(`\n=== Executor 서명 생성 ===`);
      this.log(`Executor: ${wallet.address}`);
      this.log(`BatchNonce: ${batchNonce}`);

      const domain = this.getDomain();
      const types = {
        Batch: [
          { name: 'batchNonce', type: 'uint256' }
        ]
      };
      const value = {
        batchNonce: BigInt(batchNonce)
      };

      const signature = await wallet.signTypedData(domain, types, value);
      this.log(`Signature: ${signature}`);

      // Batch Digest 계산
      const BATCH_TYPEHASH = ethers.keccak256(ethers.toUtf8Bytes('Batch(uint256 batchNonce)'));
      const structHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes32', 'uint256'],
          [BATCH_TYPEHASH, BigInt(batchNonce)]
        )
      );

      const domainTypeHash = ethers.keccak256(
        ethers.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
      );
      const domainSeparator = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
          [
            domainTypeHash,
            ethers.keccak256(ethers.toUtf8Bytes(domain.name)),
            ethers.keccak256(ethers.toUtf8Bytes(domain.version)),
            domain.chainId,
            domain.verifyingContract
          ]
        )
      );

      const digest = ethers.keccak256(
        ethers.solidityPacked(['bytes2', 'bytes32', 'bytes32'], ['0x1901', domainSeparator, structHash])
      );
      this.log(`Batch Digest: ${digest}`);

      // Verify
      const recovered = ethers.verifyTypedData(domain, types, value, signature);
      const isValid = recovered.toLowerCase() === wallet.address.toLowerCase();
      this.log(`Recovered: ${recovered} ${isValid ? '✅' : '❌'}`);

      // UI 업데이트
      document.getElementById('resultBatchDigest').textContent = digest;
      document.getElementById('resultExecutorSignature').textContent = signature;
      document.getElementById('resultExecutorRecovered').textContent = `${recovered} ${isValid ? '✅' : '❌'}`;
      document.getElementById('executorResult').classList.remove('hidden');

    } catch (err) {
      this.log(`Error: ${err.message}`);
      alert('Error: ' + err.message);
    }
  }

  verifySignature() {
    try {
      const verifyType = document.getElementById('verifyType').value;
      const signature = document.getElementById('verifyInputSignature').value;
      if (!signature) {
        alert('Signature를 입력해주세요');
        return;
      }

      const domain = this.getDomain();
      let types, value;

      if (verifyType === 'userBatch') {
        const user = document.getElementById('verifyInputUser').value;
        const userNonce = document.getElementById('verifyInputUserNonce').value || '0';
        const recordsHash = document.getElementById('verifyInputRecordsHash').value;

        if (!user || !recordsHash) {
          alert('User Address와 Records Hash를 입력해주세요');
          return;
        }

        types = {
          UserBatch: [
            { name: 'user', type: 'address' },
            { name: 'userNonce', type: 'uint256' },
            { name: 'recordsHash', type: 'bytes32' }
          ]
        };
        value = {
          user: user,
          userNonce: BigInt(userNonce),
          recordsHash: recordsHash
        };

        this.log(`\n=== UserBatch 서명 검증 ===`);
        this.log(`User: ${user}, Nonce: ${userNonce}`);
        this.log(`RecordsHash: ${recordsHash}`);

      } else {
        const batchNonce = document.getElementById('verifyInputBatchNonce').value || '0';

        types = {
          Batch: [
            { name: 'batchNonce', type: 'uint256' }
          ]
        };
        value = {
          batchNonce: BigInt(batchNonce)
        };

        this.log(`\n=== Batch 서명 검증 ===`);
        this.log(`BatchNonce: ${batchNonce}`);
      }

      const recovered = ethers.verifyTypedData(domain, types, value, signature);
      this.log(`Recovered Address: ${recovered}`);

      // UI 업데이트
      document.getElementById('resultVerifyRecovered').textContent = recovered;

      if (verifyType === 'userBatch') {
        const expectedUser = document.getElementById('verifyInputUser').value;
        const isValid = recovered.toLowerCase() === expectedUser.toLowerCase();
        document.getElementById('resultVerifyStatus').innerHTML = isValid
          ? '<span class="text-green-600 font-semibold">✅ 서명 유효 (User와 일치)</span>'
          : '<span class="text-red-600 font-semibold">❌ 서명 불일치 (User와 다름)</span>';
      } else {
        document.getElementById('resultVerifyStatus').innerHTML = '<span class="text-blue-600">ℹ️ 위 주소가 Executor인지 확인하세요</span>';
      }

      document.getElementById('verifyResult').classList.remove('hidden');

    } catch (err) {
      this.log(`Error: ${err.message}`);
      document.getElementById('resultVerifyRecovered').textContent = '-';
      document.getElementById('resultVerifyStatus').innerHTML = `<span class="text-red-600">❌ 오류: ${err.message}</span>`;
      document.getElementById('verifyResult').classList.remove('hidden');
    }
  }
}
