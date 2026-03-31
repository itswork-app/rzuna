'use client';

import React from 'react';

/**
 * UserStats: AI Quota Monitor
 * Menyambungkan metadata kuota dari TierService ke antarmuka pengguna rzuna.
 */
export function UserStats({ quotaLimit, quotaUsed }: { quotaLimit: number; quotaUsed: number }) {
  const remaining = quotaLimit - quotaUsed;
  const percentage = (quotaUsed / quotaLimit) * 100;

  return (
    <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 backdrop-blur-sm">
      <div className="flex justify-between items-end mb-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">AI Intelligence Quota</h3>
        <span className="text-lg font-mono font-bold text-white">{remaining} <span className="text-[10px] text-zinc-500">LEFT</span></span>
      </div>
      
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${percentage > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <p className="text-[9px] text-zinc-500 mt-3 leading-relaxed">
        {remaining > 0 
          ? `You have ${remaining} AI analyses remaining for today.` 
          : "Quota exhausted. Upgrade to VIP for unlimited deep reasoning."}
      </p>
    </div>
  );
}
