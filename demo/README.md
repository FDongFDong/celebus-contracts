# MainVoting 컨트랙트 사용 가이드

백엔드 개발자를 위한 MainVoting 컨트랙트 통합 가이드입니다.

## 📋 목차

1. [프로젝트 구조](#프로젝트-구조)
2. [빠른 시작](#빠른-시작)
3. [백엔드 통합](#백엔드-통합)
4. [프론트엔드 통합](#프론트엔드-통합)
5. [전체 플로우](#전체-플로우)
6. [문제 해결](#문제-해결)

## 프로젝트 구조

```
demo/
├── README.md                 # 이 파일
├── backend-example.js        # Node.js 백엔드 서명 예제
├── frontend-signing.js       # 프론트엔드 서명 예제
└── test-demo.html            # 통합 테스트 HTML (로컬 전용)
```

## 빠른 시작

### 1. 테스트 HTML 실행

가장 빠르게 전체 플로우를 확인하는 방법:

```bash
# 브라우저에서 파일 열기
open test-demo.html
```

**사용 방법:**
1. 사용자 비밀키 입력 (테스트용 키 생성 가능)
2. 투표 레코드 작성 및 추가
3. "서명 및 제출하기" 버튼 클릭
4. 트랜잭션 완료 대기
5. 결과 조회 섹션에서 득표 확인

### 2. 백엔드 예제 실행

Node.js 환경에서 Executor 서명 생성:

```bash
npm install ethers@6
node backend-example.js
```

**출력 예시:**
```
Executor Address: 0xDc45fE9fF7aF3522bB2B88a602670Ab4bE2C6f91
Batch Nonce: 0
Executor Signature: 0x1234...
Batch Hash: 0xabcd...
Signature Valid: true
```

## 백엔드 통합

### 설정 정보

```javascript
const CONFIG = {
  contractAddress: '0xc18a062C1AF323A1E3d57520661fF3f5baCCcf5e',
  rpcUrl: 'https://opbnb-testnet.infura.io/v3/ff3d0a25dafc4bfda7cb700771d89273',
  chainId: 5611,
  executorPrivateKey: '0xb43112fd82593f95dea3ba1a25eed28a6a75d6763677a42560b5d7815fea7977'
};
```

### 핵심 함수

#### 1. Executor 서명 생성

```javascript
const { signBatch } = require('./backend-example.js');

async function createExecutorSignature(batchNonce) {
  const signature = await signBatch(batchNonce);
  return signature;
}
```

#### 2. API 엔드포인트 예제 (Express)

```javascript
const express = require('express');
const { signBatch, getNextBatchNonce } = require('./backend-example.js');

const app = express();
app.use(express.json());

app.post('/api/vote/submit', async (req, res) => {
  try {
    const { records, userBatchSigs } = req.body;

    // 배치 nonce 생성
    const batchNonce = getNextBatchNonce();

    // Executor 서명 생성
    const executorSignature = await signBatch(batchNonce);

    res.json({ batchNonce, executorSignature });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Nonce 관리 전략

**옵션 1: In-Memory (단순)**
```javascript
let currentBatchNonce = 0;
function getNextBatchNonce() {
  return currentBatchNonce++;
}
```

**옵션 2: Redis (프로덕션)**
```javascript
const redis = require('redis');
const client = redis.createClient();

async function getNextBatchNonce() {
  const nonce = await client.incr('voting:batchNonce');
  return nonce - 1;
}
```

**옵션 3: Database (안정적)**
```javascript
async function getNextBatchNonce() {
  const [result] = await db.query(
    'UPDATE batch_nonce SET value = value + 1 WHERE id = 1 RETURNING value'
  );
  return result.value - 1;
}
```

## 프론트엔드 통합

### 설정

```html
<script src="https://cdn.ethers.io/lib/ethers-6.7.0.umd.min.js"></script>
<script src="frontend-signing.js"></script>
```

### 사용자 서명 생성

```javascript
const { signUserBatch, getUserNonce } = require('./frontend-signing.js');

async function submitVote(signer, records) {
  // 1. 사용자 nonce 조회
  const userAddress = await signer.getAddress();
  const userNonce = await getUserNonce(userAddress);

  // 2. 사용자 서명 생성
  const userBatchSig = await signUserBatch(signer, records, userNonce);

  // 3. 백엔드 API 호출
  const response = await fetch('/api/vote/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      records,
      userBatchSigs: [userBatchSig]
    })
  });

  const { batchNonce, executorSignature } = await response.json();

  // 4. 컨트랙트 호출
  const contract = new ethers.Contract(contractAddress, ABI, signer);
  const tx = await contract.submitMultiUserBatch(
    records,
    [userBatchSig],
    batchNonce,
    executorSignature
  );

  return await tx.wait();
}
```

### MetaMask 통합 예제

```javascript
// MetaMask 연결
await window.ethereum.request({ method: 'eth_requestAccounts' });
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 투표 제출
const records = [{
  timestamp: Math.floor(Date.now() / 1000),
  missionId: 1,
  votingId: 1,
  userAddress: await signer.getAddress(),
  candidateId: 1,
  voteType: 1, // Remember
  userId: 'user123',
  votingAmt: 100
}];

const receipt = await submitVote(signer, records);
console.log('TX Hash:', receipt.hash);
```

## 전체 플로우

### 1. 프론트엔드: 레코드 작성

```javascript
const record = {
  timestamp: Math.floor(Date.now() / 1000),
  missionId: 1,          // 미션 ID
  votingId: 1,           // 투표 라운드 ID
  userAddress: '0x...',  // 사용자 주소
  candidateId: 1,        // 후보자 ID
  voteType: 1,          // 0=Forget, 1=Remember
  userId: 'user123',    // 앱 사용자 ID
  votingAmt: 100        // 투표 포인트
};
```

### 2. 프론트엔드: 사용자 서명 생성

```javascript
// EIP-712 서명
const userBatchSig = await signUserBatch(signer, [record], userNonce);

// 결과:
// {
//   user: '0x...',
//   userNonce: 0,
//   recordIndices: [0],
//   signature: '0x...'
// }
```

### 3. 백엔드: Executor 서명 생성

```javascript
const batchNonce = getNextBatchNonce();
const executorSig = await signBatch(batchNonce);
```

### 4. 컨트랙트 호출

```javascript
await contract.submitMultiUserBatch(
  [record],              // 모든 레코드
  [userBatchSig],        // 사용자 서명 배열
  batchNonce,            // 배치 nonce
  executorSig            // Executor 서명
);
```

### 5. 결과 조회

```javascript
const { remember, forget, total } = await contract.getCandidateAggregates(
  missionId,
  candidateId
);

console.log('Remember:', remember.toString());
console.log('Forget:', forget.toString());
console.log('Total:', total.toString());
```

## 문제 해결

### 1. "InvalidSignature" 에러

**원인:** 서명이 올바르지 않음

**해결:**
- EIP-712 도메인 설정 확인 (chainId, verifyingContract)
- userId를 userIdHash로 변환했는지 확인
- recordsHash 계산이 올바른지 확인

```javascript
// 올바른 방법
const userIdHash = ethers.keccak256(ethers.toUtf8Bytes(record.userId));
```

### 2. "UserNonceAlreadyUsed" 에러

**원인:** 동일한 userNonce 재사용

**해결:**
```javascript
// 항상 최신 nonce 조회
const userNonce = await contract.minUserNonce(userAddress);
```

### 3. "BatchNonceAlreadyUsed" 에러

**원인:** 동일한 batchNonce 재사용

**해결:**
```javascript
// 백엔드에서 nonce 관리 강화
// Redis/DB 사용 권장
```

### 4. "UncoveredRecord" 에러

**원인:** 레코드가 사용자 서명에 포함되지 않음

**해결:**
```javascript
// recordIndices가 모든 레코드를 커버하는지 확인
const recordIndices = Array.from({ length: records.length }, (_, i) => i);
```

### 5. "CandidateNotAllowed" 에러

**원인:** 후보자가 등록되지 않음

**해결:**
```javascript
// Owner가 후보 등록 필요
await contract.setCandidate(missionId, candidateId, "Candidate Name", true);
```

## 보안 주의사항

### ⚠️ 절대 하지 말 것

1. **프론트엔드에 Executor 비밀키 노출**
   - Executor 서명은 반드시 백엔드에서만 생성
   - 환경 변수로 관리 (`.env` 파일)

2. **테스트 키를 프로덕션에서 사용**
   - `test-demo.html`은 로컬 테스트 전용
   - 실제 자산이 있는 키 절대 사용 금지

3. **Nonce 관리 소홀**
   - 동시성 문제 발생 가능
   - 트랜잭션 충돌로 인한 재시도 비용

### ✅ 권장 사항

1. **환경 변수 사용**
```bash
# .env
EXECUTOR_PRIVATE_KEY=0x...
RPC_URL=https://...
CONTRACT_ADDRESS=0x...
```

2. **에러 로깅**
```javascript
try {
  await submitVotes(...);
} catch (error) {
  logger.error('Vote submission failed', {
    error: error.message,
    stack: error.stack,
    records: records.length
  });
}
```

3. **Rate Limiting**
```javascript
// 사용자당 분당 10회 제한
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});

app.use('/api/vote', limiter);
```

## 참고 자료

- **컨트랙트 주소:** `0xc18a062C1AF323A1E3d57520661fF3f5baCCcf5e`
- **네트워크:** opBNB Testnet (Chain ID: 5611)
- **RPC URL:** `https://opbnb-testnet.infura.io/v3/ff3d0a25dafc4bfda7cb700771d89273`
- **Explorer:** https://opbnb-testnet.bscscan.com/

## 문의

추가 정보가 필요하시면 슬랙 또는 이메일로 연락 주세요.
