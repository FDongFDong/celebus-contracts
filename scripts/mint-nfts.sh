#!/bin/bash

# NFT 반복 민팅 스크립트
# 사용법: ./scripts/mint-nfts.sh <NFT_ADDRESS> <RECIPIENT> <MINT_COUNT> <RPC_URL> <PRIVATE_KEY>

# 인자 체크
if [ $# -lt 5 ]; then
  echo "❌ 사용법: ./scripts/mint-nfts.sh <NFT_ADDRESS> <RECIPIENT> <MINT_COUNT> <RPC_URL> <PRIVATE_KEY>"
  echo ""
  echo "예시:"
  echo "./scripts/mint-nfts.sh \\"
  echo "  0xYourNFTAddress \\"
  echo "  0x240eCdd1C5a7C30149D43987ce5A3Eb4e9E97897 \\"
  echo "  10 \\"
  echo "  https://opbnb-testnet.infura.io/v3/ff3d0a25dafc4bfda7cb700771d89273 \\"
  echo "  0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef"
  exit 1
fi

# 파라미터 설정
NFT_ADDRESS=$1
RECIPIENT=$2
MINT_COUNT=$3
RPC_URL=$4
PRIVATE_KEY=$5

# 확인 메시지
echo "========================================"
echo "🎨 NFT 반복 민팅 시작"
echo "========================================"
echo "컨트랙트 주소: $NFT_ADDRESS"
echo "받는 사람: $RECIPIENT"
echo "민팅 횟수: $MINT_COUNT"
echo "RPC URL: $RPC_URL"
echo "========================================"
echo ""

# 성공/실패 카운터
SUCCESS_COUNT=0
FAIL_COUNT=0

# 반복 민팅
for i in $(seq 1 $MINT_COUNT); do
  echo "[$i/$MINT_COUNT] 민팅 중..."

  TX_HASH=$(cast send $NFT_ADDRESS \
    "safeMint(address)" \
    $RECIPIENT \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --json 2>&1 | jq -r '.transactionHash // empty')

  if [ -n "$TX_HASH" ]; then
    echo "✅ 성공! TX: $TX_HASH"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "❌ 실패!"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi

  # 다음 민팅 전 대기 (RPC rate limit 방지)
  if [ $i -lt $MINT_COUNT ]; then
    echo "⏳ 1초 대기..."
    sleep 1
  fi

  echo ""
done

# 결과 요약
echo "========================================"
echo "📊 민팅 완료"
echo "========================================"
echo "✅ 성공: $SUCCESS_COUNT"
echo "❌ 실패: $FAIL_COUNT"
echo "📝 총 시도: $MINT_COUNT"
echo "========================================"
