import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      SUPABASE_URL: 'https://mock.supabase.co',
      SUPABASE_KEY: 'mock-key',
    },
    exclude: [...(configDefaults?.exclude || []), 'web/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      exclude: ['node_modules/**', 'dist/**', 'scripts/**', 'web/**'],
    },
  },
});
