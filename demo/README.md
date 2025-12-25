# Celebus Demo Application

Celebus 스마트 컨트랙트(MainVoting, SubVoting, Boosting)의 EIP-712 서명 및 배치 투표 기능을 테스트하기 위한 데모 애플리케이션입니다.

## 프로젝트 개요

이 프로젝트는 기존 `demo-legacy` JavaScript 코드를 **TypeScript + 클린 아키텍처**로 마이그레이션한 것입니다. 4계층 클린 아키텍처를 적용하여 유지보수성과 테스트 용이성을 개선했습니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| 빌드 도구 | Vite 5.x |
| 언어 | TypeScript 5.3+ (strict mode) |
| 블록체인 | viem 2.x |
| 테스트 | Vitest 1.x |
| 스타일 | Tailwind CSS |

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview

# 테스트 실행
npm test
```

## 프로젝트 구조

```
demo/
├── src/
│   ├── domain/                    # 도메인 계층
│   │   ├── entities/              # 엔티티 (VoteRecord 등)
│   │   ├── value-objects/         # 값 객체 (EIP712Domain 등)
│   │   ├── services/              # 도메인 서비스 (DigestService)
│   │   └── types.ts               # 공통 타입 정의
│   │
│   ├── application/               # 애플리케이션 계층
│   │   ├── use-cases/             # 유스케이스
│   │   │   ├── CreateRecordUseCase.ts
│   │   │   ├── SignBatchUseCase.ts
│   │   │   └── GenerateDigestUseCase.ts
│   │   └── errors.ts              # 애플리케이션 에러 정의
│   │
│   ├── infrastructure/            # 인프라 계층
│   │   ├── viem/                  # viem 클라이언트 어댑터
│   │   │   ├── ViemClient.ts
│   │   │   └── WalletAdapter.ts
│   │   ├── contracts/             # 컨트랙트 인터페이스
│   │   │   ├── MainVotingContract.ts
│   │   │   ├── SubVotingContract.ts
│   │   │   └── BoostingContract.ts
│   │   └── config/                # 체인 설정
│   │       └── chains.ts
│   │
│   ├── presentation/              # 프레젠테이션 계층
│   │   ├── state/                 # 전역 상태 관리
│   │   │   └── AppState.ts        # 옵저버 패턴 기반 상태
│   │   ├── components/            # UI 컴포넌트
│   │   │   ├── BaseStep.ts        # Step 추상 클래스
│   │   │   ├── TabNavigator.ts    # 탭 네비게이션
│   │   │   └── steps/             # Step 0-10 컴포넌트
│   │   ├── views/                 # 탭별 뷰
│   │   │   ├── MainVotingView.ts
│   │   │   ├── SubVotingView.ts
│   │   │   └── BoostingView.ts
│   │   └── utils/                 # UI 유틸리티
│   │       └── UIHelper.ts
│   │
│   ├── App.ts                     # 메인 애플리케이션
│   ├── main.ts                    # 엔트리 포인트
│   └── style.css                  # 스타일시트
│
├── index.html                     # HTML 템플릿
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## 주요 기능 (Step 0-10)

데모 애플리케이션은 EIP-712 서명 기반 배치 투표 프로세스를 단계별로 진행합니다:

| Step | 이름 | 설명 |
|------|------|------|
| **STEP 0** | Contract Setup | 컨트랙트 배포, Owner 설정, Executor 등록, VoteType 및 Artist 등록 |
| **STEP 1** | Executor Wallet | Executor 지갑 초기화 (배치 제출 권한 보유) |
| **STEP 2** | Vote Records | 투표 레코드 생성 (missionId, optionId, voteType, amount) |
| **STEP 3** | User Signatures | 각 사용자별 개별 서명 수집 (EIP-712 TypedData 서명) |
| **STEP 4** | Domain Separator | EIP-712 Domain Separator 생성 및 검증 |
| **STEP 5** | Struct Hash | EIP-712 TypedData Struct Hash 계산 |
| **STEP 6** | Final Digest | Domain Separator + Struct Hash 조합으로 최종 다이제스트 생성 |
| **STEP 7** | Batch Submit | Executor가 배치 트랜잭션 제출 |
| **STEP 8** | Query Results | 제출된 투표 결과 조회 |
| **STEP 9** | Event Logs | 컨트랙트 이벤트 로그 조회 |
| **STEP 10** | Signature Verifier | 서명 검증 유틸리티 (디버깅용) |

## 아키텍처 특징

### 클린 아키텍처 4계층

1. **Domain Layer**: 비즈니스 로직의 핵심. 외부 의존성 없음
2. **Application Layer**: 유스케이스 오케스트레이션. 도메인 객체 조합
3. **Infrastructure Layer**: 외부 시스템 통합 (viem, 블록체인)
4. **Presentation Layer**: UI 컴포넌트 및 상태 관리

### 상태 관리

- **AppState**: 옵저버 패턴 기반 전역 상태 관리
- **불변성**: `Object.freeze`로 상태 불변성 보장
- **구독 시스템**: 상태 변경 시 자동 UI 업데이트

### 컴포넌트 시스템

- **BaseStep**: 모든 Step 컴포넌트의 추상 기본 클래스
- **생명주기**: `init()` -> `render()` -> `destroy()`
- **상태 연동**: `onStateChange()` 오버라이드로 반응형 UI

## 지원 컨트랙트

| 컨트랙트 | 설명 |
|----------|------|
| MainVoting | 메인 투표 컨트랙트 (EIP-712 배치 투표) |
| SubVoting | 서브 투표 컨트랙트 |
| Boosting | 부스팅 컨트랙트 |

## Path Aliases

- `@/*` -> `./src/*`
- `@contracts/*` -> `../out/*` (Foundry build output)

## 테스트

```bash
# 전체 테스트 실행
npm test

# 특정 파일 테스트
npm test -- src/domain/entities/__tests__/VoteRecord.test.ts --run

# 커버리지 리포트
npm test -- --coverage
```

## 개발 환경

- Node.js 18+
- opBNB Testnet (Chain ID: 5611)

## 라이선스

Private - Celebus Team
