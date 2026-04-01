import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JupiterService } from '../src/infrastructure/jupiter/jupiter.service.js';
import { env } from '../src/utils/env.js';
import { Keypair } from '@solana/web3.js';

console.info(Keypair.name);

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
  };
});

describe('🛡️ JupiterService Institutional Coverage', () => {
  let service: JupiterService;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.clearAllMocks();
    service = new JupiterService('dry_run');
    // Default dummy value
    env.WALLET_PRIVATE_KEY = '58J123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijk';
  });

  it('should fetch best route from Jupiter V6 Quote API', async () => {
    const mockQuoteResponse = {
      inAmount: '100000000',
      outAmount: '500000',
      priceImpactPct: 0.1,
      routePlan: [{ swapInfo: { label: 'Raydium' } }],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockQuoteResponse),
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ swapTransaction: 'tx_base64' }),
    });

    const route = await service.getBestRoute('input', 'output', 100000000, 200, 'user_p');

    expect(route.inAmount).toBe(100000000);
    expect(route.outAmount).toBe(500000);
    expect(route.routePlan).toEqual(['Raydium']);
    expect(route.swapTransaction).toBe('tx_base64');
  });

  it('should throw error if Jupiter Quote API fails', async () => {
    (global.fetch as any).mockResolvedValue({ ok: false, statusText: 'Forbidden' });
    await expect(service.getBestRoute('i', 'o', 100, 50, 'u')).rejects.toThrow(
      'Jupiter quote failed: Forbidden',
    );
  });

  it('should throw error if Jupiter Swap Assembly fails (Branch 96)', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ inAmount: '10' }),
    });
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Build Error',
    });
    await expect(service.getBestRoute('i', 'o', 10, 50, 'u')).rejects.toThrow(
      'Jupiter swap assembly failed: Build Error',
    );
  });

  it('should execute swap in DRY_RUN mode', async () => {
    const mockRoute = {
      inMint: 'i',
      outMint: 'o',
      inAmount: 1000,
      outAmount: 500,
      priceImpactPct: 0.05,
      routePlan: ['Meteora'],
      platformFeeBps: 100,
      swapTransaction: 'tx',
    };
    const result = await service.executeSwap(mockRoute);
    expect(result.dryRun).toBe(true);
    expect(result.fee).toBe(10);
  });

  it('should throw if swap transaction missing from route in REAL mode (Line 153)', async () => {
    const realService = new JupiterService('real');
    const mockRoute = {
      inMint: 'i',
      outMint: 'o',
      inAmount: 1,
      outAmount: 1,
      priceImpactPct: 0,
      routePlan: [],
      swapTransaction: undefined,
    };
    await expect(realService.executeSwap(mockRoute as any)).rejects.toThrow(
      'Swap transaction missing from route.',
    );
  });

  it('should throw if WALLET_PRIVATE_KEY missing in REAL mode (Line 148)', async () => {
    const realService = new JupiterService('real');
    env.WALLET_PRIVATE_KEY = undefined;
    const mockRoute = {
      inMint: 'i',
      outMint: 'o',
      inAmount: 1,
      outAmount: 1,
      priceImpactPct: 0,
      routePlan: [],
      swapTransaction: 'tx',
    };
    await expect(realService.executeSwap(mockRoute as any)).rejects.toThrow(
      'WALLET_PRIVATE_KEY missing in environment.',
    );
  });

  it('should handle Jito failure and fallback to standard RPC in REAL mode (Line 188-216)', async () => {
    const realService = new JupiterService('real');

    const mockRoute = {
      inMint: 'i',
      outMint: 'o',
      inAmount: 1000,
      outAmount: 500,
      priceImpactPct: 0.1,
      routePlan: ['Orca'],
      swapTransaction: 'AQID',
    };

    // Mock Jito 403 Forbidden
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Forbidden',
    });

    // Mock connection.sendRawTransaction for fallback
    // @ts-expect-error - Accessing private
    realService.connection.sendRawTransaction = vi.fn().mockResolvedValue('fallback_sig');

    const result = await realService.executeSwap(mockRoute);
    expect(result.signature).toBe('fallback_sig');
    expect(result.jitoBundle).toBe(false);
  });

  it('should handle Jito crash (catch) and fallback to standard RPC (Line 202)', async () => {
    const realService = new JupiterService('real');

    const mockRoute = {
      inMint: 'i',
      outMint: 'o',
      inAmount: 1,
      outAmount: 1,
      priceImpactPct: 0,
      routePlan: [],
      swapTransaction: 'AQID',
    };

    // Mock fetch to crash
    (global.fetch as any).mockRejectedValueOnce(new Error('Network Crash'));

    // @ts-expect-error - Accessing private
    realService.connection.sendRawTransaction = vi.fn().mockResolvedValue('crash_fallback_sig');

    const result = await realService.executeSwap(mockRoute);
    expect(result.signature).toBe('crash_fallback_sig');
    expect(result.jitoBundle).toBe(false);
  });
});
