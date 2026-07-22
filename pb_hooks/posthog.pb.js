// fallow-ignore-file complexity,unused-file -- auto-loaded by PocketBase at startup
// PocketBase JS Hook — Export request logs as OTel spans to PostHog.
//
// Env vars (set in PocketHost dashboard):
//   POSTHOG_PB_API_KEY  — PostHog project API key
//   POSTHOG_PB_HOST     — PostHog API host (default: https://us.i.posthog.com)
//
// Sends OTLP JSON trace payloads to /i/v1/traces so traces appear in PostHog's
// distributed tracing UI, not as events.
//
// IMPORTANT: PB's JSVM isolates each handler invocation. ALL config and
// logic is inside the handler body — no require(), no external modules,
// no module-level state.

// handler must be self-contained (PB isolation scope)

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

  // Generate a random 16-byte hex string for OTel trace_id
  function makeTraceId() {
    // NOSONAR
    let hex = '';
    for (let i = 0; i < 32; i++) {
      hex += '0123456789abcdef'.charAt(Math.floor(Math.random() * 16)); // NOSONAR
    }
    return hex;
  }

  // Generate a random 8-byte hex string for OTel span_id
  function makeSpanId() {
    // NOSONAR
    let hex = '';
    for (let i = 0; i < 16; i++) {
      hex += '0123456789abcdef'.charAt(Math.floor(Math.random() * 16)); // NOSONAR
    }
    return hex;
  }

  // Convert a Date to nanoseconds since epoch (OTLP format)
  function toNanos(date) {
    // NOSONAR
    return (date.getTime() * 1_000_000).toString();
  }

  // Build OTLP span attributes from a PB log model
  function makeSpanAttrs(raw, level, execTimeMs) {
    const attrs = [
      { key: 'service.name', value: { stringValue: 'pocketbase' } },
      { key: 'http.method', value: { stringValue: raw ? raw.method : 'UNKNOWN' } },
      { key: 'http.url', value: { stringValue: raw ? raw.url : '' } },
      { key: 'http.status_code', value: { intValue: raw ? raw.status : 0 } },
      { key: 'http.route', value: { stringValue: raw ? raw.url : '' } },
      { key: 'exec_time_ms', value: { intValue: execTimeMs } },
      { key: 'client.ip', value: { stringValue: raw ? raw.remoteIP : '' } },
      { key: 'auth', value: { stringValue: raw ? raw.auth : '' } },
      { key: 'log.level', value: { stringValue: level >= 4 ? 'error' : 'info' } }
    ];
    if (level >= 4 && model.message) {
      attrs.push({ key: 'error.message', value: { stringValue: model.message } });
    }
    return attrs;
  }

  // Build an OTLP JSON span from a PB log model
  function makeOtlpSpan(model, raw, level) {
    const now = new Date();
    const execTimeMs = raw?.execTime ? Math.round(raw.execTime * 1000) : 0;
    const startTime = new Date(now.getTime() - execTimeMs);

    return {
      traceId: (raw && (raw['x-request-id'] || raw['request-id'])) || makeTraceId(),
      spanId: makeSpanId(),
      parentSpanId: '',
      name: (raw ? `${raw.method} ${raw.url}` : model.message) || 'pb_request',
      kind: 2, // SPAN_KIND_SERVER
      startTimeUnixNano: toNanos(startTime),
      endTimeUnixNano: toNanos(now),
      attributes: makeSpanAttrs(raw, level, execTimeMs),
      status: { code: level >= 4 ? 2 : 0 }
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
        .catch(() => {
          // fire-and-forget: swallow errors silently
        });
    } catch {
      // fire-and-forget: swallow errors silently
    }
  }

  const cfg = readConfig();
  if (!cfg.key) {
    e.next();
    return;
  }

  const model = e.model;
  const level = model.level;
  const raw = model.data;

  if (shouldSkip(level, raw)) {
    e.next();
    return;
  }

  const span = makeOtlpSpan(model, raw, level);

  const otlpPayload = {
    resourceSpans: [
      {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'pocketbase' } },
            { key: 'service.version', value: { stringValue: '0.29.x' } }
          ]
        },
        scopeSpans: [
          {
            scope: {
              name: 'pocketbase',
              version: '0.1.0'
            },
            spans: [span]
          }
        ]
      }
    ]
  };

  const tracesUrl = `${cfg.host}/i/v1/traces`;

  e.next();
  fireAndForget(tracesUrl, otlpPayload);
  return;
}, '_logs');
