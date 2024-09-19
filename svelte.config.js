import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import postcssConfig from 'postcss-load-config';

const config = {
	preprocess: vitePreprocess({
		postcss: true,
		postcssConfig
	}),
	kit: {
		adapter: adapter(),
		serviceWorker: {
			register: false
		},
		csp: {
			directives: {
				'default-src': ['self'],
				'script-src': [
					'self',
					'unsafe-eval',
					'unsafe-inline',
					'*.prosopo.io',
					'va.vercel-scripts.com',
					'basemaps.cartocdn.com',
					'*.basemaps.cartocdn.com'
				],
				'style-src': ['self', 'unsafe-inline', '*.prosopo.io'],
				'font-src': ['self', 'fonts.gstatic.com', 'fonts.googleapis.com'],
				'connect-src': [
					'self',
					'api.opencommunities.info',
					'api.prosopo.io',
					'prosopo.io',
					'va.vercel-scripts.com',
					'basemaps.cartocdn.com',
					'*.basemaps.cartocdn.com',
					'*.ingest.us.sentry.io'
				],
				'worker-src': ['self', 'blob:'],
				'img-src': ['self', 'data:'],
				'report-uri': [
					'https://o247950.ingest.us.sentry.io/api/4507958645948416/security/?sentry_key=304d7d493ffd890f8928c8fa11a5007e'
				]
			}
		}
	}
};

export default config;
