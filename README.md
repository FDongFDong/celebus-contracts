# MainVoting Contract

EIP-712 기반 배치 투표 시스템. 다중 사용자의 Off-chain 서명을 수집하여 단일 트랜잭션으로 처리하는 가스 최적화 스마트 컨트랙트.

---

## 컨트랙트 목적

MainVoting은 대규모 투표 시스템에서 발생하는 가스 비용 문제를 해결하기 위해 설계되었다. 개별 사용자가 각자 트랜잭션을 발생시키는 대신, 백엔드 서버가 다수의 사용자 서명을 수집하여 하나의 트랜잭션으로 일괄 제출한다.

**주요 목표:**
- 다중 사용자 투표의 가스 비용 최소화
- Off-chain 서명 수집 및 On-chain 일괄 검증
- 리플레이 공격 및 서명 위조 방지

---

## 핵심 기능 요약

| 기능 | 설명 |
|------|------|
| submitMultiUserBatch | 다수 사용자의 투표를 단일 트랜잭션으로 처리 |
| 2단계 서명 검증 | Executor 서명 + 개별 User 서명 |
| Soft-fail 처리 | 일부 사용자 검증 실패 시에도 나머지 처리 진행 |
| Nonce 기반 순서 보장 | batchNonce(Executor), userNonce(사용자) |
| 아티스트별 통계 집계 | Remember/Forget 투표량 실시간 집계 |

---

## 보안 설계 포인트

### 리플레이 공격 방지

```
1. CHAIN_ID: 배포 시점의 체인 ID를 immutable로 저장하여 크로스체인 리플레이 차단
2. batchNonce: Executor별 순차 카운터로 배치 중복 제출 방지
3. userNonce: 사용자별 순차 카운터로 동일 서명 재사용 차단
4. consumed 매핑: (user, recordDigest) => bool로 개별 레코드 중복 처리 방지
```

### 2단계 서명 검증 구조

```
Executor 서명 검증 (배치 레벨)
    -> 배치 전체의 무결성 보장
    -> Executor만 배치 제출 가능

User 서명 검증 (사용자 레벨)
    -> 개별 사용자의 투표 의사 확인
    -> EOA: ECDSA, 컨트랙트 지갑: ERC-1271
```

### 권한 분리

- Owner: 컨트랙트 설정 변경 (Ownable2Step 적용)
- Executor: 배치 제출 권한만 보유
- User: 자신의 투표에 대해서만 서명 가능

---

## Off-chain Signature 흐름 (EIP-712 구조)

### TypeHash 정의

```solidity
// 개별 투표 레코드
VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,uint256 optionId,uint8 voteType,uint256 votingAmt,address user)

// 사용자 배치 (recordsHash = keccak256(abi.encodePacked(recordDigests)))
UserBatch(address user,uint256 userNonce,bytes32 recordsHash)

// Executor 배치
Batch(uint256 batchNonce)
```

### 서명 생성 순서 (Off-chain)

```
1. 각 VoteRecord에 대해 recordDigest = hash(VOTE_RECORD_TYPEHASH, record, user)
2. recordsHash = keccak256(abi.encodePacked(recordDigests))
3. userBatchDigest = EIP712Hash(USER_BATCH_TYPEHASH, user, userNonce, recordsHash)
4. User가 userBatchDigest에 서명
5. Executor가 batchDigest = EIP712Hash(BATCH_TYPEHASH, batchNonce)에 서명
```

### 서명 검증 순서 (On-chain)

```
submitMultiUserBatch() 호출
    |
    v
[1] Executor 서명 검증 (batchDigest)
    |
    v
[2] batchNonce 소비 (순차 증가)
    |
    v
[3] 각 사용자별 루프
    |-- recordDigests 재계산
    |-- recordsHash 계산
    |-- userBatchDigest 계산
    |-- User 서명 검증
    |-- userNonce 검증 및 소비
    |
    v
[4] 검증 통과한 레코드 저장
```

---

## 배치 투표 구조

### 데이터 구조

