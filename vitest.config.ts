import { resolve } from 'node:path';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Pre-bundle these deps so Vite doesn't re-optimize mid-test (which
  // reloads the page and fails the current test).
  optimizeDeps: {
    // Don't pre-bundle sveltekit-superforms: its SuperDebugRuned.svelte imports
    // $app/state, which the dependency scanner can't resolve (aliases aren't
    // applied during scan). Loading it as a regular module lets the alias apply.
    exclude: ['sveltekit-superforms'],
    include: [
      '@testing-library/svelte',
      '@testing-library/jest-dom/vitest',
      '@testing-library/user-event',
      '@leeoniya/ufuzzy',
      '@tanstack/table-core',
      'cookie',
      'fast-string-truncated-width',
      'isomorphic-dompurify',
      'maplibre-gl',
      'mailgun.js',
      'pocketbase',
      'posthog-js',
      'radashi',
      'svelte-sonner',
      'tailwind-merge',
      'tailwind-variants',
      'tslog'
    ]
  },
  // Vitest 4 manages dep optimization internally via deps.optimizer.ssr|client.enabled
  // (defaults: false). Do NOT set optimizeDeps.disabled here — Vitest strips it.
  // prebundleSvelteLibraries: false keeps the svelte plugin from re-enabling Rolldown.
  plugins: [
    svelte({
      compilerOptions: {
        compatibility: { componentApi: 4 }
      },
      prebundleSvelteLibraries: false
    }),
    paraglideVitePlugin({
      outdir: './src/lib/paraglide',
      project: './project.inlang'
    })
  ],
  resolve: {
    alias: {
      $app: resolve(import.meta.dirname, 'src/test/mocks/$app'),
      // specific $app aliases must come before the generic '$app' alias
      '$app/environment': resolve(import.meta.dirname, 'src/test/mocks/$app/environment.js'),
      '$app/environment.js': resolve(import.meta.dirname, 'src/test/mocks/$app/environment.js'),
      '$app/forms': resolve(import.meta.dirname, 'src/test/mocks/$app/forms.js'),
      '$app/forms.js': resolve(import.meta.dirname, 'src/test/mocks/$app/forms.js'),
      '$app/navigation': resolve(import.meta.dirname, 'src/test/mocks/$app/navigation.js'),
      '$app/navigation.js': resolve(import.meta.dirname, 'src/test/mocks/$app/navigation.js'),
      '$app/state': resolve(import.meta.dirname, 'src/test/mocks/$app/stores.js'),
      '$app/state.js': resolve(import.meta.dirname, 'src/test/mocks/$app/stores.js'),
      '$app/state.ts': resolve(import.meta.dirname, 'src/test/mocks/$app/stores.js'),
      '$app/state/index': resolve(import.meta.dirname, 'src/test/mocks/$app/stores.js'),
      '$app/stores': resolve(import.meta.dirname, 'src/test/mocks/$app/stores.js'),
      '$app/stores.js': resolve(import.meta.dirname, 'src/test/mocks/$app/stores.js'),
      '$env/dynamic/private': resolve(import.meta.dirname, 'src/test/mocks/$env/dynamic/private.js'),
      '$env/dynamic/public': resolve(import.meta.dirname, 'src/test/mocks/$env/dynamic/public.js'),
      '$env/static/private': resolve(import.meta.dirname, 'src/test/mocks/$env/static/private.js'),
      '$env/static/public': resolve(import.meta.dirname, 'src/test/mocks/$env/static/public.js'),
      $lib: resolve(import.meta.dirname, 'src/lib'),
      // substitute server logger with a lightweight mock during tests
      '$lib/server/logger': resolve(import.meta.dirname, 'src/test/mocks/$lib_server_logger.js'),
      $test: resolve(import.meta.dirname, 'src/test'),
      formsnap: resolve(import.meta.dirname, 'src/test/stubs/formsnap.js'),
      'sveltekit-superforms/dist/client/SuperDebugRuned.svelte': resolve(
        import.meta.dirname,
        'src/test/stubs/SuperDebug.svelte'
      ),
      // SuperDebug.svelte imports $app/state (unresolvable in the browser
      // runner); alias it to a no-op stub. The exports map resolves
      // ./SuperDebug.svelte to SuperDebugRuned.svelte, so alias that path too.
      'sveltekit-superforms/SuperDebug.svelte': resolve(import.meta.dirname, 'src/test/stubs/SuperDebug.svelte'),
      [resolve(import.meta.dirname, 'src/lib/server/logger.ts')]: resolve(
        import.meta.dirname,
        'src/test/mocks/$lib_server_logger.js'
      ),
      'sveltekit-superforms/adapters': resolve(import.meta.dirname, 'src/test/mocks/sveltekit-superforms-adapters.js')
    }
  },
  test: {
    // Root-level: coverage, reporters, and output are shared across projects.
    // Test-specific config (environment, browser, setup) lives in each project below.

    coverage: {
      exclude: [
        '.svelte-kit',
        '*.config.[jt]s',
        '**/[.]**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
        '**/*.d.ts',
        '**/*{.,-}{test,spec,bench,benchmark}?(-d).?(c|m)[jt]s?(x)',
        '**/index.ts',
        '**/node_modules/**',
        '**/vitest.{workspace,projects}.[jt]s?(on)',
        'build',
        'e2e/**',
        'messages',
        'project.inlang',
        'static',
        'src/lib/server/security.ts'
      ],
      // Server project only — root include covers files tested by server tests.
      // Browser project (local dev only) doesn't exercise these files so they
      // won't contribute coverage, but the server project brings lines 80%+.
      include: ['src/lib/server/**', 'src/lib/schemas/**'],
      provider: 'istanbul',
      reporter: ['text', 'json-summary', 'json', 'html'],
      reportsDirectory: './test-results/coverage',
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    globals: true,

    outputFile: {
      json: './test-results/results.json',
      junit: './test-results/junit.xml'
    },
    projects: [
      // Browser project skipped in CI — Rolldown can't resolve node:module
      // without a tsconfig when loading the browser provider.
      ...(process.env.CI
        ? []
        : [
            {
              extends: true,
              test: {
                browser: {
                  enabled: true,
                  headless: true,
                  instances: [{ browser: 'chromium' }],
                  provider: playwright()
                },
                environment: 'happy-dom',
                exclude: ['src/test/server/**'],
                fileParallelism: false,
                include: ['src/**/*.test.{ts,tsx,js,jsx}'],
                name: 'browser',
                server: {
                  deps: {
                    optimizer: {
                      web: {
                        enabled: false
                      }
                    }
                  }
                },
                setupFiles: ['vitest-browser-svelte', resolve(import.meta.dirname, 'src/test/setupTest.ts')]
              }
            }
          ]),
      {
        extends: true,
        test: {
          environment: 'node',
          include: ['src/test/server/**/*.test.{ts,tsx,js,jsx}'],
          name: 'server',
          setupFiles: [resolve(import.meta.dirname, 'src/test/setupServer.ts')]
        }
      }
    ]
  }
});
