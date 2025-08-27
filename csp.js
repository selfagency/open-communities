export default {
  directives: {
    'child-src': ['self', 'blob:'],
    'connect-src': [
      'self',
      'ws:',
      'wss:',
      'localhost:8090',
      'localhost:3001',
      'api.opencommunities.info',
      '*.pockethost.io',
      'captcha.selfagency.dev',
      'cdn.jsdelivr.net',
      'basemaps.cartocdn.com',
      '*.basemaps.cartocdn.com',
      '*.sentry.io'
    ],
    'default-src': ['self', 'cdn.jsdelivr.net', 'captcha.selfagency.dev', 'api.opencommunities.info'],
    'font-src': [
      'self',
      'data:',
      'fonts.cdnfonts.com',
      'fonts.gstatic.com',
      'fonts.googleapis.com',
      '*.basemaps.cartocdn.com'
    ],
    'img-src': ['self', 'data:', 'blob:', '*.basemaps.cartocdn.com'],
    'report-uri': [
      'https://o247950.ingest.us.sentry.io/api/4507958645948416/security/?sentry_key=304d7d493ffd890f8928c8fa11a5007e'
    ],
    'script-src': [
      'self',
      'unsafe-eval',
      'unsafe-inline',
      'captcha.selfagency.dev',
      'cdn.jsdelivr.net',
      '*.sentry.io',
      'basemaps.cartocdn.com',
      '*.basemaps.cartocdn.com',
      'nonce-o247950'
    ],
    'script-src-elem': ['self', 'unsafe-inline', '*.sentry.io', 'captcha.selfagency.dev', 'cdn.jsdelivr.net'],
    'style-src': ['self', 'unsafe-inline', 'captcha.selfagency.dev', 'fonts.cdnfonts.com', 'fonts.googleapis.com'],
    'style-src-elem': ['self', 'unsafe-inline', 'fonts.cdnfonts.com', 'fonts.googleapis.com'],
    'worker-src': ['self', 'blob:']
  }
};