```
submitMultiUserBatch(
    UserVoteBatch[] batches,      // 사용자별 배치 배열
    uint256 batchNonce_,          // Executor 배치 순서
    bytes executorSig             // Executor 서명
)

UserVoteBatch {
    VoteRecord[] records,         // 투표 레코드 배열 (최대 20개/사용자)
    UserBatchSig userBatchSig     // 사용자 서명 정보
}

UserBatchSig {
    address user,
    uint256 userNonce,
    bytes signature
}
```

### 제한값

| 항목 | 값 | 설명 |
|------|-----|------|
| MAX_RECORDS_PER_BATCH | 2000 | 배치당 최대 레코드 수 |
| MAX_RECORDS_PER_USER_BATCH | 20 | 사용자당 최대 레코드 수 |
| MAX_STRING_LENGTH | 100 | 문자열 필드 최대 길이 |
| MAX_VOTE_TYPE | 1 | 0=Forget, 1=Remember |

### Soft-fail 처리

한 사용자의 검증이 실패해도 전체 트랜잭션이 revert되지 않는다. 실패 사유별 이벤트 코드:

```
REASON_USER_BATCH_TOO_LARGE = 1
REASON_INVALID_USER_SIGNATURE = 2
REASON_USER_NONCE_INVALID = 3
REASON_INVALID_VOTE_TYPE = 5
REASON_ARTIST_NOT_ALLOWED = 6
```

---

## Gas 최적화 전략

### 배치 처리

개별 트랜잭션 대비 70-80% 가스 절감. 100명의 사용자가 각자 트랜잭션을 보내는 대신 1개의 배치 트랜잭션으로 처리.

```
개별 방식: 100 tx * 21,000 base gas = 2,100,000 gas
배치 방식: 1 tx * ~600,000 gas (100명 기준)
```

### 저장소 최적화

- 문자열(userId)은 서명 검증에 포함되지 않아 검증 시 hash 연산 감소
- consumed 매핑으로 중복 체크 (bool 1 slot)
- artistStats에 집계값 누적 (조회 시 재계산 불필요)

### 연산 최적화

```solidity
// unchecked 블록으로 오버플로우 체크 생략 (안전한 범위 내)
unchecked { ++i; }
unchecked { ++storedCount; }

// 조기 종료 조건
if (record.votingAmt == 0 || consumed[user][recordDigest]) continue;
```

---

## 백엔드 통신 방식

### 투표 제출 흐름

```
[Frontend]
    |-- 사용자가 투표 선택
    |-- 컨트랙트에서 userNonce 직접 조회
    |-- EIP-712 서명 요청 (MetaMask 등)
    |-- 서명 데이터를 백엔드로 전송
    v
[Backend]
    |-- 서명 수집 및 임시 저장
    |-- 일정 주기 또는 조건 충족 시 배치 구성
    |-- batchNonce 조회 및 Executor 서명 생성
    |-- submitMultiUserBatch() 호출
    v
[Smart Contract]
    |-- 검증 및 저장
    v
[Event]
    |-- BatchProcessed (성공 통계)
    |-- UserBatchProcessed (개별 성공)
    |-- UserBatchFailed (개별 실패)
```

### 역할 분담

**Frontend:**
- 컨트랙트에서 userNonce(address) 직접 조회
- EIP-712 서명 데이터 구성 및 사용자 서명 요청
- 서명 결과를 백엔드 API로 전송

**Backend:**
- 다수 사용자 서명 수집 및 배치 구성
- batchNonce 순서 관리
- Executor 키로 배치 서명 생성
- 트랜잭션 제출 및 실패 이벤트 모니터링

### 주요 View 함수

```solidity
// 사용자 Nonce 조회 (Frontend에서 직접 호출)
function userNonce(address user) external view returns (uint256);

// Executor Nonce 조회 (Backend에서 호출)
function batchNonce(address executor) external view returns (uint256);

// EIP-712 도메인 정보
function domainSeparator() external view returns (bytes32);

// 투표 결과 조회
function getArtistAggregates(uint256 missionId, uint256 optionId)
    external view returns (uint256 remember, uint256 forget, uint256 total);
```

