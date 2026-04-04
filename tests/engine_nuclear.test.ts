import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntelligenceEngine } from '../src/core/engine.js';
import { UserRank, SubscriptionStatus } from '../src/core/types/user.js';
import { ScoringService } from '../src/core/scoring/scoring.service.js';
import { ReasoningService } from '../src/agents/reasoning.service.js';
import { env } from '../src/utils/env.js';

// Mock Solana
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

// Mock Env
vi.mock('../src/utils/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    SUPABASE_URL: 'https://test.co',
    SUPABASE_KEY: 'test-key',
    SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
  },
}));

// Mock TelegramService
vi.mock('../src/infrastructure/telegram/telegram.service.js', () => ({
  TelegramService: class {
    broadcastAlpha = vi.fn().mockResolvedValue(undefined);
  },
}));

// Mock RealtimeService
vi.mock('../src/infrastructure/supabase/realtime.service.js', () => ({
  RealtimeService: class {
    broadcastVipAlpha = vi.fn();
  },
}));

// Mock OpenAI
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

const mockSupabaseBuilder: any = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ error: null }),
  update: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  single: vi.fn().mockResolvedValue({ data: { id: 'u1', rank: 'NEWBIE' }, error: null }),
  upsert: vi.fn().mockResolvedValue({ error: null }),
};

// Terminal for await calls
mockSupabaseBuilder.then = (onFulfilled: any) =>
  Promise.resolve({ data: null, error: null }).then(onFulfilled);

vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseBuilder),
    rpc: vi.fn().mockResolvedValue({ data: 'NEWBIE', error: null }),
  },
}));

