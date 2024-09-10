import svg from '@poppanator/sveltekit-svg';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import webfontDownload from 'vite-plugin-webfont-dl';

export default defineConfig({
	plugins: [
		sveltekit(),
		svg(),
		webfontDownload(['https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible&display=swap'])
	]
});
