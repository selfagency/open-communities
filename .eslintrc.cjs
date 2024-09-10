module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:svelte/recommended',
		'prettier'
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'perfectionist'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
		extraFileExtensions: ['.svelte']
	},
	env: {
		browser: true,
		es2017: true,
		node: true
	},
	overrides: [
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		},
		{
			files: ['*.html'],
			plugins: ['html']
		}
	],
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
	},
	settings: {
		perfectionist: {
			type: 'natural',
			partitionByComment: false
		}
	}
};
