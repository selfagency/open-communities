// fallow-ignore-file complexity,unused-file -- auto-loaded by PocketBase at startup
// PocketBase JS Hook — Export logs and traces to PostHog.
//
// Env vars (set in PocketHost dashboard):
//   POSTHOG_PB_API_KEY  — PostHog project API key
//   POSTHOG_PB_HOST     — PostHog API host (default: https://us.i.posthog.com)
//
// IMPORTANT: PB's JSVM isolates each handler invocation. ALL config and
// logic is inside the handler body — no require(), no external modules,
// no module-level state.

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: handler must be self-contained (PB isolation scope)
onModelCreate((e) => {
  // ── Config (inline, fresh each invocation, handler-local) ──────────
  let key = '';
  let host = 'https://us.i.posthog.com';
  try {
    if (typeof process !== 'undefined') {
      if (process.env.POSTHOG_PB_API_KEY) {
        key = process.env.POSTHOG_PB_API_KEY;
      }
      if (process.env.POSTHOG_PB_HOST) {
        host = process.env.POSTHOG_PB_HOST;
      }
    }
  } catch {
    /* silent */
  }

  if (!key) {
    e.next();
    return;
  }

  // Strip trailing slash from host
  while (host.length > 0 && host.at(-1) === '/') {
    host = host.slice(0, -1);
  }

  // ── Forward relevant log entries to PostHog ────────────────────────
  try {
    const level = e.model.getInt('level'); // -4=debug, 0=info, 4=warn, 8=error
    const raw = e.model.get('data');

    // Skip debug/info unless it's a request log
    if (level < 4 && !(raw && raw.type === 'request')) {
      e.next();
      return;
    }

    const rid = e.model.getString('id');
    const eventName = level >= 4 ? 'pb_log' : 'pb_request';
    const xrid = raw?.['x-request-id'] || '';
    const distinctId = xrid || rid;

    $http.send({
      url: `${host}/capture/`,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        event: eventName,
        distinct_id: distinctId,
        properties: {
          $lib: 'pocketbase',
          $event_id: xrid || rid,
          level,
          message: e.model.getString('message'),
          method: raw ? raw.method : undefined,
          path: raw ? raw.url : undefined,
          status: raw ? raw.status : undefined,
          execTimeMs: raw ? Math.round((raw.execTime || 0) * 1000) : undefined,
          ip: raw ? raw.remoteIP : undefined,
          auth: raw ? raw.auth : undefined
        },
        timestamp: new Date().toISOString()
      }),
      timeout: 5
    });
  } catch {
    /* silent */
  }

  e.next();
}, '_logs');
