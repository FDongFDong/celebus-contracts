# 백엔드 개발자 가이드 - MainVoting 시스템

**목적**: 블록체인을 몰라도 이해할 수 있는 백엔드 통합 가이드

## 1. 백엔드가 받아야 할 데이터

### 프론트엔드로부터 받는 데이터 (POST /api/votes/submit)

```typescript
interface VoteSubmission {
  // ===== 투표 레코드 (실제 투표 데이터) =====
  record: {
    timestamp: number;        // Unix timestamp (초 단위)
    missionId: number;        // 미션 ID
    votingId: number;         // 투표 ID
    userAddress: string;      // 사용자 지갑 주소 (0x로 시작하는 42자 문자열)
    candidateId: number;      // 후보자 ID
    voteType: number;         // 0 = REMEMBER, 1 = FORGET
    userId: string;           // 앱의 사용자 ID
    votingAmt: number;        // 투표 점수
  };

  // ===== 사용자 서명 (위 데이터의 진위 증명) =====
  signature: {
    user: string;             // 서명한 사용자 주소 (record.userAddress와 동일해야 함)
    userNonce: number;        // 사용자별 재사용 방지 번호
    recordIndices: number[];  // [0] (프론트는 항상 자기 레코드 1개만 = 인덱스 0)
    signature: string;        // 130자 hex 문자열 (0x + 128자)
  };
}
```

**예시 요청:**
```json
{
  "record": {
    "timestamp": 1703001234,
    "missionId": 1,
    "votingId": 1,
    "userAddress": "0x240eCdd1C5a7C30149D43987ce5A3Eb4e9E97897",
    "candidateId": 1,
    "voteType": 1,
    "userId": "user_12345",
    "votingAmt": 100
  },
  "signature": {
    "user": "0x240eCdd1C5a7C30149D43987ce5A3Eb4e9E97897",
    "userNonce": 0,
    "recordIndices": [0],
    "signature": "0x680cb0b325a235e3b1662abdb1dd31a6f78de210107a06b8870bce18447d5a183e35c960f3081201f8fa80b2522ba8026684836c8470c4aa0767433ac580f5e61b"
  }
}
```

## 2. 백엔드가 해야 할 일 (순서대로)

### STEP 1: 사용자 서명 검증 (필수!)

**왜 검증해야 하나요?**
- 누군가 다른 사람 이름으로 투표를 위조할 수 있습니다
- 서명은 "이 사람이 정말 이 데이터에 동의했다"는 증명입니다

**검증 방법:**

```typescript
import { ethers } from 'ethers';

async function verifyUserSignature(
  record: VoteRecord,
  sig: UserSignature
): Promise<boolean> {
  // 1. 레코드 해시 계산 (사용자가 서명한 데이터의 해시)
  const recordHash = hashVoteRecord(record);

  // 2. EIP-712 서명 검증
  const domain = {
    name: 'MainVoting',
    version: '1',
    chainId: 5611,  // opBNB Testnet
    verifyingContract: '0xYourContractAddress'
  };

  const types = {
    UserBatch: [
      { name: 'user', type: 'address' },
      { name: 'userNonce', type: 'uint256' },
      { name: 'recordsHash', type: 'bytes32' }
    ]
  };

  const value = {
    user: sig.user,
    userNonce: sig.userNonce,
    recordsHash: recordHash
  };

  // 3. 서명에서 주소 복구
  const recoveredAddress = ethers.verifyTypedData(
    domain,
    types,
    value,
    sig.signature
  );

  // 4. 복구된 주소가 사용자 주소와 일치하는지 확인
  return recoveredAddress.toLowerCase() === sig.user.toLowerCase();
}

// 레코드 해시 계산 함수
function hashVoteRecord(record: VoteRecord): string {
  const VOTE_RECORD_TYPEHASH = ethers.keccak256(
    ethers.toUtf8Bytes(
      'VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,bytes32 userIdHash,uint256 candidateId,uint8 voteType,uint256 votingAmt)'
    )
  );

  const userIdHash = ethers.keccak256(ethers.toUtf8Bytes(record.userId));

  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'uint256', 'uint256', 'uint256', 'address', 'bytes32', 'uint256', 'uint8', 'uint256'],
      [
        VOTE_RECORD_TYPEHASH,
        record.timestamp,
        record.missionId,
        record.votingId,
        record.userAddress,
        userIdHash,
        record.candidateId,
        record.voteType,
        record.votingAmt
      ]
    )
  );
}
```

