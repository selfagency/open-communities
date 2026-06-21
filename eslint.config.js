import { globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import ts from 'typescript-eslint';

import svelteConfig from './svelte.config.js';

// ESLint is used ONLY for .svelte files.
// All other files (JS/TS/CSS/JSON/HTML) are handled by Biome.

export default ts.config(
  globalIgnores([
    '!.env.example',
    '.DS_Store',
    '.env.*',
    '.env',
    '.git',
    '.sonarlint',
    '.svelte-kit',
    'build',
    'e2e/pocketbase',
    'node_modules',
    'package-lock.json',
    'package.json',
    'package',
    'pb_data',
    'pb_hooks',
    'pnpm-lock.yaml',
    'static',
    'test-results',
    'yarn.lock'
  ]),
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        projectService: true,
        svelteConfig
      }
    },
    plugins: { svelte, '@typescript-eslint': ts.plugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      // DOMPurify-sanitized {@html} is safe
      'svelte/no-at-html-tags': 'off',
      // resolve() called before goto() in event handlers, but static analysis
      // can't trace variable-based URLs through Svelte inline expressions
      'svelte/no-navigation-without-resolve': 'off'
    }
  },
  ...svelte.configs.recommended.map((cfg) => ({
    ...cfg,
    files: ['**/*.svelte']
  })),
  ...svelte.configs.prettier.map((cfg) => ({
    ...cfg,
    files: ['**/*.svelte']
  })),
  { ...prettier, files: ['**/*.svelte'] },
  // Test files: relax some rules
  {
    files: ['**/test/**.ts', '**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  }
);
