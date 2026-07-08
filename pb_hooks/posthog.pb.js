// fallow-ignore-file unused-file -- auto-loaded by PocketBase at startup
// PocketBase JS Hook — Export logs and traces to PostHog via _logs hook.
// Correlates with SvelteKit events via X-Request-Id in log data.
//
// Env vars (set in PocketHost dashboard):
//   POSTHOG_PB_API_KEY  — PostHog project API key
//   POSTHOG_PB_HOST     — PostHog API host (default: https://us.i.posthog.com)

// ── Config ────────────────────────────────────────────────────────────
let POSTHOG_KEY = '';
let POSTHOG_HOST = 'https://us.i.posthog.com';

try {
  if (typeof process !== 'undefined') {
    if (process.env.POSTHOG_PB_API_KEY) {
      POSTHOG_KEY = process.env.POSTHOG_PB_API_KEY;
    }
    if (process.env.POSTHOG_PB_HOST) {
      POSTHOG_HOST = process.env.POSTHOG_PB_HOST.replace(/\/+$/, '');
    }
  }
} catch {
  /* silent */
}

// ── Queue ──────────────────────────────────────────────────────────────
const eventQueue = [];

function enqueue(eventName, distinctId, properties) {
  if (!POSTHOG_KEY) {
    return;
  }
  eventQueue.push({
    api_key: POSTHOG_KEY,
    event: eventName,
    distinct_id: distinctId,
    properties: { $lib: 'pocketbase', ...properties },
    timestamp: new Date().toISOString()
  });
}

// ── Log hook — intercepts ALL log writes (requests, errors, warnings) ──
onModelCreate((e) => {
  if (!POSTHOG_KEY) {
    e.next();
    return;
  }

  try {
    const rid = e.model.getString('id');
    const level = e.model.getInt('level'); // -4=debug, 0=info, 4=warn, 8=error
    const msg = e.model.getString('message');
    const raw = e.model.get('data'); // object with request details

    // Forward errors and warnings regardless
    if (level >= 4) {
      enqueue('pb_log', 'pb-system', { $event_id: rid, level, message: msg, data: raw });
      e.next();
      return;
    }

    // Forward request logs (info level with request data)
    if (raw && raw.type === 'request') {
      enqueue('pb_request', raw['x-request-id'] || 'pb-system', {
        $event_id: raw['x-request-id'] || rid,
        method: raw.method,
        path: raw.url,
        status: raw.status,
        collection: raw.collection || '',
        ip: raw.remoteIP || '',
        auth: raw.auth || '',
        execTimeMs: Math.round((raw.execTime || 0) * 1000)
      });
    }
  } catch {
    /* silent */
  }

  e.next();
}, '_logs');

// ── Cron job — flush queue to PostHog every 30s ──────────────────────
cronAdd('flush-posthog', '*/30 * * * * *', () => {
  if (!POSTHOG_KEY || eventQueue.length === 0) {
    return;
  }
  const batch = eventQueue.splice(0, Math.min(eventQueue.length, 100));
  for (const ev of batch) {
    try {
      $http.send({
        url: `${POSTHOG_HOST}/capture/`,
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(ev),
        timeout: 3
      });
    } catch {
      /* silent */
    }
  }
});

console.log(`PostHog hooks registered (key: ${POSTHOG_KEY ? 'set' : 'NOT SET'})`);
