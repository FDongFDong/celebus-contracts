# 백엔드 통합 가이드

## 개요

MainVoting 컨트랙트는 다수의 사용자 투표를 배치로 처리하는 시스템입니다. 실제 프로덕션 환경에서는 **각 사용자가 자신의 기기에서 서명을 생성**하고, **백엔드 서버가 이를 수집하여 배치로 제출**합니다.

## 시스템 아키텍처

```
┌─────────────┐        ┌─────────────┐        ┌──────────────┐        ┌─────────────┐
│  User 1     │        │  User 2     │        │   Backend    │        │  Blockchain │
│  Device     │        │  Device     │        │   Server     │        │  Contract   │
└─────────────┘        └─────────────┘        └──────────────┘        └─────────────┘
       │                      │                       │                       │
       │ 1. 투표 레코드 생성   │                       │                       │
       │    + User 1 서명     │                       │                       │
       ├──────────────────────┼──────────────────────>│                       │
       │                      │                       │                       │
       │                      │ 2. 투표 레코드 생성   │                       │
       │                      │    + User 2 서명     │                       │
       │                      ├──────────────────────>│                       │
       │                      │                       │                       │
       │                      │                       │ 3. 배치 결합          │
       │                      │                       │    (records 배열)     │
       │                      │                       │                       │
       │                      │                       │ 4. Executor 서명      │
       │                      │                       │    생성               │
       │                      │                       │                       │
       │                      │                       │ 5. 컨트랙트 제출      │
       │                      │                       ├──────────────────────>│
       │                      │                       │                       │
       │                      │                       │                       │ 6. 검증 및
       │                      │                       │                       │    처리
       │                      │                       │<──────────────────────┤
       │                      │                       │                       │
```

## 백엔드 역할 및 책임

### 1. 사용자 레코드 수집 (API 엔드포인트)

```typescript
// POST /api/votes/submit
interface SubmitVoteRequest {
  record: VoteRecord;           // 투표 레코드
  userSignature: UserBatchSig;  // 사용자 서명
}

interface VoteRecord {
  timestamp: number;
  missionId: number;
  votingId: number;
  userAddress: string;
  candidateId: number;
  voteType: number;  // 0 = REMEMBER, 1 = FORGET
  userId: string;
  votingAmt: number;
}

interface UserBatchSig {
  user: string;           // 사용자 주소
  userNonce: number;      // 사용자 nonce
  recordIndices: number[]; // 이 배치에서 해당 레코드의 인덱스
  signature: string;      // EIP-712 서명
}
```

**백엔드 처리 로직:**
```typescript
async function handleUserVoteSubmission(req: SubmitVoteRequest) {
  // 1. 서명 검증 (EIP-712)
  const isValid = await verifyUserSignature(
    req.record,
    req.userSignature
  );

  if (!isValid) {
    throw new Error('Invalid signature');
  }

  // 2. DB에 저장 (pending 상태)
  await db.votes.insert({
    ...req.record,
    signature: req.userSignature,
    status: 'pending',
    createdAt: Date.now()
  });

  // 3. 배치 처리 큐에 추가
  await batchQueue.add({
    userId: req.record.userAddress,
    recordId: insertedId
  });
}
```

### 2. 배치 생성 및 결합

**배치 처리 전략:**

