---
source: Context7 API + Official MSW Docs
library: Mock Service Worker
package: msw
topic: Setup and Vitest Integration
fetched: 2026-06-20T10:00:00Z
official_docs: https://mswjs.io/docs/api/setup-server
---

# MSW v2 Setup & Vitest Integration

## Installation

```bash
npm install msw --save-dev
# or
pnpm add -D msw
# or
yarn add -D msw
```

## Node.js Server Setup (`setupServer`)

Imported from `msw/node`. Configures request interception in a Node.js process — **does not** establish any actual servers, it augments `http`/`https` modules to intercept outgoing requests.

```ts
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/user', () => {
    return HttpResponse.json({
      id: '15d42a4d-1948-4de4-ba78-b8a893feaf45',
      firstName: 'John'
    });
  })
);
```

### Vitest Setup File Pattern

Create a shared server instance and attach to Vitest lifecycle hooks.

```ts
// src/mocks/node.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/user', () => {
    return HttpResponse.json({ name: 'John Maverick' });
  }),
  http.get('/api/posts', () => {
    return HttpResponse.json([{ id: 1, title: 'Post 1' }]);
  })
];
```

```
// vitest.setup.ts
import { beforeAll, afterAll, afterEach } from 'vitest'
import { server } from './src/mocks/node'

beforeAll(() => server.listen())     // Start interception

afterEach(() => server.resetHandlers()) // Clean up per-test overrides

afterAll(() => server.close())       // Stop interception
```

### Vitest Config

```ts
// vitest.config.ts (or vite.config.ts)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts']
    // environment: 'node', // or 'happy-dom' / 'jsdom' for SvelteKit
  }
});
```

⚠️ **Note for SvelteKit**: Vitest tests in SvelteKit typically use `@sveltejs/vite-plugin-svelte` and the `happy-dom` or `jsdom` environment. The MSW `setupServer` intercepts at the `http` module level so it works regardless of environment — it captures any `fetch()` calls made from your code under test.

## Server Lifecycle API

| Method                                 | Description                                                           |
| -------------------------------------- | --------------------------------------------------------------------- |
| `server.listen(options?)`              | Start request interception. Accepts `onUnhandledRequest` option.      |
| `server.close()`                       | Stop interception and clean up.                                       |
| `server.use(...handlers)`              | Prepend runtime handlers (for per-test overrides).                    |
| `server.resetHandlers()`               | Remove all runtime handlers added via `use()`.                        |
| `server.resetHandlers(...newHandlers)` | Replace ALL handlers (both initial and runtime) with new list.        |
| `server.restoreHandlers()`             | Mark all "once" handlers as unused again.                             |
| `server.listHandlers()`                | Return current list of handlers (debugging).                          |
| `server.boundary(fn)`                  | Scope interception to a specific handler function (Express use case). |

## Vitest Browser Mode (alternative)

If using Vitest Browser Mode (tests run in the actual browser), use `setupWorker` from `msw/browser` instead:

```ts
// test-extend.ts
import { test as testBase } from 'vitest';
import { worker } from './mocks/browser';

export const test = testBase.extend({
  worker: [
    async ({}, use) => {
      await worker.start();
      await use(worker);
      worker.resetHandlers(); // cleanup per-test overrides
    },
    { auto: true }
  ]
});
```
