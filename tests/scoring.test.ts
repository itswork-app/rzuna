import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringService } from '../src/core/scoring/scoring.service.js';
import { type MintEvent } from '../src/infrastructure/solana/geyser.service.js';

describe('Scoring Logic Audit (Alpha Intelligence)', () => {
  let scoringService: ScoringService;

  beforeEach(() => {
    scoringService = new ScoringService();
  });

  describe('Security Check (isMintable)', () => {
    it('koin dengan isMintable: true selalu mendapatkan skor di bawah 50', () => {
      const highPotentialButMintable: MintEvent = {
        mint: 'mint_danger',
        signature: 'sig_1',
        timestamp: new Date().toISOString(),
        initialLiquidity: 1000,
        socialScore: 90,
        metadata: {
          name: 'Super Legit Gem',
          symbol: 'SLG',
          mint: 'mint_danger',
          isMintable: true,
        },
      };

      const result = scoringService.calculateScore(highPotentialButMintable);
      expect(result.score).toBeLessThan(50);
      expect(result.reasoning).toContain(
        'CRITICAL: Mintable status detected. Token flagged as high risk.',
      );
    });
  });

  describe('Alpha Detection', () => {
    it('should identify a high-quality gem (> 80)', () => {
      const realGem: MintEvent = {
        mint: 'gem_123',
        signature: 'sig_2',
        timestamp: new Date().toISOString(),
        initialLiquidity: 1000,
        socialScore: 30,
        metadata: {
          name: 'Golden Alpha Gem',
          symbol: 'GOLD',
          mint: 'gem_123',
          isMintable: false,
        },
      };

      const result = scoringService.calculateScore(realGem);
      expect(result.score).toBeGreaterThan(80);
      expect(scoringService.shouldSignal(result.score)).toBe(true);
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    it('should cover fallback liquidity and social branches', () => {
      const edgeCase: MintEvent = {
        mint: 'edge_1',
        signature: 's1',
        timestamp: new Date().toISOString(),
        initialLiquidity: 75, // Triggers return 15
        socialScore: undefined as any, // Triggers random social score branch
        metadata: { name: 'Normal', symbol: 'NORM', mint: 'edge_1' },
      };

      const result = scoringService.calculateScore(edgeCase);
      expect(result.score).toBeDefined();
      expect(scoringService.shouldDelist(10)).toBe(true);
      expect(scoringService.shouldDelist(90)).toBe(false);
    });
  });
});
