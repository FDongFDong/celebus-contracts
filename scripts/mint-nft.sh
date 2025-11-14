#!/bin/bash

# ==============================================
# CelebusNFT 민팅 스크립트
# ==============================================
# NFT를 배포하거나 기존 NFT 주소를 사용하여 민팅 실행
#
# 사용법:
#   chmod +x scripts/mint-nft.sh
#
#   # 플래그 방식 (한 줄로 모든 파라미터 지정)
#   ./scripts/mint-nft.sh \
#     --private-key 0xYourPrivateKey \
#     --recipient 0xYourAddress \
#     --rpc-url https://opbnb-testnet-rpc.bnbchain.org \
#     --batch-size 200 --repeat 5
#
#   # 기존 NFT 주소 사용
#   ./scripts/mint-nft.sh \
#     --private-key 0x... \
#     --recipient 0x... \
#     --rpc-url https://opbnb-testnet-rpc.bnbchain.org \
#     --nft-address 0xABC... \
#     --batch-size 500 --repeat 20
#
#   # 환경변수 방식 (여전히 가능)
#   export PRIVATE_KEY=0x...
#   export RECIPIENT=0x...
#   export RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
#   ./scripts/mint-nft.sh --batch-size 200 --repeat 5
#
# 우선순위: 플래그 > 환경변수 > 기본값/에러
# ==============================================

set -e  # 에러 발생 시 중단

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# 기본값 (플래그 > 환경변수 > 기본값/에러)
PRIVATE_KEY="${PRIVATE_KEY:-}"
RECIPIENT="${RECIPIENT:-}"
RPC_URL="${RPC_URL:-}"
MODE="${MODE:-batch}"
MINT_COUNT="${MINT_COUNT:-10}"
BATCH_SIZE="${BATCH_SIZE:-100}"
REPEAT_COUNT="${REPEAT_COUNT:-1}"
START_TOKEN_ID="${START_TOKEN_ID:-1}"
DEPLOY_ONLY="${DEPLOY_ONLY:-false}"
NFT_ADDRESS="${NFT_ADDRESS:-}"

# 전역 변수
TOTAL_GAS_USED=0
TOTAL_COST_BNB="0"
TOTAL_RLP_SIZE=0
MAX_RLP_SIZE=0
TOTAL_TX_COUNT=0
LAST_GAS_USED=0
LAST_RLP_KB="0"

