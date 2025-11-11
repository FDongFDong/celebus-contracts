# Celebus Voting Smart Contracts

Foundry 기반 Solidity 스마트 컨트랙트 프로젝트 - EIP-712 서명 기반 배치 투표 시스템

## 프로젝트 개요

Celebus 투표 시스템은 다중 사용자의 투표를 효율적으로 처리하는 가스 최적화 배치 시스템입니다.

### 주요 컨트랙트

- **MainVoting**: EIP-712 배치 투표 시스템 (한 사용자 = 1개 서명 = N개 투표)
- **SubVoting**: 단순 투표 시스템
- **Boosting**: 부스팅 시스템

### 핵심 특징

- ✅ **가스 최적화**: 배치 처리로 70-80% 가스 절감
- ✅ **이중 서명**: 사용자 서명 + Executor 서명
- ✅ **3단계 Nonce**: User/Batch/Record Nonce 시스템
- ✅ **문자열 해시화**: 프라이버시 강화 및 가스 절감
- ✅ **보안 감사 완료**: 99.5%+ 프로덕션 준비도

## 배포 정보

- **네트워크**: opBNB Testnet (Chain ID: 5611)
- **최신 배포**: [DEPLOYMENT.md](./DEPLOYMENT.md) 참조
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

### 배포 (opBNB Testnet)

```bash
# 환경변수 설정
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# MainVoting 배포
forge script script/DeployMainVoting.s.sol:DeployMainVoting \
  --rpc-url https://opbnb-testnet-rpc.bnbchain.org \
  --broadcast -vvv
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

## 문서

- [CLAUDE.md](./CLAUDE.md) - 개발 가이드
- [MAINVOTING_ARCHITECTURE.md](./MAINVOTING_ARCHITECTURE.md) - MainVoting 아키텍처
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 배포 정보
- [SECURITY_AUDIT_FINAL.md](./SECURITY_AUDIT_FINAL.md) - 보안 감사
- [VERIFY_INFO.md](./VERIFY_INFO.md) - 컨트랙트 검증 가이드

## 보안

- **테스트 커버리지**: MainVoting 61개 테스트 (보안 테스트 7개 포함)
- **보안 점수**: 99.5%+ 프로덕션 준비도
- **취약점**: Critical 0개, High 0개
- **감사 문서**: [SECURITY_AUDIT_FINAL.md](./SECURITY_AUDIT_FINAL.md)

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
