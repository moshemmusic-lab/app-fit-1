const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  { ignores: ['dist/*', '.expo/*', 'expo-env.d.ts'] },
  expoConfig,
  prettier,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // CLAUDE.md: `any` is forbidden unless justified in a comment.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]);
