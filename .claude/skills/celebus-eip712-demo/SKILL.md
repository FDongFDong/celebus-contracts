---
name: celebus-eip712-demo
description: Celebus EIP-712 서명 및 투표 컨트랙트 데모 개발 스킬. MainVoting, SubVoting, Boosting 컨트랙트와 상호작용하는 TypeScript 데모 애플리케이션 개발에 사용. 키워드: EIP-712, 투표, 서명, viem, TypeScript, 데모, MainVoting, SubVoting, Boosting
---

# Celebus EIP-712 Demo Skill

## Purpose

Celebus 프로젝트의 EIP-712 서명 기반 투표 시스템 데모 애플리케이션을 개발하고 유지보수하기 위한 스킬입니다.

## 프로젝트 구조

```
demo/
├── src/
│   ├── domain/                 # 도메인 계층
│   │   ├── entities/           # VoteRecord, SubVoteRecord, BoostRecord
│   │   ├── services/           # DigestService
│   │   ├── value-objects/      # EIP712Domain
│   │   └── types.ts
│   ├── application/            # 애플리케이션 계층
│   │   ├── use-cases/          # CreateRecordUseCase, SignBatchUseCase, GenerateDigestUseCase
│   │   └── errors.ts
│   ├── infrastructure/         # 인프라 계층
│   │   ├── config/             # chains.ts
│   │   ├── contracts/          # MainVotingContract, SubVotingContract, BoostingContract
│   │   └── viem/               # ViemClient, WalletAdapter
│   └── presentation/           # 프레젠테이션 계층
│       ├── components/         # BaseStep, TabNavigator
│       │   ├── steps/          # Step0-Step10 컴포넌트
│       │   │   ├── subvoting/  # SubVoting 전용 Step 컴포넌트
│       │   │   └── boosting/   # Boosting 전용 Step 컴포넌트
│       │   └── shared/         # 공유 컴포넌트
│       ├── views/              # MainVotingView, SubVotingView, BoostingView
│       ├── state/              # AppState
│       └── utils/              # UIHelper
└── test/                       # Vitest 테스트
```

## 핵심 기술 스택

- **TypeScript**: strict mode 필수
- **Vite**: 빌드 도구
- **viem**: Ethereum 클라이언트 라이브러리
- **Vitest**: 테스트 프레임워크
- **Tailwind CSS**: 스타일링
- **Lucide Icons**: 아이콘

## 컨트랙트 종류

### 1. MainVoting
- **특징**: 다중 레코드 배치 (UserVoteBatch에 여러 VoteRecord)
- **필드**: timestamp, missionId, votingId, candidateId, voteType, votingAmt, userId
- **voteType**: 0=Forget, 1=Remember

### 2. SubVoting
- **특징**: 설문 기반 투표 (questionId 포함)
- **필드**: timestamp, missionId, votingId, questionId, optionId, votingAmt, userId
- **ABI 위치**: `out/SubVoting.sol/SubVoting.json`

### 3. Boosting
- **특징**: 단일 레코드 배치 (1 UserBoostBatch = 1 record)
- **필드**: timestamp, missionId, boostingId, optionId, boostingWith, amt, userId
- **boostingWith**: 0=BP(Boosting Point), 1=CELB(Celebus Token)

## Step 컴포넌트 구조

| Step | 이름 | 기능 |
|------|------|------|
| 0 | Setup | 컨트랙트 배포, Owner 설정, Executor 등록 |
| 1 | Executor | Executor/User 지갑 설정 |
| 2 | Records | 투표 레코드 생성 |
| 3 | UserSigs | User 서명 생성 (EIP-712) |
| 4 | Domain | EIP-712 Domain Separator 계산 |
| 5 | Struct | Struct Hash 계산 |
| 6 | Digest | Final Digest 및 Executor 서명 |
| 7 | Submit | 컨트랙트 제출 (Backend Simulation) |
| 8 | Query | 컨트랙트 데이터 조회 |
| 9 | Events | 이벤트 로그 조회 |
| 10 | Verifier | 서명 검증 유틸리티 |

## 개발 패턴

### 1. BaseStep 상속 패턴
```typescript
import { BaseStep } from '../BaseStep';
import type { AppState } from '../../state/AppState';
import * as UIHelper from '../../utils/UIHelper';

export class MyStep extends BaseStep {
  constructor(state: AppState) {
    super(state);
  }

  render(): string {
    return `<div id="myStep">...</div>`;
  }

  init(): void {
    super.init();
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    UIHelper.safeAddEventListener('myButton', 'click', () => {
      this.handleClick();
    });
  }
}
```

### 2. UIHelper 사용
```typescript
// 값 가져오기/설정
UIHelper.getInputValue('inputId');
UIHelper.setInputValue('inputId', 'value');
UIHelper.showValue('spanId', 'value');

// 이벤트 리스너
UIHelper.safeAddEventListener('elementId', 'click', handler);

// 상태 표시
UIHelper.showLoading('statusId', 'Loading...');
UIHelper.showSuccess('statusId', 'Success!');
UIHelper.showError('statusId', 'Error!');
```

### 3. viem 컨트랙트 호출
```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { opBNBTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const publicClient = createPublicClient({
  chain: opBNBTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  account: privateKeyToAccount(privateKey),
  chain: opBNBTestnet,
  transport: http(),
});
```

## 코딩 규칙

### TypeScript Strict Mode
- `noUncheckedIndexedAccess: true` - 배열 접근 시 `?.` 필수
- `any` 타입 금지 - 명시적 타입 선언
- `strictNullChecks: true` - null 체크 필수

### 스타일 규칙
- `flex` 사용 (`inline-flex` 금지)
- Tailwind CSS v4 패턴
- Lucide Icons 사용 (이모지 대신)

### 파일 네이밍
- Step 컴포넌트: `Step{N}{Name}.ts` (예: Step0Setup.ts)
- SubVoting: `SubStep{N}{Name}.ts` (예: SubStep0Setup.ts)
- Boosting: `BoostStep{N}{Name}.ts` (예: BoostStep0Setup.ts)

## 테스트 실행

```bash
cd demo
npm test           # 전체 테스트
npm run test:coverage  # 커버리지
npm run build      # 빌드
npm run dev        # 개발 서버
```

## 빌드 검증 체크리스트

- [ ] `npm run build` 성공
- [ ] TypeScript 에러 0개
- [ ] 번들 크기 확인 (목표: < 500KB)
- [ ] 테스트 통과

## 자주 사용하는 명령어

### 컨트랙트 빌드 (Foundry)
```bash
forge build
```

### ABI 추출
```bash
jq '.abi' out/MainVoting.sol/MainVoting.json > demo/src/abi/MainVoting.json
```

### Bytecode 추출
```bash
jq -r '.bytecode.object' out/SubVoting.sol/SubVoting.json > SubVoting-bytecode.txt
```

## 관련 파일 참조

- **Memory**: memory MCP의 `Demo TypeScript Migration Project` 엔티티 참조
- **문서**: `demo/README.md`, `demo/docs/ARCHITECTURE.md`
- **테스트**: `demo/src/**/__tests__/`
