/**
 * Minting Tab - 민팅 기능
 */

import { parseContractError } from '../config.js';

export function initMintingTab(app) {
  // Use my address buttons
  document.getElementById('useMintMyAddressBtn').addEventListener('click', () => {
    if (app.connectedAddress) {
      document.getElementById('mintToAddress').value = app.connectedAddress;
    }
  });

  document.getElementById('useBatchMintMyAddressBtn').addEventListener('click', () => {
    if (app.connectedAddress) {
      document.getElementById('batchMintToAddress').value = app.connectedAddress;
    }
  });

  // Safe mint
  document.getElementById('safeMintBtn').addEventListener('click', async () => {
    await executeSafeMint(app);
  });

  // Batch mint
  document.getElementById('batchMintBtn').addEventListener('click', async () => {
    await executeBatchMint(app);
  });
}

async function executeSafeMint(app) {
  if (!app.contract) {
    app.showToast('지갑을 연결하고 컨트랙트를 로드해주세요', 'warning');
    return;
  }

  const toAddress = document.getElementById('mintToAddress').value.trim();
  if (!toAddress || !ethers.isAddress(toAddress)) {
    app.showToast('유효한 주소를 입력해주세요', 'warning');
    return;
  }

  const resultEl = 'safeMintResult';
  app.showResult(resultEl, '<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 트랜잭션 전송 중...</span>', 'pending');
  refreshIcons();

  try {
    const tx = await app.contract.safeMint(toAddress);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 트랜잭션 확인 대기 중...</span><br><small>TX: ${tx.hash}</small>`, 'pending');
    refreshIcons();

    const receipt = await tx.wait();

    // Parse Transfer event to get tokenId
    let tokenId = 'N/A';
    for (const log of receipt.logs) {
      try {
        const parsed = app.contract.interface.parseLog(log);
        if (parsed && parsed.name === 'Transfer') {
          tokenId = parsed.args.tokenId.toString();
          break;
        }
      } catch (e) {
        // Not our event
      }
    }

    app.showResult(resultEl, `
      <div class="space-y-2">
        <div class="text-green-600 font-medium flex items-center gap-2"><i data-lucide="check-circle" class="w-5 h-5"></i> 민팅 성공!</div>
        <div>발행된 Token ID: <span class="font-bold text-purple-600">#${tokenId}</span></div>
        <div>받는 주소: <code class="text-xs">${toAddress}</code></div>
        <div>${app.createTxLink(receipt.hash)}</div>
      </div>
    `, 'success');
    refreshIcons();

    app.showToast('NFT 민팅 성공!', 'success');
  } catch (error) {
    console.error('safeMint error:', error);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="x-circle" class="w-4 h-4"></i> 민팅 실패: ${parseContractError(error)}</span>`, 'error');
    refreshIcons();
  }
}

async function executeBatchMint(app) {
  if (!app.contract) {
    app.showToast('지갑을 연결하고 컨트랙트를 로드해주세요', 'warning');
    return;
  }

  const toAddress = document.getElementById('batchMintToAddress').value.trim();
  if (!toAddress || !ethers.isAddress(toAddress)) {
    app.showToast('유효한 주소를 입력해주세요', 'warning');
    return;
  }

  const count = parseInt(document.getElementById('batchMintCount').value);
  if (!count || count < 1 || count > 1500) {
    app.showToast('발행 개수는 1~1500 사이여야 합니다', 'warning');
    return;
  }

  const resultEl = 'batchMintResult';
  app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> ${count}개 NFT 민팅 중...</span>`, 'pending');
  refreshIcons();

  try {
    const tx = await app.contract.batchMint(toAddress, count);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 트랜잭션 확인 대기 중...</span><br><small>TX: ${tx.hash}</small>`, 'pending');
    refreshIcons();

    const receipt = await tx.wait();

    // Parse BatchMinted event
    let startTokenId = 'N/A';
    let mintedCount = count;
    for (const log of receipt.logs) {
      try {
        const parsed = app.contract.interface.parseLog(log);
        if (parsed && parsed.name === 'BatchMinted') {
          startTokenId = parsed.args.startTokenId.toString();
          mintedCount = parsed.args.count.toString();
          break;
        }
      } catch (e) {
        // Not our event
      }
    }

    const endTokenId = startTokenId !== 'N/A' ? (BigInt(startTokenId) + BigInt(mintedCount) - 1n).toString() : 'N/A';

    app.showResult(resultEl, `
      <div class="space-y-2">
        <div class="text-green-600 font-medium flex items-center gap-2"><i data-lucide="check-circle" class="w-5 h-5"></i> 배치 민팅 성공!</div>
        <div>발행 개수: <span class="font-bold text-purple-600">${mintedCount}개</span></div>
        <div>Token ID 범위: <span class="font-bold">#${startTokenId} ~ #${endTokenId}</span></div>
        <div>받는 주소: <code class="text-xs">${toAddress}</code></div>
        <div>${app.createTxLink(receipt.hash)}</div>
      </div>
    `, 'success');
    refreshIcons();

    app.showToast(`${mintedCount}개 NFT 민팅 성공!`, 'success');
  } catch (error) {
    console.error('batchMint error:', error);
    app.showResult(resultEl, `<span class="flex items-center gap-2"><i data-lucide="x-circle" class="w-4 h-4"></i> 배치 민팅 실패: ${parseContractError(error)}</span>`, 'error');
    refreshIcons();
  }
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}
