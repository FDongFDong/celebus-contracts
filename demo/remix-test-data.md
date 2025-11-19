# MainVoting 리믹스 IDE 테스트 가이드

백엔드 개발자가 실제로 받을 데이터와 컨트랙트에 전달할 데이터를 복사-붙여넣기로 테스트할 수 있습니다.

## 📋 테스트 순서

### 1단계: ExecutorSigner 설정 (Owner만 가능)

**함수:** `setExecutorSigner`

**입력값:**
```
0xDc45fE9fF7aF3522bB2B88a602670Ab4bE2C6f91
```

---

### 2단계: 후보 등록 (Owner만 가능)

**함수:** `setCandidate`

**입력값:**
```
1, 1, "Artist-1", true
```

**설명:**
- missionId: 1
- candidateId: 1
- name: "Artist-1"
- allowed: true

**추가 후보 등록:**
```
1, 2, "Artist-2", true
```

---

### 3단계: 투표 제출 테스트

## 📦 프론트엔드가 백엔드로 보내는 데이터

```json
{
  "records": [
    {
      "timestamp": 1731926400,
      "missionId": 1,
      "votingId": 1,
      "userAddress": "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A",
      "candidateId": 1,
      "voteType": 1,
      "userId": "user01",
      "votingAmt": 100
    }
  ],
  "userBatchSigs": [
    {
      "user": "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A",
      "userNonce": 0,
      "recordIndices": [0],
      "signature": "0x62e00b08d27231936edf078162d085f4bb1017beeee5ee73d153bd4a148953316b6ec96ce7655de095fa71d3a52f60917da23b7833fc51a4db647bad8d67d6de1b"
    }
  ]
}
```

## 🔐 백엔드가 생성하는 데이터

**Batch Nonce:**
```
0
```

**Executor Signature (백엔드가 생성):**
```
0x375d1d517df166576a55ccad011386370ca22e92b92abb902a0bcdeddacda711345a1a6f24a134f56b0658980ca17832564d21455e4dae20e6300607d39f7bbb1b
```

---

## 🚀 리믹스 IDE에서 submitMultiUserBatch 호출

### 함수: `submitMultiUserBatch`

### 파라미터 형식:

```javascript
[
  // records (VoteRecord[])
  [
    [
      1731926400,  // timestamp
      1,           // missionId
      1,           // votingId
      "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A",  // userAddress
      1,           // candidateId
      1,           // voteType
      "user01",    // userId
      100          // votingAmt
    ]
  ],
  // userBatchSigs (UserBatchSig[])
  [
    [
      "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A",  // user
      0,                                              // userNonce
      [0],                                            // recordIndices
      "0x62e00b08d27231936edf078162d085f4bb1017beeee5ee73d153bd4a148953316b6ec96ce7655de095fa71d3a52f60917da23b7833fc51a4db647bad8d67d6de1b"  // signature
    ]
  ],
  // batchNonce
  0,
  // executorSig
  "0x375d1d517df166576a55ccad011386370ca22e92b92abb902a0bcdeddacda711345a1a6f24a134f56b0658980ca17832564d21455e4dae20e6300607d39f7bbb1b"
]
```

---

## 📊 복수 레코드 예제 (2개 레코드)

### 프론트엔드 → 백엔드 데이터:

```json
{
  "records": [
    {
      "timestamp": 1731926400,
      "missionId": 1,
      "votingId": 1,
      "userAddress": "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A",
      "candidateId": 1,
      "voteType": 1,
      "userId": "user01",
      "votingAmt": 100
    },
    {
      "timestamp": 1731926401,
      "missionId": 1,
      "votingId": 1,
      "userAddress": "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A",
      "candidateId": 2,
      "voteType": 0,
      "userId": "user01",
      "votingAmt": 50
    }
  ],
  "userBatchSigs": [
    {
      "user": "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A",
      "userNonce": 0,
      "recordIndices": [0, 1],
      "signature": "0x..."
    }
  ]
}
```

### 리믹스 IDE 입력:

```javascript
[
  [
    [1731926400, 1, 1, "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A", 1, 1, "user01", 100],
    [1731926401, 1, 1, "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A", 2, 0, "user01", 50]
  ],
  [
    ["0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A", 0, [0, 1], "0x..."]
  ],
  0,
  "0x..."
]
```