# 파라미터 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        --private-key)
            PRIVATE_KEY="$2"
            shift 2
            ;;
        --recipient)
            RECIPIENT="$2"
            shift 2
            ;;
        --rpc-url)
            RPC_URL="$2"
            shift 2
            ;;
        --mode)
            MODE="$2"
            shift 2
            ;;
        --count)
            MINT_COUNT="$2"
            shift 2
            ;;
        --batch-size)
            BATCH_SIZE="$2"
            shift 2
            ;;
        --repeat)
            REPEAT_COUNT="$2"
            shift 2
            ;;
        --start-id)
            START_TOKEN_ID="$2"
            shift 2
            ;;
        --nft-address)
            NFT_ADDRESS="$2"
            shift 2
            ;;
        --deploy-only)
            DEPLOY_ONLY=true
            shift
            ;;
        --help)
            echo "사용법: $0 [OPTIONS]"
            echo ""
            echo "필수 옵션 (플래그 또는 환경변수):"
            echo "  --private-key 0x...    개인키"
            echo "  --recipient 0x...      수령자 주소"
            echo "  --rpc-url URL          RPC URL"
            echo ""
            echo "민팅 옵션:"
            echo "  --mode single|batch    민팅 모드 (기본: batch)"
            echo "  --count N              개별 민팅 횟수 (기본: 10)"
            echo "  --batch-size K         배치당 민팅 개수 (기본: 100)"
            echo "  --repeat N             배치 반복 횟수 (기본: 1)"
            echo "  --start-id N           시작 토큰 ID (기본: 1)"
            echo "  --nft-address 0x...    기존 NFT 주소 (없으면 새로 배포)"
            echo "  --deploy-only          배포만 실행"
            echo "  --help                 도움말 표시"
            echo ""
            echo "환경변수 (플래그 우선):"
            echo "  PRIVATE_KEY            개인키"
            echo "  RECIPIENT              수령자 주소"
            echo "  RPC_URL                RPC URL"
            echo "  MODE                   민팅 모드"
            echo "  BATCH_SIZE             배치당 민팅 개수"
            echo "  REPEAT_COUNT           배치 반복 횟수"
            echo "  MINT_COUNT             개별 민팅 횟수"
            echo "  START_TOKEN_ID         시작 토큰 ID"
            echo "  NFT_ADDRESS            기존 NFT 주소"
            echo ""
            echo "우선순위: 플래그 > 환경변수 > 기본값"
            echo ""
            echo "예시 (플래그 방식 - 한 줄로 모든 파라미터 지정):"
            echo "  $0 \\"
            echo "    --private-key 0xYourPrivateKey \\"
            echo "    --recipient 0xYourAddress \\"
            echo "    --rpc-url https://opbnb-testnet-rpc.bnbchain.org \\"
            echo "    --batch-size 200 --repeat 5"
            echo ""
            echo "  # 기존 NFT 주소 사용"
            echo "  $0 \\"
            echo "    --private-key 0x... \\"
            echo "    --recipient 0x... \\"
            echo "    --rpc-url https://opbnb-testnet-rpc.bnbchain.org \\"
            echo "    --nft-address 0xABC... \\"
            echo "    --batch-size 500 --repeat 20"
            echo ""
            echo "예시 (환경변수 방식):"
            echo "  export PRIVATE_KEY=0x..."
            echo "  export RECIPIENT=0x..."
            echo "  export RPC_URL=https://opbnb-testnet-rpc.bnbchain.org"
            echo "  $0 --batch-size 200 --repeat 5"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ 알 수 없는 옵션: $1${NC}"
            exit 1
            ;;
    esac
done

# 환경변수 검증
check_env() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   🔍 환경변수 확인                   ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

    if [ -z "$PRIVATE_KEY" ]; then
        echo -e "${RED}❌ PRIVATE_KEY가 설정되지 않았습니다${NC}"
        echo "export PRIVATE_KEY=0xYourPrivateKey"
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

    echo -e "${GREEN}✅ 수령자: $RECIPIENT${NC}"
    echo -e "${GREEN}✅ RPC URL: $RPC_URL${NC}"
    echo -e "${GREEN}✅ 개인키: ${PRIVATE_KEY:0:10}...${NC}"
    echo ""
}

