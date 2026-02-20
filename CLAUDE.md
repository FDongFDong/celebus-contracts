# Celebus Contracts - Project Guidelines

## Smart Contract Security Review Guidelines

### 의도적 설계 패턴 (문제로 플래그하지 말 것)

다음은 이 프로젝트에서 **의도적으로 선택한 설계 패턴**입니다. 보안 감사 시 이를 취약점으로 분류하지 마세요.

#### 1. EIP-712 서명 구조

**Executor 서명이 batchNonce만 포함**
- Executor는 단순 릴레이어 역할
- 각 사용자가 자신의 레코드에 개별 서명하므로 데이터 무결성 보장
- Executor가 배치 데이터를 변조해도 유효하지 않은 사용자 레코드는 거부됨

**recordId가 서명에 포함되지 않음**
- recordId는 백엔드가 생성하는 오프체인 식별자
- 온체인에서는 recordDigest(해시)로 중복 방지
- 실제 투표/부스팅 내용(timestamp, missionId, votingId, optionId 등)은 모두 서명에 포함됨

**userId가 서명에 포함되지 않음**
- 프론트엔드에서 userId 없이 서명
- 백엔드가 DB에서 userId를 조회하여 레코드에 주입
- 사용자는 지갑 주소로 식별, userId는 오프체인 매핑용

#### 2. ERC-1271 검증

**`ret.length >= 32` 검증**
- ABI 인코딩된 bytes4 반환값은 32바이트로 패딩됨
- `bytes4(ret)`로 첫 4바이트 추출하므로 표준 구현
- `>= 32`는 의도적 (일부 구현에서 추가 데이터 반환 가능)

#### 3. 중앙화 패턴

**단일 Owner/ExecutorSigner**
- 프로젝트 특성상 중앙화된 관리가 의도됨
- 필요 시 멀티시그 적용은 운영 레벨에서 결정
- Ownable2Step 사용으로 실수로 인한 소유권 손실 방지

#### 4. 조회 함수

**페이지네이션 없는 조회 함수**
- view 함수는 가스 비용 발생하지 않음
- 실제 대량 조회는 오프체인(이벤트 인덱싱, The Graph)에서 처리
- 온체인 조회는 소규모 데이터용

#### 5. Soft-fail 패턴

**배치 내 일부 실패 시 계속 처리**
- 한 유저의 검증 실패가 다른 유저에게 영향 주지 않음
- 실패한 레코드는 이벤트로 기록
- 의도적인 UX 설계

### 실제 검토가 필요한 항목

보안 감사 시 다음 항목에 집중하세요:

1. **Reentrancy**: 외부 호출 전 상태 변경 여부
2. **Access Control**: onlyOwner 등 권한 검사 누락
3. **Integer Overflow**: unchecked 블록 내 산술 연산
4. **Signature Replay**: nonce 검증 로직
5. **Front-running**: MEV 취약점
6. **DoS**: 반복문 내 외부 호출, 가스 제한

### 코드 컨벤션

- Solidity 0.8.20+ 사용
- OpenZeppelin Contracts 5.x
- Foundry 테스트 프레임워크
- EIP-712 구조화 서명
- Assembly 최적화 (가스 절약)

## Skills

| 스킬 | 설명 |
|------|------|
| `verify-solidity` | Solidity 컨트랙트 코드 컨벤션, 보안 패턴, EIP-712 일관성 검증 |
| `verify-foundry-tests` | Foundry 테스트 커버리지, TypeHash 동기화, 명명 규칙 검증 |
| `verify-implementation` | 모든 verify 스킬을 순차 실행하는 통합 검증 오케스트레이터 |