### STEP 2: DB에 저장

```typescript
// votes 테이블 스키마
interface VoteDB {
  id: string;
  // 투표 데이터
  timestamp: number;
  missionId: number;
  votingId: number;
  userAddress: string;
  candidateId: number;
  voteType: number;
  userId: string;
  votingAmt: number;
  // 서명 데이터
  userNonce: number;
  signature: string;
  // 상태 관리
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  batchId?: string;  // 어느 배치에 포함되었는지
  txHash?: string;   // 블록체인 트랜잭션 해시
  createdAt: number;
}

async function saveVote(submission: VoteSubmission) {
  await db.votes.insert({
    ...submission.record,
    userNonce: submission.signature.userNonce,
    signature: submission.signature.signature,
    status: 'pending',
    createdAt: Date.now()
  });
}
```

### STEP 3: 배치 생성 (여러 사용자 투표 모으기)

**배치란?**
- 여러 사용자의 투표를 하나로 묶어서 한 번에 블록체인에 제출
- 가스비 절약 + 처리 효율 향상

```typescript
async function createBatch() {
  // 1. pending 상태인 투표들 가져오기
  const pendingVotes = await db.votes.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
    limit: 100  // 한 배치당 최대 100개
  });

  if (pendingVotes.length < 10) {
    // 최소 10개 모일 때까지 대기
    return null;
  }

  // 2. records 배열 생성 (블록체인에 전달할 데이터)
  const records = pendingVotes.map(vote => ({
    timestamp: vote.timestamp,
    missionId: vote.missionId,
    votingId: vote.votingId,
    userAddress: vote.userAddress,
    candidateId: vote.candidateId,
    voteType: vote.voteType,
    userId: vote.userId,
    votingAmt: vote.votingAmt
  }));

  // 3. 사용자별 서명 그룹화
  const userSignatures = groupSignaturesByUser(pendingVotes);

  // 4. Batch nonce 가져오기
  const batchNonce = await getNextBatchNonce();

  return {
    records,
    userBatchSigs: userSignatures,
    batchNonce,
    voteIds: pendingVotes.map(v => v.id)
  };
}

// 사용자별 서명 그룹화
function groupSignaturesByUser(votes: VoteDB[]) {
  const userMap = new Map<string, {
    userNonce: number;
    signature: string;
    recordIndices: number[];
  }>();

  votes.forEach((vote, index) => {
    const userAddr = vote.userAddress.toLowerCase();

    if (!userMap.has(userAddr)) {
      userMap.set(userAddr, {
        userNonce: vote.userNonce,
        signature: vote.signature,
        recordIndices: []
      });
    }

    // ⚠️ 중요: 배치 내에서의 인덱스 추가
    userMap.get(userAddr)!.recordIndices.push(index);
  });

  // UserBatchSig[] 형태로 변환
  return Array.from(userMap.entries()).map(([user, data]) => ({
    user,
    userNonce: data.userNonce,
    recordIndices: data.recordIndices,
    signature: data.signature
  }));
}
```

**핵심 포인트:**
```
프론트엔드가 보낸 recordIndices는 항상 [0]입니다 (자기 레코드 1개만)
백엔드가 배치를 만들 때 recordIndices를 재계산합니다!

예시:
- User A의 투표 → 배치의 0번째 → recordIndices: [0]
- User B의 투표 → 배치의 1번째 → recordIndices: [1]
- User A의 투표 → 배치의 2번째 → recordIndices: [0, 2]  (User A가 2개)
```

### STEP 4: Executor 서명 생성

**Executor란?**
- 백엔드 서버가 가진 특별한 권한의 지갑
- "이 배치를 내가 검토했고 승인합니다"라는 서명

**환경 변수 설정:**
```bash
# .env
EXECUTOR_PRIVATE_KEY=0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef
CONTRACT_ADDRESS=0x5C71FA65A2626AE57Eb2b86ef89957d4cC00C8B3
CHAIN_ID=5611
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
```

**Executor 서명 생성:**

