import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import webfontDownload from 'vite-plugin-webfont-dl';

export default defineConfig({
	plugins: [
		sveltekit(),
		webfontDownload([
			'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap'
		])
	]
});
