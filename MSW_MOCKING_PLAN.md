# Plan: Add MSW (Mock Service Worker) for HTTP Mocking

**Repository:** `selfagency/open-communities`
**Date:** 2026-06-20
**Author:** Super Z (automated planning)
**Audience:** Project maintainers
**Status:** Proposal — awaiting approval before any code changes
**Reference:** https://mswjs.io/docs

---

## Executive Summary

This plan adds [Mock Service Worker (MSW) v2](https://mswjs.io/docs) as the unified HTTP-mocking layer for the Open Communities codebase. MSW replaces the current ad-hoc mocking strategy — which today is a sprawling patchwork of `vi.mock('pocketbase')`, hand-built stub PocketBase instances in every test file, mocked SvelteKit modules (`$app/navigation`, `$app/state`, `$app/environment`), and bespoke `createMockRequestEvent` helpers — with a single, declarative, network-level mock layer.

**The current state of testing is brittle.** The code review (separate deliverable) found that the entire unit test suite does not run due to a `@testing-library/svelte` ↔ Svelte 5 incompatibility, but even setting that aside, the existing mock architecture has systemic problems:

1. **PocketBase is mocked at the module level in every test.** Each server-route test (`add.page.server.test.ts`, `edit.page.server.test.ts`, `login.page.server.test.ts`, `contact.page.server.test.ts`, `routes.server.test.ts`, `routes.page.server.test.ts`) builds its own `makeApiStub()` returning a fake `collection()` chain. These stubs are inconsistent (different stubs return different shapes), they don't exercise the actual PocketBase filter syntax (so the filter-injection bug S-5 from the code review is invisible to tests), and they don't simulate pagination, auth refresh, batch operations, or error responses.

2. **`sveltekit-superforms` is mocked at the module level.** `src/test/testUtils.ts:93-127` exports a `mockSveltekitSuperforms` object that replaces `superValidate` with a no-op returning `{}`. This means the form-validation pipeline is never exercised in tests — the very pipeline where the captcha-bypass bug (S-1) lives. Tests that should catch the captcha bypass cannot, because `validateCaptcha` calls `superValidate` which is mocked to return `{}`.

3. **SvelteKit runtime modules are mocked in `setupTest.ts`.** Lines 80–86 mock `$app/navigation`, 89–104 mock `cookie`, 109–113 mock `nodemailer`, 116–119 mock `$app/environment`, 124–171 mock `$app/state`, 174–183 mock `svelte-sonner` and `svelte-copy`. Each of these mocks is a partial implementation that diverges from the real runtime. The `$app/state` mock in particular is a 50-line hand-rolled store that has to be kept in sync with SvelteKit's actual `page` store API.

4. **External HTTP calls are not mocked at all.** `validateCaptcha` in `src/lib/server/utils.ts` calls `fetch(captchaEndpoint, ...)` against the real Cap service. The PostHog client in `src/lib/server/posthog.ts` calls the real PostHog API. The `public-ip` library in `src/hooks.server.ts` makes real DNS queries. None of these are mocked, so tests that touch these code paths either (a) fail when network is unavailable, (b) hit real services and incur quota/rate limits, or (c) are skipped entirely.

5. **E2E tests require live infrastructure.** The Playwright e2e suite (`e2e/tests/auth.spec.js`) requires a running PocketBase, a running Cap service, and a running Mailpit. It cannot run in isolation. MSW can't fully replace e2e tests (those still need a real backend for true end-to-end coverage), but it can replace the unit- and component-level tests that today incorrectly reach for module-level mocks.

**MSW solves these problems by mocking at the HTTP level instead of the module level.** MSW intercepts requests via the Service Worker API in the browser, and via `@mswjs/interceptors` (which patches Node's `http`/`https` modules) in Node. Application code is unchanged — `fetch()`, the PocketBase SDK's internal `fetch`, `nodemailer`'s SMTP (via a mock SMTP transport), all hit the network as normal, and MSW intercepts and responds. This means:

- The real PocketBase SDK runs in tests, exercising real filter strings, real auth-refresh logic, real batch operations.
- The real `sveltekit-superforms` `superValidate` runs in tests, exercising the real validation pipeline.
- The real SvelteKit `fetch` runs, so `load` functions that use `{ fetch }` (the SvelteKit-provided fetch that tracks dependencies) work correctly.
- Captcha and PostHog calls are intercepted, so tests are deterministic and don't hit real services.
- The same handler definitions can be reused across Vitest unit tests, Vitest browser-mode tests, Storybook (if added later), and local development.

**Architecture:**
- **`src/mocks/handlers/`** — declarative handler files grouped by domain (PocketBase collections, captcha, PostHog, mailpit, etc.). One source of truth for all mocked network behavior.
- **`src/mocks/node.ts`** — `setupServer(...handlers)` for Vitest Node-environment tests (server-route tests, lib tests).
- **`src/mocks/browser.ts`** — `setupWorker(...handlers)` for Vitest browser-mode tests and dev-mode mocking (optional).
- **`src/mocks/data/`** — fixture data (congregations, users, pages) shared across handlers.
- **`src/test/setupTest.ts`** — refactored to start the MSW server before tests, reset handlers after each test, and close the server after all tests. Most existing `vi.mock()` calls are removed.

**Total estimated effort:** **1.5–2 weeks** for the full migration. A minimal "MSW for server routes only" MVP (Phase 1 below) is achievable in **2–3 days** and immediately improves test fidelity.

**Final recommendation:** Proceed. MSW is the standard for HTTP mocking in the JavaScript ecosystem, the docs are excellent, it integrates cleanly with Vitest and SvelteKit, and it directly addresses multiple findings from the code review (especially the "tests don't actually test the real code paths" problem). The migration is also a prerequisite for trusting the test suite enough to remove the `continue-on-error: true` from CI.

---

## 1. Current Mocking Architecture (As-Is)

### 1.1 The Mock Landscape

A complete inventory of mocking in the current codebase:

#### Global mocks (in `src/test/setupTest.ts`)

| Mock | Lines | What it replaces | Why | Problem |
|---|---|---|---|---|
| `Element.animate` polyfill | 19–31 | Web Animations API in jsdom | jsdom doesn't implement `animate()` | Fine — keep, but irrelevant to MSW |
| `URL.createObjectURL` polyfill | 37–61 | Blob URL creation in jsdom | jsdom lacks `createObjectURL` | Fine — keep |
| `document`/`body` mock | 67–77 | DOM for non-jsdom envs | Defensive fallback | Fine — keep |
| `vi.mock('$app/navigation')` | 80–86 | `goto`, `invalidate`, `invalidateAll`, `afterNavigate`, `beforeNavigate` | SvelteKit runtime not available in Vitest | **Remove with MSW + `@sveltejs/kit/vitest` plugin** |
| `vi.mock('cookie')` | 89–104 | `cookie.parse` | Server modules import `cookie` package | **Keep** — `cookie` is a real package, not HTTP. Could be replaced by MSW intercepting the cookie parsing, but that's overkill. |
| `vi.mock('nodemailer')` | 109–113 | `createTransport`, `sendMail` | nodemailer pulls in Node streams, doesn't work in jsdom | **Replace with MSW** — mock the SMTP at the network level, OR keep the module mock (nodemailer doesn't speak HTTP). See §3.5. |
| `vi.mock('$app/environment')` | 116–119 | `browser`, `dev` | SvelteKit runtime | **Remove with `@sveltejs/kit/vitest` plugin** |
| `vi.mock('$app/state')` | 124–171 | `page` store | SvelteKit runtime | **Remove with `@sveltejs/kit/vitest` plugin** |
| `vi.mock('svelte-copy')` | 174–176 | `copyText` | Browser-only API | Keep (not HTTP) |
| `vi.mock('svelte-sonner')` | 178–183 | `toast` | Browser-side effects | Keep (not HTTP) |
| `vi.mock('$lib/paraglide/messages')` | 203–214 | `m` translation function | Generated module not available before build | Keep (not HTTP) |
| `vi.mock('$lib/components/ui/sheet')` | 217 | UI component stubs | Complex bits-ui components hard to render in jsdom | Keep (not HTTP) |
| `vi.mock('$lib/assets/*.svg?component')` | 220–251 | SVG imports | Vite asset imports not resolved in Vitest | Keep (not HTTP) |

#### Per-test-file mocks

| File | Mock | Target | Problem |
|---|---|---|---|
| `src/lib/api.test.ts:5-24` | `vi.mock('pocketbase')` | The entire PocketBase SDK | Replaces PB with a hand-built class that has `authStore`, `collection()`. Each test then pokes the mock to return specific values. **Doesn't exercise real PB filter syntax, real auth refresh, real batch.** |
| `src/lib/api.test.ts:33` | `vi.mock('$env/dynamic/public')` | Env vars | Fine — env isn't HTTP. But could be replaced with `process.env` setup. |
| `src/lib/server/api.test.ts` | `vi.mock('pocketbase')`, `vi.mock('./logger')`, `vi.mock('@sveltejs/kit')` | PB, logger, `error()` | Same PB-mock problem. Mocking `@sveltejs/kit`'s `error()` to return a plain object bypasses the real throw semantics. |
| `src/lib/server/mail.test.ts:15` | `vi.mock('$lib/assets/emailTemplate.html?raw')` | Email template asset | Fine — asset import. |
| `src/lib/stores.test.ts:4,20,28` | `vi.mock('@nanostores/persistent')`, `vi.mock('radashi')`, `vi.mock('$app/state')` | Persistent store, radashi, SvelteKit | Mix of legitimate and over-mocked. `$app/state` should use the real SvelteKit Vitest plugin. |
| `src/lib/signup.test.ts:17,28,33,40,45,51` | Mocks `sveltekit-superforms`, `svelte-sonner`, `$lib/paraglide/messages`, `$lib/stores`, `$lib/utils`, `radashi` | Six modules | The `sveltekit-superforms` mock is the most damaging — it replaces `superValidate` with a no-op, so the signup-form validation pipeline is never tested. |
| `src/lib/components/login/verify.test.ts:5` | `vi.mock('wait-for-the-element')` | Polling utility | Fine — not HTTP. |
| `src/lib/components/search/congregations.test.ts:9,46,49` | `vi.mock('radashi')`, `vi.mock('$lib/search')`, `vi.mock('$lib/location')` | Search and Location classes | Mocking the classes under test defeats the purpose. |
| `src/lib/components/search/map.test.ts:5` | `vi.mock('svelte-maplibre')` | MapLibre components | WebGL not available in jsdom. Keep — but consider Vitest browser mode. |
| `src/test/server/*.test.ts` (6 files) | `vi.mock('sveltekit-superforms')` | `superValidate`, `setError` | **Most damaging pattern.** Every server-route test mocks `sveltekit-superforms`, so the real validation pipeline — where the captcha-bypass bug lives — is never tested. |

#### Stubs and helpers

| File | Purpose |
|---|---|
| `src/test/testUtils.ts` | `createMockRequestEvent`, `createMockServerLoadEvent`, `mockSveltekitSuperforms`, `makeMockFormProps`. These hand-build SvelteKit `RequestEvent` objects and `superForm` returns. |
| `src/test/stubs/` | `body-scroll-lock.svelte.js`, `fake-search.ts`, `fake-location.ts`, `formsnap.js`, `sveltekit-superforms.js`, `bits-ui.js`, `primitives/*.svelte`, `components/ui/*.svelte` — full stub implementations of UI libraries. |
| `src/test/mocks/` | `$env/dynamic/{private,public}.js`, `$env/static/{private,public}.js`, `$app/{navigation,environment,index,stores}.js`, `$lib_server_logger.js`, `sveltekit-superforms.js`, `assets/*` — module-level mocks for SvelteKit runtime and assets. |
| `src/test/components/*.svelte` | Host components for testing segments (e.g., `CongregationHost.svelte` wraps the congregation segment with test-controlled props). |

### 1.2 What MSW Replaces vs. Keeps

MSW mocks at the HTTP level. It does NOT replace:

- Module-level mocks for non-HTTP concerns (`svelte-sonner` toasts, `svelte-copy`, `body-scroll-lock`, SVG imports, paraglide messages, UI component stubs for jsdom-incompatible libraries).
- The `cookie` package mock (it's a pure-JS parser, not HTTP).
- The `nodemailer` module mock (nodemailer speaks SMTP, not HTTP — though we can use a mock SMTP server like Nodemailer's built-in stub, see §3.5).
- The `Element.animate` and `URL.createObjectURL` polyfills (DOM API gaps in jsdom).
- SvelteKit runtime module mocks — BUT these can be removed by switching to the `@sveltejs/kit/vitest` plugin which provides the real SvelteKit runtime in tests. This is a separate concern from MSW but should be done in the same migration.

MSW DOES replace:

- All `vi.mock('pocketbase')` calls — the real PocketBase SDK runs, and MSW intercepts its HTTP calls to the PB server.
- All hand-built `makeApiStub()` patterns in server-route tests.
- The captcha validation's real HTTP call to the Cap service.
- PostHog's real HTTP calls.
- The `public-ip` library's real DNS-over-HTTPS calls.
- Any future HTTP calls (OSM Nominatim/Overpass from the OSM migration plan; payment APIs if the business-type expansion adds them).

### 1.3 The PocketBase HTTP Surface

To mock PocketBase with MSW, we need to know the exact HTTP surface the PocketBase JS SDK uses. Based on the [PocketBase JS SDK source](https://github.com/pocketbase/pocketbase-js) and the codebase's usage:

**Base URL:** `env.PUBLIC_API_ENDPOINT` (e.g., `http://localhost:8090`).

**Endpoints used by this codebase (verified by grepping `api.collection(...)` calls):**

| Method & Path | SDK Method | Used In | Purpose |
|---|---|---|---|
| `GET /api/collections/{collection}/records?filter=...&expand=...` | `getFullList`, `getList` | `+layout.server.ts` (countries), `+page.server.ts` (congregations), `contact/+page.server.ts` (congregations), `location.ts` (states, cities) | List records |
| `GET /api/collections/{collection}/records/{id}` | `getOne` | `edit/+page.server.ts` (congregation), `mail.ts` (congregationMeta for email body) | Single record |
| `GET /api/collections/{collection}/records?filter=...` (first page, 1 item) | `getFirstListItem` | `+page.server.ts` (pages by slug), `edit/+page.server.ts` (congregation by id), `login/+page.server.ts` (user by email) | Single record by filter |
| `POST /api/collections/{collection}/records` | `create` | `add/+page.server.ts` (congregation + children), `login/+page.server.ts` (signup) | Create record |
| `PATCH /api/collections/{collection}/records/{id}` | `update` | `edit/+page.server.ts` (congregation + children), `login/+page.server.ts` (profile), `user/lang/+server.ts` | Update record |
| `DELETE /api/collections/{collection}/records/{id}` | `delete` | `edit/+page.server.ts` (delete action, children) | Delete record |
| `POST /api/collections/users/auth-with-password` | `authWithPassword` | `login/+page.server.ts` | Login |
| `POST /api/collections/users/auth-refresh` | `authRefresh` | `hooks.server.ts` (every authenticated request!), `api.ts` (authenticate) | Refresh auth token |
| `POST /api/collections/users/request-password-reset` | `requestPasswordReset` | `login/+page.server.ts` | Request reset |
| `POST /api/collections/users/confirm-password-reset` | `confirmPasswordReset` | `login/+page.server.ts` | Confirm reset |
| `POST /api/collections/users/request-verification` | `requestVerification` | `login/+page.server.ts` | Request email verification |
| `POST /api/collections/users/confirm-verification` | `confirmVerification` | `login/+page.server.ts` | Confirm email |
| `POST /api/batch` | `createBatch().send()` | `add/+page.server.ts`, `edit/+page.server.ts` | Batch operations |

**Other HTTP surfaces to mock:**

| Service | Endpoint | Used In |
|---|---|---|
| Cap (captcha) | `POST {PUBLIC_CAPTCHA_ENDPOINT}/{siteKey}/siteverify` | `src/lib/server/utils.ts:27` |
| PostHog | `POST {PUBLIC_POSTHOG_HOST}/capture/` (and `/decide/`, `/e/`) | `src/lib/server/posthog.ts`, `src/lib/posthog.ts` |
| public-ip | `GET https://discovery.googleapis.com/v1/apis/...` (DNS-over-HTTPS via OpenDNS/Google) | `src/hooks.server.ts:33` |
| Mailpit (test-only) | `GET/DELETE http://localhost:8025/api/v1/messages` | `src/lib/server/mail.test.ts` (currently `describe.skip`) |

---

## 2. Target Architecture (To-Be)

### 2.1 Directory Structure

```
src/
├── mocks/                          # NEW — MSW layer
│   ├── handlers/                   # Declarative handler files grouped by domain
│   │   ├── index.ts                # Combines all handlers
│   │   ├── pocketbase/
│   │   │   ├── index.ts            # Combines PB handlers
│   │   │   ├── congregations.ts    # /api/collections/congregations/* and /api/collections/congregationMeta/*
│   │   │   ├── users.ts            # /api/collections/users/* (auth, CRUD)
│   │   │   ├── pages.ts            # /api/collections/pages/*
│   │   │   ├── countries.ts        # /api/collections/countries/*
│   │   │   ├── states.ts           # /api/collections/states/*
│   │   │   ├── cities.ts           # /api/collections/cities/*
│   │   │   ├── accessibility.ts    # /api/collections/accessibility/*
│   │   │   ├── fit.ts              # /api/collections/fit/*
│   │   │   ├── health.ts           # /api/collections/health/*
│   │   │   ├── registration.ts     # /api/collections/registration/*
│   │   │   ├── security.ts         # /api/collections/security/*
│   │   │   ├── services.ts         # /api/collections/services/*
│   │   │   └── batch.ts            # /api/batch
│   │   ├── captcha.ts              # Cap siteverify
│   │   ├── posthog.ts              # PostHog capture/decide
│   │   ├── public-ip.ts            # public-ip DNS-over-HTTPS
│   │   └── mailpit.ts              # Mailpit API (for mail.test.ts)
│   ├── data/                       # Fixture data shared across handlers
│   │   ├── congregations.ts        # Array of congregation fixtures
│   │   ├── users.ts                # User fixtures
│   │   ├── pages.ts                # Static page fixtures
│   │   ├── locations.ts            # Country/state/city fixtures
│   │   └── index.ts                # Combines all fixtures
│   ├── node.ts                     # setupServer(...handlers) for Vitest Node
│   ├── browser.ts                  # setupWorker(...handlers) for Vitest browser + dev
│   └── README.md                   # How to add/update handlers
├── test/
│   ├── setupTest.ts                # REFACTORED — starts MSW server, removes most vi.mocks
│   ├── testUtils.ts                # REFACTORED — remove makeApiStub, keep createMockRequestEvent
│   └── ...
```

### 2.2 Handler Structure (Per MSW Best Practices)

Per the [MSW structuring handlers guide](https://mswjs.io/docs/best-practices/structuring-handlers): handlers describe **happy paths** in the `handlers/` files. Error states and edge cases are added per-test via `server.use(...)` runtime overrides. This keeps the default mock layer simple and lets individual tests opt into specific failure scenarios.

Example handler file:

```typescript
// src/mocks/handlers/pocketbase/congregations.ts
import { http, HttpResponse, delay } from 'msw';
import { congregations } from '../../data/congregations';

const PB_BASE = 'http://localhost:8090';

export const congregationHandlers = [
  // GET /api/collections/congregationMeta/records — list congregations (the view)
  http.get(`${PB_BASE}/api/collections/congregationMeta/records`, ({ request }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') ?? '';
    const page = parseInt(url.searchParams.get('page') ?? '1', 10);
    const perPage = parseInt(url.searchParams.get('perPage') ?? '50', 10);

    let items = congregations;
    // Honor the visible filter for non-admins
    if (filter.includes('visible=1')) {
      items = items.filter((c) => c.visible);
    }

    return HttpResponse.json({
      page,
      perPage,
      totalItems: items.length,
      totalPages: Math.ceil(items.length / perPage),
      items: items.slice((page - 1) * perPage, page * perPage)
    });
  }),

  // GET /api/collections/congregationMeta/records/{id} — single congregation
  http.get(`${PB_BASE}/api/collections/congregationMeta/records/:id`, ({ params }) => {
    const cong = congregations.find((c) => c.id === params.id);
    if (!cong) {
      return HttpResponse.json(
        { code: 404, message: "The resource wasn't found.", data: {} },
        { status: 404 }
      );
    }
    return HttpResponse.json(cong);
  }),

  // POST /api/collections/congregations/records — create
  http.post(`${PB_BASE}/api/collections/congregations/records`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newCong = {
      id: 'rec_' + Math.random().toString(36).slice(2, 17),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      collectionId: 'congregations',
      collectionName: 'congregations',
      ...body
    };
    congregations.push(newCong);
    return HttpResponse.json(newCong, { status: 200 });
  }),

  // PATCH /api/collections/congregations/records/{id} — update
  http.patch(`${PB_BASE}/api/collections/congregations/records/:id`, async ({ params, request }) => {
    const idx = congregations.findIndex((c) => c.id === params.id);
    if (idx === -1) {
      return HttpResponse.json(
        { code: 404, message: "The resource wasn't found.", data: {} },
        { status: 404 }
      );
    }
    const body = await request.json() as Record<string, unknown>;
    congregations[idx] = { ...congregations[idx], ...body, updated: new Date().toISOString() };
    return HttpResponse.json(congregations[idx]);
  }),

  // DELETE /api/collections/congregations/records/{id} — delete
  http.delete(`${PB_BASE}/api/collections/congregations/records/:id`, ({ params }) => {
    const idx = congregations.findIndex((c) => c.id === params.id);
    if (idx === -1) {
      return HttpResponse.json(
        { code: 404, message: "The resource wasn't found.", data: {} },
        { status: 404 }
      );
    }
    congregations.splice(idx, 1);
    return HttpResponse.json({ acknowledge: true });
  })
];
```

### 2.3 The Index File

```typescript
// src/mocks/handlers/index.ts
import { congregationHandlers } from './pocketbase/congregations';
import { userHandlers } from './pocketbase/users';
import { pageHandlers } from './pocketbase/pages';
import { locationHandlers } from './pocketbase/locations';
import { childTableHandlers } from './pocketbase/child-tables';
import { batchHandlers } from './pocketbase/batch';
import { captchaHandlers } from './captcha';
import { posthogHandlers } from './posthog';
import { publicIpHandlers } from './public-ip';
import { mailpitHandlers } from './mailpit';

export const handlers = [
  ...congregationHandlers,
  ...userHandlers,
  ...pageHandlers,
  ...locationHandlers,
  ...childTableHandlers,
  ...batchHandlers,
  ...captchaHandlers,
  ...posthogHandlers,
  ...publicIpHandlers,
  ...mailpitHandlers
];
```

### 2.4 Node Setup (for Vitest)

```typescript
// src/mocks/node.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### 2.5 Browser Setup (for dev mode + Vitest browser mode)

```typescript
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

The worker is registered in the browser only when `dev` is true AND a `?mock` query param is present (or a localStorage flag is set). This lets developers opt into mocked-HTTP mode for local dev without affecting production.

### 2.6 Setup File Integration

The refactored `src/test/setupTest.ts`:

```typescript
// src/test/setupTest.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from '../mocks/node';

// Start MSW server before all tests
beforeAll(() => server.listen({
  onUnhandledRequest: (req) => {
    // In tests, unhandled requests are errors — forces every test to mock what it uses
    console.error('Unhandled request:', req.method, req.url);
    throw new Error(`Unhandled request: ${req.method} ${req.url}`);
  }
}));

// Reset handlers after each test for isolation
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Close server after all tests
afterAll(() => server.close());

// === KEEP: non-HTTP mocks and polyfills ===

// Element.animate polyfill (jsdom gap)
const { prototype } = Element;
if (typeof window !== 'undefined' && !prototype.animate) {
  // @ts-expect-error test polyfill
  prototype.animate = function () {
    return { cancel: () => {}, finished: Promise.resolve(), pause: () => {}, play: () => {} };
  };
}

// URL.createObjectURL polyfill (jsdom gap)
// ... (keep existing)

// svelte-sonner, svelte-copy, paraglide messages, SVG imports — all kept (not HTTP)

// === REMOVE: these are replaced by MSW or by @sveltejs/kit/vitest ===

// vi.mock('$app/navigation')  — REMOVED, use @sveltejs/kit/vitest
// vi.mock('$app/environment') — REMOVED, use @sveltejs/kit/vitest
// vi.mock('$app/state')       — REMOVED, use @sveltejs/kit/vitest
// vi.mock('cookie')           — KEPT (pure JS parser, not HTTP)
// vi.mock('nodemailer')       — KEPT (SMTP, not HTTP) OR replaced with mock SMTP server
```

### 2.7 The `@sveltejs/kit/vitest` Plugin

Concurrent with the MSW migration, replace the manual `$app/*` mocks with the official SvelteKit Vitest plugin. This provides the real SvelteKit runtime (`$app/navigation`, `$app/environment`, `$app/state`, `$app/stores`) in tests.

```typescript
// vite.config.ts (updated)
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    sveltekit(),  // This now includes the Vitest plugin in SvelteKit 2.5+
    // ...
  ],
  test: {
    setupFiles: ['./src/test/setupTest.ts'],
    // ...
  }
});
```

This removes ~80 lines of hand-rolled mocks from `setupTest.ts` and ensures the SvelteKit runtime in tests matches production.

---

## 3. Design Decisions

### 3.1 Why MSW v2 (not v1)

MSW v2 is the current major version (released 2023). v1 is in maintenance. Per the [MSW migration guide](https://mswjs.io/docs/migrations/1.x-to-2.x), v2 has:
- Standard `Request`/`Response` objects (no more custom `req`/`res` shapes).
- Better TypeScript support.
- Cleaner handler API (`http.get(url, resolver)` instead of `rest.get(url, resolver)`).
- Native WebSocket and SSE mocking.

The codebase has no existing MSW dependency, so we start fresh on v2.

### 3.2 Why `onUnhandledRequest: 'error'`

The MSW docs recommend `'error'` for tests. This means any HTTP request without a matching handler throws. This is **stricter than the current behavior** (where unhandled requests silently pass through to the real network), but it's the right default because:

1. It forces every test to explicitly mock what it uses — no hidden network dependencies.
2. It catches the case where a code change adds a new HTTP call but no handler for it.
3. It prevents tests from accidentally hitting real services (Cap, PostHog, PocketBase) during CI.

For dev mode (`worker.start()`), use `'warn'` instead — developers don't want a hard error when they're iterating.

### 3.3 Why Intercept at HTTP Level, Not SDK Level

The current approach mocks the PocketBase SDK at the module level (`vi.mock('pocketbase')`). MSW mocks at the HTTP level — the real PocketBase SDK runs, makes real HTTP calls, and MSW intercepts them.

**Advantages of HTTP-level mocking:**
- Real PB SDK behavior is exercised: filter string parsing, auth refresh, batch operations, error handling, expand syntax.
- The filter-injection bug (S-5 from code review) becomes visible — a test that submits a malformed filter can assert the response.
- Tests don't need to be updated when PB SDK internals change (e.g., if PB changes how it paginates, the mock handler changes, not every test).

**Disadvantages:**
- The handler files must replicate the PB API surface accurately. If PB returns a field the handler doesn't, the test breaks. Mitigation: generate handler stubs from the PB schema (Phase 4).
- Slightly more setup than a module mock. Worth it for the fidelity.

### 3.4 Why Handler Files Grouped by Collection

Per MSW best practices, handlers should be grouped by domain, not by HTTP method or by test file. Grouping by PB collection means:
- Adding a new collection (e.g., `osm_places` from the OSM migration) = adding one new handler file.
- A bug in one collection's mock doesn't affect others.
- Handlers are reusable across test files — the `congregations` handler is used by every test that touches congregations.

### 3.5 Nodemailer: Module Mock vs. SMTP Mock

Nodemailer speaks SMTP, not HTTP. MSW can't intercept SMTP. Three options:

**Option A: Keep the `vi.mock('nodemailer')` module mock.**
- Pros: Simple, already works.
- Cons: Doesn't test the real `createTransport`/`sendMail` pipeline. The `transporter.verify()` call in `mail.ts` is mocked away.

**Option B: Use Nodemailer's built-in stub transport.**
- `nodemailer.createTransport({ streamTransport: true, jsonTransport: true })` — captures emails in memory without sending.
- Pros: Tests the real `createTransport`/`sendMail` API. Emails are inspectable.
- Cons: Requires injection — the production code creates the transport with hardcoded options, so tests can't swap it without refactoring `mail.ts` to accept a transport.

**Option C: Run a real Mailpit instance in CI (already done in e2e).**
- Pros: Truest end-to-end.
- Cons: Requires Docker in CI for unit tests. Currently `mail.test.ts` is `describe.skip`'d for this reason.

**Recommendation:** Option A for the MSW migration (keep the existing module mock). Option B as a fast-follow refactor — extract the transport creation into a factory function, inject it in tests, use the stub transport. This is a small change to `mail.ts` but not blocking for MSW.

### 3.6 The `public-ip` Library

`publicIp()` calls DNS-over-HTTPS endpoints (Google DNS, OpenDNS). MSW can intercept these:

```typescript
// src/mocks/handlers/public-ip.ts
import { http, HttpResponse } from 'msw';

export const publicIpHandlers = [
  // Google DNS JSON API
  http.get('https://dns.google/resolve', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('name') === 'myip.opendns.com') {
      return HttpResponse.json({
        Status: 0,
        Answer: [{ name: 'myip.opendns.com.', type: 1, TTL: 60, data: '203.0.113.42' }]
      });
    }
    return HttpResponse.json({ Status: 0, Answer: [] });
  }),
  // OpenDNS DNS-over-HTTPS (if public-ip uses it)
  http.get('https://doh.opendns.com/dns-query', () => {
    return new HttpResponse('placeholder', { status: 200, headers: { 'content-type': 'application/dns-message' } });
  })
];
```

This makes `clientIp` deterministic in tests — always `203.0.113.42` (TEST-NET-3, reserved for documentation).

### 3.7 Captcha Mock

```typescript
// src/mocks/handlers/captcha.ts
import { http, HttpResponse } from 'msw';

const CAPTCHA_ENDPOINT = 'http://localhost:3001';

export const captchaHandlers = [
  http.post(`${CAPTCHA_ENDPOINT}/:siteKey/siteverify`, async ({ request }) => {
    const body = await request.json() as { response: string; secret: string };
    // Default: success. Tests can override with server.use() to return failure.
    return HttpResponse.json({
      success: true,
      challenge_ts: new Date().toISOString(),
      hostname: 'localhost'
    });
  })
];
```

Tests for the captcha-bypass bug (S-1) can now override this handler to return `{ success: false }` and verify that the form action correctly rejects the submission.

### 3.8 PostHog Mock

PostHog's Node SDK and browser SDK both make HTTP calls. Mock them:

```typescript
// src/mocks/handlers/posthog.ts
import { http, HttpResponse } from 'msw';

const POSTHOG_HOST = 'https://test.posthog.com';

export const posthogHandlers = [
  // Capture endpoint
  http.post(`${POSTHOG_HOST}/capture/`, () => HttpResponse.json({ status: 1 })),
  // Decide endpoint (feature flags)
  http.post(`${POSTHOG_HOST}/decide/`, () => HttpResponse.json({ config: {}, featureFlags: {} })),
  // Batch endpoint (browser SDK)
  http.post(`${POSTHOG_HOST}/e/`, () => HttpResponse.json({ status: 1 })),
];
```

This eliminates the `console.warn` noise from PostHog in tests and makes capture calls deterministic.

### 3.9 Browser Worker for Dev Mode

Optional but valuable: register the MSW worker in dev mode so developers can run the app without a real PocketBase. This is gated behind a query param (`?mock`) or localStorage flag to avoid affecting normal dev.

```typescript
// src/hooks.server.ts (addition, only in dev)
// OR src/routes/+layout.ts
if (dev && browser && url.searchParams.has('mock')) {
  const { worker } = await import('$lib/mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}
```

This lets developers:
- Test the UI without spinning up PocketBase.
- Reproduce bug reports by sharing mock data files.
- Demo the app without backend dependencies.

Not required for the testing migration, but a high-value side benefit.

---

## 4. Phase-by-Phase Migration Plan

Each phase is a separately reviewable PR. Each phase leaves the test suite in a working state. Each phase has a rollback.

### Phase 0: Install MSW and set up infrastructure (1 day)

**Goal:** Add MSW as a dependency, create the directory structure, write the `node.ts` and `browser.ts` setup files, wire the MSW server into `setupTest.ts` alongside existing mocks. No existing tests are changed yet.

#### Tasks

0.1 **Install MSW:**
   ```bash
   pnpm add -D msw
   ```

0.2 **Generate the browser worker script:**
   ```bash
   pnpm exec msw init static/ --save
   ```
   This creates `static/mockServiceWorker.js`, which SvelteKit serves as a static asset. Add it to `.gitignore`? No — it should be committed (it's a generated file that doesn't change often).

0.3 **Create the directory structure** per §2.1.

0.4 **Write `src/mocks/handlers/index.ts`** as an empty array (no handlers yet):
   ```typescript
   export const handlers: never[] = [];
   ```

0.5 **Write `src/mocks/node.ts`:**
   ```typescript
   import { setupServer } from 'msw/node';
   import { handlers } from './handlers';
   export const server = setupServer(...handlers);
   ```

0.6 **Write `src/mocks/browser.ts`:**
   ```typescript
   import { setupWorker } from 'msw/browser';
   import { handlers } from './handlers';
   export const worker = setupWorker(...handlers);
   ```

0.7 **Update `src/test/setupTest.ts`** to start/stop the MSW server:
   ```typescript
   import { server } from '../mocks/node';
   
   beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));  // 'bypass' for now — existing vi.mocks handle everything
   afterEach(() => server.resetHandlers());
   afterAll(() => server.close());
   ```
   Note: `onUnhandledRequest: 'bypass'` for Phase 0 — existing `vi.mock`s prevent real HTTP calls, so MSW seeing zero requests is expected. Phase 1+ will tighten this.

0.8 **Verify the test suite still runs** (or fails the same way it did before, due to the `@testing-library/svelte` issue — MSW shouldn't make it worse).

#### Deliverables
- MSW installed.
- Directory structure in place.
- Empty handler index.
- Server wired into setup with `bypass` mode.

#### Rollback
`pnpm remove msw`. Delete `src/mocks/`. Revert `setupTest.ts`.

---

### Phase 1: Mock PocketBase auth + congregations (2–3 days)

**Goal:** Replace `vi.mock('pocketbase')` in the server-route tests with MSW handlers for the congregations and users (auth) collections. This is the highest-value phase — it makes the server-route tests exercise real PocketBase SDK behavior.

#### Tasks

1.1 **Write fixture data** in `src/mocks/data/`:
   - `users.ts`: 3 user fixtures (admin, regular user, unverified).
   - `congregations.ts`: 5 congregation fixtures (visible, hidden, owned by user A, owned by user B, online-only).
   - `pages.ts`: 2 page fixtures (home-en, add-en).
   - `locations.ts`: 3 countries, 5 states, 10 cities (small subset for testing).

1.2 **Write `src/mocks/handlers/pocketbase/users.ts`** — handlers for:
   - `POST /api/collections/users/auth-with-password` — returns a token + user record (or 401).
   - `POST /api/collections/users/auth-refresh` — returns a new token.
   - `POST /api/collections/users/request-password-reset` — returns 200.
   - `POST /api/collections/users/confirm-password-reset` — returns 200 (or 400 on bad token).
   - `POST /api/collections/users/request-verification` — returns 200.
   - `POST /api/collections/users/confirm-verification` — returns 200 (or 400).
   - `POST /api/collections/users/records` — create user (signup).
   - `PATCH /api/collections/users/records/:id` — update user (e.g., lang).
   - `GET /api/collections/users/records?filter=...` — list users (for transfer action).

1.3 **Write `src/mocks/handlers/pocketbase/congregations.ts`** — handlers for:
   - `GET /api/collections/congregationMeta/records` — list (with filter support).
   - `GET /api/collections/congregationMeta/records/:id` — single.
   - `POST /api/collections/congregations/records` — create.
   - `PATCH /api/collections/congregations/records/:id` — update.
   - `DELETE /api/collections/congregations/records/:id` — delete.

1.4 **Write `src/mocks/handlers/pocketbase/pages.ts`** — handlers for `GET /api/collections/pages/records?filter=slug=...`.

1.5 **Write `src/mocks/handlers/pocketbase/locations.ts`** — handlers for countries/states/cities list endpoints.

1.6 **Write `src/mocks/handlers/pocketbase/batch.ts`** — handler for `POST /api/batch`. This is critical: the batch endpoint receives an array of sub-requests, executes them in order, and returns an array of responses. The handler must parse the batch body, route each sub-request to the appropriate handler, and aggregate responses. See [PocketBase batch docs](https://pocketbase.io/docs/api-records#batch-create-update-upsert-delete).

1.7 **Tighten `onUnhandledRequest`** to `'warn'` in setup. Existing `vi.mock`s still handle non-PB modules.

1.8 **Migrate `src/test/server/routes.server.test.ts`** as the first test file:
   - Remove `makeApiStub()`.
   - Remove `vi.mock('sveltekit-superforms')` for the parts that touch PB (keep for form validation if needed in Phase 2).
   - The test's `load` call now hits the real `api.collection('congregationMeta').getFullList()`, which MSW intercepts.
   - Assert the returned congregations match the fixtures.

1.9 **Migrate the rest of `src/test/server/*.test.ts`** one by one:
   - `add.page.server.test.ts` — submit action now creates a real PB record via MSW.
   - `edit.page.server.test.ts` — load + submit + delete + transfer all via MSW.
   - `login.page.server.test.ts` — auth flows via MSW.
   - `contact.page.server.test.ts` — congregation list via MSW.
   - `layout.server.test.ts` — countries via MSW.
   - `routes.page.server.test.ts` — pages via MSW.

1.10 **Migrate `src/lib/api.test.ts` and `src/lib/server/api.test.ts`:**
   - Remove `vi.mock('pocketbase')`.
   - The `authenticate`, `handleError`, `loadUser`, `cleanResponse`, `expand` functions now run against MSW-intercepted HTTP.

#### Deliverables
- PB auth + congregations + pages + locations + batch handlers in place.
- All 8 server-route test files migrated to MSW.
- `vi.mock('pocketbase')` removed from the codebase.
- `makeApiStub()` removed from `testUtils.ts`.

#### Rollback
Revert to `vi.mock('pocketbase')`. The MSW handlers can stay (they're inert if no test uses them).

#### Risk
The batch handler is the most complex piece. PocketBase's batch endpoint has specific request/response shapes. If the handler gets it wrong, every add/edit/delete test breaks. Mitigation: start with a minimal batch handler that supports only the operations used in tests (create, update, delete on the 6 child tables + congregations). Extend as needed.

---

### Phase 2: Mock captcha, PostHog, public-ip (1–2 days)

**Goal:** Replace real HTTP calls to external services with MSW handlers. Tests become fully deterministic and never hit real services.

#### Tasks

2.1 **Write `src/mocks/handlers/captcha.ts`** per §3.7.

2.2 **Write `src/mocks/handlers/posthog.ts`** per §3.8.

2.3 **Write `src/mocks/handlers/public-ip.ts`** per §3.6.

2.4 **Write a test for the captcha-bypass bug (S-1):**
   ```typescript
   // src/lib/server/utils.test.ts (NEW)
   import { describe, it, expect } from 'vitest';
   import { server } from '../../mocks/node';
   import { http, HttpResponse } from 'msw';
   import { validateCaptcha } from './utils';

   describe('validateCaptcha', () => {
     it('returns true when captcha service says success', async () => {
       const form = { data: { captcha: 'valid-token' } } as any;
       const result = await validateCaptcha(form);
       expect(result).toBe(true);
     });

     it('returns false when captcha service says failure', async () => {
       server.use(
         http.post('http://localhost:3001/:key/siteverify', () =>
           HttpResponse.json({ success: false })
         )
       );
       const form = { data: { captcha: 'invalid-token' } } as any;
       const result = await validateCaptcha(form);
       expect(result).toBe(false);
     });

     it('throws when captcha is not configured', async () => {
       // Override env to empty
       // ...
     });
   });
   ```
   This test would have caught S-1 before it shipped.

2.5 **Tighten `onUnhandledRequest`** to `'error'`. Now every HTTP call must have a handler. Fix any remaining unhandled requests (likely a few PostHog or captcha calls in tests that don't explicitly mock them).

#### Deliverables
- Captcha, PostHog, public-ip handlers.
- `validateCaptcha` test that would have caught S-1.
- `onUnhandledRequest: 'error'` enforced.

#### Rollback
Revert to `'warn'`. Keep the handlers (inert if not used).

---

### Phase 3: Remove SvelteKit runtime mocks (1–2 days)

**Goal:** Replace the hand-rolled `$app/navigation`, `$app/environment`, `$app/state` mocks with the official `@sveltejs/kit/vitest` plugin.

#### Tasks

3.1 **Verify SvelteKit version** supports the Vitest plugin (SvelteKit 2.5+). The repo is on 2.47.1, so yes.

3.2 **Update `vite.config.ts`** to use the SvelteKit Vitest plugin (already imported as `sveltekit()` — verify it's enabled for tests).

3.3 **Remove from `setupTest.ts`:**
   - `vi.mock('$app/navigation')` (lines 80–86)
   - `vi.mock('$app/environment')` (lines 116–119)
   - `vi.mock('$app/state')` (lines 124–171)

3.4 **Remove from `src/test/mocks/$app/`** — the entire directory is no longer needed.

3.5 **Run tests, fix failures.** The real SvelteKit runtime behaves slightly differently from the mocks (e.g., `page` store updates are async, `goto` returns a Promise that resolves after navigation). Tests that depended on the mocks' synchronous behavior will need `await tick()` or `await waitFor()`.

3.6 **Update `src/test/testUtils.ts`** — `createMockRequestEvent` and `createMockServerLoadEvent` may still be needed (they construct the event object passed to load/actions), but they should use the real SvelteKit types where possible.

#### Deliverables
- 3 `vi.mock` calls removed.
- `src/test/mocks/$app/` directory deleted.
- Real SvelteKit runtime in tests.

#### Rollback
Re-add the mocks. The SvelteKit plugin can coexist with them (the mocks take precedence).

#### Risk
Tests that depended on the mocks' specific behavior (e.g., the `$app/state` mock's synchronous store updates) may break. Mitigation: run the full suite, fix failures one by one. Most fixes are adding `await tick()` or `await waitFor()`.

---

### Phase 4: Migrate component tests (2–3 days)

**Goal:** Component tests (in `src/lib/components/`) currently mock `$lib/search`, `$lib/location`, `sveltekit-superforms`, etc. Migrate them to use MSW for the HTTP parts, keeping only the non-HTTP mocks.

#### Tasks

4.1 **Audit each component test file** to identify which mocks are HTTP-related (replace with MSW) vs. UI-related (keep).

   | Test file | HTTP-related mocks (→ MSW) | UI mocks (keep) |
   |---|---|---|
   | `congregations.test.ts` | `$lib/search` (calls PB), `$lib/location` (calls PB) | `radashi` (partial) |
   | `map.test.ts` | `svelte-maplibre` (WebGL) | keep |
   | `location.test.ts` | `$lib/location` | — |
   | `filters.test.ts` | `$lib/search` | — |
   | `tile.test.ts` | — | paraglide messages |
   | `congregation.test.ts` | — | paraglide messages |
   | `form/*.test.ts` | `sveltekit-superforms` | paraglide, svelte-sonner |
   | `form/segments/*.test.ts` | `sveltekit-superforms` | paraglide |
   | `login/*.test.ts` | `sveltekit-superforms` | paraglide, svelte-sonner |
   | `global/*.test.ts` | `sveltekit-superforms` (contact form) | paraglide, svelte-sonner, svelte-copy |

4.2 **For tests that mock `$lib/search` or `$lib/location`:** these classes make PB calls internally. Two options:
   - **Option A (preferred):** Remove the class mock, let the real class run, MSW intercepts its PB calls. The test provides fixture data via MSW handlers.
   - **Option B:** Keep the class mock if the test is specifically testing the component's UI, not the class's data flow. Use the existing `FakeSearch` stub.
   
   Recommendation: Option A for integration-style component tests, Option B for pure-UI tests.

4.3 **For tests that mock `sveltekit-superforms`:** the `superForm` and `superValidate` functions don't make HTTP calls directly — they process form data. The HTTP call happens when the form is submitted (the SvelteKit action is invoked). For component tests that just render a form and assert UI, the mock is fine. For tests that submit the form and assert the response, MSW should intercept the action's HTTP call (which is the form POST to the SvelteKit server, not directly to PB).
   
   SvelteKit form actions are invoked via `POST /?/actionName` (the form's `action` attribute). MSW can intercept these, but it's cleaner to let SvelteKit's `enhance` handle the submission and mock the underlying PB calls.
   
   Recommendation: Keep `sveltekit-superforms` mock for pure-UI component tests. For integration tests, use the real `superForm` and let MSW intercept PB calls.

4.4 **Migrate component tests one by one**, starting with the simplest (e.g., `tile.test.ts`) and working up to the complex (`congregations.test.ts`).

#### Deliverables
- Component tests use MSW for HTTP, real SvelteKit runtime for navigation/state.
- Pure-UI mocks (paraglide, svelte-sonner) retained.

#### Rollback
Revert individual test files. MSW handlers stay.

#### Risk
Component tests are the most fragile (jsdom + Svelte 5 + bits-ui). The `@testing-library/svelte` incompatibility (T-1 from code review) may block this phase. Mitigation: fix the `@testing-library/svelte` version first (upgrade to a Svelte 5.41-compatible version), then do this phase.

---

### Phase 5: Dev-mode browser worker (1 day, optional)

**Goal:** Register the MSW worker in dev mode so developers can run the app without a real PocketBase.

#### Tasks

5.1 **Update `src/routes/+layout.ts`** (or `src/hooks.client.ts`):
   ```typescript
   import { dev } from '$app/environment';
   import { browser } from '$app/environment';
   
   if (dev && browser && new URLSearchParams(location.search).has('mock')) {
     const { worker } = await import('$lib/mocks/browser');
     await worker.start({ onUnhandledRequest: 'bypass' });
   }
   ```

5.2 **Document in README:** "Add `?mock` to the URL to run the app with mocked data. Useful for testing UI changes without a backend."

5.3 **Add a dev-only toggle in the UI** (a small "Mock mode" indicator in the corner).

#### Deliverables
- Dev-mode mocking works via `?mock` query param.
- README updated.

#### Rollback
Remove the `?mock` block from `+layout.ts`. The worker file can stay in `static/`.

---

### Phase 6: Generate handlers from PB schema (1 day, optional)

**Goal:** Reduce manual handler maintenance by generating handler stubs from `pb_schema.json`.

#### Tasks

6.1 **Write a code generator** (`scripts/generate-msw-handlers.ts`) that:
   - Reads `pb_schema.json`.
   - For each collection, generates a handler file with the 5 CRUD endpoints.
   - Uses the schema's field definitions to generate TypeScript types for the fixture data.
   - Generates a default fixture (1 record per collection) as a starting point.

6.2 **Wire into `package.json`:**
   ```json
   "scripts": {
     "generate:mocks": "tsx scripts/generate-msw-handlers.ts"
   }
   ```

6.3 **Run after schema changes** (e.g., after the institution expansion plan's Phase 1).

#### Deliverables
- Generator script.
- `pnpm generate:mocks` command.
- Generated handler stubs (which developers then customize with fixture data).

#### Rollback
Delete the generated files. Hand-written handlers from earlier phases are unaffected.

---

## 5. Testing the Tests (Meta-Testing)

How do we know the MSW migration is correct? The mocks must faithfully represent the real APIs.

### 5.1 Contract Tests Against Real PocketBase

In CI, run a separate job that:
1. Spins up a real PocketBase (the e2e workflow already does this).
2. For each MSW handler, makes the same request to the real PB and to the MSW mock.
3. Asserts the response shapes match (fields present, types correct).

This catches drift between the mock and the real API.

### 5.2 The Captcha-Bypass Regression Test

The captcha-bypass bug (S-1) is the canonical example of a bug that the old mock architecture couldn't catch (because `sveltekit-superforms` was mocked, `validateCaptcha`'s return value was never checked). Phase 2.4 writes this test. If MSW is correctly configured, this test passes after the S-1 fix is applied and fails before.

### 5.3 Filter-Injection Regression Test

The filter-injection bug (S-5) is another canonical example. With MSW, write a test that calls `getFirstListItem('id="' || (1=1) || '"')` and asserts the response is an error (or doesn't leak data). With the old module-level PB mock, the filter string was never parsed — the mock just returned whatever the test setup said. With MSW, the handler actually parses the filter string (or at least echoes it back), so the test can verify the filter is rejected.

### 5.4 Unhandled-Request Coverage

With `onUnhandledRequest: 'error'`, any new HTTP call without a handler fails the test. This is itself a form of coverage — it ensures every HTTP dependency is explicitly mocked.

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| MSW handlers drift from real PB API | Medium | Medium (tests pass but don't reflect reality) | Contract tests in CI (§5.1). Regenerate handlers after PB upgrades. |
| Batch handler is too complex to mock correctly | Medium | High (add/edit/delete tests fail) | Start minimal (only the operations used in tests). Extend incrementally. |
| `onUnhandledRequest: 'error'` reveals hidden HTTP calls | High | Low (fix each one) | Expected and desirable. Each unhandled request is a test gap. |
| Component tests still broken due to `@testing-library/svelte` issue | High | Medium (Phase 4 blocked) | Fix `@testing-library/svelte` version first (code review T-1). |
| MSW worker doesn't load in dev mode (CSP, path issues) | Low | Low (dev-only feature) | Test in dev. Add CSP exception for `mockServiceWorker.js` if needed. |
| Test suite slower due to HTTP interception overhead | Low | Low | MSW is fast. If measurable, use `onUnhandledRequest: 'bypass'` for tests that don't need MSW. |
| Developers forget to update handlers when adding new endpoints | Medium | Medium (new endpoint untested) | CI job that checks for unhandled requests in the test suite. |
| SvelteKit Vitest plugin incompatible with existing config | Low | Medium (Phase 3 blocked) | Test on a branch first. Keep the old mocks as fallback. |

---

## 7. Rollback Strategy

### Phase 0 rollback
`pnpm remove msw`. Delete `src/mocks/`. Revert `setupTest.ts`.

### Phase 1 rollback
Re-add `vi.mock('pocketbase')` to the migrated test files. Keep the MSW handlers (inert if unused).

### Phase 2 rollback
Revert `onUnhandledRequest` to `'bypass'`. Keep the captcha/PostHog/public-ip handlers (inert).

### Phase 3 rollback
Re-add the `$app/*` mocks. The SvelteKit plugin can coexist.

### Phase 4 rollback
Revert individual test files. MSW handlers stay.

### Phase 5 rollback
Remove the `?mock` block. Worker file stays.

### Phase 6 rollback
Delete generated files. Hand-written handlers unaffected.

---

## 8. Timeline

| Phase | Duration | Dependency | Can parallelize? |
|---|---|---|---|
| Phase 0: Install + infrastructure | 1 day | None | — |
| Phase 1: PB auth + congregations | 2–3 days | Phase 0 | — |
| Phase 2: Captcha + PostHog + public-ip | 1–2 days | Phase 1 | Yes (with Phase 3) |
| Phase 3: Remove SvelteKit runtime mocks | 1–2 days | Phase 0 | Yes (with Phase 2) |
| Phase 4: Migrate component tests | 2–3 days | Phases 1, 2, 3 + `@testing-library/svelte` fix | — |
| Phase 5: Dev-mode browser worker | 1 day | Phase 1 | Yes (anytime after Phase 1) |
| Phase 6: Generate handlers from schema | 1 day | Phase 1 | Yes (anytime after Phase 1) |
| **Total (Phases 0–4)** | **7–11 days** | | |

With one engineer: ~2 weeks. The minimum viable improvement (Phases 0–2) is ~1 week and immediately makes server-route tests exercise real code paths.

**Prerequisite:** Fix the `@testing-library/svelte` ↔ Svelte 5 incompatibility (code review T-1) before Phase 4. Phases 0–3 can proceed without it (server-route tests don't need `@testing-library/svelte`).

---

## 9. Appendix A: Handler Examples

### A.1 PocketBase Auth (login)

```typescript
// src/mocks/handlers/pocketbase/users.ts
import { http, HttpResponse, delay } from 'msw';
import { users, findUserByEmail } from '../../data/users';

const PB = 'http://localhost:8090';

export const userHandlers = [
  // Login
  http.post(`${PB}/api/collections/users/auth-with-password`, async ({ request }) => {
    const body = await request.json() as { identity: string; password: string };
    const user = findUserByEmail(body.identity);
    
    if (!user || user.password !== body.password) {
      return HttpResponse.json(
        { code: 401, message: 'Failed to authenticate.', data: {} },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      token: 'mock-jwt-' + user.id,
      record: { ...user, password: undefined }
    });
  }),

  // Auth refresh
  http.post(`${PB}/api/collections/users/auth-refresh`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { code: 401, message: 'The request requires valid admin or record authorization token.', data: {} },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      token: 'mock-jwt-refreshed',
      record: users[0]  // simplified
    });
  }),

  // Signup
  http.post(`${PB}/api/collections/users/records`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newUser = {
      id: 'user_' + Math.random().toString(36).slice(2, 17),
      email: body.email,
      name: body.name,
      verified: false,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    users.push({ ...newUser, password: body.password });
    return HttpResponse.json(newUser);
  }),

  // Request password reset
  http.post(`${PB}/api/collections/users/request-password-reset`, () => {
    return HttpResponse.json({ acknowledge: true });
  }),

  // Confirm password reset
  http.post(`${PB}/api/collections/users/confirm-password-reset`, async ({ request }) => {
    const body = await request.json() as { token: string; password: string };
    if (!body.token || body.token === 'invalid') {
      return HttpResponse.json(
        { code: 400, message: 'Invalid or expired token.', data: {} },
        { status: 400 }
      );
    }
    return HttpResponse.json({ acknowledge: true });
  }),

  // Request verification
  http.post(`${PB}/api/collections/users/request-verification`, () => {
    return HttpResponse.json({ acknowledge: true });
  }),

  // Confirm verification
  http.post(`${PB}/api/collections/users/confirm-verification`, async ({ request }) => {
    const body = await request.json() as { token: string };
    if (!body.token || body.token === 'invalid') {
      return HttpResponse.json(
        { code: 400, message: 'Invalid or expired token.', data: {} },
        { status: 400 }
      );
    }
    return HttpResponse.json({ acknowledge: true });
  }),

  // Update user (e.g., lang change)
  http.patch(`${PB}/api/collections/users/records/:id`, async ({ params, request }) => {
    const idx = users.findIndex(u => u.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ code: 404, message: "Not found.", data: {} }, { status: 404 });
    }
    const body = await request.json() as Record<string, unknown>;
    users[idx] = { ...users[idx], ...body, updated: new Date().toISOString() };
    return HttpResponse.json({ ...users[idx], password: undefined });
  }),

  // List users (for transfer action)
  http.get(`${PB}/api/collections/users/records`, ({ request }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') ?? '';
    // Parse email="..." filter
    const match = filter.match(/email="([^"]+)"/);
    if (match) {
      const user = findUserByEmail(match[1]);
      return HttpResponse.json({
        page: 1, perPage: 1, totalItems: user ? 1 : 0, totalPages: 1,
        items: user ? [{ ...user, password: undefined }] : []
      });
    }
    return HttpResponse.json({
      page: 1, perPage: 50, totalItems: users.length, totalPages: 1,
      items: users.map(u => ({ ...u, password: undefined }))
    });
  })
];
```

### A.2 PocketBase Batch

```typescript
// src/mocks/handlers/pocketbase/batch.ts
import { http, HttpResponse } from 'msw';

const PB = 'http://localhost:8090';

export const batchHandlers = [
  http.post(`${PB}/api/batch`, async ({ request }) => {
    const body = await request.json() as {
      requests: Array<{
        method: string;
        url: string;
        body?: unknown;
        headers?: Record<string, string>;
      }>
    };

    const results = [];
    for (const subReq of body.requests) {
      // Reconstruct the sub-request and dispatch it through fetch (which MSW will intercept)
      const subRes = await fetch(`${PB}${subReq.url}`, {
        method: subReq.method,
        headers: { 'Content-Type': 'application/json', ...subReq.headers },
        body: subReq.body ? JSON.stringify(subReq.body) : undefined
      });
      const subBody = await subRes.json();
      results.push({
        status: subRes.status,
        body: subBody
      });
    }

    return HttpResponse.json({ results });
  })
];
```

This batch handler recursively dispatches each sub-request through `fetch`, which MSW intercepts and routes to the appropriate handler. This is elegant — the batch handler doesn't need to know about congregations or users; it just re-dispatches.

### A.3 Runtime Override for Error Testing

```typescript
// In a test file
import { server } from '../../mocks/node';
import { http, HttpResponse } from 'msw';

it('handles PB outage during congregation load', async () => {
  server.use(
    http.get('http://localhost:8090/api/collections/congregationMeta/records', () =>
      HttpResponse.json(
        { code: 503, message: 'Service unavailable.', data: {} },
        { status: 503 }
      )
    )
  );

  const result = await load({ fetch, locals: { api, captureException } });
  expect(result).toHaveProperty('status', 503);
});
```

This pattern — default happy-path handlers in `handlers/`, per-test error overrides via `server.use()` — is exactly what the MSW best-practices doc recommends.

---

## 10. Appendix B: Migration Checklist

For each test file migrated to MSW, verify:

- [ ] `vi.mock('pocketbase')` removed (if present).
- [ ] `makeApiStub()` removed (if present).
- [ ] Test uses real `api.collection(...).getFullList()` / `getOne()` / etc.
- [ ] MSW handlers return fixture data that matches the test's assertions.
- [ ] Error paths tested via `server.use()` runtime overrides.
- [ ] No real HTTP calls escape (verified by `onUnhandledRequest: 'error'`).
- [ ] Test is deterministic (no random data, no real network).
- [ ] Test runs in < 1 second.

---

## 11. Open Questions

1. **Nodemailer mock strategy.** Keep the module mock (Option A) or refactor `mail.ts` to inject the transport and use the stub transport (Option B)? **Recommendation:** Option A for the MSW migration. Option B as a separate refactor PR.

2. **Browser worker in dev mode.** Should `?mock` be enabled by default in dev, or opt-in? **Recommendation:** Opt-in. Developers with a running PB shouldn't have mocks intercept their requests.

3. **Contract tests against real PB.** Should these run in CI as a separate job, or as part of the existing e2e job? **Recommendation:** Separate job, triggered on schema changes (PRs that modify `pb_schema.json`). Keeps the feedback loop fast for code-only changes.

4. **Handler generation from schema.** Phase 6 is optional. Should it be a TypeScript AST generator or a Handlebars template? **Recommendation:** Handlebars template — simpler, and the generated code doesn't need to be type-perfect (developers will customize).

5. **Should the MSW handlers be reused for Storybook?** If Storybook is added later, the same handlers can mock the API for stories. **Recommendation:** Yes, design the handlers to be Storybook-compatible (no Vitest-specific imports). Defer Storybook integration to a future plan.

6. **Vitest browser mode.** The repo has `@vitest/browser` installed but unused. Should we migrate component tests to browser mode (real browser via Playwright) instead of jsdom? MSW's browser worker would be used instead of the node server. **Recommendation:** Defer. jsdom is faster for most tests. Browser mode is a future improvement for tests that need real DOM/WebGL.

7. **Test data persistence.** Should MSW fixture data be reset between tests, or accumulate? **Recommendation:** Reset. The `afterEach(() => server.resetHandlers())` call resets handlers. Fixture arrays should be deep-cloned in each handler to prevent mutation. Alternatively, use a `beforeEach` to reset the fixture arrays.

---

## 12. Final Recommendation

**Proceed with the full migration (Phases 0–4).** MSW is the right tool for this codebase — it directly addresses the "tests don't exercise real code paths" problem that allowed the captcha-bypass bug to ship, and it's the standard approach in the SvelteKit/Vitest ecosystem.

**Before starting, fix the `@testing-library/svelte` incompatibility** (code review T-1). This is a prerequisite for Phase 4 but not for Phases 0–3. The server-route tests (Phases 1–2) can proceed immediately and deliver the highest value (the captcha-bypass regression test).

**Concurrent with this migration, address the relevant code-review findings:**
- S-1 (captcha bypass): Phase 2.4 writes the regression test.
- S-5 (filter injection): MSW handlers parse filter strings, making this testable.
- T-1 (test suite doesn't run): Phase 3 removes the broken `$app/*` mocks, which may resolve some of the test-loading failures.

**Sequence recommendation:**
1. Fix `@testing-library/svelte` version (1 day) — unblocks all testing.
2. MSW Phase 0 (1 day).
3. MSW Phase 1 (2–3 days) — highest value, makes server tests real.
4. MSW Phase 2 (1–2 days) — captcha regression test.
5. MSW Phase 3 (1–2 days) — removes broken SvelteKit mocks.
6. MSW Phase 4 (2–3 days) — component test migration.
7. MSW Phases 5–6 (optional, 1 day each).

Total: ~2 weeks. The result is a test suite that exercises real code paths, catches real bugs, and doesn't depend on hand-rolled mocks that drift from reality.

---

*End of MSW mocking plan.*
