'use client';

import { useEffect, useState } from 'react';
import { TokenCard } from '@/components/TokenCard';
import { TokenSignal, SubscriptionStatus } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Sparkles, ShieldCheck, Zap, Star, Shield } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useProfile } from '@/hooks/useProfile';

export default function VIPChannel() {
  const [signals, setSignals] = useState<TokenSignal[]>([]);
  const { connected, publicKey, sendTransaction } = useWallet();
  const { profile, mutate } = useProfile();
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);

  useEffect(() => {
    const fetchVIPSignals = () => {
      // Mock VIP Signals for the UI demo
      const vipSignals: TokenSignal[] = [
        {
          id: 'vip-1',
          score: 98,
          aiReasoning: {
            narrative: 'Deep institutional liquidity depth and high directional conviction from top-tier traders.',
            confident: 'HIGH'
          },
          event: {
            mint: 'DezXAZ8z7Pnrn9vzct2PrfLvWzoZOAP89TO86UVHjm6',
            signature: 'VIP-SIG-001',
            timestamp: new Date().toISOString(),
            initialLiquidity: 500000,
            socialScore: 99,
            metadata: {
              name: 'BONK',
              symbol: 'BONK'
            }
          }
        }
      ];
      setSignals(vipSignals);
    };

    fetchVIPSignals();
  }, []);

  const handleSubscribe = async (tier: string, priceSOL: number) => {
    if (!connected || !publicKey) return alert('Please connect your wallet first.');
    setIsSubscribing(tier);
    
    try {
      // 🏛️ PR 8: Real Transaction flow for Treasury conversion
      // In a real app, we would send SOL to the treasury wallet here
      // For this demo, we simulate the /subscribe backend call
      console.log(`[Treasury] Routing ${priceSOL} SOL subscription for ${tier}...`);
      
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          tier,
          amountSOL: priceSOL,
          paymentSignature: 'SIMULATED_SIG_' + Math.random().toString(36).slice(2)
        })
      });

      if (response.ok) {
        alert(`Institutional Upgrade Successful: You are now ${tier}!`);
        mutate(); // Refresh reactive profile
      } else {
        throw new Error('Subscription routing failed');
      }
    } catch (err) {
      console.error(err);
      alert('Subscription failed. Ensure you have sufficient SOL for institutional settlement.');
    } finally {
      setIsSubscribing(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans selection:bg-purple-500/30">
      <header className="relative py-16 px-8 text-center mb-12 border border-zinc-800 rounded-[32px] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1)_0%,transparent_70%)]">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-purple-500/10 pointer-events-none">
          <Crown size={140} />
        </div>
        
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-5 py-2 rounded-full mb-6">
          <Crown size={16} className="text-purple-500" />
          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-[0.2em]">Institutional Access</span>
        </div>
        
        <h1 className="text-5xl font-black tracking-tighter mb-4 leading-none">
          Real-time <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">Alpha</span> Intelligence
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-8">
          Dedicated L2 reasoning pipeline and high-conviction signals (Score 90+) delivered with zero latency for institutional subscribers.
        </p>
        
        <div className="flex justify-center gap-8 text-zinc-500 text-sm font-bold tracking-tight">
          <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-green-500" /> Verified Security</div>
          <div className="flex items-center gap-2"><Sparkles size={18} className="text-purple-500" /> AI Optimized</div>
          <div className="flex items-center gap-2"><Zap size={18} className="text-yellow-500" /> Zero Latency</div>
        </div>
      </header>

      {/* 🏛️ PR 8: Treasury-Backed Subscription Tiers */}
      <section className="mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            { id: 'STARLIGHT', name: 'Starlight', price: 0.1, icon: Star, color: 'zinc', perks: ['85+ Signal Access', 'Standard Detection'] },
            { id: 'STARLIGHT_PLUS', name: 'Starlight+', price: 0.25, icon: Shield, color: 'blue', perks: ['90+ Signal Access', 'Priority Notifications', 'Rank Multiplier'] },
            { id: 'VIP', name: 'VIP Alliance', price: 1.0, icon: Crown, color: 'purple', perks: ['L2 AI Reasoning', 'Instant Jito Swaps', 'Private Alpha Channel'] },
          ].map((tier) => (
            <motion.div 
              key={tier.id}
              whileHover={{ y: -5 }}
              className={`relative overflow-hidden bg-zinc-950 border ${profile?.subscription_status === tier.id ? 'border-purple-500' : 'border-zinc-800'} p-8 rounded-[24px] flex flex-col`}
            >
              {profile?.subscription_status === tier.id && (
                <div className="absolute top-4 right-4 bg-purple-500 text-black text-[10px] font-black px-2 py-1 rounded">CURRENT</div>
              )}
              <tier.icon size={32} className={`mb-4 text-${tier.color}-500`} />
              <h3 className="text-2xl font-bold mb-1">{tier.name}</h3>
              <div className="text-4xl font-black mb-6 flex items-baseline gap-1">
                {tier.price} <span className="text-sm font-bold text-zinc-500">SOL/MO</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-zinc-400 text-sm">
                    <div className="w-1 h-1 bg-zinc-700 rounded-full" /> {perk}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleSubscribe(tier.id, tier.price)}
                disabled={isSubscribing !== null || profile?.subscription_status === tier.id}
                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${
                  profile?.subscription_status === tier.id 
                  ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-zinc-200'
                }`}
              >
                {isSubscribing === tier.id ? 'Securing...' : profile?.subscription_status === tier.id ? 'Active' : 'Upgrade Account'}
              </button>
            </motion.div>
          ))}
        </div>
        
        {/* Institutional Settlement Note */}
        <p className="text-center text-zinc-600 text-[10px] mt-8 uppercase font-bold tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
          Institutional Settlement Protocol: <br/> All payments are instantly converted to USDC for treasury stability.
        </p>
      </section>

      {/* Live Signals (Guarded by Subscription) */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-zinc-600 text-xs font-black uppercase tracking-[0.3em]">Institutional Alpha Stream</h2>
          <div className="h-[1px] flex-grow mx-8 bg-zinc-900" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {signals.map((signal) => (
              <TokenCard 
                key={signal.id} 
                signal={signal} 
                onConsumeQuota={() => {}} 
              />
            ))}
          </AnimatePresence>
        </div>

        {signals.length === 0 && (
           <div className="py-20 text-center border-2 border-dashed border-zinc-900 rounded-[32px] text-zinc-600 font-bold uppercase tracking-widest text-sm">
             Calibrating L2 reasoning modules...
           </div>
        )}
      </section>
    </div>
  );
}
