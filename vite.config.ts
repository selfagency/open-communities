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
    },
    sourcemap: true
  },
  plugins: [
    ViteMcp(),
    mode === 'test' && inlineSveltePlugin(),
    mode === 'development' &&
      biomePlugin({
        failOnError: false,
        files: 'src',
        mode: 'lint'
      }),
    devtoolsJson(),
    tailwindcss(),
    sveltekit(),
    // Strip `//# sourceMappingURL=` comments from production JS so browsers don't
    // try to fetch the (deleted/blocked) .map files — PostHog still receives the
    // sourcemaps for error de-minification via the rollup plugin below.
    mode === 'production' && {
      enforce: 'post',
      generateBundle(_options, bundle) {
        for (const file of Object.values(bundle)) {
          if (file.type === 'chunk' && typeof file.code === 'string') {
            file.code = file.code.replace(/\/\/#\s*sourceMappingURL=.*$/gm, '');
          }
        }
      },
      name: 'strip-sourcemap-comments'
    },
    {
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
      },
      enforce: 'post',
      name: 'fix-paraglide-messages'
    },
    mode === 'development' &&
      paraglideVitePlugin({
        cleanOutdir: false,
        outdir: './src/lib/paraglide',
        project: './project.inlang'
      }),
    svg(),
    // PostHog sourcemap upload — only during production builds with credentials
    mode === 'production' &&
      process.env.POSTHOG_CLI_PROJECT_ID &&
      process.env.POSTHOG_CLI_API_KEY &&
      posthog({
        host: process.env.POSTHOG_CLI_HOST,
        personalApiKey: process.env.POSTHOG_CLI_API_KEY,
        projectId: process.env.POSTHOG_CLI_PROJECT_ID,
        sourcemaps: {
          deleteAfterUpload: true,
          enabled: true,
          releaseName: 'open-communities',
          releaseVersion: process.env.SOURCE_VERSION ?? process.env.COMMIT_REF ?? 'dev'
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
  ssr: {
    external: ['@opentelemetry', '@grpc', 'protobufjs'],
    noExternal: ['super-sitemap']
  },
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
    outputFile: {
      json: './test-results/results.json',
      junit: './test-results/junit.xml'
    },
    reporter: ['junit', 'json', 'verbose'],
    // run our test setup before tests so we can mock SvelteKit runtime modules
    setupFiles: ['./src/test/setupTest.ts']
  }
}));
