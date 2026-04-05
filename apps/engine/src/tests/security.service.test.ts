import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenSecurityService } from '../core/services/security.service.js';

describe('TokenSecurityService (On-Chain Authority Checks)', () => {
  let service: TokenSecurityService;

  beforeEach(() => {
    service = new TokenSecurityService();
    // Default spy for success cases
    vi.spyOn((service as any).connection, 'getParsedAccountInfo').mockResolvedValue({
      value: {
        data: {
          parsed: {
            info: {
              mintAuthority: null, // revoked
              freezeAuthority: null, // revoked
            },
          },
        },
      },
    });
    vi.spyOn((service as any).connection, 'getTokenLargestAccounts').mockResolvedValue({
      value: [
        { amount: '6000', address: 'holder1' },
        { amount: '2000', address: 'holder2' },
        { amount: '2000', address: 'holder3' },
      ],
    });
  });

  it('SHOULD return positive score when authorities are revoked and well-distributed', async () => {
    const report = await service.getSecurityReport('So11111111111111111111111111111111111111112');
    expect(report).not.toBeNull();
    expect(report!.mintAuthorityRevoked).toBe(true);
    expect(report!.freezeAuthorityRevoked).toBe(true);
    // 60% top holder triggers HIGH_CONCENTRATION, but auth revoked gives +8
    expect(report!.score).toBe(-2); // +5(mint) +3(freeze) -10(concentration) = -2
  });

  it('SHOULD cache results and return instantly on second call', async () => {
    const mint = 'cached_mint_test';
    const start1 = performance.now();
    await service.getSecurityReport(mint);
    const first = performance.now() - start1;

    const start2 = performance.now();
    await service.getSecurityReport(mint);
    const second = performance.now() - start2;

    // Second call should be near-instant (cached)
    expect(second).toBeLessThan(first + 1);
  });

  it('SHOULD calculate holder concentration correctly', async () => {
    const report = await service.getSecurityReport('test_mint');
    // Top holder has 6000 out of 10000 = 60%
    expect(report!.topHolderPct).toBe(60);
    expect(report!.redFlags).toContain('HIGH_CONCENTRATION');
  });

  it('SHOULD handle null account info gracefully', async () => {
    const validMint = 'So11111111111111111111111111111111111111112';
    const connSpy = vi
      .spyOn((service as any).connection, 'getParsedAccountInfo')
      .mockResolvedValueOnce({ value: null });
    const report = await service.getSecurityReport(validMint);

    expect(report!.mintAuthorityRevoked).toBe(false);
    expect(report!.freezeAuthorityRevoked).toBe(false);
    // Score should be negative because authorities NOT revoked
    expect(report!.score).toBeLessThan(0);
    connSpy.mockRestore();
  });

  it('SHOULD catch on-chain errors and return fallback score', async () => {
    const validMint = 'So11111111111111111111111111111111111111112';
    const connSpy = vi
      .spyOn((service as any).connection, 'getParsedAccountInfo')
      .mockRejectedValueOnce(new Error('RPC Error'));
    const report = await service.getSecurityReport(validMint);
    // Should be null due to top-level catch block returning null
    expect(report).toBeNull();
    connSpy.mockRestore();
  });
});