---

## 배포 정보

- **네트워크**: opBNB Testnet (Chain ID: 5611)
- **Explorer**: https://testnet.opbnbscan.com/

## 빠른 시작

### 설치

```bash
# 저장소 클론
git clone git@bitbucket.org:deploygb/celebus-contracts.git
cd celebus-contracts

# 의존성 설치
forge install
```

### 빌드

```bash
forge build
```

### 테스트

```bash
# 모든 테스트 실행
forge test

# 상세 출력
forge test -vvv

# 특정 컨트랙트 테스트
forge test --match-contract MainVotingTest

# 가스 리포트
forge test --gas-report
```

---

## 테스트 시나리오

### MainVoting.t.sol (53개)

| 카테고리 | 시나리오 |
|----------|----------|
| **배포** | 초기 상태 검증, DomainSeparator 확인 |
| **설정** | ExecutorSigner 설정, Artist 등록, VoteType 설정 |
| **투표 제출** | 단일 사용자, 다중 사용자, 다중 레코드, 혼합 VoteType |
| **서명 검증** | Executor 서명 실패, User 서명 실패 (Soft-fail) |
| **Nonce 관리** | userNonce 무효, batchNonce 중복, 순차 배치 |
| **Soft-fail** | 문자열 초과, Artist 비허용, VoteType 무효, 배치 크기 초과 |
| **부분 성공** | 일부 서명 무효, 일부 VoteType 무효, 일부 Artist 비허용 |
| **이벤트** | UserBatchProcessed, BatchProcessed, UserBatchFailed |
| **ERC-1271** | 스마트 지갑 서명 성공/실패 |
| **제한값** | 2000 레코드 배치, 20 레코드/사용자, 초과 시 revert |
| **Ownable2Step** | 소유권 이전, pendingOwner 검증 |
| **중복 방지** | 동일 recordDigest 중복 처리 방지 |

### SubVoting.t.sol (51개)

| 카테고리 | 시나리오 |
|----------|----------|
| **배포** | 초기 상태, DomainSeparator |
| **설정** | ExecutorSigner, Question 등록, Option 등록 |
| **투표 제출** | 단일 사용자, 다중 사용자, 다중 레코드/사용자 |
| **검증 실패** | Executor 서명, User 서명, Nonce 무효, 배치 중복 |
| **Soft-fail** | Question 비허용, Option 비허용, OptionId 무효 |
| **원자성** | Nonce 소비 시점, VotingId 불일치 전체 실패 |
| **ERC-1271** | 스마트 지갑 서명 |
| **제한값** | 배치 2000개, 사용자별 20개, 21개 초과 Soft-fail |
| **이벤트** | UserMissionResult 성공/실패 |

### Boosting.t.sol (48개)

| 카테고리 | 시나리오 |
|----------|----------|
| **배포** | 초기 상태 검증 |
| **설정** | ExecutorSigner, Artist, BoostingType |
| **부스팅 제출** | 단일 사용자, 다중 사용자, 혼합 부스트 |
| **검증 실패** | Executor/User 서명 무효, Nonce 중복 |
| **Soft-fail** | Artist 비허용, BoostType 무효, 문자열 초과 |
| **통계** | ArtistTotalAmt, ArtistInfo, BoostAggregates |
| **ERC-1271** | 스마트 지갑 서명 |
| **제한값** | 2000 사용자 배치, 초과 시 revert |
| **중복 방지** | 동일 recordHash 스킵, 0 amount 스킵 |
| **Artist 상태** | 비활성화 후 Soft-fail, 재활성화 |

### CelebusNFT.t.sol (101개)

| 카테고리 | 시나리오 |
|----------|----------|
| **발행** | safeMint, batchMint, 자동 ID 증가 |
| **URI** | baseURI 설정, tokenURI 조회 |
| **잠금** | lockToken, unlockToken, batchLock/Unlock |
| **전송** | 잠금 시 전송 제한, Owner 예외, Approval 동작 |
| **소각** | burn, 잠금 토큰 소각, 권한 검증 |
| **일시정지** | pause/unpause, 기능별 차단/허용 |
| **가스 벤치마크** | batchMint 10/100개, batchLock/Unlock 10개 |
| **ERC721Receiver** | 수신자 컨트랙트 검증 |
| **제한값** | 최대 배치 크기 초과 시 revert |

