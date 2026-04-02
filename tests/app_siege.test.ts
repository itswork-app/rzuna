/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';
import { supabase } from '../src/infrastructure/supabase/client.js';

vi.mock('../src/infrastructure/monitoring/monitoring.plugin.js', () => ({
  monitoringPlugin: async (fastify: any) => {
    fastify.decorate('logAlpha', vi.fn().mockResolvedValue(undefined));
    fastify.decorate('posthog', { getAllFlags: vi.fn().mockResolvedValue({}) });
  },
}));

vi.mock('../src/core/engine.js', () => ({
  IntelligenceEngine: class {
    start = vi.fn().mockResolvedValue(undefined);
    getTieredSignals = vi.fn().mockReturnValue([]);
  },
}));

vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('🛡️ App Entry Point Branch Siege', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should cover signals endpoint and branch logic', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          walletAddress: '0x123',
          rank: 'NEWBIE',
          status: 'NONE',
          volume: { currentMonthVolume: 0 },
        },
        error: null,
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const fastify = await buildApp();

    // 1. Unhappy Path: No wallet
    const resNoWallet = await fastify.inject({
      method: 'GET',
      url: '/signals',
    });
    expect(resNoWallet.statusCode).toBe(400);

    // 2. Happy Path: Valid wallet (NONE status)
    await fastify.inject({
      method: 'GET',
      url: '/signals',
      query: { wallet: '0x123' },
    });

    // 3. Starlight Branch
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          walletAddress: 's1',
          rank: 'PRO',
          status: 'STARLIGHT',
          volume: { currentMonthVolume: 0 },
        },
        error: null,
      }),
    });
    await fastify.inject({ method: 'GET', url: '/signals', query: { wallet: 's1' } });

    // 4. VIP Branch
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          walletAddress: 'v1',
          rank: 'ELITE',
          status: 'VIP',
          volume: { currentMonthVolume: 1000 },
        },
        error: null,
      }),
    });
    await fastify.inject({ method: 'GET', url: '/signals', query: { wallet: 'v1' } });

    // 5. Health Check
    const resHealth = await fastify.inject({
      method: 'GET',
      url: '/health',
    });
    expect(resHealth.statusCode).toBe(200);

    await fastify.close();
  });
});
