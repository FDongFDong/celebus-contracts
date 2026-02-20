#!/bin/bash

# 배포 헬퍼 스크립트
# 사용법: ./scripts/deploy.sh [CONTRACT] [OPTIONS]
# 예시: ./scripts/deploy.sh MainVoting --rpc-url https://... --private-key 0x...

set -e

CONTRACT=${1:-MainVoting}
shift || true

# 기본값 설정
RPC_URL=${RPC_URL:-https://opbnb-testnet-rpc.bnbchain.org}
PRIVATE_KEY=${PRIVATE_KEY}
VERBOSITY="-vvv"

# 도움말 출력
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  cat << EOF
배포 스크립트 사용법
===================

기본 사용법:
  ./scripts/deploy.sh [CONTRACT] [OPTIONS]

CONTRACT 옵션:
  MainVoting      MainVoting 컨트랙트 배포 (기본값)
  SubVoting       SubVoting 컨트랙트 배포
  Boosting        Boosting 컨트랙트 배포

OPTIONS:
  --rpc-url URL           RPC URL 지정 (기본: opBNB Testnet)
  --private-key KEY       Private Key 지정 (0x... 형식)
  -vvvv                   최대 상세 출력
  --verify                배포 후 자동 검증 (추가 설정 필요)

환경변수:
  PRIVATE_KEY            Private Key
  RPC_URL                RPC URL

예시:

1. 환경변수 사용:
   export PRIVATE_KEY=0xYOUR_KEY
   export RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
   ./scripts/deploy.sh MainVoting

2. CLI 옵션 사용:
   ./scripts/deploy.sh MainVoting \\
     --rpc-url https://opbnb-testnet-rpc.bnbchain.org \\
     --private-key 0xYOUR_KEY

3. 혼합 사용 (환경변수 + CLI):
   export PRIVATE_KEY=0xYOUR_KEY
   ./scripts/deploy.sh SubVoting --rpc-url https://...

지원되는 네트워크:
  - opBNB Testnet (기본): https://opbnb-testnet-rpc.bnbchain.org
  - opBNB Mainnet: https://opbnb-mainnet-rpc.bnbchain.org
  - Infura opBNB Testnet: https://opbnb-testnet.infura.io/v3/YOUR_KEY

EOF
  exit 0
fi

# Private Key 확인
if [ -z "$PRIVATE_KEY" ]; then
  # CLI 옵션에서 찾기
  for ((i=1; i<=$#; i++)); do
    arg="${!i}"
    if [ "$arg" == "--private-key" ]; then
      next=$((i+1))
      PRIVATE_KEY="${!next}"
      break
    fi
  done
fi

# Private Key 검증
if [ -z "$PRIVATE_KEY" ]; then
  echo "❌ 오류: PRIVATE_KEY가 설정되지 않았습니다."
  echo ""
  echo "다음 중 하나를 사용하세요:"
  echo "  1. 환경변수: export PRIVATE_KEY=0xYOUR_KEY"
  echo "  2. CLI 옵션: ./scripts/deploy.sh MainVoting --private-key 0xYOUR_KEY"
  echo ""
  echo "도움말: ./scripts/deploy.sh --help"
  exit 1
fi

# RPC URL 확인
for ((i=1; i<=$#; i++)); do
  arg="${!i}"
  if [ "$arg" == "--rpc-url" ]; then
    next=$((i+1))
    RPC_URL="${!next}"
    break
  fi
done

# Verbosity 설정
for arg in "$@"; do
  if [ "$arg" == "-vvvv" ] || [ "$arg" == "-vvv" ] || [ "$arg" == "-vv" ] || [ "$arg" == "-v" ]; then
    VERBOSITY="$arg"
  fi
done

# 컨트랙트 선택
case $CONTRACT in
  MainVoting|main|Main)
    SCRIPT_PATH="script/DeployMainVoting.s.sol:DeployMainVoting"
    ;;
  SubVoting|sub|Sub)
    SCRIPT_PATH="script/DeploySubVoting.s.sol:DeploySubVoting"
    ;;
  Boosting|boost|Boost)
    SCRIPT_PATH="script/DeployBoosting.s.sol:DeployBoosting"
    ;;
  *)
    echo "❌ 오류: 알 수 없는 컨트랙트 '$CONTRACT'"
    echo "지원되는 컨트랙트: MainVoting, SubVoting, Boosting"
    echo "도움말: ./scripts/deploy.sh --help"
    exit 1
    ;;
esac

echo "========================================="
echo "VIBE Utility 컨트랙트 배포"
echo "========================================="
echo "Contract: $CONTRACT"
echo "RPC URL: $RPC_URL"
echo "Private Key: ${PRIVATE_KEY:0:10}...${PRIVATE_KEY: -4}"
echo "========================================="
echo ""

# 배포 실행
export PRIVATE_KEY
export RPC_URL

forge script "$SCRIPT_PATH" \
  --rpc-url "$RPC_URL" \
  --broadcast \
  $VERBOSITY \
  "$@"

echo ""
echo "========================================="
echo "✅ 배포 완료!"
echo "========================================="
echo ""
echo "다음 단계:"
echo "1. 배포 주소 확인: broadcast/ 디렉토리"
echo "2. ExecutorSigner 설정:"
echo "   cast send \$CONTRACT_ADDRESS \"setExecutorSigner(address)\" \$EXECUTOR \\"
echo "     --rpc-url $RPC_URL --private-key \$PRIVATE_KEY"
echo ""
echo "3. (MainVoting만) Candidate 등록:"
echo "   ./scripts/setup-candidates.sh \$CONTRACT_ADDRESS 10"
echo ""
