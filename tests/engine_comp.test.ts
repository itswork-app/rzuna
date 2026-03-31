import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntelligenceEngine } from '../src/core/engine.js';
import { UserRank } from '../src/core/types/user.js';

vi.mock('../src/infrastructure/solana/geyser.service.js', () => ({
  GeyserService: class {
    on = vi.fn();
    start = vi.fn().mockResolvedValue(undefined);
    removeAllListeners = vi.fn();
  },
}));

vi.mock('../src/infrastructure/supabase/realtime.service.js', () => ({
  RealtimeService: class {
    broadcastVipAlpha = vi.fn();
  },
}));

describe('🛡️ IntelligenceEngine Institutional Coverage', () => {
  let engine: IntelligenceEngine;

  beforeEach(() => {
    engine = new IntelligenceEngine();
    vi.clearAllMocks();
  });

  it('should filter signals by rank probability for non-VIP', () => {
    const mockSignal = {
      id: '1',
      mint: 'mint1',
      score: 95,
      isPremium: true,
      aiReasoning: { narrative: 'ORIGINAL' },
      metadata: {},
    };
    // @ts-expect-error - Accessing private
    engine.activeSignals.set('1', mockSignal as any);

    // Probability for PRO is 0.3. Math.random() < 0.3 => access.
    vi.spyOn(Math, 'random').mockReturnValue(0.2); // Success

    const signals = engine.getTieredSignals(
      UserRank.PRO,
      false, // isStarlight
      false, // isVIP
      { aiQuotaLimit: 10, aiQuotaUsed: 0 },
    );

    expect(signals).toHaveLength(1);
    expect(signals[0].aiReasoning?.narrative).toContain('[HIDDEN]');
  });

  it('should block signals by rank probability for non-VIP', () => {
    const mockSignal = { id: '2', mint: 'mint2', score: 95, isPremium: true, metadata: {} };
    // @ts-expect-error - Accessing private
    engine.activeSignals.set('2', mockSignal as any);

    vi.spyOn(Math, 'random').mockReturnValue(0.8); // Fail (0.8 > 0.3)

    const signals = engine.getTieredSignals(UserRank.PRO, false, false, {
      aiQuotaLimit: 10,
      aiQuotaUsed: 0,
    });

    expect(signals).toHaveLength(0);
  });

  it('should allow VIP to see VIP-only reasoning', () => {
    const mockSignal = {
      id: 'vip1',
      mint: 'mint-vip',
      score: 99,
      isPremium: true,
      aiReasoning: { narrative: 'ALPHA REAL REASONING' },
      metadata: {},
    };
    // @ts-expect-error - Accessing private
    engine.activeSignals.set('vip1', mockSignal as any);

    const signals = engine.getTieredSignals(
      UserRank.PRO,
      false,
      true, // isVIP
      { aiQuotaLimit: 0, aiQuotaUsed: 0 }, // Quota exhausted but VIP bypasses
    );

    expect(signals).toHaveLength(1);
    expect(signals[0].aiReasoning?.narrative).toBe('ALPHA REAL REASONING');
  });

  it('should cover Auto-Down execution and stop()', async () => {
    vi.useFakeTimers();
    const mockSignal = { mint: 'mint-down', score: 90, event: { mint: 'mint-down' } };
    // @ts-expect-error - Accessing private
    engine.activeSignals.set('mint-down', mockSignal as any);

    await engine.start();

    // Simulate score decay
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // Triggers score = 80 in Auto-Down DEMO logic

    // Fast-forward 10s to trigger interval
    await vi.advanceTimersByTimeAsync(11000);

    // @ts-expect-error - Accessing private
    expect(engine.activeSignals.has('mint-down')).toBe(false);

    engine.stop();
    vi.useRealTimers();
  });

  it('should catch errors in getTieredSignals', () => {
    // Force an error by passing null for profile
    const signals = engine.getTieredSignals(UserRank.PRO, false, false, null as any);
    expect(signals).toEqual([]);
  });
});
