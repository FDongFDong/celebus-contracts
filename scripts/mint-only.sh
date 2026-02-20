#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 환경변수 체크
if [ -z "$NFT_ADDRESS" ]; then
    echo -e "${RED}❌ NFT_ADDRESS가 설정되지 않았습니다${NC}"
    echo "export NFT_ADDRESS=0xYourNFTAddress"
    exit 1
fi

if [ -z "$RECIPIENT" ]; then
    echo -e "${RED}❌ RECIPIENT이 설정되지 않았습니다${NC}"
    echo "export RECIPIENT=0xYourAddress"
    exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ PRIVATE_KEY가 설정되지 않았습니다${NC}"
    echo "export PRIVATE_KEY=0xYourPrivateKey"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo -e "${RED}❌ RPC_URL이 설정되지 않았습니다${NC}"
    echo "export RPC_URL=https://opbnb-testnet-rpc.bnbchain.org"
    exit 1
fi

# 기본값
BATCH_SIZE=${BATCH_SIZE:-200}
REPEAT_COUNT=${REPEAT_COUNT:-5}
START_TOKEN_ID=${START_TOKEN_ID:-1}

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   📦 NFT 배치 민팅                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}NFT 주소: $NFT_ADDRESS${NC}"
echo -e "${GREEN}수령자: $RECIPIENT${NC}"
echo -e "${YELLOW}배치 크기: $BATCH_SIZE${NC}"
echo -e "${YELLOW}반복 횟수: $REPEAT_COUNT${NC}"
echo -e "${YELLOW}총 민팅: $((BATCH_SIZE * REPEAT_COUNT))개${NC}"
echo -e "${YELLOW}토큰 ID 정책: 자동 증가 (START_TOKEN_ID는 호환용)${NC}"
echo ""

export NFT_ADDRESS
export RECIPIENT
export BATCH_SIZE
export REPEAT_COUNT
export START_TOKEN_ID

echo -e "${BLUE}민팅 스크립트 실행 중...${NC}"
echo -e "${YELLOW}⚡ 시뮬레이션 건너뛰기 모드 (RPC 노드 호환성)${NC}"
forge script script/TestBatchMint.s.sol:TestBatchMint \
    --rpc-url $RPC_URL \
    --broadcast \
    --private-key $PRIVATE_KEY \
    --skip-simulation

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 민팅 완료!${NC}"
else
    echo -e "${RED}❌ 민팅 실패${NC}"
    exit 1
fi
