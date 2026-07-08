// fallow-ignore-file unused-file -- auto-loaded by PocketBase at startup
// PocketBase JS Hook — Export logs and traces to PostHog.
//
// Env vars (set in PocketHost dashboard):
//   POSTHOG_PB_API_KEY  — PostHog project API key
//   POSTHOG_PB_HOST     — PostHog API host (default: https://us.i.posthog.com)
//
// NOTE: PB's JSVM runs each handler in its own isolated context. Module-level
// variables and functions are NOT accessible inside handler callbacks.
// Config is loaded via require() from posthog-config.pb.js to work around this.

onModelCreate((e) => {
  try {
    const cfg = require(`${__hooks}/posthog-config.pb.js`);
    if (!cfg.key) {
      e.next();
      return;
    }

    const level = e.model.getInt('level');
    const raw = e.model.get('data');

    // Skip debug/info that isn't a request log
    if (level < 4 && !(raw && raw.type === 'request')) {
      e.next();
      return;
    }

    const rid = e.model.getString('id');
    const eventName = level >= 4 ? 'pb_log' : 'pb_request';
    const distinctId = raw?.['x-request-id'] || rid;

    $http.send({
      url: `${cfg.host}/capture/`,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        api_key: cfg.key,
        event: eventName,
        distinct_id: distinctId,
        properties: {
          $lib: 'pocketbase',
          $event_id: raw?.['x-request-id'] ? raw['x-request-id'] : rid,
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
    /* PostHog must never break PB */
  }

  e.next();
}, '_logs');

console.log('PostHog log hook registered');
