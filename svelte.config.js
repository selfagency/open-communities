import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	kit: {
		adapter: adapter({
			mode: 'standalone'
		}),
		csp: {
			directives: {
				'child-src': ['self', 'blob:'],
				'connect-src': [
					'self',
          'ws:',
          'wss:',
					'127.0.0.1:8090',
					'api.opencommunities.info',
					'*.pockethost.io',
					'captcha.selfagency.dev',
					'cdn.jsdelivr.net',
					'basemaps.cartocdn.com',
					'*.basemaps.cartocdn.com',
					'*.sentry.io'
				],
				'default-src': ['self'],
				'font-src': [
					'self',
					'data:',
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
				'script-src-elem': ['self', 'unsafe-inline', '*.sentry.io', 'captcha.selfagency.dev',  'cdn.jsdelivr.net'],
				'style-src': ['self', 'unsafe-inline', 'captcha.selfagency.dev', 'fonts.googleapis.com'],
				'style-src-elem': ['self', 'unsafe-inline', 'fonts.googleapis.com',  ],
				'worker-src': ['self', 'blob:']
			}
		},
		serviceWorker: {
			register: false
		}
	},
	preprocess: [vitePreprocess()]
};

export default config;
