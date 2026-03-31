import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { feePlugin } from '../src/plugins/fee.plugin.js';
import { monitoringPlugin } from '../src/infrastructure/monitoring/monitoring.plugin.js';
import { supabase } from '../src/infrastructure/supabase/client.js';
import { env } from '../src/utils/env.js';

vi.mock('@axiomhq/js', () => ({
  Axiom: class {
    ingest = vi.fn();
  },
}));

vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'prof-123' }, error: null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    insert: vi.fn().mockImplementation(() => Promise.resolve({ error: null })),
    update: vi.fn().mockImplementation(() => Promise.resolve({ data: { id: 'p1' }, error: null })),
  },
}));

describe('🛡️ Final Backend Branch Coverage Siege', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { SOL: { price: 150 } } }),
    });
  });

  it('should cover feePlugin branches including edge cases', async () => {
    const fastify = Fastify();
    env.POSTHOG_API_KEY = 'test';

    // Test Case 1: Full success path with everything enabled
    await fastify.register(monitoringPlugin);
    await fastify.register(feePlugin);
    await fastify.ready();

    (fastify as any).posthog.getAllFlags = vi
      .fn()
      .mockResolvedValue({ jupiter_swap_enabled: true });

    await fastify.inject({
      method: 'POST',
      url: '/trade',
      payload: { walletAddress: 'w1', amountUSD: 100, platform: 'RAYDIUM', signature: 's1' },
    });

    // Test Case 2: Fetch Price Failure (Branch 18 & 21-23)
    // 2a. Fetch returns ok: false (triggers throw in getLiveSOLPrice)
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response);
    const fetchFail = await fastify.inject({
      method: 'POST',
      url: '/trade',
      payload: { walletAddress: 'w1', amountUSD: 1, platform: 'RAYDIUM', signature: 's' },
    });
    expect(fetchFail.statusCode).toBe(200); // Should succeed with fallback 150

    // 2b. Fetch throws (triggers catch in getLiveSOLPrice)
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network Error'));
    const fetchCrash = await fastify.inject({
      method: 'POST',
      url: '/trade',
      payload: { walletAddress: 'w1', amountUSD: 1, platform: 'RAYDIUM', signature: 's' },
    });
    expect(fetchCrash.statusCode).toBe(200); // Should succeed with fallback 150

    // Test Case 3: Profile Update Check (Branch 85)
    // 3a. Profile ID exists
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(supabase.from('profiles').select as any).mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: 'p1', rank: 'NEWBIE', status: 'NONE' }, error: null }),
    });

    // 3b. Insert Error (Branch 95)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(supabase.from('transactions').insert as any).mockResolvedValueOnce({
      error: new Error('Audit Fail'),
    });

    await fastify.inject({
      method: 'POST',
      url: '/trade',
      payload: { walletAddress: 'w1', amountUSD: 1, platform: 'RAYDIUM', signature: 's' },
    });

    // 3c. Profile ID missing (Line 85 else)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(supabase.from('profiles').select as any).mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { rank: 'NEWBIE' }, error: null }), // No ID
    });
    await fastify.inject({
      method: 'POST',
      url: '/trade',
      payload: { walletAddress: 'w1', amountUSD: 1, platform: 'RAYDIUM', signature: 's' },
    });

    await fastify.close();
  });

  it('should cover missing logAlpha branch (Line 100)', async () => {
    const fastify = Fastify();
    // Register feePlugin WITHOUT monitoringPlugin
    await fastify.register(feePlugin);
    await fastify.ready();

    expect(fastify.hasDecorator('logAlpha')).toBe(false);

    await fastify.inject({
      method: 'POST',
      url: '/trade',
      payload: { walletAddress: 'w1', amountUSD: 100, platform: 'RAYDIUM', signature: 's' },
    });

    await fastify.close();
  });

  it('should cover GET /user/:wallet/tier route', async () => {
    const fastify = Fastify();
    await fastify.register(feePlugin);
    await fastify.ready();

    const res = await fastify.inject({
      method: 'GET',
      url: '/user/w1/tier',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('feeRate');

    await fastify.close();
  });

  it('should cover POST /trade catch block (Line 133-134)', async () => {
    const fastify = Fastify();
    await fastify.register(feePlugin);
    await fastify.ready();

    // Force an error in getUserProfile
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(supabase.from('profiles').select as any).mockImplementationOnce(() => {
      throw new Error('Plugin Crash');
    });

    const res = await fastify.inject({
      method: 'POST',
      url: '/trade',
      payload: { walletAddress: 'w1', amountUSD: 1, platform: 'RAYDIUM', signature: 's' },
    });

    expect(res.statusCode).toBe(500);
    expect(res.json().error).toBe('Failed to record trade volume');

    await fastify.close();
  });
});
