import { useEffect, useState } from 'react';
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
 * Standar: Canonical Master Blueprint v1.6
 */
export function useProfile() {
  const { publicKey } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!publicKey) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', publicKey.toBase58())
        .single();
      
      if (data && !error) {
        setProfile(data as UserProfile);
      }
      setIsLoading(false);
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
  }, [publicKey, supabase]);

  return { profile, isLoading };
}
