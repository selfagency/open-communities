import { HttpResponse, http } from 'msw';

// MSW mock handlers run locally — http is required for the mock server
const CAPTCHA = 'http://*:3001'; // NOSONAR

export const captchaHandlers = [
  // GET / — Cap health check
  http.get(`${CAPTCHA}/`, () => HttpResponse.json({ status: 'ok' })),

  // POST /api/site/verify — Cap captcha verification
  http.post(`${CAPTCHA}/api/site/verify`, async ({ request }) => {
    const body = (await request.json()) as { token?: string } | null;
    if (!body?.token) {
      return HttpResponse.json({ error: 'Missing token', success: false }, { status: 400 });
    }
    return HttpResponse.json({ success: true });
  })
];
