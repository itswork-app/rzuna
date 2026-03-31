'use client';

import { AlphaSignal } from '@/types';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, ExternalLink, Cpu } from 'lucide-react';

interface TokenCardProps {
  signal: AlphaSignal;
  isVIP?: boolean;
}

export function TokenCard({ signal }: TokenCardProps) {
  const isHighAlpha = signal.score >= 90;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card"
      style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}
    >
      {isHighAlpha && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--secondary), transparent)',
          boxShadow: '0 0 15px var(--secondary-glow)'
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{signal.symbol}</h3>
            {signal.isNew && <span className="badge badge-secondary">New</span>}
            {signal.isPremium && <span className="badge badge-primary">Private</span>}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'Inter' }}>
            {signal.mint.slice(0, 4)}...{signal.mint.slice(-4)}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{signal.score}</div>
          <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 600 }}>ALPHA SCORE</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--secondary)', marginBottom: '8px' }}>
            <Zap size={14} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Catalysts</span>
          </div>
          <ul style={{ listStyle: 'none', fontSize: '0.75rem', color: '#e2e8f0' }}>
            {(signal.aiReasoning?.catalysts || []).slice(0, 2).map((c, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>• {c}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', marginBottom: '8px' }}>
            <AlertTriangle size={14} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Risks</span>
          </div>
          <ul style={{ listStyle: 'none', fontSize: '0.75rem', color: '#e2e8f0' }}>
            {(signal.aiReasoning?.riskFactors || []).slice(0, 2).map((r, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>• {r}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ 
        padding: '16px', 
        background: 'rgba(124, 58, 237, 0.05)', 
        borderRadius: '12px', 
        border: '1px solid rgba(124, 58, 237, 0.1)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Cpu size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#a78bfa' }}>AI Reasoning Oracle</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: '#cbd5e1', lineHeight: '1.6' }}>
          {signal.aiReasoning?.narrative || 'Analyzing token narrative and social sentiment...'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button style={{ 
          flex: 1,
          background: 'var(--primary)', 
          color: '#fff', 
          border: 'none', 
          padding: '10px', 
          borderRadius: '8px', 
          fontSize: '0.8125rem', 
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          Swap on Jupiter <ExternalLink size={14} />
        </button>
        <button style={{ 
          background: 'rgba(255,255,255,0.05)', 
          color: '#fff', 
          border: '1px solid var(--card-border)', 
          padding: '10px 16px', 
          borderRadius: '8px', 
          fontSize: '0.8125rem', 
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          Details
        </button>
      </div>
    </motion.div>
  );
}
