'use client';

import React from 'react';
import { ShieldCheck, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSignals } from '@/hooks/useSignals';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { TokenCard } from '@/components/TokenCard';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { UserStats } from '@/components/UserStats';
import { TelegramSettings } from '@/components/TelegramSettings';

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const { isAuthenticated, isAuthenticating, login, logout } = useAuth();
  const { signals, isLoading: signalsLoading } = useSignals();
  const { profile, isLoading: profileLoading, mutate } = useProfile();
  const supabase = createClient();

  const handleConsumeQuota = async () => {
    if (!publicKey) return;
    
    // Decrement quota in DB atomically
    await supabase.rpc('consume_quota', { 
      user_wallet: publicKey.toBase58() 
    });
  };

  // 1. Connection Gate
  if (!connected) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent">
        <div className="max-w-md w-full bg-[#1a1a2e] border border-cyan-500/20 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-tighter">UNAUTHORIZED ACCESS</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Institutional credentials required. Connect your soul-bound Solana wallet to access the rzuna alpha stream.
          </p>
          <div className="flex justify-center flex-col gap-4">
            <WalletMultiButton className="!bg-cyan-600 hover:!bg-cyan-500 !transition-all !h-14 !rounded-xl !font-bold !w-full !justify-center" />
          </div>
        </div>
      </main>
    );
  }

  // 2. Authentication (SIWS) Gate
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1a1a2e] border border-purple-500/20 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-tighter">VERIFY OWNERSHIP</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Sign a secure message (SIWS) to verify you are the legitimate owner of this institutional wallet.
          </p>
          <button
            onClick={login}
            disabled={isAuthenticating}
            className="w-full h-14 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            {isAuthenticating ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Sign Mission Order <ArrowRight className="w-5 h-5" /></>}
          </button>
        </div>
      </main>
    );
  }

  // 3. Main Dashboard
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-100 p-4 md:p-8 lg:p-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-cyan-600 mb-2">
              RZUNA INSTITUTIONAL
            </h1>
            <p className="text-gray-500 font-mono text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Mainnet Scouting Active
            </p>
          </div>
          <div className="flex items-center gap-4 bg-[#1a1a2e] p-2 rounded-xl border border-white/5">
            <div className="hidden md:block px-4">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Active Address</p>
              <p className="text-xs font-mono text-cyan-400">{publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}</p>
            </div>
            <WalletMultiButton className="!bg-white/5 hover:!bg-white/10 !transition-all !h-10 !rounded-lg !text-sm !font-bold !border !border-white/10" />
            <button 
              onClick={logout}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-all"
            >
              Log Out
            </button>
          </div>
        </header>
 
        <UserStats profile={profile} isLoading={profileLoading} />
 
        <div className="mb-8">
          <TelegramSettings profile={profile} onUpdate={mutate} />
        </div>

        <div className="mb-8 flex justify-between items-end">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            Alpha Signal Feed
            <span className="text-xs font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">
              {signals.length} Active
            </span>
          </h2>
        </div>

        {signalsLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
            <p className="text-gray-500 font-mono animate-pulse">Scanning Solana mempools for alpha...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {signals.map((signal) => (
              <TokenCard 
                key={signal.id} 
                signal={signal} 
                onConsumeQuota={() => handleConsumeQuota()} 
              />
            ))}
          </div>
        )}

        {signals.length === 0 && !signalsLoading && (
          <div className="text-center py-24 bg-[#1a1a2e]/50 rounded-2xl border border-dashed border-white/10">
            <p className="text-gray-500 font-medium">No high-conviction signals detected currently.</p>
            <p className="text-gray-600 text-sm mt-1">System is idling, waiting for the next narrative arc.</p>
          </div>
        )}
      </div>
    </main>
  );
}