```typescript
interface BatchConfig {
  maxRecords: number;      // 최대 레코드 수 (예: 100개)
  maxWaitTime: number;     // 최대 대기 시간 (예: 30초)
  minRecords: number;      // 최소 레코드 수 (예: 10개)
}

async function processBatch(config: BatchConfig) {
  // 1. pending 상태 레코드 수집
  const pendingRecords = await db.votes.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
    limit: config.maxRecords
  });

  if (pendingRecords.length < config.minRecords) {
    // 최소 개수 미달 - 더 기다림
    return;
  }

  // 2. 레코드를 배열로 결합
  const records = pendingRecords.map(r => ({
    timestamp: r.timestamp,
    missionId: r.missionId,
    votingId: r.votingId,
    userAddress: r.userAddress,
    candidateId: r.candidateId,
    voteType: r.voteType,
    userId: r.userId,
    votingAmt: r.votingAmt
  }));

  // 3. 사용자별 서명 수집 및 recordIndices 업데이트
  const userSigMap = new Map<string, {
    signature: string;
    userNonce: number;
    recordIndices: number[];
  }>();

  pendingRecords.forEach((record, index) => {
    const userAddr = record.userAddress;

    if (!userSigMap.has(userAddr)) {
      userSigMap.set(userAddr, {
        signature: record.signature.signature,
        userNonce: record.signature.userNonce,
        recordIndices: []
      });
    }

    userSigMap.get(userAddr)!.recordIndices.push(index);
  });

  // 4. UserBatchSig 배열 생성
  const userBatchSigs = Array.from(userSigMap.entries()).map(([user, data]) => ({
    user,
    userNonce: data.userNonce,
    recordIndices: data.recordIndices,
    signature: data.signature
  }));

  // 5. Batch nonce 가져오기
  const batchNonce = await getNextBatchNonce();

  // 6. Executor 서명 생성
  const executorSig = await generateExecutorSignature(batchNonce);

  // 7. 컨트랙트 제출
  const txHash = await submitToContract({
    records,
    userBatchSigs,
    batchNonce,
    executorSig
  });

  // 8. DB 상태 업데이트
  await db.votes.updateMany({
    where: { id: { in: pendingRecords.map(r => r.id) } },
    data: {
      status: 'submitted',
      txHash,
      batchNonce,
      submittedAt: Date.now()
    }
  });

  return txHash;
}
```

### 3. Executor 서명 생성

```typescript
import { ethers } from 'ethers';

// Executor Private Key (환경변수에서 로드)
const EXECUTOR_PRIVATE_KEY = process.env.EXECUTOR_PRIVATE_KEY;
const executorWallet = new ethers.Wallet(EXECUTOR_PRIVATE_KEY);

// EIP-712 Domain
function getDomain(contractAddress: string, chainId: number) {
  return {
    name: 'MainVoting',
    version: '1',
    chainId,
    verifyingContract: contractAddress
  };
}

// Executor 서명 생성
async function generateExecutorSignature(batchNonce: number): Promise<string> {
  const domain = getDomain(
    CONTRACT_ADDRESS,
    CHAIN_ID
  );

  const types = {
    Batch: [
      { name: 'batchNonce', type: 'uint256' }
    ]
  };

  const value = {
    batchNonce
  };

  const signature = await executorWallet.signTypedData(domain, types, value);

  return signature;
}
```

### 4. 컨트랙트 제출

```typescript
async function submitToContract(batchData: {
  records: VoteRecord[];
  userBatchSigs: UserBatchSig[];
  batchNonce: number;
  executorSig: string;
}) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const executorWallet = new ethers.Wallet(EXECUTOR_PRIVATE_KEY, provider);

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    MAIN_VOTING_ABI,
    executorWallet
  );

  // 가스 추정
  const gasEstimate = await contract.submitMultiUserBatch.estimateGas(
    batchData.records,
    batchData.userBatchSigs,
    batchData.batchNonce,
    batchData.executorSig
  );

  // 트랜잭션 제출
  const tx = await contract.submitMultiUserBatch(
    batchData.records,
    batchData.userBatchSigs,
    batchData.batchNonce,
    batchData.executorSig,
    {
      gasLimit: gasEstimate * 120n / 100n // 20% 버퍼
    }
  );

  // 트랜잭션 대기
  const receipt = await tx.wait();

  console.log('Batch submitted:', receipt.hash);
  console.log('Gas used:', receipt.gasUsed.toString());

  return receipt.hash;
}
```

### 5. Nonce 관리

