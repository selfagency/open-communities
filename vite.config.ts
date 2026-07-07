import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import svg from '@poppanator/sveltekit-svg';
import posthog from '@posthog/rollup-plugin';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import biomePlugin from 'vite-plugin-biome';
import devtoolsJson from 'vite-plugin-devtools-json';
import { ViteMcp } from 'vite-plugin-mcp';
import inlineSveltePlugin from 'vite-plugin-svelte-inline-component';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  build: {
    sourcemap: true,
    cssMinify: 'esbuild',
    rollupOptions: {
      onwarn(warning, warn) {
        // Rolldown can't statically resolve paraglide's export * re-exports from
        // the generated _index.js, but the exports ARE present at runtime.
        if (warning.code === 'IMPORT_IS_UNDEFINED') {
          return;
        }
        warn(warning);
      },
      output: {
        manualChunks(id: string) {
          if (id.includes('svelte-maplibre')) {
            return 'svelte-maplibre';
          }
        }
      }
    }
  },
  ssr: {
    external: ['@opentelemetry', '@grpc', 'protobufjs'],
    noExternal: ['super-sitemap']
  },
  plugins: [
    ViteMcp(),
    mode === 'test' && inlineSveltePlugin(),
    mode === 'development' &&
      biomePlugin({
        mode: 'lint',
        files: 'src',
        failOnError: false
      }),
    devtoolsJson(),
    tailwindcss(),
    sveltekit(),
    {
      name: 'fix-paraglide-messages',
      enforce: 'post',
      buildStart() {
        // Overwrite the generated messages.js to replace `export * as m` with
        // `import * + export const m`, which Rolldown can resolve correctly.
        const msgPath = path.resolve(import.meta.dirname, 'src/lib/paraglide/messages.js');
        try {
          writeFileSync(
            msgPath,
            [
              '/* eslint-disable */',
              "import * as _m from './messages/_index.js';",
              'export const m = _m;',
              "export * from './messages/_index.js';",
              ''
            ].join('\n')
          );
        } catch {
          // File may not exist yet if paraglide hasn't compiled — that's fine
        }
      }
    },
    paraglideVitePlugin({
      outdir: './src/lib/paraglide',
      project: './project.inlang',
      cleanOutdir: false
    }),
    svg(),
    // PostHog sourcemap upload — only during production builds with credentials
    mode === 'production' &&
      process.env.POSTHOG_CLI_PROJECT_ID &&
      process.env.POSTHOG_CLI_API_KEY &&
      posthog({
        personalApiKey: process.env.POSTHOG_CLI_API_KEY,
        projectId: process.env.POSTHOG_CLI_PROJECT_ID,
        host: process.env.POSTHOG_CLI_HOST,
        sourcemaps: {
          enabled: true,
          releaseName: 'open-communities',
          releaseVersion: process.env.SOURCE_VERSION || process.env.COMMIT_REF || 'dev',
          deleteAfterUpload: true
        }
      })
  ].filter((x): x is Exclude<typeof x, false | '' | undefined> => !!x),

  // Resolve aliases for both dev/build and Vitest.
  // Ensure $test/* path mapping from tsconfig/svelte.config is also available to Vite/Vitest.
  resolve: {
    alias: [
      { find: '$test', replacement: path.resolve(import.meta.dirname, 'src/test') },
      {
        find: '$test/',
        replacement: `${path.resolve(import.meta.dirname, 'src/test')}/`
      }
    ],
    ...(process.env.VITEST ? { conditions: ['browser'] } : {})
  },
  sourceMap: process.env.VITEST ? 'inline' : true,
  test: {
    coverage: {
      // you can include other reporters, but 'json-summary' is required, json is recommended
      reporter: ['text', 'json-summary', 'json'],
      // If you want a coverage reports even if your tests are failing, include the reportOnFailure option
      reportOnFailure: false,
      reportsDirectory: './test-results/coverage'
    },
    environment: 'jsdom',
    // enable vitest globals (expect, describe, it) so tests can use them without imports
    globals: true,
    reporter: ['junit', 'json', 'verbose'],
    outputFile: {
      junit: './test-results/junit.xml',
      json: './test-results/results.json'
    },
    // run our test setup before tests so we can mock SvelteKit runtime modules
    setupFiles: ['./src/test/setupTest.ts']
  }
}));
