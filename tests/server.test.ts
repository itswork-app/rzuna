import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { Axiom } from '@axiomhq/js';
import { env } from '../src/utils/env.js';

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
vi.mock('@axiomhq/js', () => ({
  Axiom: vi.fn().mockImplementation(function (this: any) {
    this.ingest = vi.fn();
    this.flush = vi.fn().mockResolvedValue(undefined);
    return this;
  }),
}));

// Mock Sentry
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
}));

// Mock Global Fetch for SOL Price (Jupiter v4)
vi.stubGlobal(
  'fetch',
  vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: { SOL: { price: 150 } } }),
    }),
  ),
);

// Mock Supabase to align with Database Schema v1.3
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    channel: vi.fn().mockReturnThis(),
    send: vi.fn().mockResolvedValue('ok'),
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
    const payload = response.json() as unknown as { status: string; timestamp: string };
    expect(payload.status).toBe('ok');
    expect(typeof payload.timestamp).toBe('string');
  });

  it('🛡️ Security: Harus memiliki header keamanan dasar (Helmet)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.headers).toHaveProperty('x-dns-prefetch-control');
    expect(response.headers).toHaveProperty('x-content-type-options');
  });

  it('🔴 Error Handling: Harus menangkap error 404 dengan benar', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/route-yang-tidak-ada',
    });

    expect(response.statusCode).toBe(404);
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
    // Dynamic fee: NEWBIE wallet pays 2% → $1000 * 0.02 = $20
    expect(response.json().tradingFeeUSD).toBe(20);
    expect(response.json().currentRank).toBeDefined();
  });

  describe('📊 Monitoring & Coverage', () => {
    it('🛡️ Sentry & Axiom: Harus terinisialisasi jika env vars tersedia', async () => {
      // Kita buat instance baru dengan env vars terpacak
      env.SENTRY_DSN = 'https://example@sentry.io/123';
      env.AXIOM_TOKEN = 'test-token';
      env.AXIOM_DATASET = 'test-dataset';

      const monitorApp = await buildApp();
      const response = await monitorApp.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      await monitorApp.close();
    });

    it('🛡️ Sentry Error Hook: Harus dipicu saat terjadi error', async () => {
      env.SENTRY_DSN = 'https://example@sentry.io/123';
      const monitorApp = await buildApp();

      monitorApp.get('/trigger-error', () => {
        throw new Error('Expected test error');
      });

      const response = await monitorApp.inject({
        method: 'GET',
        url: '/trigger-error',
      });

      expect(response.statusCode).toBe(500);
      await monitorApp.close();
    });

    it('🛡️ Axiom Catch Hook: Harus menangkap error jika ingest gagal', async () => {
      // Mock Axiom.ingest to throw and flush to reject
      const mockIngest = vi.fn();
      const mockFlush = vi.fn().mockRejectedValue(new Error('Axiom Network Error'));
      vi.mocked(Axiom).mockImplementation(function (this: any) {
        this.ingest = mockIngest;
        this.flush = mockFlush;
        return this;
      } as any);

      env.AXIOM_TOKEN = 'test-token';
      env.AXIOM_DATASET = 'test-dataset';

      const monApp = await buildApp();
      const logSpy = vi.spyOn(monApp.log, 'error');

      // Trigger request to trigger onResponse hook
      await monApp.inject({ method: 'GET', url: '/health' });

      // Tunggu sebentar agar async ingestEvents dipicu
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockIngest).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(expect.any(Error), 'Axiom ingestion failed');

      await monApp.close();
    });

    it('🛡️ Branch Coverage: Default NODE_ENV', async () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const monApp = await buildApp();
      expect(monApp).toBeDefined();

      process.env.NODE_ENV = originalEnv;
      await monApp.close();
    });
  });
});
