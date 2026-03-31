'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Zap, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';

export function UserStats() {
  const { publicKey } = useWallet();
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!publicKey) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', publicKey.toBase58())
        .single();
      
      if (data) setProfile(data);
    };

    fetchProfile();

    // Real-time subscription for quota updates
    const channel = supabase
      .channel('profile_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `wallet_address=eq.${publicKey.toBase58()}` },
        (payload: any) => {
          setProfile(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [publicKey, supabase]);

  const quotaUsed = profile?.ai_quota_used || 0;
  const quotaLimit = profile?.ai_quota_limit || 20; // Use profile limit or default
  const quotaRemaining = Math.max(0, quotaLimit - quotaUsed);
  const quotaPercentage = (quotaRemaining / quotaLimit) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="bg-[#1a1a2e]/50 border border-cyan-500/10 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-sm font-medium">Network Pulse</p>
            <p className="text-white font-mono text-xl font-bold">12.4k tps</p>
          </div>
        </div>
        <div className="w-full bg-cyan-500/5 h-1.5 rounded-full overflow-hidden">
          <div className="bg-cyan-500 h-full w-[65%] shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
        </div>
      </div>

      <div className="bg-[#1a1a2e]/50 border border-purple-500/10 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-sm font-medium">AI Reasoning Quota</p>
            <p className="text-white font-mono text-xl font-bold">{quotaRemaining}/{quotaLimit} remaining</p>
          </div>
        </div>
        <div className="w-full bg-purple-500/5 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-purple-500 h-full transition-all duration-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            style={{ width: `${quotaPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-[#1a1a2e]/50 border border-amber-500/10 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-sm font-medium">Trust Rank</p>
            <p className="text-white font-mono text-xl font-bold">{profile?.rank || 'Alpha Voyager'}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`w-full h-1.5 rounded-full ${i <= (profile?.rank_level || 2) ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-amber-500/10'}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
}
