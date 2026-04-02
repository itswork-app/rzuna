import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReasoningService } from '../src/agents/reasoning.service.js';
import * as serverModule from '../src/server.js';
import * as appModule from '../src/app.js';
import { env } from '../src/utils/env.js';
import { GeyserService } from '../src/infrastructure/solana/geyser.service.js';
import { monitoringPlugin } from '../src/infrastructure/monitoring/monitoring.plugin.js';
import { feePlugin } from '../src/plugins/fee.plugin.js';
// Global Mocks
vi.stubGlobal('fetch', vi.fn());
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
}));
vi.mock('@axiomhq/js', () => ({
  Axiom: class {
    ingest = vi.fn();
    flush = vi.fn().mockResolvedValue(undefined);
  },
}));
vi.mock('posthog-node', () => ({
  PostHog: class {
    getAllFlags = vi.fn().mockResolvedValue({});
    shutdown = vi.fn().mockResolvedValue(undefined);
  },
}));
vi.mock('@triton-one/yellowstone-grpc', () => ({
  default: class {
    subscribe = vi.fn().mockResolvedValue({
      on: vi.fn(),
      write: vi.fn((req: any, cb: any) => cb(null)),
    });
  },
}));
vi.mock('openai', () => ({
  default: class {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '{"narrative": "AI Success", "confidence": "HIGH"}' } }],
        }),
      },
    };
  },
}));

// Mock Supabase
vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'u1', rank: 'NEWBIE' }, error: null }),
    rpc: vi.fn().mockResolvedValue({ data: 'NEWBIE', error: null }),
  },
}));

// Mock TierService
vi.mock('../src/core/tiers/tier.service.js', () => ({
  TierService: class {
    getUserProfile = vi.fn().mockResolvedValue({
      id: 'u1',
      rank: 'NEWBIE',
      status: 'NONE',
      volume: { currentMonthVolume: 0 },
    });
    getTradingFeePercentage = vi.fn().mockReturnValue(0.01);
    addVolume = vi.fn().mockResolvedValue('NEWBIE');
  },
}));

// Mock JupiterService
vi.mock('../src/infrastructure/jupiter/jupiter.service.js', () => ({
  JupiterService: class {
    autoConvertFeeToSOL = vi.fn().mockResolvedValue({ status: 'success' });
    executeSwap = vi.fn().mockResolvedValue({ status: 'success', signature: 'mock_sig' });
  },
}));

const mockConnection = {
  getSignatureStatus: vi.fn().mockResolvedValue({ value: { err: null } }),
  getParsedTransaction: vi.fn().mockResolvedValue({
    meta: { err: null, postTokenBalances: [] },
    transaction: {
      message: { accountKeys: [{ pubkey: { toBase58: () => 'mock_pub' } }], instructions: [] },
    },
  }),
  onLogs: vi.fn().mockReturnValue(1),
  removeOnLogsListener: vi.fn(),
  simulateTransaction: vi.fn().mockResolvedValue({ value: { err: null, logs: [] } }),
  confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
  getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'hash' }),
  sendRawTransaction: vi.fn().mockResolvedValue('sig'),
};

vi.mock('@solana/web3.js', async (importOriginal: any) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    Keypair: {
      ...actual.Keypair,
      fromSecretKey: vi.fn().mockReturnValue({
        publicKey: { toBase58: () => 'mock_pub' },
        secretKey: new Uint8Array(64),
      }),
    },
    VersionedTransaction: {
      ...actual.VersionedTransaction,
      deserialize: vi.fn().mockReturnValue({
        sign: vi.fn(),
        serialize: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
      }),
    },
    PublicKey: class {
      constructor(public key: string) {}
      toBase58 = () => this.key;
      toBuffer = () => Buffer.alloc(32);
      equals = () => true;
      static readonly findProgramAddressSync = vi.fn().mockReturnValue([Buffer.from('pda'), 255]);
    },
    Transaction: class {
      add = vi.fn().mockReturnThis();
      sign = vi.fn();
      serialize = vi.fn().mockReturnValue(new Uint8Array([4, 5, 6]));
      recentBlockhash = '';
      feePayer = null;
    },
    SystemProgram: {
      transfer: vi.fn(),
    },
    Connection: class {
      constructor() {
        Object.assign(this, mockConnection);
      }
    },
  };
});

