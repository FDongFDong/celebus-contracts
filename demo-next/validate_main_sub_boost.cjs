/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  keccak256,
  encodeAbiParameters,
  stringToHex,
  concat,
  isAddress,
  getAddress,
} = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const ROOT = '/Users/goodblock/Project/celebus/contracts';
const BASE_URL = 'http://127.0.0.1:3005';
const RPC_URL = 'http://127.0.0.1:8545';
const RPC_PROXY_PATTERN = 'https://opbnb-testnet-rpc.bnbchain.org/**';

const ACCOUNTS = {
  owner: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    pk: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  user1: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    pk: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  },
};

const UNFUNDED_PK =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const DEFAULT_EXECUTOR = '0x240eCdd1C5a7C30149D43987ce5A3Eb4e9E97897';

const chain5611 = defineChain({
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
});

const owner = privateKeyToAccount(ACCOUNTS.owner.pk);
const user1 = privateKeyToAccount(ACCOUNTS.user1.pk);
const unfunded = privateKeyToAccount(UNFUNDED_PK);

const mainAbi = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'out/MainVoting.sol/MainVoting.json'), 'utf8')
).abi;
const subAbi = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'out/SubVoting.sol/SubVoting.json'), 'utf8')
).abi;
const boostAbi = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'out/Boosting.sol/Boosting.json'), 'utf8')
).abi;

const publicClient = createPublicClient({
  chain: chain5611,
  transport: http(RPC_URL),
});

const ownerWallet = createWalletClient({
  account: owner,
  chain: chain5611,
  transport: http(RPC_URL),
});
const unfundedWallet = createWalletClient({
  account: unfunded,
  chain: chain5611,
  transport: http(RPC_URL),
});
const badRpcWallet = createWalletClient({
  account: owner,
  chain: chain5611,
  transport: http('http://127.0.0.1:9555'),
});

function errMsg(error) {
  if (!error) return 'unknown';
  if (error instanceof Error) return error.message;
  return String(error);
}

function nowSec() {
  return BigInt(Math.floor(Date.now() / 1000));
}

async function waitFor(predicate, timeoutMs = 60000, intervalMs = 300) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await predicate()) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

async function waitForBodyRegex(page, regex, timeoutMs = 60000) {
  const ok = await waitFor(async () => {
    const body = (await page.textContent('body')) || '';
    return regex.test(body);
  }, timeoutMs);
  if (!ok) {
    throw new Error(`Timeout waiting body regex: ${regex}`);
  }
}

