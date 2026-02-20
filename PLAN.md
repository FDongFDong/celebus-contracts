# Celebus Demo App UX/UI 전면 개선 계획

> 4명의 전문가(PM, UX 디자이너, 프론트엔드 아키텍트, 스마트컨트랙트 전문가)의 토론 결과를 종합한 실행 계획

---

## 1. 현재 상태 진단 요약

### 핵심 문제 (전문가 합의)

| 심각도 | 문제 | 영향 범위 | 합의 수준 |
|--------|------|----------|----------|
| **P0** | Private Key를 input 필드에 직접 입력 | Permit, NFT | 4/4 전원 합의 |
| **P0** | 개발자 디버깅 도구 수준의 UI (일반 사용자 사용 불가) | 전체 탭 | 4/4 전원 합의 |
| **P1** | 7~11 Step 순차 강제 (실제 필요 액션은 2~3개) | 전체 탭 | 4/4 전원 합의 |
| **P1** | Admin/User 기능 혼재 (배포+설정+사용이 한 화면) | Main, Permit | 3/4 합의 |
| **P1** | 기술 용어 과다 노출 (v/r/s, DOMAIN_SEPARATOR, nonce) | 전체 탭 | 4/4 전원 합의 |
| **P2** | useAppStore 797줄 모놀리식 (리렌더링, 유지보수) | 전체 | 2/4 (아키텍트, PM) |
| **P2** | 체인 설정/ABI 하드코딩 (6+곳에서 중복) | 전체 | 2/4 (아키텍트, 컨트랙트) |
| **P2** | 지갑 연결 패턴 불일치 (MetaMask vs Private Key) | Permit, NFT | 3/4 합의 |
| **P3** | 모바일 반응형 부족 (5-col 탭, hex 줄바꿈) | 전체 | 1/4 (UX) |
| **P3** | NFT setInterval 500ms 폴링 안티패턴 | NFT | 1/4 (아키텍트) |

### 현재 아키텍처

```
사용자 → Step 0~10 순차 진행 → Private Key 직접 입력 → 서명 → TX 제출
          ↑ 모든 기술 세부사항 노출       ↑ 보안 위험       ↑ 에러 가이딩 없음
```

### 목표 아키텍처

```
사용자 → MetaMask 연결 → 핵심 액션(승인/투표/전송) → 결과 확인
         ↑ 자동            ↑ 2~3단계로 축소          ↑ 직관적 피드백
                           ↑ 기술 세부사항은 "고급" 패널에 숨김
```

---

## 2. 설계 원칙 (전문가 합의)

### 2.1 UX 원칙

1. **MetaMask-First**: 모든 서명/트랜잭션은 지갑을 통해 수행. Private Key 입력 전면 제거
2. **Progressive Disclosure**: 기본 UI는 비즈니스 언어, 기술 세부사항은 "고급 보기"로 점진적 공개
3. **Admin/User 분리**: 배포/설정은 Admin 영역, 사용/전송은 User 영역으로 분리
4. **Step 자동화**: 읽기 전용 조회(nonce, domain, balance)는 자동 실행, 사용자 액션만 Step으로 노출
5. **비즈니스 언어**: `permit()` → "토큰 승인하기", `transferFrom()` → "토큰 전송하기"
6. **일반/개발자 모드 토글**: 동일 페이지에서 사용자 수준에 따른 정보 노출 조절

### 2.2 기술 원칙

1. **도메인별 스토어 분리**: 탭별 독립 Zustand 스토어 (797줄 모놀리식 → 슬라이스)
2. **훅 기반 로직 추출**: 비즈니스 로직은 커스텀 훅으로, 컴포넌트는 UI만 담당
3. **하드코딩 제거**: 체인/ABI/주소를 중앙 설정으로 통합
4. **viem 유지 + 추상화**: wagmi 도입하지 않고, viem 위에 `useChainClient`/`useInjectedWallet` 훅 계층 추가
5. **점진적 마이그레이션**: 기존 코드를 유지하면서 단계적 개선 (Permit → NFT → Main → Sub → Boost)

