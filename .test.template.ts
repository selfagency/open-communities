// fallow-ignore-file unused-file
/**
 * Test Template — Server Tests (Vitest + MSW)
 *
 * ## File placement
 * - Route-level tests (load functions, form actions) live in `src/test/server/`
 *   e.g. `src/test/server/add.page.server.test.ts`
 * - Pure-utility tests co-locate next to source: `src/lib/server/rate-limit.test.ts`
 *
 * ## Test patterns
 *
 * 1. Module mocks (vi.mock) — for modules that can't run in Node:
 *    - `$lib/paraglide/messages` → returns key names via Proxy
 *    - `$env/dynamic/public` and `$env/dynamic/private` → test env values
 *    - `$lib/server/logger` → noop log stub
 *    - `nodemailer` → minimal transport mock
 *
 * 2. HTTP mocks (MSW) — for external service calls (PocketBase, PostHog, captcha):
 *    - Add handlers to `src/mocks/handlers/`
 *    - MSW server is started/stopped in `setupServer.ts`
 *    - Per-test overrides via `server.use(handler)`
 *
 * 3. SvelteKit route mocking:
 *    - `createMockRequestEvent()` / `createMockServerLoadEvent()` from $test/testUtils
 *    - Override `locals.api` with a mocked PocketBase client for auth-gated routes
 *    - Override `url`, `params`, `request` as needed
 *
 * 4. Auth guard pattern:
 *    - Every admin action/load should reject unauthenticated requests with 401
 *    - Test with empty locals (no api client) → error.status === 401
 *
 * ## Coverage target: 80% for server code (`src/lib/server/`, `src/lib/schemas/`)
 * - Thresholds in vitest.config.ts are raised incrementally as tests are added
 * - Pre-commit hook enforces coverage thresholds via `pnpm test:unit`
 *
 * @see src/test/server/*.test.ts for real examples
 * @see src/mocks/handlers/ for MSW handler patterns
 * @see src/test/testUtils.ts for helper utilities
 */

// This file is a documentation template — no actual code needed.
// See src/test/server/*.test.ts for runnable implementations.
export {};
