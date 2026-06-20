import css from "@eslint/css";
import js from "@eslint/js";
import html from "@html-eslint/eslint-plugin";
import prettier from "eslint-config-prettier";
// import baselineJs from 'eslint-plugin-baseline-js';
import perfectionist from "eslint-plugin-perfectionist";
import svelte from "eslint-plugin-svelte";
import { globalIgnores } from "eslint/config";
import globals from "globals";
import { tailwind4 } from "tailwind-csstree";
import ts from "typescript-eslint";

import svelteConfig from "./svelte.config.js";

export default ts.config(
	globalIgnores([
		"!.env.example",
		".DS_Store",
		".env.*",
		".env",
		".git",
		".sonarlint",
		".svelte-kit",
		"build",
		"e2e/pocketbase",
		"node_modules",
		"package-lock.json",
		"package.json",
		"package",
		"pb_data",
		"pb_hooks",
		"pnpm-lock.yaml",
		"static",
		"test-results",
		"yarn.lock",
	]),
	// Main JS/TS/Svelte configs — exclude CSS files because the CSS language
	// processor doesn't implement core ESLint APIs (e.g., getAllComments).
	// Each config must carry the ignores list individually.
	{ ...js.configs.recommended, ignores: ["**/*.css"] },
	...ts.configs.recommended.map((cfg) => ({ ...cfg, ignores: ["**/*.css"] })),
	...svelte.configs.recommended.map((cfg) => ({
		...cfg,
		ignores: ["**/*.css"],
	})),
	...(perfectionist.configs["recommended-natural"].map
		? perfectionist.configs["recommended-natural"].map((cfg) => ({
				...cfg,
				ignores: ["**/*.css"],
			}))
		: [
				{
					...perfectionist.configs["recommended-natural"],
					ignores: ["**/*.css"],
				},
			]),
	{ ...prettier, ignores: ["**/*.css"] },
	...svelte.configs.prettier.map((cfg) => ({ ...cfg, ignores: ["**/*.css"] })),
	{
		files: ["**/*.{html}"],
		language: "html/html",
		plugins: {
			html,
		},
		rules: {
			"html/no-duplicate-class": "error",
		},
	},
	{
		files: ["**/*.{js,ts,jsx,tsx}"],
		plugins: { html },
		rules: {
			// Allow only "widely available" Baseline features
			// 'baseline-js/use-baseline': ['error', { baseline: 'widely' }]
		},
	},
	{
		files: ["**/*.css"],
		language: "css/css",
		languageOptions: {
			customSyntax: tailwind4,
		},
		plugins: {
			css,
			perfectionist,
			svelte,
		},
		rules: {
			"css/no-empty-blocks": "error",
			// The CSS language processor doesn't provide sourceCode.getAllComments().
			// These core/perfectionist rules crash on CSS files — override to off.
			"no-irregular-whitespace": "off",
		},
	},
	{
		ignores: ["**/*.css"],
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
		},
		rules: {
			"@typescript-eslint/no-unused-vars": "warn",
			"no-unused-vars": "off",
			"perfectionist/sort-imports": [
				"error",
				{
					internalPattern: ["^\\$.+"],
				},
			],
		},
	},
	{
		files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
		languageOptions: {
			parserOptions: {
				extraFileExtensions: [".svelte"],
				parser: ts.parser,
				projectService: true,
				svelteConfig,
			},
		},
		plugins: { css, html },
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": "warn",
		},
	},
	{
		files: [
			"**/test/**.ts",
			"**/*.test.ts",
			"**/*.test.js",
			"**/*.spec.ts",
			"**/*.spec.js",
		],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": "off",
		},
	},
);