---

## 3. Permit 탭 재설계 (파일럿)

> Permit 탭을 파일럿으로 먼저 개선하고, 검증된 패턴을 다른 탭에 적용

### 3.1 유저 플로우 변경

**As-Is (7 Step)**:
```
Step 0: 토큰 주소 입력 or 배포 (constructor args 직접 입력)
Step 1: Owner/Spender Private Key 직접 입력
Step 2: EIP-712 Domain 정보 표시 (DOMAIN_SEPARATOR)
Step 3: Nonce 조회 → Value/Deadline → 서명 → v,r,s 표시
Step 4: Executor Private Key → permit() 호출
Step 5: transferFrom() 실행
Step 6: 단순 transfer()
```

**To-Be (일반 모드 3 Section)**:
```
Section 1: 토큰 설정
  - 기배포 토큰 주소 입력 (드롭다운 또는 직접 입력)
  - 자동: 토큰 이름/심볼/잔액 조회 및 표시
  - 배포 기능: "새 토큰 배포" → Sheet(사이드 드로어)로 분리

Section 2: 승인 설정 (Approve via Permit)
  - Spender 주소 입력
  - 승인 수량 입력 (사람이 읽을 수 있는 단위, "최대" 버튼)
  - 유효 기간 선택 (1시간/24시간/7일/무제한 라디오)
  - [서명하고 승인하기] → MetaMask signTypedData → 자동으로 permit() 실행
  - 내부 자동화: nonce 조회, domain 구성, v/r/s 분리, permit() 호출
  - ▸ "기술 세부사항 보기" (Collapsible): domain, nonce, signature hex, v/r/s

Section 3: 토큰 전송 (Transfer)
  - 받는 주소 입력
  - 전송 수량 입력
  - 현재 Allowance/잔액 표시
  - [전송하기] → MetaMask 서명 → transferFrom() 실행
  - 트랜잭션 해시 + 블록 탐색기 링크
```

**To-Be (개발자 모드)**:
```
기존 Step 0~6 구조 유지
+ 각 Step에 완료 상태 표시
+ Step 간 의존성 시각화 (비활성화 + 안내)
+ Private Key 입력은 type="password" + 경고 배너
```

### 3.2 컴포넌트 구조

```
components/steps/permit/
├── PermitSimpleView.tsx          # 일반 모드 (Section 1~3 통합)
├── PermitDeveloperView.tsx       # 개발자 모드 (기존 Step 기반)
├── sections/
│   ├── TokenSetupSection.tsx     # Section 1: 토큰 설정
│   ├── ApproveSection.tsx        # Section 2: 승인
│   └── TransferSection.tsx       # Section 3: 전송
├── PermitStep0Setup.tsx          # 기존 유지 (개발자 모드용)
├── PermitStep1Wallets.tsx        # 기존 유지 (개발자 모드용)
├── ... (기존 Step 유지)
└── DeployTokenSheet.tsx          # 배포 기능 (Sheet 분리)
```

### 3.3 상태 관리

```typescript
// store/usePermitStore.ts (신규)
interface PermitState {
  // Token
  tokenAddress: Address | null;
  tokenInfo: { name: string; symbol: string; decimals: number; totalSupply: bigint } | null;

  // Approve
  spenderAddress: Address | null;
  approveAmount: string;
  deadline: 'hour' | 'day' | 'week' | 'unlimited';
  approveStatus: 'idle' | 'signing' | 'submitting' | 'confirmed' | 'error';
  approveTxHash: Hash | null;

  // Transfer
  recipientAddress: Address | null;
  transferAmount: string;
  transferStatus: 'idle' | 'submitting' | 'confirmed' | 'error';
  transferTxHash: Hash | null;

  // Balances
  ownerBalance: bigint | null;
  currentAllowance: bigint | null;

  // Developer mode extras
  nonce: bigint | null;
  domainSeparator: Hash | null;
  signature: { full: Hash; v: number; r: Hash; s: Hash } | null;

  // Actions
  loadToken: (address: Address) => Promise<void>;
  approveWithPermit: (params: ApproveParams) => Promise<void>;
  transfer: (params: TransferParams) => Promise<void>;
  reset: () => void;
}
```

