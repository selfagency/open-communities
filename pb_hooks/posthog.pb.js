// fallow-ignore-file complexity,unused-file -- auto-loaded by PocketBase at startup
// PocketBase JS Hook — Export API request traces to PostHog as OTel spans and logs.
//
// Env vars (set in PocketHost dashboard):
//   POSTHOG_PB_API_KEY  — PostHog project API key
//   POSTHOG_PB_HOST     — PostHog API host (default: https://us.i.posthog.com)
//
// Uses request hooks (onRecordsListRequest, onRecordViewRequest, etc.) to capture
// every API request as an OTel span sent to /i/v1/traces and a log record to /i/v1/logs.

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

function makeTraceId() {
  // NOSONAR
  let hex = '';
  for (let i = 0; i < 32; i++) {
    hex += '0123456789abcdef'.charAt(Math.floor(Math.random() * 16)); // NOSONAR
  }
  return hex;
}

function makeSpanId() {
  // NOSONAR
  let hex = '';
  for (let i = 0; i < 16; i++) {
    hex += '0123456789abcdef'.charAt(Math.floor(Math.random() * 16)); // NOSONAR
  }
  return hex;
}

function toNanos(date) {
  // NOSONAR
  return (date.getTime() * 1_000_000).toString();
}

function makeSpanAttrs(e, _startTime, execTimeMs) {
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
    attrs.push({ key: 'error.message', value: { stringValue: `HTTP ${status}` } });
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
    traceId,
    spanId,
    severityText,
    severityNumber,
    body: { stringValue: `${method} ${url} → ${status}` },
    timeUnixNano: toNanos(startTime),
    attributes: [
      { key: 'service.name', value: { stringValue: 'pocketbase' } },
      { key: 'http.method', value: { stringValue: method } },
      { key: 'http.url', value: { stringValue: url } },
      { key: 'http.status_code', value: { intValue: status } },
      { key: 'http.route', value: { stringValue: url } },
      { key: 'exec_time_ms', value: { intValue: execTimeMs } },
      { key: 'client.ip', value: { stringValue: e.request?.remoteIP || '' } },
      { key: 'auth', value: { stringValue: e.auth?.id || '' } }
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
    $http
      .send({
        url,
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        timeout: 5
      })
      .catch(() => {
        /* fire-and-forget: swallow errors silently */
      });
  } catch {
    /* fire-and-forget: swallow errors silently */
  }
}

function sendSpan(e, cfg) {
  const startTime = new Date();
  const execTimeMs = 0;

  let traceId = '';
  try {
    if (e.request?.header) {
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
    traceId,
    spanId,
    parentSpanId: '',
    name: `${method} ${url}`,
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

  const logRecord = buildLogRecord({ traceId, spanId, method, url, status, startTime, execTimeMs, e });
  const logPayload = buildLogPayload(logRecord);

  postJson(`${cfg.host}/i/v1/traces`, otlpPayload);
  postJson(`${cfg.host}/i/v1/logs`, logPayload);
}

const cfg = readConfig();
if (cfg.key) {
  const handler = (e) => {
    sendSpan(e, cfg);
    e.next();
  };

  onRecordsListRequest(handler);
  onRecordViewRequest(handler);
  onRecordCreateRequest(handler);
  onRecordUpdateRequest(handler);
  onRecordDeleteRequest(handler);
}
