import { defineConfig } from 'vitest/config';

// Unit tests for plain TypeScript logic (no React Native rendering).
export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**'],
  },
});
