import { UserRank, type UserProfile, SubscriptionStatus } from '../types/user.js';
import { supabase } from '../../infrastructure/supabase/client.js';

/**
 * Domain Logic: User Ranking & Progression
 * Standar: Canonical Master Blueprint v1.3
 * Table: public.profiles
 */
export class TierService {
  private readonly PRO_THRESHOLD = 1000;
  private readonly ELITE_THRESHOLD = 10000;

  /**
   * Get user profile and calculate their current rank.
   */
  async getUserProfile(walletAddress: string): Promise<UserProfile> {
    const { data: rawData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    const data = rawData as any;

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

    // Upsert Profile (Asyncly)
    void (async () => {
      const { error: upsertError } = await (supabase.from('profiles') as any).upsert(
        {
          wallet_address: walletAddress,
          current_month_volume: newVolume,
          rank: newRank,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'wallet_address' },
      );
      if (upsertError) console.error('Failed to update volume:', upsertError);
    })();

    return newRank;
  }

  /**
   * Monthly Reset Logic
   */
  async performMonthlyReset(walletAddress: string): Promise<UserRank> {
    const { data: rawData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    const profile = rawData as any;

    if (error || !profile) return UserRank.NEWBIE;

    // Fast check for protection
    const hasProtection = profile.rank_protection;

    if (hasProtection) {
      void (async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        await (supabase.from('profiles') as any)
          .update({ rank_protection: false, last_rank_reset: new Date().toISOString() })
          .eq('wallet_address', walletAddress);
      })();
      return profile.rank as UserRank;
    }

    let newRank = profile.rank as UserRank;
    if (newRank === UserRank.ELITE) newRank = UserRank.PRO;
    else if (newRank === UserRank.PRO) newRank = UserRank.NEWBIE;

    void (async () => {
      await (supabase.from('profiles') as any)
        .update({
          rank: newRank,
          current_month_volume: 0,
          last_rank_reset: new Date().toISOString(),
        })
        .eq('wallet_address', walletAddress);
    })();

    return newRank;
  }
}