```typescript
import { ethers } from 'ethers';

// Executor 지갑 초기화 (서버 시작 시 1회)
const executorWallet = new ethers.Wallet(process.env.EXECUTOR_PRIVATE_KEY!);

async function signBatch(batchNonce: number): Promise<string> {
  const domain = {
    name: 'MainVoting',
    version: '1',
    chainId: Number(process.env.CHAIN_ID),
    verifyingContract: process.env.CONTRACT_ADDRESS
  };

  const types = {
    Batch: [
      { name: 'batchNonce', type: 'uint256' }
    ]
  };

  const value = {
    batchNonce
  };

  // EIP-712 서명 생성
  const signature = await executorWallet.signTypedData(domain, types, value);

  return signature;  // 0x로 시작하는 130자 hex 문자열
}
```

**서명 데이터 설명:**
```
백엔드가 서명하는 데이터:
{
  batchNonce: 0  // 배치 번호 (0, 1, 2, ... 순차 증가)
}

의미: "나(Executor)는 배치 번호 0을 승인합니다"
```

### STEP 5: 블록체인에 제출

```typescript
async function submitBatchToBlockchain(batch: {
  records: VoteRecord[];
  userBatchSigs: UserBatchSig[];
  batchNonce: number;
  voteIds: string[];
}) {
  // 1. Executor 서명 생성
  const executorSig = await signBatch(batch.batchNonce);

  // 2. 블록체인 연결
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const executorWallet = new ethers.Wallet(
    process.env.EXECUTOR_PRIVATE_KEY!,
    provider
  );

  // 3. 컨트랙트 연결
  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS!,
    MAIN_VOTING_ABI,
    executorWallet
  );

  try {
    // 4. 트랜잭션 전송
    const tx = await contract.submitMultiUserBatch(
      batch.records,
      batch.userBatchSigs,
      batch.batchNonce,
      executorSig
    );

    console.log('트랜잭션 전송됨:', tx.hash);

    // 5. 트랜잭션 완료 대기
    const receipt = await tx.wait();

    console.log('트랜잭션 완료:', receipt.hash);
    console.log('사용된 가스:', receipt.gasUsed.toString());

    // 6. DB 상태 업데이트
    await db.votes.updateMany({
      where: { id: { in: batch.voteIds } },
      data: {
        status: 'confirmed',
        txHash: receipt.hash,
        batchId: `batch_${batch.batchNonce}`
      }
    });

    // 7. Batch nonce 증가
    await incrementBatchNonce();

    return receipt.hash;

  } catch (error: any) {
    console.error('블록체인 제출 실패:', error.message);

    // DB에 실패 상태 기록
    await db.votes.updateMany({
      where: { id: { in: batch.voteIds } },
      data: { status: 'failed' }
    });

    throw error;
  }
}
```

**컨트랙트 ABI (필요한 부분만):**
```typescript
const MAIN_VOTING_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "missionId", "type": "uint256" },
          { "internalType": "uint256", "name": "votingId", "type": "uint256" },
          { "internalType": "address", "name": "userAddress", "type": "address" },
          { "internalType": "uint256", "name": "candidateId", "type": "uint256" },
          { "internalType": "uint8", "name": "voteType", "type": "uint8" },
          { "internalType": "string", "name": "userId", "type": "string" },
          { "internalType": "uint256", "name": "votingAmt", "type": "uint256" }
        ],
        "internalType": "struct MainVoting.VoteRecord[]",
        "name": "records",
        "type": "tuple[]"
      },
      {
        "components": [
          { "internalType": "address", "name": "user", "type": "address" },
          { "internalType": "uint256", "name": "userNonce", "type": "uint256" },
          { "internalType": "uint256[]", "name": "recordIndices", "type": "uint256[]" },
          { "internalType": "bytes", "name": "signature", "type": "bytes" }
        ],
        "internalType": "struct MainVoting.UserBatchSig[]",
        "name": "userBatchSigs",
        "type": "tuple[]"
      },
      { "internalType": "uint256", "name": "batchNonce", "type": "uint256" },
      { "internalType": "bytes", "name": "executorSig", "type": "bytes" }
    ],
    "name": "submitMultiUserBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
```

## 3. Nonce 관리 (중요!)

### Nonce가 뭔가요?

**간단한 비유:**
- 은행 수표 번호라고 생각하세요
- 한 번 사용한 수표 번호는 다시 쓸 수 없습니다
- 이렇게 해야 같은 투표를 두 번 제출하는 것을 방지할 수 있습니다

### 두 종류의 Nonce

1. **User Nonce**: 각 사용자마다 따로 관리
2. **Batch Nonce**: 백엔드(Executor)가 관리

