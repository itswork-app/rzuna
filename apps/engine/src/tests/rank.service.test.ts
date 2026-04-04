import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RankService } from '../core/services/rank.service.js';
import { UserRank, SubscriptionStatus } from '@rzuna/contracts';

// 🏛️ V22.1 Hoisted Drizzle Mock
const { mockDb } = vi.hoisted(() => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    then: vi.fn((onFulfilled) => Promise.resolve([]).then(onFulfilled)),
  };
  return { mockDb: chain };
});

vi.mock('@rzuna/database', () => ({
  db: mockDb,
  users: {
    id: 'id',
    walletAddress: 'wallet_address',
    tier: 'tier',
    currentMonthVolume: 'volume',
    totalFeesPaid: 'fees',
    lastRankReset: 'reset',
  },
  aiQuota: { id: 'id', userId: 'user_id', creditsRemaining: 'credits' },
  subscriptions: { id: 'id', userId: 'user_id', status: 'status' },
  eq: vi.fn(),
  inArray: vi.fn(),
  and: vi.fn(),
  isNotNull: vi.fn(),
  sql: vi.fn(),
}));

describe('🏛️ RankService (Institutional Hardening)', () => {
  let rankService: RankService;

  beforeEach(() => {
    vi.clearAllMocks();
    rankService = new RankService();
  });

  it('SHOULD calculate correct trading fee BPS based on Status', () => {
    expect(rankService.getTradingFeeBps(UserRank.BRONZE, SubscriptionStatus.VIP)).toBe(50);
  });

  it('SHOULD consume quota correctly', async () => {
    mockDb.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve([{ id: 'q1', creditsRemaining: 5 }]).then(onFulfilled),
    );
    const result = await rankService.consumeQuota('u1');
    expect(result).toBe(true);
  });

  it('SHOULD demote free GOLD users to SILVER', async () => {
    vi.spyOn(rankService, 'getUser').mockResolvedValueOnce({
      id: 'u1',
      tier: UserRank.GOLD,
      subscriptionStatus: SubscriptionStatus.NONE,
    } as any);

    mockDb.then.mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled));

    const newRank = await rankService.performMonthlyReset('w1');
    expect(newRank).toBe(UserRank.SILVER);
  });
});
