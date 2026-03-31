'use client';

import { UserRank, SubscriptionStatus } from '@/types';
import { Target, TrendingUp, ShieldCheck } from 'lucide-react';

interface RankBadgeProps {
  rank: UserRank;
  status: SubscriptionStatus;
  progressPercentage: number;
}

export function RankBadge({ rank, status, progressPercentage }: RankBadgeProps) {
  const getRankColor = () => {
    switch (rank) {
      case 'ELITE': return '#fcd34d'; // Gold
      case 'PRO': return '#94a3b8'; // Silver
      case 'NEWBIE':
      default: return '#b45309'; // Bronze
    }
  };

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={16} color={getRankColor()} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{rank}</span>
        </div>
        <span className="badge badge-secondary" style={{ fontSize: '0.625rem' }}>{status}</span>
      </div>
      
      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
        <div style={{ 
          width: `${progressPercentage}%`, 
          height: '100%', 
          background: `linear-gradient(90deg, var(--primary), var(--secondary))`,
          boxShadow: '0 0 10px var(--secondary-glow)'
        }} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-muted)' }}>
        <span>Volume Progression</span>
        <span>{progressPercentage}% to Next Level</span>
      </div>
    </div>
  );
}

interface QuotaMonitorProps {
  used: number;
  limit: number;
}

export function QuotaMonitor({ used, limit }: QuotaMonitorProps) {
  const remaining = limit - used;
  const percentage = (used / limit) * 100;
  
  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>AI Reasoning Quota</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--selection-bg)', fontSize: '0.625rem', fontWeight: 700 }}>
          <ShieldCheck size={12} /> SECURE
        </div>
      </div>
      
      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
        <div style={{ 
          width: `${percentage}%`, 
          height: '100%', 
          background: percentage > 80 ? 'var(--accent)' : 'var(--primary)',
          boxShadow: `0 0 10px ${percentage > 80 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(124, 58, 237, 0.4)'}`
        }} />
      </div>

       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Usage</span>
        <span style={{ fontWeight: 700, color: '#fff' }}>{remaining} / {limit} Units</span>
      </div>
    </div>
  );
}