### 3.4 커스텀 훅

```typescript
// hooks/usePermitApprove.ts
export function usePermitApprove() {
  // 1. nonce 자동 조회
  // 2. domain 자동 구성
  // 3. MetaMask signTypedData 호출
  // 4. v/r/s 분리
  // 5. permit() 트랜잭션 제출
  // 6. allowance 확인
  return { approve, isLoading, error, txHash };
}

// hooks/usePermitTransfer.ts
export function usePermitTransfer() {
  // transferFrom() 또는 transfer() 실행
  return { transfer, isLoading, error, txHash };
}

// hooks/useTokenInfo.ts
export function useTokenInfo(address: Address | null) {
  // name, symbol, decimals, totalSupply, balanceOf 자동 조회
  return { tokenInfo, balance, isLoading, error };
}
```

---

## 4. 공통 인프라 개선

### 4.1 신규 공유 컴포넌트

| 컴포넌트 | 용도 | 사용처 |
|----------|------|--------|
| `ModeToggle` | 일반/개발자 모드 전환 토글 | 모든 탭 상단 |
| `TransactionTracker` | TX 상태 실시간 표시 (서명→전송→확인) | 모든 TX 실행 |
| `AddressDisplay` | 주소 truncate + 복사 + 탐색기 링크 | 모든 주소 표시 |
| `TokenAmountInput` | 토큰 수량 입력 (decimals 자동 처리 + 최대 버튼) | Permit, Transfer |
| `TechDetail` | 기술 정보 Collapsible (기본 접힘) | 모든 기술 데이터 |
| `WalletRequiredGuard` | 지갑 미연결 시 연결 유도 UI | 모든 액션 전 |
| `StepReadinessGuard` | 이전 단계 미완료 시 비활성화 + 안내 | 개발자 모드 Step |
| `DeadlinePicker` | 유효 기간 선택 (라디오 또는 날짜 피커) | Permit, Voting |

### 4.2 공통 커스텀 훅

```typescript
// hooks/useChainClient.ts — PublicClient 통합 (4곳 중복 제거)
export function useChainClient() {
  const { selectedChainId } = useNetworkStore();
  const publicClient = useMemo(() =>
    createPublicClient({ chain: getChainById(selectedChainId), transport: http() }),
    [selectedChainId]
  );
  return { publicClient, chain: getChainById(selectedChainId) };
}

// hooks/useInjectedWallet.ts — MetaMask 통합 (Private Key 대체)
export function useInjectedWallet() {
  // connect, disconnect, ensureChain, signTypedData
  // 전체 앱에서 단일 지갑 상태 관리
}

// hooks/useContractError.ts — 에러 메시지 한글화
export function useContractError() {
  const decodeError = (error: unknown): string => {
    // Solidity custom error → 사용자 친화적 메시지
    // "BatchNonceAlreadyUsed" → "이미 처리된 배치입니다"
  };
  return { decodeError };
}
```

### 4.3 설정 중앙화

```typescript
// infrastructure/config/contracts.config.ts (신규)
export const CONTRACT_ADDRESSES = {
  5611: { // opBNB Testnet
    mainVoting: '0x...',
    subVoting: '0x...',
    boosting: '0x...',
    celbToken: '0x...',
    celebusNFT: '0x...',
  },
} as const;

// infrastructure/config/index.ts — 체인별 설정 통합
export function getContractAddress(chainId: number, contract: ContractName): Address;
```

### 4.4 유틸리티 통합

