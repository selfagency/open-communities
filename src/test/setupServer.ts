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

import process from 'node:process';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from '../mocks/node';

// MSW registers process-level beforeExit/SIGTERM/SIGINT listeners for every
// test file via setupServer(). With 22+ server test files, each adding 3
// listeners, accumulations far exceed Node's default MaxListeners (10).
// Bump high to accommodate all test files across pooled workers.
process.setMaxListeners(100);

// ── MSW server ──────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Module mocks (non-HTTP) ────────────────────────────────────────────

// Mailgun is Node-only; provide a minimal mock for server modules
vi.mock('mailgun.js', () => ({
  default: class {
    client() {
      return {
        messages: {
          create: async () => ({ id: 'mock', message: 'Queued. Thank you.' })
        }
      };
    }
  }
}));

// sveltekit-superforms pulls in SuperDebug.svelte which the node module
// evaluator cannot parse (SyntaxError: Unexpected strict mode reserved word).
// Mock it so the real package never loads in the server project.
vi.mock('sveltekit-superforms', () => ({
  message: () => ({}),
  setError: () => ({}),
  superForm: () => ({}),
  superValidate: () => ({})
}));

// Paraglide messages aren't available before build; return key names.
vi.mock('$lib/paraglide/messages', () => {
  const m = new Proxy(
    {},
    {
      get: (_target: unknown, prop: unknown) => {
        const key = typeof prop === 'string' ? prop : String(prop); // NOSONAR — i18n mock, prop is always a string key
        return () => key;
      }
    }
  );
  return { m };
});

// Mark as test environment
(globalThis as Record<string, unknown>).__TEST__ = true;
