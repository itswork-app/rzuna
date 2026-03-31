'use client';

import { useEffect, useState } from 'react';
import { TokenCard } from '@/components/TokenCard';
import { AlphaSignal } from '@/types';
import { AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, ShieldCheck } from 'lucide-react';

export default function VIPChannel() {
  const [signals, setSignals] = useState<AlphaSignal[]>([]);
  
  useEffect(() => {
    const fetchVIPSignals = () => {
      const vipSignals: AlphaSignal[] = [
        {
          mint: 'DezXAZ8z7Pnrn9vzct2PrfLvWzoZOAP89TO86UVHjm6',
          symbol: 'BONK',
          score: 98,
          isPremium: true,
          isNew: true,
          timestamp: Date.now(),
          aiReasoning: {
            narrative: 'Deep institutional liquidity depth and high directional conviction from top-tier traders.',
            riskFactors: ['High concentration in whale wallets'],
            catalysts: ['Major CEX listing pending', 'DEX volume spike (+400%)'],
            generatedByAI: true
          }
        }
      ];
      setSignals(vipSignals);
    };

    fetchVIPSignals();
  }, []);

  return (
    <div className="animate-fade-in">
      <header style={{ 
        padding: '64px 32px', 
        textAlign: 'center', 
        background: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
        borderRadius: '32px',
        border: '1px solid var(--card-border)',
        marginBottom: '48px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'var(--primary)',
          opacity: 0.1
        }}>
          <Crown size={120} />
        </div>
        
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(124, 58, 237, 0.1)', padding: '8px 20px', borderRadius: '100px', marginBottom: '24px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
          <Crown size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>VIP Exclusive Channel</span>
        </div>
        
        <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '16px', lineHeight: '1.1' }}>
          Real-time <span style={{ color: 'var(--primary)' }}>Alpha</span> Intelligence
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 32px' }}>
          Dedicated L2 reasoning pipeline and high-conviction signals (Score 90+) delivered with zero latency for institutional subscribers.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', fontSize: '0.875rem', fontWeight: 600 }}>
            <ShieldCheck size={16} /> Verified Security
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', fontSize: '0.875rem', fontWeight: 600 }}>
             <Sparkles size={16} /> AI Optimized
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '32px' }}>
        <AnimatePresence>
          {signals.map((signal) => (
            <TokenCard key={signal.mint} signal={signal} isVIP={true} />
          ))}
        </AnimatePresence>
      </div>

      {signals.length === 0 && (
         <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
           Waiting for high-conviction signals...
         </div>
      )}
    </div>
  );
}
