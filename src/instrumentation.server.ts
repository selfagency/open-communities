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
 * The PostHog project token is read from PUBLIC_POSTHOG_KEY (same as event capture).
 * The OTLP endpoint defaults to PostHog US cloud; override via PUBLIC_POSTHOG_HOST
 * for EU cloud (https://eu.i.posthog.com) or self-hosted instances.
 */

import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { logs } from '@opentelemetry/api-logs';
import { NodeSDK } from '@opentelemetry/sdk-node';
import type { Resource } from '@opentelemetry/resources';
import { resourceFromAttributes } from '@opentelemetry/resources';

// Using dynamic env read — at instrumentation time the module-level
// $env/dynamic/public may not be available, so we read from process.env.
const phKey = process.env.PUBLIC_POSTHOG_KEY;
const phHost = process.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

if (phKey) {
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

  // Expose the OpenTelemetry logger for use in $lib/server/logger.ts
  const otelLogger = logs.getLogger('open-communities');

  // Attach to global so the server logger can emit OTel records without
  // importing instrumentation modules at runtime.
  (globalThis as Record<string, unknown>).__OTEL_LOGGER__ = otelLogger;
  (globalThis as Record<string, unknown>).__OTEL_SDK__ = sdk;
}