# 가스비 계산 함수
calculate_cost() {
    local tx_hash=$1

    # 트랜잭션 영수증 조회
    local receipt=$(cast receipt $tx_hash --rpc-url $RPC_URL --json 2>/dev/null)

    if [ -z "$receipt" ]; then
        return 1
    fi

    # 가스 사용량 및 가격 추출
    local gas_used=$(echo $receipt | jq -r '.gasUsed' | xargs printf "%d" 2>/dev/null)
    local gas_price=$(echo $receipt | jq -r '.effectiveGasPrice' | xargs printf "%d" 2>/dev/null)

    if [ -z "$gas_used" ] || [ -z "$gas_price" ] || [ "$gas_used" == "0" ]; then
        return 1
    fi

    # BNB 환산 (wei → BNB)
    local cost_wei=$((gas_used * gas_price))
    local cost_bnb=$(echo "scale=18; $cost_wei / 1000000000000000000" | bc)

    # Gwei 변환
    local gas_price_gwei=$(echo "scale=2; $gas_price / 1000000000" | bc)

    # RLP 크기 계산 (전체 RLP 인코딩 트랜잭션)
    # 1차 시도: RPC로 raw transaction 조회 (전체 RLP - 헤더 + calldata + 서명)
    local raw_tx=$(cast rpc --rpc-url $RPC_URL eth_getRawTransactionByHash $tx_hash 2>/dev/null | tr -d '"')
    local rlp_bytes=0
    local rlp_kb="0"
    local is_full_rlp=false

    if [ -n "$raw_tx" ] && [ "$raw_tx" != "null" ] && [ "$raw_tx" != "" ]; then
        # Raw transaction 성공: 전체 RLP 크기 측정
        local raw_length=${#raw_tx}
        rlp_bytes=$(( (raw_length - 2) / 2 ))
        rlp_kb=$(echo "scale=3; $rlp_bytes / 1024" | bc)
        is_full_rlp=true
    else
        # 2차 시도: calldata만 측정 (fallback)
        local tx_data=$(cast tx $tx_hash --rpc-url $RPC_URL --json 2>/dev/null)
        local input_data=$(echo $tx_data | jq -r '.input' 2>/dev/null)

        if [ -n "$input_data" ] && [ "$input_data" != "null" ] && [ "$input_data" != "0x" ]; then
            # 0x 접두사 제거 후 16진수 문자열 길이 계산
            # 길이를 2로 나누면 바이트 크기 (16진수 2자리 = 1바이트)
            local input_length=${#input_data}
            rlp_bytes=$(( (input_length - 2) / 2 ))
            rlp_kb=$(echo "scale=3; $rlp_bytes / 1024" | bc)

            # 경고: calldata만 측정 (실제 RLP보다 작음)
            if [ $rlp_bytes -gt 10000 ]; then
                echo "  ${YELLOW}⚠️  Warning: Calldata만 측정 (실제 RLP 크기는 ~2-5% 더 큼)${NC}" >&2
            fi
        fi
    fi

    # 전역 변수 업데이트
    TOTAL_GAS_USED=$((TOTAL_GAS_USED + gas_used))
    TOTAL_COST_BNB=$(echo "scale=18; $TOTAL_COST_BNB + $cost_bnb" | bc)
    TOTAL_RLP_SIZE=$((TOTAL_RLP_SIZE + rlp_bytes))
    TOTAL_TX_COUNT=$((TOTAL_TX_COUNT + 1))

    # 최대 RLP 크기 추적
    if [ $rlp_bytes -gt $MAX_RLP_SIZE ]; then
        MAX_RLP_SIZE=$rlp_bytes
    fi

    # 마지막 계산 결과 저장 (전역 변수)
    LAST_GAS_USED=$gas_used
    LAST_RLP_KB="$rlp_kb"

    # 결과 출력 (JSON 형식)
    echo "{\"gas_used\":$gas_used,\"gas_price_gwei\":\"$gas_price_gwei\",\"cost_bnb\":\"$cost_bnb\",\"rlp_bytes\":$rlp_bytes,\"rlp_kb\":\"$rlp_kb\"}"
}

# 비용 요약 출력
print_cost_summary() {
    local nft_count=$1
    local onchain_duration=$2
    local block_count=$3
    local first_block=$4
    local last_block=$5

    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   ⛽ 가스 통계                        ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo -e "${GREEN}총 사용 가스: $(printf "%'d" $TOTAL_GAS_USED)${NC}"

    if [ $nft_count -gt 0 ]; then
        local avg_gas=$((TOTAL_GAS_USED / nft_count))
        echo -e "${GREEN}평균 가스/NFT: $(printf "%'d" $avg_gas)${NC}"
    fi

    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   💰 비용 분석                        ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo -e "${YELLOW}총 비용: ${TOTAL_COST_BNB} BNB${NC}"

    if [ $nft_count -gt 0 ]; then
        local cost_per_nft=$(echo "scale=18; $TOTAL_COST_BNB / $nft_count" | bc)
        echo -e "${YELLOW}NFT당 평균: ${cost_per_nft} BNB${NC}"
    fi

    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   📦 RLP 크기 통계                    ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"

    local total_rlp_kb=$(echo "scale=3; $TOTAL_RLP_SIZE / 1024" | bc)
    local max_rlp_kb=$(echo "scale=3; $MAX_RLP_SIZE / 1024" | bc)

    echo -e "${YELLOW}총 RLP 크기: ${total_rlp_kb} KB ($(printf "%'d" $TOTAL_RLP_SIZE) bytes)${NC}"
    echo -e "${YELLOW}최대 RLP 크기: ${max_rlp_kb} KB ($(printf "%'d" $MAX_RLP_SIZE) bytes)${NC}"

    # 128KB 제한 경고
    if [ $MAX_RLP_SIZE -gt 131072 ]; then
        echo -e "${RED}⚠️  경고: 최대 RLP 크기가 128KB 초과! (제한: 131,072 bytes)${NC}"
    elif [ $MAX_RLP_SIZE -gt 122880 ]; then
        echo -e "${YELLOW}⚠️  주의: 최대 RLP 크기가 120KB 초과 (제한에 근접)${NC}"
    else
        local limit_percent=$(echo "scale=1; $MAX_RLP_SIZE * 100 / 131072" | bc)
        echo -e "${GREEN}✅ RLP 크기 정상 (128KB 제한의 ${limit_percent}%)${NC}"
    fi

    if [ $TOTAL_TX_COUNT -gt 0 ]; then
        local avg_rlp=$((TOTAL_RLP_SIZE / TOTAL_TX_COUNT))
        local avg_rlp_kb=$(echo "scale=3; $avg_rlp / 1024" | bc)
        echo -e "${GREEN}평균 RLP/트랜잭션: ${avg_rlp_kb} KB${NC}"
    fi

    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   ⏱️  시간 통계                        ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"

    if [ $onchain_duration -ge 0 ] && [ $block_count -gt 0 ]; then
        echo -e "${YELLOW}블록 범위: #${first_block} ~ #${last_block}${NC}"
        echo -e "${GREEN}온체인 처리 시간: ${onchain_duration}초 (${block_count}개 블록)${NC}"

        if [ $block_count -gt 1 ]; then
            local avg_block_time_ms=$(echo "scale=0; $onchain_duration * 1000 / ($block_count - 1)" | bc)
            echo -e "${BLUE}평균 블록타임: ${avg_block_time_ms} ms${NC}"
        fi
    fi
}

# NFT 주소 검증 (기존 주소 사용 시)
validate_nft_address() {
    echo -e "${YELLOW}📍 기존 NFT 주소: $NFT_ADDRESS${NC}"
    echo -e "${YELLOW}⏳ NFT 컨트랙트 검증 중...${NC}"

    # balanceOf 호출로 컨트랙트 검증
    if ! cast call $NFT_ADDRESS "balanceOf(address)(uint256)" $RECIPIENT --rpc-url $RPC_URL &>/dev/null; then
        echo -e "${RED}❌ NFT 컨트랙트 검증 실패${NC}"
        echo -e "${RED}   주소가 올바르지 않거나 CelebusNFT 컨트랙트가 아닙니다${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ NFT 컨트랙트 검증 완료${NC}"
    echo -e "${GREEN}🔗 opBNBScan: https://testnet.opbnbscan.com/address/$NFT_ADDRESS${NC}"
    echo ""
}

# NFT 배포
deploy_nft() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════╗"
    echo "║       🚀 NFT 배포 시작               ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"

    # 배포 실행
    forge script script/DeployNFT.s.sol:DeployNFT \
        --rpc-url $RPC_URL \
        --broadcast \
        --private-key $PRIVATE_KEY \
        -vvv

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 배포 실패${NC}"
        exit 1
    fi

    # 배포 주소 추출 (broadcast JSON 파싱)
    CHAIN_ID=$(cast chain-id --rpc-url $RPC_URL)
    BROADCAST_FILE="broadcast/DeployNFT.s.sol/${CHAIN_ID}/run-latest.json"

    if [ ! -f "$BROADCAST_FILE" ]; then
        echo -e "${RED}❌ 배포 기록을 찾을 수 없습니다: $BROADCAST_FILE${NC}"
        exit 1
    fi

    # jq로 CelebusNFT 컨트랙트 주소 추출
    NFT_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "CelebusNFT") | .contractAddress' "$BROADCAST_FILE")

    if [ -z "$NFT_ADDRESS" ] || [ "$NFT_ADDRESS" == "null" ]; then
        echo -e "${RED}❌ 배포 주소를 추출할 수 없습니다${NC}"
        exit 1
    fi

    export NFT_ADDRESS

    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════╗"
    echo "║       ✅ 배포 완료                   ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${GREEN}📍 NFT 주소: $NFT_ADDRESS${NC}"
    echo -e "${GREEN}🔗 opBNBScan: https://testnet.opbnbscan.com/address/$NFT_ADDRESS${NC}"
    echo ""

    # RPC 노드 storage 동기화 대기 (polling 방식)
    echo -e "${YELLOW}⏳ RPC 노드 동기화 대기 중...${NC}"
    echo -e "${YELLOW}   (NFT storage 접근이 성공할 때까지 대기)${NC}"

    while ! cast call $NFT_ADDRESS "balanceOf(address)(uint256)" $RECIPIENT --rpc-url $RPC_URL &>/dev/null; do
        echo "   📡 NFT storage 동기화 확인 중..."
        sleep 5
    done

    echo -e "${GREEN}✅ 동기화 완료!${NC}"
    echo ""
}

