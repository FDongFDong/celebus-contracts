#!/bin/bash

# NFT 다중 주소 민팅 스크립트
# 사용법: ./scripts/mint-nfts-multi.sh <NFT_ADDRESS> <RECIPIENTS_FILE> <RPC_URL> <PRIVATE_KEY>

# 인자 체크
if [ $# -lt 4 ]; then
  echo "❌ 사용법: ./scripts/mint-nfts-multi.sh <NFT_ADDRESS> <RECIPIENTS_FILE> <RPC_URL> <PRIVATE_KEY>"
  echo ""
  echo "RECIPIENTS_FILE 형식:"
  echo "  recipients.txt 파일에 한 줄에 하나씩 주소 입력"
  echo "  0x240eCdd1C5a7C30149D43987ce5A3Eb4e9E97897"
  echo "  0xAnotherAddress..."
  echo ""
  echo "예시:"
  echo "./scripts/mint-nfts-multi.sh \\"
  echo "  0xYourNFTAddress \\"
  echo "  recipients.txt \\"
  echo "  https://opbnb-testnet.infura.io/v3/ff3d0a25dafc4bfda7cb700771d89273 \\"
  echo "  0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef"
  exit 1
fi

# 파라미터 설정
NFT_ADDRESS=$1
RECIPIENTS_FILE=$2
RPC_URL=$3
PRIVATE_KEY=$4

# 파일 존재 확인
if [ ! -f "$RECIPIENTS_FILE" ]; then
  echo "❌ 파일을 찾을 수 없습니다: $RECIPIENTS_FILE"
  exit 1
fi

# 주소 개수 확인
TOTAL_COUNT=$(wc -l < "$RECIPIENTS_FILE" | tr -d ' ')

# 확인 메시지
echo "========================================"
echo "🎨 NFT 다중 주소 민팅 시작"
echo "========================================"
echo "컨트랙트 주소: $NFT_ADDRESS"
echo "주소 파일: $RECIPIENTS_FILE"
echo "민팅 대상: $TOTAL_COUNT 명"
echo "RPC URL: $RPC_URL"
echo "========================================"
echo ""

# 성공/실패 카운터
SUCCESS_COUNT=0
FAIL_COUNT=0
CURRENT=0

# 파일에서 주소를 읽어 반복 민팅
while IFS= read -r RECIPIENT; do
  # 빈 줄이나 공백 제거
  RECIPIENT=$(echo "$RECIPIENT" | tr -d '[:space:]')

  # 빈 줄 스킵
  if [ -z "$RECIPIENT" ]; then
    continue
  fi

  CURRENT=$((CURRENT + 1))
  echo "[$CURRENT/$TOTAL_COUNT] $RECIPIENT 에게 민팅 중..."

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
  if [ $CURRENT -lt $TOTAL_COUNT ]; then
    echo "⏳ 1초 대기..."
    sleep 1
  fi

  echo ""
done < "$RECIPIENTS_FILE"

# 결과 요약
echo "========================================"
echo "📊 민팅 완료"
echo "========================================"
echo "✅ 성공: $SUCCESS_COUNT"
echo "❌ 실패: $FAIL_COUNT"
echo "📝 총 시도: $TOTAL_COUNT"
echo "========================================"
