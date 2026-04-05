'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import React, { useState, useEffect } from 'react';
import {
  Zap,
  ShieldCheck,
  TrendingUp,
  Globe,
  ArrowRight,
  Plus,
  Key,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

/**
 * 🏛️ Dashboard Landing: Institutional Entry (v22.1)
 */
export default function LandingPage() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  // Cast Icons for React 19 compatibility
  const ZapIcon = Zap as any;
  const ShieldIcon = ShieldCheck as any;
  const TrendingIcon = TrendingUp as any;
  const GlobeIcon = Globe as any;
  const ArrowIcon = ArrowRight as any;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-500 font-bold text-xs mb-10 tracking-widest uppercase animate-fade-in">
          <ZapIcon className="w-3.5 h-3.5 fill-current" /> Institutional Alpha Access
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 bg-linear-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
          The Hub for <br /> B2B Intelligence.
        </h1>

        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          RZUNA provides liquidity providers and institutional traders with high-fidelity alpha
          signals and automated execution primitives.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setVisible(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 text-lg"
          >
            Launch Dashboard <ArrowIcon className="w-5 h-5" />
          </button>
          <a
            href="https://docs.rzuna.com"
            target="_blank"
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-4 px-10 rounded-2xl border border-slate-800 transition-all active:scale-95 text-lg"
          >
            Read Documentation
          </a>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            {
              title: 'AIVO Protocol',
              desc: 'High-frequency signal processing with sub-ms latency.',
              icon: ZapIcon,
            },
            {
              title: 'Bank-Grade Security',
              desc: 'Encrypted API keys with tiered permissioning.',
              icon: ShieldIcon,
            },
            {
              title: 'Deep Liquidity',
              desc: 'Optimized routing across all major Solana DEXes.',
              icon: TrendingIcon,
            },
          ].map((feature, i) => (
            <div key={i} className="p-6 bg-slate-900/50 border border-slate-800/50 rounded-2xl">
              <div className="bg-blue-600/10 p-3 rounded-xl text-blue-500 w-fit mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
