'use client';

import React, { useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useTrade } from '@/hooks/useTrade';
import { useWallet } from '@solana/wallet-adapter-react';

interface TokenSignal {
  id: string;
  score: number;
  aiReasoning?: {
    narrative: string;
    confident: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  event: {
    mint: string;
    signature: string;
    timestamp: string;
    initialLiquidity: number;
    socialScore: number;
    metadata?: {
      name: string;
      symbol: string;
    };
  };
}

export function TokenCard({ signal, onConsumeQuota }: { signal: TokenSignal, onConsumeQuota: () => void }) {
  const [isReasoningVisible, setIsReasoningVisible] = useState(false);
  const { executeTrade, isExecuting } = useTrade();
  const { connected } = useWallet();

  const handleBuy = async () => {
    if (!connected) return alert('Please connect wallet first.');
    try {
      const result = await executeTrade(signal);
      console.log('Trade result:', result);
      alert(`Institutional Trade Initialized: ${result.signature?.slice(0, 8)}...`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Unknown error');
      alert(`Trade failed: ${message}`);
    }
  };

  return (
    <div className="bg-[#1a1a2e] border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/50 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
            {signal.event.metadata?.name || 'Unknown Token'}
          </h3>
          <p className="text-gray-400 text-sm font-mono">{signal.event.mint.slice(0, 6)}...{signal.event.mint.slice(-4)}</p>
        </div>
        <div className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-sm font-bold border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
          Score: {signal.score}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/30 p-3 rounded-lg border border-white/5">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1 font-bold">Liquidity</p>
          <p className="text-white font-mono text-sm">${signal.event.initialLiquidity?.toFixed(2)}</p>
        </div>
        <div className="bg-black/30 p-3 rounded-lg border border-white/5">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1 font-bold">Socials</p>
          <p className="text-white font-mono text-sm">{signal.event.socialScore}%</p>
        </div>
      </div>

      {isReasoningVisible ? (
        <div className="mb-6 p-4 bg-black/40 rounded-lg border border-cyan-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-gray-300 text-sm italic leading-relaxed">
            &quot;{signal.aiReasoning?.narrative}&quot;
          </p>
        </div>
      ) : (
        <button
          onClick={() => {
            onConsumeQuota();
            setIsReasoningVisible(true);
          }}
          className="w-full mb-6 py-2 rounded-lg bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
        >
          Reveal AI Reasoning (-1 Quota)
        </button>
      )}

      <div className="flex gap-3">
        <button 
          onClick={handleBuy}
          disabled={isExecuting}
          className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-white py-3 rounded-lg font-bold transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] transform active:scale-95 flex items-center justify-center gap-2"
        >
          {isExecuting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Institutional Buy (Jito)'}
        </button>
        <a
          href={`https://solscan.io/token/${signal.event.mint}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all group"
        >
          <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </a>
      </div>
    </div>
  );
}
