import svg from '@poppanator/sveltekit-svg';
import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
// import { SvelteKitPWA } from '@vite-pwa/sveltekit';

import { config as dotenv } from 'dotenv';
import { defineConfig } from 'vite';
import webfontDownload from 'vite-plugin-webfont-dl';

dotenv();

export default defineConfig({
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					'svelte-maplibre': ['svelte-maplibre']
				}
			}
		}
	},
	plugins: [
		sentrySvelteKit(),
		sveltekit(),
		// SvelteKitPWA({
		// 	injectRegister: 'auto',
		// 	registerType: 'autoUpdate',
		// 	workbox: {
		// 		globPatterns: ['**/*.{js,css,html,ico,png,svg}']
		// 	},
		// 	strategies: 'generateSW',
		// 	includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
		// 	manifest: {
		// 		name: 'Open Communities',
		// 		short_name: 'open-communities',
		// 		description: 'Find inclusive Jewish congregations',
		// 		theme_color: '#f8fafc',
		// 		icons: [
		// 			{
		// 				src: 'pwa-192x192.png',
		// 				sizes: '192x192',
		// 				type: 'image/png'
		// 			},
		// 			{
		// 				src: 'pwa-512x512.png',
		// 				sizes: '512x512',
		// 				type: 'image/png'
		// 			}
		// 		]
		// 	}
		// }),
		webfontDownload([
			'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible&display=swap'
		]),
		svg()
	]
});
