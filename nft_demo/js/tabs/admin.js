/**
 * Admin Tab - 관리 기능 (Owner 전용)
 */

import { parseContractError, formatAddress } from '../config.js';

export function initAdminTab(app) {
  // Lock/Unlock single token
  document.getElementById('lockTokenBtn').addEventListener('click', async () => {
    await executeLockToken(app, true);
  });

  document.getElementById('unlockTokenBtn').addEventListener('click', async () => {
    await executeLockToken(app, false);
  });

  // Batch lock/unlock
  document.getElementById('batchLockBtn').addEventListener('click', async () => {
    await executeBatchLock(app, true);
  });

  document.getElementById('batchUnlockBtn').addEventListener('click', async () => {
    await executeBatchLock(app, false);
  });

  // Burn
  document.getElementById('burnBtn').addEventListener('click', async () => {
    await executeBurn(app);
  });

  // Set Base URI
  document.getElementById('setBaseURIBtn').addEventListener('click', async () => {
    await executeSetBaseURI(app);
  });

  // Pause/Unpause
  document.getElementById('pauseBtn').addEventListener('click', async () => {
    await executePause(app, true);
  });

  document.getElementById('unpauseBtn').addEventListener('click', async () => {
    await executePause(app, false);
  });

  // Ownership
  document.getElementById('transferOwnershipBtn').addEventListener('click', async () => {
    await executeTransferOwnership(app);
  });

  document.getElementById('renounceOwnershipBtn').addEventListener('click', async () => {
    await executeRenounceOwnership(app);
  });
}

async function executeLockToken(app, lock) {
  if (!app.contract) {
    app.showToast('지갑을 연결하고 컨트랙트를 로드해주세요', 'warning');
    return;
  }

  const tokenId = document.getElementById('lockTokenId').value;
  if (tokenId === '') {
    app.showToast('Token ID를 입력해주세요', 'warning');
    return;
  }

  const resultEl = 'lockResult';
  const action = lock ? '잠금' : '잠금 해제';
  app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 토큰 ${action} 중...</span>`, 'pending');
  refreshIcons();

  try {
    const method = lock ? 'lockToken' : 'unlockToken';
    const tx = await app.contract[method](tokenId);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 트랜잭션 확인 대기 중...</span><br><small>TX: ${tx.hash}</small>`, 'pending');
    refreshIcons();

    const receipt = await tx.wait();

    app.showResult(resultEl, `
      <div class="space-y-2">
        <div class="text-green-600 font-medium flex items-center gap-2"><i data-lucide="check-circle" class="w-5 h-5"></i> ${action} 완료!</div>
        <div class="flex items-center gap-1">Token #${tokenId} <i data-lucide="${lock ? 'lock' : 'unlock'}" class="w-4 h-4"></i> ${lock ? '잠김' : '해제됨'}</div>
        <div>${app.createTxLink(receipt.hash)}</div>
      </div>
    `, 'success');
    refreshIcons();

    app.showToast(`토큰 ${action} 완료!`, 'success');
  } catch (error) {
    console.error(`${lock ? 'lock' : 'unlock'}Token error:`, error);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="x-circle" class="w-4 h-4"></i> ${action} 실패: ${parseContractError(error)}</span>`, 'error');
    refreshIcons();
  }
}

async function executeBatchLock(app, lock) {
  if (!app.contract) {
    app.showToast('지갑을 연결하고 컨트랙트를 로드해주세요', 'warning');
    return;
  }

  const idsInput = document.getElementById('batchLockIds').value.trim();
  if (!idsInput) {
    app.showToast('Token IDs를 입력해주세요', 'warning');
    return;
  }

  // Parse comma-separated IDs
  const tokenIds = idsInput.split(',').map(s => s.trim()).filter(s => s !== '');
  if (tokenIds.length === 0) {
    app.showToast('유효한 Token IDs를 입력해주세요', 'warning');
    return;
  }

  const resultEl = 'batchLockResult';
  const action = lock ? '배치 잠금' : '배치 해제';
  app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> ${tokenIds.length}개 토큰 ${action} 중...</span>`, 'pending');
  refreshIcons();

  try {
    const method = lock ? 'batchLockTokens' : 'batchUnlockTokens';
    const tx = await app.contract[method](tokenIds);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 트랜잭션 확인 대기 중...</span><br><small>TX: ${tx.hash}</small>`, 'pending');
    refreshIcons();

    const receipt = await tx.wait();

    app.showResult(resultEl, `
      <div class="space-y-2">
        <div class="text-green-600 font-medium flex items-center gap-2"><i data-lucide="check-circle" class="w-5 h-5"></i> ${action} 완료!</div>
        <div class="flex items-center gap-1">${tokenIds.length}개 토큰 <i data-lucide="${lock ? 'lock' : 'unlock'}" class="w-4 h-4"></i> ${lock ? '잠김' : '해제됨'}</div>
        <div class="text-xs text-gray-500">IDs: ${tokenIds.join(', ')}</div>
        <div>${app.createTxLink(receipt.hash)}</div>
      </div>
    `, 'success');
    refreshIcons();

    app.showToast(`${tokenIds.length}개 토큰 ${action} 완료!`, 'success');
  } catch (error) {
    console.error(`batch${lock ? 'Lock' : 'Unlock'} error:`, error);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="x-circle" class="w-4 h-4"></i> ${action} 실패: ${parseContractError(error)}</span>`, 'error');
    refreshIcons();
  }
}

