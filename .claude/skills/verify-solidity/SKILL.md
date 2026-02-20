---
name: verify-solidity
description: Solidity 컨트랙트 코드 컨벤션, 보안 패턴, EIP-712 일관성을 검증합니다. 컨트랙트 수정 후 사용.
---

## Purpose

1. **라이선스 및 Pragma 검증** — SPDX-License-Identifier, Solidity 버전 일관성
2. **접근 제어 검증** — Ownable2Step 사용, onlyOwner/modifier 패턴
3. **EIP-712 일관성 검증** — TypeHash 정의와 실제 서명 구조 일치 여부
4. **NatSpec 문서화 검증** — 컨트랙트/함수 수준 문서화 존재 여부
5. **코딩 컨벤션 검증** — 상수 명명, 에러 정의, 이벤트 패턴

## When to Run

- `src/` 디렉토리의 `.sol` 파일을 수정한 후
- 새 컨트랙트를 추가한 후
- EIP-712 서명 구조를 변경한 후
- OpenZeppelin 의존성을 업데이트한 후
- PR 전 최종 검증 시

## Related Files

| File | Purpose |
|------|---------|
| `src/vote/MainVoting.sol` | 메인 투표 컨트랙트 (EIP-712, Ownable2Step) |
| `src/vote/SubVoting.sol` | 서브 투표 컨트랙트 (EIP-712, Ownable2Step) |
| `src/vote/Boosting.sol` | 부스팅 컨트랙트 (EIP-712, Ownable2Step) |
| `src/vote/lib/SignatureVerifier.sol` | 공유 서명 검증 라이브러리 |
| `src/common/IERC1271.sol` | ERC-1271 인터페이스 |
| `src/nft/VIBENFT.sol` | NFT 컨트랙트 (ERC721, Ownable) |
| `src/token/CelebToken.sol` | ERC20 토큰 (ERC20Permit, Ownable) |
| `foundry.toml` | Foundry 설정 (solc 버전, optimizer) |

## Workflow

### Step 1: SPDX 라이선스 헤더 검증

**검사:** 모든 `.sol` 파일의 첫 줄에 `SPDX-License-Identifier: MIT`가 있는지 확인합니다.

```bash
for f in $(find src/ -name "*.sol"); do
  head -1 "$f" | grep -q "SPDX-License-Identifier" || echo "FAIL: $f - SPDX 라이선스 없음"
done
```

**PASS:** 모든 파일에 SPDX 라이선스 헤더가 존재
**FAIL:** 라이선스 헤더가 누락된 파일이 있음
**수정:** 파일 첫 줄에 `// SPDX-License-Identifier: MIT` 추가

### Step 2: Pragma 버전 확인

**검사:** 프로젝트 내 pragma solidity 버전이 일관적인지 확인합니다. 투표 컨트랙트는 `^0.8.20`, NFT/토큰은 `^0.8.27`을 사용합니다.

```bash
grep -rn "pragma solidity" src/ --include="*.sol"
```

**PASS:** 각 도메인 내에서 pragma 버전이 일관됨
**FAIL:** 같은 도메인 내에서 다른 pragma 버전 사용
**수정:** 도메인 내 pragma 버전 통일

### Step 3: Ownable 패턴 검증

**검사:** 투표/부스팅 컨트랙트는 `Ownable2Step`을 사용해야 합니다 (소유권 이전 실수 방지).

```bash
grep -n "Ownable2Step\|Ownable " src/vote/*.sol
```

**PASS:** 투표/부스팅 컨트랙트가 모두 `Ownable2Step` 상속
**FAIL:** `Ownable`만 사용하는 투표/부스팅 컨트랙트 존재
**수정:** `Ownable` → `Ownable2Step`으로 변경

### Step 4: EIP-712 TypeHash 일관성 검증

**검사:** 각 컨트랙트의 TypeHash 문자열이 실제 구조체 필드와 일치하는지 확인합니다.

```bash
# MainVoting TypeHash
grep -A2 "VOTE_RECORD_TYPEHASH" src/vote/MainVoting.sol
grep -A2 "USER_BATCH_TYPEHASH" src/vote/MainVoting.sol
grep -A2 "BATCH_TYPEHASH" src/vote/MainVoting.sol

# SubVoting TypeHash
grep -A2 "VOTE_RECORD_TYPEHASH" src/vote/SubVoting.sol

# Boosting TypeHash
grep -A2 "BOOST_RECORD_TYPEHASH" src/vote/Boosting.sol
```

**PASS:** TypeHash의 필드 목록이 실제 서명 생성 코드와 일치
**FAIL:** TypeHash와 실제 `abi.encode` 호출의 필드가 불일치
**수정:** TypeHash 문자열과 `abi.encode` 필드 순서/타입 동기화

