import { describe, it, expect, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { TierService } from '../src/core/tiers/tier.service.js';
import { JupiterService } from '../src/infrastructure/jupiter/jupiter.service.js';
import { supabase } from '../src/infrastructure/supabase/client.js';

// Global Mocks for Isolation
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
    single: vi.fn().mockResolvedValue({ data: { id: 'u1' } }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
  }),
}));
vi.mock('@sentry/node', () => ({ init: vi.fn(), captureException: vi.fn() }));

const TEST_WALLET = 'w1';

describe('☢️ Final Stand: Branch Infiltration Suite', () => {
  it('🛡️ fee.plugin.ts: Pricing Fallback Catch (Line 21)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Pricing Down')));
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/trade',
      body: { walletAddress: TEST_WALLET, amountUSD: 100, platform: 'J', signature: 's' },
    });
    expect(res.statusCode).toBe(200);
    await app.close();
    vi.unstubAllGlobals();
  });

  it('🛡️ fee.plugin.ts: PostHog 403 Branch (Line 59)', async () => {
    const app = await buildApp();
    (app as any).posthog = {
      getAllFlags: vi.fn().mockResolvedValue({ jupiter_swap_enabled: false }),
    };
    const res = await app.inject({
      method: 'POST',
      url: '/trade',
      body: { walletAddress: TEST_WALLET, amountUSD: 100, platform: 'J', signature: 's' },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('🛡️ fee.plugin.ts: Volume Update Error Catch (Line 132)', async () => {
    const app = await buildApp();
    // Force addVolume to throw to hit the catch block in the plugin
    const spy = vi
      .spyOn(TierService.prototype, 'addVolume')
      .mockRejectedValue(new Error('AddVolume Crash'));
    const res = await app.inject({
      method: 'POST',
      url: '/trade',
      body: { walletAddress: TEST_WALLET, amountUSD: 10, platform: 'J', signature: 's' },
    });
    expect(res.statusCode).toBe(500);
    expect(res.json().error).toBe('Failed to record trade volume');
    spy.mockRestore();
    await app.close();
  });

  it('🛡️ fee.plugin.ts: Audit Trails (Lines 85, 95, 100)', async () => {
    const app = await buildApp();

    // Case 1: No logAlpha (Branch 100 skip)
    (app as any).logAlpha = undefined;
    const res1 = await app.inject({
      method: 'POST',
      url: '/trade',
      body: { walletAddress: TEST_WALLET, amountUSD: 10, platform: 'J', signature: 's1' },
    });
    expect(res1.statusCode).toBe(200);

    // Case 2: logAlpha exists (Branch 101 hit)
    (app as any).logAlpha = vi.fn().mockResolvedValue(undefined);
    await app.inject({
      method: 'POST',
      url: '/trade',
      body: { walletAddress: TEST_WALLET, amountUSD: 10, platform: 'J', signature: 's2' },
    });
    expect((app as any).logAlpha).toHaveBeenCalled();

    // Case 3: insertError log (Line 95)
    const spyFrom = vi.spyOn(supabase, 'from').mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: new Error('Insert Fail') }),
    } as any);
    await app.inject({
      method: 'POST',
      url: '/trade',
      body: { walletAddress: TEST_WALLET, amountUSD: 10, platform: 'J', signature: 's3' },
    });
    // Should still succeed but log error internally
    spyFrom.mockRestore();

    await app.close();
  });

  it('🛡️ app.ts: POST /trade/swap Branch Infiltration (Line 98, 111)', async () => {
    const app = await buildApp();
    const URL = '/trade/swap';

    // 1. Missing userPublicKey (Line 98 branch 2)
    const resM1 = await app.inject({ method: 'POST', url: URL, body: { route: {} } });
    expect(resM1.statusCode).toBe(400);

    // 2. Missing route (Line 98 branch 1)
    const resM2 = await app.inject({ method: 'POST', url: URL, body: { userPublicKey: 'u' } });
    expect(resM2.statusCode).toBe(400);

    // 3. Swap Error Catch with Message (Line 111)
    const spyError = vi
      .spyOn(JupiterService.prototype, 'executeSwap')
      .mockRejectedValue(new Error('Internal Crash'));
    const resE1 = await app.inject({
      method: 'POST',
      url: URL,
      body: { route: {}, userPublicKey: 'u' },
    });
    expect(resE1.statusCode).toBe(500);
    expect(resE1.json().error).toBe('Internal Crash');
    spyError.mockRestore();

    // 4. Swap Error Catch without Message (Line 111 Fallback)
    const spyNoMsg = vi.spyOn(JupiterService.prototype, 'executeSwap').mockRejectedValue({});
    const resE2 = await app.inject({
      method: 'POST',
      url: URL,
      body: { route: {}, userPublicKey: 'u' },
    });
    expect(resE2.statusCode).toBe(500);
    expect(resE2.json().error).toBe('Execution failed');
    spyNoMsg.mockRestore();

    await app.close();
  });
});
