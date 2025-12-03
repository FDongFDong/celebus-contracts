/**
 * Transfer Tab - 전송 기능
 */

import { parseContractError, formatAddress } from '../config.js';

export function initTransferTab(app) {
  // Use my address buttons for transferFrom
  document.getElementById('useTransferFromMyAddressBtn').addEventListener('click', () => {
    if (app.connectedAddress) {
      document.getElementById('transferFrom').value = app.connectedAddress;
    }
  });

  // Use my address buttons for safeTransferFrom
  document.getElementById('useSafeTransferFromMyAddressBtn').addEventListener('click', () => {
    if (app.connectedAddress) {
      document.getElementById('safeTransferFrom').value = app.connectedAddress;
    }
  });

  // transferFrom
  document.getElementById('transferFromBtn').addEventListener('click', async () => {
    await executeTransferFrom(app);
  });

  // safeTransferFrom
  document.getElementById('safeTransferFromBtn').addEventListener('click', async () => {
    await executeSafeTransferFrom(app);
  });
}

async function executeTransferFrom(app) {
  if (!app.contract) {
    app.showToast('지갑을 연결하고 컨트랙트를 로드해주세요', 'warning');
    return;
  }

  const from = document.getElementById('transferFrom').value.trim();
  const to = document.getElementById('transferTo').value.trim();
  const tokenId = document.getElementById('transferTokenId').value;

  if (!from || !ethers.isAddress(from)) {
    app.showToast('유효한 보내는 주소를 입력해주세요', 'warning');
    return;
  }

  if (!to || !ethers.isAddress(to)) {
    app.showToast('유효한 받는 주소를 입력해주세요', 'warning');
    return;
  }

  if (tokenId === '') {
    app.showToast('Token ID를 입력해주세요', 'warning');
    return;
  }

  const resultEl = 'transferFromResult';
  app.showResult(resultEl, '<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 전송 트랜잭션 전송 중...</span>', 'pending');
  refreshIcons();

  try {
    const tx = await app.contract.transferFrom(from, to, tokenId);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 트랜잭션 확인 대기 중...</span><br><small>TX: ${tx.hash}</small>`, 'pending');
    refreshIcons();

    const receipt = await tx.wait();

    app.showResult(resultEl, `
      <div class="space-y-2">
        <div class="text-green-600 font-medium flex items-center gap-2"><i data-lucide="check-circle" class="w-5 h-5"></i> 전송 완료!</div>
        <div>Token #${tokenId}</div>
        <div>From: <code class="text-xs">${formatAddress(from)}</code></div>
        <div>To: <code class="text-xs">${formatAddress(to)}</code></div>
        <div>${app.createTxLink(receipt.hash)}</div>
      </div>
    `, 'success');
    refreshIcons();

    app.showToast('NFT 전송 완료!', 'success');
  } catch (error) {
    console.error('transferFrom error:', error);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="x-circle" class="w-4 h-4"></i> 전송 실패: ${parseContractError(error)}</span>`, 'error');
    refreshIcons();
  }
}

async function executeSafeTransferFrom(app) {
  if (!app.contract) {
    app.showToast('지갑을 연결하고 컨트랙트를 로드해주세요', 'warning');
    return;
  }

  const from = document.getElementById('safeTransferFrom').value.trim();
  const to = document.getElementById('safeTransferTo').value.trim();
  const tokenId = document.getElementById('safeTransferTokenId').value;

  if (!from || !ethers.isAddress(from)) {
    app.showToast('유효한 보내는 주소를 입력해주세요', 'warning');
    return;
  }

  if (!to || !ethers.isAddress(to)) {
    app.showToast('유효한 받는 주소를 입력해주세요', 'warning');
    return;
  }

  if (tokenId === '') {
    app.showToast('Token ID를 입력해주세요', 'warning');
    return;
  }

  const resultEl = 'safeTransferFromResult';
  app.showResult(resultEl, '<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 안전 전송 트랜잭션 전송 중...</span>', 'pending');
  refreshIcons();

  try {
    // Using the 3-argument version of safeTransferFrom
    const tx = await app.contract['safeTransferFrom(address,address,uint256)'](from, to, tokenId);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 트랜잭션 확인 대기 중...</span><br><small>TX: ${tx.hash}</small>`, 'pending');
    refreshIcons();

    const receipt = await tx.wait();

    app.showResult(resultEl, `
      <div class="space-y-2">
        <div class="text-green-600 font-medium flex items-center gap-2"><i data-lucide="check-circle" class="w-5 h-5"></i> 안전 전송 완료!</div>
        <div>Token #${tokenId}</div>
        <div>From: <code class="text-xs">${formatAddress(from)}</code></div>
        <div>To: <code class="text-xs">${formatAddress(to)}</code></div>
        <div class="text-gray-500 text-sm flex items-center gap-1"><i data-lucide="shield-check" class="w-4 h-4"></i> 수신자 검증 통과</div>
        <div>${app.createTxLink(receipt.hash)}</div>
      </div>
    `, 'success');
    refreshIcons();

    app.showToast('NFT 안전 전송 완료!', 'success');
  } catch (error) {
    console.error('safeTransferFrom error:', error);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="x-circle" class="w-4 h-4"></i> 안전 전송 실패: ${parseContractError(error)}</span>`, 'error');
    refreshIcons();
  }
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}
