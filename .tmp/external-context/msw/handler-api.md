---
source: Official MSW Docs + Context7 API
library: Mock Service Worker
package: msw
topic: HTTP Handler API (http.get, http.post, http.patch, http.delete)
fetched: 2026-06-20T10:00:00Z
official_docs: https://mswjs.io/docs/api/http
---

# MSW v2 HTTP Handler API

## Generic Call Signature

```ts
http.get<PathParams, RequestBodyType, ResponseBodyType>(
  predicate: string | RegExp,
  resolver: ResponseResolver<HttpRequestResolverExtras<Params>, RequestBodyType, ResponseBodyType>,
  options?: RequestHandlerOptions
)
```

## Standard HTTP Method Handlers

### `http.get()`

```ts
http.get('/api/user/:id', ({ params }) => {
  const { id } = params;
  return HttpResponse.json({ id, name: 'John' });
});
```

### `http.post()`

```ts
http.post('/api/login', async ({ request }) => {
  const body = await request.json();
  // body is the parsed request payload
  return HttpResponse.json({ success: true, token: 'abc123' });
});
```

### `http.put()`

```ts
http.put('/api/post/:id', async ({ request, params }) => {
  const { id } = params;
  const updates = await request.json();
  return HttpResponse.json({ id, ...updates });
});
```

### `http.patch()`

```ts
http.patch('/api/cart/:cartId/order/:orderId', async ({ request, params }) => {
  const { cartId, orderId } = params;
  const orderUpdates = await request.json();
  return HttpResponse.json({ cartId, orderId, ...orderUpdates });
});
```

### `http.delete()`

```ts
http.delete('/api/user/:id', ({ params }) => {
  const { id } = params;
  return HttpResponse.json({ deleted: true, id });
});
```

### `http.head()`

```ts
http.head('/api/resource', () => {
  return new Response(null, {
    status: 200,
    headers: { 'Content-Length': '1270' }
  });
});
```

### `http.options()`

```ts
http.options('https://api.example.com', () => {
  return new Response(null, {
    status: 200,
    headers: { Allow: 'GET,HEAD,POST' }
  });
});
```

### `http.all()` — Any Method

Intercepts requests to the given endpoint **regardless of HTTP method**.

```ts
http.all('/api/*', () => {
  return HttpResponse.json({ message: 'Mocked' });
});
```

## Resolver Argument Object

The resolver function receives a single object with these properties:

| Property    | Type                     | Description                                            |
| ----------- | ------------------------ | ------------------------------------------------------ |
| `request`   | `Request`                | Full Fetch API Request instance                        |
| `requestId` | `string`                 | Unique ID of the intercepted request                   |
| `params`    | `Record<string, string>` | Path parameters (extracted from `:param` placeholders) |
| `cookies`   | `Record<string, string>` | Request cookies                                        |

```ts
http.get('/api/user/:id', ({ request, params, cookies }) => {
  console.log(request.method, request.url);
  console.log('user id:', params.id);
  console.log('cookies:', cookies);
  return HttpResponse.json({ id: params.id });
});
```

## Path Parameters

Use `:paramName` in the URL pattern:

```ts
http.get('/api/users/:userId/posts/:postId', ({ params }) => {
  // params: { userId: string, postId: string }
  return HttpResponse.json({ userId: params.userId, postId: params.postId });
});
```

## Query Parameters

⚠️ Do NOT include query parameters in the handler URL — MSW strips them before matching. Access via `request.url`:

```ts
http.get('/api/search', ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const page = url.searchParams.get('page');
  return HttpResponse.json({ results: [], query, page });
});
```

## Handler Options (3rd argument)

### `once`

Marks handler as one-time-use. After first successful match, the handler is ignored.

```ts
http.get('/api/greeting', () => HttpResponse.text('Hello'), {
  once: true
});
```

Use `server.restoreHandlers()` to reset all "once" handlers.

## Query params in handler URL — MSW warns

If you include query params in the handler URL, MSW prints a warning and strips them. Always match against the path and access `request.url.searchParams` instead.

## Response Patterns

### `HttpResponse.json(body, options?)`

```ts
HttpResponse.json({ key: 'value' });
HttpResponse.json({ key: 'value' }, { status: 201 });
HttpResponse.json({ error: 'Not found' }, { status: 404, headers: { 'X-Custom': 'value' } });
```

### `HttpResponse.text(body, options?)`

```ts
HttpResponse.text('hello world');
HttpResponse.text('Not found', { status: 404 });
```

### `new HttpResponse(null, options?)` — empty body

```ts
new HttpResponse(null, { status: 204 });
new HttpResponse(null, { status: 500 });
```

### Error responses

```ts
// Throw to short-circuit
http.get('/api/protected', ({ request }) => {
  if (!request.headers.get('authorization')) {
    throw HttpResponse.text('Unauthorized', { status: 401 });
  }
  return HttpResponse.json({ data: 'secret' });
});
```

## Request Body Reading

```ts
http.post('/api/data', async ({ request }) => {
  const json = await request.json(); // for JSON bodies
  const formData = await request.formData(); // for FormData
  const text = await request.text(); // for raw text
  const blob = await request.blob(); // for binary
  return HttpResponse.json({ received: true });
});
```

## TypeScript Generics

```ts
http.get<{ id: string }, never, { name: string }>('/api/user/:id', ({ params }) => {
  // params.id is typed as string
  return HttpResponse.json({ name: 'John' });
});
```
