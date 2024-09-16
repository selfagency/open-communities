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
		csp: {
			directives: {
				'script-src': ['self'],
				'worker-src': ['self', 'blob:']
			}
		},
		serviceWorker: {
			register: false
		}
	}
};

export default config;
