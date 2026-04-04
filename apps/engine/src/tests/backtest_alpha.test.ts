import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntelligenceEngine } from '../core/engine.js';
import { UserRank } from '@rzuna/contracts';

// Mock Services
const mockRankService = {
  getUser: vi.fn(),
  getTradingFeeBps: vi.fn().mockReturnValue(100),
  consumeQuota: vi.fn().mockResolvedValue(true),
};

const mockScoringService = {
  calculateInitialScore: vi.fn().mockReturnValue({ score: 95, isPremium: true }),
};

const mockReasoningService = {
  analyzeToken: vi.fn().mockResolvedValue({ narrative: 'Strong Buy', riskFactors: [], catalysts: [] }),
};

vi.mock('../core/services/rank.service.js', () => ({ 
  RankService: class {
    getUser = mockRankService.getUser;
    getTradingFeeBps = mockRankService.getTradingFeeBps;
    consumeQuota = mockRankService.consumeQuota;
  }
}));

vi.mock('../core/services/scoring.service.js', () => ({ 
  ScoringService: class {
    calculateInitialScore = mockScoringService.calculateInitialScore;
  }
}));

vi.mock('../agents/reasoning.service.js', () => ({
  ReasoningService: class {
    analyzeToken = mockReasoningService.analyzeToken;
  }
}));

// Mock Database
vi.mock('@rzuna/database', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
  },
  scoutedTokens: { mintAddress: 'mint' },
}));

describe('⚖️ Institutional Pyramid: Back-test Replayer (Alpha Stream)', () => {
  let engine: IntelligenceEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new IntelligenceEngine();
  });

  const historicalEvents = [
    { type: 'trade', wallet: 'w1', mint: 'M1', symbol: 'T1', amount: 100, timestamp: 1712230000 },
    { type: 'trade', wallet: 'w1', mint: 'M2', symbol: 'T2', amount: 500, timestamp: 1712230100 },
  ];

  it('SHOULD stabilize signals from historical Alpha events', async () => {
    // 1. Setup mocks
    mockRankService.getUser.mockImplementation(async (wallet: string) => {
      if (wallet === 'w1') return { id: 'u1', tier: UserRank.GOLD };
      return { id: 'u2', tier: UserRank.BRONZE };
    });

    const signalSpy = vi.fn();
    engine.on('signal', signalSpy);

    // 2. Replay Stream
    for (const event of historicalEvents) {
      await engine.handleAlphaEvent(event as any);
    }

    // 3. Verify
    expect(mockScoringService.calculateInitialScore).toHaveBeenCalledTimes(historicalEvents.length);
    expect(mockReasoningService.analyzeToken).toHaveBeenCalled();
    expect(signalSpy).toHaveBeenCalled();
  });

  it('SHOULD handle errors gracefully during replay', async () => {
    mockScoringService.calculateInitialScore.mockImplementationOnce(() => {
      throw new Error('Sensor Failure');
    });

    await expect(engine.handleAlphaEvent({ mint: 'ERR' } as any)).resolves.not.toThrow();
  });
});
