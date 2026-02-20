# MainVoting Step 7-10 컴포넌트 변환 상태

## 생성 완료된 컴포넌트

### Step7Submit.tsx
- 트랜잭션 제출 컴포넌트
- Executor 서명으로 배치 투표 제출
- 트랜잭션 해시 및 상태 추적
- **현재 상태**: 기본 구조 완성, Store 통합 필요

### Step8Query.tsx
- 온체인 데이터 조회 컴포넌트
- Nonce 사용 여부 조회
- 아티스트 투표 집계 조회
- **현재 상태**: 기본 구조 완성, 일부 탭 구현 예정

### Step9Events.tsx
- 이벤트 조회 컴포넌트
- BatchVoted 이벤트 조회
- 이벤트 로그 파싱 및 표시
- **현재 상태**: 기본 구조 완성

### Step10Verifier.tsx
- 서명 검증 유틸리티
- EIP-712 서명 생성 및 검증
- 온체인 서명 검증 (ecrecover)
- **현재 상태**: 기본 구조 완성

## 생성된 추가 파일

### textarea.tsx
- shadcn/ui Textarea 컴포넌트
- Step7Submit, Step10Verifier에서 사용

## Store 통합 이슈

현재 Store(`useAppStore`)의 데이터 구조와 Vanilla TS 버전의 AppState가 다릅니다:

- **Vanilla TS**: `records[]`, `userBatchSigs[]`, `batchNonce`, `executorSig`
- **Next.js**: `mainVotingRecords[]`, `mainVotingSignatures[]`, `mainVotingDigest`

### UserBatchSignature 타입 차이
```typescript
// Vanilla TS에서 기대하는 구조
interface UserBatchSig {
  user: Address;
  nonce: bigint;
  signature: Hash;
}

// 현재 Store의 구조
interface UserBatchSignature {
  userAddress: Address;
  signature: Hash;
  // nonce 필드 없음!
}
```

## 다음 단계

1. **Store 구조 확장**: `UserBatchSignature`에 `nonce` 필드 추가
2. **Step3UserSigs 수정**: nonce를 포함한 서명 저장
3. **Step7Submit 완성**: 올바른 Store 데이터로 트랜잭션 제출
4. **빌드 검증**: TypeScript 에러 모두 해결
5. **테스트**: 실제 동작 확인

## 참고 파일 경로

- Store: `/Users/goodblock/Project/celebus/contracts/demo-next/src/store/useAppStore.ts`
- Step7: `/Users/goodblock/Project/celebus/contracts/demo-next/src/components/steps/main-voting/Step7Submit.tsx`
- Step8: `/Users/goodblock/Project/celebus/contracts/demo-next/src/components/steps/main-voting/Step8Query.tsx`
- Step9: `/Users/goodblock/Project/celebus/contracts/demo-next/src/components/steps/main-voting/Step9Events.tsx`
- Step10: `/Users/goodblock/Project/celebus/contracts/demo-next/src/components/steps/main-voting/Step10Verifier.tsx`

