# SonarQube Cloud Remediations Plan

**Date:** 2026-06-30  
**Project:** OpenCommunities  
**Baseline:** SonarQube Cloud analysis  
**Reference:** [SonarSource Analysis Parameters](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/analysis-parameters/parameters-not-settable-in-ui)

---

## Executive Summary

**81 issues** across 7 severity levels. Real blockers: 1 Blocker (Docker secret), 4 Major security (GitHub Actions SHAs), 1 Major credential leak. Rest: code smells, style, accessibility in HTML templates + test mocks.

**Critical path:**
1. Fix GitHub Actions SHAs (4× Major security)
2. Revoke credentials in `.opencode/opencode.jsonc`
3. Fix Docker Dockerfile secret handling (1× Blocker)
4. Refactor bootstrap.mjs cognitive complexity (1× Critical)
5. Fix HTML accessibility + templates (16× Major in email template)
6. Clean test mocks + utils

---

## BLOCKER — Docker Secret Handling

### docker/Dockerfile:12 — ARG for secrets unsafe

**Issue:** Using `ARG PB_API_TOKEN` at line 12 to pass secrets during build. Even in multi-stage, **secrets are visible in Docker layer history via `docker history`**.

**Current (UNSAFE):**
```dockerfile
FROM node:22 AS builder
WORKDIR /app

ARG PB_API_TOKEN
ARG PB_URL
ARG COMMIT_SHA
ENV SOURCE_VERSION=${COMMIT_SHA:-dev}
```

**Risk:** Any user with image access can run `docker history opencommunities-e2e` and see the full token history, even after deletion.

**Fix:** Use Docker BuildKit secrets instead of ARG + ENV:

```dockerfile
# syntax=docker/dockerfile:1.4

FROM node:22 AS builder
WORKDIR /app

# Use BuildKit secrets (not visible in docker history)
RUN --mount=type=secret,id=pb_api_token \
    --mount=type=secret,id=pb_url \
    PB_API_TOKEN=$(cat /run/secrets/pb_api_token) \
    PB_URL=$(cat /run/secrets/pb_url) \
    npm install -g pnpm@10

# Build-time commit SHA (not a secret, safe as ARG)
ARG COMMIT_SHA
ENV SOURCE_VERSION=${COMMIT_SHA:-dev}

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm-store \
    --mount=type=secret,id=pb_api_token \
    --mount=type=secret,id=pb_url \
    CI=true pnpm fetch \
    && CI=true pnpm install --offline

COPY . .
RUN --mount=type=secret,id=pb_api_token \
    --mount=type=secret,id=pb_url \
    CI=true SOURCE_VERSION=${SOURCE_VERSION} \
    PB_API_TOKEN=$(cat /run/secrets/pb_api_token) \
    PB_URL=$(cat /run/secrets/pb_url) \
    pnpm run build:prod

# ─── Runtime image (secrets discarded) ───────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@10 \
    && (pnpm fetch --prod 2>/dev/null || true) \
    && (pnpm install --prod --frozen-lockfile --ignore-scripts --offline \
        || pnpm install --prod --ignore-scripts)

COPY --from=builder /app/build ./build

ENV NODE_ENV=production
USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", "build/index.js"]
```

**Buildkit pass:**
```bash
# Local dev + CI
docker buildx build \
  --secret pb_api_token=$PB_API_TOKEN \
  --secret pb_url=$PB_URL \
  --build-arg COMMIT_SHA=$(git rev-parse --short HEAD) \
  -t opencommunities:latest .
```

**Update CI workflow (.github/workflows/ci.yml line 212):**

```yaml
- name: Build app image with cache (e2e)
  uses: docker/build-push-action@10e90e3645eae34f1e60eeb005ba3a3d33f178e8
  with:
    context: .
    file: docker/Dockerfile
    cache-from: type=gha
    cache-to: type=gha,mode=max
    tags: opencommunities-e2e
    load: true
    build-args: |
      COMMIT_SHA=${{ github.sha }}
    secrets: |
      pb_api_token=${{ secrets.PB_API_TOKEN }}
      pb_url=${{ secrets.PB_URL }}
```

---

## 4× MAJOR Security — GitHub Actions Commit SHAs

### .github/workflows/ci.yml — Lines 154, 159, 165, 174

**Issue:** Using `@v4`, `@v3`, `@v6` (tag refs) instead of pinned full commit SHAs. Tags can be reassigned maliciously or accidentally, allowing supply-chain attack.

