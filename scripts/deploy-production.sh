#!/usr/bin/env bash
# Deploy static site to Cloudflare Pages production (alfaword.games).
#
# Usage:
#   ./scripts/deploy-production.sh
#
# Requires: npx wrangler (logged in via `npx wrangler login`) or CLOUDFLARE_API_TOKEN.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT:-alfaquest-pages}"
BRANCH="${CLOUDFLARE_PRODUCTION_BRANCH:-main}"

npx wrangler pages deploy public \
  --project-name="$PROJECT_NAME" \
  --branch="$BRANCH" \
  "$@"
