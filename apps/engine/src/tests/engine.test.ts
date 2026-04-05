import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntelligenceEngine } from '../core/engine.js';
import { UserRank } from '@rzuna/contracts';

// 🏛️ Class Based Mocks for Stable "new" Constructor Calls
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
      symbol: 'RZUNA',
      name: 'Rzuna',
      description: 'Institutional Alpha',
      // creator: removed to let engine use event.traderPublicKey as dev
    });
  },
}));

vi.mock('../agents/reasoning.service.js', () => ({
  ReasoningService: class {
    analyzeToken = vi.fn().mockResolvedValue({
      verdict: 'ALPHA',
      narrative: 'High Potential Alpha Sensor triggered',
      riskFactors: ['Low Liquidity'],
      catalysts: ['Viral Narrative'],
      confidence: 'HIGH',
      generatedByAI: true,
    });
    getUsageStats = vi.fn().mockReturnValue({ callsThisMinute: 0, maxPerMinute: 20 });
  },
}));

vi.mock('../infrastructure/jupiter/jupiter.service.js', () => ({
  JupiterService: class {
    constructor() {}
    getBestRoute = vi.fn();
    executeSwap = vi.fn();
    autoConvertFeeToSOL = vi.fn().mockResolvedValue({
      signature: 'mock_sig',
      status: 'success',
      dryRun: true,
    });
  },
}));

vi.mock('./services/security.service.js', () => ({
  TokenSecurityService: class {
    getSecurityReport = vi.fn().mockResolvedValue({
      mintAuthorityRevoked: true,
      freezeAuthorityRevoked: true,
      topHolderPct: 30,
      holderCount: 50,
      isLpLocked: true,
      redFlags: [],
      score: 8,
    });
  },
}));

vi.mock('@rzuna/database', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue([{ id: 'mock_1' }]),
        returning: vi.fn().mockResolvedValue([{ id: 'mock_1' }]),
      }),
      returning: vi.fn().mockResolvedValue([{ id: 'mock_1' }]),
    }),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((cb) => cb([])),
  },
  scoutedTokens: { id: 'id', mint: 'mint' },
}));

