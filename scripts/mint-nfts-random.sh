#!/bin/bash

# NFT 랜덤 주소 민팅 스크립트
# 사용법: ./scripts/mint-nfts-random.sh <NFT_ADDRESS> <COUNT> <RPC_URL> <PRIVATE_KEY>

# 인자 체크
if [ $# -lt 4 ]; then
  echo "❌ 사용법: ./scripts/mint-nfts-random.sh <NFT_ADDRESS> <COUNT> <RPC_URL> <PRIVATE_KEY>"
  echo ""
  echo "예시:"
  echo "./scripts/mint-nfts-random.sh \\"
  echo "  0xYourNFTAddress \\"
  echo "  100 \\"
  echo "  https://opbnb-testnet.infura.io/v3/ff3d0a25dafc4bfda7cb700771d89273 \\"
  echo "  0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef"
  exit 1
fi

# 파라미터 설정
NFT_ADDRESS=$1
MINT_COUNT=$2
RPC_URL=$3
PRIVATE_KEY=$4

# 확인 메시지
echo "========================================"
echo "🎨 NFT 랜덤 주소 민팅 시작"
echo "========================================"
echo "컨트랙트 주소: $NFT_ADDRESS"
echo "민팅 횟수: $MINT_COUNT (각기 다른 랜덤 주소)"
echo "RPC URL: $RPC_URL"
echo "========================================"
echo ""

# 성공/실패 카운터
SUCCESS_COUNT=0
FAIL_COUNT=0

# 랜덤 주소 생성 및 민팅
for i in $(seq 1 $MINT_COUNT); do
  # cast wallet new로 랜덤 주소 생성
  RANDOM_ADDRESS=$(cast wallet new | grep "Address:" | awk '{print $2}')

  echo "[$i/$MINT_COUNT] 랜덤 주소 $RANDOM_ADDRESS 에게 민팅 중..."

  TX_HASH=$(cast send $NFT_ADDRESS \
    "safeMint(address)" \
    $RANDOM_ADDRESS \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --json 2>&1 | jq -r '.transactionHash // empty')

  if [ -n "$TX_HASH" ]; then
    echo "✅ 성공! TX: $TX_HASH"
    echo "$RANDOM_ADDRESS -> $TX_HASH" >> mint-random-log.txt
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
echo "📄 로그 파일: mint-random-log.txt"
echo "========================================"