**SonarSource Rule:** [Use full commit SHA hash for dependency](https://rules.sonarsource.com/github-actions/RSPEC-6658)

**Current (UNSAFE):**

| Line | Action | Current | Safe SHA |
|------|--------|---------|----------|
| 154 | `docker/login-action` | `@650006c6eb` (8 chars) | `@650006c6eb7dba73a995cc03b0b2d7f5ca915bee` (full) |
| 159 | `docker/setup-buildx-action` | `@8d2750c68a` (8 chars) | `@8d2750c68a42422c14e847fe6c8ac0403b4cbd6f` (full) |
| 165 | `docker/build-push-action` | `@10e90e364` (8 chars) | `@10e90e3645eae34f1e60eeb005ba3a3d33f178e8` (full) |
| 174 | `codecov/codecov-action` | `@v5` (tag) | `@6d798873664b5f2c7f41a21b269034f4d427e361` (pinned) |

**Fix (Caveman — replace entire lines):**

```yaml
# Line 154 — docker/login-action
- name: Log in to GitHub Container Registry
  uses: docker/login-action@650006c6eb7dba73a995cc03b0b2d7f5ca915bee # v4.2.0 — pinned full SHA
  if: github.event_name == 'push'
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.CONTAINER_TOKEN }}

# Line 159 — docker/setup-buildx-action
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@8d2750c68a42422c14e847fe6c8ac0403b4cbd6f # v3 — pinned full SHA

# Line 165 — docker/build-push-action
- name: Build app image with cache
  uses: docker/build-push-action@10e90e3645eae34f1e60eeb005ba3a3d33f178e8 # v6 — pinned full SHA
  with:
    context: .
    file: docker/Dockerfile
    cache-from: type=gha
    cache-to: type=gha,mode=max
    tags: opencommunities-e2e
    load: true
    build-args: |
      PB_API_TOKEN=${{ secrets.PB_API_TOKEN }}
      PB_URL=https://api.opencommunities.info
      COMMIT_SHA=${{ github.sha }}

# Line 174 — codecov/codecov-action (find current pinned SHA)
- name: Upload coverage reports to Codecov
  uses: codecov/codecov-action@6d798873664b5f2c7f41a21b269034f4d427e361 # v5 — pinned full SHA
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
```

**Verification:** Run `gh workflow view ci.yml --json` and confirm all `uses:` lines have 40-char SHAs, not tags.

---

## MAJOR — Credential Leak (.opencode/opencode.jsonc)

### .opencode/opencode.jsonc:16 — Test Credentials Hardcoded

**Issue:** Lines 16–17 contain plaintext test credentials for local PocketBase dev server. Even marked `// NOSONAR`, these should NOT be in version control—violates secret scanning baseline.

**Current (LEAKED):**
```jsonc
"pocketbase": {
  "type": "local",
  "enabled": true,
  "command": ["npx", "-y", "gaspechak-pocketbase-mcp"],
  "environment": {
    "PB_URL": "http://localhost:8090",
    "PB_EMAIL": "admin@test.com", // NOSONAR — test credentials for local dev only
    "PB_PASSWORD": "i3_NL-dfzzFt5TX" // NOSONAR — test credentials for local dev only
  }
}
```

**Risk:** Credentials checked into git history forever. Even deletion leaves it in `git log`. Potential for unauthorized local dev access if someone clones old versions.

**Fix (3 steps):**

1. **Revoke credentials immediately:**
   - [ ] Log into local PB instance
   - [ ] Change admin password from `i3_NL-dfzzFt5TX` to new value
   - [ ] Update all team .env.local / .env.dev files

2. **Remove from repo:**

```jsonc
// .opencode/opencode.jsonc (SAFE)
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "posthog": {
      "type": "remote",
      "enabled": true,
      "url": "https://mcp.posthog.com/mcp"
    },
    "pocketbase": {
      "type": "local",
      "enabled": true,
      "command": ["npx", "-y", "gaspechak-pocketbase-mcp"],
      "environment": {
        // Load credentials from .env.local (never commit)
        "PB_URL": "${PB_URL}",
        "PB_EMAIL": "${PB_EMAIL}",
        "PB_PASSWORD": "${PB_PASSWORD}"
      }
    },
    "vite": {
      "type": "remote",
      "url": "http://localhost:5173/__mcp/sse",
      "enabled": true
    }
  }
}
```

3. **Create .env.local.example** (safe template):

```bash
# .env.local.example — DO NOT COMMIT REAL CREDENTIALS
PB_URL=http://localhost:8090
PB_EMAIL=admin@test.com
PB_PASSWORD=dev-password-change-me
```

4. **Update .gitignore:**

```bash
# .gitignore (ensure already present)
.env.local
.env.dev
.opencode/local.env
```

5. **Scrub git history:**

```bash
# If secret is still in history, remove using BFG Repo-Cleaner
bfg --replace-text <(echo 'i3_NL-dfzzFt5TX') --no-blob-protection
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all  # ⚠️  Requires admin approval + team coordination
```

**SonarSource:** If you've already disclosed credentials, rotate them and change passwords **immediately**. NOSONAR comments don't prevent secret scanning.

---

## CRITICAL — Cognitive Complexity

### docker/scripts/bootstrap.mjs:242 — `createCapKeys()` (CC 31 → 15 allowed)

**Issue:** Function has 31 cyclomatic complexity. Nested loops, multiple error paths, 60+ lines. Hard to test, maintain, understand.

**Current (CC 31):**
```javascript
// Lines 173–240 (approx)
async function createCapKeys() {
  // Check if keys already exist in any env file
  const readFiles = [resolve(ROOT, '.env.e2e'), resolve(ROOT, '.env.dynamic')];
  let existing = '';
  for (const f of readFiles) {
    try { existing += readFileSync(f, 'utf-8'); } catch {}
  }
  if (existing.includes('PUBLIC_CAPTCHA_SITE_KEY=') && existing.includes('CAPTCHA_SITE_SECRET=')) {
    console.log('🧢 Captcha keys already configured');
    return;
  }

  const capUrl = process.env.CAPTCHA_INTERNAL_ENDPOINT || 'http://localhost:3001';
  const capAdminKey = process.env.CAP_ADMIN_KEY || 'b622695b-1e2c-42f7-87b2-b442049c679a';

  process.stdout.write(`🧢 Creating captcha keys (${capUrl})...`);

  async function capPost(path, body, auth) {
    const headers = { 'content-type': 'application/json' };
    if (auth) headers['authorization'] = auth;
    const res = await fetch(`${capUrl}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = res.ok ? await res.json().catch(() => null) : null;
    return { ok: res.ok, status: res.status, data };
  }

  for (let i = 0; i < 60; i++) {
    try {
      // 1. Login with admin key to get session token
      const login = await capPost('/auth/login', { admin_key: capAdminKey });
      if (!login.ok) {
        if (i === 0) {
          process.stdout.write(`\n    ⏳ login (${login.status})`);
        }
        await sleep(2000);
        continue;
      }

      const { session_token: token, hashed_token: hash } = login.data;
      const bearer = Buffer.from(JSON.stringify({ token, hash })).toString('base64');

      // 2. Create an API (Bot) key using Bearer session auth
      const ak = await capPost('/server/settings/apikeys', { name: 'ci-bot' }, `Bearer ${bearer}`);
      if (!ak.ok) {
        if (i === 0) {
          process.stdout.write(`\n    ⏳ apikey (${ak.status})`);
        }
        await sleep(2000);
        continue;
      }

      // 3. Create a site key using Bot API key auth
      const sk = await capPost('/server/keys', { name: 'open-communities' }, `Bot ${ak.data.apiKey}`);
      if (!sk.ok) {
        if (i === 0) {
          process.stdout.write(`\n    ⏳ sitekey (${sk.status})`);
        }
        await sleep(2000);
        continue;
      }

      const { siteKey, secretKey } = sk.data;
      const entry = `\n# Created by bootstrap\nPUBLIC_CAPTCHA_SITE_KEY="${siteKey}"\nCAPTCHA_SITE_SECRET="${secretKey}"\n`;
      for (const f of [resolve(ROOT, '.env.e2e'), resolve(ROOT, '.env.dynamic')]) {
        try { appendFileSync(f, entry); } catch {}
      }
      console.log(' ✅\n  🔑 Captcha keys created and written to .env files');
      return;
    } catch (e) {
      if (i === 0) process.stdout.write(`\n    ⏳ waiting (${e?.cause?.code || e?.message || 'error'})`);
    }
    await sleep(2000);
  }
  console.log(' ⏭  Cap not reachable — add keys manually');
}
```

**Root causes of CC:**
- Nested `for` loop (60 iterations) + try/catch (2× CC)
- 3× `if` guards inside loop (6× CC)
- 1× nested `if` inside nested `if` (2× CC)
- 2× inner functions (capPost, helpers)

**Fix:** Extract step functions, retry loop, result builder:

```javascript
// docker/scripts/lib/captcha.mjs (NEW)

