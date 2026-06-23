import { HttpResponse, http } from 'msw';

const PH = 'https://*.posthog.com';

export const posthogHandlers = [
  // POST /capture/v1/ — PostHog event capture
  http.post(`${PH}/capture/v1/*`, () => HttpResponse.json({ status: 1 })),

  // POST /e/ — PostHog event capture (alternate path)
  http.post(`${PH}/e/*`, () => HttpResponse.json({ status: 1 }))
];
