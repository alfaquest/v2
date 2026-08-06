# alfaword.games (Alfaquest v2)

Static word games served from Cloudflare Pages (`alfaquest-pages` → https://alfaword.games).

## Local development

```bash
npm install
npm run serve
```

Open http://localhost:4173

## Deploy to production

Production is **Cloudflare Pages**, project `alfaquest-pages`, production branch `main`.

### Option A — GitHub Actions (recommended after one-time setup)

1. **Create a Cloudflare API token**
   - Cloudflare dashboard → My Profile → API Tokens → Create Token
   - Use template **Edit Cloudflare Workers** or custom token with **Account → Cloudflare Pages → Edit**
   - Copy the token

2. **Add GitHub Actions secrets** (repo → Settings → Secrets and variables → Actions)

   | Secret | Value |
   |--------|--------|
   | `CLOUDFLARE_API_TOKEN` | Token from step 1 |
   | `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID (dashboard URL or Workers overview) |

3. **Deploy**
   - **Actions → Deploy production → Run workflow** (no tests; use when CI runners are stuck)
   - Or merge to `main` — **Regression tests** runs tests then deploys if secrets are set

### Option B — Deploy from your machine

Use **Command Prompt** on Windows if PowerShell blocks `npm`:

```cmd
cd path\to\v2
git pull
npm install
npx wrangler login
npm run deploy
```

Or set env vars instead of login:

```cmd
set CLOUDFLARE_API_TOKEN=your_token
set CLOUDFLARE_ACCOUNT_ID=your_account_id
npm run deploy
```

Hard-refresh the site after deploy: `Ctrl+Shift+R`.

### If production branch is wrong (one-time)

If deploys succeed but https://alfaword.games does not update:

```bash
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
./scripts/fix-pages-production-branch.sh
```

## Tests

```bash
npm test
```

## CI notes

Private repos on GitHub Free get one concurrent Actions job. Runner queue timeouts (`job was not acquired by Runner`) are a GitHub platform issue — re-run the workflow or use **Deploy production** / local deploy.
