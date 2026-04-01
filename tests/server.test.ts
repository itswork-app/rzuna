import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

// Mock gRPC
vi.mock('@triton-one/yellowstone-grpc', () => ({
  default: class {
    connect = vi.fn();
    subscribe = vi.fn().mockResolvedValue({ on: vi.fn(), write: vi.fn() });
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

/**
 * Institutional Mock Hardware: Jupiter & Engine Stability
 */
const mockExecuteSwap = vi.fn();
vi.mock('../src/infrastructure/jupiter/jupiter.service.js', () => ({
  JupiterService: class {
    getBestRoute = vi.fn();
    executeSwap = mockExecuteSwap;
  },
}));

// Mock Global Fetch for SOL Price
const mockFetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: { SOL: { price: 150 } } }),
  }),
);
vi.stubGlobal('fetch', mockFetch);

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
vi.mock('../src/utils/env.js', async () => ({
  env: {
    NODE_ENV: 'test',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_KEY: 'test-key-long-enough-for-zod',
    PORT: '3000',
    EXECUTION_MODE: 'dry_run',
    SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
    JITO_BLOCK_ENGINE_URL: 'https://jito',
    JITO_TIP_PAYMENT_ADDRESS: 'tip',
  },
}));

const TEST_WALLET = 'test-wallet';
const SENTRY_MOCK_URL = 'https://example@sentry.io/123';

describe('🚀 RZUNA Core Foundation (Baseline)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('🟢 Health Check: Modular App Factory harus bootstrap dengan benar', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    console.info(SENTRY_MOCK_URL);
  });

  it('🛡️ Trade Audit: Success (200)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/trade',
      body: { walletAddress: TEST_WALLET, amountUSD: 1000, platform: 'JUPITER', signature: 's1' },
    });
    expect(response.statusCode).toBe(200);
  });

  it('🛡️ fee.plugin.ts: GET /user/:wallet/tier coverage', async () => {
    const response = await app.inject({ method: 'GET', url: `/user/${TEST_WALLET}/tier` });
    expect(response.statusCode).toBe(200);
    expect(response.json().feeRate).toBeDefined();
  });

  it('🛡️ app.ts: POST /trade/swap success branch', async () => {
    mockExecuteSwap.mockResolvedValueOnce({ signature: 'sig_baseline', dryRun: false });
    const response = await app.inject({
      method: 'POST',
      url: '/trade/swap',
      body: { route: {}, userPublicKey: 'u' },
    });
    expect(response.statusCode).toBe(200);
  });
});
