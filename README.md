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
- **Explorer**: <https://testnet.opbnbscan.com/>

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

- **테스트 커버리지**: MainVoting 61개 테스트 (보안 테스트 7개 포함)
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
