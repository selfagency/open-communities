// fallow-ignore-file unused-file -- auto-loaded by SvelteKit at startup
/**
 * Server-side instrumentation for OpenTelemetry tracing and logging.
 *
 * Runs before any application code is imported (guaranteed by SvelteKit's
 * experimental.instrumentation.server option).
 *
 * Sets up:
 * - OTLP trace exporter sending to PostHog's traces ingestion endpoint
 * - OTLP log exporter sending to PostHog's logs ingestion endpoint
 * - HTTP auto-instrumentation for incoming requests and outgoing calls
 * - Resource attributes for service identification
 *
 * Uses dynamic import() for OpenTelemetry packages so they're only loaded
 * when PUBLIC_POSTHOG_KEY is configured. In dev without a key, none of the
 * large OTel dependencies are loaded, avoiding Vite serving overhead.
 */

const phKey = process.env.PUBLIC_POSTHOG_KEY;
const phHost = process.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

if (phKey) {
  const [
    { BatchSpanProcessor },
    { OTLPTraceExporter },
    { NodeTracerProvider },
    { BatchLogRecordProcessor },
    { OTLPLogExporter },
    { logs },
    { NodeSDK },
    { resourceFromAttributes }
  ] = await Promise.all([
    import('@opentelemetry/sdk-trace-base'),
    import('@opentelemetry/exporter-trace-otlp-proto'),
    import('@opentelemetry/sdk-trace-node'),
    import('@opentelemetry/sdk-logs'),
    import('@opentelemetry/exporter-logs-otlp-http'),
    import('@opentelemetry/api-logs'),
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/resources')
  ]);

  const resource = resourceFromAttributes({
    'service.name': 'open-communities',
    'service.version': '1.0.0'
  });

  // Trace exporter — sends OTel spans to PostHog's /i/v1/traces endpoint
  const traceExporter = new OTLPTraceExporter({
    url: new URL('/i/v1/traces', phHost).href,
    headers: {
      Authorization: `Bearer ${phKey}`
    }
  });

  const traceProvider = new NodeTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(traceExporter)]
  });

  traceProvider.register();

  // Log exporter — sends OTel log records to PostHog's /i/v1/logs endpoint
  const logExporter = new OTLPLogExporter({
    url: new URL('/i/v1/logs', phHost).href,
    headers: {
      Authorization: `Bearer ${phKey}`
    }
  });

  const sdk = new NodeSDK({
    resource,
    logRecordProcessor: new BatchLogRecordProcessor(logExporter)
  });

  sdk.start();

  const otelLogger = logs.getLogger('open-communities');

  // Register HTTP auto-instrumentation
  const { HttpInstrumentation } = await import('@opentelemetry/instrumentation-http');
  const { registerInstrumentations } = await import('@opentelemetry/instrumentation');

  registerInstrumentations({
    instrumentations: [new HttpInstrumentation()]
  });

  // Store references on globalThis for use by hooks.server.ts and logger.ts
  (globalThis as Record<string, unknown>).__OTEL_LOGGER__ = otelLogger;
  (globalThis as Record<string, unknown>).__OTEL_SDK__ = sdk;
  (globalThis as Record<string, unknown>).__OTEL_TRACE_PROVIDER__ = traceProvider;
}

export {};
