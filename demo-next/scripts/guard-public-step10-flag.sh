#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

# In public deployment, Step10 private-key signer must stay disabled by default.
ENV_FILES=(
  "$PROJECT_DIR/.env.example"
  "$PROJECT_DIR/.env.production"
  "$PROJECT_DIR/.env.production.local"
)

for file in "${ENV_FILES[@]}"; do
  if [[ -f "$file" ]] && grep -Eq '^[[:space:]]*NEXT_PUBLIC_ENABLE_STEP10_PRIVATE_KEY_SIGNER[[:space:]]*=[[:space:]]*true[[:space:]]*$' "$file"; then
    echo "Security guard failed: $file enables NEXT_PUBLIC_ENABLE_STEP10_PRIVATE_KEY_SIGNER=true"
    exit 1
  fi
done

if [[ "${GITHUB_REF_NAME:-}" == "main" || "${GITHUB_REF_NAME:-}" == "master" ]]; then
  if [[ "${NEXT_PUBLIC_ENABLE_STEP10_PRIVATE_KEY_SIGNER:-false}" == "true" ]]; then
    echo "Security guard failed: production branch cannot use NEXT_PUBLIC_ENABLE_STEP10_PRIVATE_KEY_SIGNER=true"
    exit 1
  fi
fi

echo "Security guard passed: public Step10 signer flag is safe."
