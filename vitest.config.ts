import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Configure dependency optimization to prevent test instability
  optimizeDeps: {
    include: [
      '@leeoniya/ufuzzy',
      '@sveltejs/kit',
      '@testing-library/jest-dom/vitest',
      '@testing-library/svelte',
      'bits-ui',
      'cookie',
      'fast-string-truncated-width',
      'nodemailer',
      'pocketbase',
      'radashi',
      'svelte-copy',
      'svelte-sonner',
      'sveltekit-superforms',
      'sveltekit-superforms/adapters',
      'tailwind-merge',
      'tailwind-variants',
      'tslog',
      'zod'
    ]
  },
  // Enable compatibility for Svelte component API v4 when running tests so
  // older-style instantiation (new Component(...)) works in the test runner.
  plugins: [
    svelte({
      compilerOptions: {
        compatibility: { componentApi: 4 }
      }
    })
  ],
  resolve: {
    alias: {
      // specific $app aliases must come before the generic '$app' alias
      '$app/environment': resolve(import.meta.dirname, 'src/test/mocks/$app/environment.js'),
      '$app/environment.js': resolve(import.meta.dirname, 'src/test/mocks/$app/environment.js'),
      '$app/navigation': resolve(import.meta.dirname, 'src/test/mocks/$app/navigation.js'),
      '$app/navigation.js': resolve(import.meta.dirname, 'src/test/mocks/$app/navigation.js'),
      '$app/state': resolve(import.meta.dirname, 'src/test/mocks/$app/stores.js'),
      '$app/state.js': resolve(import.meta.dirname, 'src/test/mocks/$app/stores.js'),
      '$app/state.ts': resolve(import.meta.dirname, 'src/test/mocks/$app/stores.js'),
      '$app/state/index': resolve(import.meta.dirname, 'src/test/mocks/$app/stores.js'),
      '$app/stores': resolve(import.meta.dirname, 'src/test/mocks/$app/stores.js'),
      '$app/stores.js': resolve(import.meta.dirname, 'src/test/mocks/$app/stores.js'),
      // eslint-disable-next-line perfectionist/sort-objects
      $app: resolve(import.meta.dirname, 'src/test/mocks/$app'),
      '$env/dynamic/private': resolve(import.meta.dirname, 'src/test/mocks/$env/dynamic/private.js'),
      '$env/dynamic/public': resolve(import.meta.dirname, 'src/test/mocks/$env/dynamic/public.js'),
      '$env/static/private': resolve(import.meta.dirname, 'src/test/mocks/$env/static/private.js'),
      '$env/static/public': resolve(import.meta.dirname, 'src/test/mocks/$env/static/public.js'),
      $lib: resolve(import.meta.dirname, 'src/lib'),
      // substitute server logger with a lightweight mock during tests
      '$lib/server/logger': resolve(import.meta.dirname, 'src/test/mocks/$lib_server_logger.js'),
      $test: resolve(import.meta.dirname, 'src/test'),
      formsnap: resolve(import.meta.dirname, 'src/test/stubs/formsnap.js'),
      [resolve(import.meta.dirname, 'src/lib/server/logger.ts')]: resolve(
        import.meta.dirname,
        'src/test/mocks/$lib_server_logger.js'
      ),
      'sveltekit-superforms': resolve(import.meta.dirname, 'src/test/mocks/sveltekit-superforms.js'),
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
        'src/app.html',
        'src/hooks.client.ts',
        'src/hooks.server.ts',
        'src/hooks.ts',
        'src/instrumentation.server.ts',
        'src/lib/components/congregation/**',
        'src/lib/components/form/delete.svelte',
        'src/lib/components/form/form.svelte',
        'src/lib/components/form/transfer.svelte',
        'src/lib/components/form/segments/congregation.svelte',
        'src/lib/components/global/captcha.svelte',
        'src/lib/components/global/combobox.svelte',
        'src/lib/components/global/contact.svelte',
        'src/lib/components/global/locale.svelte',
        'src/lib/components/global/menu.svelte',
        'src/lib/components/login/**',
        'src/lib/components/search/filters.svelte',
        'src/lib/components/search/map.svelte',
        'src/lib/components/ui',
        'src/lib/paraglide',
        'src/lib/posthog.ts',
        'src/lib/server/mail.ts',
        'src/lib/server/security.ts',
        'src/lib/stately/index.ts',
        'src/mocks/**',
        'src/test?(-*).?(c|m)[jt]s?(x)',
        'src/test?(s)/**',
        'src/routes/[slug]/+page.svelte',
        'src/routes/+layout.svelte',
        'src/routes/+layout.server.ts',
        'src/routes/+layout.ts',
        'src/routes/+page.server.ts',
        'src/routes/+page.svelte',
        'src/routes/add/+page.svelte',
        'src/routes/add/+page.server.ts',
        'src/routes/contact/+page.svelte',
        'src/routes/contact/+page.server.ts',
        'src/routes/edit/+page.svelte',
        'src/routes/edit/+page.server.ts',
        'src/routes/login/+page.svelte',
        'src/routes/login/+page.server.ts',
        'src/routes/logout/+page.server.ts',
        'src/routes/logout/+page.svelte',
        'src/routes/+error.svelte',
        'src/routes/admin/**',
        'src/routes/api/admin/**',
        'src/lib/components/admin/**',
        'src/lib/components/pages/**',
        'src/lib/components/users/**',
        'src/lib/server/posthog-api.ts',
        'src/lib/server/cache.ts',
        'static'
      ],
      include: ['src/**/*.{ts,svelte}'],
      provider: 'istanbul',
      reporter: ['text', 'json-summary', 'json', 'html'],
      reportsDirectory: './test-results/coverage',
      thresholds: {
        statements: 50,
        branches: 40,
        functions: 45,
        lines: 50,
        perFile: false
      }
    },
    globals: true,
    outputFile: {
      json: './test-results/results.json',
      junit: './test-results/junit.xml'
    },
    projects: [
      {
        // Inherit plugins, resolve aliases, optimizeDeps from root config
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
          include: ['src/**/*.test.{ts,tsx,js,jsx}'],
          name: 'browser',
          setupFiles: ['vitest-browser-svelte', resolve(import.meta.dirname, 'src/test/setupTest.ts')]
        }
      },
      {
        extends: true,
        test: {
          environment: 'node',
          include: ['src/test/server/**/*.test.{ts,tsx,js,jsx}'],
          name: 'server',
          resolve: {
            alias: {
              'sveltekit-superforms/adapters': resolve(
                import.meta.dirname,
                'src/test/mocks/sveltekit-superforms-adapters.js'
              )
            }
          },
          setupFiles: [resolve(import.meta.dirname, 'src/test/setupServer.ts')]
        }
      }
    ]
  }
});
