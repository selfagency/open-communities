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

// handler must be self-contained (PB isolation scope)

// NOTE: helpers must be declared inside the handler function due to PB JSVM isolation.

onModelCreate((e) => {
  // All helper functions must live inside the handler because PB JSVM
  // executes each handler in an isolated context.
  function readConfig() {
    let key = '';
    let host = 'https://us.i.posthog.com';
    try {
      if (typeof process !== 'undefined' && process.env) {
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
    while (host.length > 0 && host.at(-1) === '/') {
      host = host.slice(0, -1);
    }
    return { key, host };
  }

  function shouldSkip(level, raw) {
    // Skip debug (-4) unless it's a request log; keep info(0) and above
    return level < 0 && !(raw && raw.type === 'request');
  }

  function makePhBody(model, raw, eventName, distinctId, level, rid, key) {
    return {
      api_key: key,
      event: eventName,
      distinct_id: distinctId,
      properties: {
        $lib: 'pocketbase',
        $event_id: (raw && (raw['x-request-id'] || raw['request-id'])) || rid,
        level,
        message: model.message,
        method: raw ? raw.method : undefined,
        path: raw ? raw.url : undefined,
        status: raw ? raw.status : undefined,
        execTimeMs: raw ? Math.round((raw.execTime || 0) * 1000) : undefined,
        ip: raw ? raw.remoteIP : undefined,
        auth: raw ? raw.auth : undefined
      },
      timestamp: new Date().toISOString()
    };
  }

  function fireAndForget(url, body) {
    try {
      $http
        .send({
          url,
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          timeout: 5
        })
        .catch((err) => {
          // Log the error for debugging but don't emit logs from PB
          $console.error('PostHog fireAndForget failed:', err);
        });
    } catch (err) {
      $console.error('PostHog fireAndForget exception:', err);
    }
  }

  function getEventMeta(model) {
    const level = model.level;
    const raw = model.data;
    const rid = model.id;
    const eventName = level >= 4 ? 'pb_log' : 'pb_request';
    const xrid = raw?.['x-request-id'] || '';
    const distinctId = xrid || 'pocketbase';
    return { level, raw, rid, eventName, distinctId };
  }

  const cfg = readConfig();
  $console.log('PostHog config:', cfg.key ? 'key present' : 'NO KEY', 'host:', cfg.host);
  if (!cfg.key) {
    $console.log('PostHog: skipping - no API key');
    e.next();
    return;
  }

  const { level, raw, rid, eventName, distinctId } = getEventMeta(e.model);
  $console.log('PostHog: processing', eventName, 'level:', level, 'skip:', shouldSkip(level, raw));
  if (shouldSkip(level, raw)) {
    e.next();
    return;
  }

  const phUrl = `${cfg.host}/i/v0/e/`;
  const phBody = makePhBody(e.model, raw, eventName, distinctId, level, rid, cfg.key);
  $console.log('PostHog: sending to', phUrl, 'body:', JSON.stringify(phBody).slice(0, 200));

  e.next();
  fireAndForget(phUrl, phBody);
  return;
}, '_logs');

$console.log('PostHog hook initialized');