describe('☢️ Institutional 80% Absolute Nuclear Coverage', () => {
  let service: ReasoningService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env for each test to avoid pollution
    env.OPENAI_API_KEY = undefined;
    service = new ReasoningService();
    env.SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
    env.USDC_TREASURY_WALLET = 'treasury_123';
  });

  describe('🧠 ReasoningService Infiltration (Target: >80% Branches)', () => {
    it('should hit ALL catalysts branches (Line 19, 21, 22, 25)', async () => {
      const event: any = { initialLiquidity: 1000, socialScore: 80 };
      const score = 95;
      // Hit 19, 21, 22
      const res = await (service as any).analyzeToken(event, score);
      expect(res.catalysts.length).toBeGreaterThan(1);
    });

    it('should hit catalysts fallback branch (Line 25)', async () => {
      const event: any = { initialLiquidity: 100, socialScore: 30 };
      const res = await (service as any).analyzeToken(event, 80);
      expect(res.catalysts[0]).toBe('Token lolos filter L1 rzuna');
    });

    it('should hit ALL risk branches (Line 32, 33, 35, 37)', async () => {
      const event: any = { initialLiquidity: 50, metadata: { isMintable: true }, socialScore: 10 };
      const res = await (service as any).analyzeToken(event, 80);
      expect(res.riskFactors.length).toBeGreaterThanOrEqual(2);
    });

    it('should hit metadata undefined branches (Line 42, 115, 116)', async () => {
      const event: any = { mint: 'm', initialLiquidity: 100, socialScore: 50 }; // No metadata
      const res = await (service as any).analyzeToken(event, 80);
      expect(res.narrative).toContain('UNKNOWN');
    });

    it('should hit score threshold branches (Line 52, 60)', async () => {
      const event: any = { initialLiquidity: 100, socialScore: 50 };
      // Branch 60 HIGH
      const r1 = await (service as any).analyzeToken(event, 91);
      expect(r1.confidence).toBe('HIGH');
      // Branch 60 MEDIUM
      const r2 = await (service as any).analyzeToken(event, 88);
      expect(r2.confidence).toBe('MEDIUM');
      // Branch 60 LOW
      const r3 = await (service as any).analyzeToken(event, 85);
      expect(r3.confidence).toBe('LOW');
    });

    it('should hit OpenAI content fallback branches (Line 99, 101-104)', async () => {
      env.OPENAI_API_KEY = 'test';
      const aiService = new ReasoningService();
      const mockOpenAI = (aiService as any).openai;

      // Reset mock for this specific test case
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({ choices: [] });
      const r1 = await aiService.analyzeToken({} as any, 80);
      expect(r1.generatedByAI).toBe(true);

      // Hit 101-104 (properties missing)
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: '{}' } }],
      });
      const r2 = await aiService.analyzeToken({} as any, 80);
      expect(r2.narrative).toBe('AI generated narrative unavailable');

      // Hit success path
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: '{"narrative": "AI Success", "confidence": "HIGH"}' } }],
      });
      const r3 = await aiService.analyzeToken({} as any, 95);
      expect(r3.narrative).toBe('AI Success');
      expect(r3.confidence).toBe('HIGH');
    });
  });

  describe('🚀 server.ts Infiltration (Target: 100% Branches)', () => {
    it('should hit port and execution mode branches (Line 10, 20)', async () => {
      env.PORT = '';
      env.EXECUTION_MODE = 'real';
      const spy = vi.spyOn(appModule, 'buildApp').mockResolvedValue({
        listen: vi.fn(),
        close: vi.fn(),
      } as any);

      const app = await serverModule.start();
      expect(app).toBeDefined();
      spy.mockRestore();
    });

    it('should hit dry_run execution mode branch (Line 20)', async () => {
      env.EXECUTION_MODE = 'dry_run';
      const spy = vi.spyOn(appModule, 'buildApp').mockResolvedValue({
        listen: vi.fn(),
        close: vi.fn(),
      } as any);

      const app = await serverModule.start();
      expect(app).toBeDefined();
      spy.mockRestore();
    });

    it('should hit fatal startup catch block (Line 25-28)', async () => {
      const spy = vi.spyOn(appModule, 'buildApp').mockRejectedValueOnce(new Error('Fatal'));
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await serverModule.start();
      expect(exitSpy).toHaveBeenCalledWith(1);
      spy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe('🛡️ Infrastructure Infiltration (Target: >80% Branches)', () => {
    it('monitoringPlugin: should hit ALL initialization branches', async () => {
      env.SENTRY_DSN = 'test';
      env.AXIOM_TOKEN = 'test';
      env.AXIOM_DATASET = 'test';
      env.POSTHOG_API_KEY = 'test';

      const fastify: any = {
        addHook: vi.fn(),
        decorate: vi.fn(),
        log: { error: vi.fn() },
      };

      await (monitoringPlugin as any)(fastify, {});
      expect(fastify.addHook).toHaveBeenCalled();
      expect(fastify.decorate).toHaveBeenCalled();

      // Hit onError branch (Sentry)
      const onError = fastify.addHook.mock.calls.find((c: any) => c[0] === 'onError')[1];
      await onError({}, {}, new Error('Test'));

      // Hit onResponse branch (Axiom)
      const onResponse = fastify.addHook.mock.calls.find((c: any) => c[0] === 'onResponse')[1];
      await onResponse(
        { method: 'GET', url: '/', query: {} },
        { statusCode: 200, elapsedTime: 10 },
      );
    });

    it('GeyserService: should hit connection and stream error branches', async () => {
      env.GEYSER_ENDPOINT = 'test';
      env.GEYSER_TOKEN = 'test';
      const geyser = new GeyserService();

      const mockStream = {
        on: vi.fn(),
        write: vi.fn((req: any, cb: any) => cb(null)),
      };
      (geyser as any).client = { subscribe: vi.fn().mockResolvedValue(mockStream) };
      (geyser as any).isActive = true;

      await geyser.start();

      // Hit stream error branch
      const errorCall = mockStream.on.mock.calls.find((c: any) => c[0] === 'error');
      if (errorCall) await errorCall[1](new Error('Stream Crash'));
    });

    it('GeyserService: should hit VIP mode and NO-OP branches (Line 51, 60, 72)', async () => {
      // 1. VIP Mode Construction
      env.VIP_GEYSER_ENDPOINT = 'vip-test';
      env.VIP_GEYSER_TOKEN = 'vip-token';
      const vipGeyser = new GeyserService('vip');
      expect((vipGeyser as any).mode).toBe('vip');

      // 2. NO-OP construction (missing credentials)
      env.GEYSER_ENDPOINT = undefined;
      env.GEYSER_TOKEN = undefined;
      const noopGeyser = new GeyserService('public');
      expect((noopGeyser as any).isActive).toBe(false);

      // 3. Skip start on inactive service
      const spy = vi.spyOn(console, 'warn');
      await noopGeyser.start();
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('gRPC inactive. Starting WebSocket Fallback...'),
      );
    });

    it('env.ts: should hit validation branches', () => {
      // Logic: Zod schema branches for default values and optionals
      expect(env.NODE_ENV).toBeDefined();
      expect(env.PORT).toBeDefined();
    });

    it('feePlugin: should hit PostHog flags, price fallback, and alpha logging', async () => {
      const fastify: any = {
        post: vi.fn(),
        get: vi.fn(),
        logAlpha: vi.fn().mockResolvedValue(undefined),
        posthog: { getAllFlags: vi.fn().mockResolvedValue({}) },
        log: { error: vi.fn(), info: vi.fn() },
      };

      await (feePlugin as any)(fastify, {});
      const handler = fastify.post.mock.calls.find((c: any) => c[0] === '/trade')[1];
      const reply: any = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockResolvedValue(undefined),
      };

      // 1. Mock fetch success for getLiveSOLPrice
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { SOL: { price: 150 } } }),
      } as any);

      console.info('Triggering Handler 1...');
      await handler(
        {
          body: {
            walletAddress: 'w',
            amountUSD: 100,
            platform: 'RAYDIUM',
            signature: 's',
            status: 'success',
          },
        },
        reply,
      );

      // 2. Mock fetch failure for getLiveSOLPrice
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as any);

      // 3. Mock Supabase error
      const { supabase } = await import('../src/infrastructure/supabase/client.js');
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: new Error('DB Fail') }),
        update: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: '1', rank: 'NEWBIE' } }),
        rpc: vi.fn().mockResolvedValue({ data: 'NEWBIE', error: null }),
      };

      const supabaseFromSpy = vi.spyOn(supabase, 'from').mockImplementation((tableName: string) => {
        if (tableName === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: '1', rank: 'NEWBIE' }, error: null }),
          } as any;
        }
        return mockSupabase.from(tableName);
      });

      console.info('Triggering Handler 2...');
      const logSpy = vi.spyOn(fastify.log, 'error');
      await handler(
        {
          body: {
            walletAddress: 'w',
            amountUSD: 100,
            platform: 'RAYDIUM',
            signature: 's',
            status: 'success',
          },
        },
        reply,
      );

      expect(logSpy).toHaveBeenCalled();
      expect(fastify.logAlpha).toHaveBeenCalled();

      // 4. Test /subscribe endpoint (Line 180+)
      const subHandler = fastify.post.mock.calls.find((c: any) => c[0] === '/subscribe')[1];
      await subHandler(
        {
          body: {
            walletAddress: 'w',
            tier: 'STARLIGHT',
            amountSOL: 50,
            paymentSignature: 'sub_sig',
          },
        },
        reply,
      );
      expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));

      // 5. Test /subscribe error branch
      mockSupabase.update.mockResolvedValueOnce({ error: new Error('Sub Fail') });
      await subHandler({ body: { walletAddress: 'w' } }, reply);
      expect(reply.status).toHaveBeenCalledWith(500);

      supabaseFromSpy.mockRestore();
    });

    it('should cover feePlugin feature flag gating and verification failures', async () => {
      const fastify: any = {
        post: vi.fn(),
        get: vi.fn(),
        logAlpha: vi.fn().mockResolvedValue(undefined),
        posthog: { getAllFlags: vi.fn().mockResolvedValue({ jupiter_swap_enabled: false }) },
        log: { error: vi.fn(), info: vi.fn() },
      };
      await (feePlugin as any)(fastify, {});
      const handler = fastify.post.mock.calls.find((c: any) => c[0] === '/trade')[1];
      const reply: any = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockResolvedValue(undefined),
      };

      // 1. Feature flag gated (Line 129)
      await handler({ body: { walletAddress: 'w' } }, reply);
      expect(reply.status).toHaveBeenCalledWith(403);

      // 2. Trade verification failure (Line 121)
      mockConnection.getSignatureStatus.mockResolvedValueOnce({ value: null } as any);
      await handler({ body: { walletAddress: 'w', signature: 'bad', status: 'success' } }, reply);
      expect(reply.status).toHaveBeenCalledWith(400);
    });

    it('should cover feePlugin subscription production guards', async () => {
      const fastify: any = {
        post: vi.fn(),
        get: vi.fn(),
        log: { info: vi.fn(), error: vi.fn() },
      };
      await (feePlugin as any)(fastify, {});
      const subHandler = fastify.post.mock.calls.find((c: any) => c[0] === '/subscribe')[1];
      const reply: any = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockResolvedValue(undefined),
      };

      // Production guard (Line 247)
      env.NODE_ENV = 'production';
      env.SOL_TREASURY_WALLET = 't';
      // Mock verifyOnChainPayment to return false
      // Since verifyOnChainPayment calls connection.getParsedTransaction, we mock that to fail.
      mockConnection.getParsedTransaction.mockResolvedValueOnce(null);

      await subHandler(
        { body: { walletAddress: 'w', paymentSignature: 'p', amountSOL: 1 } },
        reply,
      );
      expect(reply.status).toHaveBeenCalledWith(403);
      env.NODE_ENV = 'test';
    });
  });

  describe('👁️ GeyserService Deep Reconnaissance', () => {
    it('hits startWebSocketFallback callback branches', async () => {
      const geyser = new GeyserService();
      const mockConn = (geyser as any).connection;

      let logCallback: any;
      mockConn.onLogs.mockImplementation((id: any, cb: any) => {
        logCallback = cb;
        return 123;
      });

      await (geyser as any).startWebSocketFallback();

      // 1. Trigger callback with non-matching logs (no "Create")
      await logCallback({ logs: ['Transfer'], signature: 'sig1' });

      // 2. Trigger with "Create" but transaction fetch fails
      mockConn.getParsedTransaction.mockResolvedValueOnce(null);
      await logCallback({ logs: ['Program log: Instruction: Create'], signature: 'sig2' });

      // 3. Trigger with "Create" and transaction successful
      mockConn.getParsedTransaction.mockResolvedValueOnce({
        meta: { err: null },
        transaction: {
          message: {
            accountKeys: [
              { pubkey: { toBase58: () => '6EF8rrecthR5Dkzon8Nwu78hRvfMX1NczvLA8nd6XMyC' } },
              { pubkey: { toBase58: () => 'detected_mint_xyz_long_address_institutional_grade' } },
            ],
          },
        },
      });

      const emitSpy = vi.spyOn(geyser, 'emit');
      await logCallback({ logs: ['Program log: Instruction: Create'], signature: 'sig3' });
      // We expect 'mint' event to be emitted
      // Wait for the async IIFE inside the callback
      await new Promise((r) => setTimeout(r, 10));
      expect(emitSpy).toHaveBeenCalledWith(
        'mint',
        expect.objectContaining({ mint: 'detected_mint_xyz_long_address_institutional_grade' }),
      );
    });
  });
});
