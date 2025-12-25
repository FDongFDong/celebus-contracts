# Presentation Layer

프레젠테이션 계층 - UI 상태 관리 및 컴포넌트 시스템

## 개요

이 계층은 다음 두 가지 핵심 요소를 제공합니다:

1. **AppState**: 전역 애플리케이션 상태 관리 (옵저버 패턴)
2. **BaseStep**: Step 컴포넌트의 추상 기본 클래스

## AppState

전역 애플리케이션 상태를 관리하는 클래스입니다. 기존 `demo-legacy/js/main.js`의 `state` 객체를 TypeScript로 변환한 것입니다.

### 특징

- **불변성**: `getState()`는 `Object.freeze`된 읽기 전용 객체 반환
- **옵저버 패턴**: 상태 변경 시 구독자에게 자동 통지
- **타입 안전성**: TypeScript strict mode 준수
- **간단한 API**: `getState()`, `setState()`, `subscribe()`, `reset()`

### 상태 구조

```typescript
interface AppStateData {
  // Wallets
  ownerWallet: WalletAdapter | null;
  executorWallet: WalletAdapter | null;
  userWallets: WalletAdapter[];

  // Records
  records: VoteRecord[];
  userBatchSigs: UserBatchSignature[];

  // EIP-712
  contractAddress: Address | null;
  batchNonce: bigint;
  domainSeparator: Hash | null;
  structHash: Hash | null;
  finalDigest: Hash | null;

  // Signatures
  executorSig: Hash | null;
}
```

### 사용 예시

```typescript
import { AppState } from './state/AppState';

// 1. 상태 생성
const appState = new AppState();

// 2. 상태 읽기
const state = appState.getState();
console.log(state.contractAddress); // null

// 3. 상태 업데이트
appState.setState({
  contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  batchNonce: 1n,
});

// 4. 상태 변경 구독
const unsubscribe = appState.subscribe((state) => {
  console.log('상태 변경됨:', state);
});

// 5. 구독 해제
unsubscribe();

// 6. 초기화
appState.reset();
```

## BaseStep

모든 Step 컴포넌트가 상속받아야 하는 추상 클래스입니다.

### 특징

- **상태 접근**: `this.state`로 AppState 접근
- **자동 구독**: `init()` 호출 시 상태 변경 자동 구독
- **생명주기**: `init()` → `render()` → `destroy()`
- **확장 가능**: `onStateChange()` 오버라이드로 커스텀 로직 추가

### 추상 메서드

- `render(): string` - UI 렌더링 (필수 구현)

### 선택적 오버라이드

- `onStateChange(state: Readonly<AppStateData>): void` - 상태 변경 시 호출
- `init(): void` - 초기화 (super.init() 호출 필수)
- `destroy(): void` - 정리 (super.destroy() 호출 필수)

### 사용 예시

```typescript
import { BaseStep } from './components/BaseStep';
import type { AppState, AppStateData } from './state/AppState';

class Step1Executor extends BaseStep {
  constructor(state: AppState) {
    super(state);
  }

  // 필수: UI 렌더링
  render(): string {
    const { executorWallet } = this.state.getState();
    return `
      <div>
        <h2>STEP 1: Executor 지갑 초기화</h2>
        <p>주소: ${executorWallet?.address ?? '미연결'}</p>
        <button onclick="window.step1.createWallet()">생성</button>
      </div>
    `;
  }

  // 선택: 상태 변경 감지
  protected onStateChange(state: Readonly<AppStateData>): void {
    if (state.executorWallet) {
      console.log('Executor 지갑 생성됨:', state.executorWallet.address);
      this.updateUI(); // UI 업데이트
    }
  }

  // 커스텀 메서드
  createWallet(): void {
    const wallet = new WalletAdapter(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );
    this.state.setState({ executorWallet: wallet });
  }

  private updateUI(): void {
    // DOM 업데이트 로직
    const addressEl = document.getElementById('executorAddress');
    if (addressEl) {
      addressEl.textContent = this.state.getState().executorWallet?.address ?? '';
    }
  }
}
```

## 디렉토리 구조

```
presentation/
├── state/
│   ├── AppState.ts          # 전역 상태 관리
│   └── index.ts             # export
├── components/
│   ├── BaseStep.ts          # Step 추상 클래스
│   ├── steps/               # 각 Step 구현체
│   │   ├── Step1Executor.ts
│   │   ├── Step2Records.ts
│   │   └── ...
│   └── index.ts             # export
├── views/                   # 탭별 View (MainVoting, SubVoting, Boosting)
├── utils/                   # UI 유틸리티
└── __tests__/               # 테스트
    ├── AppState.test.ts
    └── BaseStep.test.ts
```

## 마이그레이션 가이드

기존 `demo-legacy/js/main.js`에서 마이그레이션:

### Before (legacy)

```javascript
class MainVotingApp {
  constructor() {
    this.state = {
      ownerWallet: null,
      executorWallet: null,
      records: [],
      // ...
    };
  }
}

class Step1Executor {
  constructor(state) {
    this.state = state; // 직접 참조
  }

  createWallet() {
    this.state.executorWallet = wallet; // 직접 수정
  }
}
```

### After (TypeScript)

```typescript
import { AppState } from './state/AppState';
import { BaseStep } from './components/BaseStep';

class MainVotingApp {
  private appState: AppState;

  constructor() {
    this.appState = new AppState();
  }
}

class Step1Executor extends BaseStep {
  constructor(state: AppState) {
    super(state);
  }

  createWallet() {
    this.state.setState({ executorWallet: wallet }); // setState 사용
  }
}
```

## 테스트

```bash
# 전체 테스트
npm test

# 특정 테스트
npm test -- src/presentation/__tests__/AppState.test.ts --run
npm test -- src/presentation/__tests__/BaseStep.test.ts --run
```

## 주의사항

1. **불변성 준수**: `getState()`로 받은 객체는 읽기 전용
2. **setState 사용**: 상태 변경은 반드시 `setState()` 사용
3. **구독 해제**: 컴포넌트 정리 시 `destroy()` 호출 필수
4. **타입 안전성**: TypeScript strict mode 준수

## 다음 단계

- [ ] 각 Step 컴포넌트 구현 (Step1Executor, Step2Records, ...)
- [ ] MainVotingView 구현 (AppState + Step 통합)
- [ ] DOM 이벤트 바인딩 시스템 구현
- [ ] 상태 변경 로깅 시스템 추가
