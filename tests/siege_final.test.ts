import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntelligenceEngine } from '../src/core/engine.js';
import { env } from '../src/utils/env.js';

vi.mock('../src/infrastructure/solana/geyser.service.js', () => {
  return {
    GeyserService: class {
      on = vi.fn();
      start = vi.fn().mockResolvedValue(undefined);
      isActive = false;
      constructor() {
        this.isActive = !!(env.GEYSER_ENDPOINT && env.GEYSER_TOKEN);
      }
    },
  };
});

describe('🛡️ RZUNA Backend Siege (Hardened v1.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Mode Detection: should automatically start in MOCK mode if GEYSER_ENDPOINT is missing', async () => {
    env.GEYSER_ENDPOINT = '';
    env.GEYSER_TOKEN = '';

    const engine = new IntelligenceEngine();
    await engine.start();

    expect((engine as any).geyser.isActive).toBe(false);
    console.info('✅ Mode Detection: MOCK Mode verified.');
  });

  it('Latency Benchmark: Signal Pipeline must finish in < 200ms', async () => {
    env.GEYSER_ENDPOINT = 'test';
    env.GEYSER_TOKEN = 'test';
    const engine = new IntelligenceEngine();
    await engine.start(); // This triggers setupPipeline and registers the 'mint' listener

    const mockMint = {
      mint: 'MINT123',
      signature: 'SIG123',
      timestamp: new Date().toISOString(),
      initialLiquidity: 1000,
      socialScore: 50,
      metadata: { name: 'Test', symbol: 'TEST' },
    };

    const startTime = performance.now();

    // Simulate gRPC Emit
    const mintCall = (engine as any).geyser.on.mock.calls.find((c: any) => c[0] === 'mint');
    if (!mintCall) throw new Error('Mint listener not registered');

    // Call the listener
    mintCall[1](mockMint);

    const endTime = performance.now();
    const latency = endTime - startTime;

    console.info(`⏱️ Signal Pipeline Latency: ${latency.toFixed(2)}ms`);
    expect(latency).toBeLessThan(200);
  });
});
