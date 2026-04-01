import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';
import { FastifyInstance } from 'fastify';

vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

vi.mock('../src/core/tiers/tier.service.js', () => ({
  TierService: class {
    getUserProfile = vi.fn().mockResolvedValue({ id: '123', rank: 'PRO', status: 'NONE' });
    getTradingFeePercentage = vi.fn().mockReturnValue(0.015);
    addVolume = vi.fn().mockResolvedValue('PRO');
  },
}));

vi.mock('../src/infrastructure/jupiter/jupiter.service.js', () => ({
  JupiterService: class {
    autoConvertFeeToSOL = vi.fn().mockResolvedValue({ status: 'success' });
    getBestRoute = vi.fn().mockResolvedValue({});
    executeSwap = vi.fn().mockResolvedValue({ status: 'success' });
  },
}));

describe('🛡️ FeePlugin Coverage Hardening', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  describe('POST /trade branches', () => {
    it('should cover status === "success" branch (Line 97)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/trade',
        payload: {
          walletAddress: '0x123',
          amountUSD: 100,
          platform: 'RAYDIUM',
          signature: 'SIG_OK',
          status: 'success',
          tokenMint: 'MINT',
          feeAmountLamports: 1000,
        },
      });
      expect(response.statusCode).toBe(200);
    });

    it('should cover status === "failed" branch (Line 112)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/trade',
        payload: {
          walletAddress: '0x123',
          amountUSD: 100,
          platform: 'RAYDIUM',
          signature: 'SIG_FAIL',
          status: 'failed',
        },
      });
      expect(response.statusCode).toBe(200);
    });
  });

  describe('getLiveSOLPrice fallback', () => {
    it('should cover fetch failure fallback (Line 35)', async () => {
      // Mock global fetch to fail
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network Fail'));

      const response = await app.inject({
        method: 'POST',
        url: '/trade',
        payload: {
          walletAddress: '0x123',
          amountUSD: 100,
          platform: 'RAYDIUM',
          signature: 'SIG_OK',
        },
      });

      expect(response.statusCode).toBe(200);
      global.fetch = originalFetch;
    });
  });
});
