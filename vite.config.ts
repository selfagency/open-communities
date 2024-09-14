import svg from '@poppanator/sveltekit-svg';
import { sveltekit } from '@sveltejs/kit/vite';
import { config as dotenv } from 'dotenv';
import { defineConfig } from 'vite';
import webfontDownload from 'vite-plugin-webfont-dl';

dotenv();

export default defineConfig({
	plugins: [
		sveltekit(),
		svg(),
		webfontDownload(['https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible&display=swap'])
	],
	define: {
		__NODE_ENV__: JSON.stringify(process.env.NODE_ENV)
	}
});
