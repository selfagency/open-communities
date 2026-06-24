import path from 'node:path';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  kit: {
    adapter: adapter({
      mode: 'standalone'
    }),
    csrf: {
      checkOrigin: true
    },
    // Use kit.alias with a proper path so SvelteKit and Vite can resolve $test imports.
    alias: {
      $test: path.resolve('./src/test')
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
