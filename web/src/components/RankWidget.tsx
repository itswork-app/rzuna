'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Trophy, Crown, Star } from 'lucide-react';
import { UserRank, SubscriptionStatus } from '@/types';

interface RankWidgetProps {
  rank: UserRank;
  status: SubscriptionStatus;
  currentVolume: number;
  nextThreshold: number;
}

/**
 * rzuna RankWidget: Visualisasi Tier ala ML-Style
 * Standar: Canonical Master Blueprint v1.5
 */
export function RankWidget({ rank, status, currentVolume, nextThreshold }: RankWidgetProps) {
  const progress = Math.min((currentVolume / nextThreshold) * 100, 100);

  const getRankColor = () => {
    if (status === 'VIP') return 'text-purple-400 border-purple-500/50 shadow-purple-500/20';
    if (rank === 'ELITE') return 'text-amber-400 border-amber-500/50 shadow-amber-500/20';
    if (rank === 'PRO') return 'text-blue-400 border-blue-500/50 shadow-blue-500/20';
    return 'text-zinc-400 border-zinc-700 shadow-transparent';
  };

  const getRankIcon = () => {
    if (status === 'VIP') return <Crown size={14} className="animate-bounce" />;
    if (rank === 'ELITE') return <Trophy size={14} />;
    if (rank === 'PRO') return <Star size={14} />;
    return <Shield size={14} />;
  };

  const getDisplayLabel = (): string => {
    if (status !== 'NONE') return status.replace('_', '+');
    return rank;
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md border px-4 py-1.5 rounded-full shadow-2xl ${getRankColor()}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${rank}-${status}`}
            initial={{ scale: 0.5, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {getRankIcon()}
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-tighter leading-none">
            {getDisplayLabel()}
          </span>
          {status !== 'VIP' && (
            <div className="w-16 h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-current"
              />
            </div>
          )}
        </div>
      </motion.div>

      {rank !== 'ELITE' && status === 'NONE' && (
        <span className="text-[8px] text-zinc-500 font-medium px-2">
          ${(nextThreshold - currentVolume).toLocaleString()} volume to next rank
        </span>
      )}
    </div>
  );
}