# 개별 민팅 테스트
test_single_mint() {
    echo -e "${MAGENTA}"
    echo "╔════════════════════════════════════════╗"
    echo "║   📊 개별 민팅 테스트 (1개씩)        ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${YELLOW}민팅 횟수: $MINT_COUNT${NC}"
    echo -e "${YELLOW}시작 토큰 ID: $START_TOKEN_ID${NC}"
    echo ""

    TOTAL_GAS_USED=0
    TOTAL_COST_BNB="0"
    TOTAL_RLP_SIZE=0
    MAX_RLP_SIZE=0
    TOTAL_TX_COUNT=0

    export MINT_COUNT
    export START_TOKEN_ID

    # Forge 스크립트 실행 (실시간 출력)
    echo -e "${BLUE}민팅 스크립트 실행 중...${NC}"
    forge script script/TestSingleMint.s.sol:TestSingleMint \
        --rpc-url $RPC_URL \
        --broadcast \
        --private-key $PRIVATE_KEY

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 개별 민팅 테스트 실패${NC}"
        exit 1
    fi

    echo ""
    echo -e "${YELLOW}가스비 계산 중...${NC}"

    # broadcast 최신 JSON에서 트랜잭션 해시 추출
    CHAIN_ID=$(cast chain-id --rpc-url $RPC_URL)
    BROADCAST_FILE="broadcast/TestSingleMint.s.sol/${CHAIN_ID}/run-latest.json"

    FIRST_TIMESTAMP=0
    LAST_TIMESTAMP=0
    FIRST_BLOCK=0
    LAST_BLOCK=0

    if [ -f "$BROADCAST_FILE" ]; then
        # JSON에서 모든 트랜잭션 해시 추출
        TX_HASHES=$(jq -r '.transactions[].hash' "$BROADCAST_FILE" 2>/dev/null)

        # 각 트랜잭션의 가스비 계산 및 타임스탬프 추적
        TX_COUNT=0
        while IFS= read -r tx_hash; do
            if [ -n "$tx_hash" ] && [ "$tx_hash" != "null" ]; then
                TX_COUNT=$((TX_COUNT + 1))
                echo -e "${CYAN}  [$TX_COUNT/$MINT_COUNT] 트랜잭션 분석: ${tx_hash:0:10}...${NC}"

                # 영수증 조회
                RECEIPT=$(cast receipt "$tx_hash" --rpc-url $RPC_URL --json 2>/dev/null)

                if [ -n "$RECEIPT" ]; then
                    # 가스비 및 RLP 크기 계산 (서브쉘 없이 직접 호출)
                    calculate_cost "$tx_hash" >/dev/null

                    # 전역 변수에서 값 사용
                    if [ $LAST_GAS_USED -gt 0 ]; then
                        echo -e "${GREEN}      가스: $(printf "%'d" $LAST_GAS_USED) | RLP: ${LAST_RLP_KB} KB${NC}"
                    fi

                    # 블록 번호 및 타임스탬프 추출
                    BLOCK_NUM=$(echo "$RECEIPT" | jq -r '.blockNumber' | xargs printf "%d" 2>/dev/null)

                    if [ -n "$BLOCK_NUM" ] && [ "$BLOCK_NUM" != "0" ]; then
                        # 블록 타임스탬프 직접 추출 (--field 옵션)
                        BLOCK_TIMESTAMP=$(cast block "$BLOCK_NUM" --field timestamp --rpc-url $RPC_URL 2>/dev/null)

                        if [ -n "$BLOCK_TIMESTAMP" ] && [ "$BLOCK_TIMESTAMP" != "0" ]; then
                            if [ $FIRST_TIMESTAMP -eq 0 ]; then
                                FIRST_TIMESTAMP=$BLOCK_TIMESTAMP
                                FIRST_BLOCK=$BLOCK_NUM
                            fi
                            LAST_TIMESTAMP=$BLOCK_TIMESTAMP
                            LAST_BLOCK=$BLOCK_NUM
                        fi
                    fi
                fi

                sleep 0.3  # RPC 부하 방지
            fi
        done <<< "$TX_HASHES"
    fi

    # 온체인 처리 시간 계산 (타임스탬프 기준)
    ONCHAIN_DURATION=0
    BLOCK_COUNT=0
    if [ $FIRST_TIMESTAMP -gt 0 ] && [ $LAST_TIMESTAMP -ge $FIRST_TIMESTAMP ]; then
        ONCHAIN_DURATION=$((LAST_TIMESTAMP - FIRST_TIMESTAMP))
        BLOCK_COUNT=$((LAST_BLOCK - FIRST_BLOCK + 1))
    fi

    echo -e "${GREEN}✅ 개별 민팅 테스트 완료${NC}"
    print_cost_summary $MINT_COUNT $ONCHAIN_DURATION $BLOCK_COUNT $FIRST_BLOCK $LAST_BLOCK
}

