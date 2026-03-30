import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

// Mock gRPC
vi.mock('@triton-one/yellowstone-grpc', () => ({
  default: class {
    connect = vi.fn().mockResolvedValue(undefined);
    subscribe = vi.fn().mockResolvedValue({
      on: vi.fn(),
      write: vi.fn().mockImplementation((req: any, cb: any) => cb(null)),
    });
  },
}));

// Mock Axiom
vi.mock('@axiomhq/axiom-node', () => ({
  Client: vi.fn().mockImplementation(function (this: any) {
    this.ingestEvents = vi.fn().mockResolvedValue({ status: 'ok' });
    return this;
  }),
}));

// Mock Supabase to align with Database Schema v1.3
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockResolvedValue({ error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
    single: vi.fn().mockResolvedValue({
      data: {
        id: 'test-uuid',
        wallet_address: 'test-wallet',
        rank: 'NEWBIE',
        subscription_status: 'NONE',
        current_month_volume: 0,
        total_fees_paid: 0,
        last_rank_reset: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_banned: false,
      },
      error: null,
    }),
  }),
}));

// Mock Env
vi.mock('../src/utils/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_KEY: 'test-key-long-enough-for-zod',
    PORT: '3000',
  },
}));

const TEST_WALLET = 'test-wallet';

describe('🚀 RZUNA Core Foundation (Schema v1.3)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('🟢 Health Check: Modular App Factory harus bootstrap dengan benar', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('ok');
  });

  it('🛡️ Signals Endpoint: Harus memproses tiered signals dari infrastructure', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/signals',
      query: { wallet: TEST_WALLET },
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.user.rank).toBe('NEWBIE');
  });

  it('🛡️ Trade Audit: Harus mencatat volume ke profiles & audit ke transactions', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/trade',
      body: {
        walletAddress: TEST_WALLET,
        amountUSD: 1000,
        platform: 'PUMP_FUN',
        signature: 'sig_test',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().feeCollected).toBe(10); // 1% of 1000
    expect(response.json().currentRank).toBeDefined();
  });
});