### Step 5: Custom Error 정의 검증

**검사:** 투표/부스팅 컨트랙트에 공통 에러(`ZeroAddress`, `InvalidSignature`, `BadChain`)가 정의되어 있는지 확인합니다.

```bash
for contract in src/vote/MainVoting.sol src/vote/SubVoting.sol src/vote/Boosting.sol; do
  echo "=== $contract ==="
  grep -c "error " "$contract"
  grep "error ZeroAddress\|error InvalidSignature\|error BadChain\|error BatchNonceAlreadyUsed" "$contract"
done
```

**PASS:** 세 컨트랙트 모두 공통 에러 타입 정의
**FAIL:** 일부 컨트랙트에서 공통 에러가 누락
**수정:** 누락된 에러 정의 추가

### Step 6: 상수 명명 컨벤션 검증

**검사:** public 상수는 `UPPER_SNAKE_CASE`, private 상수도 `UPPER_SNAKE_CASE`를 따르는지 확인합니다.

```bash
grep -n "constant " src/vote/*.sol src/nft/*.sol src/token/*.sol | grep -v "UPPER_CASE_PATTERN" | head -20
```

실제 검사는 Grep 도구로 `constant` 키워드 포함 줄을 읽고 명명 규칙을 수동 확인합니다.

**PASS:** 모든 상수가 UPPER_SNAKE_CASE
**FAIL:** camelCase나 다른 명명 규칙을 사용하는 상수 존재
**수정:** 상수를 UPPER_SNAKE_CASE로 리네임

### Step 7: NatSpec 문서화 검증

**검사:** 각 컨트랙트에 `@title`, `@notice` 또는 `@dev` NatSpec이 존재하는지 확인합니다.

```bash
for f in src/vote/*.sol src/nft/*.sol src/token/*.sol; do
  echo "=== $f ==="
  grep -c "@title\|@notice\|@dev" "$f"
done
```

**PASS:** 모든 컨트랙트에 최소 `@title` NatSpec 존재
**FAIL:** NatSpec이 없는 컨트랙트 존재
**수정:** 컨트랙트 수준 NatSpec 추가

### Step 8: SignatureVerifier 사용 일관성

**검사:** 투표/부스팅 컨트랙트가 모두 공유 `SignatureVerifier` 라이브러리를 사용하는지 확인합니다.

```bash
grep -n "SignatureVerifier" src/vote/*.sol
```

**PASS:** 세 컨트랙트 모두 `SignatureVerifier` import 및 사용
**FAIL:** 직접 ECDSA를 호출하거나 자체 검증 로직 사용
**수정:** `SignatureVerifier.isValidSignature()` 사용으로 통일

### Step 9: forge build 성공 확인

**검사:** 컨트랙트가 컴파일되는지 확인합니다.

```bash
forge build --sizes 2>&1 | tail -20
```

**PASS:** 컴파일 성공, 에러 없음
**FAIL:** 컴파일 에러 발생
**수정:** 에러 메시지를 분석하여 수정

## Output Format

| 검사 | 결과 | 상세 |
|------|------|------|
| SPDX 라이선스 | PASS/FAIL | 누락 파일 목록 |
| Pragma 버전 | PASS/FAIL | 불일치 파일 |
| Ownable 패턴 | PASS/FAIL | Ownable2Step 미사용 |
| EIP-712 TypeHash | PASS/FAIL | 불일치 항목 |
| Custom Error | PASS/FAIL | 누락 에러 |
| 상수 명명 | PASS/FAIL | 위반 상수 |
| NatSpec 문서화 | PASS/FAIL | 미문서화 컨트랙트 |
| SignatureVerifier | PASS/FAIL | 미사용 컨트랙트 |
| forge build | PASS/FAIL | 에러 메시지 |

## Exceptions

다음은 **위반이 아닙니다**:

1. **pragma 버전 차이** — `src/vote/`(^0.8.20)와 `src/nft/`, `src/token/`(^0.8.27)의 pragma 차이는 의도적입니다. 투표 컨트랙트는 이미 배포된 버전과의 호환성을 유지합니다.
2. **VIBENFT/CelebToken의 Ownable (not Ownable2Step)** — NFT/토큰 컨트랙트는 OpenZeppelin Wizard 기반으로 `Ownable`을 사용합니다. 투표 컨트랙트만 `Ownable2Step` 필수입니다.
3. **SignatureVerifier 미사용** — NFT/토큰 컨트랙트는 EIP-712 서명 검증이 필요 없으므로 `SignatureVerifier`를 import하지 않습니다.
4. **IERC1271.sol의 단순 인터페이스** — 4바이트 인터페이스만 정의하므로 NatSpec이 최소한이어도 문제 없습니다.
