import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JupiterService } from '../src/infrastructure/jupiter/jupiter.service.js';

describe('🛡️ JupiterService Institutional Coverage', () => {
  let service: JupiterService;

  beforeEach(() => {
    service = new JupiterService();
    vi.stubGlobal('fetch', vi.fn());
    vi.clearAllMocks();
  });

  it('should fetch best route from Jupiter V6 Quote API', async () => {
    const mockQuoteResponse = {
      inAmount: '100000000',
      outAmount: '500000',
      priceImpactPct: 0.1,
      routePlan: [{ swapInfo: { label: 'Raydium' } }],
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockQuoteResponse),
    });

    const route = await service.getBestRoute('input', 'output', 100000000, 200);

    expect(route.inAmount).toBe(100000000);
    expect(route.outAmount).toBe(500000);
    expect(route.routePlan).toEqual(['Raydium']);
  });

  it('should throw error if Jupiter Quote API fails', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      statusText: 'Forbidden',
    });

    await expect(service.getBestRoute('i', 'o', 100, 50)).rejects.toThrow(
      'Jupiter quote failed: Forbidden',
    );
  });

  it('should execute swap and returns Jito bundle signature', async () => {
    const mockRoute = {
      inMint: 'i',
      outMint: 'o',
      inAmount: 1000,
      outAmount: 500,
      priceImpactPct: 0.05,
      routePlan: ['Meteora'],
      platformFeeBps: 100,
    };

    const result = await service.executeSwap(mockRoute, 'wallet_address_123');

    expect(result.signature).toBeDefined();
    expect(result.jitoBundle).toBe(true);
    expect(result.fee).toBe(10); // 1000 * (100 / 10000)
  });

  it('should handle executeSwap with undefined platformFeeBps (Branch Coverage)', async () => {
    const mockRoute = {
      inMint: 'i',
      outMint: 'o',
      inAmount: 1000,
      outAmount: 500,
      priceImpactPct: 0.05,
      routePlan: ['Meteora'],
      platformFeeBps: undefined,
    };

    const result = await service.executeSwap(mockRoute, 'wallet_address_123');
    expect(result.fee).toBe(0);
  });

  it('should convert fee percentage to basis points', () => {
    expect(JupiterService.feeToBps(0.02)).toBe(200);
    expect(JupiterService.feeToBps(0.0075)).toBe(75);
  });
});
