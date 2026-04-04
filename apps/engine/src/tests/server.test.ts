import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { env } from '../utils/env.js';

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
vi.mock('../infrastructure/jupiter/jupiter.service.js', () => ({
  JupiterService: class {
    getBestRoute = vi.fn();
    executeSwap = mockExecuteSwap;
  },
}));

// Mock TelegramService
vi.mock('../infrastructure/telegram/telegram.service.js', () => ({
  TelegramService: class {
    sendTestPing = vi.fn().mockResolvedValue(true);
    broadcastAlpha = vi.fn().mockResolvedValue(undefined);
  },
}));

// RankService is real but we can spy on it if needed.
// By default we rely on the @rzuna/database mock below.

// Mock Global Fetch for SOL Price
const mockFetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: { SOL: { price: 150 } } }),
  }),
);
vi.stubGlobal('fetch', mockFetch);

// Mock RZUNA Database (Drizzle)
vi.mock('@rzuna/database', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([
      {
        id: 'u-123',
        walletAddress: 'test-wallet',
        tier: 'BRONZE',
      },
    ]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'u-123' }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
  users: { id: 'id', walletAddress: 'wallet_address', tier: 'tier' },
  aiQuota: { id: 'id', userId: 'user_id', creditsRemaining: 'credits' },
  subscriptions: { id: 'id', userId: 'user_id', status: 'status' },
  eq: vi.fn(),
  sql: vi.fn(),
  scoutedTokens: { mintAddress: 'mint' },
}));

// Mock Env
vi.mock('../utils/env.js', async () => ({
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
    try {
      app = await buildApp();
    } catch (e) {
      console.error('FAILED TO BUILD APP:', e);
      throw e;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('🟢 Health Check: Modular App Factory harus bootstrap dengan benar', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    console.info(SENTRY_MOCK_URL);
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

  it('🛡️ app.ts: /metrics and /health coverage', async () => {
    await app.inject({ method: 'GET', url: '/health' });
    await app.inject({ method: 'GET', url: '/metrics' });
  });

  it('🛡️ app.ts: /signals multi-tier coverage', async () => {
    // 1. Missing wallet
    const r1 = await app.inject({ method: 'GET', url: '/signals' });
    expect(r1.statusCode).toBe(400);

    // 2. STARLIGHT tier
    const mockRank = (app as any).rankService;
    vi.spyOn(mockRank, 'getUser').mockResolvedValueOnce({
      subscriptionStatus: 'STARLIGHT',
      tier: 'GOLD',
      volume: { currentMonthVolume: 0 },
      walletAddress: 'w',
    } as any);
    const r2 = await app.inject({ method: 'GET', url: '/signals', query: { wallet: 'w' } });
    expect(r2.statusCode).toBe(200);

    // 3. VIP tier
    vi.spyOn(mockRank, 'getUser').mockResolvedValueOnce({
      subscriptionStatus: 'VIP',
      tier: 'GOLD',
      volume: { currentMonthVolume: 0 },
      walletAddress: 'w',
    } as any);
    const r3 = await app.inject({ method: 'GET', url: '/signals', query: { wallet: 'v' } });
    expect(r3.statusCode).toBe(200);
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
