/** @type {import("prettier").Config} */

const config = {
  plugins: [
    'prettier-plugin-organize-attributes',
    'prettier-plugin-organize-imports',
    'prettier-plugin-svelte',
    'prettier-plugin-tailwindcss',
  ],
  overrides: [
    {
      files: '*.svelte',
      options: {
        parser: 'svelte',
      },
    },
  ],
  arrowParens: 'avoid',
  bracketSpacing: true,
  printWidth: 120,
  proseWrap: 'preserve',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  useTabs: false,
};

export default config;
