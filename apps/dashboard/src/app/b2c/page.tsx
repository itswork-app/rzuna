// @ts-nocheck
'use client';

import { usePrivy } from '@privy-io/react-auth';
import { ShieldCheck, ArrowRight, Activity, Zap } from 'lucide-react';
import Link from 'next/link';

export default function B2CTraderPage() {
  const { login, authenticated, ready } = usePrivy();

  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center mb-8 animate-pulse text-green-500">
          <Activity className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4 bg-linear-to-br from-white to-slate-400 bg-clip-text text-transparent">
          Retail Trader Portal (B2C)
        </h1>
        <p className="text-slate-400 max-w-md mb-10 text-lg leading-relaxed">
          Access institutional-grade Alpha Signals directly to your wallet.
        </p>
        <button
          onClick={login}
          className="bg-green-600 hover:bg-green-500 text-white font-semibold py-4 px-10 rounded-xl transition-all shadow-lg shadow-green-600/20 active:scale-95 flex items-center gap-2 text-lg"
        >
          Connect Wallet <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 mb-2">
            Trader Dashboard
          </h1>
          <p className="text-slate-400">
            Real-time market intelligence and auto-sniping configuration.
          </p>
        </div>
      </header>

      <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl text-center shadow-lg">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
          <Zap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Awaiting Signals...</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-8">
          Your wallet is connected. The RZUNA Intelligence Engine is constantly scanning Pump.fun
          for new high-probability tokens. They will appear here instantly.
        </p>

        <Link
          href="/b2b"
          className="text-blue-500 hover:text-blue-400 font-medium underline underline-offset-4"
        >
          Need programmatic API access? Go to Developer Portal (B2B)
        </Link>
      </div>
    </div>
  );
}
