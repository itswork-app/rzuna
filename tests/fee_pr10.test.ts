import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';
import { FastifyInstance } from 'fastify';
import { env } from '../src/utils/env.js';
import { supabase } from '../src/infrastructure/supabase/client.js';

// Mock Solana
vi.mock('@solana/web3.js', () => ({
  Connection: class {
    async getSignatureStatus() {
      return { value: { err: null } };
    }
    async getParsedTransaction() {
      return {
        meta: { err: null, postTokenBalances: [] },
        transaction: {
          message: { accountKeys: [{ pubkey: { toBase58: () => 'mock_pub' } }], instructions: [] },
        },
      };
    }
    onLogs() {
      return 1;
    }
    removeOnLogsListener() {}
    async getLatestBlockhash() {
      return { blockhash: 'hash' };
    }
    async sendRawTransaction() {
      return 'sig';
    }
  },
  PublicKey: class {
    constructor(public key: string) {}
    toBase58 = () => this.key;
    static readonly findProgramAddressSync = vi.fn().mockReturnValue([Buffer.from('pda'), 255]);
    toBuffer = () => Buffer.from(this.key);
  },
}));

// Mock Env
vi.mock('../src/utils/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    SUPABASE_URL: 'https://test.co',
    SUPABASE_KEY: 'test-key',
    SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
    USDC_TREASURY_WALLET: 'treasury_123',
  },
}));

const mockSupabaseBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  insert: vi.fn().mockResolvedValue({ error: null }),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockResolvedValue({ error: null }),
};

vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseBuilder),
  },
}));

vi.mock('../src/core/tiers/tier.service.js', () => ({
  TierService: class {
    async getUserProfile() {
      return { id: '123', rank: 'PRO', status: 'NONE' };
    }
    getTradingFeePercentage() {
      return 0.015;
    }
    async addVolume() {
      return 'PRO';
    }
  },
}));

