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
					'inline',
					'unsafe-eval',
					'unsafe-inline',
					'js.prosopo.io',
					'va.vercel-scripts.com',
					'*.sentry.io',
					'basemaps.cartocdn.com',
					'*.basemaps.cartocdn.com'
				],
				'script-src-elem': ['self', 'inline', 'va.vercel-scripts.com', 'js.prosopo.io'],
				'child-src': ['self', 'blob:'],
				'style-src': ['self', 'inline', 'unsafe-inline', 'js.prosopo.io', 'fonts.googleapis.com'],
				'style-src-elem': ['self', 'inline', 'unsafe-inline', 'fonts.googleapis.com'],
				'font-src': ['self', 'data:', 'fonts.gstatic.com', 'fonts.googleapis.com'],
				'connect-src': [
					'self',
					'127.0.0.1:8090',
					'api.opencommunities.info',
					'js.prosopo.io',
					'va.vercel-scripts.com',
					'basemaps.cartocdn.com',
					'*.basemaps.cartocdn.com',
					'*.sentry.io'
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
