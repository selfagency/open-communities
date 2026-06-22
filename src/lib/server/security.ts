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
 * `'unsafe-inline'` on script-src-elem is removed — we do NOT use inline scripts.
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
    'ws:',
    'wss:',
    "'self'"
  ],
  'default-src': ["'self'", 'cdn.jsdelivr.net', '*.selfagency.dev', '*.opencommunities.info'],
  'font-src': [
    '*.basemaps.cartocdn.com',
    '*.opencommunities.info',
    'd1sdjtjk6xzm7.cloudfront.net',
    'data:',
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
    "'self'"
  ],
  'script-src-elem': ['*.opencommunities.info', '*.posthog.com', '*.selfagency.dev', 'cdn.jsdelivr.net', "'self'"],
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
    'fonts.cdnfonts.com',
    'fonts.googleapis.com',
    "'self'",
    "'unsafe-inline'"
  ],
  'worker-src': ["'self'", 'blob:']
};

/**
 * Consolidated security header policy.
 *
 * helmet() is composed with customHandler and handleParaglide via
 * sequence() in hooks.server.ts. It MUST be the outermost middleware
 * so security headers are applied before any response processing.
 *
 * CSP is staged: report-only in dev, enforced in production.
 * This lets us tighten inline allowances without breaking live features.
 */
const handle: Handle = helmet({
  contentSecurityPolicy: dev
    ? {
        directives: CSP_DIRECTIVES,
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
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permissionsPolicyDirectives: {
    camera: ['()'],
    'display-capture': ['()'],
    geolocation: ['()'],
    microphone: ['()']
  },
  referrerPolicy: 'strict-origin-when-cross-origin',
  xssFilter: true
});

export default handle;
