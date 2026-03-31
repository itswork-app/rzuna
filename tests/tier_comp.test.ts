import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TierService } from '../src/core/tiers/tier.service.js';
import { UserRank } from '../src/core/types/user.js';
import { supabase } from '../src/infrastructure/supabase/client.js';

// Custom mock to handle the chainable Supabase API
vi.mock('../src/infrastructure/supabase/client.js', () => {
  const mockBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    // Make the builder thenable so it can be awaited
    then: vi.fn().mockImplementation((onFulfilled) => {
      onFulfilled({ data: null, error: null });
    }),
  };

  return {
    supabase: {
      from: vi.fn().mockReturnValue(mockBuilder),
    },
  };
});

describe('🛡️ TierService Institutional Coverage', () => {
  let service: TierService;
  const WALLET = 'test-wallet';

  beforeEach(() => {
    service = new TierService();
    vi.clearAllMocks();
  });

  it('should handle missing user profile and return defaults', async () => {
    const mockFrom = supabase.from('profiles');
    // @ts-expect-error - Accessing private mock for internal Vitest state manipulation
    (mockFrom.single as any).mockImplementationOnce(() =>
      Promise.resolve({
        data: null,
        error: new Error('Not found'),
      }),
    );

    const profile = await service.getUserProfile('new-wallet');
    expect(profile.rank).toBe(UserRank.NEWBIE);
    expect(profile.aiQuotaLimit).toBe(0);
  });

  it('should consume AI quota for non-VIP', async () => {
    const mockFrom = supabase.from('profiles');

    // 1. First call: getUserProfile
    // @ts-expect-error - Accessing private mock for internal Vitest state manipulation
    (mockFrom.single as any).mockImplementationOnce(() =>
      Promise.resolve({
        data: { id: '1', ai_quota_limit: 10, ai_quota_used: 5, subscription_status: 'STARLIGHT' },
        error: null,
      }),
    );

    // 2. Second call: update
    (mockFrom.update as any).mockImplementationOnce(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }));

    const success = await service.consumeQuota(WALLET);
    expect(success).toBe(true);
  });

  it('should fail quota consumption if limit reached', async () => {
    const mockFrom = supabase.from('profiles');
    // @ts-expect-error - Accessing private mock for internal Vitest state manipulation
    (mockFrom.single as any).mockResolvedValue({
      data: { id: '1', ai_quota_limit: 5, ai_quota_used: 5, subscription_status: 'STARLIGHT' },
      error: null,
    });

    const success = await service.consumeQuota(WALLET);
    expect(success).toBe(false);
  });

  it('should protect rank for STARLIGHT during reset', async () => {
    const mockFrom = supabase.from('profiles');
    // @ts-expect-error - Accessing private mock for internal Vitest state manipulation
    (mockFrom.single as any).mockResolvedValue({
      data: { id: '1', rank: 'ELITE', subscription_status: 'STARLIGHT' },
      error: null,
    });

    const newRank = await service.performMonthlyReset(WALLET);
    expect(newRank).toBe(UserRank.ELITE); // Protected
  });

  it('should demote rank for NONE subscription during reset', async () => {
    const mockFrom = supabase.from('profiles');
    // @ts-expect-error - Accessing private mock for internal Vitest state manipulation
    (mockFrom.single as any).mockResolvedValue({
      data: { id: '1', rank: 'ELITE', subscription_status: 'NONE' },
      error: null,
    });

    const newRank = await service.performMonthlyReset(WALLET);
    expect(newRank).toBe(UserRank.PRO); // Demoted
  });
});
