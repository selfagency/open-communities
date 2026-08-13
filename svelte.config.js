import path from 'node:path';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  kit: {
    adapter: adapter({
      mode: 'standalone'
    }),
    // Use kit.alias with a proper path so SvelteKit and Vite can resolve $test imports.
    alias: {
      $test: path.resolve('./src/test')
    },
    csrf: {
      trustedOrigins: ['http://localhost:5173', 'http://localhost:4173', 'https://opencommunities.info']
    },
    experimental: {
      instrumentation: {
        server: true
      }
    },
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