```typescript
// lib/format.ts (신규) — formatAddress 4곳 중복 제거
export function formatAddress(address: Address | null, chars = 6): string;
export function formatTokenAmount(amount: bigint, decimals: number): string;
export function formatTimestamp(timestamp: bigint): string;
```

---

## 5. 전체 탭 개선 방향

### 5.1 Main Voting (11 Step → 3 Phase)

**Phase 1: 준비 (Setup)**
- 컨트랙트 주소 입력/선택 (배포는 Admin 영역)
- MetaMask 연결 (Private Key 제거)
- 역할 확인 (Executor, Users)

**Phase 2: 실행 (Vote)**
- 레코드 생성 (투표 대상/옵션 선택)
- [투표하기] → MetaMask 서명 → 자동 제출
- 내부: Domain 구성, Struct 해시, Digest 생성, 배치 제출 모두 자동

**Phase 3: 확인 (Results)**
- 투표 결과 조회
- 이벤트 로그
- 서명 검증

**Admin 영역 (별도)**:
- 컨트랙트 배포
- Executor Signer 설정
- 아티스트/투표 타입 등록

### 5.2 Sub Voting

Main Voting과 동일한 3-Phase 구조 적용
- 추가: 질문/옵션 설정 (Admin 영역)

### 5.3 Boosting

Main Voting과 유사하되, 1:1 구조 반영
- 부스팅 타입(BP/CELB) 선택 UI
- 금액 입력 (CELB 부스팅 시)

### 5.4 NFT (5 Step → 2 Section)

**Section 1: NFT 관리**
- 소유 NFT 목록 표시
- 민팅/전송 (MetaMask 서명)

**Section 2: 잠금 관리**
- 잠금/해제 상태 표시
- 일괄 잠금/해제

**Admin 영역**: 배포, 배치 민팅, Base URI 설정

### 5.5 네비게이션 개선

```
현재: [Main] [Sub] [Boost] [Permit] [NFT]  (5개 동일 레벨)

개선안:
┌──────────────────────────────────────────────┐
│  투표                │  토큰      │  NFT     │
│  [Main] [Sub] [Boost]│  [Permit]  │  [NFT]   │
└──────────────────────────────────────────────┘

모바일: 하단 탭 바 또는 햄버거 메뉴
```

---

## 6. 실행 계획 (3-Phase 로드맵)

### Phase 1: 기반 인프라 + Permit 파일럿 (1~2주)

> 목표: 공통 인프라 구축 + Permit 탭에서 패턴 검증

#### Week 1: 공통 인프라

| # | 작업 | 파일 | 난이도 |
|---|------|------|--------|
| 1-1 | `lib/format.ts` 생성 (formatAddress 등 중복 제거) | 신규 + 기존 4곳 수정 | 낮음 |
| 1-2 | `useChainClient` 훅 표준화 (PublicClient 중복 제거) | 신규 + 기존 4곳 수정 | 낮음 |
| 1-3 | `useInjectedWallet` 훅 생성 (MetaMask 통합) | 신규 | 중간 |
| 1-4 | 하드코딩 제거 (chainId 5611, chain import 등) | 기존 6곳 수정 | 낮음 |
| 1-5 | 공통 컴포넌트 생성: `AddressDisplay`, `TechDetail`, `ModeToggle` | 신규 | 중간 |
| 1-6 | `useNetworkStore` 분리 (selectedChainId, connectedWalletAddress) | 신규 | 낮음 |

#### Week 2: Permit 탭 재설계