### CelbTokenPermit.t.sol (13개)

| 카테고리 | 시나리오 |
|----------|----------|
| **Permit 성공** | 정상 permit, Approval 이벤트 |
| **Permit 실패** | 만료, 잘못된 nonce, 서명 무효, owner 불일치 |
| **변조 탐지** | spender 변조, value 변조, verifyingContract 변조 |
| **TransferFrom** | allowance 부족, 정상 전송 |
| **Frontrun** | permit frontrun 시나리오 |

### UserVoteResultEvent.t.sol (8개)

| 카테고리 | 시나리오 |
|----------|----------|
| **성공 이벤트** | 단일 사용자, 다중 사용자 |
| **실패 이벤트** | 서명 무효, Artist 비허용, VoteType 무효, Nonce 중복 |
| **혼합** | 부분 성공/실패 |

### HashDebug.t.sol (2개)

| 카테고리 | 시나리오 |
|----------|----------|
| **디버깅** | 해시값 검증, Free Memory Pointer 확인 |

### Invariant 테스트 (9개)

| 파일 | 시나리오 |
|------|----------|
| **CelebusNFT.invariant.t.sol** | 토큰 소유자 검증, 소각 토큰 존재 불가, 잠금 일관성, 잠금 수 제한, Pause 동작, 토큰 ID 유효성, 총 잔액 일치 |

### 배포 (opBNB Testnet)

```bash
# 환경변수 설정
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY
export RPC_URL=https://opbnb-testnet-rpc.bnbchain.org

# MainVoting 배포
forge script script/DeployMainVoting.s.sol:DeployMainVoting \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast

# SubVoting 배포
forge script script/DeploySubVoting.s.sol:DeploySubVoting \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast

# Boosting 배포
forge script script/DeployBoosting.s.sol:DeployBoosting \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast

# NFT 배포
forge script script/DeployNFT.s.sol:DeployNFT \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast
```

### ABI 생성

```bash
# 먼저 빌드 실행
forge build

# MainVoting ABI
jq '.abi' out/MainVoting.sol/MainVoting.json > ./demo/MainVoting-abi.json

# SubVoting ABI
jq '.abi' out/SubVoting.sol/SubVoting.json > ./sub_demo/SubVoting-abi.json

# Boosting ABI
jq '.abi' out/Boosting.sol/Boosting.json > ./boosting_demo/Boosting-abi.json

# NFT ABI
jq '.abi' out/CelebusNFT.sol/CelebusNFT.json > ./nft_demo/CelebusNFT-abi.json
```

### 컨트랙트 검증 (Constructor Args 생성)

```bash
# MainVoting constructor args
cast abi-encode "constructor(address)" 0xYOUR_OWNER_ADDRESS > ./demo/constructor-args.txt

# SubVoting constructor args
cast abi-encode "constructor(address)" 0xYOUR_OWNER_ADDRESS > ./sub_demo/constructor-args.txt

# Boosting constructor args
cast abi-encode "constructor(address)" 0xYOUR_OWNER_ADDRESS > ./boosting_demo/constructor-args.txt

# NFT constructor args
cast abi-encode "constructor(address)" 0xYOUR_OWNER_ADDRESS > ./nft_demo/constructor-args.txt
```

### 컨트랙트 검증 (Standard JSON Input 생성)

