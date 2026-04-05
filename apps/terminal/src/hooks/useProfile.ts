import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { UserProfile, SubscriptionStatus, UserRank } from '@rzuna/contracts';

/**
 * 🏛️ useProfile: Institutional User Profile Hook (v22.3)
 * Transitioned: Purged Supabase for Native Solana Identity.
 * Standar: Institutional-Grade Stateless Profile
 */
export function useProfile() {
  const { publicKey } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!publicKey) return;
    setIsLoading(true);
    try {
      // 🏗️ SIWS Migration: Profile data will be fetched from Engine /v1/user
      // Currently defaulting to a secure baseline to preserve UI during Clean Sweep.
      const baselineProfile: UserProfile = {
        id: publicKey.toBase58(),
        walletAddress: publicKey.toBase58(),
        rank: 'BASE' as UserRank,
        rankLevel: 1,
        status: 'FREE' as SubscriptionStatus,
        volume: {
          currentMonthVolume: 0,
          totalFeesPaid: 0,
          lastResetDate: new Date(),
        },
        createdAt: new Date(),
        lastActiveAt: new Date(),
        isBanned: false,
        aiQuotaLimit: 10,
        aiQuotaUsed: 0,
        tgChatId: undefined,
        isTgEnabled: false,
      };

      setProfile(baselineProfile);

      // Sync status to cookie for Edge Middleware
      document.cookie = `x-rzuna-subscription=${baselineProfile.status}; path=/; max-age=3600; SameSite=Lax`;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  const mutate = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!publicKey) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    fetchProfile();
  }, [publicKey, fetchProfile]);

  return { profile, isLoading, mutate };
}
