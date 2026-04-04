import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { env } from '../src/utils/env.js';

// Mock gRPC
vi.mock('@triton-one/yellowstone-grpc', () => ({
  default: class {
    connect = vi.fn();
    subscribe = vi.fn().mockResolvedValue({ on: vi.fn(), write: vi.fn() });
  },
}));

// Mock Solana Web3
vi.mock('@solana/web3.js', () => ({
  Connection: class {
    getSignatureStatus = vi.fn().mockResolvedValue({ value: { err: null } });
    getParsedTransaction = vi.fn().mockResolvedValue({
      meta: { err: null, postTokenBalances: [] },
      transaction: {
        message: { accountKeys: [{ pubkey: { toBase58: () => 'mock_pub' } }], instructions: [] },
      },
    });
    onLogs = vi.fn().mockReturnValue(1);
    removeOnLogsListener = vi.fn();
    getLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: 'hash' });
    sendRawTransaction = vi.fn().mockResolvedValue('sig');
  },
  PublicKey: class {
    constructor(public key: string) {}
    toBase58 = () => this.key;
    static readonly findProgramAddressSync = vi.fn().mockReturnValue([Buffer.from('pda'), 255]);
    toBuffer = () => Buffer.from(this.key);
  },
}));

// Mock Axiom
vi.mock('@axiomhq/js', () => ({
  Axiom: class {
    ingest = vi.fn();
    flush = vi.fn().mockResolvedValue(undefined);
  },
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

// Mock TelegramService
vi.mock('../src/infrastructure/telegram/telegram.service.js', () => ({
  TelegramService: class {
    sendTestPing = vi.fn().mockResolvedValue(true);
    broadcastAlpha = vi.fn().mockResolvedValue(undefined);
  },
}));

// Mock TierService
vi.mock('../src/core/tiers/tier.service.js', () => ({
  TierService: class {
    getUserProfile = vi.fn().mockResolvedValue({
      id: 'u-123',
      rank: 'NEWBIE',
      status: 'NONE',
      volume: { currentMonthVolume: 0 },
    });
    getTradingFeePercentage = vi.fn().mockReturnValue(0.01);
    addVolume = vi.fn().mockResolvedValue('NEWBIE');
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
    rpc: vi.fn().mockResolvedValue({ data: 'NEWBIE', error: null }),
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
      body: {
        walletAddress: TEST_WALLET,
        amountUSD: 1000,
        platform: 'JUPITER',
        signature: 's_trade_final',
        status: 'success',
      },
    });
    expect(response.statusCode).toBe(200);
  });

  it('🛡️ app.ts: CORS origins logic', async () => {
    // CORS origins are resolved at registration (buildApp).
    // We need a fresh instance with the custom env.
    const originalOrigins = env.ALLOWED_ORIGINS;
    const origin = 'https://aivo.sh';
    env.ALLOWED_ORIGINS = origin;
    const testApp = await buildApp();

    const response = await testApp.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: {
        origin,
        'access-control-request-method': 'GET',
      },
    });

    expect(response.headers['access-control-allow-origin']).toBe(origin);

    await testApp.close();
    env.ALLOWED_ORIGINS = originalOrigins;
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
      body: { route: { inMint: 'a', outMint: 'b' }, userPublicKey: 'u' },
    });
    expect(response.statusCode).toBe(200);
  });

  it('🛡️ app.ts: /metrics and /health coverage', async () => {
    await app.inject({ method: 'GET', url: '/health' });
    await app.inject({ method: 'GET', url: '/metrics' });
  });

  it('🛡️ app.ts: /signals multi-tier coverage', async () => {
    // 1. Missing wallet
    const r1 = await app.inject({ method: 'GET', url: '/signals' });
    expect(r1.statusCode).toBe(400);

    // 2. STARLIGHT tier
    const mockTier = (app as any).tierService;
    vi.spyOn(mockTier, 'getUserProfile').mockResolvedValueOnce({
      status: 'STARLIGHT',
      rank: 'ELITE',
      volume: { currentMonthVolume: 0 },
      walletAddress: 'w',
    } as any);
    const r2 = await app.inject({ method: 'GET', url: '/signals', query: { wallet: 'w' } });
    expect(r2.statusCode).toBe(200);

    // 3. VIP tier
    vi.spyOn(mockTier, 'getUserProfile').mockResolvedValueOnce({
      status: 'VIP',
      rank: 'ELITE',
      volume: { currentMonthVolume: 0 },
      walletAddress: 'w',
    } as any);
    const r3 = await app.inject({ method: 'GET', url: '/signals', query: { wallet: 'v' } });
    expect(r3.statusCode).toBe(200);
  });

  it('🛡️ app.ts: /trade/swap error branch', async () => {
    mockExecuteSwap.mockRejectedValueOnce(new Error('Swap Crash'));
    const response = await app.inject({
      method: 'POST',
      url: '/trade/swap',
      body: { route: { inMint: 'a', outMint: 'b' }, userPublicKey: 'w' },
    });
    expect(response.statusCode).toBe(500);
  });

  it('🛡️ app.ts: /telegram/test success/error', async () => {
    // 1. Success
    const r1 = await app.inject({ method: 'POST', url: '/telegram/test', body: { chatId: '123' } });
    expect(r1.statusCode).toBe(200);

    // 2. Missing chatId
    const r2 = await app.inject({ method: 'POST', url: '/telegram/test', body: {} });
    expect(r2.statusCode).toBe(400);
  });

  it('🛡️ app.ts: Engine logAlpha hook coverage', async () => {
    await (app as any).engine.hooks.logAudit({
      type: 'ALPHA',
      score: 90,
      mint: 'm',
      reasoning: 'r',
      latency: 1,
    });
  });
});
