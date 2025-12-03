/**
 * Info Tab - 정보 조회 기능
 */

import { formatAddress } from '../config.js';

export function initInfoTab(app) {
  // Refresh contract info
  document.getElementById('refreshInfoBtn').addEventListener('click', async () => {
    await refreshContractInfo(app);
  });

  // Balance query
  document.getElementById('useMyAddressBtn').addEventListener('click', () => {
    if (app.connectedAddress) {
      document.getElementById('balanceAddress').value = app.connectedAddress;
    }
  });

  document.getElementById('checkBalanceBtn').addEventListener('click', async () => {
    await checkBalance(app);
  });

  // Token info queries
  document.getElementById('ownerOfBtn').addEventListener('click', async () => {
    await queryOwnerOf(app);
  });

  document.getElementById('tokenURIBtn').addEventListener('click', async () => {
    await queryTokenURI(app);
  });

  document.getElementById('isLockedBtn').addEventListener('click', async () => {
    await queryIsLocked(app);
  });

  // Interface check
  document.querySelectorAll('[data-interface]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('interfaceId').value = btn.dataset.interface;
    });
  });

  document.getElementById('checkInterfaceBtn').addEventListener('click', async () => {
    await checkInterface(app);
  });
}

async function refreshContractInfo(app) {
  if (!app.readContract) {
    app.showToast('컨트랙트를 먼저 로드해주세요', 'warning');
    return;
  }

  try {
    const [name, symbol, owner, paused, maxBatch] = await Promise.all([
      app.readContract.name(),
      app.readContract.symbol(),
      app.readContract.owner(),
      app.readContract.paused(),
      app.readContract.MAX_BATCH_SIZE()
    ]);

    document.getElementById('nftName').textContent = name;
    document.getElementById('nftSymbol').textContent = symbol;
    document.getElementById('nftOwner').textContent = formatAddress(owner);
    document.getElementById('nftOwner').title = owner;
    document.getElementById('nftPaused').innerHTML = paused
      ? '<span class="text-red-600 font-medium">일시정지됨</span>'
      : '<span class="text-green-600 font-medium">정상</span>';
    document.getElementById('nftMaxBatch').textContent = maxBatch.toString();

    app.showToast('정보를 새로고침했습니다', 'success');
  } catch (error) {
    console.error('Refresh info error:', error);
    app.showToast('정보 조회 실패', 'error');
  }
}

async function checkBalance(app) {
  if (!app.readContract) {
    app.showToast('컨트랙트를 먼저 로드해주세요', 'warning');
    return;
  }

  const address = document.getElementById('balanceAddress').value.trim();
  if (!address || !ethers.isAddress(address)) {
    app.showToast('유효한 주소를 입력해주세요', 'warning');
    return;
  }

  try {
    const balance = await app.readContract.balanceOf(address);
    app.showResult('balanceResult', `보유 NFT: <span class="font-bold text-lg text-purple-600">${balance.toString()}</span>개`, 'success');
  } catch (error) {
    console.error('Balance check error:', error);
    app.showResult('balanceResult', `조회 실패: ${error.message}`, 'error');
  }
}

async function queryOwnerOf(app) {
  if (!app.readContract) {
    app.showToast('컨트랙트를 먼저 로드해주세요', 'warning');
    return;
  }

  const tokenId = document.getElementById('tokenIdInfo').value;
  if (tokenId === '') {
    app.showToast('Token ID를 입력해주세요', 'warning');
    return;
  }

  try {
    const owner = await app.readContract.ownerOf(tokenId);
    app.showResult('tokenInfoResult', `
      <div class="space-y-1">
        <div class="font-medium">Token #${tokenId} 소유자:</div>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded block break-all">${owner}</code>
      </div>
    `, 'success');
  } catch (error) {
    console.error('ownerOf error:', error);
    app.showResult('tokenInfoResult', `조회 실패: 토큰이 존재하지 않거나 소각되었습니다`, 'error');
  }
}

async function queryTokenURI(app) {
  if (!app.readContract) {
    app.showToast('컨트랙트를 먼저 로드해주세요', 'warning');
    return;
  }

  const tokenId = document.getElementById('tokenIdInfo').value;
  if (tokenId === '') {
    app.showToast('Token ID를 입력해주세요', 'warning');
    return;
  }

  try {
    const uri = await app.readContract.tokenURI(tokenId);
    app.showResult('tokenInfoResult', `
      <div class="space-y-1">
        <div class="font-medium">Token #${tokenId} URI:</div>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded block break-all">${uri || '(설정되지 않음)'}</code>
      </div>
    `, 'success');
  } catch (error) {
    console.error('tokenURI error:', error);
    app.showResult('tokenInfoResult', `조회 실패: 토큰이 존재하지 않습니다`, 'error');
  }
}

async function queryIsLocked(app) {
  if (!app.readContract) {
    app.showToast('컨트랙트를 먼저 로드해주세요', 'warning');
    return;
  }

  const tokenId = document.getElementById('tokenIdInfo').value;
  if (tokenId === '') {
    app.showToast('Token ID를 입력해주세요', 'warning');
    return;
  }

  try {
    const locked = await app.readContract.isLocked(tokenId);
    app.showResult('tokenInfoResult', `
      <div class="space-y-1">
        <div class="font-medium">Token #${tokenId} 잠금 상태:</div>
        <span class="${locked ? 'text-red-600' : 'text-green-600'} font-medium flex items-center gap-1">
          <i data-lucide="${locked ? 'lock' : 'unlock'}" class="w-4 h-4"></i>
          ${locked ? '잠김 (전송 불가)' : '잠금 해제됨'}
        </span>
      </div>
    `, locked ? 'warning' : 'success');
    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error('isLocked error:', error);
    app.showResult('tokenInfoResult', `조회 실패: 토큰이 존재하지 않습니다`, 'error');
  }
}

async function checkInterface(app) {
  if (!app.readContract) {
    app.showToast('컨트랙트를 먼저 로드해주세요', 'warning');
    return;
  }

  const interfaceId = document.getElementById('interfaceId').value.trim();
  if (!interfaceId) {
    app.showToast('Interface ID를 입력해주세요', 'warning');
    return;
  }

  try {
    const supported = await app.readContract.supportsInterface(interfaceId);
    app.showResult('interfaceResult', `
      <div class="space-y-1">
        <div class="font-medium">Interface ${interfaceId}:</div>
        <span class="${supported ? 'text-green-600' : 'text-red-600'} font-medium flex items-center gap-1">
          <i data-lucide="${supported ? 'check-circle' : 'x-circle'}" class="w-4 h-4"></i>
          ${supported ? '지원됨' : '지원되지 않음'}
        </span>
      </div>
    `, supported ? 'success' : 'error');
    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error('supportsInterface error:', error);
    app.showResult('interfaceResult', `조회 실패: ${error.message}`, 'error');
  }
}
