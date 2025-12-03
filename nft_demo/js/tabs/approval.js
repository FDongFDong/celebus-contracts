/**
 * Approval Tab - 승인 기능
 */

import { parseContractError, formatAddress } from '../config.js';

export function initApprovalTab(app) {
  // approve
  document.getElementById('approveBtn').addEventListener('click', async () => {
    await executeApprove(app);
  });

  // getApproved
  document.getElementById('getApprovedBtn').addEventListener('click', async () => {
    await queryGetApproved(app);
  });

  // setApprovalForAll
  document.getElementById('setApprovalForAllBtn').addEventListener('click', async () => {
    await executeSetApprovalForAll(app);
  });

  // isApprovedForAll
  document.getElementById('useIsApprovedMyAddressBtn').addEventListener('click', () => {
    if (app.connectedAddress) {
      document.getElementById('isApprovedOwner').value = app.connectedAddress;
    }
  });

  document.getElementById('isApprovedForAllBtn').addEventListener('click', async () => {
    await queryIsApprovedForAll(app);
  });
}

async function executeApprove(app) {
  if (!app.contract) {
    app.showToast('지갑을 연결하고 컨트랙트를 로드해주세요', 'warning');
    return;
  }

  const toAddress = document.getElementById('approveTo').value.trim();
  const tokenId = document.getElementById('approveTokenId').value;

  if (!toAddress || !ethers.isAddress(toAddress)) {
    app.showToast('유효한 주소를 입력해주세요', 'warning');
    return;
  }

  if (tokenId === '') {
    app.showToast('Token ID를 입력해주세요', 'warning');
    return;
  }

  const resultEl = 'approveResult';
  app.showResult(resultEl, '<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 승인 트랜잭션 전송 중...</span>', 'pending');
  refreshIcons();

  try {
    const tx = await app.contract.approve(toAddress, tokenId);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 트랜잭션 확인 대기 중...</span><br><small>TX: ${tx.hash}</small>`, 'pending');
    refreshIcons();

    const receipt = await tx.wait();

    app.showResult(resultEl, `
      <div class="space-y-2">
        <div class="text-green-600 font-medium flex items-center gap-2"><i data-lucide="check-circle" class="w-5 h-5"></i> 승인 완료!</div>
        <div>Token #${tokenId} → <code class="text-xs">${formatAddress(toAddress)}</code></div>
        <div>${app.createTxLink(receipt.hash)}</div>
      </div>
    `, 'success');
    refreshIcons();

    app.showToast('토큰 승인 완료!', 'success');
  } catch (error) {
    console.error('approve error:', error);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="x-circle" class="w-4 h-4"></i> 승인 실패: ${parseContractError(error)}</span>`, 'error');
    refreshIcons();
  }
}

async function queryGetApproved(app) {
  if (!app.readContract) {
    app.showToast('컨트랙트를 먼저 로드해주세요', 'warning');
    return;
  }

  const tokenId = document.getElementById('getApprovedTokenId').value;

  if (tokenId === '') {
    app.showToast('Token ID를 입력해주세요', 'warning');
    return;
  }

  const resultEl = 'getApprovedResult';

  try {
    const approved = await app.readContract.getApproved(tokenId);
    const isZeroAddress = approved === ethers.ZeroAddress;

    app.showResult(resultEl, `
      <div class="space-y-2">
        <div class="font-medium">Token #${tokenId} 승인된 주소:</div>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded block break-all ${isZeroAddress ? 'text-gray-400' : ''}">${approved}</code>
        ${isZeroAddress ? '<div class="text-gray-500 text-sm">승인된 주소가 없습니다</div>' : ''}
      </div>
    `, 'success');
  } catch (error) {
    console.error('getApproved error:', error);
    app.showResult(resultEl, `조회 실패: 토큰이 존재하지 않습니다`, 'error');
  }
}

async function executeSetApprovalForAll(app) {
  if (!app.contract) {
    app.showToast('지갑을 연결하고 컨트랙트를 로드해주세요', 'warning');
    return;
  }

  const operatorAddress = document.getElementById('operatorAddress').value.trim();
  const approvedValue = document.querySelector('input[name="approvalForAll"]:checked').value === 'true';

  if (!operatorAddress || !ethers.isAddress(operatorAddress)) {
    app.showToast('유효한 Operator 주소를 입력해주세요', 'warning');
    return;
  }

  const resultEl = 'setApprovalForAllResult';
  app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> ${approvedValue ? '승인' : '승인 취소'} 트랜잭션 전송 중...</span>`, 'pending');
  refreshIcons();

  try {
    const tx = await app.contract.setApprovalForAll(operatorAddress, approvedValue);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 트랜잭션 확인 대기 중...</span><br><small>TX: ${tx.hash}</small>`, 'pending');
    refreshIcons();

    const receipt = await tx.wait();

    app.showResult(resultEl, `
      <div class="space-y-2">
        <div class="text-green-600 font-medium flex items-center gap-2"><i data-lucide="check-circle" class="w-5 h-5"></i> ${approvedValue ? '전체 승인' : '승인 취소'} 완료!</div>
        <div>Operator: <code class="text-xs">${formatAddress(operatorAddress)}</code></div>
        <div>상태: <span class="${approvedValue ? 'text-green-600' : 'text-red-600'}">${approvedValue ? '승인됨' : '취소됨'}</span></div>
        <div>${app.createTxLink(receipt.hash)}</div>
      </div>
    `, 'success');
    refreshIcons();

    app.showToast(`전체 ${approvedValue ? '승인' : '승인 취소'} 완료!`, 'success');
  } catch (error) {
    console.error('setApprovalForAll error:', error);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="x-circle" class="w-4 h-4"></i> 실패: ${parseContractError(error)}</span>`, 'error');
    refreshIcons();
  }
}

async function queryIsApprovedForAll(app) {
  if (!app.readContract) {
    app.showToast('컨트랙트를 먼저 로드해주세요', 'warning');
    return;
  }

  const ownerAddress = document.getElementById('isApprovedOwner').value.trim();
  const operatorAddress = document.getElementById('isApprovedOperator').value.trim();

  if (!ownerAddress || !ethers.isAddress(ownerAddress)) {
    app.showToast('유효한 Owner 주소를 입력해주세요', 'warning');
    return;
  }

  if (!operatorAddress || !ethers.isAddress(operatorAddress)) {
    app.showToast('유효한 Operator 주소를 입력해주세요', 'warning');
    return;
  }

  const resultEl = 'isApprovedForAllResult';

  try {
    const approved = await app.readContract.isApprovedForAll(ownerAddress, operatorAddress);

    app.showResult(resultEl, `
      <div class="space-y-2">
        <div class="font-medium">전체 승인 상태:</div>
        <div>Owner: <code class="text-xs">${formatAddress(ownerAddress)}</code></div>
        <div>Operator: <code class="text-xs">${formatAddress(operatorAddress)}</code></div>
        <div class="mt-2">
          <span class="${approved ? 'text-green-600' : 'text-red-600'} font-medium text-lg flex items-center gap-1">
            <i data-lucide="${approved ? 'check-circle' : 'x-circle'}" class="w-5 h-5"></i>
            ${approved ? '승인됨 (true)' : '승인되지 않음 (false)'}
          </span>
        </div>
      </div>
    `, approved ? 'success' : 'error');
    refreshIcons();
  } catch (error) {
    console.error('isApprovedForAll error:', error);
    app.showResult(resultEl, `조회 실패: ${error.message}`, 'error');
  }
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}
