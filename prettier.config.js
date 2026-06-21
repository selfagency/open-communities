/** @type {import("prettier").Config} */

const config = {
  arrowParens: 'always',
  bracketSameLine: true,
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
  trailingComma: 'none',
  useTabs: false
};

export default config;
