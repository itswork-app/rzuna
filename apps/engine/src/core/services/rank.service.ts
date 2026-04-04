import { UserRank, SubscriptionStatus } from '@rzuna/contracts';
import { db, users, aiQuota, subscriptions, eq, sql } from '@rzuna/database';

/**
 * 🏛️ RankService: Institutional Rank & Economy Management
 * Standar: Canonical Master Blueprint v22.1 (The Muscles)
 */
export class RankService {
  /**
   * Returns the platform fee basis points (BPS) based on tier.
   * 1% = 100 BPS.
   */
  getTradingFeeBps(tier: UserRank, status: SubscriptionStatus): number {
    if (status === SubscriptionStatus.VIP) return 50; // 0.5% (Platinum Standard)
    if (status === SubscriptionStatus.STARLIGHT_PLUS) return 75; // 0.75%
    if (status === SubscriptionStatus.STARLIGHT) return 100; // 1.0%

    // NO status — tiered by Rank (Bronze to Mythic)
    const tierMap: Record<UserRank, number> = {
      [UserRank.MYTHIC]: 50,
      [UserRank.DIAMOND]: 75,
      [UserRank.PLATINUM]: 100,
      [UserRank.GOLD]: 125,
      [UserRank.SILVER]: 150,
      [UserRank.BRONZE]: 200,
    };

    return tierMap[tier] || 200;
  }

  async getUser(walletAddress: string) {
    if (!walletAddress) {
      throw new Error('Invalid wallet address');
    }

    // 1. Fetch User Base Rank
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);
    let user = rows[0];

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          walletAddress,
          tier: 'BRONZE',
        })
        .returning();
      user = newUser;
    }

    // 2. Fetch Subscription (V22.1 Bridge)
    const subRows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1);
    const sub = subRows[0] || { status: 'NONE' };

    // 3. Fetch Quota
    const quotas = await db.select().from(aiQuota).where(eq(aiQuota.userId, user.id));
    const quota = quotas[0] || null;

    return {
      ...user,
      subscriptionStatus: sub.status as SubscriptionStatus,
      aiQuota: quota,
    };
  }

  async consumeQuota(userId: string): Promise<boolean> {
    const quotas = await db.select().from(aiQuota).where(eq(aiQuota.userId, userId));
    const quota = quotas[0];
    if (!quota || quota.creditsRemaining <= 0) return false;

    await db
      .update(aiQuota)
      .set({
        creditsRemaining: sql`${aiQuota.creditsRemaining} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(aiQuota.userId, userId));

    return true;
  }

  /**
   * Institutional Volume Tracking (Atomic)
   */
  async addVolume(walletAddress: string, amount: number, feePaid: number = 0): Promise<UserRank> {
    const user = await this.getUser(walletAddress);

    await db
      .update(users)
      .set({
        currentMonthVolume: sql`${users.currentMonthVolume} + ${amount.toString()}`,
        totalFeesPaid: sql`${users.totalFeesPaid} + ${feePaid.toString()}`,
        updatedAt: new Date(),
      })
      .where(eq(users.walletAddress, walletAddress));

    return user.tier as UserRank;
  }

  /**
   * Monthly Reset & Rank Protection
   */
  async performMonthlyReset(walletAddress: string): Promise<UserRank> {
    const user = await this.getUser(walletAddress);
    let newRank = user.tier as UserRank;

    // Protection: Subscribers immune to demotion
    const isProtected = [
      SubscriptionStatus.STARLIGHT,
      SubscriptionStatus.STARLIGHT_PLUS,
      SubscriptionStatus.VIP,
    ].includes(user.subscriptionStatus);

    if (!isProtected) {
      if (newRank === UserRank.GOLD) newRank = UserRank.SILVER;
      else if (newRank === UserRank.SILVER) newRank = UserRank.BRONZE;
    }

    await db
      .update(users)
      .set({
        tier: newRank,
        currentMonthVolume: '0',
        lastRankReset: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.walletAddress, walletAddress));

    return newRank;
  }
}
