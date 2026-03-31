import { UserRank, SubscriptionStatus, type UserProfile } from '../types/user.js';
import { supabase, type Database } from '../../infrastructure/supabase/client.js';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * Domain Logic: User Ranking & Progression
 * Standar: Canonical Master Blueprint v1.3 (PR 4 — Rank & Economy)
 */
export class TierService {
  private readonly PRO_THRESHOLD = 1000;
  private readonly ELITE_THRESHOLD = 10000;

  /**
   * Dynamic Trading Fee Calculator.
   * Returns the platform fee percentage based on rank + subscription.
   * Blueprint v1.3 Revenue Structure:
   *   NONE:         Newbie (2.0%) | Pro (1.75%) | Elite (1.5%)
   *   STARLIGHT:    1.25%
   *   STARLIGHT+:   1.0%
   *   VIP:          0.75%
   */
  getTradingFeePercentage(profile: UserProfile): number {
    if (profile.status === SubscriptionStatus.VIP) return 0.0075;
    if (profile.status === SubscriptionStatus.STARLIGHT_PLUS) return 0.01;
    if (profile.status === SubscriptionStatus.STARLIGHT) return 0.0125;

    // NONE status — differentiated by Rank
    switch (profile.rank) {
      case UserRank.ELITE:
        return 0.015;
      case UserRank.PRO:
        return 0.0175;
      case UserRank.NEWBIE:
      default:
        return 0.02;
    }
  }

  /**
   * Get user profile and calculate their current rank.
   */
  async getUserProfile(walletAddress: string): Promise<UserProfile> {
    const { data: rawData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    const data = rawData as unknown as ProfileRow | null;

    if (error || !data) {
      // Default for No-Registration / New Wallet
      return {
        walletAddress,
        rank: UserRank.NEWBIE,
        status: SubscriptionStatus.NONE,
        volume: {
          currentMonthVolume: 0,
          totalFeesPaid: 0,
          lastResetDate: new Date(),
        },
        createdAt: new Date(),
        lastActiveAt: new Date(),
        isBanned: false,
      };
    }

    return {
      id: data.id,
      walletAddress: data.wallet_address,
      rank: data.rank as UserRank,
      status: data.subscription_status as SubscriptionStatus,
      volume: {
        currentMonthVolume: Number(data.current_month_volume),
        totalFeesPaid: Number(data.total_fees_paid),
        lastResetDate: new Date(data.last_rank_reset),
      },
      createdAt: new Date(data.created_at),
      lastActiveAt: new Date(data.updated_at),
      isBanned: data.is_banned,
    };
  }

  /**
   * Add trading volume and handle rank upgrades.
   */
  async addVolume(walletAddress: string, amount: number): Promise<UserRank> {
    const profile = await this.getUserProfile(walletAddress);
    const newVolume = profile.volume.currentMonthVolume + amount;
    let newRank = profile.rank;

    if (newVolume >= this.ELITE_THRESHOLD) {
      newRank = UserRank.ELITE;
    } else if (newVolume >= this.PRO_THRESHOLD) {
      newRank = UserRank.PRO;
    }

    void (async () => {
      const { error: upsertError } = await supabase.from('profiles').upsert(
        {
          wallet_address: walletAddress,
          current_month_volume: newVolume,
          rank: newRank,
          updated_at: new Date().toISOString(),
        } as unknown as never,
        { onConflict: 'wallet_address' },
      );
      if (upsertError) console.error('Failed to update volume:', upsertError);
    })();

    return newRank;
  }

  /**
   * Monthly Reset Logic.
   * Rank Protection: STARLIGHT and above are immune to demotion.
   */
  async performMonthlyReset(walletAddress: string): Promise<UserRank> {
    const { data: rawData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    const profile = rawData as unknown as ProfileRow | null;

    if (error || !profile) return UserRank.NEWBIE;

    const currentStatus =
      (profile.subscription_status as SubscriptionStatus) ?? SubscriptionStatus.NONE;
    let newRank = (profile.rank as UserRank) ?? UserRank.NEWBIE;

    // RANK PROTECTION: Paid subscribers cannot be demoted
    const isProtected =
      currentStatus === SubscriptionStatus.STARLIGHT ||
      currentStatus === SubscriptionStatus.STARLIGHT_PLUS ||
      currentStatus === SubscriptionStatus.VIP;

    if (!isProtected) {
      // Free users demote by one tier
      if (newRank === UserRank.ELITE) newRank = UserRank.PRO;
      else if (newRank === UserRank.PRO) newRank = UserRank.NEWBIE;
    }

    void (async () => {
      await supabase
        .from('profiles')
        .update({
          rank: newRank,
          current_month_volume: 0,
          last_rank_reset: new Date().toISOString(),
        } as unknown as never)
        .eq('wallet_address', walletAddress);
    })();

    return newRank;
  }
}
