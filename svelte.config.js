import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

import csp from './csp.js';

const config = {
	kit: {
		adapter: adapter({
			mode: 'standalone'
		}),
		csp,
		serviceWorker: {
			register: false
		}
	},
	preprocess: [vitePreprocess()]
};

export default config;
