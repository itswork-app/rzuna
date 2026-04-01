import React from 'react';
import { Activity, Zap, Shield } from 'lucide-react';
import { UserProfile } from '@/types';

interface UserStatsProps {
  profile: UserProfile | null;
  isLoading: boolean;
}

/**
 * UserStats: Real-time Quota & Network Monitoring
 * Refactored: Consumes shared profile data from Dashboard
 */
export function UserStats({ profile, isLoading }: UserStatsProps) {
  const quotaUsed = profile?.ai_quota_used || 0;
  const quotaLimit = profile?.ai_quota_limit || 20;
  const quotaRemaining = Math.max(0, quotaLimit - quotaUsed);
  const quotaPercentage = (quotaRemaining / quotaLimit) * 100;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-zinc-900/50 rounded-xl border border-zinc-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Network Pulse (Static for visual flair) */}
      <div className="bg-[#1a1a2e]/50 border border-cyan-500/10 rounded-xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Network Pulse</p>
            <p className="text-white font-mono text-xl font-bold">12.4k tps</p>
          </div>
        </div>
        <div className="w-full bg-cyan-500/5 h-1.5 rounded-full overflow-hidden">
          <div className="bg-cyan-500 h-full w-[65%] shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
        </div>
      </div>

      {/* AI Reasoning Quota */}
      <div className="bg-[#1a1a2e]/50 border border-purple-500/10 rounded-xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">AI Reasoning Quota</p>
            <p className="text-white font-mono text-xl font-bold">{quotaRemaining}/{quotaLimit} remaining</p>
          </div>
        </div>
        <div className="w-full bg-purple-500/5 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-purple-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            style={{ width: `${quotaPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Trust Rank */}
      <div className="bg-[#1a1a2e]/50 border border-amber-500/10 rounded-xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Trust Rank</p>
            <p className="text-white font-mono text-xl font-bold">{profile?.rank || 'Alpha Voyager'}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`w-full h-1.5 rounded-full transition-colors duration-500 ${i <= (profile?.rank_level || 2) ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-amber-500/10'}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
}
