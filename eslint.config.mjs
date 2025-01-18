// @ts-check
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import html from 'eslint-plugin-html';
import perfectionist from 'eslint-plugin-perfectionist';
import parser from 'svelte-eslint-parser';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: [
			'**/.DS_Store',
			'**/node_modules',
			'build',
			'.svelte-kit',
			'package',
			'**/.env',
			'**/.env.*',
			'!**/.env.example',
			'**/pnpm-lock.yaml',
			'**/package-lock.json',
			'**/yarn.lock',
			'**/package.json'
		]
	},
	eslint.configs.recommended,
	tseslint.configs.recommended,
	eslintConfigPrettier,
	perfectionist.configs['recommended-natural'],
	{
		files: ['**/*.svelte'],

		languageOptions: {
			ecmaVersion: 5,
			parser: parser,
			parserOptions: {
				parser: '@typescript-eslint/parser'
			},
			sourceType: 'script'
		}
	},
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': 'warn',
			'svelte/no-at-html-tags': 'off'
		}
	},
	{
		files: ['**/*.html'],

		plugins: {
			html
		}
	},
	{
		globals: {
			document: 'readonly',
			inject: 'readonly'
		}
	}
);
