import helmet from 'sveltekit-helmet';

export default helmet({
  contentSecurityPolicy: {
    directives: {
      'child-src': ["'self'", 'blob:'],
      'connect-src': [
        "'self'",
        'ws:',
        'wss:',
        'localhost:8090',
        'localhost:3001',
        'api.opencommunities.info',
        '*.i.posthog.com',
        'captcha.selfagency.dev',
        'cdn.jsdelivr.net',
        'basemaps.cartocdn.com',
        '*.basemaps.cartocdn.com'
      ],
      'default-src': ["'self'", 'cdn.jsdelivr.net', 'captcha.selfagency.dev', 'api.opencommunities.info'],
      'font-src': [
        "'self'",
        'data:',
        'fonts.cdnfonts.com',
        'fonts.gstatic.com',
        'fonts.googleapis.com',
        '*.basemaps.cartocdn.com'
      ],
      'img-src': ["'self'", 'data:', 'blob:', '*.basemaps.cartocdn.com'],
      'script-src': [
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
        'captcha.selfagency.dev',
        'cdn.jsdelivr.net',
        'basemaps.cartocdn.com',
        '*.basemaps.cartocdn.com',
        '*.i.posthog.com'
      ],
      'script-src-elem': ["'self'", "'unsafe-inline'", 'captcha.selfagency.dev', 'cdn.jsdelivr.net', '*.i.posthog.com'],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'captcha.selfagency.dev',
        'fonts.cdnfonts.com',
        'fonts.googleapis.com'
      ],
      'style-src-elem': ["'self'", "'unsafe-inline'", 'fonts.cdnfonts.com', 'fonts.googleapis.com'],
      'worker-src': ["'self'", 'blob:']
    }
  }
});
