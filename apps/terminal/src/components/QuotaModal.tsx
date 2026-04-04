'use client';

import React from 'react';
import { X, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

interface QuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuotaModal({ isOpen, onClose }: QuotaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-[#0a0a18] border border-cyan-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mb-6 border border-cyan-500/40">
            <Zap className="text-cyan-400 w-8 h-8 animate-pulse" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Daily AI Quota Exhausted</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Your institutional-grade reasoning limit has been reached for today. 
            Upgrade to <span className="text-cyan-400 font-bold">VIP Dedicated Infrastructure</span> for unlimited access and gRPC performance.
          </p>

          <div className="w-full space-y-3 mb-8">
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <ShieldCheck className="text-cyan-400 w-5 h-5 shrink-0" />
              <p className="text-gray-300 text-xs text-left">Unlimited AI Narratives & Scoring</p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <Zap className="text-cyan-400 w-5 h-5 shrink-0" />
              <p className="text-gray-300 text-xs text-left">Dedicated gRPC Endpoints (0ms Latency)</p>
            </div>
          </div>

          <a 
            href="/vip"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(8,145,178,0.4)]"
          >
            Upgrade to VIP Status
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          
          <button 
            onClick={onClose}
            className="mt-4 text-gray-500 text-xs hover:text-gray-300 transition-colors"
          >
            Stay on current tier
          </button>
        </div>
      </div>
    </div>
  );
}
