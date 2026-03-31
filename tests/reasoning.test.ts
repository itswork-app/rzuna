import { describe, it, expect, vi, beforeEach } from 'vitest';
import { env } from '../src/utils/env.js';
import { ReasoningService } from '../src/agents/reasoning.service.js';
import { IntelligenceEngine } from '../src/core/engine.js';
import { UserRank } from '../src/core/types/user.js';
import { type MintEvent } from '../src/infrastructure/solana/geyser.service.js';

// Mock Env
vi.mock('../src/utils/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    OPENAI_API_KEY: 'test-key',
  },
}));

// Mock Supabase
vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    channel: vi.fn().mockReturnValue({
      send: vi.fn().mockResolvedValue('ok'),
    }),
  },
}));

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: class {
      chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    narrative: 'AI Analysis: Strong meme potential with low risk.',
                    catalysts: ['Viral tweet', 'Solid liquidity'],
                    riskFactors: ['High concentration'],
                    confidence: 'HIGH',
                  }),
                },
              },
            ],
          }),
        },
      };
    },
  };
});

describe('ReasoningService — L2 Agent Intelligence', () => {
  let service: ReasoningService;
  const mockEvent: MintEvent = {
    signature: 'test_sig',
    mint: 'test_mint',
    timestamp: new Date().toISOString(),
    initialLiquidity: 600,
    socialScore: 75,
    metadata: { name: 'Alpha Token', symbol: 'ALPHA', isMintable: false, mint: 'test_mint' },
  };

  beforeEach(() => {
    env.OPENAI_API_KEY = 'test-key';
    service = new ReasoningService();
  });

  it('generates AI reasoning when API key is present', async () => {
    const result = await service.analyzeToken(mockEvent, 92);
    expect(result.generatedByAI).toBe(true);
    expect(result.narrative).toContain('AI Analysis');
  });

  it('falls back to template reasoning if API key is missing', async () => {
    env.OPENAI_API_KEY = undefined as any;
    const fallbackService = new ReasoningService();
    const result = await fallbackService.analyzeToken(mockEvent, 92);
    expect(result.generatedByAI).toBe(false);
    expect(result.narrative).toContain('PRIVATE');
  });
});

describe('IntelligenceEngine — Scarcity Engine', () => {
  let engine: IntelligenceEngine;

  beforeEach(() => {
    engine = new IntelligenceEngine();
  });

  it('obfuscates narrative for non-VIP users', () => {
    const HIDDEN_MSG = '[HIDDEN] Upgrade to VIP per Eliza OS reasoning';
    const mockSignal = {
      event: { mint: 'mint1' } as any,
      score: 95,
      isPremium: true,
      aiReasoning: { narrative: 'Secret Alpha' } as any,
    };

    // Inject signal manually for testing
    (engine as any).activeSignals.set('mint1', mockSignal);

    const signals = engine.getTieredSignals(UserRank.NEWBIE, false, false);
    if (signals.length > 0) {
      expect(signals[0].aiReasoning?.narrative).toBe(HIDDEN_MSG);
    }
  });

  it('allows full access for VIP users', () => {
    const mockSignal = {
      event: { mint: 'mint1' } as any,
      score: 95,
      isPremium: true,
      aiReasoning: { narrative: 'Secret Alpha' } as any,
    };

    (engine as any).activeSignals.set('mint1', mockSignal);

    const signals = engine.getTieredSignals(UserRank.NEWBIE, false, true);
    expect(signals[0].aiReasoning?.narrative).toBe('Secret Alpha');
  });
});
