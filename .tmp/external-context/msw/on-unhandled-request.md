---
source: Official MSW Docs
library: Mock Service Worker
package: msw
topic: onUnhandledRequest Config Option
fetched: 2026-06-20T10:00:00Z
official_docs: https://mswjs.io/docs/api/setup-server/listen
---

# MSW v2 onUnhandledRequest

Passed as an option to `server.listen()`.

## Call Signature

```ts
server.listen({
  onUnhandledRequest?: 'warn' | 'error' | 'bypass' | CustomCallback
})
```

## Predefined Strategies

| Strategy | Description |
|----------|-------------|
| `'warn'` (default) | Print a warning, then perform the request as-is (network passthrough) |
| `'error'` | Print an error and halt request execution |
| `'bypass'` | Silently pass through — no output, request proceeds to network |

```ts
server.listen({
  onUnhandledRequest: 'error', // Fail fast on unhandled requests
})
```

```ts
server.listen({
  onUnhandledRequest: 'bypass', // Quiet mode — ignore unhandled requests
})
```

## Custom Callback Strategy

Receive each unhandled request and decide what to do:

```ts
server.listen({
  onUnhandledRequest(request) {
    console.log('Unhandled %s %s', request.method, request.url)
  },
})
```

### Using `print` helpers

The second argument provides `print.warning()` and `print.error()` to reuse the predefined behavior selectively:

```ts
server.listen({
  onUnhandledRequest(request, print) {
    const url = new URL(request.url)

    // Ignore static asset requests
    if (url.pathname.startsWith('/assets/')) {
      return // ← return without calling print → silent bypass
    }

    // Only warn for relevant API paths
    if (url.pathname.startsWith('/api')) {
      print.warning()
    }
    // else: other paths silently bypass
  },
})
```

### Filtering by path

```ts
server.listen({
  onUnhandledRequest(request, print) {
    const url = new URL(request.url)
    const pathname = url.pathname

    // Warn for API paths
    if (pathname.startsWith('/api')) {
      print.warning() // or print.error()
    }
    // Other paths: silently bypass (return without calling print)
  },
})
```

## Recommended Patterns

### In tests — use `'error'` to catch missing handlers

```ts
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})
```

This forces you to add a handler for every request your code makes during tests — no silent pass-throughs.

### In development — use `'warn'` (default) with custom filter

```ts
server.listen({
  onUnhandledRequest(request, print) {
    const url = new URL(request.url)
    // Only warn about our own API calls, not third-party
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      print.warning()
    }
  },
})
```

### In production (rare) — use `'bypass'`

## Important Note

> By default, MSW ignores common static asset requests so they won't be considered unhandled. If you provide a custom callback to `onUnhandledRequest`, **you opt out of that behavior**. You can re-enable it by calling `isCommonAssetRequest()` manually.

```ts
import { isCommonAssetRequest } from 'msw'

server.listen({
  onUnhandledRequest(request, print) {
    if (isCommonAssetRequest(request)) return // ignore assets
    print.warning()
  },
})
```

## SvelteKit / Vite HMR Considerations

In SvelteKit projects, Vite's HMR and dev server make frequent internal requests. Using `onUnhandledRequest: 'bypass'` or a custom callback that filters out Vite/HMR paths is recommended to avoid noise:

```ts
server.listen({
  onUnhandledRequest(request, print) {
    const url = new URL(request.url)
    // Ignore Vite HMR and internal requests
    if (url.pathname.startsWith('/@vite/') || url.pathname.startsWith('/node_modules/')) {
      return
    }
    print.warning()
  },
})
```
