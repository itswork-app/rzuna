import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TierService } from '../src/core/tiers/tier.service.js';
import { UserRank, SubscriptionStatus, type UserProfile } from '../src/core/types/user.js';

// Mock Supabase
vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
  },
}));

// Mock env
vi.mock('../src/utils/env.js', () => ({
  env: { NODE_ENV: 'test', SUPABASE_URL: 'https://test.co', SUPABASE_KEY: 'test-key' },
}));

const makeProfile = (rank: UserRank, status: SubscriptionStatus): UserProfile => ({
  walletAddress: 'test_wallet',
  rank,
  status,
  volume: { currentMonthVolume: 0, totalFeesPaid: 0, lastResetDate: new Date() },
  createdAt: new Date(),
  lastActiveAt: new Date(),
  isBanned: false,
});

describe('TierService — Dynamic Fee Calculator', () => {
  let service: TierService;

  beforeEach(() => {
    service = new TierService();
  });

  describe('getTradingFeePercentage()', () => {
    it('VIP user pays 0.75%', () => {
      const profile = makeProfile(UserRank.ELITE, SubscriptionStatus.VIP);
      expect(service.getTradingFeePercentage(profile)).toBe(0.0075);
    });

    it('STARLIGHT_PLUS user pays 1.0%', () => {
      const profile = makeProfile(UserRank.PRO, SubscriptionStatus.STARLIGHT_PLUS);
      expect(service.getTradingFeePercentage(profile)).toBe(0.01);
    });

    it('STARLIGHT user pays 1.25%', () => {
      const profile = makeProfile(UserRank.NEWBIE, SubscriptionStatus.STARLIGHT);
      expect(service.getTradingFeePercentage(profile)).toBe(0.0125);
    });

    it('NONE + ELITE pays 1.5%', () => {
      const profile = makeProfile(UserRank.ELITE, SubscriptionStatus.NONE);
      expect(service.getTradingFeePercentage(profile)).toBe(0.015);
    });

    it('NONE + PRO pays 1.75%', () => {
      const profile = makeProfile(UserRank.PRO, SubscriptionStatus.NONE);
      expect(service.getTradingFeePercentage(profile)).toBe(0.0175);
    });

    it('NONE + NEWBIE pays 2.0%', () => {
      const profile = makeProfile(UserRank.NEWBIE, SubscriptionStatus.NONE);
      expect(service.getTradingFeePercentage(profile)).toBe(0.02);
    });
  });

  describe('getUserProfile() — Default New Wallet', () => {
    it('returns NEWBIE/NONE defaults for unknown wallet', async () => {
      const profile = await service.getUserProfile('unknown_wallet_xyz');
      expect(profile.rank).toBe(UserRank.NEWBIE);
      expect(profile.status).toBe(SubscriptionStatus.NONE);
      expect(profile.isBanned).toBe(false);
    });
  });
});

describe('TierService — Rank Protection Logic', () => {
  let service: TierService;
  beforeEach(() => {
    service = new TierService();
  });

  it('STARLIGHT user pays discounted fee — confirming protected status logic', () => {
    // Protected users (STARLIGHT+) always get discounted fee regardless of rank
    const eliteStarlight = makeProfile(UserRank.ELITE, SubscriptionStatus.STARLIGHT);
    const newbieStarlight = makeProfile(UserRank.NEWBIE, SubscriptionStatus.STARLIGHT);
    // Both pay the same STARLIGHT rate — rank does not matter for protected users
    expect(service.getTradingFeePercentage(eliteStarlight)).toBe(0.0125);
    expect(service.getTradingFeePercentage(newbieStarlight)).toBe(0.0125);
  });

  it('VIP always pays lowest fee regardless of rank', () => {
    const newbieVip = makeProfile(UserRank.NEWBIE, SubscriptionStatus.VIP);
    const eliteVip = makeProfile(UserRank.ELITE, SubscriptionStatus.VIP);
    expect(service.getTradingFeePercentage(newbieVip)).toBe(0.0075);
    expect(service.getTradingFeePercentage(eliteVip)).toBe(0.0075);
  });
});

describe('JupiterService — Helpers', () => {
  it('converts fee rate to basis points correctly', async () => {
    const { JupiterService } = await import('../src/infrastructure/jupiter/jupiter.service.js');
    expect(JupiterService.feeToBps(0.02)).toBe(200);
    expect(JupiterService.feeToBps(0.0075)).toBe(75);
    expect(JupiterService.feeToBps(0.01)).toBe(100);
  });
});
