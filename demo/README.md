# 🗳️ MainVoting 데모 - 완벽 가이드

EIP-712 기반 다중 사용자 배치 투표 시스템 데모입니다.

## 🚀 빠른 시작

### 방법 1: 로컬 서버 실행 (권장)
```bash
cd /Users/goodblock/Project/celebus/contracts/demo
python3 -m http.server 8000
```

그 다음 브라우저에서: **http://localhost:8000**

### 방법 2: 파일로 직접 실행
`index.html`을 더블클릭하거나 브라우저로 드래그하면 됩니다!

---

## 📋 전체 워크플로우 (7단계)

### **STEP 0: 컨트랙트 초기 설정 (선택사항)** ⚙️

새 컨트랙트를 배포하거나 기존 컨트랙트를 설정합니다.

#### 배포 (선택사항)
1. **배포자 지갑** 비밀키 입력 (기본값 사용 가능)
2. **🚀 MainVoting 배포** 버튼 클릭
3. 배포 완료 후 **✅ 배포된 주소 적용** 버튼 클릭

#### 초기 설정 (필수)
1. **Owner 지갑** 비밀키 입력
2. **1️⃣ Executor 등록**: Executor 주소 입력 → **✅ Executor 등록 실행**
3. **2️⃣ Vote Type 설정**: "Forget", "Remember" 입력 → **✅ Vote Type 이름 설정 실행**
4. **3️⃣ 후보 등록**: Mission ID, Artist ID, 후보 이름 입력 → **✅ 후보 등록 실행**

---

### **STEP 1: Executor 지갑 설정** 🔐

백엔드 역할을 시뮬레이션합니다.

1. **Executor 비밀키** 입력 (기본값 사용 가능)
2. 주소가 자동으로 표시됨
3. **Batch Nonce** 자동 조회됨

✅ **완료 조건**: Executor 주소와 Batch Nonce가 표시되면 OK

---

### **STEP 2: 투표 레코드 생성** 📝

각 사용자가 투표 데이터를 입력합니다.

#### User 1 레코드 추가
1. **👤 사용자 선택**: `User 1` 선택
2. **🔢 User Nonce 조회**: **🔄 조회** 버튼 클릭
3. **Voting ID 생성**: **🎲 생성** 버튼 클릭
4. **Mission ID**, **Artist ID**, **Vote Type**, **Voting Amount** 입력
5. **+ 레코드 추가** 버튼 클릭

#### User 2 레코드 추가
1. **👤 사용자 선택**: `User 2` 선택
2. **🔄 조회** → **🎲 생성** → 데이터 입력 → **+ 레코드 추가**

✅ **완료 조건**: 좌측(User 1)과 우측(User 2)에 레코드가 표시됨

---

### **STEP 3: 사용자 서명 생성** ✍️

각 사용자가 자신의 레코드에 서명합니다.

1. **User 1 비밀키** 입력
2. **User 2 비밀키** 입력
3. **🖊️ 모든 사용자 서명 생성** 버튼 클릭

✅ **완료 조건**: "✅ 모든 사용자 서명 생성 완료" 메시지 표시

---

### **STEP 4: Domain Separator 계산** 🔢

EIP-712 Domain을 설정합니다.

1. 컨트랙트 주소가 자동으로 입력됨
2. **📊 Domain Separator 계산** 버튼 클릭

✅ **완료 조건**: Domain Separator (0x...) 표시

---

### **STEP 5: Struct Hash 계산** 🔢

Batch Nonce의 해시를 계산합니다.

1. Batch Nonce가 자동으로 입력됨
2. **🔨 Struct Hash 계산** 버튼 클릭

✅ **완료 조건**: Struct Hash (0x...) 표시

---

### **STEP 6: 최종 Digest 및 Executor 서명** 🔐

Executor가 전체 배치에 서명합니다.

1. Domain Separator와 Struct Hash가 자동으로 입력됨
2. **🧮 Final Digest 계산** 버튼 클릭
3. **🖊️ Executor 서명 생성** 버튼 클릭

✅ **완료 조건**: Final Digest와 Executor Signature 표시

---

### **STEP 7: 배치 제출** 🚀

컨트랙트에 최종 트랜잭션을 제출합니다.

#### 제출 전 확인
- **Records**: 레코드 개수 확인
- **User Sigs**: 사용자 서명 개수 확인
- **Batch Nonce**: 배치 Nonce 확인
- **Executor Sig**: Executor 서명 확인

#### 제출 옵션