```typescript
// nonces 테이블 스키마
interface Nonce {
  address: string;  // 사용자 주소 또는 'BATCH'
  nonce: number;    // 현재 nonce 값
  lastUpdated: number;
}

// User Nonce 조회 (프론트엔드가 요청)
async function getUserNonce(userAddress: string): Promise<number> {
  let record = await db.nonces.findUnique({
    where: { address: userAddress.toLowerCase() }
  });

  if (!record) {
    // 처음 사용하는 사용자 → 컨트랙트에서 조회
    const contract = getContract();
    const contractNonce = await contract.userNonces(userAddress);

    record = await db.nonces.create({
      data: {
        address: userAddress.toLowerCase(),
        nonce: Number(contractNonce),
        lastUpdated: Date.now()
      }
    });
  }

  return record.nonce;
}

// Batch Nonce 조회
async function getNextBatchNonce(): Promise<number> {
  let record = await db.nonces.findUnique({
    where: { address: 'BATCH' }
  });

  if (!record) {
    // 최초 실행 → 컨트랙트에서 조회
    const contract = getContract();
    const contractNonce = await contract.batchNonce();

    record = await db.nonces.create({
      data: {
        address: 'BATCH',
        nonce: Number(contractNonce),
        lastUpdated: Date.now()
      }
    });
  }

  return record.nonce;
}

// Batch Nonce 증가 (제출 성공 후)
async function incrementBatchNonce() {
  await db.nonces.update({
    where: { address: 'BATCH' },
    data: {
      nonce: { increment: 1 },
      lastUpdated: Date.now()
    }
  });
}
```

### User Nonce는 언제 증가하나요?

**중요: User Nonce는 백엔드가 증가시키지 않습니다!**

- 블록체인 컨트랙트가 자동으로 증가시킵니다
- 프론트엔드는 다음 투표 시 증가된 nonce를 사용해야 합니다
- 백엔드는 프론트엔드에게 "현재 nonce가 얼마인지" 알려주기만 하면 됩니다

```typescript
// GET /api/votes/nonce/:userAddress
async function getUserCurrentNonce(userAddress: string) {
  // 1. DB에서 조회
  const dbNonce = await getUserNonce(userAddress);

  // 2. 컨트랙트에서도 조회 (동기화 확인)
  const contract = getContract();
  const contractNonce = await contract.userNonces(userAddress);

  // 3. 차이가 있으면 DB 업데이트
  if (Number(contractNonce) > dbNonce) {
    await db.nonces.update({
      where: { address: userAddress.toLowerCase() },
      data: { nonce: Number(contractNonce) }
    });

    return Number(contractNonce);
  }

  return dbNonce;
}
```

## 4. 배치 처리 스케줄러

```typescript
import cron from 'node-cron';

// 매 30초마다 배치 처리 시도
cron.schedule('*/30 * * * * *', async () => {
  try {
    const batch = await createBatch();

    if (!batch) {
      console.log('배치 생성 조건 미달 (최소 10개 필요)');
      return;
    }

    console.log(`배치 생성: ${batch.records.length}개 투표`);

    const txHash = await submitBatchToBlockchain(batch);

    console.log(`배치 제출 성공: ${txHash}`);

  } catch (error) {
    console.error('배치 처리 오류:', error);
    // Slack, Discord 등으로 알림
  }
});

// 또는 이벤트 기반
eventEmitter.on('vote:submitted', async () => {
  const pendingCount = await db.votes.count({
    where: { status: 'pending' }
  });

  // 50개 이상 모이면 즉시 처리
  if (pendingCount >= 50) {
    const batch = await createBatch();
    if (batch) {
      await submitBatchToBlockchain(batch);
    }
  }
});
```

## 5. 에러 처리

### Nonce 불일치 에러

```typescript
async function handleNonceMismatch(error: any, batch: Batch) {
  if (error.message.includes('InvalidBatchNonce')) {
    console.log('Batch nonce 불일치, 컨트랙트에서 재동기화...');

    // 컨트랙트에서 최신 nonce 가져오기
    const contract = getContract();
    const contractNonce = await contract.batchNonce();

    // DB 업데이트
    await db.nonces.update({
      where: { address: 'BATCH' },
      data: { nonce: Number(contractNonce) }
    });

    // 새로운 nonce로 재시도
    batch.batchNonce = Number(contractNonce);
    const newExecutorSig = await signBatch(batch.batchNonce);

    return await submitBatchToBlockchain({
      ...batch,
      executorSig: newExecutorSig
    });
  }

  throw error;
}
```

