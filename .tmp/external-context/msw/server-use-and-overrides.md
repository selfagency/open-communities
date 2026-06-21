---
source: Official MSW Docs + Context7 API
library: Mock Service Worker
package: msw
topic: server.use() and Per-Test Overrides
fetched: 2026-06-20T10:00:00Z
official_docs: https://mswjs.io/docs/api/setup-server/use
---

# MSW v2 server.use() & Per-Test Overrides

## Call Signature

```ts
server.use(http.get('/resource', resolver), http.post('/resource', resolver))
```

## How It Works

`.use()` **prepends** request handlers to the beginning of the handler list. New handlers are placed before existing handlers of the same kind (by HTTP method), ensuring they take priority.

**Order: runtime overrides → initial handlers → first match wins**

```ts
const server = setupServer(
  http.get('/api/user', () => {
    return HttpResponse.json({ name: 'John Maverick' })
  }),
)

// In a test override:
server.use(
  http.get('/api/user', () => {
    return HttpResponse.json({ name: 'Overridden' })
  }),
)
// → GET /api/user now returns { name: 'Overridden' }
```

## Per-Test Pattern

```ts
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/node'

afterEach(() => {
  server.resetHandlers() // ← crucial: removes runtime handlers
})

// Happy path — uses initial handlers from handlers.ts
it('displays the user info', async () => {
  render(UserComponent)
  expect(await screen.findByText('John Maverick')).toBeVisible()
})

// Error scenario — overrides per-test
it('handles errors when fetching the user', () => {
  server.use(
    http.get('/api/user', () => {
      return new HttpResponse(null, { status: 500 })
    }),
  )
  render(UserComponent)
  expect(screen.getByRole('alert')).toHaveText('Error!')
})
```

## `server.resetHandlers()`

### Without arguments

Removes all runtime handlers added via `server.use()`, leaving only the initial handlers passed to `setupServer()`.

```ts
server.use(http.post('/api/user', resolver))
server.resetHandlers()
// → POST /api/user handler removed; only initial handlers remain
```

### With arguments

Replaces **all** handlers (both initial and runtime) with the given list.

```ts
server.resetHandlers(
  http.patch('/api/book/:bookId', resolver),
)
// → Both runtime and initial handlers removed;
//   only PATCH /api/book/:bookId remains
```

## `server.restoreHandlers()`

Resets all "once" handlers (those with `{ once: true }`) to unused state, so they fire again on next matching request.

## `server.listHandlers()`

Returns the current list of handlers — useful for debugging.

## Handler Resolution Order (from source)

1. MSW iterates handlers **left-to-right**
2. First handler that returns a response wins
3. Runtime handlers (prepended via `use()`) come before initial handlers
4. If no handler matches, the `onUnhandledRequest` strategy kicks in (default: warn)

```ts
// Pseudocode of resolution logic:
for (const handler of handlers) {
  result = await handler.run({ request, requestId })
  if (result?.response) {
    break // first match wins
  }
}
```

## Vitest Setup with Cleanup

```ts
// vitest.setup.ts
import { beforeAll, afterAll, afterEach } from 'vitest'
import { server } from './src/mocks/node'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

The `afterEach` reset is **critical** — without it, runtime overrides from one test bleed into subsequent tests causing flaky failures.

## Using `server.boundary()` for Express

Scopes interception to a specific route handler within Express:

```ts
import express from 'express'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const app = express()
const server = setupServer()

app.get(
  '/checkout/session',
  server.boundary((req, res) => {
    server.use(
      http.get('https://api.stripe.com/v1/checkout/sessions/:id', ({ params }) => {
        return HttpResponse.json({ id: params.id, mode: 'payment', status: 'open' })
      }),
    )
    handleSession(req, res)
  }),
)
```