```typescript
// DB 스키마
interface NonceState {
  address: string;      // 사용자 또는 'BATCH' (executor용)
  nonce: number;        // 현재 nonce
  lastUpdated: number;  // 마지막 업데이트 시간
}

// 사용자 nonce 가져오기
async function getUserNonce(userAddress: string): Promise<number> {
  let state = await db.nonces.findUnique({
    where: { address: userAddress }
  });

  if (!state) {
    // 컨트랙트에서 현재 nonce 조회
    const contractNonce = await contract.userNonces(userAddress);

    state = await db.nonces.create({
      data: {
        address: userAddress,
        nonce: Number(contractNonce),
        lastUpdated: Date.now()
      }
    });
  }

  return state.nonce;
}

// 사용자 nonce 증가
async function incrementUserNonce(userAddress: string): Promise<number> {
  const updated = await db.nonces.update({
    where: { address: userAddress },
    data: {
      nonce: { increment: 1 },
      lastUpdated: Date.now()
    }
  });

  return updated.nonce;
}

// Batch nonce 가져오기
async function getNextBatchNonce(): Promise<number> {
  let state = await db.nonces.findUnique({
    where: { address: 'BATCH' }
  });

  if (!state) {
    // 컨트랙트에서 현재 batch nonce 조회
    const contractNonce = await contract.batchNonce();

    state = await db.nonces.create({
      data: {
        address: 'BATCH',
        nonce: Number(contractNonce),
        lastUpdated: Date.now()
      }
    });
  }

  return state.nonce;
}

// Batch nonce 증가 (제출 후)
async function incrementBatchNonce(): Promise<void> {
  await db.nonces.update({
    where: { address: 'BATCH' },
    data: {
      nonce: { increment: 1 },
      lastUpdated: Date.now()
    }
  });
}
```

### 6. 에러 처리 및 재시도

```typescript
async function submitBatchWithRetry(
  batchData: BatchData,
  maxRetries = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const txHash = await submitToContract(batchData);

      // 성공 시 batch nonce 증가
      await incrementBatchNonce();

      return txHash;

    } catch (error: any) {
      lastError = error;

      // Nonce 관련 에러 처리
      if (error.message.includes('InvalidBatchNonce')) {
        console.log('Batch nonce mismatch, syncing with contract...');

        // 컨트랙트에서 현재 nonce 다시 가져오기
        const contractNonce = await contract.batchNonce();
        await db.nonces.update({
          where: { address: 'BATCH' },
          data: { nonce: Number(contractNonce) }
        });

        // 새로운 nonce로 서명 재생성
        batchData.batchNonce = Number(contractNonce);
        batchData.executorSig = await generateExecutorSignature(batchData.batchNonce);

        continue; // 재시도
      }

      // 사용자 nonce 에러 처리
      if (error.message.includes('InvalidUserNonce')) {
        console.log('User nonce mismatch, cannot retry - user must re-sign');
        throw new Error('User signature invalid due to nonce mismatch');
      }

      // 가스 부족
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for gas');
      }

      // 기타 에러는 재시도
      console.log(`Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        // 지수 백오프
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
```

## 클라이언트 (프론트엔드) 역할

### 투표 제출 플로우

```typescript
// 1. 사용자가 투표 버튼 클릭
async function submitVote(
  missionId: number,
  candidateId: number,
  voteType: number
) {
  // 2. 지갑 연결 확인
  if (!wallet) {
    await connectWallet();
  }

  // 3. 백엔드에서 현재 nonce 조회
  const userNonce = await fetch('/api/votes/nonce', {
    method: 'POST',
    body: JSON.stringify({ userAddress: wallet.address })
  }).then(r => r.json());

  // 4. 투표 레코드 생성
  const record: VoteRecord = {
    timestamp: Math.floor(Date.now() / 1000),
    missionId,
    votingId: 1,
    userAddress: wallet.address,
    candidateId,
    voteType,
    userId: getUserId(), // 앱에서 관리하는 사용자 ID
    votingAmt: 1
  };

  // 5. 레코드 해시 계산
  const recordHash = hashVoteRecord(record);

  // 6. EIP-712 서명 생성
  const signature = await wallet.signTypedData(
    getDomain(),
    {
      UserBatch: [
        { name: 'user', type: 'address' },
        { name: 'userNonce', type: 'uint256' },
        { name: 'recordsHash', type: 'bytes32' }
      ]
    },
    {
      user: wallet.address,
      userNonce,
      recordsHash: recordHash
    }
  );

  // 7. 백엔드로 전송
  const response = await fetch('/api/votes/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      record,
      userSignature: {
        user: wallet.address,
        userNonce,
        recordIndices: [0], // 단일 레코드는 항상 [0]
        signature
      }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to submit vote');
  }

  // 8. 로컬 nonce 증가 (다음 투표 대비)
  localNonce++;

  return await response.json();
}
```

## 배치 처리 스케줄러

```typescript
// Cron job 또는 이벤트 기반 처리
import cron from 'node-cron';

