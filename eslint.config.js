import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import prettier  from 'eslint-config-prettier';
import * as prettierPlugin from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	js.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
 plugins: {
    prettier: prettierPlugin
  },
		rules: {
			'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
			'no-extra-semi': 'warn',
			eqeqeq: ['warn', 'always'],
			'no-multiple-empty-lines': ['warn', { max: 1, maxEOF: 1 }],
			'prefer-const': 'warn',
			'object-shorthand': ['warn', 'always'],
			'arrow-spacing': ['warn', { before: true, after: true }],
			'svelte/prefer-class-directive': 'warn',
			'prettier/prettier':'warn',
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/']
	}
];
