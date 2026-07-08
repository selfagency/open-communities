// fallow-ignore-file unused-file -- auto-loaded by PocketBase at startup
// PocketBase JS Hook — Export logs and request traces to PostHog.
// Correlates with SvelteKit events via X-Request-Id header.
//
// Environment variables (set in PocketHost dashboard):
//   POSTHOG_PB_API_KEY  — PostHog project API key (required for capture)
//   POSTHOG_PB_HOST     — PostHog API host (default: https://us.i.posthog.com)
//
// Architecture:
//   Request hooks enqueue events (fast, non-blocking push to array).
//   Cron job flushes queue to PostHog's /capture endpoint every 30s.
//   Log hook forwards PB error/warn log entries the same way.
//   HTTP calls stay out of the request path entirely.

// ── Config (module-level vars — try/catch protects env access) ────────
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
  /* silent — env access errors must never break PB */
}

// ── Event queue (module scope, persists across hook invocations) ──────
const eventQueue = [];
const MAX_QUEUE = 500;

// ── Helpers (module-level — NOT inside try, avoid strict-mode scoping) ─

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
    const a = e.http?.request?.auth;
    if (!a) {
      return 'none';
    }
    return a?.record?.collectionName === '_superusers' ? 'superuser' : 'user';
  } catch {
    return 'unknown';
  }
}

function enqueue(eventName, distinctId, properties) {
  if (!POSTHOG_KEY) {
    return;
  }
  if (eventQueue.length >= MAX_QUEUE) {
    eventQueue.shift();
  }
  eventQueue.push({
    api_key: POSTHOG_KEY,
    event: eventName,
    distinct_id: distinctId,
    properties: { $lib: 'pocketbase', ...properties },
    timestamp: new Date().toISOString()
  });
}

// ── Request hooks ─────────────────────────────────────────────────────

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
onModelCreate((e) => {
  if (!POSTHOG_KEY) {
    e.next();
    return;
  }
  try {
    const lvl = e.model.getInt('level');
    if (lvl < 4) {
      e.next();
      return;
    }
    enqueue('pb_log', 'pb-system', {
      $event_id: e.model.id,
      level: lvl,
      message: e.model.getString('message'),
      data: e.model.get('data')
    });
  } catch {
    /* silent — env access errors must never break PB */
  }
  e.next();
}, '_logs');

// ── Cron job ──────────────────────────────────────────────────────────
$cron.add('flush-posthog', '*/30 * * * * *', () => {
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
      /* silent — env access errors must never break PB */
    }
  }
});

console.log(`PostHog hooks registered (key: ${POSTHOG_KEY ? 'set' : 'NOT SET'})`);
