import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import { env } from '../src/utils/env.js';
import { JupiterService } from '../src/infrastructure/jupiter/jupiter.service.js';

describe('🛡️ Final Institutional Branch Bridge (v1.9.1)', () => {
  it('should hit app.ts validation branches', async () => {
    const app = await buildApp();

    // 1. /signals missing wallet (Line 127)
    const res1 = await app.inject({ method: 'GET', url: '/signals' });
    expect(res1.statusCode).toBe(400);

    // 2. /trade/swap missing route (Line 171)
    const res2 = await app.inject({
      method: 'POST',
      url: '/trade/swap',
      payload: { userPublicKey: 'w' },
    });
    expect(res2.statusCode).toBe(400);

    // 3. /telegram/test missing chatId (Line 196)
    const res3 = await app.inject({ method: 'POST', url: '/telegram/test', payload: {} });
    expect(res3.statusCode).toBe(400);

    // 4. Custom Allowed Origins (Line 36)
    env.ALLOWED_ORIGINS = 'https://test.co, https://other.co';
    const app2 = await buildApp();
    const res4 = await app2.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: { Origin: 'https://test.co' },
    });
    expect(res4.headers['access-control-allow-origin']).toBe('https://test.co');

    await app.close();
    await app2.close();
  });

  it('should hit JupiterService branch defaults', () => {
    // 5. platformFeeBps nullish coalescing (Line 249)
    const route1 = { inAmount: 100, outAmount: 90, inMint: 'm1', outMint: 'm2', priceImpactPct: 1 };
    const route2 = { ...route1, platformFeeBps: 100 };

    // @ts-expect-error - testing private
    const res1 = new JupiterService()['executeDryRun'](route1);
    // @ts-expect-error - testing private
    const res2 = new JupiterService()['executeDryRun'](route2);

    expect(res1.fee).toBe(0);
    expect(res2.fee).toBe(1);
  });
});
