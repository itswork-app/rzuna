import { vi } from 'vitest';

// 🛡️ Institutional Global Test Setup
// Centralizing mocks to ensure consistent CI results across all modules.

// 1. Mock Solana Web3.js
vi.mock('@solana/web3.js', () => {
  return {
    Connection: vi.fn().mockImplementation(() => ({
      getSignatureStatus: vi.fn().mockResolvedValue({ value: { err: null } }),
      getParsedTransaction: vi
        .fn()
        .mockResolvedValue({ meta: { err: null }, transaction: { message: { accountKeys: [] } } }),
      onLogs: vi.fn().mockReturnValue(123),
      removeOnLogsListener: vi.fn().mockResolvedValue(true),
    })),
    PublicKey: vi.fn().mockImplementation((key: string) => ({
      toBase58: () => key,
      toString: () => key,
    })),
  };
});

// 2. Mock Supabase (Standard Institutional Mock)
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    channel: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    send: vi.fn().mockResolvedValue('ok'),
  }),
}));

// 3. Mock Env
vi.mock('./src/utils/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
    SUPABASE_URL: 'https://mock.supabase.co',
    SUPABASE_KEY: 'mock-key',
    PORT: '3000',
  },
}));
