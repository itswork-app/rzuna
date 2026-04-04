import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RankService } from '../core/services/rank.service.js';
import { UserRank, SubscriptionStatus } from '@rzuna/contracts';

// 🏛️ Institutional Drizzle Mock
const { mockDb } = vi.hoisted(() => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    then: vi.fn(),
  };
  return { mockDb: chain };
});

vi.mock('@rzuna/database', () => ({
  db: mockDb,
  users: {
    id: 'id',
    walletAddress: 'wallet_address',
    tier: 'tier',
    currentMonthVolume: 'v',
    totalFeesPaid: 'f',
  },
  aiQuota: { id: 'id', userId: 'user_id', creditsRemaining: 'credits' },
  subscriptions: { id: 'id', userId: 'user_id', status: 'status' },
  eq: vi.fn(),
  sql: vi.fn(),
}));

describe('🏛️ RankService (Bank Standard Revenue)', () => {
  let rankService: RankService;

  beforeEach(() => {
    vi.clearAllMocks();
    rankService = new RankService();
  });

  it('SHOULD calculate correct trading fee BPS based on Status', () => {
    expect(rankService.getTradingFeeBps(UserRank.BRONZE, SubscriptionStatus.VIP)).toBe(50);
    expect(rankService.getTradingFeeBps(UserRank.BRONZE, SubscriptionStatus.STARLIGHT_PLUS)).toBe(
      75,
    );
    expect(rankService.getTradingFeeBps(UserRank.BRONZE, SubscriptionStatus.STARLIGHT)).toBe(100);
  });

  it('SHOULD calculate correct trading fee BPS based on Rank (No Status)', () => {
    expect(rankService.getTradingFeeBps(UserRank.MYTHIC, SubscriptionStatus.NONE)).toBe(50);
    expect(rankService.getTradingFeeBps(UserRank.DIAMOND, SubscriptionStatus.NONE)).toBe(75);
    expect(rankService.getTradingFeeBps(UserRank.PLATINUM, SubscriptionStatus.NONE)).toBe(100);
    expect(rankService.getTradingFeeBps(UserRank.GOLD, SubscriptionStatus.NONE)).toBe(125);
    expect(rankService.getTradingFeeBps(UserRank.SILVER, SubscriptionStatus.NONE)).toBe(150);
    expect(rankService.getTradingFeeBps(UserRank.BRONZE, SubscriptionStatus.NONE)).toBe(200);
    expect(rankService.getTradingFeeBps('INVALID' as any, SubscriptionStatus.NONE)).toBe(200);
  });

  it('SHOULD throw error if wallet is empty in getUser', async () => {
    await expect(rankService.getUser('')).rejects.toThrow('Invalid wallet address');
  });

  it('SHOULD get existing user in getUser', async () => {
    mockDb.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve([{ id: 'u1', walletAddress: 'w1', tier: 'GOLD' }]).then(onFulfilled),
    );
    mockDb.then.mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled)); // No sub
    mockDb.then.mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled)); // No quota

    const user = await rankService.getUser('w1');
    expect(user.id).toBe('u1');
    expect(user.subscriptionStatus).toBe(SubscriptionStatus.NONE);
  });

  it('SHOULD create user if NOT found in getUser', async () => {
    mockDb.then.mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled)); // No user
    mockDb.then.mockImplementationOnce(
      (onFulfilled: any) => Promise.resolve([{ id: 'new_u1', tier: 'BRONZE' }]).then(onFulfilled), // New user
    );
    mockDb.then.mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled));
    mockDb.then.mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled));

    const user = await rankService.getUser('w1');
    expect(user.id).toBe('new_u1');
  });

  it('SHOULD return false if no quota in consumeQuota', async () => {
    mockDb.then.mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled));
    const result = await rankService.consumeQuota('u1');
    expect(result).toBe(false);
  });

  it('SHOULD consume quota correctly', async () => {
    mockDb.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve([{ id: 'q1', creditsRemaining: 5 }]).then(onFulfilled),
    );
    mockDb.then.mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled)); // update
    const result = await rankService.consumeQuota('u1');
    expect(result).toBe(true);
  });

  it('SHOULD add volume correctly', async () => {
    vi.spyOn(rankService, 'getUser').mockResolvedValueOnce({
      id: 'u1',
      tier: UserRank.GOLD,
    } as any);
    mockDb.then.mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled));
    const tier = await rankService.addVolume('w1', 1000, 20);
    expect(tier).toBe(UserRank.GOLD);
  });

  it('SHOULD demote GOLD users correctly in monthly reset', async () => {
    vi.spyOn(rankService, 'getUser').mockResolvedValueOnce({
      id: 'u1',
      tier: UserRank.GOLD,
      subscriptionStatus: SubscriptionStatus.NONE,
    } as any);
    mockDb.then.mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled));
    const newRank = await rankService.performMonthlyReset('w1');
    expect(newRank).toBe(UserRank.SILVER);
  });

  it('SHOULD demote SILVER users correctly in monthly reset', async () => {
    vi.spyOn(rankService, 'getUser').mockResolvedValueOnce({
      id: 'u1',
      tier: UserRank.SILVER,
      subscriptionStatus: SubscriptionStatus.NONE,
    } as any);
    mockDb.then.mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled));
    const newRank = await rankService.performMonthlyReset('w1');
    expect(newRank).toBe(UserRank.BRONZE);
  });

  it('SHOULD NOT demote subscribers', async () => {
    vi.spyOn(rankService, 'getUser').mockResolvedValueOnce({
      id: 'u1',
      tier: UserRank.GOLD,
      subscriptionStatus: SubscriptionStatus.VIP,
    } as any);
    mockDb.then.mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled));
    const newRank = await rankService.performMonthlyReset('w1');
    expect(newRank).toBe(UserRank.GOLD);
  });
});
