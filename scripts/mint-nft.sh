#!/bin/bash

# NFT 배치 민팅 스트레스 테스트 스크립트 (Cast 기반)
#
# 사용법:
# ./scripts/mint-nft.sh \
#   --private-key 0x... \
#   --recipient 0x... \
#   --rpc-url https://opbnb-testnet-rpc.bnbchain.org \
#   --batch-size 200 \
#   --repeat 5 \
#   --nft-address 0x...
#
# 또는 환경변수 사용:
# export PRIVATE_KEY=0x...
# export RECIPIENT=0x...
# export RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
# export BATCH_SIZE=200
# export REPEAT=5
# export NFT_ADDRESS=0x...
# ./scripts/mint-nft.sh

set -e

# 기본값 설정
PRIVATE_KEY=""
RECIPIENT=""
RPC_URL=""
BATCH_SIZE=100
REPEAT=1
NFT_ADDRESS=""

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
    --batch-size)
      BATCH_SIZE="$2"
      shift 2
      ;;
    --repeat)
      REPEAT="$2"
      shift 2
      ;;
    --nft-address)
      NFT_ADDRESS="$2"
      shift 2
      ;;
    *)
      echo "Unknown parameter: $1"
      exit 1
      ;;
  esac
done

# 환경변수 fallback
PRIVATE_KEY=${PRIVATE_KEY:-$PRIVATE_KEY}
RECIPIENT=${RECIPIENT:-$RECIPIENT}
RPC_URL=${RPC_URL:-$RPC_URL}
NFT_ADDRESS=${NFT_ADDRESS:-$NFT_ADDRESS}

# 필수 파라미터 검증
if [ -z "$PRIVATE_KEY" ]; then
  echo "Error: --private-key or PRIVATE_KEY env variable is required"
  exit 1
fi

if [ -z "$RECIPIENT" ]; then
  echo "Error: --recipient or RECIPIENT env variable is required"
  exit 1
fi

if [ -z "$RPC_URL" ]; then
  echo "Error: --rpc-url or RPC_URL env variable is required"
  exit 1
fi

if [ -z "$NFT_ADDRESS" ]; then
  echo "Error: --nft-address or NFT_ADDRESS env variable is required"
  exit 1
fi

# 범위 검증
if [ "$BATCH_SIZE" -lt 1 ]; then
  echo "Error: Batch size must be at least 1"
  exit 1
fi

if [ "$REPEAT" -lt 1 ] || [ "$REPEAT" -gt 100 ]; then
  echo "Error: Repeat count must be between 1 and 100"
  exit 1
fi

# 현재 총 발행량 확인 (다음 토큰 ID 결정)
echo "Checking current total supply..."
CURRENT_BALANCE=$(cast call $NFT_ADDRESS "balanceOf(address)" $RECIPIENT --rpc-url $RPC_URL)
NEXT_TOKEN_ID=$((16#${CURRENT_BALANCE#0x} + 1))

echo "=== Stress Batch Mint Configuration ==="
echo "NFT Address: $NFT_ADDRESS"
echo "Recipient: $RECIPIENT"
echo "RPC URL: $RPC_URL"
echo "Current Balance: $((NEXT_TOKEN_ID - 1))"
echo "Next Token ID: $NEXT_TOKEN_ID"
echo "Batch Size: $BATCH_SIZE"
echo "Repeat Count: $REPEAT"
echo "Total NFTs to Mint: $((BATCH_SIZE * REPEAT))"
echo "Final Token ID: $((NEXT_TOKEN_ID + BATCH_SIZE * REPEAT - 1))"
echo "========================================"
echo ""

# 배치 민팅 실행
SUCCESS_COUNT=0
FAIL_COUNT=0

for i in $(seq 1 $REPEAT); do
  EXPECTED_START_ID=$(( NEXT_TOKEN_ID + (i - 1) * BATCH_SIZE ))
  EXPECTED_END_ID=$(( EXPECTED_START_ID + BATCH_SIZE - 1 ))

  echo "Batch $i: Minting $BATCH_SIZE tokens (expected IDs: $EXPECTED_START_ID - $EXPECTED_END_ID)..."

  if cast send $NFT_ADDRESS \
    "batchMint(address,uint256)" \
    $RECIPIENT $BATCH_SIZE \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --json > /tmp/mint-result-$i.json 2>&1; then
    
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    TX_HASH=$(jq -r '.transactionHash // .hash // "unknown"' /tmp/mint-result-$i.json)
    GAS_USED=$(jq -r '.gasUsed // "unknown"' /tmp/mint-result-$i.json)
    
    echo "  ✅ SUCCESS"
    echo "  Transaction: $TX_HASH"
    echo "  Gas Used: $GAS_USED"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo "  ❌ FAILED"
    cat /tmp/mint-result-$i.json
  fi
  
  echo ""
  
  # Rate limiting 방지 (마지막 배치 제외)
  if [ $i -lt $REPEAT ]; then
    sleep 2
  fi
done

# 임시 파일 정리
rm -f /tmp/mint-result-*.json

# 최종 결과
echo "=== Stress Test Results ==="
echo "Total Batches: $REPEAT"
echo "Successful Batches: $SUCCESS_COUNT"
echo "Failed Batches: $FAIL_COUNT"
echo "==========================="

if [ $FAIL_COUNT -gt 0 ]; then
  exit 1
fi
