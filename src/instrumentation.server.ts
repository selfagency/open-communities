/**
 * Server-side instrumentation for OpenTelemetry tracing and logging.
 *
 * Runs before any application code is imported (guaranteed by SvelteKit's
 * experimental.instrumentation.server option).
 *
 * Sets up:
 * - OTLP log exporter sending to PostHog's logs ingestion endpoint
 * - Resource attributes for service identification
 *
 * Uses dynamic import() for OpenTelemetry packages so they're only loaded
 * when PUBLIC_POSTHOG_KEY is configured. In dev without a key, none of the
 * large OTel dependencies are loaded, avoiding Vite serving overhead.
 */

const phKey = process.env.PUBLIC_POSTHOG_KEY;
const phHost = process.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

if (phKey) {
  const [{ BatchLogRecordProcessor }, { OTLPLogExporter }, { logs }, { NodeSDK }, { resourceFromAttributes }] =
    await Promise.all([
      import('@opentelemetry/sdk-logs'),
      import('@opentelemetry/exporter-logs-otlp-http'),
      import('@opentelemetry/api-logs'),
      import('@opentelemetry/sdk-node'),
      import('@opentelemetry/resources')
    ]);

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      'service.name': 'open-communities',
      'service.version': '1.0.0'
    }),
    logRecordProcessor: new BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: `${phHost.replace(/\/+$/, '')}/i/v1/logs`,
        headers: {
          Authorization: `Bearer ${phKey}`
        }
      })
    )
  });

  sdk.start();

  const otelLogger = logs.getLogger('open-communities');

  (globalThis as Record<string, unknown>).__OTEL_LOGGER__ = otelLogger;
  (globalThis as Record<string, unknown>).__OTEL_SDK__ = sdk;
}

export {};