async function executeBurn(app) {
  if (!app.contract) {
    app.showToast('지갑을 연결하고 컨트랙트를 로드해주세요', 'warning');
    return;
  }

  const tokenId = document.getElementById('burnTokenId').value;
  if (tokenId === '') {
    app.showToast('Token ID를 입력해주세요', 'warning');
    return;
  }

  // Confirmation
  if (!confirm(`정말로 Token #${tokenId}을(를) 소각하시겠습니까?\n이 작업은 되돌릴 수 없습니다!`)) {
    return;
  }

  const resultEl = 'burnResult';
  app.showResult(resultEl, '<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 토큰 소각 중...</span>', 'pending');
  refreshIcons();

  try {
    const tx = await app.contract.burn(tokenId);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 트랜잭션 확인 대기 중...</span><br><small>TX: ${tx.hash}</small>`, 'pending');
    refreshIcons();

    const receipt = await tx.wait();

    app.showResult(resultEl, `
      <div class="space-y-2">
        <div class="text-green-600 font-medium flex items-center gap-2"><i data-lucide="check-circle" class="w-5 h-5"></i> 소각 완료!</div>
        <div class="flex items-center gap-1">Token #${tokenId} <i data-lucide="flame" class="w-4 h-4 text-orange-500"></i> 영구 삭제됨</div>
        <div>${app.createTxLink(receipt.hash)}</div>
      </div>
    `, 'success');
    refreshIcons();

    app.showToast('토큰 소각 완료!', 'success');
  } catch (error) {
    console.error('burn error:', error);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="x-circle" class="w-4 h-4"></i> 소각 실패: ${parseContractError(error)}</span>`, 'error');
    refreshIcons();
  }
}

async function executeSetBaseURI(app) {
  if (!app.contract) {
    app.showToast('지갑을 연결하고 컨트랙트를 로드해주세요', 'warning');
    return;
  }

  const baseURI = document.getElementById('baseURI').value.trim();
  if (!baseURI) {
    app.showToast('Base URI를 입력해주세요', 'warning');
    return;
  }

  const resultEl = 'setBaseURIResult';
  app.showResult(resultEl, '<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Base URI 설정 중...</span>', 'pending');
  refreshIcons();

  try {
    const tx = await app.contract.setBaseURI(baseURI);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 트랜잭션 확인 대기 중...</span><br><small>TX: ${tx.hash}</small>`, 'pending');
    refreshIcons();

    const receipt = await tx.wait();

    app.showResult(resultEl, `
      <div class="space-y-2">
        <div class="text-green-600 font-medium flex items-center gap-2"><i data-lucide="check-circle" class="w-5 h-5"></i> Base URI 설정 완료!</div>
        <div class="text-xs break-all">URI: ${baseURI}</div>
        <div>${app.createTxLink(receipt.hash)}</div>
      </div>
    `, 'success');
    refreshIcons();

    app.showToast('Base URI 설정 완료!', 'success');
  } catch (error) {
    console.error('setBaseURI error:', error);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="x-circle" class="w-4 h-4"></i> 설정 실패: ${parseContractError(error)}</span>`, 'error');
    refreshIcons();
  }
}

