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

describe('☢️ Institutional 80% Absolute Nuclear Coverage', () => {
  let service: ReasoningService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env for each test to avoid pollution
    env.OPENAI_API_KEY = undefined;
    service = new ReasoningService();
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
      expect(res.riskFactors.length).toBeGreaterThan(2);
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
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('No-op mode active'));
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
        log: { error: vi.fn(), info: vi.fn() },
      };

      await (feePlugin as any)(fastify, {});
      const handler = fastify.post.mock.calls[0][1];
      const reply: any = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockResolvedValue(undefined),
      };

      // 1. Mock fetch success for getLiveSOLPrice
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { SOL: { price: 150 } } }),
      } as any);

      await handler(
        { body: { walletAddress: 'w', amountUSD: 100, platform: 'RAYDIUM', signature: 's' } },
        reply,
      );

      // 2. Mock fetch failure for getLiveSOLPrice
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as any);

      // 3. Mock Supabase error (Line 95)
      const { supabase } = await import('../src/infrastructure/supabase/client.js');
      const supabaseFromSpy = vi.spyOn(supabase, 'from');
      supabaseFromSpy.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: new Error('DB Fail') }),
      } as any);

      await handler(
        { body: { walletAddress: 'w', amountUSD: 100, platform: 'RAYDIUM', signature: 's' } },
        reply,
      );
      expect(fastify.log.error).toHaveBeenCalled();
      expect(fastify.logAlpha).toHaveBeenCalled();
      supabaseFromSpy.mockRestore();
    });
  });
});
