'use client';

import { useState, useEffect } from 'react';
import { useSignals } from '@/hooks/useSignals';
import { TokenCard } from '@/components/TokenCard';
import { RankBadge, QuotaMonitor } from '@/components/UserStats';
import { UserProfile } from '@/types';
import { AnimatePresence } from 'framer-motion';
import { TrendingUp, Activity } from 'lucide-react';

export default function Dashboard() {
  const { signals, loading } = useSignals();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  // Mock profile fetch logic
  useEffect(() => {
    const fetchProfileData = () => {
      // In production, this would be a real API fetch to the Fastify backend
      const mockProfile: UserProfile = {
        walletAddress: 'rzun...7p2v',
        rank: 'PRO',
        status: 'STARLIGHT',
        aiQuotaLimit: 10,
        aiQuotaUsed: 4,
        volume: {
          currentMonthVolume: 1250.50,
          totalFeesPaid: 25.01,
        }
      };
      setProfile(mockProfile);
      setFetchingProfile(false);
    };

    fetchProfileData();
  }, []);

  if (loading || fetchingProfile) return (
    <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: 500 }}>Initializing Neural Core...</p>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Header Info Section */}
      <header style={{ marginBottom: '48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '16px' }}>
            <TrendingUp color="var(--primary)" size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Volume Current Month</p>
            <div className="stat-value">${profile?.volume.currentMonthVolume.toLocaleString()}</div>
          </div>
        </div>
        
        {profile && (
          <RankBadge 
            rank={profile.rank} 
            status={profile.status} 
            progressPercentage={45} 
          />
        )}

        {profile && (
          <QuotaMonitor 
            used={profile.aiQuotaUsed} 
            limit={profile.aiQuotaLimit} 
          />
        )}
      </header>

      {/* Signals Grid Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--secondary)', borderRadius: '50%', boxShadow: '0 0 10px var(--secondary-glow)' }}></div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Real-time Alpha Feed</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ 
            background: 'rgba(255,255,255,0.05)', 
            color: '#fff', 
            border: '1px solid var(--card-border)', 
            padding: '8px 16px', 
            borderRadius: '8px', 
            fontSize: '0.875rem', 
            fontWeight: 600
          }}>All Signals</button>
          <button style={{ 
            background: 'var(--primary)', 
            color: '#fff', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '8px', 
            fontSize: '0.875rem', 
            fontWeight: 600
          }}>VIP Only</button>
        </div>
      </div>

      {/* Signals List */}
      <AnimatePresence mode="popLayout">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
          {signals.map((signal) => (
            <TokenCard 
              key={signal.mint} 
              signal={signal} 
              isVIP={profile?.status === 'VIP'} 
            />
          ))}
        </div>
      </AnimatePresence>

      {signals.length === 0 && (
        <div style={{ padding: '64px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed var(--card-border)' }}>
          <Activity size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.3 }} />
          <h3 style={{ color: '#fff', marginBottom: '8px' }}>Scanning for Alpha Signals...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>The geyser is currently monitoring Pump.fun and Raydium streams.</p>
        </div>
      )}
    </div>
  );
}
