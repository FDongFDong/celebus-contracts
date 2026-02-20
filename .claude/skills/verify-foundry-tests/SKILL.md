---
name: verify-foundry-tests
description: Foundry 테스트 커버리지, 명명 규칙, TypeHash 동기화를 검증합니다. 테스트 수정 후 사용.
---

## Purpose

1. **테스트 커버리지 검증** — 모든 프로덕션 컨트랙트에 대응 테스트 존재 여부
2. **Invariant 테스트 검증** — 투표/부스팅/NFT 컨트랙트에 invariant 테스트 존재 여부
3. **TypeHash 동기화 검증** — 테스트 내 EIP-712 TypeHash가 컨트랙트와 일치하는지
4. **테스트 명명 규칙 검증** — `test_*` / `testFuzz_*` / `testFail_*` 패턴 준수
5. **테스트 실행 검증** — `forge test` 통과 여부

## When to Run

- `test/` 디렉토리의 `.t.sol` 파일을 수정한 후
- `src/` 컨트랙트의 EIP-712 TypeHash를 변경한 후
- 새 컨트랙트를 추가한 후
- invariant 테스트 핸들러를 수정한 후
- PR 전 최종 검증 시

## Related Files

| File | Purpose |
|------|---------|
| `test/MainVoting.t.sol` | MainVoting 단위 테스트 |
| `test/SubVoting.t.sol` | SubVoting 단위 테스트 |
| `test/Boosting.t.sol` | Boosting 단위 테스트 |
| `test/VIBENFT.t.sol` | VIBENFT 단위 테스트 |
| `test/CelebTokenPermit.t.sol` | CelebToken Permit 테스트 |
| `test/invariant/MainVoting.invariant.t.sol` | MainVoting invariant 테스트 |
| `test/invariant/SubVoting.invariant.t.sol` | SubVoting invariant 테스트 |
| `test/invariant/Boosting.invariant.t.sol` | Boosting invariant 테스트 |
| `test/invariant/VIBENFT.invariant.t.sol` | VIBENFT invariant 테스트 |
| `test/invariant/handlers/MainVotingHandler.sol` | MainVoting invariant 핸들러 |
| `test/invariant/handlers/SubVotingHandler.sol` | SubVoting invariant 핸들러 |
| `test/invariant/handlers/BoostingHandler.sol` | Boosting invariant 핸들러 |
| `test/mocks/ERC1271Mock.sol` | ERC-1271 스마트 월렛 목 |
| `test/mocks/ERC721ReceiverMock.sol` | ERC-721 수신자 목 |
| `src/vote/MainVoting.sol` | TypeHash 동기화 대상 |
| `src/vote/SubVoting.sol` | TypeHash 동기화 대상 |
| `src/vote/Boosting.sol` | TypeHash 동기화 대상 |

## Workflow

### Step 1: 테스트 커버리지 매핑

**검사:** 모든 프로덕션 컨트랙트(`src/`)에 대응하는 테스트 파일이 `test/`에 존재하는지 확인합니다.

```bash
echo "=== 프로덕션 컨트랙트 ==="
find src/ -name "*.sol" -not -path "*/lib/*" -not -path "*/common/*" | sort

echo ""
echo "=== 테스트 파일 ==="
find test/ -name "*.t.sol" -not -path "*/invariant/*" | sort

echo ""
echo "=== Invariant 테스트 ==="
find test/invariant/ -name "*.invariant.t.sol" | sort
```

**PASS:** 각 프로덕션 컨트랙트에 최소 1개의 테스트 파일 존재
**FAIL:** 테스트 파일이 없는 프로덕션 컨트랙트 존재
**수정:** 누락된 컨트랙트에 대한 테스트 파일 생성

### Step 2: Invariant 테스트 존재 확인

**검사:** MainVoting, SubVoting, Boosting, VIBENFT에 invariant 테스트가 존재하는지 확인합니다.

```bash
ls test/invariant/*.invariant.t.sol 2>/dev/null
ls test/invariant/handlers/*.sol 2>/dev/null
```

**PASS:** 4개 컨트랙트 모두 invariant 테스트와 핸들러 존재
**FAIL:** invariant 테스트 또는 핸들러가 누락
**수정:** 누락된 invariant 테스트/핸들러 생성

### Step 3: EIP-712 TypeHash 동기화 검증

**검사:** 테스트 파일의 TypeHash 상수가 해당 컨트랙트의 TypeHash와 정확히 일치하는지 확인합니다.

