/**
 * Setup file for Vitest "server" project (node environment).
 *
 * Provides:
 * - MSW server for HTTP-level mocking of PocketBase, captcha, PostHog
 * - Module mocks needed by server-route modules (nodemailer, paraglide)
 * - Shared test globals
 *
 * Does NOT include browser-specific mocks (svelte-sonner, svelte-copy, SVG, etc.)
 * Those are handled by setupTest.ts in the "browser" project.
 */

import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from '../mocks/node';

// ── MSW server ──────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Module mocks (non-HTTP) ────────────────────────────────────────────

// Nodemailer is Node-only; provide a minimal mock for server modules
vi.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: async () => ({ messageId: 'mock' })
  })
}));

// Paraglide messages aren't available before build; return key names.
vi.mock('$lib/paraglide/messages', () => {
  const m = new Proxy(
    {},
    {
      get: (_target: unknown, prop: unknown) => {
        const key = String(prop);
        return () => key;
      }
    }
  );
  return { m };
});

// Mark as test environment
(globalThis as Record<string, unknown>).__TEST__ = true;
