import adapter from '@sveltejs/adapter-node';
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
			directives: {}
		},
		csrf: {
			checkOrigin: false
		},
		// files: {
		// 	serviceWorker: 'src/service-worker.ts'
		// },
		serviceWorker: {
			register: false
		}
	}
};

export default config;
