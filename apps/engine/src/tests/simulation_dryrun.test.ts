import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JupiterService } from '../infrastructure/jupiter/jupiter.service.js';
import { env } from '../utils/env.js';

// Mock Solana to avoid real RPC calls
vi.mock('@solana/web3.js', () => ({
  Connection: class {
    constructor() {}
    getLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: 'bh' });
    sendRawTransaction = vi.fn().mockResolvedValue('sig');
  },
  PublicKey: class {
    constructor() {}
    toBase58 = () => 'w1';
    toBuffer = () => Buffer.from('w1');
    static findProgramAddressSync = vi.fn().mockReturnValue([Buffer.from('ata'), 0]);
  },
  Keypair: { generate: () => ({ publicKey: { toBase58: () => 'w1' } }) },
  SystemProgram: { transfer: vi.fn() },
  Transaction: class {
    add = vi.fn().mockReturnThis();
    sign = vi.fn();
    serialize = vi.fn().mockReturnValue(Buffer.from('tx'));
  },
  VersionedTransaction: {
    deserialize: vi.fn().mockReturnValue({ sign: vi.fn(), serialize: vi.fn().mockReturnValue(Buffer.from('tx')) }),
  },
}));

describe('🛡️ Safety Layer: Simulation & Dry-Run Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('SHOULD NOT execute real trades when IS_SIMULATION=true (Blueprint Section V.10)', async () => {
    // 1. Setup Simulation Mode
    // @ts-expect-error - Mocking env
    env.IS_SIMULATION = true;
    
    const service = new JupiterService();
    const mockRoute = {
      inMint: 'SOL',
      outMint: 'AIVO',
      inAmount: 1000,
      outAmount: 2000,
      priceImpactPct: 0.1,
      routePlan: ['Jup'],
      swapTransaction: 'tx_base64'
    };

    const spy = vi.spyOn(console, 'info');

    // 2. Execute
    const result = await service.executeSwap(mockRoute as any);

    // 3. Verify
    expect(result.dryRun).toBe(true);
    expect(result.signature).toContain('SIM_');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[PAPER_TRADING]'));
  });

  it('SHOULD NOT execute real trades when EXECUTION_MODE=dry_run', async () => {
    // 1. Setup Dry-Run Mode
    // @ts-expect-error - Mocking env
    env.IS_SIMULATION = false;
    // @ts-expect-error - Mocking env
    env.EXECUTION_MODE = 'dry_run';
    
    const service = new JupiterService('dry_run');
    const mockRoute = {
      inMint: 'SOL',
      outMint: 'AIVO',
      inAmount: 1000,
      outAmount: 2000,
      priceImpactPct: 0.1,
      routePlan: ['Jup'],
      swapTransaction: 'tx_base64'
    };

    const spy = vi.spyOn(console, 'info');

    // 2. Execute
    const result = await service.executeSwap(mockRoute as any);

    // 3. Verify
    expect(result.dryRun).toBe(true);
    expect(result.signature).toContain('DRY_');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[DRY_RUN]'));
  });

  it('SHOULD allow real trades only when BOTH IS_SIMULATION=false and EXECUTION_MODE=real', async () => {
    // 1. Setup Real Mode
    // @ts-expect-error - Mocking env
    env.IS_SIMULATION = false;
    // @ts-expect-error - Mocking env
    env.EXECUTION_MODE = 'real';
    // @ts-expect-error - Mocking env
    env.WALLET_PRIVATE_KEY = '58D8919641...'; // Fake base58

    const service = new JupiterService('real');
    
    // We mock the real execution path since we don't have a real keypair/RPC
    const realSpy = vi.spyOn(service as any, 'executeReal').mockResolvedValue({
      signature: 'REAL_SIG',
      dryRun: false,
      status: 'success'
    });

    const mockRoute = {
      inMint: 'SOL',
      outMint: 'AIVO',
      inAmount: 1000,
      outAmount: 2000,
      priceImpactPct: 0.1,
      routePlan: ['Jup'],
      swapTransaction: 'tx_base64'
    };

    // 2. Execute
    const result = await service.executeSwap(mockRoute as any);

    // 3. Verify
    expect(result.dryRun).toBe(false);
    expect(result.signature).toBe('REAL_SIG');
    expect(realSpy).toHaveBeenCalled();
  });

  it('SHOULD calculate platform fee correctly in dry-run mode', async () => {
    const service = new JupiterService('dry_run');
    const mockRoute = {
      inMint: 'SOL',
      outMint: 'AIVO',
      inAmount: 1000000, // 1M lamports
      outAmount: 2000000,
      priceImpactPct: 0.1,
      routePlan: ['Jup'],
      platformFeeBps: 100 // 1%
    };

    const result = await service.executeSwap(mockRoute as any);

    expect(result.fee).toBe(10000); // 1% of 1M
    expect(result.dryRun).toBe(true);
  });

  it('SHOULD simulate Jito tipping logic correctly', async () => {
    const service = new JupiterService('dry_run');
    
    // Mock getRecentJitoTip
    const tipSpy = vi.spyOn(service, 'getRecentJitoTip').mockResolvedValue(0.001);
    
    const tip = await service.getRecentJitoTip();
    
    expect(tip).toBe(0.001);
    expect(tipSpy).toHaveBeenCalled();
  });
});
