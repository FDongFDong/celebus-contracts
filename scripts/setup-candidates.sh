#!/bin/bash

# MainVoting 컨트랙트에 후보 및 VoteType 설정
# 사용법: ./scripts/setup-candidates.sh [VOTING_ADDRESS] [CANDIDATE_COUNT]

set -e

VOTING_ADDRESS=${1:-$VOTING_ADDRESS}
CANDIDATE_COUNT=${2:-10}
PRIVATE_KEY=${PRIVATE_KEY}
RPC_URL=${RPC_URL:-https://opbnb-testnet-rpc.bnbchain.org}
MISSION_ID=${MISSION_ID:-1}

if [ -z "$VOTING_ADDRESS" ]; then
  echo "❌ 오류: VOTING_ADDRESS가 설정되지 않았습니다."
  echo "사용법: ./scripts/setup-candidates.sh <VOTING_ADDRESS> [CANDIDATE_COUNT]"
  echo "또는: VOTING_ADDRESS=0x... ./scripts/setup-candidates.sh [CANDIDATE_COUNT]"
  exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
  echo "❌ 오류: PRIVATE_KEY 환경변수가 설정되지 않았습니다."
  exit 1
fi

echo "========================================="
echo "MainVoting 컨트랙트 설정"
echo "========================================="
echo "VOTING_ADDRESS: $VOTING_ADDRESS"
echo "RPC_URL: $RPC_URL"
echo "MISSION_ID: $MISSION_ID"
echo "CANDIDATE_COUNT: $CANDIDATE_COUNT"
echo "========================================="

# 1. ExecutorSigner 설정
echo ""
echo "📝 Step 1: ExecutorSigner 설정..."
EXECUTOR_ADDRESS=$(cast wallet address $PRIVATE_KEY)
echo "Executor Address: $EXECUTOR_ADDRESS"

cast send $VOTING_ADDRESS \
  "setExecutorSigner(address)" $EXECUTOR_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --gas-limit 100000

echo "✅ ExecutorSigner 설정 완료"

# 2. Candidate 등록
echo ""
echo "📝 Step 2: Candidate 등록 (1~$CANDIDATE_COUNT)..."

for i in $(seq 1 $CANDIDATE_COUNT); do
  echo "  - Candidate $i: Artist-$i"
  cast send $VOTING_ADDRESS \
    "setCandidate(uint256,uint256,string,bool)" \
    $MISSION_ID $i "Artist-$i" true \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --gas-limit 150000 > /dev/null 2>&1
done

echo "✅ Candidate 등록 완료 ($CANDIDATE_COUNT개)"

# 3. VoteType 라벨 설정
echo ""
echo "📝 Step 3: VoteType 라벨 설정..."

echo "  - VoteType 0: Forget"
cast send $VOTING_ADDRESS \
  "setVoteTypeName(uint8,string)" \
  0 "Forget" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --gas-limit 100000 > /dev/null 2>&1

echo "  - VoteType 1: Remember"
cast send $VOTING_ADDRESS \
  "setVoteTypeName(uint8,string)" \
  1 "Remember" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --gas-limit 100000 > /dev/null 2>&1

echo "✅ VoteType 라벨 설정 완료"

# 4. 설정 확인
echo ""
echo "========================================="
echo "설정 확인"
echo "========================================="

EXECUTOR_SIGNER=$(cast call $VOTING_ADDRESS "executorSigner()(address)" --rpc-url $RPC_URL)
echo "ExecutorSigner: $EXECUTOR_SIGNER"

CANDIDATE_1_NAME=$(cast call $VOTING_ADDRESS "candidateName(uint256,uint256)(string)" $MISSION_ID 1 --rpc-url $RPC_URL)
echo "Candidate 1: $CANDIDATE_1_NAME"

VOTE_TYPE_0=$(cast call $VOTING_ADDRESS "voteTypeName(uint8)(string)" 0 --rpc-url $RPC_URL)
echo "VoteType 0: $VOTE_TYPE_0"

VOTE_TYPE_1=$(cast call $VOTING_ADDRESS "voteTypeName(uint8)(string)" 1 --rpc-url $RPC_URL)
echo "VoteType 1: $VOTE_TYPE_1"

echo ""
echo "========================================="
echo "✅ 모든 설정 완료!"
echo "========================================="
echo ""
echo "이제 스트레스 테스트를 실행할 수 있습니다:"
echo "  npm run stress:burst -- \\"
echo "    --count 3 \\"
echo "    --userCount 10 \\"
echo "    --perUserVotes 20 \\"
echo "    --votingAddress $VOTING_ADDRESS"
echo ""