| # | 작업 | 파일 | 난이도 |
|---|------|------|--------|
| 2-1 | `usePermitStore` 분리 (useAppStore에서 분리) | 신규 | 중간 |
| 2-2 | `usePermitApprove` 훅 (nonce~permit 자동화) | 신규 | 중간 |
| 2-3 | `usePermitTransfer` 훅 (transferFrom 래핑) | 신규 | 낮음 |
| 2-4 | `useTokenInfo` 훅 (토큰 정보 자동 조회) | 신규 | 낮음 |
| 2-5 | `TokenSetupSection` (Section 1 UI) | 신규 | 중간 |
| 2-6 | `ApproveSection` (Section 2 UI) | 신규 | 높음 |
| 2-7 | `TransferSection` (Section 3 UI) | 신규 | 중간 |
| 2-8 | `DeployTokenSheet` (배포를 Sheet로 분리) | 신규 | 중간 |
| 2-9 | `PermitSimpleView` (일반 모드 통합 뷰) | 신규 | 중간 |
| 2-10 | `PermitDeveloperView` (개발자 모드, 기존 Step 유지) | 신규 (기존 래핑) | 낮음 |
| 2-11 | `permit/page.tsx` 수정 (모드 전환 + 양쪽 뷰 렌더링) | 수정 | 낮음 |
| 2-12 | `TransactionTracker` 공통 컴포넌트 | 신규 | 중간 |
| 2-13 | `TokenAmountInput` 공통 컴포넌트 | 신규 | 낮음 |
| 2-14 | `WalletRequiredGuard` 공통 컴포넌트 | 신규 | 낮음 |
| 2-15 | `DeadlinePicker` 공통 컴포넌트 | 신규 | 낮음 |

### Phase 2: Main Voting + Sub + Boost 개선 (2~3주)

> 목표: Permit에서 검증된 패턴을 투표 계열 탭에 적용

| # | 작업 | 탭 | 난이도 |
|---|------|-----|--------|
| 3-1 | `useMainVotingStore` 분리 | Main | 높음 |
| 3-2 | Main Voting 일반 모드 뷰 (3-Phase) | Main | 높음 |
| 3-3 | Main Voting Admin 영역 분리 (배포/설정) | Main | 중간 |
| 3-4 | `useVotingSign` 훅 (EIP-712 서명 자동화) | 공통 | 중간 |
| 3-5 | `useSubVotingStore` 분리 | Sub | 중간 |
| 3-6 | Sub Voting 일반 모드 뷰 | Sub | 중간 |
| 3-7 | `useBoostingStore` 분리 | Boost | 중간 |
| 3-8 | Boosting 일반 모드 뷰 | Boost | 중간 |
| 3-9 | 네비게이션 그룹화 (투표/토큰/NFT) | 공통 | 낮음 |
| 3-10 | 에러 메시지 한글화 (`useContractError`) | 공통 | 낮음 |

### Phase 3: NFT + Polish (1~2주)

> 목표: NFT 탭 개선 + 전체 마감

| # | 작업 | 탭 | 난이도 |
|---|------|-----|--------|
| 4-1 | `useNftStore` 분리 + setInterval 폴링 제거 | NFT | 중간 |
| 4-2 | NFT 일반 모드 뷰 (2-Section) | NFT | 중간 |
| 4-3 | NFT Admin 영역 분리 | NFT | 낮음 |
| 4-4 | 레거시 `useAppStore` 제거 (모든 import 교체) | 전체 | 중간 |
| 4-5 | 모바일 반응형 개선 | 전체 | 중간 |
| 4-6 | 접근성 보강 (aria-label, focus-visible) | 전체 | 낮음 |
| 4-7 | TX 시뮬레이션 표시 (`simulateContract`) | 전체 | 중간 |
| 4-8 | 컨트랙트 주소 사전 등록 (`contracts.config.ts`) | 설정 | 낮음 |

---

## 7. 파일 변경 요약

### 신규 파일 (예상 30+ 파일)

