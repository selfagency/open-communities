import type { Handle } from '@sveltejs/kit';

import helmet from 'sveltekit-helmet';

import { dev } from '$app/environment';

/**
 * Shared CSP directives used in both report-only and enforce modes.
 *
 * Allowed external origins (preserved from Phase 2 audit):
 * - PostHog: analytics capture
 * - PocketBase: API (self-hosted, connected at runtime)
 * - MapLibre basemaps: carto.com CDN
 * - Google Fonts: typography
 * - Cap widget CDN: captcha
 *
 * `'unsafe-inline'` on style-src is required for Tailwind's runtime style injection.
 * `'unsafe-inline'` on script-src-elem is required for SvelteKit's inline hydration
 * bootstrap and Cap captcha widget inline scripts. CSP is staged:
 * report-only in dev, enforced in production.
 */
const CSP_DIRECTIVES = {
  'base-uri': ["'self'"],
  'child-src': ["'self'", 'blob:'],
  'connect-src': [
    '*.basemaps.cartocdn.com',
    '*.i.posthog.com',
    '*.opencommunities.info',
    '*.pockethost.io',
    '*.selfagency.dev',
    '*.posthog.com',
    'basemaps.cartocdn.com',
    'cdn.jsdelivr.net',
    'localhost:3001',
    'localhost:8090',
    'static.cloudflareinsights.com',
    "'self'"
  ],
  'default-src': ["'self'", 'cdn.jsdelivr.net', '*.selfagency.dev', '*.opencommunities.info'],
  'font-src': [
    '*.basemaps.cartocdn.com',
    '*.opencommunities.info',
    'd1sdjtjk6xzm7.cloudfront.net',
    'data:',
    'fonts.bunny.net',
    'fonts.cdnfonts.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'us.posthog.com',
    "'self'"
  ],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'frame-src': ["'self'"],
  'img-src': ["'self'", 'data:', 'blob:', '*.basemaps.cartocdn.com', '*.opencommunities.info'],
  'manifest-src': ["'self'"],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'script-src': [
    '*.basemaps.cartocdn.com',
    '*.opencommunities.info',
    '*.posthog.com',
    '*.selfagency.dev',
    'basemaps.cartocdn.com',
    'cdn.jsdelivr.net',
    'static.cloudflareinsights.com',
    "'self'",
    "'wasm-unsafe-eval'" // MapLibre GL JS compiles WebAssembly for vector tile rendering
  ],
  'script-src-elem': [
    '*.opencommunities.info',
    '*.posthog.com',
    '*.selfagency.dev',
    'cdn.jsdelivr.net',
    'static.cloudflareinsights.com',
    "'self'",
    "'unsafe-inline'" // SvelteKit hydration bootstrap + Cap captcha widget inline scripts
  ],
  'style-src': [
    '*.opencommunities.info',
    '*.selfagency.dev',
    'fonts.cdnfonts.com',
    'fonts.googleapis.com',
    "'self'",
    "'unsafe-inline'"
  ],
  'style-src-elem': [
    '*.opencommunities.info',
    'fonts.bunny.net',
    'fonts.cdnfonts.com',
    'fonts.googleapis.com',
    "'self'",
    "'unsafe-inline'"
  ],
  'worker-src': ["'self'", 'blob:']
};

/** Production-safe connect-src without bare WebSocket wildcards. */
const CONNECT_SRC_BASE = CSP_DIRECTIVES['connect-src'];

/** Dev connect-src adds ws:/wss: for Vite HMR. */
const CONNECT_SRC_DEV = [...CONNECT_SRC_BASE, 'ws:', 'wss:'];

/**
 * Consolidated security header policy.
 *
 * helmet() is composed with customHandler and handleParaglide via
 * sequence() in hooks.server.ts. It MUST be the outermost middleware
 * so security headers are applied before any response processing.
 *
 * CSP is staged: report-only in dev (with WebSocket for HMR), enforced
 * in production (no bare ws:/wss: wildcards). This lets us tighten
 * inline allowances without breaking live features.
 */
const handle: Handle = helmet({
  contentSecurityPolicy: dev
    ? {
        directives: { ...CSP_DIRECTIVES, 'connect-src': CONNECT_SRC_DEV },
        reportOnly: true
      }
    : {
        directives: CSP_DIRECTIVES,
        reportOnly: false
      },
  crossOriginEmbedderPolicy: false, // Required for MapLibre CDN resources
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: true },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31_536_000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

export default handle;
