import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: [...(configDefaults?.exclude || []), 'web/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 40,
        statements: 60,
      },
      exclude: ['node_modules/**', 'dist/**', 'scripts/**', 'web/**'],
    },
  },
});