# 배치 민팅 테스트
test_batch_mint() {
    echo -e "${MAGENTA}"
    echo "╔════════════════════════════════════════╗"
    echo "║   📦 배치 민팅 테스트                ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${YELLOW}배치 크기: $BATCH_SIZE${NC}"
    echo -e "${YELLOW}반복 횟수: $REPEAT_COUNT${NC}"
    echo -e "${YELLOW}총 민팅: $(($BATCH_SIZE * $REPEAT_COUNT))개${NC}"
    echo -e "${YELLOW}시작 토큰 ID: $START_TOKEN_ID${NC}"
    echo ""

    TOTAL_GAS_USED=0
    TOTAL_COST_BNB="0"
    TOTAL_RLP_SIZE=0
    MAX_RLP_SIZE=0
    TOTAL_TX_COUNT=0

    export BATCH_SIZE
    export REPEAT_COUNT
    export START_TOKEN_ID

    # Forge 스크립트 실행 (실시간 출력)
    echo -e "${BLUE}민팅 스크립트 실행 중...${NC}"
    echo -e "${YELLOW}⚡ 시뮬레이션 건너뛰기 모드 (RPC 노드 호환성)${NC}"
    forge script script/TestBatchMint.s.sol:TestBatchMint \
        --rpc-url $RPC_URL \
        --broadcast \
        --private-key $PRIVATE_KEY \
        --skip-simulation \
        --legacy

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 배치 민팅 테스트 실패${NC}"
        exit 1
    fi

    echo ""
    echo -e "${YELLOW}가스비 계산 중...${NC}"

    # broadcast 최신 JSON에서 트랜잭션 해시 추출
    CHAIN_ID=$(cast chain-id --rpc-url $RPC_URL)
    BROADCAST_FILE="broadcast/TestBatchMint.s.sol/${CHAIN_ID}/run-latest.json"

    FIRST_TIMESTAMP=0
    LAST_TIMESTAMP=0
    FIRST_BLOCK=0
    LAST_BLOCK=0

    if [ -f "$BROADCAST_FILE" ]; then
        # JSON에서 모든 트랜잭션 해시 추출
        TX_HASHES=$(jq -r '.transactions[].hash' "$BROADCAST_FILE" 2>/dev/null)

        # 각 트랜잭션의 가스비 계산 및 타임스탬프 추적
        TX_COUNT=0
        while IFS= read -r tx_hash; do
            if [ -n "$tx_hash" ] && [ "$tx_hash" != "null" ]; then
                TX_COUNT=$((TX_COUNT + 1))
                echo -e "${CYAN}  [$TX_COUNT/$REPEAT_COUNT] 트랜잭션 분석: ${tx_hash:0:10}...${NC}"

                # 영수증 조회
                RECEIPT=$(cast receipt "$tx_hash" --rpc-url $RPC_URL --json 2>/dev/null)

                if [ -n "$RECEIPT" ]; then
                    # 가스비 및 RLP 크기 계산 (서브쉘 없이 직접 호출)
                    calculate_cost "$tx_hash" >/dev/null

                    # 전역 변수에서 값 사용
                    if [ $LAST_GAS_USED -gt 0 ]; then
                        echo -e "${GREEN}      가스: $(printf "%'d" $LAST_GAS_USED) | RLP: ${LAST_RLP_KB} KB${NC}"
                    fi

                    # 블록 번호 및 타임스탬프 추출
                    BLOCK_NUM=$(echo "$RECEIPT" | jq -r '.blockNumber' | xargs printf "%d" 2>/dev/null)

                    if [ -n "$BLOCK_NUM" ] && [ "$BLOCK_NUM" != "0" ]; then
                        # 블록 타임스탬프 직접 추출 (--field 옵션)
                        BLOCK_TIMESTAMP=$(cast block "$BLOCK_NUM" --field timestamp --rpc-url $RPC_URL 2>/dev/null)

                        if [ -n "$BLOCK_TIMESTAMP" ] && [ "$BLOCK_TIMESTAMP" != "0" ]; then
                            if [ $FIRST_TIMESTAMP -eq 0 ]; then
                                FIRST_TIMESTAMP=$BLOCK_TIMESTAMP
                                FIRST_BLOCK=$BLOCK_NUM
                            fi
                            LAST_TIMESTAMP=$BLOCK_TIMESTAMP
                            LAST_BLOCK=$BLOCK_NUM
                        fi
                    fi
                fi

                sleep 0.3  # RPC 부하 방지
            fi
        done <<< "$TX_HASHES"
    fi

    # 온체인 처리 시간 계산 (타임스탬프 기준)
    ONCHAIN_DURATION=0
    BLOCK_COUNT=0
    if [ $FIRST_TIMESTAMP -gt 0 ] && [ $LAST_TIMESTAMP -ge $FIRST_TIMESTAMP ]; then
        ONCHAIN_DURATION=$((LAST_TIMESTAMP - FIRST_TIMESTAMP))
        BLOCK_COUNT=$((LAST_BLOCK - FIRST_BLOCK + 1))
    fi

    echo -e "${GREEN}✅ 배치 민팅 테스트 완료${NC}"
    local total_nfts=$(($BATCH_SIZE * $REPEAT_COUNT))
    print_cost_summary $total_nfts $ONCHAIN_DURATION $BLOCK_COUNT $FIRST_BLOCK $LAST_BLOCK
}

