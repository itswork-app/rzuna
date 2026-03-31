import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type MintEvent } from '../src/infrastructure/solana/geyser.service.js';
import { ScoringService } from '../src/core/scoring/scoring.service.js';
import { IntelligenceEngine } from '../src/core/engine.js';

vi.mock('@triton-one/yellowstone-grpc', () => {
  return {
    default: class {
      private endpoint: string;
      constructor(endpoint: string) {
        this.endpoint = endpoint;
      }
      connect = vi.fn().mockImplementation(() => {
        if (this.endpoint.includes('fail-connect')) {
          return Promise.reject(new Error('Connection failed'));
        }
        return Promise.resolve();
      });
      subscribe = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          on: vi.fn(),
          write: vi.fn().mockImplementation((req: any, cb: (err: Error | null) => void) => {
            if (this.endpoint.includes('fail-write')) {
              cb(new Error('Write Failure'));
            } else {
              cb(null);
            }
          }),
        });
      });
    },
  };
});

// Mock Env
vi.mock('../src/utils/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_KEY: 'test-key-long-enough-for-zod',
    PORT: '3000',
  },
}));

// Mock Supabase
vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockResolvedValue({ error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

describe('IntelligenceEngine Integration', () => {
  let scoringService: ScoringService;
  let engine: IntelligenceEngine;

  beforeEach(() => {
    scoringService = new ScoringService();
    engine = new IntelligenceEngine();
  });

  describe('ScoringService Domain', () => {
    it('should assign a low score to a scam-like token', () => {
      const scamEvent: MintEvent = {
        mint: 'scam_123',
        signature: 'sig_123',
        timestamp: new Date().toISOString(),
        initialLiquidity: 5,
        metadata: {
          name: 'ScamCoin Rug',
          symbol: 'SCAM',
          mint: 'scam_123',
        },
      };

      const result = scoringService.calculateScore(scamEvent);
      expect(result.score).toBeLessThan(40);
      expect(scoringService.shouldSignal(result.score)).toBe(false);
    });

    it('should assign a high score to a legit-looking token', () => {
      const legitEvent: MintEvent = {
        mint: 'legit_123',
        signature: 'sig_123',
        timestamp: new Date().toISOString(),
        initialLiquidity: 1000,
        socialScore: 50,
        metadata: {
          name: 'Legit Alpha Gem',
          symbol: 'GEM',
          mint: 'legit_123',
        },
      };

      const result = scoringService.calculateScore(legitEvent);
      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(scoringService.shouldSignal(result.score)).toBe(true);
    });
  });

  describe('IntelligenceEngine Orchestration', () => {
    it('should register an alpha signal when Geyser emits a high-scoring token', () => {
      const highScoringEvent: MintEvent = {
        mint: 'alpha_123',
        signature: 'sig_alpha',
        timestamp: new Date().toISOString(),
        initialLiquidity: 10000,
        socialScore: 50,
        metadata: {
          name: 'Super Alpha Gem',
          symbol: 'ALPHA',
          mint: 'alpha_123',
        },
      };

      // @ts-expect-error - Accessing private geyser for test trigger
      engine.setupPipeline();
      // @ts-expect-error - Accessing private geyser
      engine.geyser.emit('mint', highScoringEvent);

      // Verify it was saved to the Active Signals map internally
      // @ts-expect-error - Accessing internal map
      expect(engine.activeSignals.has('alpha_123')).toBe(true);
    });
  });
});
