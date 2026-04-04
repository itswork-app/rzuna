import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SolanaAdapter } from '../infrastructure/adapters/solana.adapter.js';
import { PumpPortalAdapter } from '../infrastructure/adapters/pumpportal.adapter.js';
import { PumpapiAdapter } from '../infrastructure/adapters/pumpapi.adapter.js';

// 🏛️ Mocking Solana Web3 and gRPC
vi.mock('@solana/web3.js', () => ({
  Connection: class {
    onLogs = vi.fn().mockReturnValue(123);
    removeOnLogsListener = vi.fn().mockResolvedValue(true);
    getParsedTransaction = vi.fn().mockResolvedValue({
      meta: { err: null },
      transaction: { message: { accountKeys: [{ pubkey: { toBase58: () => 'mint_123' } }] } },
    });
  },
  PublicKey: class {
    constructor(public val: string) {}
    toBase58() {
      return this.val;
    }
  },
}));

vi.mock('@triton-one/yellowstone-grpc', () => ({
  default: class {
    subscribe = vi.fn().mockResolvedValue({
      on: vi.fn(),
      write: vi.fn((req, cb) => cb(null)),
    });
  },
}));

describe('Engine Infrastructure (The Sensors)', () => {
  it('SolanaAdapter: should start with RPC fallback if gRPC fails or is missing', async () => {
    const adapter = new SolanaAdapter();
    await adapter.start();
    expect(adapter.status.isFallbackActive).toBe(true);
    await adapter.stop();
  });

  it('PumpPortalAdapter: should be defined and have start method', () => {
    const adapter = new PumpPortalAdapter();
    expect(adapter.start).toBeDefined();
  });

  it('PumpapiAdapter: should fetch token metadata', async () => {
    const adapter = new PumpapiAdapter();
    // Simulate fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ symbol: 'RZUNA' }),
    } as any);

    const meta = await adapter.getTokenMetadata('mint_123');
    expect(meta?.symbol).toBe('RZUNA');
  });
});
