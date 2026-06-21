---
source: Official MSW Best Practices Docs
library: Mock Service Worker
package: msw
topic: Handler Structure, Fixtures, and Organization
fetched: 2026-06-20T10:00:00Z
official_docs: https://mswjs.io/docs/best-practices/structuring-handlers
---

# MSW v2 Handler Structure, Fixtures & Organization

## Recommended Directory Structure

```
src/
  mocks/
    handlers/
      user.ts          ← domain-specific handlers
      posts.ts         ← domain-specific handlers
      checkout.ts
      index.ts         ← composes all handlers
    fixtures/
      user.ts          ← mock data/factories
      posts.ts
    node.ts            ← setupServer(...handlers)
    browser.ts         ← setupWorker(...handlers)
```

### Single `handlers.js` — Happy Path First

Keep the default handlers for success states only:

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/user', () => {
    return HttpResponse.json({ name: 'John Maverick' });
  }),
  http.get('/api/posts', () => {
    return HttpResponse.json([{ id: 1, title: 'Getting Started' }]);
  })
];
```

## Domain-Based Organization

### Split by feature domain

```ts
// src/mocks/handlers/user.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/user', () => {
    return HttpResponse.json({ name: 'John' });
  }),
  http.post('/api/login', async ({ request }) => {
    const { email } = await request.json();
    return HttpResponse.json({ token: `token-${email}` });
  }),
  http.delete('/api/user/:userId', ({ params }) => {
    return HttpResponse.json({ deleted: params.userId });
  })
];
```

```ts
// src/mocks/handlers/posts.ts
export const handlers = [
  http.get('/api/posts', () => HttpResponse.json([])),
  http.post('/api/posts', async ({ request }) => {
    const post = await request.json();
    return HttpResponse.json({ id: Date.now(), ...post }, { status: 201 });
  })
];
```

### Compose at index

```ts
// src/mocks/handlers/index.ts
import { handlers as userHandlers } from './user';
import { handlers as postsHandlers } from './posts';

export const handlers = [...userHandlers, ...postsHandlers];
```

## Fixtures / Mock Data

### Centralized fixture files

```ts
// src/mocks/fixtures/user.ts
export const mockUser = {
  id: '15d42a4d-1948-4de4-ba78-b8a893feaf45',
  firstName: 'John',
  lastName: 'Maverick',
  email: 'john@example.com'
};

export const mockUsers = [{ ...mockUser }, { ...mockUser, id: '2', firstName: 'Jane' }];
```

### Use fixtures in handlers

```ts
import { http, HttpResponse } from 'msw';
import { mockUser, mockUsers } from '../fixtures/user';

export const handlers = [
  http.get('/api/user', () => {
    return HttpResponse.json(mockUser);
  }),
  http.get('/api/users', () => {
    return HttpResponse.json(mockUsers);
  }),
  http.get('/api/user/:id', ({ params }) => {
    return HttpResponse.json({ ...mockUser, id: params.id });
  })
];
```

### Factory functions for dynamic data

```ts
// src/mocks/fixtures/post.ts
export function createPost(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    title: 'Default Title',
    body: 'Default body text',
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

export function createPostList(count = 3) {
  return Array.from({ length: count }, (_, i) => createPost({ id: i + 1, title: `Post ${i + 1}` }));
}
```

```ts
// In a handler
import { createPost } from '../fixtures/post';

http.post('/api/posts', async ({ request }) => {
  const body = await request.json();
  return HttpResponse.json(createPost(body), { status: 201 });
});
```

## Patterns for Test-Specific Overrides

### Selective domain imports

If you want only a subset of handlers for a specific test file:

```ts
import { server } from '../../mocks/node';
import { handlers as userHandlers } from '../../mocks/handlers/user';

// Only apply user-domain handlers, no others
server.use(...userHandlers);
```

### Dynamic mock scenarios

Override a subset of behavior while keeping happy-path defaults for the rest:

```ts
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/node';

it('shows error when user fetch fails', async () => {
  server.use(
    http.get('/api/user', () => {
      return new HttpResponse(null, { status: 500 });
    })
    // other handlers (posts, etc.) still use the happy-path from handlers.ts
  );

  render(UserProfile);
  expect(await screen.findByText(/error/i)).toBeVisible();
});
```

### `server.resetHandlers()` with replacement

If a test needs an entirely different set of handlers:

```ts
it('works with no data', async () => {
  server.resetHandlers(
    http.get('/api/posts', () => {
      return HttpResponse.json([]);
    })
  );
  // All other initial handlers are removed
});
```

## Abstract Repeated Logic

### Utility functions

```ts
import { http } from 'msw';
import { authenticate } from './utils';

export const handlers = [
  http.get('/api/cart', authenticate(getCartResolver)),
  http.post('/api/checkout/:cartId', authenticate(addToCartResolver))
];
```

### Higher-order resolvers

```ts
// mocks/handlers/withAuth.ts
import { HttpResponse } from 'msw';

export function withAuth(resolver) {
  return ({ request, ...rest }) => {
    if (!request.headers.get('authorization')) {
      throw HttpResponse.text('Unauthorized', { status: 401 });
    }
    return resolver({ request, ...rest });
  };
}
```

## Vitest + SvelteKit File Organization

```
src/
  routes/
    +page.svelte
    api/
      user/
        +server.ts
  lib/
    components/
      UserProfile.svelte
  mocks/
    handlers/
      user.ts
      index.ts
    fixtures/
      user.ts
    node.ts
vitest.setup.ts
```
