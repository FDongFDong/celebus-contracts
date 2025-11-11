# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Celebus 투표 시스템 - Foundry 기반 Solidity 스마트 컨트랙트 프로젝트입니다.
EIP-712 서명 기반 배치 투표 시스템(MainVoting)을 중심으로 투표, 서브투표(SubVoting), 부스팅(Boosting) 시스템을 포함합니다.

**배포 네트워크**: opBNB Testnet (Chain ID: 5611)
**최신 배포 정보**: `DEPLOYMENT.md` 또는 `DEPLOYMENT_HISTORY.md` 참조

## 핵심 명령어

### 빌드 및 컴파일
```bash
forge build              # 컨트랙트 컴파일
forge build --sizes      # 컨트랙트 크기 정보 포함
forge clean              # 빌드 아티팩트 제거
```

### 테스트
```bash
forge test                                    # 모든 테스트 실행
forge test -vvv                              # 상세 출력
forge test --match-contract MainVotingTest   # 특정 테스트 컨트랙트
forge test --match-test test_SubmitSingleUserBatch  # 특정 테스트 함수
forge test --gas-report                      # 가스 사용량 리포트
```

### 로컬 테스트넷 (Anvil)
```bash
# 로컬 테스트넷 시작
anvil

# 로컬 배포 (다른 터미널)
forge script script/DeployMainVoting.s.sol:DeployMainVoting \
  --rpc-url http://localhost:8545 \
  --broadcast
```

### 배포 (opBNB Testnet)
```bash
# 환경변수 설정
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# MainVoting 배포
forge script script/DeployMainVoting.s.sol:DeployMainVoting \
  --rpc-url https://opbnb-testnet-rpc.bnbchain.org \
  --broadcast -vvv

# SubVoting 배포
forge script script/DeploySubVoting.s.sol:DeploySubVoting \
  --rpc-url https://opbnb-testnet-rpc.bnbchain.org \
  --broadcast -vvv

# Boosting 배포
forge script script/DeployBoosting.s.sol:DeployBoosting \
  --rpc-url https://opbnb-testnet-rpc.bnbchain.org \
  --broadcast -vvv
```

### Cast 활용 (배포된 컨트랙트 상호작용)
```bash
# CONTRACT_ADDRESS는 DEPLOYMENT.md에서 확인

# executorSigner 조회
cast call $CONTRACT_ADDRESS "executorSigner()(address)" \
  --rpc-url https://opbnb-testnet-rpc.bnbchain.org

# executorSigner 설정 (Owner만 가능)
cast send $CONTRACT_ADDRESS \
  "setExecutorSigner(address)" $EXECUTOR_ADDRESS \
  --rpc-url https://opbnb-testnet-rpc.bnbchain.org \
  --private-key $PRIVATE_KEY

# 투표 개수 조회 (MainVoting)
cast call $CONTRACT_ADDRESS \
  "getVoteCountByVotingId(uint256,uint256)(uint256)" 1 1 \
  --rpc-url https://opbnb-testnet-rpc.bnbchain.org

# 투표 기록 조회 (MainVoting, 페이지네이션)
cast call $CONTRACT_ADDRESS \
  "getVotesByVotingId(uint256,uint256,uint256,uint256)" 1 1 0 10 \
  --rpc-url https://opbnb-testnet-rpc.bnbchain.org
```

### 코드 포맷팅
```bash
forge fmt                # 포맷팅 적용
forge fmt --check        # 포맷팅 검증 (CI)
```

## 프로젝트 구조

```
contracts/
├── src/
│   ├── vote/              # 투표 관련 컨트랙트
│   │   ├── MainVoting.sol    # 메인 투표 (EIP-712 배치 시스템)
│   │   ├── SubVoting.sol     # 서브 투표 (단순 투표)
│   │   └── Boosting.sol      # 부스팅 시스템
│   ├── nft/
│   │   └── CelebusNFT.sol    # NFT 컨트랙트
│   └── token/
│       └── CelbToken.sol     # 토큰 컨트랙트
├── test/
│   ├── MainVoting.t.sol      # MainVoting 통합 테스트
│   ├── SubVoting.t.sol       # SubVoting 테스트
│   └── Boosting.t.sol        # Boosting 테스트
├── script/
│   ├── DeployMainVoting.s.sol  # MainVoting 배포 스크립트
│   ├── DeploySubVoting.s.sol   # SubVoting 배포 스크립트
│   ├── DeployBoosting.s.sol    # Boosting 배포 스크립트
│   └── TestVoting.s.sol        # 테스트 투표 스크립트
├── lib/
│   ├── forge-std/            # Foundry 표준 라이브러리
│   ├── openzeppelin-contracts/  # OpenZeppelin 라이브러리
│   └── ERC721A/              # ERC721A 최적화 NFT
└── foundry.toml              # Foundry 설정 (optimizer, via_ir 활성화)
```

