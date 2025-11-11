# opBNBScan Verify 정보

## 📝 컨트랙트 정보

**컨트랙트 주소**: `0x0b26e96bf1FA058BdAd6ff3186B8c46055dCDa0e`  
**네트워크**: opBNB Testnet (Chain ID: 5611)  
**컴파일러**: Solidity v0.8.30+commit.cebd296c  
**최적화**: Yes (200 runs)  
**Via IR**: Yes ✅  
**라이선스**: MIT  

## 🔧 Verify 방법 (Web UI)

### 1. 웹사이트 접속
https://testnet.opbnbscan.com/verifyContract

### 2. 컨트랙트 주소 입력
```
0x0b26e96bf1FA058BdAd6ff3186B8c46055dCDa0e
```

### 3. Compiler Type 선택
**Solidity (Standard JSON Input)** 선택 (중요!)

### 4. Compiler Version
```
v0.8.30+commit.cebd296c
```

### 5. Open Source License Type
```
3) MIT License (MIT)
```

### 6. Standard JSON Input
`standard-input-new.json` 파일 전체 내용 붙여넣기

파일 위치: `/Users/goodblock/Project/celebus/contracts/standard-input-new.json`

### 7. Constructor Arguments (ABI-encoded)
```
0x000000000000000000000000dc45fe9ff7af3522bb2b88a602670ab4be2c6f91
```

## ✅ 추가된 기능

### votingID로 조회 가능 (신규!)

**함수 1**: `getVotesByVotingId(uint256 missionId, uint256 votingId)`
- 특정 votingId의 모든 투표 기록 반환

**함수 2**: `getVoteCountByVotingId(uint256 missionId, uint256 votingId)`
- 특정 votingId의 투표 개수 반환

### 사용 예시

```bash
# votingId 1의 투표 개수 조회
cast call 0x0b26e96bf1FA058BdAd6ff3186B8c46055dCDa0e \
  "getVoteCountByVotingId(uint256,uint256)(uint256)" 1 1 \
  --rpc-url https://opbnb-testnet-rpc.bnbchain.org

# votingId 2의 투표 기록 조회
cast call 0x0b26e96bf1FA058BdAd6ff3186B8c46055dCDa0e \
  "getVotesByVotingId(uint256,uint256)" 1 2 \
  --rpc-url https://opbnb-testnet-rpc.bnbchain.org
```

## 📊 테스트 투표 결과

| votingId | 후보 | 선택 | 포인트 | 개수 |
|----------|------|------|--------|------|
| 1 | YuSeungWoo | Remember | 100 | 1 |
| 2 | JangBeomJun | Remember | 200 | 1 |
| 3 | SangNamja | Remember | 150 | 1 |
| 4 | KaSang | Remember | 180 | 1 |

**총 투표**: 4개  
**총 포인트**: 630

## 🔗 링크

**컨트랙트**: https://testnet.opbnbscan.com/address/0x0b26e96bf1FA058BdAd6ff3186B8c46055dCDa0e

**Owner**: 0xDc45fE9fF7aF3522bB2B88a602670Ab4bE2C6f91  
**Executor Signer**: 0xDc45fE9fF7aF3522bB2B88a602670Ab4bE2C6f91

## 📁 파일 위치

- Standard JSON: `standard-input-new.json`
- Flattened Source: `MainVoting_flat.sol`
- Deploy Script: `script/DeployMainVoting.s.sol`
- Test Script: `script/TestVoting.s.sol`

