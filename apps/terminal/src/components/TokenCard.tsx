import React, { useState } from 'react';
import { ExternalLink, Loader2, Brain, Zap, ArrowRight } from 'lucide-react';
import { useTrade } from '@/hooks/useTrade';
import { useWallet } from '@solana/wallet-adapter-react';
import posthog from 'posthog-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

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

export function TokenCard({
  signal,
  onConsumeQuota,
  sensorMode = false,
}: {
  signal: TokenSignal;
  onConsumeQuota: () => void;
  sensorMode?: boolean;
}) {
  const [isReasoningVisible, setIsReasoningVisible] = useState(false);
  const { executeTrade, isExecuting } = useTrade();
  const { connected } = useWallet();

  const handleBuy = async () => {
    if (!connected) return alert('Please connect wallet first.');
    try {
      posthog.capture('INSTITUTIONAL_BUY_CLICK', {
        mint: signal.event.mint,
        symbol: signal.event.metadata?.symbol,
      });
      const result = await executeTrade(signal);
      console.log('Trade result:', result);
      alert(`Institutional Trade Initialized: ${result.signature?.slice(0, 8)}...`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error';
      alert(`Trade failed: ${message}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={sensorMode ? 'opacity-70 grayscale-[0.3]' : ''}
    >
      <Card className="relative overflow-hidden group border-white/10 bg-[#0a0a0f]/80 backdrop-blur-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-white group-hover:text-shadow-silver transition-all">
              {signal.event.metadata?.name || 'Unknown Token'}
            </CardTitle>
            {sensorMode ? (
              <Badge variant="institutional" className="bg-white/10 text-white/40">
                Identity Masked
              </Badge>
            ) : (
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
                {signal.event.mint.slice(0, 12)}...
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge
              variant="institutional"
              className="bg-white/5 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              {signal.score}
            </Badge>
            <span className="text-[8px] uppercase font-black text-muted-foreground tracking-[0.2em]">
              Alpha Score
            </span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                Liquidity
              </p>
              <div className="flex items-center gap-2">
                <Zap size={10} className="text-white/40" />
                <p className="text-xs font-mono text-white">
                  ${signal.event.initialLiquidity?.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                Social Pulse
              </p>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs font-mono text-white">{signal.event.socialScore}%</p>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isReasoningVisible ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-white/[0.03] border border-white/10 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={12} className="text-white/60" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
                    L2 Reasoning
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 italic leading-relaxed">
                  &quot;{signal.aiReasoning?.narrative}&quot;
                </p>
              </motion.div>
            ) : (
              <Button
                variant="institutional"
                className="w-full mb-6 h-10 text-[9px] hover:bg-white/10"
                onClick={() => {
                  posthog.capture('REVEAL_REASONING_CLICK', { mint: signal.event.mint });
                  onConsumeQuota();
                  setIsReasoningVisible(true);
                }}
              >
                Decrypt Intelligence Nexus (-1)
              </Button>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <Button
              variant="default"
              size="lg"
              onClick={handleBuy}
              disabled={isExecuting}
              className="flex-1 bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-[10px] rounded-xl group/btn"
            >
              {isExecuting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Institutional Buy{' '}
                  <ArrowRight
                    size={14}
                    className="group-hover/btn:translate-x-1 transition-transform"
                  />
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              asChild
              className="w-12 h-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10"
            >
              <a
                href={`https://solscan.io/token/${signal.event.mint}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 text-white/60" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