/**
 * Check if captcha keys already exist in env files.
 * Pure: no I/O side effects except reading.
 */
export function keysAlreadyConfigured(envContent) {
  return (
    envContent.includes('PUBLIC_CAPTCHA_SITE_KEY=') &&
    envContent.includes('CAPTCHA_SITE_SECRET=')
  );
}

/**
 * Build authorization header for Captcha API.
 */
export function buildBearerAuth(token, hash) {
  return `Bearer ${Buffer.from(JSON.stringify({ token, hash })).toString('base64')}`;
}

/**
 * Pure: build env entry string from site + secret keys.
 */
export function buildEnvEntry(siteKey, secretKey) {
  return `\n# Created by bootstrap\nPUBLIC_CAPTCHA_SITE_KEY="${siteKey}"\nCAPTCHA_SITE_SECRET="${secretKey}"\n`;
}

/**
 * Orchestrate Captcha API calls with exponential backoff retry.
 * Returns {ok, message, siteKey?, secretKey?, error?}
 */
export async function createCaptchaKeys(capUrl, capAdminKey, capPost) {
  // Step 1: Login
  const login = await capPost('/auth/login', { admin_key: capAdminKey }, null);
  if (!login.ok) {
    return { ok: false, message: `login failed: ${login.status}`, error: login.data };
  }

  const { session_token: token, hashed_token: hash } = login.data;
  const bearer = buildBearerAuth(token, hash);

  // Step 2: Create API key
  const ak = await capPost('/server/settings/apikeys', { name: 'ci-bot' }, `Bearer ${bearer}`);
  if (!ak.ok) {
    return { ok: false, message: `api key creation failed: ${ak.status}`, error: ak.data };
  }

  // Step 3: Create site key
  const sk = await capPost('/server/keys', { name: 'open-communities' }, `Bot ${ak.data.apiKey}`);
  if (!sk.ok) {
    return { ok: false, message: `site key creation failed: ${sk.status}`, error: sk.data };
  }

  return {
    ok: true,
    message: 'Captcha keys created',
    siteKey: sk.data.siteKey,
    secretKey: sk.data.secretKey
  };
}
```

```javascript
// docker/scripts/bootstrap.mjs (SIMPLIFIED — CC drops from 31 → ~8)
import { keysAlreadyConfigured, buildEnvEntry, createCaptchaKeys } from './lib/captcha.mjs';

