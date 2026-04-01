import { describe, it, expect, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { JupiterService } from '../src/infrastructure/jupiter/jupiter.service.js';
import { env } from '../src/utils/env.js';

// Minimal Mocks for Surgical Infiltration
vi.mock('@triton-one/yellowstone-grpc', () => ({
  default: class {
    connect = vi.fn();
    subscribe = vi.fn().mockResolvedValue({ on: vi.fn(), write: vi.fn() });
  },
}));
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { rank: 'PRO' } }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  }),
}));
vi.mock('@sentry/node', () => ({ init: vi.fn(), captureException: vi.fn() }));
vi.mock('@solana/web3.js', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    Keypair: {
      ...actual.Keypair,
      fromSecretKey: vi.fn().mockReturnValue({
        publicKey: { toBase58: () => 'mock_pub' },
        secretKey: new Uint8Array(64),
      }),
    },
    VersionedTransaction: {
      ...actual.VersionedTransaction,
      deserialize: vi.fn().mockReturnValue({
        sign: vi.fn(),
        serialize: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
      }),
    },
    PublicKey: vi.fn().mockImplementation(function (this: any, key: string) {
      this.toBase58 = () => key;
      this.toBuffer = () => Buffer.alloc(32);
      this.equals = () => true;
    }),
    Transaction: vi.fn().mockImplementation(function (this: any) {
      this.add = vi.fn().mockReturnThis();
      this.sign = vi.fn();
      this.serialize = vi.fn().mockReturnValue(new Uint8Array([4, 5, 6]));
      this.recentBlockhash = '';
      this.feePayer = null;
    }),
  };
});

describe('☢️ Final Branch Infiltration (Target: 80% Absolute)', () => {
  describe('🛡️ app.ts Surgical Coverage (Line 36-38, 98, 111)', () => {
    it('should hit branch 36-38 (logAlpha hook logic)', async () => {
      const app = await buildApp();
      // Case 1: logAlpha undefined (Branch 36 fail)
      const engine = (app as any).engine;
      await engine.hooks.logAudit({ type: 'TEST' });

      // Case 2: logAlpha defined (Branch 37 success)
      const auditSpy = vi.fn();
      (app as any).logAlpha = auditSpy;
      await engine.hooks.logAudit({ type: 'TEST' });

      // Give time for async hook
      await new Promise((r) => setTimeout(r, 20));
      expect(auditSpy).toHaveBeenCalled();
      await app.close();
    });

    it('should hit branch 98 (Missing param permutations)', async () => {
      const app = await buildApp();
      const TRADE_SWAP_URL = '/trade/swap';

      // Missing route
      const res1 = await app.inject({
        method: 'POST',
        url: TRADE_SWAP_URL,
        body: { userPublicKey: 'u' },
      });
      expect(res1.statusCode).toBe(400);

      // Missing userPublicKey
      const res2 = await app.inject({ method: 'POST', url: TRADE_SWAP_URL, body: { route: 'r' } });
      expect(res2.statusCode).toBe(400);

      await app.close();
    });

    it('should hit branch 111 (Server error handler fallback)', async () => {
      const app = await buildApp();
      // Mock executeSwap to throw WITHOUT message
      vi.spyOn(JupiterService.prototype, 'executeSwap').mockRejectedValueOnce({});

      const res = await app.inject({
        method: 'POST',
        url: '/trade/swap',
        body: { route: 'r', userPublicKey: 'u' },
      });
      expect(res.statusCode).toBe(500);
      expect(res.json().error).toBe('Execution failed');
      await app.close();
    });
  });

  describe('🛡️ jupiter.service.ts Surgical Coverage (Line 251, 255, 298)', () => {
    it('should hit branch 251 (Missing WALLET_PRIVATE_KEY in real mode)', async () => {
      const service = new JupiterService('real');
      env.WALLET_PRIVATE_KEY = undefined;
      await expect(service.executeSwap({ swapTransaction: 'tx' } as any)).rejects.toThrow(
        'WALLET_PRIVATE_KEY missing',
      );
      env.WALLET_PRIVATE_KEY = '58J123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijk';
    });

    it('should hit branch 255 (Missing swapTransaction in real mode)', async () => {
      const service = new JupiterService('real');
      await expect(service.executeSwap({ swapTransaction: undefined } as any)).rejects.toThrow(
        'Swap transaction missing',
      );
    });

    it('should hit branch 298 (Success path with default signature)', async () => {
      const service = new JupiterService('real');

      // Mock Jito Tip Floor Fetch
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ ema_landed_tips_50th_percentile: 0.00001 }]),
        }),
      );

      // Mock Jito response without result property
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ something_else: 'no_result' }),
      });

      // Mock getLatestBlockhash
      // @ts-expect-error - Accessing private
      service.connection.getLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: 'hash' });

      const result = await service.executeSwap({ swapTransaction: 'AQID', inAmount: 1 } as any);
      expect(result.signature).toContain('SIGNATURE_PENDING_');
      vi.unstubAllGlobals();
    });
  });
});