// 매 30초마다 배치 처리
cron.schedule('*/30 * * * * *', async () => {
  try {
    await processBatch({
      maxRecords: 100,
      maxWaitTime: 30000,
      minRecords: 10
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    // 에러 로깅 및 알림
  }
});

// 또는 이벤트 기반
eventEmitter.on('vote:submitted', async () => {
  const pendingCount = await db.votes.count({
    where: { status: 'pending' }
  });

  // 충분한 레코드가 모이면 즉시 처리
  if (pendingCount >= 50) {
    await processBatch(config);
  }
});
```

## 보안 고려사항

### 1. Private Key 관리
```typescript
// ❌ 절대 하지 말 것
const EXECUTOR_PRIVATE_KEY = "0x1234..."; // 코드에 직접 하드코딩

// ✅ 환경변수 사용
const EXECUTOR_PRIVATE_KEY = process.env.EXECUTOR_PRIVATE_KEY;

// ✅ AWS Secrets Manager, HashiCorp Vault 등 사용
const EXECUTOR_PRIVATE_KEY = await getSecretFromVault('executor-key');
```

### 2. 서명 검증
```typescript
// 항상 사용자 서명을 백엔드에서도 검증
async function verifyUserSignature(
  record: VoteRecord,
  userSig: UserBatchSig
): Promise<boolean> {
  const recordHash = hashVoteRecord(record);

  const recoveredAddress = ethers.verifyTypedData(
    getDomain(),
    {
      UserBatch: [
        { name: 'user', type: 'address' },
        { name: 'userNonce', type: 'uint256' },
        { name: 'recordsHash', type: 'bytes32' }
      ]
    },
    {
      user: userSig.user,
      userNonce: userSig.userNonce,
      recordsHash: recordHash
    },
    userSig.signature
  );

  return recoveredAddress.toLowerCase() === userSig.user.toLowerCase();
}
```

### 3. Rate Limiting
```typescript
// 사용자당 요청 제한
import rateLimit from 'express-rate-limit';

const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 10, // 최대 10개 투표
  keyGenerator: (req) => req.body.record.userAddress
});

app.post('/api/votes/submit', voteLimiter, handleUserVoteSubmission);
```

## 모니터링

```typescript
// 메트릭 수집
interface BatchMetrics {
  timestamp: number;
  recordCount: number;
  userCount: number;
  gasUsed: bigint;
  txHash: string;
  status: 'success' | 'failed';
  errorMessage?: string;
}

// 대시보드 데이터
async function getBatchStats() {
  return {
    pending: await db.votes.count({ where: { status: 'pending' } }),
    submitted: await db.votes.count({ where: { status: 'submitted' } }),
    failed: await db.votes.count({ where: { status: 'failed' } }),
    avgBatchSize: await db.votes.aggregate({
      _avg: { batchSize: true }
    }),
    totalGasUsed: await db.metrics.aggregate({
      _sum: { gasUsed: true }
    })
  };
}
```

## 요약

**백엔드의 핵심 책임:**
1. ✅ 사용자별 투표 레코드 + 서명 수집
2. ✅ 레코드를 배치로 결합 (recordIndices 재계산)
3. ✅ Executor 서명 생성
4. ✅ 컨트랙트에 배치 제출
5. ✅ Nonce 관리 (사용자별 + 배치)
6. ✅ 에러 처리 및 재시도
7. ✅ 모니터링 및 로깅

**프론트엔드의 핵심 책임:**
1. ✅ 사용자 지갑 연결
2. ✅ 투표 레코드 생성
3. ✅ EIP-712 서명 생성
4. ✅ 백엔드로 전송
5. ✅ 결과 UI 업데이트