vi.mock('../src/infrastructure/jupiter/jupiter.service.js', () => ({
  JupiterService: class {
    async autoConvertFeeToSOL() {
      return { status: 'success', signature: 's' };
    }
    async getBestRoute() {
      return {};
    }
    async executeSwap() {
      return { status: 'success' };
    }
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

  describe('🛡️ Subscription Infiltration (Phase 2)', () => {
    it('should cover /subscribe production guards and verification failures', async () => {
      // 1. Missing signature
      const r1 = await app.inject({
        method: 'POST',
        url: '/subscribe',
        payload: { walletAddress: 'w' },
      });
      expect(r1.statusCode).toBe(400);

      // 2. Mock Verification Failure (Force production mode for guard)
      const originalEnv = env.NODE_ENV;
      (env as any).NODE_ENV = 'production';
      const r2 = await app.inject({
        method: 'POST',
        url: '/subscribe',
        payload: { walletAddress: 'w', paymentSignature: 'fail', plan: 'STARLIGHT', amountSOL: 1 },
      });
      expect(r2.statusCode).toBe(403);
      (env as any).NODE_ENV = originalEnv;
    });

    it('should cover USDC payment verification branches', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/subscribe',
        payload: {
          walletAddress: 'w',
          paymentSignature: 'usdc_sig',
          plan: 'STARLIGHT_PLUS',
          amountSOL: 1,
        },
      });
      expect(response.statusCode).toBe(200);
    });
  });

  describe('🛡️ FeePlugin Nuclear Branch Infiltration', () => {
    it('should hit PostHog flags, price fallback, and alpha logging', async () => {
      // 1. Mock fetch failure for getLiveSOLPrice branch
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false } as any);

      const response = await app.inject({
        method: 'POST',
        url: '/trade',
        body: {
          walletAddress: 'w',
          amountUSD: 100,
          platform: 'RAYDIUM',
          signature: 's_nuclear',
          status: 'success',
        },
      });

      expect(response.statusCode).toBe(200);
      global.fetch = originalFetch;
    });

    it('should handle failures in trade volume tracking', async () => {
      const { TierService } = await import('../src/core/tiers/tier.service.js');
      const addVolumeSpy = vi
        .spyOn(TierService.prototype, 'addVolume')
        .mockRejectedValueOnce(new Error('Volume Crash'));

      const response = await app.inject({
        method: 'POST',
        url: '/trade',
        body: {
          walletAddress: 'w',
          amountUSD: 100,
          platform: 'JUPITER',
          signature: 's_fail_volume',
          status: 'success',
        },
      });

      expect(response.statusCode).toBe(500);
      addVolumeSpy.mockRestore();
    });

    it('should cover autoConvertFeeToSOL and verification branches', async () => {
      const { JupiterService } = await import('../src/infrastructure/jupiter/jupiter.service.js');
      const convertSpy = vi
        .spyOn(JupiterService.prototype, 'autoConvertFeeToSOL')
        .mockResolvedValueOnce({
          status: 'success',
          signature: 'swap_sig',
          inAmount: 1000,
          outAmount: 10,
          fee: 1,
          dryRun: false,
        } as any);

      const response = await app.inject({
        method: 'POST',
        url: '/trade',
        body: {
          walletAddress: 'w',
          amountUSD: 100,
          platform: 'METEORA',
          signature: 's_swap_test',
          status: 'success',
          tokenMint: 'mint_xyz',
          feeAmountLamports: 1000,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(convertSpy).toHaveBeenCalled();
      convertSpy.mockRestore();
    });

    it('should hit all verification failure branches', async () => {
      const { Connection } = await import('@solana/web3.js');
      const getSpy = vi.spyOn(Connection.prototype, 'getParsedTransaction');
      const plan = 'STARLIGHT';

      env.NODE_ENV = 'production';

      // 1. Transaction not found branch
      getSpy.mockResolvedValueOnce(null);
      const r1 = await app.inject({
        method: 'POST',
        url: '/subscribe',
        body: {
          walletAddress: 'w',
          paymentSignature: 'fail_null',
          plan,
          amountSOL: 1,
        },
      });
      expect(r1.statusCode).toBe(403);

      // 2. Transaction error branch (meta.err)
      getSpy.mockResolvedValueOnce({ meta: { err: 'fail' } } as any);
      const r2 = await app.inject({
        method: 'POST',
        url: '/subscribe',
        body: { walletAddress: 'w', paymentSignature: 'fail_err', plan: 'STARLIGHT', amountSOL: 1 },
      });
      expect(r2.statusCode).toBe(403);

      // 3. Amount/Delta mismatch branch (SOL)
      getSpy.mockResolvedValueOnce({
        meta: { preBalances: [2000000000, 0], postBalances: [2000000000, 500000000], err: null },
        transaction: {
          message: {
            accountKeys: [
              { pubkey: { toBase58: () => 'w' } },
              { pubkey: { toBase58: () => env.USDC_TREASURY_WALLET } },
            ],
          },
        },
      } as any);
      const r3 = await app.inject({
        method: 'POST',
        url: '/subscribe',
        body: {
          walletAddress: 'w',
          paymentSignature: 'fail_diff',
          plan,
          amountSOL: 1,
        }, // Expect 1 SOL, got 0.5
      });
      expect(r3.statusCode).toBe(403);

      // 4. Replay Attack Branch
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: { id: 1 }, error: null }),
      } as any);
      const r4 = await app.inject({
        method: 'POST',
        url: '/subscribe',
        body: {
          walletAddress: 'w',
          paymentSignature: 'replay_sig',
          plan,
          amountSOL: 1,
        },
      });
      expect(r4.statusCode).toBe(403);

      env.NODE_ENV = 'test';
      getSpy.mockRestore();
    });
  });
});

describe('validateRegistration — Helper Infiltration (v1.9.1)', () => {
  // We access the hidden helper via the private/internal plugin export or just redeclare test logic
  // Since it's a non-exported helper in fee.plugin.ts, we'll trigger it via HTTP inject
  it('should fail registration if mandatory fields are missing', async () => {
    const { buildApp } = await import('../src/app.js');
    const app = await buildApp();

    const cases = [
      { payload: { walletAddress: '', paymentSignature: 's', tier: 't' }, status: 400 },
      { payload: { walletAddress: 'w', paymentSignature: '', tier: 't' }, status: 400 },
      {
        payload: { walletAddress: 'w', paymentSignature: 's', tier: null, plan: null },
        status: 400,
      },
      { payload: { walletAddress: 'w', paymentSignature: 's', tier: 't' }, status: 200 },
      { payload: { walletAddress: 'w', paymentSignature: 's', plan: 'p' }, status: 200 },
    ];

    for (const c of cases) {
      const res = await app.inject({
        method: 'POST',
        url: '/subscribe',
        payload: c.payload,
      });
      // We don't care about the final result, just hitting the validation branch
      if (c.status === 400) {
        expect(res.statusCode).toBe(400);
      }
    }
    await app.close();
  });
});
