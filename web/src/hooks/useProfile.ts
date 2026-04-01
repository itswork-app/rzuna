import { useEffect, useState, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createClient } from '@/lib/supabase/client';
import { UserRank, SubscriptionStatus } from '@/types';

export interface UserProfile {
  id: string;
  wallet_address: string;
  rank: UserRank;
  rank_level: number;
  subscription_status: SubscriptionStatus;
  ai_quota_used: number;
  ai_quota_limit: number;
  total_volume_usd: number;
}

/**
 * useProfile: Reactive Supabase User Profile Hook
 * Optimized: Prevents cascading renders by avoiding synchronous setState in useEffect.
 * Standar: Canonical Master Blueprint v1.6
 */
export function useProfile() {
  const { publicKey } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use a stable supabase client instance to avoid effect re-triggers
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // If no wallet is connected, just reset the state (Safe for initial render)
    if (!publicKey) {
      setProfile(null);
      setIsLoading(false);
      return () => {}; // No cleanup needed
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', publicKey.toBase58())
          .single();
        
        if (data && !error) {
          setProfile(data as UserProfile);
        }
      } finally {
        setIsLoading(false);
      }
    };

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
          filter: `wallet_address=eq.${publicKey.toBase58()}` 
        },
        (payload: { new: UserProfile }) => {
          setProfile(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [publicKey, supabase]); // Supabase is now stable via useMemo

  return { profile, isLoading };
}
