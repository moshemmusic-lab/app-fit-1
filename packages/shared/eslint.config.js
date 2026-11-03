import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { ignores: ['src/theme/tokens.generated.ts'] },
  js.configs.recommended,
  tseslint.configs.strict,
  prettier,
]);
