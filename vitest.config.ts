import { svelte } from '@sveltejs/vite-plugin-svelte';
import * as path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		svelte()
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
			'$app': path.resolve(__dirname, 'src/test/mocks/$app'),
			'$env/static/private': path.resolve(__dirname, 'src/test/mocks/$env/static/private.js'),
			'$env/static/public': path.resolve(__dirname, 'src/test/mocks/$env/static/public.js'),
			$lib: path.resolve(__dirname, 'src/lib'),
			// map app assets to test mocks so `*.svg?component` imports yield Svelte-friendly mocks
			'$lib/assets': path.resolve(__dirname, 'src/test/mocks/assets'),
			// substitute server logger with a lightweight mock during tests
			'$lib/server/logger': path.resolve(__dirname, 'src/test/mocks/$lib_server_logger.js'),
			$test: path.resolve(__dirname, 'src/test'),

			formsnap: path.resolve(__dirname, 'src/test/stubs/formsnap.js'),
			// also alias the absolute path used by vite import-analysis to the mock
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
		environment: 'jsdom',
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