```bash
# MainVoting 검증용 JSON 생성
forge verify-contract 0xYOUR_MAINVOTING_ADDRESS \
    src/vote/MainVoting.sol:MainVoting \
    --chain opbnb-testnet \
    --show-standard-json-input > ./demo/standard-json-input.json

# SubVoting 검증용 JSON 생성
forge verify-contract 0xYOUR_SUBVOTING_ADDRESS \
    src/vote/SubVoting.sol:SubVoting \
    --chain opbnb-testnet \
    --show-standard-json-input > ./sub_demo/standard-json-input.json

# Boosting 검증용 JSON 생성
forge verify-contract 0xYOUR_BOOSTING_ADDRESS \
    src/vote/Boosting.sol:Boosting \
    --chain opbnb-testnet \
    --show-standard-json-input > ./boosting_demo/standard-json-input.json

# NFT 검증용 JSON 생성
forge verify-contract 0xYOUR_NFT_ADDRESS \
    src/nft/CelebusNFT.sol:CelebusNFT \
    --chain opbnb-testnet \
    --show-standard-json-input > ./nft_demo/standard-json-input.json
```

## 주요 명령어

```bash
# 컴파일
forge build

# 테스트
forge test

# 포맷팅
forge fmt

# 로컬 테스트넷
anvil

# 컨트랙트 상호작용
cast call <contract> "function()(type)" --rpc-url <rpc>
```

## 프로젝트 구조

```
contracts/
├── src/
│   ├── vote/              # 투표 관련 컨트랙트
│   │   ├── MainVoting.sol
│   │   ├── SubVoting.sol
│   │   └── Boosting.sol
│   ├── nft/
│   │   └── CelebusNFT.sol
│   └── token/
│       └── CelbToken.sol
├── test/                  # 테스트 파일
├── script/                # 배포 스크립트
└── lib/                   # 외부 라이브러리
```

## 스트레스 테스트 스크립트

대량 투표 시 장시간 서명/제출 과정을 단일 명령으로 실행할 수 있습니다.

### 1) 동시에 여러 번 제출 (`npm run stress:burst`)

```bash
export PRIVATE_KEY=0xb43112fd82593f95dea3ba1a25eed28a6a75d6763677a42560b5d7815fea7977
export VOTING_ADDRESS=0x999bbdfc674912ed5b450faea2a5938c5eb39731
export RPC_URL=https://opbnb-testnet-rpc.bnbchain.org

# 130명 × 1표, 총 140건을 10회 동시 제출
npm run stress:burst -- --count 10 --totalVotes 140 --userCount 130 --missionId 1
```

- `stress-artifacts/`에 생성된 JSON 파일을 순차로 제출합니다.
- 각 배치마다 샘플 `votingId` 최대 10개가 로그로 출력되어 디버깅이 쉽습니다.
- `--gasBumpPercent`(기본 10)로 replacement-tx 대비 가스비를 상향 조정할 수 있습니다.

### 2) 배포→서명→제출까지 한 번에 (`scripts/run-stress.sh`)

```bash
export PRIVATE_KEY=0xb43112fd82593f95dea3ba1a25eed28a6a75d6763677a42560b5d7815fea7977
TOTAL_VOTES=130 USER_COUNT=130 scripts/run-stress.sh
```

- 새 MainVoting을 배포하고 executor 설정 후 `stress:viem`/`stress:submit`을 연속 실행합니다.
- `EXECUTOR_PRIVATE_KEY`, `GAS_LIMIT`, `RPC_URL` 등을 환경변수로 덮어쓸 수 있습니다.
- 출력 마지막에 컨트랙트 주소, 생성 JSON 경로, 제출 tx hash 를 요약합니다.

## 보안

- **테스트 커버리지**: 총 285개 테스트 (Unit 276개 + Invariant 9개)
- **보안 점수**: 99.5%+ 프로덕션 준비도
- **취약점**: Critical 0개, High 0개
- **감사 문서**: 내부 보안 감사 보고서 (필요 시 별도 공유)

## 기술 스택

- **Framework**: Foundry
- **Language**: Solidity ^0.8.20
- **Libraries**: OpenZeppelin Contracts, ERC721A
- **Standard**: EIP-712 (Typed Structured Data)

## 라이센스

MIT

## 관련 링크

- [Foundry Book](https://book.getfoundry.sh/)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [opBNB Documentation](https://docs.bnbchain.org/opbnb-docs/)