## 핵심 아키텍처

### MainVoting 컨트랙트 (src/vote/MainVoting.sol)
**목적**: 다중 사용자의 투표를 한 트랜잭션으로 처리하는 가스 최적화 시스템

**핵심 특징**:
- EIP-712 서명 기반 배치 투표 시스템 (도메인: "MainVoting", 버전: "1")
- 이중 서명 구조: 사용자 서명 + Executor 서명
- 3단계 Nonce 시스템: User Nonce + Batch Nonce + Record Nonce
- **문자열 해시 방식**: 서명 시 문자열을 bytes32 해시로 변환 (가스 최적화)
- 문자열 길이 제한 (최대 100자) - 가스 공격 차단
- 사용자당 배치 크기 제한 (최대 50개)
- **ReentrancyGuard 없음** (staticcall만 사용하므로 불필요)

#### 주요 구조체
```solidity
struct VoteRecord {
    uint256 timestamp;
    uint256 missionId;
    uint256 votingId;
    address userAddress;
    string userId;
    string votingFor;   // 후보자
    string votedOn;     // 선택 항목
    uint256 votingAmt;  // 포인트
    uint256 deadline;
}

struct UserBatchSig {
    address user;
    uint256 userNonce;
    uint256[] recordIndices;
    bytes signature;
}
```

#### 핵심 함수
- `submitMultiUserBatch()`: 다중 사용자 배치 투표 제출
- `getVotesByVotingId()`: votingId로 투표 조회 (페이지네이션)
- `getVoteCountByVotingId()`: votingId 투표 개수
- `cancelAllUserNonceUpTo()`: 사용자 nonce 일괄 취소
- `cancelAllBatchNonceUpTo()`: 배치 nonce 일괄 취소
- `hashVoteRecord()`: 레코드 해시 계산 (클라이언트용)
- `hashUserBatchPreview()`: 사용자 배치 해시 미리보기
- `hashBatchPreview()`: 배치 해시 미리보기

### EIP-712 서명 구조 (MainVoting)
프로젝트는 **per-record struct hash 방식** + **문자열 해시 방식**을 사용합니다:

**서명용 VoteRecord 타입**:
```solidity
VoteRecord(
  uint256 timestamp,
  uint256 missionId,
  uint256 votingId,
  address userAddress,
  bytes32 userIdHash,      // keccak256(bytes(userId))
  bytes32 votingForHash,   // keccak256(bytes(votingFor))
  bytes32 votedOnHash,     // keccak256(bytes(votedOn))
  uint256 votingAmt,
  uint256 deadline,
  uint256 recordNonce      // 레코드별 nonce
)
```

**서명 프로세스**:
1. **UserBatch 서명** (각 사용자가 자신의 투표를 서명)
```solidity
UserBatch(address user, uint256 userNonce, bytes32 recordsHash)
// recordsHash = keccak256(abi.encodePacked(userHashes))
// userHashes[i] = _hashVoteRecord(record, recordNonce)
```

2. **Batch 서명** (Executor가 전체 배치를 서명)
```solidity
Batch(uint256 chainId, bytes32 itemsHash, uint256 batchNonce)
// itemsHash = keccak256(abi.encodePacked(allItemHashes))
// allItemHashes[i] = _hashVoteRecord(record, recordNonce)
```

**중요**:
- 문자열을 해시화하여 서명 → 가스 최적화 및 프라이버시 강화
- recordNonce가 양쪽 서명에 바인딩 → 재사용 공격 차단
- Storage는 원본 문자열 저장 → 이벤트 및 조회 시 원문 제공

### SubVoting 컨트랙트 (src/vote/SubVoting.sol)
**목적**: 단순 단일 투표 시스템

**핵심 특징**:
- EIP-712 서명 기반 (도메인: "SubVoting", 버전: "1")
- 개별 투표 서명 + Executor 배치 서명 이중 검증
- MainVoting과 동일한 VoteRecord 구조체 사용
- 배치 크기 제한 (최대 500개)
- **ReentrancyGuard 포함** (방어적 프로그래밍)

**서명용 VoteRecord 타입**:
```solidity
VoteRecord(uint256 timestamp, uint256 missionId, uint256 votingId,
           address userAddress, string userId, string votingFor, string votedOn,
           uint256 votingAmt, uint256 nonce, uint256 deadline)
// 문자열을 해시화하지 않고 원본 사용
```

### Boosting 컨트랙트 (src/vote/Boosting.sol)
**목적**: 부스팅 시스템

