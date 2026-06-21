import type { Handle } from '@sveltejs/kit';

import helmet from 'sveltekit-helmet';

import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';

const handle: Handle = dev
  ? ({ event, resolve }) => resolve(event)
  : helmet({
      contentSecurityPolicy: {
        directives: {
          'child-src': ["'self'", 'blob:'],
          'connect-src': [
            '*.basemaps.cartocdn.com',
            '*.i.posthog.com',
            '*.opencommunities.info',
            '*.pockethost.io',
            '*.selfagency.dev',
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
          'img-src': ["'self'", 'data:', 'blob:', '*.basemaps.cartocdn.com', '*.opencommunities.info'],
          reportTo: ['posthog'],
          reportUri: [`${env.PUBLIC_POSTHOG_HOST}/report/?token=${env.PUBLIC_POSTHOG_KEY}`],
          // reportTo and reportUri both use PUBLIC_POSTHOG_KEY — not PUBLIC_POSTHOG_TOKEN
          'script-src': [
            '*.basemaps.cartocdn.com',
            '*.opencommunities.info',
            '*.posthog.com',
            '*.selfagency.dev',
            'basemaps.cartocdn.com',
            'cdn.jsdelivr.net',
            "'self'",
            "'unsafe-inline'"
          ],
          'script-src-elem': [
            '*.opencommunities.info',
            '*.posthog.com',
            '*.selfagency.dev',
            'cdn.jsdelivr.net',
            "'self'",
            "'unsafe-inline'"
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
            'fonts.cdnfonts.com',
            'fonts.googleapis.com',
            "'self'",
            "'unsafe-inline'"
          ],
          'worker-src': ["'self'", 'blob:']
        }
      }
    });

export default handle;
