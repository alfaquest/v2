#!/usr/bin/env bash
# One-time fix for Direct Upload Pages projects created via wrangler on Windows,
# where production_branch can end up as the full "wrangler project create" command
# instead of "main". CI deploys with --branch=main will not update alfaword.games
# until this is corrected.
#
# Usage:
#   export CLOUDFLARE_API_TOKEN=...   # Pages:Edit permission
#   export CLOUDFLARE_ACCOUNT_ID=06d216065309310baafe29018273f4b2
#   ./scripts/fix-pages-production-branch.sh

set -euo pipefail

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID}"
PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT:-alfaquest-pages}"
PRODUCTION_BRANCH="${CLOUDFLARE_PRODUCTION_BRANCH:-main}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN}"

echo "Setting production_branch=${PRODUCTION_BRANCH} on ${PROJECT_NAME}..."

RESPONSE="$(curl -sS -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"production_branch\":\"${PRODUCTION_BRANCH}\"}")"

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "OK — production branch updated."
  echo "$RESPONSE" | grep -o '"production_branch":"[^"]*"' || true
else
  echo "Failed to update production branch:" >&2
  echo "$RESPONSE" >&2
  exit 1
fi
