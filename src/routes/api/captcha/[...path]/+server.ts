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

function getCaptchaEndpoint(): string {
  const endpoint = env.CAPTCHA_INTERNAL_ENDPOINT || pubEnv.PUBLIC_CAPTCHA_ENDPOINT;

  if (!endpoint) {
    log.error('[captcha-proxy] No captcha endpoint configured');
    throw error(500, 'Captcha endpoint not configured');
  }

  return endpoint;
}

function buildProxyHeaders(incoming: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  const contentType = incoming.headers.get('content-type');
  if (contentType) {
    headers['content-type'] = contentType;
  }
  headers['x-forwarded-for'] = incoming.headers.get('x-forwarded-for') || '127.0.0.1';
  return headers;
}

function readIncomingBody(incoming: Request): Promise<BodyInit | undefined> | undefined {
  if (incoming.method === 'GET' || incoming.method === 'HEAD') {
    return;
  }
  return incoming.text();
}

function buildProxyResponse(response: Response, body: string): Response {
  return new Response(body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/octet-stream',
      'set-cookie': ''
    }
  });
}

async function proxyRequest(path: string, incoming: Request): Promise<Response> {
  const captchaEndpoint = getCaptchaEndpoint();
  const targetUrl = `${captchaEndpoint}/${path}`;
  log.debug('[captcha-proxy] Proxying', incoming.method, 'to', targetUrl);

  const body = await readIncomingBody(incoming);

  try {
    const response = await fetch(targetUrl, {
      method: incoming.method,
      headers: buildProxyHeaders(incoming),
      body,
      signal: AbortSignal.timeout(10_000)
    });

    const responseBody = await response.text();
    return buildProxyResponse(response, responseBody);
  } catch (err) {
    log.error('[captcha-proxy] Proxy request failed:', err);
    throw error(502, 'Captcha proxy request failed');
  }
}