async function waitForClickable(locator, label = 'locator', timeoutMs = 30000, intervalMs = 250) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const visible = await locator.isVisible().catch(() => false);
    const enabled = await locator.isEnabled().catch(() => false);
    if (visible && enabled) {
      return;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Timeout waiting clickable button: ${label}`);
}

async function clickByRole(scope, role, nameOrRegex, timeoutMs = 30000) {
  const target = scope.getByRole(role, { name: nameOrRegex }).first();
  await waitForClickable(target, String(nameOrRegex), timeoutMs);

  try {
    await target.click({ force: true });
    return;
  } catch {
    const handle = await target.elementHandle();
    if (!handle) {
      throw new Error(`Failed to get button handle: ${String(nameOrRegex)}`);
    }

    await handle.evaluate((el) => {
      el.scrollIntoView({ block: 'center', inline: 'center' });
      el.click();
    });
  }
}

async function clickButton(scope, nameOrRegex, timeoutMs = 30000) {
  return clickByRole(scope, 'button', nameOrRegex, timeoutMs);
}

async function clickModeToggle(page, nameOrRegex, timeoutMs = 30000) {
  try {
    await clickByRole(page, 'radio', nameOrRegex, timeoutMs);
    return;
  } catch {
    // fallback for environments where role mapping differs
  }

  await clickButton(page, nameOrRegex, timeoutMs);
}

async function ensureWalletConnected(page) {
  const connectBtn = page.getByRole('button', { name: '지갑 연결' });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  if ((await connectBtn.count()) > 0) {
    try {
      await waitForClickable(connectBtn.first(), '지갑 연결', 15000);
      await connectBtn.first().click({ force: true });
    } catch {
      await page.evaluate(async () => {
        if (!window.ethereum || typeof window.ethereum.request !== 'function') return;
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      });
    }
  }

  const connected = await waitFor(async () => {
    const body = (await page.textContent('body')) || '';
    if (/0xf39f/i.test(body) || /지갑 연결 완료/i.test(body)) return true;
    const btnCount = await page.getByRole('button', { name: '지갑 연결' }).count();
    return btnCount === 0;
  }, 15000);
  if (!connected) {
    throw new Error('Wallet connect state did not change');
  }
}

function extractNewAddress(text, known) {
  return selectAddressFromText(text, known, { preferUnknown: true, preferLast: true });
}

function extractTextAddress(text, marker = '배포된 주소', preferLast = true) {
  const idx = text.lastIndexOf(marker);
  const targetText = idx >= 0 ? text.slice(idx, idx + 600) : text;
  return selectAddressFromText(targetText, null, { preferUnknown: false, preferLast });
}

function selectAddressFromText(
  text,
  known = null,
  { preferUnknown = true, preferLast = true } = {}
) {
  const matches = [...text.matchAll(/0x[a-fA-F0-9]{40}/g)].map((m) => m[0]);
  if (matches.length === 0) return null;

  if (preferUnknown && known && known.size > 0) {
    const ordered = preferLast ? [...matches].reverse() : matches;
    for (const address of ordered) {
      if (!known.has(address.toLowerCase())) {
        return address;
      }
    }
  }

  return preferLast ? matches[matches.length - 1] : matches[0];
}

async function extractAddressFromCard(page, cardTextRegex, known = null, preferLast = true) {
  const card = page.locator('[data-slot="card"]').filter({ hasText: cardTextRegex }).last();
  if ((await card.count()) === 0) return null;

  const cardText = (await card.textContent()) || '';
  return selectAddressFromText(cardText, known, { preferUnknown: true, preferLast });
}

async function resolveDeployedContractAddress(candidates) {
  const seen = new Set();

  for (const candidate of candidates) {
    if (!candidate || !isAddress(candidate)) continue;

    const normalized = getAddress(candidate);
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const hasCode = await waitFor(async () => {
      const bytecode = await publicClient.getBytecode({ address: normalized });
      return Boolean(bytecode && bytecode !== '0x');
    }, 8000, 250);

    if (hasCode) {
      return normalized;
    }
  }

  return null;
}

async function setExecutorInputIfExists(page, address) {
  const executorInput = page.getByLabel('Executor 주소').first();
  if ((await executorInput.count()) > 0) {
    await executorInput.fill(address);
  }
}

function getKnownSet() {
  const set = new Set();
  set.add(DEFAULT_EXECUTOR.toLowerCase());
  Object.values(ACCOUNTS).forEach((a) => set.add(a.address.toLowerCase()));
  [
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
    '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
    '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
  ].forEach((a) => set.add(a.toLowerCase()));
  return set;
}

async function setupBrowser() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route(RPC_PROXY_PATTERN, async (route) => {
    const req = route.request();
    const upstream = await fetch(RPC_URL, {
      method: req.method(),
      headers: { 'content-type': 'application/json' },
      body: req.postData() || undefined,
    });
    const text = await upstream.text();
    await route.fulfill({
      status: upstream.status,
      headers: { 'content-type': 'application/json' },
      body: text,
    });
  });

  await context.addInitScript((walletConfig) => {
    let currentChainIdHex = walletConfig.chainIdHex;
    let activeAccount = walletConfig.selectedAccount;

    const listeners = {
      accountsChanged: new Set(),
      chainChanged: new Set(),
    };

    const emit = (event, payload) => {
      const set = listeners[event];
      if (!set) return;
      for (const cb of set) {
        try {
          cb(payload);
        } catch {
          // noop
        }
      }
    };

    const rpc = async (method, params) => {
      const res = await fetch('https://opbnb-testnet-rpc.bnbchain.org', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params: params ?? [],
        }),
      });
      const data = await res.json();
      if (data.error) {
        const err = new Error(data.error.message || `${method} failed`);
        err.code = data.error.code;
        throw err;
      }
      return data.result;
    };

    const provider = {
      isMetaMask: true,
      get selectedAddress() {
        return activeAccount;
      },
      async request({ method, params }) {
        switch (method) {
          case 'eth_requestAccounts':
          case 'eth_accounts':
            return [activeAccount];
          case 'eth_chainId':
            return currentChainIdHex;
          case 'net_version':
            return String(parseInt(currentChainIdHex, 16));
          case 'wallet_requestPermissions':
            emit('accountsChanged', [activeAccount]);
            return [{ parentCapability: 'eth_accounts' }];
          case 'wallet_switchEthereumChain': {
            const chainId = params?.[0]?.chainId;
            if (typeof chainId === 'string') {
              currentChainIdHex = chainId.toLowerCase();
              emit('chainChanged', currentChainIdHex);
            }
            return null;
          }
          case 'wallet_addEthereumChain': {
            const chainId = params?.[0]?.chainId;
            if (typeof chainId === 'string') {
              currentChainIdHex = chainId.toLowerCase();
              emit('chainChanged', currentChainIdHex);
            }
            return null;
          }
          default:
            return rpc(method, params);
        }
      },
      on(event, cb) {
        listeners[event]?.add(cb);
      },
      removeListener(event, cb) {
        listeners[event]?.delete(cb);
      },
    };

    window.__walletTest = {
      setActiveAccount(address) {
        activeAccount = address;
        emit('accountsChanged', [activeAccount]);
      },
      getActiveAccount() {
        return activeAccount;
      },
    };

    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: provider,
    });
  }, {
    selectedAccount: ACCOUNTS.owner.address,
    chainIdHex: `0x${chain5611.id.toString(16)}`,
  });

  return { browser, context, page };
}

async function deployMainUI(page, knownSet, result) {
  await page.goto(`${BASE_URL}/main`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await ensureWalletConnected(page);
  await setExecutorInputIfExists(page, ACCOUNTS.owner.address);

  await clickButton(page, /MainVoting 컨트랙트 배포|컨트랙트 배포/);
  await waitForBodyRegex(page, /배포 완료!/);

  const body = (await page.textContent('body')) || '';
  const addr = await resolveDeployedContractAddress([
    (await extractAddressFromCard(page, /배포된 컨트랙트:/, knownSet, false)) ||
      null,
    extractNewAddress(body, knownSet),
  ]);
  if (!addr) throw new Error('Main contract address extraction failed');
  knownSet.add(addr.toLowerCase());

  await clickButton(page, /배포된 컨트랙트 주소 사용하기|이 주소 사용하기/);
  await clickButton(page, 'Executor 설정');
  await waitForBodyRegex(page, /Executor 설정 완료!/);

  await clickButton(page, '투표 타입 설정');
  await waitForBodyRegex(page, /투표 타입 이름 설정 완료!/);

  await clickButton(page, '아티스트 등록');
  await waitForBodyRegex(page, /아티스트 등록 완료!/);

  await page.screenshot({
    path: `${ROOT}/playwright-main-full-validation.png`,
    fullPage: true,
  });

  result.main.walletConnected = true;
  result.main.deploySetupSuccess = true;
  result.main.contractAddress = addr;
  return addr;
}

async function deploySubUI(page, knownSet, result) {
  await page.goto(`${BASE_URL}/sub`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await ensureWalletConnected(page);
  await setExecutorInputIfExists(page, ACCOUNTS.owner.address);

  await clickButton(page, /SubVoting 컨트랙트 배포/);
  await waitForBodyRegex(page, /배포 완료!/);

  const body = (await page.textContent('body')) || '';
  const addr = await resolveDeployedContractAddress([
    (await extractAddressFromCard(page, /배포된 컨트랙트:/, knownSet, false)) ||
      null,
    extractNewAddress(body, knownSet),
  ]);
  if (!addr) throw new Error('Sub contract address extraction failed');
  knownSet.add(addr.toLowerCase());

  await clickButton(page, /배포된 컨트랙트 주소 사용하기|이 주소 사용하기/);

  await clickButton(page, 'Executor 설정');
  await waitForBodyRegex(page, /Executor 설정 완료!/);

  await clickButton(page, '질문 등록');
  await waitForBodyRegex(page, /질문 등록 완료!/);

  await clickButton(page, '옵션 등록');
  await waitForBodyRegex(page, /옵션 등록 완료!/);

  await page.screenshot({
    path: `${ROOT}/playwright-sub-full-validation.png`,
    fullPage: true,
  });

  result.sub.walletConnected = true;
  result.sub.deploySetupSuccess = true;
  result.sub.contractAddress = addr;
  return addr;
}

async function deployBoostUI(page, knownSet, result) {
  await page.goto(`${BASE_URL}/boost`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await ensureWalletConnected(page);
  await setExecutorInputIfExists(page, ACCOUNTS.owner.address);

  await clickButton(page, /Boosting 컨트랙트 배포/);
  await waitForBodyRegex(page, /배포 완료!/);

  const body = (await page.textContent('body')) || '';
  const addr = await resolveDeployedContractAddress([
    (await extractAddressFromCard(page, /배포된 Boosting 컨트랙트:/, knownSet, false)) ||
      null,
    extractNewAddress(body, knownSet),
  ]);
  if (!addr) throw new Error('Boost contract address extraction failed');
  knownSet.add(addr.toLowerCase());

  await clickButton(page, /배포된 컨트랙트 주소 사용하기|이 주소 사용하기/);

  await clickButton(page, 'Executor 설정');
  await waitForBodyRegex(page, /Executor 설정 완료!/);

  await clickButton(page, '부스팅 타입 설정');
  await waitForBodyRegex(page, /부스팅 타입 이름 설정 완료!/);

  await clickButton(page, '아티스트 등록');
  await waitForBodyRegex(page, /아티스트 등록 완료!/);

  await page.screenshot({
    path: `${ROOT}/playwright-boost-full-validation.png`,
    fullPage: true,
  });

  result.boosting.walletConnected = true;
  result.boosting.deploySetupSuccess = true;
  result.boosting.contractAddress = addr;
  return addr;
}

async function deployErc20UI(page, knownSet, result) {
  await page.goto(`${BASE_URL}/erc20`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await ensureWalletConnected(page);

  await clickButton(page, /CelebToken 배포/);
  await waitForBodyRegex(page, /배포된 주소|성공적으로 배포되었습니다|자동 반영/);

  const body = (await page.textContent('body')) || '';
  const addr = await resolveDeployedContractAddress([
    (await extractAddressFromCard(page, /배포된 주소 \(자동 반영됨\)/, knownSet, false)) ||
      null,
    extractTextAddress(body, '배포된 주소', false),
    extractNewAddress(body, knownSet),
  ]);
  if (!addr) throw new Error('ERC20 contract address extraction failed');
  knownSet.add(addr.toLowerCase());

  await clickModeToggle(page, /배포된 컨트랙트 인터랙션/);
  await waitForBodyRegex(page, /ERC20 인터랙션 대상 토큰|5\. 조회\/검증/);

  await clickButton(page, '기본 조회 실행');
  await waitForBodyRegex(page, /Name:|Symbol:|Owner:/);

  const advanced = page.getByRole('button', { name: /고급 조회/ }).first();
  if ((await advanced.count()) > 0) {
    await clickButton(page, /고급 조회/);
    await clickButton(page, '이벤트 조회');
    await waitForBodyRegex(page, /이벤트 조회|Tx 영수증 조회/);
  }

  await page.screenshot({
    path: `${ROOT}/playwright-erc20-full-validation.png`,
    fullPage: true,
  });

  result.erc20.walletConnected = true;
  result.erc20.deploySuccess = true;
  result.erc20.tokenAddress = addr;
  result.erc20.interactionUIReady = true;
  result.erc20.queryUIVisible = true;
  return addr;
}

async function deployNftUI(page, knownSet, result) {
  await page.goto(`${BASE_URL}/nft`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await ensureWalletConnected(page);
  await waitForBodyRegex(page, /새 컨트랙트 배포|VIBENFT/);

  await clickButton(page, /VIBENFT 배포/);
  await waitForBodyRegex(page, /VIBENFT 배포 완료|배포된 컨트랙트 주소/);

  const body = (await page.textContent('body')) || '';
  const addr = await resolveDeployedContractAddress([
    (await extractAddressFromCard(page, /배포된 컨트랙트 주소/, knownSet, false)) ||
      null,
    extractTextAddress(body, '배포된 컨트랙트 주소', false),
    extractNewAddress(body, knownSet),
  ]);
  if (!addr) throw new Error('NFT contract address extraction failed');
  knownSet.add(addr.toLowerCase());

  await clickModeToggle(page, /배포된 컨트랙트 인터랙션/);
  await waitForBodyRegex(page, /NFT 인터랙션 대상 컨트랙트|setApprovalForAll|승인 상태 확인/);

  await page.screenshot({
    path: `${ROOT}/playwright-nft-full-validation.png`,
    fullPage: true,
  });

  result.nft.walletConnected = true;
  result.nft.deploySuccess = true;
  result.nft.contractAddress = addr;
  result.nft.interactionUIReady = true;
  return addr;
}

function hashMainRecord({ timestamp, missionId, votingId, optionId, voteType, votingAmt, user }) {
  const typeHash = keccak256(
    stringToHex(
      'VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 optionId,uint8 voteType,uint256 votingAmt,address user)'
    )
  );

  return keccak256(
    encodeAbiParameters(
      [
        { type: 'bytes32' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint8' },
        { type: 'uint256' },
        { type: 'address' },
      ],
      [typeHash, timestamp, missionId, votingId, optionId, voteType, votingAmt, user]
    )
  );
}

function hashSubRecord({ timestamp, missionId, votingId, questionId, optionId, votingAmt, user }) {
  const typeHash = keccak256(
    stringToHex(
      'VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 questionId,uint256 optionId,uint256 votingAmt,address user)'
    )
  );

  return keccak256(
    encodeAbiParameters(
      [
        { type: 'bytes32' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'address' },
      ],
      [typeHash, timestamp, missionId, votingId, questionId, optionId, votingAmt, user]
    )
  );
}

function hashBoostRecord({ timestamp, missionId, boostingId, optionId, boostingWith, amt, user }) {
  const typeHash = keccak256(
    stringToHex(
      'BoostRecord(uint256 timestamp,uint256 missionId,uint256 boostingId,uint256 optionId,uint8 boostingWith,uint256 amt,address user)'
    )
  );

  return keccak256(
    encodeAbiParameters(
      [
        { type: 'bytes32' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint8' },
        { type: 'uint256' },
        { type: 'address' },
      ],
      [typeHash, timestamp, missionId, boostingId, optionId, boostingWith, amt, user]
    )
  );
}

async function runMainOnchain(mainAddress, result) {
  const domain = {
    name: 'MainVoting',
    version: '1',
    chainId: chain5611.id,
    verifyingContract: mainAddress,
  };

  const record = {
    recordId: 1n,
    timestamp: nowSec(),
    missionId: 1n,
    votingId: 10001n,
    optionId: 1n,
    voteType: 0,
    userId: 'user-main',
    votingAmt: 10n,
  };

  const userNonce = 101n;
  const batchNonce = 5001n;

  const recordHash = hashMainRecord({
    timestamp: record.timestamp,
    missionId: record.missionId,
    votingId: record.votingId,
    optionId: record.optionId,
    voteType: record.voteType,
    votingAmt: record.votingAmt,
    user: user1.address,
  });
  const recordsHash = keccak256(concat([recordHash]));

  const userSig = await user1.signTypedData({
    domain,
    types: {
      UserBatch: [
        { name: 'user', type: 'address' },
        { name: 'userNonce', type: 'uint256' },
        { name: 'recordsHash', type: 'bytes32' },
      ],
    },
    primaryType: 'UserBatch',
    message: {
      user: user1.address,
      userNonce,
      recordsHash,
    },
  });

  const executorSig = await owner.signTypedData({
    domain,
    types: {
      Batch: [{ name: 'batchNonce', type: 'uint256' }],
    },
    primaryType: 'Batch',
    message: { batchNonce },
  });

  const batches = [
    [
      [
        [
          record.recordId,
          record.timestamp,
          record.missionId,
          record.votingId,
          record.optionId,
          record.voteType,
          record.userId,
          record.votingAmt,
        ],
      ],
      [user1.address, userNonce, userSig],
    ],
  ];

  const txHash = await ownerWallet.writeContract({
    address: mainAddress,
    abi: mainAbi,
    functionName: 'submitMultiUserBatch',
    args: [batches, batchNonce, executorSig],
  });
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  result.main.onchainSuccess = true;
  result.main.successTxHash = txHash;

  try {
    await ownerWallet.writeContract({
      address: mainAddress,
      abi: mainAbi,
      functionName: 'submitMultiUserBatch',
      args: [batches, batchNonce, executorSig],
    });
  } catch (error) {
    result.main.revert = true;
    result.main.revertMessage = errMsg(error);
  }

  try {
    const userNonce2 = 102n;
    const batchNonce2 = 5002n;
    const userSig2 = await user1.signTypedData({
      domain,
      types: {
        UserBatch: [
          { name: 'user', type: 'address' },
          { name: 'userNonce', type: 'uint256' },
          { name: 'recordsHash', type: 'bytes32' },
        ],
      },
      primaryType: 'UserBatch',
      message: {
        user: user1.address,
        userNonce: userNonce2,
        recordsHash,
      },
    });

    const executorSig2 = await owner.signTypedData({
      domain,
      types: { Batch: [{ name: 'batchNonce', type: 'uint256' }] },
      primaryType: 'Batch',
      message: { batchNonce: batchNonce2 },
    });

    const batches2 = [
      [
        [
          [
            2n,
            record.timestamp + 1n,
            record.missionId,
            record.votingId + 1n,
            record.optionId,
            record.voteType,
            record.userId,
            record.votingAmt,
          ],
        ],
        [user1.address, userNonce2, userSig2],
      ],
    ];

    await unfundedWallet.writeContract({
      address: mainAddress,
      abi: mainAbi,
      functionName: 'submitMultiUserBatch',
      args: [batches2, batchNonce2, executorSig2],
    });
  } catch (error) {
    result.main.gasError = true;
    result.main.gasErrorMessage = errMsg(error);
  }

  try {
    await badRpcWallet.writeContract({
      address: mainAddress,
      abi: mainAbi,
      functionName: 'submitMultiUserBatch',
      args: [batches, 5999n, executorSig],
    });
  } catch (error) {
    result.main.networkError = true;
    result.main.networkErrorMessage = errMsg(error);
  }
}

async function runSubOnchain(subAddress, result) {
  const domain = {
    name: 'SubVoting',
    version: '1',
    chainId: chain5611.id,
    verifyingContract: subAddress,
  };

  const record = {
    recordId: 1n,
    timestamp: nowSec(),
    missionId: 1n,
    votingId: 20001n,
    userId: 'user-sub',
    questionId: 1n,
    optionId: 1n,
    votingAmt: 15n,
  };

  const recordHash = hashSubRecord({
    timestamp: record.timestamp,
    missionId: record.missionId,
    votingId: record.votingId,
    questionId: record.questionId,
    optionId: record.optionId,
    votingAmt: record.votingAmt,
    user: user1.address,
  });
  const recordsHash = keccak256(concat([recordHash]));

  const userNonce = 201n;
  const batchNonce = 6001n;

  const userSig = await user1.signTypedData({
    domain,
    types: {
      UserBatch: [
        { name: 'user', type: 'address' },
        { name: 'userNonce', type: 'uint256' },
        { name: 'recordsHash', type: 'bytes32' },
      ],
    },
    primaryType: 'UserBatch',
    message: {
      user: user1.address,
      userNonce,
      recordsHash,
    },
  });

  const executorSig = await owner.signTypedData({
    domain,
    types: {
      Batch: [{ name: 'batchNonce', type: 'uint256' }],
    },
    primaryType: 'Batch',
    message: { batchNonce },
  });

  const batches = [
    [
      [
        [
          record.recordId,
          record.timestamp,
          record.missionId,
          record.votingId,
          record.userId,
          record.questionId,
          record.optionId,
          record.votingAmt,
        ],
      ],
      [user1.address, userNonce, userSig],
    ],
  ];

  const txHash = await ownerWallet.writeContract({
    address: subAddress,
    abi: subAbi,
    functionName: 'submitMultiUserBatch',
    args: [batches, batchNonce, executorSig],
  });
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  result.sub.onchainSuccess = true;
  result.sub.successTxHash = txHash;

  try {
    await ownerWallet.writeContract({
      address: subAddress,
      abi: subAbi,
      functionName: 'submitMultiUserBatch',
      args: [batches, batchNonce, executorSig],
    });
  } catch (error) {
    result.sub.revert = true;
    result.sub.revertMessage = errMsg(error);
  }

  try {
    await unfundedWallet.writeContract({
      address: subAddress,
      abi: subAbi,
      functionName: 'submitMultiUserBatch',
      args: [batches, 6002n, executorSig],
    });
  } catch (error) {
    result.sub.gasError = true;
    result.sub.gasErrorMessage = errMsg(error);
  }

  try {
    await badRpcWallet.writeContract({
      address: subAddress,
      abi: subAbi,
      functionName: 'submitMultiUserBatch',
      args: [batches, 6999n, executorSig],
    });
  } catch (error) {
    result.sub.networkError = true;
    result.sub.networkErrorMessage = errMsg(error);
  }
}

async function runBoostOnchain(boostAddress, result) {
  const domain = {
    name: 'Boosting',
    version: '1',
    chainId: chain5611.id,
    verifyingContract: boostAddress,
  };

  const record = {
    recordId: 1n,
    timestamp: nowSec(),
    missionId: 1n,
    boostingId: 30001n,
    userId: 'user-boost',
    optionId: 1n,
    boostingWith: 0,
    amt: 100n,
  };

  const recordHash = hashBoostRecord({
    timestamp: record.timestamp,
    missionId: record.missionId,
    boostingId: record.boostingId,
    optionId: record.optionId,
    boostingWith: record.boostingWith,
    amt: record.amt,
    user: user1.address,
  });

  const userNonce = 301n;
  const batchNonce = 7001n;

  const userSig = await user1.signTypedData({
    domain,
    types: {
      UserSig: [
        { name: 'user', type: 'address' },
        { name: 'userNonce', type: 'uint256' },
        { name: 'recordHash', type: 'bytes32' },
      ],
    },
    primaryType: 'UserSig',
    message: {
      user: user1.address,
      userNonce,
      recordHash,
    },
  });

  const executorSig = await owner.signTypedData({
    domain,
    types: {
      Batch: [{ name: 'batchNonce', type: 'uint256' }],
    },
    primaryType: 'Batch',
    message: { batchNonce },
  });

  const batches = [
    [
      [
        record.recordId,
        record.timestamp,
        record.missionId,
        record.boostingId,
        record.userId,
        record.optionId,
        record.boostingWith,
        record.amt,
      ],
      [user1.address, userNonce, userSig],
    ],
  ];

  const txHash = await ownerWallet.writeContract({
    address: boostAddress,
    abi: boostAbi,
    functionName: 'submitBoostBatch',
    args: [batches, batchNonce, executorSig],
  });
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  result.boosting.onchainSuccess = true;
  result.boosting.successTxHash = txHash;

  try {
    await ownerWallet.writeContract({
      address: boostAddress,
      abi: boostAbi,
      functionName: 'submitBoostBatch',
      args: [batches, batchNonce, executorSig],
    });
  } catch (error) {
    result.boosting.revert = true;
    result.boosting.revertMessage = errMsg(error);
  }

  try {
    await unfundedWallet.writeContract({
      address: boostAddress,
      abi: boostAbi,
      functionName: 'submitBoostBatch',
      args: [batches, 7002n, executorSig],
    });
  } catch (error) {
    result.boosting.gasError = true;
    result.boosting.gasErrorMessage = errMsg(error);
  }

  try {
    await badRpcWallet.writeContract({
      address: boostAddress,
      abi: boostAbi,
      functionName: 'submitBoostBatch',
      args: [batches, 7999n, executorSig],
    });
  } catch (error) {
    result.boosting.networkError = true;
    result.boosting.networkErrorMessage = errMsg(error);
  }
}

async function main() {
  const result = {
    main: {
      walletConnected: false,
      deploySetupSuccess: false,
      contractAddress: null,
      onchainSuccess: false,
      successTxHash: null,
      revert: false,
      revertMessage: null,
      gasError: false,
      gasErrorMessage: null,
      networkError: false,
      networkErrorMessage: null,
    },
    sub: {
      walletConnected: false,
      deploySetupSuccess: false,
      contractAddress: null,
      onchainSuccess: false,
      successTxHash: null,
      revert: false,
      revertMessage: null,
      gasError: false,
      gasErrorMessage: null,
      networkError: false,
      networkErrorMessage: null,
    },
    boosting: {
      walletConnected: false,
      deploySetupSuccess: false,
      contractAddress: null,
      onchainSuccess: false,
      successTxHash: null,
      revert: false,
      revertMessage: null,
      gasError: false,
      gasErrorMessage: null,
      networkError: false,
      networkErrorMessage: null,
    },
    erc20: {
      walletConnected: false,
      deploySuccess: false,
      tokenAddress: null,
      interactionUIReady: false,
      queryUIVisible: false,
    },
    nft: {
      walletConnected: false,
      deploySuccess: false,
      contractAddress: null,
      interactionUIReady: false,
    },
    notes: [],
  };

  const knownSet = getKnownSet();

  const { browser, page } = await setupBrowser();
  const addresses = {
    main: null,
    sub: null,
    boost: null,
  };

  async function runStep(label, step) {
    try {
      await step();
    } catch (error) {
      result.notes.push(`${label}: ${errMsg(error)}`);
    }
  }

  try {
    await runStep('deploy-main-ui', async () => {
      addresses.main = await deployMainUI(page, knownSet, result);
    });
    await runStep('deploy-sub-ui', async () => {
      addresses.sub = await deploySubUI(page, knownSet, result);
    });
    await runStep('deploy-boost-ui', async () => {
      addresses.boost = await deployBoostUI(page, knownSet, result);
    });
    await runStep('deploy-erc20-ui', async () => {
      await deployErc20UI(page, knownSet, result);
    });
    await runStep('deploy-nft-ui', async () => {
      await deployNftUI(page, knownSet, result);
    });

    await runStep('run-main-onchain', async () => {
      if (!addresses.main) throw new Error('main contract address missing');
      await runMainOnchain(addresses.main, result);
    });
    await runStep('run-sub-onchain', async () => {
      if (!addresses.sub) throw new Error('sub contract address missing');
      await runSubOnchain(addresses.sub, result);
    });
    await runStep('run-boost-onchain', async () => {
      if (!addresses.boost) throw new Error('boost contract address missing');
      await runBoostOnchain(addresses.boost, result);
    });
  } catch (error) {
    result.notes.push(`Unhandled: ${errMsg(error)}`);
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
