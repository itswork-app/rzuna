'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Trophy, Crown, Star } from 'lucide-react';
import { UserRank, SubscriptionStatus } from '@rzuna/contracts';

interface RankWidgetProps {
  rank: UserRank;
  status: SubscriptionStatus;
  currentVolume: number;
  nextThreshold: number;
}

/**
 * RankWidget: Visualisasi Tier Premium ala Mobile Legends
 * Standar: Canonical Master Blueprint v1.5
 */
export function RankWidget({ rank, status, currentVolume, nextThreshold }: RankWidgetProps) {
  const progress = Math.min((currentVolume / nextThreshold) * 100, 100);

  const getRankTheme = () => {
    const isVipDomain = typeof window !== 'undefined' && window.location.hostname.includes('vip');
    
    // In VIP domain, prioritize status (Pass)
    if (isVipDomain || status === SubscriptionStatus.VIP) {
      if (status === SubscriptionStatus.VIP) return { label: status, color: 'text-purple-400', border: 'border-purple-500/50', shadow: 'shadow-purple-500/20', icon: <Crown size={18} className="animate-pulse" /> };
      if (status !== SubscriptionStatus.NONE) return { label: status, color: 'text-purple-300', border: 'border-purple-400/30', shadow: 'shadow-purple-400/10', icon: <Star size={18} /> };
    }

    // In Trade domain, prioritize rank (Volume)
    if (rank === UserRank.GOLD) return { label: rank, color: 'text-amber-400', border: 'border-amber-500/50', shadow: 'shadow-amber-500/20', icon: <Trophy size={18} /> };
    if (rank === UserRank.SILVER) return { label: rank, color: 'text-blue-400', border: 'border-blue-500/50', shadow: 'shadow-blue-500/20', icon: <Star size={18} /> };
    return { label: rank, color: 'text-zinc-400', border: 'border-zinc-700', shadow: 'shadow-transparent', icon: <Shield size={18} /> };
  };

  const theme = getRankTheme();

  return (
    <div className="flex flex-col items-end gap-1">
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className={`flex items-center gap-3 bg-zinc-900/90 backdrop-blur-xl border px-4 py-2 rounded-2xl shadow-2xl ${theme.border} ${theme.shadow}`}
      >
        <div className={theme.color}>{theme.icon}</div>
        
        <div className="flex flex-col">
          <span className={`text-[10px] font-black uppercase tracking-widest ${theme.color}`}>
            {theme.label.replace('_', ' ')}
          </span>
          {status !== SubscriptionStatus.VIP && (
            <div className="w-24 h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full ${theme.color.replace('text', 'bg')}`}
              />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
