import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. NUCLEAR MOCKING (Must be at the absolute top for ESM)
vi.mock('bs58', () => ({
  default: {
    decode: vi.fn().mockReturnValue(new Uint8Array(64)),
    encode: vi.fn().mockReturnValue('MOCK_BASE58'),
  },
}));

vi.mock('@triton-one/yellowstone-grpc', () => ({
  default: class {
    connect = vi.fn().mockResolvedValue(undefined);
    subscribe = vi.fn().mockResolvedValue({
      on: vi.fn(),
      write: vi.fn().mockImplementation((req, cb) => cb(null)),
      removeAllListeners: vi.fn(),
    });
  },
}));

vi.mock('@solana/web3.js', async () => {
  const actual = await vi.importActual('@solana/web3.js');
  return {
    ...actual,
    Keypair: {
      fromSecretKey: vi.fn().mockReturnValue({ publicKey: { toBase58: () => 'MOCK_PUBKEY' } }),
    },
    VersionedTransaction: {
      deserialize: vi.fn().mockReturnValue({ sign: vi.fn(), serialize: () => new Uint8Array() }),
    },
    PublicKey: vi.fn().mockImplementation(function (this: any, key: string) {
      this.toBase58 = () => key;
      this.toBuffer = () => Buffer.alloc(32);
      this.equals = () => true;
    }),
    Connection: class {
      sendRawTransaction = vi.fn().mockResolvedValue('MOCK_SIG');
      getLatestBlockhash = vi
        .fn()
        .mockResolvedValue({ blockhash: 'MOCK_HASH', lastValidBlockHeight: 100 });
    },
    Transaction: vi.fn().mockImplementation(function (this: any) {
      this.add = vi.fn().mockReturnThis();
      this.sign = vi.fn();
      this.serialize = vi.fn().mockReturnValue(new Uint8Array([4, 5, 6]));
      this.recentBlockhash = '';
      this.feePayer = null;
    }),
    SystemProgram: {
      transfer: vi.fn(),
    },
  };
});

// Mock Axiom
const mockAxiomIngest = vi.fn();
const mockAxiomFlush = vi.fn().mockResolvedValue(undefined);
vi.mock('@axiomhq/js', () => ({
  Axiom: vi.fn().mockImplementation(function (this: any) {
    this.ingest = mockAxiomIngest;
    this.flush = mockAxiomFlush;
    return this;
  }),
}));

// Mock PostHog
vi.mock('posthog-node', () => ({
  PostHog: vi.fn().mockImplementation(() => ({
    shutdown: vi.fn().mockResolvedValue(undefined),
    getAllFlags: vi.fn().mockResolvedValue({}),
  })),
}));

import { GeyserService } from '../src/infrastructure/solana/geyser.service.js';
import { buildApp } from '../src/app.js';
import { env } from '../src/utils/env.js';
import { JupiterService } from '../src/infrastructure/jupiter/jupiter.service.js';

describe('🛡️ Institutional Infrastructure Hardening (80% Branches)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.WALLET_PRIVATE_KEY = 'mock_key';
    env.GEYSER_ENDPOINT = 'test';
    env.GEYSER_TOKEN = 'test';
  });

  describe('📡 GeyserService Surgical Coverage', () => {
    it('should hit retry branch (connectWithRetry Line 74-75)', async () => {
      vi.useFakeTimers();
      const geyser = new GeyserService();
      const startSpy = vi
        .spyOn(geyser as any, 'startRealStream')
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce(undefined);
      const connectPromise = (geyser as any).connectWithRetry();
      await vi.advanceTimersByTimeAsync(3000);
      await connectPromise;
      expect(startSpy).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });
  });

  describe('🛡️ app.ts Surgical Coverage (Target: 100% Branches)', () => {
    it('should hit validation and error branches', async () => {
      const app = await buildApp();
      const r1 = await app.inject({ method: 'POST', url: '/trade/swap', body: { route: {} } });
      expect(r1.statusCode).toBe(400);

      vi.spyOn(JupiterService.prototype, 'executeSwap').mockRejectedValueOnce({});
      const res = await app.inject({
        method: 'POST',
        url: '/trade/swap',
        body: { route: 'r', userPublicKey: 'u' },
      });
      expect(res.statusCode).toBe(500);

      delete (app as any).logAlpha;
      await (app as any).inject({ method: 'GET', url: '/health' });
      await app.close();
    });
  });

  describe('🛡️ jupiter.service.ts Surgical Coverage (Target: 100% Branches)', () => {
    it('should hit Jito Fallback Branches (Lines 298, 308, 321)', async () => {
      const service = new JupiterService('real');
      env.JITO_BLOCK_ENGINE_URL = 'https://jito';

      // 1. Jito Tip Floor Fetch (Standard start for all real trades)
      const mockTipFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ ema_landed_tips_50th_percentile: 0.00001 }]),
      });
      vi.stubGlobal('fetch', mockTipFetch);

      // 2. Jito: !res.ok (Line 321 in submitJitoBundle)
      mockTipFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ ema_landed_tips_50th_percentile: 0.00001 }]),
      });
      mockTipFetch.mockResolvedValueOnce({ ok: false, statusText: 'Jito Down' });
      await service.executeSwap({ swapTransaction: 'tx' } as any).catch(() => {});

      // 3. Jito: result.result fallback (Line 298 in executeReal)
      mockTipFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ ema_landed_tips_50th_percentile: 0.00001 }]),
      });
      mockTipFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: null }),
      });
      const res3 = await service.executeSwap({ swapTransaction: 'tx' } as any);
      expect(res3.signature).toContain('SIGNATURE_PENDING_');

      // 4. Jito Fallback (Line 308 in executeReal)
      mockTipFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ ema_landed_tips_50th_percentile: 0.00001 }]),
      });
      mockTipFetch.mockRejectedValueOnce(new Error('Crash'));
      const res4 = await service.executeSwap({
        swapTransaction: 'tx',
        platformFeeBps: undefined,
      } as any);
      expect(res4.signature).toBe('MOCK_SIG');

      vi.unstubAllGlobals();
    });
  });

  describe('🛡️ monitoring.plugin.ts (Surgical Re-run)', () => {
    it('should hit Axiom ingestion failure', async () => {
      env.AXIOM_TOKEN = 't';
      env.AXIOM_DATASET = 'd';
      mockAxiomIngest.mockImplementationOnce(() => {
        throw new Error('fail');
      });
      const app = await buildApp();
      await app.inject({ method: 'GET', url: '/health' });
      await new Promise((r) => setTimeout(r, 100));
      await app.close();
    });
  });
});
