// fallow-ignore-file unused-file -- auto-loaded by PocketBase at startup
// PocketBase JS Hook — Export logs and request traces to PostHog.
// Correlates with SvelteKit events via X-Request-Id header.
//
// Environment variables:
//   POSTHOG_PB_API_KEY  — PostHog project API key (required for capture)
//   POSTHOG_PB_HOST     — PostHog API host (default: https://us.i.posthog.com)
//
// Architecture:
//   Request hooks enqueue events (fast, non-blocking push to array).
//   Cron job flushes queue to PostHog's /capture endpoint every 30s.
//   Log hook forwards PB error/warn log entries the same way.
//   This keeps HTTP calls out of the request path entirely.

// ── Config ────────────────────────────────────────────────────────────
const POSTHOG_KEY = $os.getenv('POSTHOG_PB_API_KEY') || '';
const POSTHOG_HOST = ($os.getenv('POSTHOG_PB_HOST') || 'https://us.i.posthog.com').replace(/\/+$/, '');

// ── Event queue (module scope, persists across hook invocations) ──────
const eventQueue = [];
const MAX_QUEUE = 500; // safety cap to prevent unbounded memory growth

// ── Helpers ───────────────────────────────────────────────────────────

function getClientIp(e) {
  try {
    return (
      e.http?.request?.headers?.get('cf-connecting-ip') ||
      e.http?.request?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      e.http?.request?.headers?.get('x-real-ip') ||
      ''
    );
  } catch {
    return '';
  }
}

function getRequestId(e) {
  try {
    return e.http?.request?.headers?.get('x-request-id') || '';
  } catch {
    return '';
  }
}

function getAuthType(e) {
  try {
    const auth = e.http?.request?.auth;
    if (!auth) {
      return 'none';
    }
    return auth?.record?.collectionName === '_superusers' ? 'superuser' : 'user';
  } catch {
    return 'unknown';
  }
}

function enqueue(eventName, distinctId, properties) {
  if (!POSTHOG_KEY) {
    return;
  }
  if (eventQueue.length >= MAX_QUEUE) {
    eventQueue.shift(); // drop oldest if at capacity
  }
  eventQueue.push({
    api_key: POSTHOG_KEY,
    event: eventName,
    distinct_id: distinctId,
    properties: { $lib: 'pocketbase', ...properties },
    timestamp: new Date().toISOString()
  });
}

// ── Request hooks (enqueue events, non-blocking) ──────────────────────
// Scoped to specific collections to reduce noise — add more as needed.

// Create
onRecordCreateRequest((e) => {
  enqueue('pb_request', getRequestId(e) || 'pb-system', {
    $event_id: getRequestId(e) || undefined,
    action: 'create',
    collection: e.collection?.name,
    method: e.http?.request?.method,
    path: e.http?.request?.url?.pathname,
    ip: getClientIp(e),
    auth: getAuthType(e)
  });
  e.next();
});

// Update
onRecordUpdateRequest((e) => {
  enqueue('pb_request', getRequestId(e) || 'pb-system', {
    $event_id: getRequestId(e) || undefined,
    action: 'update',
    collection: e.collection?.name,
    method: e.http?.request?.method,
    path: e.http?.request?.url?.pathname,
    ip: getClientIp(e),
    auth: getAuthType(e)
  });
  e.next();
});

// Delete
onRecordDeleteRequest((e) => {
  enqueue('pb_request', getRequestId(e) || 'pb-system', {
    $event_id: getRequestId(e) || undefined,
    action: 'delete',
    collection: e.collection?.name,
    method: e.http?.request?.method,
    path: e.http?.request?.url?.pathname,
    ip: getClientIp(e),
    auth: getAuthType(e)
  });
  e.next();
});

// List/Search
onRecordsListRequest((e) => {
  enqueue('pb_request', getRequestId(e) || 'pb-system', {
    $event_id: getRequestId(e) || undefined,
    action: 'list',
    collection: e.collection?.name,
    method: e.http?.request?.method,
    path: e.http?.request?.url?.pathname,
    ip: getClientIp(e),
    auth: getAuthType(e)
  });
  e.next();
});

// View (single record)
onRecordViewRequest((e) => {
  enqueue('pb_request', getRequestId(e) || 'pb-system', {
    $event_id: getRequestId(e) || undefined,
    action: 'view',
    collection: e.collection?.name,
    method: e.http?.request?.method,
    path: e.http?.request?.url?.pathname,
    ip: getClientIp(e),
    auth: getAuthType(e)
  });
  e.next();
});

// Auth events
onRecordAuthRequest((e) => {
  enqueue('pb_auth', e.record?.id || getRequestId(e) || 'pb-system', {
    $event_id: getRequestId(e) || undefined,
    collection: e.collection?.name,
    authMethod: e.authMethod || '',
    ip: getClientIp(e)
  });
  e.next();
});

// ── Log hook ──────────────────────────────────────────────────────────
// Forward PB error and warning log entries to PostHog.
// PB log levels: -4=debug, 0=info, 4=warn, 8=error
onModelCreate((e) => {
  if (!POSTHOG_KEY) {
    e.next();
    return;
  }

  try {
    const level = e.model.getInt('level');
    if (level < 4) {
      e.next();
      return;
    } // skip debug and info

    enqueue('pb_log', 'pb-system', {
      $event_id: e.model.id,
      level,
      message: e.model.getString('message'),
      data: e.model.get('data')
    });
  } catch {
    /* ignore parse errors */
  }

  e.next();
}, '_logs');

// ── Cron job ──────────────────────────────────────────────────────────
// Flush the event queue to PostHog every 30 seconds.
// Events are sent one at a time with a short timeout to avoid blocking
// PB's cron scheduler for too long.
$cron.add('flush-posthog', '*/30 * * * * *', () => {
  if (!POSTHOG_KEY || eventQueue.length === 0) {
    return;
  }

  // Drain the queue up to 100 events per tick to bound runtime
  const batch = eventQueue.splice(0, Math.min(eventQueue.length, 100));

  for (const event of batch) {
    try {
      $http.send({
        url: `${POSTHOG_HOST}/capture/`,
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(event),
        timeout: 3
      });
    } catch {
      // Silently drop — PostHog availability must never affect PB
    }
  }
});

console.log(`PostHog hooks registered (key: ${POSTHOG_KEY ? 'set' : 'NOT SET'}, host: ${POSTHOG_HOST})`);
