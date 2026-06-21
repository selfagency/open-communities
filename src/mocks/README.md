# MSW (Mock Service Worker) — Test Mock Layer

This directory contains the MSW v2 mock layer for intercepting HTTP requests in tests and optionally in dev mode.

## Directory Structure

```
src/mocks/
├── handlers/          # Declarative handler files grouped by domain
│   ├── index.ts       # Combines all handlers
│   ├── pocketbase/    # PocketBase API handlers
│   ├── captcha.ts     # Cap siteverify handler
│   ├── posthog.ts     # PostHog capture/decide handlers
│   └── public-ip.ts   # public-ip DNS-over-HTTPS handler
├── data/              # Fixture data shared across handlers
├── node.ts            # setupServer() for Vitest Node environment
├── browser.ts         # setupWorker() for Vitest browser mode + dev
└── README.md          # This file
```

## Adding a New Handler

1. Create a new file in `src/mocks/handlers/` or add to an existing one.
2. Export an array of `HttpHandler` objects.
3. Import and spread into `src/mocks/handlers/index.ts`.

## Per-Test Overrides

Use `server.use()` in individual tests to override a handler for a specific scenario:

```typescript
import { server } from '$lib/mocks/node';
import { http, HttpResponse } from 'msw';

it('handles captcha failure', async () => {
  server.use(
    http.post('http://localhost:3001/:key/siteverify', () =>
      HttpResponse.json({ success: false })
    )
  );
  // Test code that calls validateCaptcha...
});
```

Always call `server.resetHandlers()` in `afterEach` (this is done automatically in `setupTest.ts`).
