import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/vitest.setup.ts'],
    env: {
      SUPABASE_URL: 'https://mock.supabase.co',
      SUPABASE_KEY: 'mock-key',
      REDIS_URL: 'redis://mock',
      SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
    },
    exclude: [
      ...(configDefaults?.exclude || []),
      'web/**',
      'dist/**',
      'src/tests/integration.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      include: ['src/core/**', 'src/agents/**'],
      exclude: [
        'src/**/*.test.ts',
        'src/tests/**',
        'src/types/**',
        'src/agents/workers/**',
        'src/agents/*.character.ts',
        'src/agents/eliza.brain.ts',
        '**/*.legacy.ts',
      ],
    },
  },
});
