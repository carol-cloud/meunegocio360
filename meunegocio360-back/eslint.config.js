import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

// Lint do backend (RNF-BE-45). Formatação fica a cargo do Prettier (eslint-config-prettier).
export default [
  { ignores: ['node_modules/'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // Logs somente pelo pino (RNF-BE-44)
      'no-console': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  prettier,
];
