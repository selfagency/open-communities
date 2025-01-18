// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import perfectionist from 'eslint-plugin-perfectionist';
import parser from 'svelte-eslint-parser';
import html from 'eslint-plugin-html';

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
			parser: parser,
			ecmaVersion: 5,
			sourceType: 'script',

			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		}
	},
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': 'warn',
			'svelte/no-at-html-tags': 'off',

			'perfectionist/sort-imports': [
				'error',
				{
					internalPattern: ['$*/**']
				}
			]
		}
	},
	{
		files: ['**/*.html'],

		plugins: {
			html
		}
	}
);