async function executePause(app, pause) {
  if (!app.contract) {
    app.showToast('지갑을 연결하고 컨트랙트를 로드해주세요', 'warning');
    return;
  }

  const action = pause ? '일시정지' : '재개';

  if (pause && !confirm('정말로 컨트랙트를 일시정지하시겠습니까?\n모든 전송/민팅/소각이 중단됩니다.')) {
    return;
  }

  const resultEl = 'pauseResult';
  app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> ${action} 중...</span>`, 'pending');
  refreshIcons();

  try {
    const method = pause ? 'pause' : 'unpause';
    const tx = await app.contract[method]();
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 트랜잭션 확인 대기 중...</span><br><small>TX: ${tx.hash}</small>`, 'pending');
    refreshIcons();

    const receipt = await tx.wait();

    app.showResult(resultEl, `
      <div class="space-y-2">
        <div class="text-green-600 font-medium flex items-center gap-2"><i data-lucide="check-circle" class="w-5 h-5"></i> ${action} 완료!</div>
        <div class="flex items-center gap-1">컨트랙트 상태: <span class="${pause ? 'text-red-600' : 'text-green-600'} flex items-center gap-1"><i data-lucide="${pause ? 'pause-circle' : 'play-circle'}" class="w-4 h-4"></i>${pause ? '일시정지됨' : '정상'}</span></div>
        <div>${app.createTxLink(receipt.hash)}</div>
      </div>
    `, 'success');
    refreshIcons();

    app.showToast(`컨트랙트 ${action} 완료!`, 'success');

    // Refresh info
    document.getElementById('refreshInfoBtn')?.click();
  } catch (error) {
    console.error(`${pause ? 'pause' : 'unpause'} error:`, error);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="x-circle" class="w-4 h-4"></i> ${action} 실패: ${parseContractError(error)}</span>`, 'error');
    refreshIcons();
  }
}

async function executeTransferOwnership(app) {
  if (!app.contract) {
    app.showToast('지갑을 연결하고 컨트랙트를 로드해주세요', 'warning');
    return;
  }

  const newOwner = document.getElementById('newOwnerAddress').value.trim();
  if (!newOwner || !ethers.isAddress(newOwner)) {
    app.showToast('유효한 주소를 입력해주세요', 'warning');
    return;
  }

  if (!confirm(`정말로 소유권을 ${formatAddress(newOwner)}에게 이전하시겠습니까?\n이 작업은 되돌릴 수 없습니다!`)) {
    return;
  }

  const resultEl = 'ownershipResult';
  app.showResult(resultEl, '<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 소유권 이전 중...</span>', 'pending');
  refreshIcons();

  try {
    const tx = await app.contract.transferOwnership(newOwner);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 트랜잭션 확인 대기 중...</span><br><small>TX: ${tx.hash}</small>`, 'pending');
    refreshIcons();

    const receipt = await tx.wait();

    app.showResult(resultEl, `
      <div class="space-y-2">
        <div class="text-green-600 font-medium flex items-center gap-2"><i data-lucide="check-circle" class="w-5 h-5"></i> 소유권 이전 완료!</div>
        <div>새 Owner: <code class="text-xs">${newOwner}</code></div>
        <div>${app.createTxLink(receipt.hash)}</div>
      </div>
    `, 'success');
    refreshIcons();

    app.showToast('소유권 이전 완료!', 'success');

    // Update ownership status
    app.isOwner = false;
    document.getElementById('isOwnerBadge').classList.add('hidden');
    document.getElementById('refreshInfoBtn')?.click();
  } catch (error) {
    console.error('transferOwnership error:', error);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="x-circle" class="w-4 h-4"></i> 소유권 이전 실패: ${parseContractError(error)}</span>`, 'error');
    refreshIcons();
  }
}

async function executeRenounceOwnership(app) {
  if (!app.contract) {
    app.showToast('지갑을 연결하고 컨트랙트를 로드해주세요', 'warning');
    return;
  }

  // Double confirmation for dangerous action
  if (!confirm('경고: 정말로 소유권을 영구적으로 포기하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 민팅/잠금/일시정지 등 모든 Owner 기능을 사용할 수 없게 됩니다!')) {
    return;
  }

  if (!confirm('마지막 확인: 이 작업을 실행하면 컨트랙트의 Owner가 영구적으로 없어집니다.\n\n정말 진행하시겠습니까?')) {
    return;
  }

  const resultEl = 'ownershipResult';
  app.showResult(resultEl, '<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 소유권 포기 중...</span>', 'pending');
  refreshIcons();

  try {
    const tx = await app.contract.renounceOwnership();
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 트랜잭션 확인 대기 중...</span><br><small>TX: ${tx.hash}</small>`, 'pending');
    refreshIcons();

    const receipt = await tx.wait();

    app.showResult(resultEl, `
      <div class="space-y-2">
        <div class="text-red-600 font-medium flex items-center gap-2"><i data-lucide="alert-triangle" class="w-5 h-5"></i> 소유권 포기 완료!</div>
        <div>Owner: <span class="text-gray-500">없음 (Zero Address)</span></div>
        <div class="text-xs text-red-500">더 이상 Owner 기능을 사용할 수 없습니다.</div>
        <div>${app.createTxLink(receipt.hash)}</div>
      </div>
    `, 'warning');
    refreshIcons();

    app.showToast('소유권이 포기되었습니다', 'warning');

    // Update ownership status
    app.isOwner = false;
    document.getElementById('isOwnerBadge').classList.add('hidden');
    document.getElementById('refreshInfoBtn')?.click();
  } catch (error) {
    console.error('renounceOwnership error:', error);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="x-circle" class="w-4 h-4"></i> 소유권 포기 실패: ${parseContractError(error)}</span>`, 'error');
    refreshIcons();
  }
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}
