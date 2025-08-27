import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

import csp from './csp.js';

const config = {
  kit: {
    adapter: adapter({
      mode: 'standalone'
    }),
    // Use kit.alias with a proper path so SvelteKit and Vite can resolve $test imports.
    alias: {
      $test: path.resolve('./src/test')
    },
    csp,
    paths: {
      relative: false
    },
    serviceWorker: {
      register: false
    }
  },
  preprocess: [vitePreprocess()]
};

export default config;
