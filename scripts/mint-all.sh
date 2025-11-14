#!/bin/bash

# ==============================================
# CelebusNFT 자동 민팅 스크립트
# ==============================================
# 10,000개 NFT를 500개씩 20회 배치로 민팅
#
# 사용법:
#   chmod +x scripts/mint-all.sh
#   ./scripts/mint-all.sh
#
# 재시작:
#   START_BATCH=5 ./scripts/mint-all.sh
# ==============================================

set -e  # 에러 발생 시 중단

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 환경변수 검증
check_env() {
    echo -e "${BLUE}=== 환경변수 확인 ===${NC}"

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

    if [ -z "$RPC_URL" ]; then
        echo -e "${RED}❌ RPC_URL이 설정되지 않았습니다${NC}"
        echo "export RPC_URL=https://opbnb-testnet-rpc.bnbchain.org"
        exit 1
    fi

    if [ -z "$PRIVATE_KEY" ]; then
        echo -e "${RED}❌ PRIVATE_KEY가 설정되지 않았습니다${NC}"
        echo "export PRIVATE_KEY=0xYourPrivateKey"
        exit 1
    fi

    echo -e "${GREEN}✅ NFT Address: $NFT_ADDRESS${NC}"
    echo -e "${GREEN}✅ Recipient: $RECIPIENT${NC}"
    echo -e "${GREEN}✅ RPC URL: $RPC_URL${NC}"
    echo -e "${GREEN}✅ Private Key: ${PRIVATE_KEY:0:10}...${NC}"
    echo ""
}

# 배치 설정
BATCH_SIZE=500
TOTAL_BATCHES=20
START_BATCH=${START_BATCH:-1}  # 기본값 1, 환경변수로 변경 가능

# 배치 민팅 함수
mint_batch() {
    local batch_num=$1
    local start_token=$(( (batch_num - 1) * BATCH_SIZE + 1 ))
    local end_token=$(( start_token + BATCH_SIZE - 1 ))

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📦 Batch $batch_num/$TOTAL_BATCHES${NC}"
    echo -e "${BLUE}   Token IDs: $start_token - $end_token${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Cast 명령어 실행 (출력 숨기기)
    OUTPUT=$(cast send $NFT_ADDRESS \
        "batchMint(address,uint256,uint256)" \
        $RECIPIENT $start_token $BATCH_SIZE \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY \
        --legacy 2>&1)

    if [ $? -eq 0 ]; then
        # 트랜잭션 해시만 추출
        TX_HASH=$(echo "$OUTPUT" | grep -o "transactionHash.*0x[a-fA-F0-9]\{64\}" | grep -o "0x[a-fA-F0-9]\{64\}" | head -1)

        echo -e "${GREEN}✅ 성공!${NC}"
        if [ -n "$TX_HASH" ]; then
            echo -e "${GREEN}   TX: $TX_HASH${NC}"
            echo -e "${GREEN}   확인: https://testnet.opbnbscan.com/tx/$TX_HASH${NC}"
        fi
        echo -e "${GREEN}   Minted: $BATCH_SIZE NFTs${NC}"
        echo -e "${GREEN}   Total: $(( batch_num * BATCH_SIZE )) / 10,000 ($(( batch_num * 100 / TOTAL_BATCHES ))%)${NC}"
        echo ""

        # 마지막 성공 배치 기록
        echo $batch_num > /tmp/last_successful_batch.txt

        return 0
    else
        echo -e "${RED}❌ 실패!${NC}"
        echo -e "${YELLOW}재시작 방법:${NC}"
        echo -e "${YELLOW}START_BATCH=$batch_num ./scripts/mint-all.sh${NC}"
        return 1
    fi
}

# 메인 실행
main() {
    clear
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════╗"
    echo "║   CelebusNFT 자동 민팅 스크립트        ║"
    echo "║   10,000개 NFT (500개씩 20회)         ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""

    check_env

    echo -e "${BLUE}=== 민팅 시작 ===${NC}"
    echo -e "${YELLOW}Batch Size: $BATCH_SIZE${NC}"
    echo -e "${YELLOW}Total Batches: $TOTAL_BATCHES${NC}"
    echo -e "${YELLOW}Starting from Batch: $START_BATCH${NC}"
    echo ""

    # 배치 민팅 반복
    for i in $(seq $START_BATCH $TOTAL_BATCHES); do
        if ! mint_batch $i; then
            echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${RED}민팅 중단됨 (Batch $i)${NC}"
            echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            exit 1
        fi

        # 마지막 배치가 아니면 잠시 대기 (RPC 부하 방지)
        if [ $i -lt $TOTAL_BATCHES ]; then
            sleep 2
        fi
    done

    # 완료 메시지
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════╗"
    echo "║        🎉 민팅 완료! 🎉                ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${GREEN}✅ 총 민팅: 10,000 NFTs${NC}"
    echo -e "${GREEN}✅ Recipient: $RECIPIENT${NC}"
    echo ""
    echo -e "${BLUE}🔗 opBNBScan에서 확인:${NC}"
    echo -e "${BLUE}   https://testnet.opbnbscan.com/address/$NFT_ADDRESS${NC}"
    echo -e "${BLUE}   https://testnet.opbnbscan.com/address/$RECIPIENT${NC}"
    echo ""

    # 잔액 확인
    echo -e "${YELLOW}NFT 잔액 확인 중...${NC}"
    BALANCE=$(cast call $NFT_ADDRESS "balanceOf(address)(uint256)" $RECIPIENT --rpc-url $RPC_URL)
    echo -e "${GREEN}✅ $RECIPIENT 소유 NFT: $BALANCE개${NC}"
}

# 스크립트 실행
main
