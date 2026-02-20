---
name: verify-implementation
description: 모든 verify 스킬을 순차 실행하는 통합 검증 오케스트레이터. 코드 변경 후 전체 검증 시 사용.
---

## Purpose

1. **통합 검증** — 등록된 모든 verify 스킬을 순차적으로 실행
2. **전체 보고서 생성** — 각 스킬의 결과를 종합하여 최종 보고서 출력
3. **빌드 검증** — `forge build` 및 `forge test` 성공 확인

## When to Run

- PR 전 최종 검증 시
- 대규모 리팩토링 후
- 새 컨트랙트 추가 후 전체 일관성 확인 시
- CI/CD 파이프라인에서 자동 검증용

## 실행 대상 스킬

| # | 스킬 | 설명 |
|---|------|------|
| 1 | `verify-solidity` | Solidity 코드 컨벤션, 보안 패턴, EIP-712 일관성 |
| 2 | `verify-foundry-tests` | 테스트 커버리지, TypeHash 동기화, 명명 규칙 |

## Related Files

| File | Purpose |
|------|---------|
| `.claude/skills/verify-solidity/SKILL.md` | Solidity 검증 스킬 |
| `.claude/skills/verify-foundry-tests/SKILL.md` | Foundry 테스트 검증 스킬 |
| `~/.claude/skills/manage-skills/SKILL.md` | 스킬 관리 (글로벌, 등록 목록) |
| `foundry.toml` | Foundry 설정 |

## Workflow

### Step 1: 사전 검사 — forge build

모든 개별 스킬 실행 전에 컴파일이 되는지 먼저 확인합니다.

```bash
forge build 2>&1 | tail -5
```

**PASS:** 컴파일 성공
**FAIL:** 컴파일 에러 → 이후 스킬 실행 중단, 빌드 에러 먼저 수정

### Step 2: verify-solidity 실행

`/verify-solidity` 스킬을 호출하여 Solidity 코드 검증을 수행합니다.

결과를 기록합니다.

### Step 3: verify-foundry-tests 실행

`/verify-foundry-tests` 스킬을 호출하여 테스트 검증을 수행합니다.

결과를 기록합니다.

### Step 4: 최종 forge test 실행

모든 검증 후 전체 테스트를 실행합니다.

```bash
forge test --summary 2>&1 | tail -30
```

**PASS:** 모든 테스트 통과
**FAIL:** 실패 테스트 존재

### Step 5: 종합 보고서 출력

모든 스킬의 결과를 종합하여 최종 보고서를 출력합니다.

## Output Format

```markdown
## 통합 검증 보고서

### 빌드 상태
- forge build: PASS/FAIL

### 개별 스킬 결과

| # | 스킬 | 결과 | PASS | FAIL | 비고 |
|---|------|------|------|------|------|
| 1 | verify-solidity | PASS/FAIL | N개 | M개 | 상세 |
| 2 | verify-foundry-tests | PASS/FAIL | N개 | M개 | 상세 |

### 테스트 실행
- forge test: PASS/FAIL (N passed, M failed)

### 최종 판정
- ✅ PASS: 모든 검증 통과 (PR 가능)
- ❌ FAIL: N개 항목 수정 필요
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **개별 스킬의 예외사항** — 각 verify 스킬에 정의된 예외사항은 이 통합 스킬에서도 동일하게 적용됩니다.
2. **forge test 시간 초과** — invariant 테스트가 오래 걸릴 수 있으므로, 시간이 부족할 경우 `forge test --no-match-path "test/invariant/*"`로 기본 테스트만 실행해도 됩니다.