### 사용자 서명 불일치 에러

```typescript
if (error.message.includes('InvalidUserNonce')) {
  // 사용자가 오래된 nonce로 서명함
  // → 프론트엔드가 다시 서명해야 함
  // → 백엔드는 해당 투표를 'failed' 처리

  await db.votes.update({
    where: { id: voteId },
    data: {
      status: 'failed',
      errorMessage: 'User nonce outdated. Please vote again.'
    }
  });

  // 사용자에게 알림 (푸시, 이메일 등)
  await notifyUser(userAddress, 'Please submit your vote again');
}
```

## 6. 테스트 방법

### 1. 로컬 테스트

```typescript
// test.ts
async function testSubmitVote() {
  // 1. 테스트 데이터 생성
  const testVote = {
    record: {
      timestamp: Math.floor(Date.now() / 1000),
      missionId: 1,
      votingId: 1,
      userAddress: '0x240eCdd1C5a7C30149D43987ce5A3Eb4e9E97897',
      candidateId: 1,
      voteType: 1,
      userId: 'test_user',
      votingAmt: 100
    },
    signature: {
      user: '0x240eCdd1C5a7C30149D43987ce5A3Eb4e9E97897',
      userNonce: 0,
      recordIndices: [0],
      signature: '0x...'  // 실제 서명
    }
  };

  // 2. API 호출
  const response = await fetch('http://localhost:3000/api/votes/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testVote)
  });

  console.log('응답:', await response.json());
}
```

### 2. 배치 처리 테스트

```bash
# 10개의 투표 제출
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/votes/submit \
    -H "Content-Type: application/json" \
    -d @test_vote_$i.json
done

# 배치 처리 트리거 (수동)
curl -X POST http://localhost:3000/api/admin/process-batch
```

## 7. 프로덕션 체크리스트

- [ ] Private Key를 환경변수로 관리 (절대 코드에 하드코딩 X)
- [ ] 사용자 서명 검증 로직 구현
- [ ] Nonce 동기화 로직 구현
- [ ] 배치 처리 스케줄러 설정
- [ ] 에러 처리 및 재시도 로직
- [ ] 모니터링 및 알림 설정 (Slack, Discord 등)
- [ ] 가스비 모니터링 (Executor 지갑 잔액)
- [ ] DB 백업 및 복구 계획
- [ ] Rate Limiting (사용자당 투표 제한)
- [ ] 로그 수집 (성공/실패 트랜잭션)

## 8. FAQ

**Q: 블록체인을 몰라도 구현할 수 있나요?**
A: 네! 이 가이드만 따라하면 됩니다. ethers.js 라이브러리가 복잡한 부분을 처리해줍니다.

**Q: 가스비는 얼마나 드나요?**
A: opBNB Testnet은 거의 무료입니다. 메인넷에서는 배치당 약 $0.01-0.05 정도입니다.

**Q: 배치는 언제 제출하나요?**
A: 최소 10개 이상 모이거나, 30초 주기로 확인하여 제출합니다.

**Q: 사용자 서명 검증을 건너뛸 수 있나요?**
A: 절대 안 됩니다! 보안의 핵심입니다.

**Q: Executor Private Key를 잃어버리면?**
A: 새로운 Executor를 컨트랙트에 등록해야 합니다. 반드시 안전하게 보관하세요.

## 9. 요약: 데이터 흐름

```
프론트엔드 → 백엔드
├─ record (투표 데이터)
└─ signature (사용자 서명)

백엔드 처리
├─ 1. 서명 검증 ✅
├─ 2. DB 저장
├─ 3. 배치 생성
│   ├─ records[] 배열 생성
│   ├─ userBatchSigs[] 배열 생성 (recordIndices 재계산!)
│   └─ batchNonce 가져오기
├─ 4. Executor 서명 생성
└─ 5. 블록체인 제출
    ├─ submitMultiUserBatch(records, userBatchSigs, batchNonce, executorSig)
    └─ 트랜잭션 완료 대기

블록체인 → 백엔드
└─ 트랜잭션 해시 (영수증)
    └─ DB 업데이트 (confirmed)
```
