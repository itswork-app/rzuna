'use client';

import React from 'react';
import { ShieldCheck, Lock, ArrowRight, Loader2, Zap, Brain, Tally2, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSignals } from '@/hooks/useSignals';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { TokenCard } from '@/components/TokenCard';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { UserStats } from '@/components/UserStats';
import { TelegramSettings } from '@/components/TelegramSettings';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const { isAuthenticated, isAuthenticating, login, logout } = useAuth();
  const { signals, isLoading: signalsLoading } = useSignals();
  const { profile, isLoading: profileLoading, mutate } = useProfile();
  const isVipDomain = typeof window !== 'undefined' && window.location.hostname.includes('vip');
  const isTradeDomain = typeof window !== 'undefined' && window.location.hostname.includes('trade');
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
      <main className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#0a0a10] border border-white/5 rounded-3xl p-10 text-center shadow-3xl backdrop-blur-3xl"
        >
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Lock className="w-10 h-10 text-white/40" />
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">Connection Locked</h1>
          <p className="text-muted-foreground mb-10 leading-relaxed font-medium">
            Institutional credentials required. Initialize your wallet session to sync with the rzuna intelligence stream.
          </p>
          <div className="flex justify-center flex-col gap-4">
            <WalletMultiButton className="!bg-white !text-black !hover:opacity-90 !transition-all !h-14 !rounded-2xl !font-black !w-full !justify-center !uppercase !tracking-widest" />
          </div>
        </motion.div>
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
    <main className="min-h-screen bg-[#050508] text-gray-100 p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* COMMAND CENTER HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 pb-8 border-b border-white/5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="institutional" className="bg-white/10 text-white animate-pulse">
                System Live
              </Badge>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">AIVO // RZUNA CORE 1.6</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white leading-none">
              COMMAND <br />
              <span className="text-white/40">CENTER</span>
            </h1>
          </div>

          <Card className="bg-white/[0.02] border-white/10 w-full lg:w-fit">
            <CardContent className="p-4 flex flex-col md:flex-row items-center gap-6">
              <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                   <Activity className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Active Link</p>
                  <p className="text-xs font-mono text-white">{publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <WalletMultiButton className="!bg-white/5 hover:!bg-white/10 !transition-all !h-11 !rounded-xl !text-[10px] !font-black !border !border-white/10 !uppercase !tracking-widest" />
                <Button variant="destructive" size="sm" onClick={logout} className="h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]">
                  Kill Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </header>
 
        {/* REAL-TIME NEXUS STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <Card className="bg-white/[0.01]">
                <CardContent className="p-6">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">Alpha Capacity</p>
                    <div className="flex items-end justify-between">
                         <h2 className="text-4xl font-black text-white">{profile?.quota || 0}</h2>
                         <Zap className="w-5 h-5 text-white/20 mb-1" />
                    </div>
                </CardContent>
             </Card>
             <Card className="bg-white/[0.01]">
                <CardContent className="p-6">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">Institutional Tier</p>
                    <div className="flex items-end justify-between">
                         <h2 className="text-4xl font-black text-white uppercase">{profile?.rank || 'BASE'}</h2>
                         <ShieldCheck className="w-5 h-5 text-white/20 mb-1" />
                    </div>
                </CardContent>
             </Card>
             <Card className="bg-white/[0.01]">
                <CardContent className="p-6">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">Jito Volume</p>
                    <div className="flex items-end justify-between">
                         <h2 className="text-4xl font-black text-white">${(profile?.current_month_volume || 0).toLocaleString()}</h2>
                         <Tally2 className="w-5 h-5 text-white/20 mb-1" />
                    </div>
                </CardContent>
             </Card>
             <Card className="bg-white/[0.01] border-white/20">
                <CardContent className="p-6">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-2">Narrative Steam</p>
                    <div className="flex items-end justify-between">
                         <h2 className="text-4xl font-black text-white">{signals.length}</h2>
                         <Brain className="w-5 h-5 text-white animate-pulse mb-1" />
                    </div>
                </CardContent>
             </Card>
        </div>

        {/* SIGNAL STREAM SECTION */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tighter uppercase">Intelligence Stream</h2>
            <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">MemPool Syncing</span>
            </div>
          </div>

          {signalsLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white/[0.01] border border-white/5 rounded-[40px]">
              <Loader2 className="w-16 h-16 text-white/20 animate-spin" />
              <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.5em] animate-pulse">Syncing Narrative Data</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <div className="text-center py-32 bg-white/[0.01] rounded-[40px] border border-dashed border-white/10">
              <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em]">No High-Conviction Signals Detected</p>
              <p className="text-white/20 text-[10px] mt-4 uppercase font-bold tracking-widest italic">System idling in tactical observation mode.</p>
            </div>
          )}
        </div>

        {/* SYSTEM SETTINGS FOOTER */}
        <footer className="pt-24 border-t border-white/5 flex flex-col md:flex-row justify-between gap-12 pb-20">
             <div className="max-w-md">
                <h3 className="text-lg font-black uppercase tracking-widest mb-4">Tactical Comms</h3>
                <TelegramSettings profile={profile} onUpdate={mutate} />
             </div>
             <div className="text-right flex flex-col justify-end">
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-2">Institutional Clearance Verified</p>
                 <p className="text-xs font-mono text-white/40">RZUNA_NEXUS_V1.6 // ENCRYPTED_LINK_ESTABLISHED</p>
             </div>
        </footer>
      </div>
    </main>
  );
}
