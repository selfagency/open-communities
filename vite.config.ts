import svg from '@poppanator/sveltekit-svg';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
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
		sveltekit(),
		SvelteKitPWA({
			injectRegister: 'auto',
			registerType: 'autoUpdate',
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg}']
			},
			strategies: 'injectManifest',
			injectManifest: {
				globIgnores: ['server/*'],
				globPatterns: ['client/**/*.{html,js,css,ico,png,svg,woff,woff2,ttf,xml,webmanifest}'],
				swSrc: './src/service-worker.ts'
			},
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
			manifest: {
				name: 'Open Communities',
				short_name: 'open-communities',
				description: 'Find inclusive Jewish congregations',
				theme_color: '#f8fafc',
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					}
				]
			}
		}),
		webfontDownload([
			'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible&display=swap'
		]),
		svg()
	],
	define: {
		__NODE_ENV__: JSON.stringify(process.env.NODE_ENV)
	}
});