```
# 스토어 분리
store/useNetworkStore.ts
store/usePermitStore.ts
store/useMainVotingStore.ts
store/useSubVotingStore.ts
store/useBoostingStore.ts
store/useNftStore.ts

# 커스텀 훅
hooks/useChainClient.ts
hooks/useInjectedWallet.ts
hooks/usePermitApprove.ts
hooks/usePermitTransfer.ts
hooks/useTokenInfo.ts
hooks/useVotingSign.ts
hooks/useContractError.ts
hooks/useStepReadiness.ts

# 공통 컴포넌트
components/shared/ModeToggle.tsx
components/shared/TransactionTracker.tsx
components/shared/AddressDisplay.tsx
components/shared/TokenAmountInput.tsx
components/shared/TechDetail.tsx
components/shared/WalletRequiredGuard.tsx
components/shared/StepReadinessGuard.tsx
components/shared/DeadlinePicker.tsx

# Permit 탭 재설계
components/steps/permit/PermitSimpleView.tsx
components/steps/permit/PermitDeveloperView.tsx
components/steps/permit/sections/TokenSetupSection.tsx
components/steps/permit/sections/ApproveSection.tsx
components/steps/permit/sections/TransferSection.tsx
components/steps/permit/DeployTokenSheet.tsx

# 설정
infrastructure/config/contracts.config.ts

# 유틸리티
lib/format.ts
```

### 수정 파일 (예상 20+ 파일)

```
# 스토어 마이그레이션
store/useAppStore.ts → 점진적 축소 후 삭제

# 페이지
app/(voting)/permit/page.tsx → 모드 전환 로직 추가
app/(voting)/main/page.tsx → 3-Phase 뷰 추가
(나머지 탭들도 유사)

# 하드코딩 제거
infrastructure/viem/WalletAdapter.ts → 체인 파라미터화
infrastructure/viem/injected-wallet.ts → useChainClient 사용
components/steps/main-voting/Step3UserSigs.ts → 하드코딩 제거
components/steps/permit/PermitStep3Permit.tsx → 하드코딩 제거

# 네비게이션
components/layout/TabNavigation.tsx → 그룹화

# 중복 제거
formatAddress 사용처 4곳 → lib/format.ts import로 교체
```

### 삭제 예정

```
# Phase 3 완료 후
store/useAppStore.ts → 모든 슬라이스 분리 완료 후 삭제
```

---

## 8. 기존 코드 보존 전략

> 개발자 모드를 통해 기존 Step 기반 UI를 유지하면서 새 UI를 추가하는 방식

- 기존 `PermitStep0~6` 컴포넌트는 **삭제하지 않음**
- `PermitDeveloperView`에서 기존 컴포넌트를 그대로 렌더링
- 사용자가 "개발자 모드" 토글 시 기존 상세 Step 확인 가능
- 새로운 `PermitSimpleView`는 기존 컴포넌트와 **독립적으로 동작**
- `usePermitStore`는 기존 `useAppStore`의 permit 상태를 포크하여 시작

---

## 9. 위험 요소 및 대응

| 위험 | 확률 | 영향 | 대응 |
|------|------|------|------|
| useAppStore 분리 시 기존 기능 깨짐 | 중 | 높 | 점진적 분리, 기존 스토어 유지하며 병렬 운영 |
| MetaMask 연동 시 기존 Private Key 데모 불가 | 낮 | 중 | 개발자 모드에서 Private Key 입력 유지 |
| 공통 컴포넌트 과도한 추상화 | 중 | 중 | YAGNI 원칙, 실제 2곳 이상에서 사용될 때만 추출 |
| 모바일 반응형 작업 범위 확대 | 중 | 낮 | Phase 3로 후순위, 데스크탑 우선 |

---

## 10. 성공 지표

| 지표 | 현재 | 목표 |
|------|------|------|
| Permit 탭 Step 수 (일반 모드) | 7 | 3 |
| Main Voting Step 수 (일반 모드) | 11 | 3 |
| Private Key 입력 필드 | 5곳 | 0곳 (일반 모드) |
| 기술 용어 직접 노출 | 30+ | 0 (일반 모드, 고급에서만) |
| useAppStore 줄 수 | 797줄 | 0줄 (삭제, 슬라이스로 분리) |
| 체인 하드코딩 | 6곳 | 0곳 |
| PublicClient 중복 생성 | 4곳 | 1곳 (useChainClient) |
| formatAddress 중복 | 4곳 | 1곳 (lib/format.ts) |