# 메인 실행
main() {
    clear
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════╗"
    echo "║    CelebusNFT 민팅 스크립트           ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""

    # 1. 환경변수 검증
    check_env

    # 2. NFT 배포 또는 기존 주소 검증
    if [ -z "$NFT_ADDRESS" ]; then
        # NFT 주소가 제공되지 않음 → 새로 배포
        deploy_nft
    else
        # NFT 주소가 제공됨 → 검증
        validate_nft_address
    fi

    # 3. 민팅 테스트 (deploy-only가 아닌 경우)
    if [ "$DEPLOY_ONLY" = false ]; then
        case $MODE in
            single)
                test_single_mint
                ;;
            batch)
                test_batch_mint
                ;;
            *)
                echo -e "${RED}❌ 잘못된 모드: $MODE (single 또는 batch만 가능)${NC}"
                exit 1
                ;;
        esac
    else
        echo -e "${YELLOW}📝 배포만 실행 (민팅 테스트 생략)${NC}"
        echo ""
    fi

    # 완료 메시지
    echo ""
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════╗"
    echo "║        🎉 완료! 🎉                   ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${GREEN}✅ NFT 주소: $NFT_ADDRESS${NC}"
    echo -e "${GREEN}✅ 수령자: $RECIPIENT${NC}"
    echo ""
    echo -e "${BLUE}🔗 opBNBScan:${NC}"
    echo -e "${BLUE}   https://testnet.opbnbscan.com/address/$NFT_ADDRESS${NC}"
    echo -e "${BLUE}   https://testnet.opbnbscan.com/address/$RECIPIENT${NC}"
    echo ""

    # 최종 잔액 확인 (with retry logic)
    if [ "$DEPLOY_ONLY" = false ]; then
        echo -e "${YELLOW}📊 NFT 잔액 확인 중...${NC}"

        # 재시도 설정
        MAX_RETRY=3
        RETRY_DELAY=3
        BALANCE=""

        for i in $(seq 1 $MAX_RETRY); do
            BALANCE=$(cast call $NFT_ADDRESS "balanceOf(address)(uint256)" $RECIPIENT --rpc-url $RPC_URL 2>/dev/null)
            if [ $? -eq 0 ] && [ -n "$BALANCE" ]; then
                break
            fi
            if [ $i -lt $MAX_RETRY ]; then
                echo -e "${YELLOW}⏳ RPC 동기화 대기 중... (재시도 $i/$MAX_RETRY)${NC}"
                sleep $RETRY_DELAY
            fi
        done

        if [ -n "$BALANCE" ]; then
            BALANCE_DEC=$(printf "%d" $BALANCE)
            echo -e "${GREEN}✅ $RECIPIENT 소유 NFT: ${BALANCE_DEC}개${NC}"
        else
            echo -e "${RED}❌ NFT 잔액 확인 실패 (RPC 동기화 문제)${NC}"
            echo -e "${YELLOW}💡 opBNBScan에서 수동 확인: https://testnet.opbnbscan.com/address/$RECIPIENT${NC}"
        fi
    fi
}

# 의존성 확인
if ! command -v forge &> /dev/null; then
    echo -e "${RED}❌ forge가 설치되지 않았습니다${NC}"
    echo "Foundry 설치: https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi

if ! command -v cast &> /dev/null; then
    echo -e "${RED}❌ cast가 설치되지 않았습니다${NC}"
    echo "Foundry 설치: https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq가 설치되지 않았습니다${NC}"
    echo "macOS: brew install jq"
    echo "Ubuntu: sudo apt-get install jq"
    exit 1
fi

if ! command -v bc &> /dev/null; then
    echo -e "${RED}❌ bc가 설치되지 않았습니다${NC}"
    echo "macOS: brew install bc"
    echo "Ubuntu: sudo apt-get install bc"
    exit 1
fi

# 스크립트 실행
main
