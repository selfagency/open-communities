import { svelte } from '@sveltejs/vite-plugin-svelte';
import * as path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	// Configure dependency optimization to prevent test instability
	optimizeDeps: {
		include: [
			'@leeoniya/ufuzzy',
			'@lucide/svelte/icons/x',
			'@nanostores/persistent',
			'@sveltejs/kit',
			'@testing-library/jest-dom/vitest',
			'@testing-library/svelte',
			'bits-ui',
			'cookie',
			'fast-string-truncated-width',
			'lucide-svelte/icons/accessibility',
			'lucide-svelte/icons/captions',
			'lucide-svelte/icons/circle-alert',
			'lucide-svelte/icons/flag',
			'lucide-svelte/icons/flag-off',
			'lucide-svelte/icons/globe',
			'lucide-svelte/icons/languages',
			'lucide-svelte/icons/mail',
			'lucide-svelte/icons/pencil',
			'lucide-svelte/icons/share',
			'lucide-svelte/icons/shield',
			'lucide-svelte/icons/shield-ban',
			'lucide-svelte/icons/square-arrow-out-up-right',
			'nanostores',
			'nodemailer',
			'pocketbase',
			'radashi',
			'svelte-copy',
			'svelte-sonner',
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
			'$app/environment': path.resolve(__dirname, 'src/test/mocks/$app/environment.js'),
			'$app/environment.js': path.resolve(__dirname, 'src/test/mocks/$app/environment.js'),
			'$app/navigation': path.resolve(__dirname, 'src/test/mocks/$app/navigation.js'),
			'$app/navigation.js': path.resolve(__dirname, 'src/test/mocks/$app/navigation.js'),
			'$app/state': path.resolve(__dirname, 'src/test/mocks/$app/stores.js'),
			'$app/state.js': path.resolve(__dirname, 'src/test/mocks/$app/stores.js'),
			'$app/state.ts': path.resolve(__dirname, 'src/test/mocks/$app/stores.js'),
			'$app/state/index': path.resolve(__dirname, 'src/test/mocks/$app/stores.js'),
			'$app/stores': path.resolve(__dirname, 'src/test/mocks/$app/stores.js'),
			'$app/stores.js': path.resolve(__dirname, 'src/test/mocks/$app/stores.js'),
			// eslint-disable-next-line perfectionist/sort-objects
			$app: path.resolve(__dirname, 'src/test/mocks/$app'),
			'$env/dynamic/private': path.resolve(__dirname, 'src/test/mocks/$env/dynamic/private.js'),
			'$env/dynamic/public': path.resolve(__dirname, 'src/test/mocks/$env/dynamic/public.js'),
			'$env/static/private': path.resolve(__dirname, 'src/test/mocks/$env/static/private.js'),
			'$env/static/public': path.resolve(__dirname, 'src/test/mocks/$env/static/public.js'),
			$lib: path.resolve(__dirname, 'src/lib'),
			// substitute server logger with a lightweight mock during tests
			'$lib/server/logger': path.resolve(__dirname, 'src/test/mocks/$lib_server_logger.js'),
			$test: path.resolve(__dirname, 'src/test'),
			formsnap: path.resolve(__dirname, 'src/test/stubs/formsnap.js'),
			[path.resolve(__dirname, 'src/lib/server/logger.ts')]: path.resolve(
				__dirname,
				'src/test/mocks/$lib_server_logger.js'
			),
			'sveltekit-superforms': path.resolve(__dirname, 'src/test/mocks/sveltekit-superforms.js')
		}
	},
	test: {
		// Enable browser runner for client-side Svelte component tests
		browser: {
			enabled: true,
			instances: [{ browser: 'chromium' }],
			provider: 'playwright'
		},
		coverage: {
			provider: 'istanbul' // or 'v8'
		},
		environment: 'happy-dom',
		// Use Node environment for server tests
		environmentMatchGlobs: [['src/test/server/**/*.test.{ts,tsx,js,jsx}', 'node']],
		// ensure Vitest provides global test APIs (describe/it/beforeEach)
		globals: true,
		// explicit include to ensure test files under src/ are collected
		include: ['src/**/*.test.{ts,tsx,js,jsx}'],
		outputFile: './test-results/results.json',
		reporters: ['json', 'default'],
		// vitest-browser-svelte must be loaded before the project setup so it
		// injects the `page.render` and locators for browser-mode tests.
		setupFiles: ['vitest-browser-svelte', path.resolve(__dirname, 'src/test/setupTest.ts')]
	}
});
