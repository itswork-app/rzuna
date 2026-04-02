/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntelligenceEngine } from '../src/core/engine.js';

vi.mock('../src/infrastructure/solana/geyser.service.js', () => ({
  GeyserService: class {
    private mode: string;
    constructor(mode = 'public') {
      this.mode = mode;
    }
    on = vi.fn();
    start = vi.fn().mockResolvedValue(undefined);
    removeAllListeners = vi.fn();
  },
}));

vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockResolvedValue({ error: null }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

vi.mock('prom-client', () => ({
  Counter: vi.fn().mockImplementation(() => ({ inc: vi.fn() })),
  Histogram: vi.fn().mockImplementation(() => ({ observe: vi.fn() })),
  Gauge: vi.fn().mockImplementation(() => ({ set: vi.fn() })),
  Registry: vi.fn().mockImplementation(() => ({ registerMetric: vi.fn() })),
}));

describe('🛡️ PR 10 Coverage Hardening (Branch Infiltration)', () => {
  let engine: IntelligenceEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new IntelligenceEngine();
  });

  describe('IntelligenceEngine.ensureVipGeyser()', () => {
    it('should initialize a new GeyserService in vip mode if none exists', async () => {
      await engine.ensureVipGeyser();

      // @ts-expect-error - testing private member
      expect(engine.vipGeyser).toBeDefined();

      // @ts-expect-error - testing private member
      expect(vi.mocked(engine.vipGeyser!.start)).toHaveBeenCalled();
    });

    it('should return immediately if vipGeyser already exists (Branch Coverage)', async () => {
      await engine.ensureVipGeyser();
      // @ts-expect-error - testing private member
      const firstInstance = engine.vipGeyser;

      await engine.ensureVipGeyser();
      // @ts-expect-error - testing private member
      expect(engine.vipGeyser).toBe(firstInstance);
    });
  });

  describe('IntelligenceEngine.processMintEvent()', () => {
    it('should process a mint event and emit signal if score >= 85', async () => {
      const signalSpy = vi.fn();
      engine.on('signal', signalSpy);

      const mockEvent = {
        mint: 'MINT123',
        signature: 'SIG123',
        timestamp: new Date().toISOString(),
        metadata: { symbol: 'TEST' },
      };

      // @ts-expect-error - testing private member
      vi.spyOn(engine.scorer, 'calculateScore').mockReturnValue({
        score: 95,
        reasoning: ['Bullish Narrative'],
      } as any);

      // @ts-expect-error - testing private member
      await engine.processMintEvent(mockEvent, 'public');

      expect(signalSpy).toHaveBeenCalled();
      // @ts-expect-error - testing private member
      expect(engine.activeSignals.has('MINT123')).toBe(true);
    });

    it('should NOT emit signal if score < 85 (Branch Coverage)', async () => {
      const signalSpy = vi.fn();
      engine.on('signal', signalSpy);

      const mockEvent = {
        mint: 'MINT_LOW',
        signature: 'SIG456',
        timestamp: new Date().toISOString(),
      };

      // @ts-expect-error - testing private member
      vi.spyOn(engine.scorer, 'calculateScore').mockReturnValue({
        score: 50,
        reasoning: ['Bearish'],
      } as any);

      // @ts-expect-error - testing private member
      await engine.processMintEvent(mockEvent, 'public');

      expect(signalSpy).not.toHaveBeenCalled();
    });
  });
});
