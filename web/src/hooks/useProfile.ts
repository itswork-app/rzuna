import { useEffect, useState, useMemo, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types';

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
        setProfile(data as UserProfile);
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, supabase]);

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
  }, [publicKey, supabase, fetchProfile]);

  return { profile, isLoading, mutate };
}