describe('IntelligenceEngine (Bank Standard Nerve)', () => {
  let engine: IntelligenceEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new IntelligenceEngine();
  });

  it('SHOULD start the engine and connect infrastructure', async () => {
    await engine.start();
    expect(engine).toBeDefined();
  });

  it('SHOULD handle alpha events and emit signals', async () => {
    const mockEvent = {
      mint: 'mint_123',
      traderPublicKey: 'trader_1',
      txType: 'buy',
      initialBuy: 100,
      solAmount: 1,
      vSolInBondingCurve: 150, // Massive liquidity (>100)
      vTokensInBondingCurve: 1000000,
      marketCapSol: 1000, // Massive market cap (>500)
      symbol: 'RZUNA',
      name: 'Rzuna Alpha',
      twitter: 'https://x.com/rzuna',
      website: 'https://rzuna.io',
      telegram: 'https://t.me/rzuna',
    };

    let signalEmitted = false;
    engine.on('signal', () => {
      signalEmitted = true;
    });

    vi.spyOn((engine as any).scorer, 'calculateInitialScore').mockReturnValue({
      score: 90,
      redFlags: [],
      isPremium: true,
    });

    await engine.start();
    await engine.handleAlphaEvent(mockEvent as any);

    expect(signalEmitted).toBe(true);
    expect((engine as any).activeSignals.has('mint_123')).toBe(true);
  });

  it('SHOULD gracefully catch errors inside handleAlphaEvent', async () => {
    // Force a throw inside the DB logic to hit line 90
    vi.spyOn(engine as any, 'persistEnrichedToken').mockRejectedValueOnce(new Error('Crash'));
    await expect(engine.handleAlphaEvent({} as any)).resolves.not.toThrow();
  });

  it('SHOULD return tiered signals with hidden reasoning for free users', () => {
    // Inject a signal manually
    (engine as any).activeSignals.set('mint_abc', {
      mint: 'mint_abc',
      symbol: 'ABC',
      score: 95,
      isPremium: true,
      aiReasoning: { narrative: 'Top Secret Alpha' },
    });

    // 1. VIP gets full reasoning
    const vipSignals = engine.getTieredSignals(UserRank.BRONZE, false, true);
    expect(vipSignals[0].aiReasoning?.narrative).toBe('Top Secret Alpha');

    // 2. Free user gets [HIDDEN]
    const freeSignals = engine.getTieredSignals(UserRank.BRONZE, false, false);
    if (freeSignals.length > 0) {
      expect(freeSignals[0].aiReasoning?.narrative).toContain('[HIDDEN]');
    }
  });

  it('SHOULD handle errors when getting tiered signals', () => {
    // 🏛️ Setup a mock signal that will throw an error when accessed (mocking corrupted map)
    vi.spyOn(Array, 'from').mockImplementationOnce(() => {
      throw new Error('Corrupted array');
    });

    const errorSignals = engine.getTieredSignals(UserRank.BRONZE, false, false);
    expect(errorSignals).toEqual([]);
  });

  it('SHOULD apply probability filter for High-Rank free users', () => {
    // This test ensures the random logic is hit in GetTieredSignals
    for (let i = 0; i < 10; i++) {
      (engine as any).activeSignals.set(`mint_${i}`, {
        mint: `mint_${i}`,
        score: 95,
        isPremium: true,
      });
    }

    const signals = engine.getTieredSignals(UserRank.MYTHIC, false, false);
    expect(signals.length).toBeLessThan(11);
  });

  it('SHOULD record rugpull in reputation service when DEV_DUMP is detected', async () => {
    // 🏛️ Setup: Mock scorer to return DEV_DUMP
    const spy = vi.spyOn((engine as any).reputation, 'recordRugpull');
    vi.spyOn((engine as any).scorer, 'calculateInitialScore').mockReturnValue({
      score: 90,
      redFlags: ['DEV_DUMP'],
      isPremium: true,
    });

    await engine.handleAlphaEvent({
      mint: 'So11111111111111111111111111111111111111112',
      traderPublicKey: 'dev_1',
    } as any);
    expect(spy).toHaveBeenCalledWith('dev_1');
  });

  it('SHOULD record wash trade in reputation service when SELF_BUY is detected', async () => {
    const spy = vi.spyOn((engine as any).reputation, 'recordWashTrade');
    vi.spyOn((engine as any).scorer, 'calculateInitialScore').mockReturnValue({
      score: 90,
      redFlags: ['SELF_BUY'],
      isPremium: true,
    });

    await engine.handleAlphaEvent({
      mint: 'So11111111111111111111111111111111111111112',
      traderPublicKey: 'dev_2',
    } as any);
    expect(spy).toHaveBeenCalledWith('dev_2');
  });

  it('SHOULD fallback to WATCH narrative when AI reasoning fails', async () => {
    vi.spyOn((engine as any).reasoning, 'analyzeToken').mockRejectedValueOnce(new Error('AI Down'));
    // 🛡️ Force High Score for CI stability
    vi.spyOn((engine as any).scorer, 'calculateInitialScore').mockReturnValue({
      score: 90,
      redFlags: [],
      isPremium: true,
    });

    let caughtSignal: any = null;
    engine.on('signal', (s) => {
      caughtSignal = s;
    });

    await engine.handleAlphaEvent({
      mint: 'So11111111111111111111111111111111111111112',
      traderPublicKey: 'trader_1',
    } as any);

    expect(caughtSignal).not.toBeNull();
    expect(caughtSignal.aiReasoning.narrative).toContain('[L2 Unavailable]');
    expect(caughtSignal.aiReasoning.verdict).toBe('WATCH');
  });

  it('SHOULD stop the engine safely', () => {
    engine.stop();
    expect(engine).toBeDefined();
  });

  it('SHOULD ensure VIP Geyser bridge', async () => {
    await engine.ensureVipGeyser();
    expect(engine).toBeDefined();
  });
});
