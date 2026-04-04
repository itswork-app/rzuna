import { describe, it, expect, vi } from 'vitest';

// 🏛️ Mocking Drizzle for coverage of the index exports
describe('Database Package (The Foundation)', () => {
  it('should export all required tables and db instance', async () => {
    const dbModule = await import('./index.js');
    expect(dbModule.db).toBeDefined();
    expect(dbModule.users).toBeDefined();
    expect(dbModule.apiKeys).toBeDefined();
  });
});
