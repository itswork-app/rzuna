'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Brain, Lock, ExternalLink } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/hooks/useAuth';
import { useSignals } from '@/hooks/useSignals';
import { TokenCard } from '@/components/TokenCard';
import { TierCards } from '@/components/TierCards';
import { FeatureShowcase } from '@/components/FeatureShowcase';
import Link from 'next/link';
import { getApiUrl } from '@/lib/env';
import posthog from 'posthog-js';

import { TokenSignal as Signal } from '@rzuna/contracts';

export default function MarketingPage() {
  const { connected } = useWallet();
  const { isAuthenticated, isAuthenticating, login } = useAuth();
  const { signals } = useSignals();
  const [liveSignals, setLiveSignals] = React.useState<Signal[]>([]);

  // Real-time WebSocket Stream for Marketing Preview
  React.useEffect(() => {
    const wsUrl = getApiUrl().replace('http', 'ws') + '/ws/signals';
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        if (type === 'ALPHA_SIGNAL') {
          setLiveSignals(prev => [payload, ...prev].slice(0, 4));
        }
      } catch (err) {
        console.error('[WS_MARKETING] Failed to parse signal:', err);
      }
    };

    return () => socket.close();
  }, []);

  // Use live signals if available, fallback to static fetch
  const displaySignals = liveSignals.length > 0 ? liveSignals : signals;
  const marketingSignals = displaySignals.slice(0, 2);

  return (
    <main className="min-h-screen bg-[#050510] text-gray-100 selection:bg-cyan-500/30 overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-20 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="max-w-4xl w-full text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8 backdrop-blur-md"
          >
            <ShieldCheck size={16} className="text-cyan-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Institutional Grade Scouting Active</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8"
          >
            Institutional <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500">
              Alpha Intelligence
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 1 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Real-time L2 reasoning, direct Jito liquidity bundles, and institutional-grade mempool scouting for the modern Solana professional.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4"
          >
            {!connected ? (
              <WalletMultiButton className="!bg-white !text-black !h-14 !px-8 !rounded-2xl !font-black !uppercase !tracking-widest !transition-all hover:!opacity-90 active:!scale-95" />
            ) : !isAuthenticated ? (
              <button
                onClick={login}
                disabled={isAuthenticating}
                className="h-14 px-10 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(168,85,247,0.3)] active:scale-95"
              >
                {isAuthenticating ? 'Authorizing...' : <>Sign Mission Order <ArrowRight size={20} /></>}
              </button>
            ) : (
              <Link href="/dashboard" className="h-14 px-10 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                Access Dashboard <ExternalLink size={20} />
              </Link>
            )}
          </motion.div>
        </div>

        {/* Floating Icons Decoration */}
        <div className="absolute top-[20%] left-[10%] opacity-20 hidden md:block"><Brain size={48} className="text-zinc-500" /></div>
        <div className="absolute bottom-[20%] right-[10%] opacity-20 hidden md:block"><Zap size={48} className="text-zinc-500" /></div>
      </section>

      {/* 2. READONLY FEED PREVIEW */}
      <section className="py-24 bg-[#0a0a18] border-y border-white/5 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-md">
              <h2 className="text-3xl font-black tracking-tight mb-4 uppercase">Live Stream Preview</h2>
              <p className="text-zinc-500 font-medium">A fraction of the RZUNA intelligence pipeline. Secure institutional access to decrypt full narratives.</p>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Mainnet L2 Feed</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {/* Blur Overlay for marketing */}
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div className="w-full h-full bg-transparent backdrop-blur-[4px] border border-white/5 rounded-[40px] flex items-center justify-center">
                 <div className="bg-black/80 border border-white/10 p-8 rounded-[32px] text-center backdrop-blur-xl shadow-2xl pointer-events-auto">
                    <Lock size={48} className="text-cyan-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-black mb-2 uppercase">Deep Narrative Locked</h3>
                    <p className="text-zinc-500 text-sm mb-8 font-medium italic">Subscription required for L2 AI reasoning and real-time execution.</p>
                    <Link 
                      href="#pricing" 
                      onClick={() => posthog.capture('PRICING_VIEW_CLICK', { source: 'signal_blur' })}
                      className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 px-6 py-3 rounded-xl font-bold uppercase tracking-widest transition-all"
                    >
                       See Pricing <ArrowRight size={16} />
                    </Link>
                 </div>
              </div>
            </div>

            {marketingSignals.map((signal) => (
              <TokenCard 
                key={signal.id || signal.event.mint} 
                signal={signal} 
                onConsumeQuota={() => {}} 
                sensorMode={!isAuthenticated}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURE HIGHLIGHTS */}
      <section className="py-32 px-6">
        <div className="text-center mb-20">
          <h2 className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-center">Platform Pillars</h2>
          <h3 className="text-4xl font-bold tracking-tight text-white uppercase">The Intelligence Engine</h3>
        </div>
        <FeatureShowcase />
      </section>

      {/* 4. PRICING SECTION */}
      <section id="pricing" className="py-32 px-6 bg-[#03030a]">
        <div className="text-center mb-20">
          <h2 className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-center">Pricing Strategy</h2>
          <h3 className="text-4xl font-bold tracking-tight text-white uppercase">Secure Institutional Access</h3>
        </div>
        <TierCards onUpgrade={() => {}} />
        
        <p className="text-center text-zinc-600 text-[10px] mt-16 uppercase font-black tracking-[0.3em] max-w-sm mx-auto leading-relaxed opacity-50">
          All payments processed via Jupiter V6 for instant USDC treasury settlement.
        </p>
      </section>

      {/* 5. FOOTER */}
      <footer className="py-20 border-t border-white/5 text-center">
        <h4 className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.5em] mb-6">AIVO.SH // RZUNA V1.6</h4>
        <div className="flex justify-center gap-8 text-zinc-500 font-mono text-xs uppercase tracking-widest">
           <a href="#" className="hover:text-white transition-colors">Documentation</a>
           <a href="#" className="hover:text-white transition-colors">Security Audit</a>
           <a href="#" className="hover:text-white transition-colors">Terms of Op</a>
        </div>
      </footer>
    </main>
  );
}
