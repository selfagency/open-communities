import { error } from '@sveltejs/kit';

import { env } from '$env/dynamic/private';
import { env as pubEnv } from '$env/dynamic/public';
import { log } from '$lib/server/logger';

import type { RequestHandler } from './$types';

/**
 * Proxy for Cap captcha widget requests.
 *
 * The Cap widget's fetcher makes requests to `{endpoint}/challenge` (and
 * potentially other paths) via `connect-src`. Since the Cap server runs at
 * a Docker-internal hostname (`http://cap:3000`) that isn't in the CSP
 * `connect-src` directive, the browser blocks the request.
 *
 * This route proxies those requests through a same-origin path
 * (`/api/captcha/[...path]`), which is allowed by `'self'` in connect-src.
 */
export const GET: RequestHandler = ({ params, request }) => proxyRequest(params.path, request);

export const POST: RequestHandler = ({ params, request }) => proxyRequest(params.path, request);

async function proxyRequest(path: string, incoming: Request): Promise<Response> {
  const captchaEndpoint = env.CAPTCHA_INTERNAL_ENDPOINT || pubEnv.PUBLIC_CAPTCHA_ENDPOINT;

  if (!captchaEndpoint) {
    log.error('[captcha-proxy] No captcha endpoint configured');
    throw error(500, 'Captcha endpoint not configured');
  }

  const targetUrl = `${captchaEndpoint}/${path}`;
  log.debug('[captcha-proxy] Proxying', incoming.method, 'to', targetUrl);

  // Read the incoming body (may be empty for GET)
  let body: BodyInit | undefined;
  const contentType = incoming.headers.get('content-type');
  if (incoming.method !== 'GET' && incoming.method !== 'HEAD') {
    body = await incoming.text();
  }

  try {
    const response = await fetch(targetUrl, {
      method: incoming.method,
      headers: {
        ...(contentType ? { 'content-type': contentType } : {}),
        // Forward the client IP so Cap sees the real visitor, not the server
        'x-forwarded-for': incoming.headers.get('x-forwarded-for') || '127.0.0.1'
      },
      body,
      signal: AbortSignal.timeout(10_000)
    });

    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/octet-stream',
        // Don't let the proxy response set cookies from Cap — not needed client-side
        'set-cookie': ''
      }
    });
  } catch (err) {
    log.error('[captcha-proxy] Proxy request failed:', err);
    throw error(502, 'Captcha proxy request failed');
  }
}
