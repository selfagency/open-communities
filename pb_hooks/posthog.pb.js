// fallow-ignore-file complexity,unused-file -- auto-loaded by PocketBase at startup
// PocketBase JS Hook — Export API request traces to PostHog as OTel spans and logs.
//
// Env vars (set in PocketHost dashboard):
//   POSTHOG_PB_API_KEY  — PostHog project API key
//   POSTHOG_PB_HOST     — PostHog API host (default: https://us.i.posthog.com)
//
// Uses request hooks (onRecordsListRequest, onRecordViewRequest, etc.) to capture
// every API request as an OTel span sent to /i/v1/traces and a log record to /i/v1/logs.
//
// IMPORTANT (PB 0.23+ JSVM):
// - Hook handlers must be plain non-async functions that call e.next() —
//   an async handler returns a Promise, which the JSVM rejects with
//   "the handler must a non-async function and not return a Promise".
// - Per "Handlers scope" in the PB JS docs, each handler runs in its own
//   isolated serialized context and cannot see helpers declared at file scope
//   or in a closure. Every helper used by a handler must be declared inside
//   that handler's body.

const handler = (e) => {
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
    while (host.length > 0 && host[host.length - 1] === '/') {
      host = host.slice(0, -1);
    }
    return { key: key, host: host };
  }

  function makeTraceId() {
    let hex = '';
    // nosec: observability IDs, not cryptographic
    for (let i = 0; i < 32; i++) {
      hex += '0123456789abcdef'.charAt(Math.floor(Math.random() * 16));
    }
    return hex;
  }

  function makeSpanId() {
    let hex = '';
    // nosec: observability IDs, not cryptographic
    for (let i = 0; i < 16; i++) {
      hex += '0123456789abcdef'.charAt(Math.floor(Math.random() * 16));
    }
    return hex;
  }

  function toNanos(date) {
    return (date.getTime() * 1000000).toString();
  }

  function makeSpanAttrs(e, startTime, execTimeMs) {
    const method = e.request ? e.request.method : 'UNKNOWN';
    const url = e.url || '';
    const status = e.response ? e.response.statusCode : 0;
    const auth = e.auth ? e.auth.id : '';
    const ip = e.request ? e.request.remoteIP : '';
    const attrs = [
      { key: 'service.name', value: { stringValue: 'pocketbase' } },
      { key: 'http.method', value: { stringValue: method } },
      { key: 'http.url', value: { stringValue: url } },
      { key: 'http.status_code', value: { intValue: status } },
      { key: 'http.route', value: { stringValue: url } },
      { key: 'exec_time_ms', value: { intValue: execTimeMs } },
      { key: 'client.ip', value: { stringValue: ip } },
      { key: 'auth', value: { stringValue: auth } }
    ];
    if (status >= 400) {
      attrs.push({ key: 'error.message', value: { stringValue: 'HTTP ' + status } });
    }
    return attrs;
  }

  function buildLogRecord(opts) {
    const { traceId, spanId, method, url, status, startTime, execTimeMs, e } = opts;
    let severityText = 'info';
    let severityNumber = 9;
    if (status >= 500) {
      severityText = 'error';
      severityNumber = 17;
    } else if (status >= 400) {
      severityText = 'warn';
      severityNumber = 13;
    }
    return {
      traceId: traceId,
      spanId: spanId,
      severityText: severityText,
      severityNumber: severityNumber,
      body: { stringValue: method + ' ' + url + ' -> ' + status },
      timeUnixNano: toNanos(startTime),
      attributes: [
        { key: 'service.name', value: { stringValue: 'pocketbase' } },
        { key: 'http.method', value: { stringValue: method } },
        { key: 'http.url', value: { stringValue: url } },
        { key: 'http.status_code', value: { intValue: status } },
        { key: 'http.route', value: { stringValue: url } },
        { key: 'exec_time_ms', value: { intValue: execTimeMs } },
        { key: 'client.ip', value: { stringValue: e.request ? e.request.remoteIP : '' } },
        { key: 'auth', value: { stringValue: e.auth ? e.auth.id : '' } }
      ]
    };
  }

  function buildLogPayload(logRecord) {
    return {
      resourceLogs: [
        {
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: 'pocketbase' } },
              { key: 'service.version', value: { stringValue: '0.29.x' } }
            ]
          },
          scopeLogs: [
            {
              scope: { name: 'pocketbase', version: '0.1.0' },
              logRecords: [logRecord]
            }
          ]
        }
      ]
    };
  }

  function postJson(url, body) {
    try {
      var resp = $http.send({
        url: url,
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        timeout: 5
      });
    } catch (err) {
      /* fire-and-forget: swallow errors silently */
    }
  }

  function sendSpan(e, cfg) {
    const startTime = new Date();
    const execTimeMs = 0;
    let traceId = '';
    try {
      if (e.request && e.request.header) {
        traceId = e.request.header['x-request-id'] || '';
      }
    } catch {
      /* ignore */
    }
    if (!traceId) {
      traceId = makeTraceId();
    }
    const spanId = makeSpanId();
    const method = e.request ? e.request.method : 'UNKNOWN';
    const url = e.url || '';
    const status = e.response ? e.response.statusCode : 0;
    const span = {
      traceId: traceId,
      spanId: spanId,
      parentSpanId: '',
      name: method + ' ' + url,
      kind: 2,
      startTimeUnixNano: toNanos(startTime),
      endTimeUnixNano: toNanos(new Date()),
      attributes: makeSpanAttrs(e, startTime, execTimeMs),
      status: { code: status >= 500 ? 2 : 0 }
    };
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
              scope: { name: 'pocketbase', version: '0.1.0' },
              spans: [span]
            }
          ]
        }
      ]
    };
    const logRecord = buildLogRecord({
      traceId: traceId,
      spanId: spanId,
      method: method,
      url: url,
      status: status,
      startTime: startTime,
      execTimeMs: execTimeMs,
      e: e
    });
    const logPayload = buildLogPayload(logRecord);
    postJson(cfg.host + '/i/v1/traces', otlpPayload);
    postJson(cfg.host + '/i/v1/logs', logPayload);
  }

  try {
    const cfg = readConfig();
    if (!cfg.key) {
      e.next();
      return;
    }
    sendSpan(e, cfg);
  } catch (err) {
    console.error('posthog hook error:', String(err));
  }
  e.next();
};

onRecordsListRequest(handler);
onRecordViewRequest(handler);
onRecordCreateRequest(handler);
onRecordUpdateRequest(handler);
onRecordDeleteRequest(handler);
