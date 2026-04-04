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
    PublicKey: class {
      constructor(public key: string) {}
      toBase58 = () => this.key;
      toBuffer = () => Buffer.alloc(32);
      equals = () => true;
      static readonly findProgramAddressSync = vi.fn().mockReturnValue([Buffer.from('pda'), 255]);
    },
    Transaction: class {
      add = vi.fn().mockReturnThis();
      sign = vi.fn();
      serialize = vi.fn().mockReturnValue(new Uint8Array([4, 5, 6]));
      recentBlockhash = '';
      feePayer = null;
    },
    Connection: class {
      getSignatureStatus = vi.fn().mockResolvedValue({ value: { err: null } });
      getParsedTransaction = vi.fn().mockResolvedValue({
        meta: { err: null, postTokenBalances: [] },
        transaction: {
          message: { accountKeys: [{ pubkey: { toBase58: () => 'mock_pub' } }], instructions: [] },
        },
      });
      onLogs = vi.fn().mockReturnValue(1);
      removeOnLogsListener = vi.fn();
      getLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: 'hash' });
      sendRawTransaction = vi.fn().mockResolvedValue('sig');
    },
    SystemProgram: {
      transfer: vi.fn(),
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

    // Mock Jito Tip Floor Fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ ema_landed_tips_50th_percentile: 0.00001 }]),
    });

    // Mock Jito 403 Forbidden
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Forbidden',
    });

    // Mock connection.getLatestBlockhash
    // @ts-expect-error - Accessing private
    realService.connection.getLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: 'hash' });

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

    // Mock Jito Tip Floor Fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ ema_landed_tips_50th_percentile: 0.00001 }]),
    });

    // Mock fetch to crash
    (global.fetch as any).mockRejectedValueOnce(new Error('Network Crash'));

    // Mock connection.getLatestBlockhash
    // @ts-expect-error - Accessing private
    realService.connection.getLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: 'hash' });

    // @ts-expect-error - Accessing private
    realService.connection.sendRawTransaction = vi.fn().mockResolvedValue('crash_fallback_sig');

    const result = await realService.executeSwap(mockRoute);
    expect(result.signature).toBe('crash_fallback_sig');
    expect(result.jitoBundle).toBe(false);
  });

  it('should hit autoConvertFeeToSOL success path', async () => {
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    // 1. Skip if already SOL
    const result1 = await service.autoConvertFeeToSOL(SOL_MINT, 500);
    expect(result1.status).toBe('success');
    expect(result1.signature).toBe('SKIPPED');

    // 2. Full success flow
    const spyRoute = vi.spyOn(service, 'getBestRoute').mockResolvedValue({
      inAmount: 1000,
      outAmount: 5,
      swapTransaction: 'tx',
    } as any);
    const spyExecute = vi.spyOn(service, 'executeSwap').mockResolvedValue({
      status: 'success',
      signature: 'sig_convert',
    } as any);

    const result2 = await service.autoConvertFeeToSOL('mint', 2000);
    expect(result2.status).toBe('success');
    expect(result2.signature).toBe('sig_convert');

    spyRoute.mockRestore();
    spyExecute.mockRestore();
  });

  it('should successfully submit a Jito Bundle (Line 180+)', async () => {
    const realService = new JupiterService('real');
    const mockRoute = {
      inAmount: 1,
      outAmount: 1,
      swapTransaction: 'AQID',
    };

    // Jito Tip Floor
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ ema_landed_tips_50th_percentile: 0.00001 }]),
    });

    // Jito Bundle SUCCESS (200 OK)
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ result: 'bundle_uuid' }),
    });

    // Mock blockhash
    // @ts-expect-error - Internal
    realService.connection.getLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: 'bh' });

    const result = await realService.executeSwap(mockRoute as any);
    expect(result.jitoBundle).toBe(true);
    expect(result.status).toBe('success');
  });
});