**1. Remix IDE로 제출 (안전, 권장)**
1. **📋 Remix 파라미터 복사** 버튼 클릭
2. 복사된 파라미터를 Remix IDE에 붙여넣기
3. Remix에서 트랜잭션 실행

**2. 직접 제출 (고급)**
1. Executor 지갑 비밀키 입력
2. **🚀 submitMultiUserBatch() 실행** 버튼 클릭
3. 트랜잭션 해시 확인

✅ **완료 조건**: 트랜잭션 성공 메시지 표시

---

## 🎯 주요 기능

### 자동화된 기능
- ✅ **User Nonce**: 컨트랙트에서 자동 조회
- ✅ **Voting ID**: 타임스탬프 기반 자동 생성 (사용자별 유니크)
- ✅ **userId**: 지갑 주소 기반 자동 설정 (백엔드 시뮬레이션)
- ✅ **Batch Nonce**: 컨트랙트에서 자동 조회
- ✅ **도메인 동기화**: 컨트랙트 주소 변경 시 자동 업데이트

### 사용자 편의 기능
- 🗑️ **레코드 삭제**: 레코드에 마우스 오버 → × 버튼 클릭
- 📋 **Remix 파라미터 복사**: STEP 7에서 원클릭 복사
- 🔄 **상태 전파**: 각 단계 완료 시 다음 단계로 자동 전달

---

## 🏗️ 프로젝트 구조

```
demo/
├── index.html              # 메인 페이지
├── README.md              # 이 파일
├── MainVoting-abi.json    # 컨트랙트 ABI
├── MainVoting-bytecode.txt # 컨트랙트 바이트코드 (사용 안 함)
├── js/
│   ├── main.js            # 앱 진입점
│   ├── config.js          # 설정 + 임베디드 바이트코드
│   └── components/
│       ├── step0-setup.js      # 컨트랙트 배포 및 설정
│       ├── step1-executor.js   # Executor 지갑
│       ├── step2-records.js    # 투표 레코드 생성
│       ├── step3-user-sigs.js  # 사용자 서명
│       ├── step4-domain.js     # Domain Separator
│       ├── step5-struct.js     # Struct Hash
│       ├── step6-digest.js     # Final Digest + Executor 서명
│       └── step7-submit.js     # 배치 제출
```

---

## ⚙️ 설정 변경

`js/config.js`에서 기본값을 변경할 수 있습니다:

```javascript
export const CONFIG = {
  CHAIN_ID: 5611,                    // opBNB Testnet
  RPC_URL: 'https://opbnb-testnet-rpc.bnbchain.org',
  VOTING_ADDRESS: '0x509c2...',     // 배포된 컨트랙트 주소
  
  DEFAULT_VALUES: {
    user1PrivateKey: '0x94d26...',
    user2PrivateKey: '0xb4311...',
    executorPrivateKey: '0x94d26...',
    missionId: 1,
    votingId: 1,
    artistId: 1,
    voteType: 1,
    votingAmt: 100
  }
};
```

---

## 🔍 디버깅

브라우저 개발자 도구(F12) → Console 탭에서 로그 확인:

```javascript
✅ 바이트코드 로드 완료 (embedded)
✅ MainVoting App Ready!
✅ Record added: { timestamp: ..., missionId: 1, ... }
✅ User 1 서명 생성 완료
✅ Domain Separator 계산 완료
✅ TX 성공: 0x123abc...
```

---

## ❓ FAQ

**Q: "User Nonce 조회 실패" 오류가 나요**  
A: STEP 0에서 컨트랙트 초기 설정을 완료했는지 확인하세요.

**Q: "레코드 추가" 버튼을 눌렀는데 안 돼요**  
A: 🔄 조회, 🎲 생성 버튼을 먼저 눌러야 합니다.

**Q: Executor 서명 생성 실패**  
A: STEP 1~6을 순서대로 완료했는지 확인하세요.

**Q: 트랜잭션 제출 실패**  
A: 지갑에 opBNB Testnet BNB가 있는지 확인하세요.

---

## 📚 참고 자료

- [EIP-712 Spec](https://eips.ethereum.org/EIPS/eip-712)
- [ethers.js v6 Docs](https://docs.ethers.org/v6/)
- [opBNB Testnet Faucet](https://testnet.bnbchain.org/faucet-smart)

---

## 🎉 이제 시작하세요!

1. **http://localhost:8000** 접속
2. STEP 0부터 순서대로 진행
3. STEP 7에서 트랜잭션 제출!

문의사항이 있으시면 언제든지 연락주세요! 🚀