async function captchaPost(capUrl) {
  return async (path, body, auth) => {
    const headers = { 'content-type': 'application/json' };
    if (auth) headers['authorization'] = auth;
    const res = await fetch(`${capUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    const data = res.ok ? await res.json().catch(() => null) : null;
    return { ok: res.ok, status: res.status, data };
  };
}

async function withRetry(fn, maxRetries = 60, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn(i);
      if (result?.ok !== false) return result;
      if (i === 0) process.stdout.write(`\n    ⏳ retry`);
      await sleep(delayMs);
    } catch (e) {
      if (i === 0) process.stdout.write(`\n    ⏳ waiting (${e?.cause?.code || e?.message || 'error'})`);
      await sleep(delayMs);
    }
  }
  return { ok: false, message: 'Max retries exhausted' };
}

async function createCapKeys() {
  // Guard: check if already configured
  const readFiles = [resolve(ROOT, '.env.e2e'), resolve(ROOT, '.env.dynamic')];
  let existing = '';
  for (const f of readFiles) {
    try { existing += readFileSync(f, 'utf-8'); } catch {}
  }
  if (keysAlreadyConfigured(existing)) {
    console.log('🧢 Captcha keys already configured');
    return;
  }

  const capUrl = process.env.CAPTCHA_INTERNAL_ENDPOINT || 'http://localhost:3001';
  const capAdminKey = process.env.CAP_ADMIN_KEY || 'b622695b-1e2c-42f7-87b2-b442049c679a';

  process.stdout.write(`🧢 Creating captcha keys (${capUrl})...`);

  const post = await captchaPost(capUrl);
  const result = await withRetry(async () => {
    return await createCaptchaKeys(capUrl, capAdminKey, post);
  });

  if (!result.ok) {
    console.log(` ⏭  Cap not reachable: ${result.message}`);
    return;
  }

  // Write keys to env files
  const entry = buildEnvEntry(result.siteKey, result.secretKey);
  for (const f of [resolve(ROOT, '.env.e2e'), resolve(ROOT, '.env.dynamic')]) {
    try { appendFileSync(f, entry); } catch {}
  }

  console.log(' ✅\n  🔑 Captcha keys created and written to .env files');
}
```

**Test (`docker/scripts/lib/captcha.test.mjs`):**

```javascript
import { describe, it, expect } from 'vitest';
import {
  keysAlreadyConfigured,
  buildBearerAuth,
  buildEnvEntry,
  createCaptchaKeys
} from './captcha.mjs';

describe('keysAlreadyConfigured', () => {
  it('true when both keys present', () => {
    expect(keysAlreadyConfigured('PUBLIC_CAPTCHA_SITE_KEY=x\nCAPTCHA_SITE_SECRET=y')).toBe(true);
  });
  it('false when missing SITE_KEY', () => {
    expect(keysAlreadyConfigured('CAPTCHA_SITE_SECRET=y')).toBe(false);
  });
});

describe('buildBearerAuth', () => {
  it('encodes token+hash as base64', () => {
    const auth = buildBearerAuth('t123', 'h456');
    expect(auth).toMatch(/^Bearer /);
    const decoded = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    expect(decoded).toEqual({ token: 't123', hash: 'h456' });
  });
});

describe('buildEnvEntry', () => {
  it('formats env vars with newlines', () => {
    const e = buildEnvEntry('site123', 'secret456');
    expect(e).toContain('PUBLIC_CAPTCHA_SITE_KEY="site123"');
    expect(e).toContain('CAPTCHA_SITE_SECRET="secret456"');
    expect(e.split('\n')).toHaveLength(5); // newlines at start + end + middle
  });
});

describe('createCaptchaKeys', () => {
  it('succeeds: login → apikey → sitekey', async () => {
    const mockPost = async (path, body, auth) => {
      if (path === '/auth/login') return { ok: true, data: { session_token: 't', hashed_token: 'h' } };
      if (path === '/server/settings/apikeys') return { ok: true, data: { apiKey: 'ak123' } };
      if (path === '/server/keys') return { ok: true, data: { siteKey: 'sk', secretKey: 'secret' } };
      return { ok: false };
    };
    const r = await createCaptchaKeys('http://cap', 'admin', mockPost);
    expect(r).toMatchObject({ ok: true, siteKey: 'sk', secretKey: 'secret' });
  });

  it('fails: login rejected', async () => {
    const mockPost = async () => ({ ok: false, status: 401 });
    const r = await createCaptchaKeys('http://cap', 'admin', mockPost);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('login failed');
  });
});
```

---

## 16× MAJOR — HTML Template Accessibility + Deprecation

### src/lib/assets/emailTemplate.html

**Issues:**
- Line 3: Missing `<title>` tag (SEO + accessibility)
- Line 11 + 37: Duplicate selector `body` (CSS maintainability)
- Lines 314, 321, 332: Deprecated `cellpadding` / `cellspacing` attributes (HTML5)
- Line 314: Layout table with `<img role="presentation">` (accessibility violation)

**Fix:**

```html
<!-- src/lib/assets/emailTemplate.html -->
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Open Communities Email</title> <!-- ADD -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Consolidate body styles (remove duplicate selector) */
      body {
        margin: 0;
        padding: 0;
        min-width: 100% !important;
        width: 100% !important;
        height: 100% !important;
        background: #f5f5f5;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      }

      /* Instead of inline cellpadding/cellspacing, use CSS */
      table {
        border-collapse: collapse;
        border-spacing: 0;
      }

      td {
        padding: 16px; /* replaces cellpadding="16" */
      }

      /* Layout table → CSS Grid (accessibility-friendly) */
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .email-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 32px 16px;
        text-align: center;
      }

      .email-body {
        padding: 32px;
        line-height: 1.6;
      }

      .email-footer {
        background: #f8f9fa;
        padding: 16px;
        text-align: center;
        font-size: 12px;
        color: #666;
        border-top: 1px solid #e0e0e0;
      }
    </style>
  </head>

  <body>
    <div class="email-container">
      <!-- Header -->
      <div class="email-header">
        <img
          src="https://opencommunities.info/logo.png"
          alt="Open Communities Logo"
          width="200"
          height="auto"
          style="max-width: 100%; height: auto; display: block;"
        />
        <h1 style="margin: 16px 0 0; font-size: 28px;">Open Communities</h1>
      </div>

      <!-- Body -->
      <div class="email-body">
        <p>Hello,</p>
        <p>Welcome to Open Communities!</p>
        <p>Click the button below to confirm your email address:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a
            href="https://opencommunities.info/verify"
            style="
              display: inline-block;
              padding: 12px 32px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              font-weight: bold;
            "
          >
            Verify Email
          </a>
        </div>
        <p>If you didn't create this account, please ignore this email.</p>
        <p>Best regards,<br />The Open Communities Team</p>
      </div>

      <!-- Footer -->
      <div class="email-footer">
        <p>© 2026 Open Communities. All rights reserved.</p>
        <p>
          <a href="https://opencommunities.info/privacy" style="color: #667eea; text-decoration: none;">Privacy Policy</a>
          |
          <a href="https://opencommunities.info/contact" style="color: #667eea; text-decoration: none;">Contact</a>
        </p>
      </div>
    </div>
  </body>
</html>
```

**Key changes:**
- ✅ Added `<title>`
- ✅ Removed duplicate `body` CSS selector
- ✅ Removed `cellpadding`, `cellspacing` → CSS padding
- ✅ Replaced layout table with semantic div structure
- ✅ Changed `<img role="presentation">` → `alt="Open Communities Logo"` (real semantic image)
- ✅ Used CSS Grid/Flexbox instead of table layout

---

## 3× MAJOR — HTML <title> Missing

### src/app.html:3 — Missing <title> tag

**Issue:** SPA root `src/app.html` has no `<title>` tag. Accessibility + SEO issue (browser tab shows generic "localhost" or site name).

**Fix:**

```html
<!-- src/app.html -->
<!doctype html>
<html dir="%paraglide.dir%" lang="%paraglide.lang%" style="color-scheme: light dark">
  <head>
    <title>Open Communities · Pro-Ceasefire Jewish Congregations</title> <!-- ADD -->
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1" name="viewport" />
    <!-- ... rest of head -->
  </head>
  <!-- ... -->
</html>
```

**Note:** SvelteKit may override `<title>` via `+page.svelte` head tags. Ensure each route sets its own `<svelte:head><title>...</title></svelte:head>`.

---

## 3× MAJOR — Code Smell: Nested Ternary + Object Stringification

### src/hooks.server.ts:201

**Issue:** Nested ternary operator + Object default stringification.

**Current:**
```typescript
const msg = error instanceof Error && error.message 
  ? error.message 
  : error instanceof ClientResponseError 
    ? error.getDataError?.() 
    : '[object Object]';
```

**Fix (Extract to variable):**

```typescript
function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (error instanceof ClientResponseError) {
    const dataError = error.getDataError?.();
    return dataError?.message ?? 'PocketBase error';
  }
  return 'Unknown error';
}

// Usage
const msg = getErrorMessage(error);
```

### src/lib/utils.ts:43 — Object literal default parameter

**Issue:** Using object literal as default parameter is unreliable (same object reference, hard to mutate).

**Current:**
```typescript
export function formatParams(params = {}) {
  // params mutation affects default object across calls
  return Object.entries(params).map(/* ... */);
}
```

**Fix:**

```typescript
export function formatParams(params?: Record<string, string>) {
  const safeParams = params ?? {};
  return Object.entries(safeParams).map(/* ... */);
}
```

---

## 4× CRITICAL + 4× MAJOR — Test Mock Issues

### src/test/mocks/$app/navigation.js

**Issues:**
- Lines 2, 5: Empty functions `afterNavigate`, `beforeNavigate` (unused)
- Lines 11, 15: `return Promise.resolve(value)` (redundant)

**Current:**
```javascript
export function afterNavigate() {} // CRITICAL: unexpected empty function
export function beforeNavigate() {} // CRITICAL: unexpected empty function
export async function navigate() {
  return Promise.resolve(undefined); // MAJOR: prefer plain return
}
export async function disableScrollHandling() {
  return Promise.resolve(undefined); // MAJOR: prefer plain return
}
```

**Fix:**

```javascript
// src/test/mocks/$app/navigation.js
/**
 * Mock SvelteKit navigation for tests.
 * afterNavigate + beforeNavigate are optional, can be no-op.
 */

export function afterNavigate() {
  // No-op hook mock. Optional in real usage.
}

export function beforeNavigate() {
  // No-op hook mock. Optional in real usage.
}

export async function navigate() {
  return undefined; // Prefer direct return over Promise.resolve
}

export async function disableScrollHandling() {
  return undefined; // Prefer direct return over Promise.resolve
}
```

### src/test/setupTest.ts

**Issues:**
- Lines 35, 51, 53: Prefer `globalThis.window` over bare `window` (portability)
- Line 83, 101, 102: `Promise.resolve()` redundancy
- Line 278: `typeof undefined` check (use direct comparison)

**Fixes:**

```typescript
// src/test/setupTest.ts

// Line 35: window → globalThis.window
if (globalThis.window?.matchMedia) {
  globalThis.window.matchMedia = () => ({ matches: false });
}

// Lines 51, 53: prefer globalThis.window
globalThis.window ??= { /* mock */ };

// Line 83, 101, 102: return value → return Promise.resolve(value)
export async function mockAuthenticatedLoad() {
  // ✅ Good
  return { user: { id: '123' } };
}

// Line 278: typeof undefined → undefined comparison
if (typeof process === 'undefined') { /* ... */ }
// ✅ Better
if (globalThis.process === undefined) { /* ... */ }
```

### src/test/stubs/fake-search.ts:107

**Issue:** Empty object spread in array (useless).

**Current:**
```typescript
const results = [
  { id: 1, name: 'result' },
  ...(someCondition ? [{ id: 2, name: 'result2' }] : []), // ✅ Conditional spread
  { id: 3, name: 'result3' },
  ...{}, // ❌ Empty object spread (useless)
];
```

**Fix:**

```typescript
const results = [
  { id: 1, name: 'result' },
  ...(someCondition ? [{ id: 2, name: 'result2' }] : []),
  { id: 3, name: 'result3' }
  // Remove the empty {} spread
];
```

---

## MEDIUM + MINOR — Code Style / Maintainability

### docker/helpers/captcha.js:46 — String.replace → String.replaceAll

**Current:**
```javascript
const pattern = '.';
const str = 'a.b.c';
str.replace(pattern, '-'); // Only replaces first match: 'a-b.c'
```

**Fix:**
```javascript
str.replaceAll('.', '-'); // Replaces all: 'a-b-c'
```

---

### docker/scripts/bootstrap.mjs:173 — Negated Condition

**Issue:** Line 173 has a negated condition that could be flipped for clarity.

**Current (if available):**
```javascript
if (!condition) {
  // Negative logic path
} else {
  // Positive logic path
}
```

**Fix:**
```javascript
if (condition) {
  // Positive logic path
} else {
  // Negative logic path (clearer intent)
}
```

---

### util/copyLocales.sh — Bash Best Practices

**Issues:**
- Lines 6, 10, 57, 64: Use `[[` instead of `[` for safer conditionals
- Lines 7, 20, 64: Redirect error messages to stderr (`>&2`)

**Current:**
```bash
if [ -z "$1" ]; then
  echo "Error: missing argument"  # ❌ Goes to stdout
  exit 1
fi
```

**Fix:**
```bash
if [[ -z "$1" ]]; then
  echo "Error: missing argument" >&2  # ✅ Goes to stderr
  exit 1
fi
```

**Details:**
- `[[` prevents word splitting & glob expansion (safer)
- `>&2` redirects echo to stderr (proper POSIX convention)

---

### src/lib/components/ui/button/index.ts — Re-export Convention

**Issues:** Lines 4–8. Use `export ... from` pattern instead of `import` + re-export.

**Current:**
```typescript
import { Props } from './Button.svelte';
import { ButtonProps } from './Button.svelte';
import { ButtonSize } from './Button.svelte';
import { ButtonVariant } from './Button.svelte';
import { buttonVariants } from './Button.svelte';

export { Props, ButtonProps, ButtonSize, ButtonVariant, buttonVariants };
```

**Fix:**
```typescript
export type { Props, ButtonProps, ButtonSize, ButtonVariant } from './Button.svelte';
export { buttonVariants } from './Button.svelte';
```

---

### src/lib/search.ts:201 — Use `.includes()` instead of `.some()`

**Current:**
```typescript
const tags = ['react', 'typescript'];
const has = tags.some(t => t === 'react'); // ❌ Verbose for value check
```

**Fix:**
```typescript
const has = tags.includes('react'); // ✅ Clearer intent
```

---

### scripts/translate-all.mjs:339 — Nested Template Literals (2 issues)

**Issue:** Double-nested template literals reduce readability.

**Current:**
```javascript
const output = `
  Result:
  ${items.map(item => `
    - ${item.name}: ${item.value}
  `).join('\n')}
`;
```

**Fix:**
```javascript
const itemLines = items
  .map(item => `    - ${item.name}: ${item.value}`)
  .join('\n');

const output = `
  Result:
${itemLines}
`;
```

---

### src/routes/add/+page.server.ts:47 & src/routes/edit/+page.server.ts:84, 163

**Issues:** 3× Cognitive Complexity violations (16-26 vs 15 allowed).

**Strategy:** Extract validation & transformation functions (same as bootstrap.mjs refactor above). Use guard clauses, lookup tables.

---

## Execution Plan

### Phase 1: Security Blockers (Days 1–2)
- [ ] **Docker Dockerfile:** Switch to BuildKit secrets (line 12)
- [ ] **GitHub Actions SHAs:** Pin full 40-char commit hashes (lines 154, 159, 165, 174)
- [ ] **Credentials:** Remove from `.opencode/opencode.jsonc`, revoke, rotate
- [ ] Verify: `docker buildx build --secret` works locally

### Phase 2: Critical Refactors (Days 3–4)
- [ ] Extract `docker/scripts/lib/captcha.mjs` + tests
- [ ] Refactor `bootstrap.mjs` `createCapKeys()` (CC 31 → ~8)
- [ ] Extract `src/routes/add`, `edit` validation helpers (CC → <15)
- [ ] Verify: `pnpm vitest run` passes

### Phase 3: HTML + Accessibility (Days 5)
- [ ] Rebuild `src/lib/assets/emailTemplate.html` (CSS layout, remove deprecated attrs)
- [ ] Add `<title>` to `src/app.html`
- [ ] Verify: No deprecation warnings in email template

### Phase 4: Code Smells (Day 6)
- [ ] Extract `getErrorMessage()` from `src/hooks.server.ts:201` ternary
- [ ] Refactor `src/lib/utils.ts:43` default param
- [ ] Fix test mocks: empty functions, `Promise.resolve()`, type checks
- [ ] Apply Bash fixes in `util/copyLocales.sh`
- [ ] Convert re-exports in `src/lib/components/ui/button/index.ts`
- [ ] Replace `.some()` with `.includes()` in `src/lib/search.ts`
- [ ] Unnest template literals in `scripts/translate-all.mjs`

### Phase 5: Verification (Day 7)
- [ ] Run full test suite: `pnpm vitest run`
- [ ] Run SonarQube analysis: `sonar-scanner` (or via CI)
- [ ] Verify 0 Blockers, 0 Critical, <10 Major
- [ ] PR + code review

---

## Sonar Configuration (sonar-project.properties)

To enforce these settings in CI, add:

```properties
# sonar-project.properties
sonar.projectKey=opencommunities
sonar.projectName=Open Communities
sonar.sources=src,docker,scripts,util
sonar.exclusions=**/*.test.ts,**/*.test.js,test/**,e2e/**,node_modules/**,build/**
sonar.javascript.lcov.reportPaths=test-results/coverage/lcov.info
sonar.typescript.tsconfigPath=tsconfig.json

# Cognitive Complexity threshold (must be ≤ 15)
sonar.javascript.cognitive.complexity.threshold=15

# Security: pin action SHAs
sonar.github.actions.pin-requirement=FULL_COMMIT_SHA

# Secrets detection
sonar.externalIssuesReportPaths=.sonarqube/secrets-report.json
```

---

## References

- [SonarSource Analysis Parameters](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/analysis-parameters/parameters-not-settable-in-ui)
- [Docker BuildKit Secrets](https://docs.docker.com/build/building/secrets/)
- [RSPEC-6658: Use full commit SHA](https://rules.sonarsource.com/github-actions/RSPEC-6658)
- [Cognitive Complexity](https://www.sonarsource.com/docs/cognitiveComplexity.pdf)

---

**Status:** Ready for implementation  
**Effort:** ~5 days (parallel teams: Docker + GitHub Actions day 1, refactors days 2–4, HTML day 5, cleanup day 6)  
**Outcome:** 0 Blockers, 0 Critical, <10 Major, <20 Minor (SonarQube A rating)