---

## 🔍 결과 조회

### 함수: `getCandidateAggregates`

**입력:**
```
1, 1
```

**출력 예시:**
```
remember: 100
forget: 0
total: 100
```

### 함수: `getVoteSummariesByMissionVotingId`

**입력:**
```
1, 1
```

**출력:** VoteRecordSummary 배열

---

## 💡 백엔드 API 플로우

### 1. 프론트엔드 → 백엔드 요청

```http
POST /api/vote/submit
Content-Type: application/json

{
  "records": [...],
  "userBatchSigs": [...]
}
```

### 2. 백엔드 처리

```javascript
// Batch Nonce 생성
const batchNonce = getNextBatchNonce(); // 0

// Executor 서명 생성
const executorSig = await signBatch(batchNonce);
// "0x375d1d517df166576a55ccad011386370ca22e92b92abb902a0bcdeddacda711345a1a6f24a134f56b0658980ca17832564d21455e4dae20e6300607d39f7bbb1b"
```

### 3. 백엔드 → 프론트엔드 응답

```json
{
  "batchNonce": 0,
  "executorSignature": "0x375d1d517df166576a55ccad011386370ca22e92b92abb902a0bcdeddacda711345a1a6f24a134f56b0658980ca17832564d21455e4dae20e6300607d39f7bbb1b"
}
```

### 4. 프론트엔드가 컨트랙트 호출

위의 리믹스 IDE 입력 형식으로 `submitMultiUserBatch` 호출

---

## 🎯 실제 테스트 시나리오

### 시나리오 1: 단일 사용자, 단일 투표

1. **setCandidate** 호출
   ```
   1, 1, "Artist-1", true
   ```

2. **submitMultiUserBatch** 호출 (리믹스에 붙여넣기)
   ```javascript
   [[["1731926400","1","1","0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A","1","1","user01","100"]],[["0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A","0",["0"],"0x62e00b08d27231936edf078162d085f4bb1017beeee5ee73d153bd4a148953316b6ec96ce7655de095fa71d3a52f60917da23b7833fc51a4db647bad8d67d6de1b"]],"0","0x375d1d517df166576a55ccad011386370ca22e92b92abb902a0bcdeddacda711345a1a6f24a134f56b0658980ca17832564d21455e4dae20e6300607d39f7bbb1b"]
   ```

3. **getCandidateAggregates** 조회
   ```
   1, 1
   ```

### 시나리오 2: 복수 사용자

**User 1 레코드:**
```javascript
[1731926400, 1, 1, "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A", 1, 1, "user01", 100]
```

**User 2 레코드:**
```javascript
[1731926400, 1, 1, "0xAnotherUserAddress...", 1, 1, "user02", 50]
```

**submitMultiUserBatch 호출:**
```javascript
[
  [
    [1731926400, 1, 1, "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A", 1, 1, "user01", 100],
    [1731926400, 1, 1, "0xAnotherUserAddress...", 1, 1, "user02", 50]
  ],
  [
    ["0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A", 0, [0], "0xUser1Sig..."],
    ["0xAnotherUserAddress...", 0, [1], "0xUser2Sig..."]
  ],
  0,
  "0xExecutorSig..."
]
```

---

## 📝 주의사항

### 서명 생성 관련
- 사용자 서명은 프론트엔드에서 MetaMask/지갑으로 생성
- Executor 서명은 백엔드에서 비밀키로 생성
- **절대로 프론트엔드에 Executor 비밀키 노출 금지**

### Nonce 관리
- userNonce는 사용자별로 증가 (컨트랙트의 `minUserNonce` 조회)
- batchNonce는 백엔드에서 관리 (DB/Redis 권장)

### 재사용 방지
- 동일한 userNonce 재사용 불가
- 동일한 batchNonce 재사용 불가
- 동일한 레코드 재제출 불가 (consumed 체크)

---

## 🔗 참고

- **컨트랙트 주소:** `0xc18a062C1AF323A1E3d57520661fF3f5baCCcf5e`
- **네트워크:** opBNB Testnet
- **Chain ID:** 5611
- **Explorer:** https://opbnb-testnet.bscscan.com/address/0xc18a062C1AF323A1E3d57520661fF3f5baCCcf5e