**핵심 특징**:
- EIP-712 서명 기반 (도메인: "Boosting", 버전: "1")
- 개별 부스팅 서명 + Executor 배치 서명 이중 검증
- MainVoting과 유사한 아키텍처
- 배치 크기 제한 (최대 500개)
- **ReentrancyGuard 포함** (방어적 프로그래밍)

**서명용 BoostRecord 타입**:
```solidity
BoostRecord(uint256 timestamp, uint256 missionId, uint256 boostingId,
            address userAddress, string userId, string boostingFor, string boostingWith,
            uint256 amt, uint256 nonce, uint256 deadline)
// 문자열을 해시화하지 않고 원본 사용
```

## 개발 규칙

### 테스트 작성
- 테스트는 `test/` 디렉토리에 `*.t.sol` 형식
- `forge-std/Test.sol` 상속 필수
- `setUp()` 함수로 초기화
- 테스트 함수 네이밍: `test_FunctionName()` 또는 `test_RevertWhen_Condition()`
- 에러 테스트: `vm.expectRevert(CustomError.selector)`
- 서명 테스트: `vm.sign()` 사용
- 보안 테스트: `test/security/` 디렉토리 참조

### 스크립트 작성
- 배포 스크립트는 `script/` 디렉토리에 `*.s.sol`
- `forge-std/Script.sol` 상속
- `vm.startBroadcast()` / `vm.stopBroadcast()` 블록 내에서 배포
- 환경변수 접근: `vm.envUint("PRIVATE_KEY")`
- 배포 후 자동으로 `broadcast/` 디렉토리에 트랜잭션 기록 저장

### 컨트랙트 작성
- SPDX 라이센스: `// SPDX-License-Identifier: MIT`
- Solidity 버전: `pragma solidity ^0.8.20;`
- Custom error 사용 (gas 최적화): `error CustomError();`
- EIP-712 서명 구현 시 domainSeparator 패턴 따르기
- 문자열 길이 제한 필수 (`MAX_STRING_LENGTH = 100`)
- 배치 크기 제한 필수 (`MAX_RECORDS_PER_USER_BATCH = 50`)

## Foundry 설정 (foundry.toml)

```toml
optimizer = true
optimizer_runs = 200
via_ir = true              # Yul 중간 표현 최적화 활성화
```

**`via_ir = true` 설정 효과**:
- 컴파일 시간이 길어지지만 가스 최적화 향상 (~3-5%)
- 컨트랙트 크기 감소
- Verify 시 Standard JSON Input 방식 사용 필요

## 컨트랙트 검증 (opBNBScan)

배포 후 검증 시 다음 설정 사용:
- **Compiler Type**: Solidity (Standard JSON Input)
- **Compiler Version**: v0.8.30+commit.cebd296c
- **Optimization**: Yes (200 runs)
- **Via IR**: Yes

자세한 검증 절차는 `VERIFY_INFO.md` 참조.

## 주요 의존성

- **OpenZeppelin Contracts**: 접근 제어(Ownable2Step), 서명 검증(ECDSA, EIP712)
- **ERC721A**: 가스 최적화된 NFT 구현
- **forge-std**: Foundry 표준 테스팅 라이브러리

## Foundry 툴킷

- **Forge**: 빌드 및 테스트 프레임워크
- **Cast**: 블록체인 RPC 상호작용 CLI
- **Anvil**: 로컬 이더리움 노드 (테스트넷)
- **Chisel**: Solidity REPL (대화형 실행 환경)

## 보안 및 품질

### 보안 점수
- **프로덕션 준비도**: 99.5%+
- **위험도**: Very Low
- **Critical 취약점**: 0개
- **High 취약점**: 0개

자세한 보안 감사 결과는 `SECURITY_AUDIT.md` 또는 `SECURITY_AUDIT_FINAL.md` 참조.

### 테스트 커버리지
- **총 테스트**: 129개 (MainVoting 기준)
- **보안 테스트**: 38개 이상
- **통과율**: 100%

## 버전 관리

프로젝트는 여러 버전의 컨트랙트를 관리합니다:
- 최신 프로덕션 버전은 `DEPLOYMENT_HISTORY.md` 확인
- 구 버전은 알려진 취약점이 있을 수 있으니 사용 금지
- 배포 시 반드시 최신 소스 코드 사용

## 참고 문서

- **Foundry Book**: https://book.getfoundry.sh/
- **EIP-712**: https://eips.ethereum.org/EIPS/eip-712
- **opBNB Testnet Explorer**: https://testnet.opbnbscan.com/
- **프로젝트 배포 정보**: `DEPLOYMENT.md`, `DEPLOYMENT_HISTORY.md`
- **보안 감사**: `SECURITY_AUDIT.md`, `SECURITY_AUDIT_FINAL.md`
- **검증 가이드**: `VERIFY_INFO.md`
