/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntelligenceEngine } from '../src/core/engine.js';
import { UserRank } from '../src/core/types/user.js';
import { ScoringService } from '../src/core/scoring/scoring.service.js';
import { supabase } from '../src/infrastructure/supabase/client.js';

vi.mock('../src/infrastructure/solana/geyser.service.js', () => ({
  GeyserService: class {
    on = vi.fn();
    start = vi.fn().mockResolvedValue(undefined);
    removeAllListeners = vi.fn();
    emit = vi.fn();
  },
}));

vi.mock('../src/infrastructure/supabase/realtime.service.js', () => ({
  RealtimeService: class {
    broadcastVipAlpha = vi.fn();
  },
}));

vi.mock('../src/core/scoring/scoring.service.js', () => ({
  ScoringService: class {
    calculateScore = vi.fn();
    shouldSignal = vi.fn().mockImplementation((score: number) => score >= 85);
    shouldDelist = vi.fn().mockImplementation((score: number) => score < 85);
  },
}));

vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('🛡️ IntelligenceEngine Institutional Coverage', () => {
  let engine: IntelligenceEngine;
  let scoringService: ScoringService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default Supabase mock chain
    const mockQueryBuilder = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

    engine = new IntelligenceEngine();
    // @ts-expect-error - Accessing private
    scoringService = engine.scorer;
  });

  describe('Tiered Access and Probability (Lines 164-186)', () => {
    it('should handle ELITE rank access probability (0.5)', () => {
      const mockSignal = { id: 'p', mint: 'm', score: 95, isPremium: true, metadata: {} };
      // @ts-expect-error - Accessing private
      engine.activeSignals.set('m', mockSignal as any);

      const spy = vi.spyOn(Math, 'random');
      spy.mockReturnValue(0.4); // Success (0.4 < 0.5)
      expect(
        engine.getTieredSignals(UserRank.ELITE, false, false, { aiQuotaLimit: 1, aiQuotaUsed: 0 }),
      ).toHaveLength(1);

      spy.mockReturnValue(0.6); // Fail (0.6 > 0.5)
      expect(
        engine.getTieredSignals(UserRank.ELITE, false, false, { aiQuotaLimit: 1, aiQuotaUsed: 0 }),
      ).toHaveLength(0);

      spy.mockRestore();
    });

    it('should bypass quota for VIP (Line 176)', () => {
      const mockSignal = {
        id: 'v',
        mint: 'v',
        score: 95,
        isPremium: true,
        aiReasoning: { narrative: 'VIP_ALPHA' },
      };
      // @ts-expect-error - Accessing private
      engine.activeSignals.set('v', mockSignal as any);

      const signals = engine.getTieredSignals(UserRank.PRO, false, true, {
        aiQuotaLimit: 10,
        aiQuotaUsed: 10,
      });
      expect(signals[0].aiReasoning?.narrative).toBe('VIP_ALPHA');
    });

    it('should hide reasoning if quota exhausted (Line 181)', () => {
      const mockSignal = {
        id: 'p',
        mint: 'm',
        score: 95,
        isPremium: true,
        aiReasoning: { narrative: 'ALPHA' },
      };
      // @ts-expect-error - Accessing private
      engine.activeSignals.set('m', mockSignal as any);

      const signals = engine.getTieredSignals(UserRank.PRO, true, false, {
        aiQuotaLimit: 1,
        aiQuotaUsed: 1,
      });
      expect(signals[0].aiReasoning?.narrative).toContain('[HIDDEN]');
    });
  });

  describe('Engine Pipeline and Error Handling', () => {
    it('should handle Geyser error listener (Line 101)', async () => {
      const loggerSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await engine.start();

      // @ts-expect-error - Accessing private geyser mock
      const errorHandler = engine.geyser.on.mock.calls.find(
        (call: any[]) => call[0] === 'error',
      )[1];
      errorHandler(new Error('Stream crash'));

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Geyser stream error'),
        expect.any(Error),
      );
    });

    it('should log error when Supabase persistence fails or returns null (Line 112)', async () => {
      const loggerSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Test explicit error

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: new Error('Db Fail') }),
      } as any);
      // @ts-expect-error - Accessing private
      await engine.persistToSupabase({ event: { mint: 'm' }, score: 90 } as any);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to persist token'),
        expect.any(Error),
      );

      // Test null response

      vi.mocked(supabase.from).mockReturnValue({ upsert: vi.fn().mockResolvedValue(null) } as any);
      // @ts-expect-error - Accessing private
      await engine.persistToSupabase({ event: { mint: 'm2' }, score: 90 } as any);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to persist token'),
        'No response',
      );
    });

    it('should cover preparation of data with null metadata (Line 126)', () => {
      const mockSignal = { event: { mint: 'm' }, score: 90, isPremium: false } as any;
      // @ts-expect-error - Accessing private
      const data = engine.preparePersistData(mockSignal) as any;
      expect(data.metadata).toBeNull();
    });

    it('should log error when Auto-Down Supabase update fails or returns null (Line 147)', async () => {
      vi.useFakeTimers();
      const loggerSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Setup signal to be delisted
      // @ts-expect-error - Accessing private
      engine.activeSignals.set('m', { mint: 'm', score: 90, event: { mint: 'm' } } as any);

      vi.mocked(scoringService.calculateScore).mockReturnValue({
        score: 80,
        reasoning: [],
        isPremium: false,
      });

      // Mock failure

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: new Error('Update Fail') }),
      } as any);

      await engine.start();
      await vi.advanceTimersByTimeAsync(11000);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to Auto-Down'),
        expect.any(Error),
      );

      engine.stop();
      vi.useRealTimers();
    });

    it('should handle getTieredSignals crash (Line 188)', () => {
      const loggerSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // @ts-expect-error - Mocking crash

      const valuesSpy = vi.spyOn(engine.activeSignals, 'values').mockImplementationOnce(() => {
        throw new Error('Iteration Failure');
      });

      const signals = engine.getTieredSignals(UserRank.PRO, false, false, {
        aiQuotaLimit: 0,
        aiQuotaUsed: 0,
      });
      expect(signals).toEqual([]);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ENGINE] Failed'),
        expect.any(Error),
      );
      valuesSpy.mockRestore();
    });
  });
});
