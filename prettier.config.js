/** @type {import("prettier").Config} */

const config = {
	arrowParens: 'avoid',
	bracketSpacing: true,
	overrides: [
		{
			files: '*.svelte',
			options: {
				parser: 'svelte'
			}
		}
	],
	plugins: ['prettier-plugin-svelte'],
	printWidth: 120,
	proseWrap: 'preserve',
	semi: true,
	singleQuote: true,
	tabWidth: 2,
	trailingComma: 'es5',
	useTabs: false
};

export default config;
