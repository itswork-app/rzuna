import { describe, it, expect, beforeEach } from 'vitest';
import { UserRank, SubscriptionStatus, type UserProfile } from '../src/core/types/user.js';
import { TierService } from '../src/core/tiers/tier.service.js';

describe('🛡️ Dynamic Fee Engine & Tier Coverage', () => {
  let tierService: TierService;

  beforeEach(() => {
    tierService = new TierService();
  });

  const createMockProfile = (rank: UserRank, status: SubscriptionStatus): UserProfile => ({
    walletAddress: 'test',
    rank,
    status,
    volume: { currentMonthVolume: 0, totalFeesPaid: 0, lastResetDate: new Date() },
    createdAt: new Date(),
    lastActiveAt: new Date(),
    isBanned: false,
    aiQuotaLimit: 0,
    aiQuotaUsed: 0,
  });

  it('should calculate correct fee for NEWBIE (2.0%)', () => {
    const profile = createMockProfile(UserRank.NEWBIE, SubscriptionStatus.NONE);
    const fee = tierService.getTradingFeePercentage(profile);
    expect(fee).toBe(0.02);
  });

  it('should calculate correct fee for PRO (1.75%)', () => {
    const profile = createMockProfile(UserRank.PRO, SubscriptionStatus.NONE);
    const fee = tierService.getTradingFeePercentage(profile);
    expect(fee).toBe(0.0175);
  });

  it('should calculate correct fee for ELITE (1.5%)', () => {
    const profile = createMockProfile(UserRank.ELITE, SubscriptionStatus.NONE);
    const fee = tierService.getTradingFeePercentage(profile);
    expect(fee).toBe(0.015);
  });

  it('should calculate correct fee for VIP (0.75%)', () => {
    const profile = createMockProfile(UserRank.PRO, SubscriptionStatus.VIP);
    const fee = tierService.getTradingFeePercentage(profile);
    expect(fee).toBe(0.0075);
  });

  it('should calculate correct fee for STARLIGHT_PLUS (1.0%)', () => {
    const profile = createMockProfile(UserRank.PRO, SubscriptionStatus.STARLIGHT_PLUS);
    const fee = tierService.getTradingFeePercentage(profile);
    expect(fee).toBe(0.01);
  });

  it('should calculate correct fee for STARLIGHT (1.25%)', () => {
    const profile = createMockProfile(UserRank.PRO, SubscriptionStatus.STARLIGHT);
    const fee = tierService.getTradingFeePercentage(profile);
    expect(fee).toBe(0.0125);
  });
});
