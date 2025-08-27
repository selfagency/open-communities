import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import perfectionist from 'eslint-plugin-perfectionist';
import svelte from 'eslint-plugin-svelte';
import { globalIgnores } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

import svelteConfig from './svelte.config.js';

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
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  perfectionist.configs['recommended-natural'],
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'perfectionist/sort-imports': [
        'warn',
        {
          internalPattern: ['^\\$.+']
        }
      ]
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        projectService: true,
        svelteConfig
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'svelte/no-at-html-tags': 'off'
    }
  },
  {
    files: ['**/test/**.ts', '**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'svelte/no-at-html-tags': 'off'
    }
  }
);
