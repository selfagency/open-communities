import { paraglideVitePlugin } from '@inlang/paraglide-js';
import svg from '@poppanator/sveltekit-svg';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import devtoolsJson from 'vite-plugin-devtools-json';
import { ViteMcp } from 'vite-plugin-mcp';
import inlineSveltePlugin from 'vite-plugin-svelte-inline-component';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('svelte-maplibre')) return 'svelte-maplibre';
        }
      }
    }
  },
  plugins: [
    ViteMcp(),
    mode === 'test' && inlineSveltePlugin(),
    devtoolsJson(),
    tailwindcss(),
    sveltekit(),
    paraglideVitePlugin({
      outdir: './src/lib/paraglide',
      project: './project.inlang'
    }),
    svg()
  ],

  // Resolve aliases for both dev/build and Vitest.
  // Ensure $test/* path mapping from tsconfig/svelte.config is also available to Vite/Vitest.
  resolve: {
    alias: [
      { find: '$test', replacement: path.resolve(__dirname, 'src/test') },
      {
        find: '$test/',
        replacement: path.resolve(__dirname, 'src/test') + '/'
      }
    ],
    ...(process.env.VITEST ? { conditions: ['browser'] } : {})
  },
  sourceMap: 'inline',
  test: {
    coverage: {
      // you can include other reporters, but 'json-summary' is required, json is recommended
      reporter: ['text', 'json-summary', 'json'],
      // If you want a coverage reports even if your tests are failing, include the reportOnFailure option
      reportOnFailure: false
    },
    environment: 'jsdom',
    // enable vitest globals (expect, describe, it) so tests can use them without imports
    globals: true,
    reporter: ['junit', 'json', 'verbose'],
    // run our test setup before tests so we can mock SvelteKit runtime modules
    setupFiles: ['./src/test/setupTest.ts']
  }
}));