describe('🛡️ IntelligenceEngine NUCLEAR Branch Coverage', () => {
  let engine: IntelligenceEngine;

  beforeEach(() => {
    engine = new IntelligenceEngine();
    vi.clearAllMocks();
  });

  it('should cover ALL access branches (The Matrix)', () => {
    const ranks = [UserRank.NEWBIE, UserRank.PRO, UserRank.ELITE];
    const statuses = [
      SubscriptionStatus.NONE,
      SubscriptionStatus.STARLIGHT,
      SubscriptionStatus.STARLIGHT_PLUS,
      SubscriptionStatus.VIP,
    ];

    // Add one premium and one standard signal
    // @ts-expect-error - Accessing private activeSignals for test setup
    engine.activeSignals.set('P', {
      id: 'P',
      isPremium: true,
      score: 95,
      aiReasoning: { narrative: 'P' },
      metadata: {},
    } as any);
    // @ts-expect-error - Accessing private activeSignals for test setup
    engine.activeSignals.set('S', {
      id: 'S',
      isPremium: false,
      score: 85,
      aiReasoning: { narrative: 'S' },
      metadata: {},
    } as any);

    for (const rank of ranks) {
      for (const status of statuses) {
        const isStarlight = status === SubscriptionStatus.STARLIGHT;
        const isStarlightPlus = status === SubscriptionStatus.STARLIGHT_PLUS;
        const isVIP = status === SubscriptionStatus.VIP;

        vi.spyOn(Math, 'random').mockReturnValue(0.05); // Access always granted for prob logic

        const signals = engine.getTieredSignals(rank, isStarlight || isStarlightPlus, isVIP, {
          aiQuotaLimit: 10,
          aiQuotaUsed: 0,
        });

        expect(signals.length).toBeGreaterThan(0);

        // Trigger Quota Exhausted branch
        engine.getTieredSignals(rank, isStarlight, isVIP, { aiQuotaLimit: 5, aiQuotaUsed: 5 });
      }
    }
  });

  describe('🧠 ReasoningService Infiltration', () => {
    it('should hit catalysts and risk branches', async () => {
      const service = new ReasoningService();

      // Catalyst branches
      const e1: any = { initialLiquidity: 1000, socialScore: 80 };
      const r1 = await (service as any).analyzeToken(e1, 95);
      expect(r1.catalysts.length).toBeGreaterThan(1);

      // Risk branches
      const e2: any = { initialLiquidity: 50, metadata: { isMintable: true }, socialScore: 10 };
      const r2 = await (service as any).analyzeToken(e2, 80);
      expect(r2.riskFactors.length).toBeGreaterThanOrEqual(2);

      // Metadata undefined branches
      const e3: any = { mint: 'm', initialLiquidity: 100, socialScore: 50 };
      const r3 = await (service as any).analyzeToken(e3, 80);
      expect(r3.narrative).toContain('UNKNOWN');
    });

    it('should hit score confidence branches', async () => {
      const service = new ReasoningService();
      const event: any = { initialLiquidity: 100, socialScore: 50 };

      const rHigh = await (service as any).analyzeToken(event, 91);
      expect(rHigh.confidence).toBe('HIGH');

      const rMed = await (service as any).analyzeToken(event, 88);
      expect(rMed.confidence).toBe('MEDIUM');

      const rLow = await (service as any).analyzeToken(event, 85);
      expect(rLow.confidence).toBe('LOW');
    });

    it('should hit OpenAI content fallback branches', async () => {
      env.OPENAI_API_KEY = 'test';
      const aiService = new ReasoningService();
      const mockOpenAI = (aiService as any).openai;

      // Missing choices
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({ choices: [] });
      const r1 = await aiService.analyzeToken({} as any, 80);
      expect(r1.generatedByAI).toBe(true);

      // Missing properties in JSON
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: '{}' } }],
      });
      const r2 = await aiService.analyzeToken({} as any, 80);
      expect(r2.narrative).toBe('AI generated narrative unavailable');
    });
  });

  describe('🧠 ScoringService Infiltration', () => {
    it('hits calculateScore branches and normalization', () => {
      const scorer = new ScoringService();

      // Elite branch
      const r1 = scorer.calculateScore({
        mint: 'm1',
        signature: 's1',
        initialLiquidity: 100000, // Higher liquidity
        metadata: { mint: 'm1', name: 'Elite', symbol: 'E' },
        socialScore: 100, // Higher score
        timestamp: Date.now().toString(),
      });
      expect(r1.score).toBeGreaterThan(90);

      // Low liquidity branch
      const r2 = scorer.calculateScore({
        mint: 'm2',
        signature: 's2',
        initialLiquidity: 10,
        metadata: { mint: 'm2', name: 'Low', symbol: 'L' },
        timestamp: Date.now().toString(),
      });
      expect(r2.score).toBe(0);
    });
  });

  describe('⚙️ IntelligenceEngine Lifecycle Infiltration', () => {
    it('hits start, pipe, and autodown branches', async () => {
      const engine = new IntelligenceEngine();
      await engine.start();

      const geyser = (engine as any).geyser;
      geyser.emit('mint', {
        mint: 'm1',
        signature: 's1',
        timestamp: Date.now().toString(),
        initialLiquidity: 1000,
        metadata: { mint: 'm1', name: 'Alpha', symbol: 'A' },
      });

      await new Promise((r) => setTimeout(r, 50));

      await engine.ensureVipGeyser();
      const vipGeyser = (engine as any).vipGeyser;
      vipGeyser.emit('mint', {
        mint: 'v1',
        signature: 'vs1',
        timestamp: Date.now().toString(),
        initialLiquidity: 5000,
        metadata: { mint: 'v1', name: 'VIP', symbol: 'V' },
      });

      // Auto-down check
      vi.useFakeTimers();
      const mockScorer = (engine as any).scorer;
      vi.spyOn(mockScorer, 'shouldDelist').mockReturnValue(true);
      vi.mocked(mockSupabaseBuilder.update).mockReturnThis();
      vi.mocked(mockSupabaseBuilder.eq).mockResolvedValueOnce({ error: null } as any);

      (engine as any).startAutoDownExecution();
      await vi.advanceTimersByTimeAsync(10000);

      engine.stop();
      vi.useRealTimers();
    });
  });
});
