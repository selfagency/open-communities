import { HttpResponse, http } from 'msw';

import { allUsers, findUserByEmail, findUserById, regularUser } from '../../data/users';

// MSW mock handlers run locally — http is required
const PB = 'http://*:8090'; // NOSONAR

export const userHandlers = [
  // POST /api/collections/users/auth-with-password
  http.post(`${PB}/api/collections/users/auth-with-password`, async ({ request }) => {
    const body = (await request.json()) as {
      identity?: string;
      password?: string;
    };
    const user = findUserByEmail(body.identity ?? '');
    if (!user) {
      return HttpResponse.json({ code: 401, data: {}, message: 'Failed to authenticate.' }, { status: 401 });
    }
    return HttpResponse.json({
      record: user,
      token: user.token
    });
  }),

  // POST /api/collections/users/auth-refresh
  http.post(`${PB}/api/collections/users/auth-refresh`, async ({ request }) => {
    const auth = request.headers.get('Authorization') ?? '';
    // Extract user from the auth context — in production PB reads the JWT.
    // For tests, assume any valid-looking bearer token maps to regularUser.
    const user = auth.startsWith('Bearer ') ? regularUser : undefined;
    if (!user) {
      return HttpResponse.json({ code: 401, data: {}, message: 'Invalid token.' }, { status: 401 });
    }
    return HttpResponse.json({
      record: user,
      token: user.token
    });
  }),

  // POST /api/collections/users/request-password-reset
  http.post(`${PB}/api/collections/users/request-password-reset`, () => HttpResponse.json({})),

  // POST /api/collections/users/confirm-password-reset
  http.post(`${PB}/api/collections/users/confirm-password-reset`, async ({ request }) => {
    const body = (await request.json()) as { token?: string };
    if (!body.token) {
      return HttpResponse.json({ code: 400, data: {}, message: 'Invalid token.' }, { status: 400 });
    }
    return HttpResponse.json({});
  }),

  // POST /api/collections/users/request-verification
  http.post(`${PB}/api/collections/users/request-verification`, () => HttpResponse.json({})),

  // POST /api/collections/users/confirm-verification
  http.post(`${PB}/api/collections/users/confirm-verification`, async ({ request }) => {
    const body = (await request.json()) as { token?: string };
    if (!body.token) {
      return HttpResponse.json({ code: 400, data: {}, message: 'Invalid token.' }, { status: 400 });
    }
    return HttpResponse.json({});
  }),

  // POST /api/collections/users/records — signup
  http.post(`${PB}/api/collections/users/records`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newUser = {
      avatar: '',
      collectionId: 'pbc_users',
      collectionName: 'users',
      created: new Date().toISOString(),
      email: body.email as string,
      emailVisibility: false,
      id: `user_new_${crypto.randomUUID().replaceAll('-', '').slice(0, 8)}`,
      lang: 'en',
      name: (body.name as string) ?? '',
      token: 'mock_new_user_token',
      updated: new Date().toISOString(),
      verified: false,
      ...body
    };
    return HttpResponse.json(newUser, { status: 200 });
  }),

  // PATCH /api/collections/users/records/:id — update user (e.g., lang)
  http.patch(`${PB}/api/collections/users/records/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const user = findUserById(params.id as string);
    if (!user) {
      return HttpResponse.json({ code: 404, data: {}, message: 'User not found.' }, { status: 404 });
    }
    const updated = { ...user, ...body, updated: new Date().toISOString() };
    return HttpResponse.json(updated);
  }),

  // GET /api/collections/users/records — list users (for transfer/ownership lookup)
  http.get(`${PB}/api/collections/users/records`, ({ request }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') ?? '';
    let items = allUsers;

    // Handle PB filter syntax: email={:email}
    const emailRe = /email\s*=\s*['"]?(\S+?)['"]?\s*(?:$|&|\b)/;
    const emailMatch = emailRe.exec(filter);
    if (emailMatch) {
      items = items.filter((u) => u.email === emailMatch[1]);
    }

    return HttpResponse.json({
      items,
      page: 1,
      perPage: 50,
      totalItems: items.length,
      totalPages: 1
    });
  }),

  // GET /api/collections/users/records/:id
  http.get(`${PB}/api/collections/users/records/:id`, ({ params }) => {
    const user = findUserById(params.id as string);
    if (!user) {
      return HttpResponse.json({ code: 404, data: {}, message: 'User not found.' }, { status: 404 });
    }
    return HttpResponse.json(user);
  })
];