```bash
echo "=== MainVoting 컨트랙트 TypeHash ==="
grep "VOTE_RECORD_TYPEHASH\|USER_BATCH_TYPEHASH\|BATCH_TYPEHASH" src/vote/MainVoting.sol

echo ""
echo "=== MainVoting 테스트 TypeHash ==="
grep "VOTE_RECORD_TYPEHASH\|USER_BATCH_TYPEHASH\|BATCH_TYPEHASH" test/MainVoting.t.sol

echo ""
echo "=== SubVoting 컨트랙트 TypeHash ==="
grep "VOTE_RECORD_TYPEHASH\|USER_BATCH_TYPEHASH\|BATCH_TYPEHASH" src/vote/SubVoting.sol

echo ""
echo "=== SubVoting 테스트 TypeHash ==="
grep "VOTE_RECORD_TYPEHASH\|USER_BATCH_TYPEHASH\|BATCH_TYPEHASH" test/SubVoting.t.sol

echo ""
echo "=== Boosting 컨트랙트 TypeHash ==="
grep "BOOST_RECORD_TYPEHASH\|USER_BOOST_TYPEHASH\|BATCH_TYPEHASH" src/vote/Boosting.sol

echo ""
echo "=== Boosting 테스트 TypeHash ==="
grep "BOOST_RECORD_TYPEHASH\|USER_BOOST_TYPEHASH\|BATCH_TYPEHASH" test/Boosting.t.sol
```

**PASS:** 모든 TypeHash 문자열이 컨트랙트와 테스트 간 동일
**FAIL:** TypeHash 불일치 발견 (서명 검증 실패 원인)
**수정:** 테스트의 TypeHash를 컨트랙트와 동기화

### Step 4: 테스트 함수 명명 규칙 검증

**검사:** 테스트 함수가 Foundry 명명 규칙(`test_*`, `testFuzz_*`, `testFail_*`, `test_Revert*`)을 따르는지 확인합니다.

```bash
grep -rn "function test" test/ --include="*.sol" | grep -v "test_\|testFuzz_\|testFail_\|test_Revert\|setUp\|// " | head -20
```

**PASS:** 모든 테스트 함수가 표준 명명 규칙 준수
**FAIL:** 비표준 이름의 테스트 함수 존재 (Foundry가 인식하지 못할 수 있음)
**수정:** 함수 이름을 `test_*` 패턴으로 수정

### Step 5: setUp 함수 존재 확인

**검사:** 모든 테스트 컨트랙트에 `setUp()` 함수가 정의되어 있는지 확인합니다.

```bash
for f in $(find test/ -name "*.t.sol"); do
  if ! grep -q "function setUp" "$f"; then
    echo "FAIL: $f - setUp() 없음"
  fi
done
```

**PASS:** 모든 테스트 컨트랙트에 `setUp()` 존재
**FAIL:** `setUp()`이 없는 테스트 파일 존재
**수정:** 테스트 초기화를 위한 `setUp()` 함수 추가

### Step 6: 목(Mock) 파일 위치 검증

**검사:** 목 컨트랙트가 `test/mocks/` 디렉토리에 위치하는지 확인합니다.

```bash
# test/mocks/ 외부에 Mock이 있는지 확인
find test/ -name "*Mock*.sol" -not -path "test/mocks/*" | head -10
```

**PASS:** 모든 목 컨트랙트가 `test/mocks/`에 위치
**FAIL:** `test/mocks/` 외부에 목 컨트랙트 존재
**수정:** 목 컨트랙트를 `test/mocks/`로 이동

### Step 7: forge test 실행

**검사:** 모든 테스트가 통과하는지 확인합니다.

```bash
forge test --summary 2>&1 | tail -30
```

**PASS:** 모든 테스트 통과 (0 failed)
**FAIL:** 실패한 테스트 존재
**수정:** 실패 원인을 분석하여 컨트랙트 또는 테스트 수정

## Output Format

| 검사 | 결과 | 상세 |
|------|------|------|
| 테스트 커버리지 | PASS/FAIL | 테스트 없는 컨트랙트 |
| Invariant 테스트 | PASS/FAIL | 누락된 invariant 테스트 |
| TypeHash 동기화 | PASS/FAIL | 불일치 항목 |
| 명명 규칙 | PASS/FAIL | 비표준 함수명 |
| setUp 존재 | PASS/FAIL | setUp 없는 파일 |
| Mock 위치 | PASS/FAIL | 잘못된 위치의 Mock |
| forge test | PASS/FAIL | 실패 테스트 수 |

## Exceptions

다음은 **위반이 아닙니다**:

1. **HashDebug.t.sol / UserVoteResultEvent.t.sol** — 디버깅/이벤트 검증용 보조 테스트 파일로, 프로덕션 컨트랙트와 1:1 매핑이 아니어도 됩니다.
2. **CelebToken에 invariant 테스트 없음** — CelebToken은 표준 OpenZeppelin ERC20이므로 별도 invariant 테스트가 불필요합니다. Permit 테스트(`CelebTokenPermit.t.sol`)로 충분합니다.
3. **테스트에서 private key 직접 사용** — 테스트 환경에서 `vm.sign()`을 위해 private key를 사용하는 것은 정상입니다. 프로덕션 코드와 구분됩니다.
