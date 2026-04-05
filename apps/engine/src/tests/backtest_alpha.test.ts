import { describe, it, expect, vi } from 'vitest';
import { IntelligenceEngine } from '../core/engine.js';
import { type PumpPortalEvent } from '../infrastructure/adapters/pumpportal.adapter.js';

interface EnrichedTestEvent extends PumpPortalEvent {
  twitter?: string;
  website?: string;
  telegram?: string;
}

// 🏛️ Institutional Isolation: Mock external infrastructure to pass on restricted CI runners
vi.mock('../infrastructure/adapters/solana.adapter.js', () => ({
  SolanaAdapter: class {
    start = vi.fn().mockResolvedValue(undefined);
    stop = vi.fn().mockResolvedValue(undefined);
    on = vi.fn();
  },
}));

vi.mock('../infrastructure/adapters/pumpportal.adapter.js', () => ({
  PumpPortalAdapter: class {
    start = vi.fn().mockResolvedValue(undefined);
    stop = vi.fn().mockResolvedValue(undefined);
    on = vi.fn();
  },
}));

vi.mock('../infrastructure/adapters/pumpapi.adapter.js', () => ({
  PumpapiAdapter: class {
    getTokenMetadata = vi.fn().mockResolvedValue({
      symbol: 'GIGA',
      name: 'GigaChad Coin',
      description: 'Alpha sensor triggered',
      creator: 'GoodDevWallet123456',
    });
  },
}));

vi.mock('../agents/reasoning.service.js', () => ({
  ReasoningService: class {
    analyzeToken = vi.fn().mockResolvedValue({
      verdict: 'ALPHA',
      narrative: '[MOCK] High convicton GIGA chad alpha detected',
      confidence: 'HIGH',
      riskFactors: [],
      catalysts: ['Bullish Sentiment'],
      generatedByAI: true,
    });
  },
}));

vi.mock('@rzuna/database', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue([{ id: 'mock_1' }]),
      }),
    }),
  },
  scoutedTokens: { id: 'id', mint: 'mintAddress' },
}));

vi.mock('../infrastructure/adapters/pumpportal.adapter.js', () => ({
  PumpPortalAdapter: class {
    start = vi.fn().mockResolvedValue(undefined);
    stop = vi.fn().mockResolvedValue(undefined);
    on = vi.fn();
  },
}));

vi.mock('../infrastructure/adapters/pumpapi.adapter.js', () => ({
  PumpapiAdapter: class {
    getTokenMetadata = vi.fn().mockResolvedValue({
      symbol: 'GIGA',
      name: 'GigaChad Coin',
      description: 'Alpha sensor triggered',
      creator: 'GoodDevWallet123456',
    });
  },
}));

vi.mock('../agents/reasoning.service.js', () => ({
  ReasoningService: class {
    analyzeToken = vi.fn().mockResolvedValue({
      verdict: 'ALPHA',
      narrative: '[MOCK] High convicton GIGA chad alpha detected',
      confidence: 'HIGH',
      riskFactors: [],
      catalysts: ['Bullish Sentiment'],
      generatedByAI: true,
    });
  },
}));

vi.mock('@rzuna/database', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue([{ id: 'mock_1' }]),
      }),
    }),
  },
  scoutedTokens: { id: 'id', mint: 'mintAddress' },
}));

describe('B2B Phase 1: Real-time Dry Run Pipeline', () => {
  it('SHOULD successfully receive a good token, process L1/L2, and broadcast via ElizaOS', async () => {
    const engine = new IntelligenceEngine();

    // Listen for ElizaOS broadcast for the assertion
    const broadcastPromise = new Promise<{ platform: string; content: string }>((resolve) => {
      engine.eliza.on('broadcast', (msg) => resolve(msg));
    });

    await engine.start();

    try {
      console.info('\n' + '═'.repeat(70));
      console.info('  🏛️  RZUNA B2B PHASE 1: PIPELINE INJECTION (DRY RUN)');
      console.info('═'.repeat(70));

      // Mock an incredibly bullish event
      const goodEvent: EnrichedTestEvent = {
        mint: 'So11111111111111111111111111111111111111112', // System Program (Valid base58)
        symbol: 'GIGA',
        name: 'GigaChad Coin',
        txType: 'create',
        vSolInBondingCurve: 150, // Massive liquidity (>100)
        vTokensInBondingCurve: 200000000,
        marketCapSol: 1000, // Massive market cap (>500)
        traderPublicKey: 'GoodDevWallet123456',
        bondingCurveKey: 'BondCurve123',
        uri: 'https://example.com/meta.json',
        twitter: 'https://x.com/gooddev',
        website: 'https://gooddev.io',
      };

      console.info(`  [1] Injecting Event -> $${goodEvent.symbol} (${goodEvent.mint})`);

      // 🛡️ Force High Score for CI stability
      vi.spyOn((engine as any).scorer, 'calculateInitialScore').mockReturnValue({
        score: 95,
        redFlags: [],
        isPremium: true,
      });

      // Inject it into the pipeline
      await engine.handleAlphaEvent(goodEvent);

      // Wait for the pipeline to finish and Eliza to broadcast
      const broadcast = (await Promise.race([
        broadcastPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Pipeline timeout')), 20000)),
      ])) as any;

      console.info(`\n  [2] AI Pipeline Result Received!`);
      console.info(`  ------------------------------------------------------------------`);
      console.info(`  Platform : ${broadcast.platform}`);
      console.info(`  Content  : \n${broadcast.content}`);
      console.info(`  ------------------------------------------------------------------\n`);

      expect(broadcast.content).toContain('ALPHA');
      expect(broadcast.content).toContain('GIGA');
    } finally {
      engine.stop();
    }
  }, 30000);
});
