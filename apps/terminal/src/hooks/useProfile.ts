import { useEffect, useState, useMemo, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createClient } from '@/lib/supabase/client';
import { UserProfile, SubscriptionStatus, UserRank } from '@rzuna/contracts';

/**
 * useProfile: Reactive Supabase User Profile Hook
 * Optimized: Prevents cascading renders and provides manual refresh (mutate) support.
 * Standar: Canonical Master Blueprint v1.6
 */
export function useProfile() {
  const { publicKey } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use a stable supabase client instance
  const supabase = useMemo(() => createClient(), []);

  const mapToUserProfile = useCallback((data: any): UserProfile => {
    return {
      id: data.id,
      walletAddress: data.wallet_address,
      rank: data.rank as UserRank,
      rankLevel: data.rank_level || 1,
      status: data.subscription_status as SubscriptionStatus,
      volume: {
        currentMonthVolume: Number(data.current_month_volume || 0),
        totalFeesPaid: Number(data.total_fees_paid || 0),
        lastResetDate: new Date(data.last_rank_reset || new Date()),
      },
      createdAt: new Date(data.created_at || new Date()),
      lastActiveAt: new Date(data.updated_at || new Date()),
      isBanned: !!data.is_banned,
      aiQuotaLimit: Number(data.ai_quota_limit || 20),
      aiQuotaUsed: Number(data.ai_quota_used || 0),
      tgChatId: data.tg_chat_id,
      isTgEnabled: !!data.is_tg_enabled,
    };
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!publicKey) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', publicKey.toBase58())
        .single();

      if (data && !error) {
        const userProfile = mapToUserProfile(data);
        setProfile(userProfile);

        // Sync to cookie for Middleware (Edge) consumption
        document.cookie = `x-rzuna-subscription=${userProfile.status}; path=/; domain=.aivo.sh; max-age=3600; SameSite=Lax`;
        // Fallback for localhost
        document.cookie = `x-rzuna-subscription=${userProfile.status}; path=/; max-age=3600; SameSite=Lax`;
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, supabase, mapToUserProfile]);

  const mutate = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!publicKey) {
      setProfile(null);
      setIsLoading(false);
      return () => {};
    }

    fetchProfile();

    // Real-time synchronization
    const channel = supabase
      .channel(`profile:${publicKey.toBase58()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `wallet_address=eq.${publicKey.toBase58()}`,
        },
        (payload: { new: any }) => {
          const updatedProfile = mapToUserProfile(payload.new);
          setProfile(updatedProfile);
          document.cookie = `x-rzuna-subscription=${updatedProfile.status}; path=/; domain=.aivo.sh; max-age=3600; SameSite=Lax`;
          document.cookie = `x-rzuna-subscription=${updatedProfile.status}; path=/; max-age=3600; SameSite=Lax`;
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [publicKey, supabase, fetchProfile, mapToUserProfile]);

  return { profile, isLoading, mutate };
}
