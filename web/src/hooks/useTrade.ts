'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface TradeResult {
  signature: string;
  inAmount: number;
  outAmount: number;
  fee: number;
  jitoBundle?: boolean;
}

interface UseTradeReturn {
  executeTrade: (signal: { event: { mint: string } }) => Promise<TradeResult>;
  isExecuting: boolean;
}

/**
 * Trade execution hook for Jito-bundled swaps via backend /trade/swap.
 */
export function useTrade(): UseTradeReturn {
  const { publicKey } = useWallet();
  const [isExecuting, setIsExecuting] = useState(false);

  const executeTrade = useCallback(
    async (signal: { event: { mint: string } }): Promise<TradeResult> => {
      if (!publicKey) throw new Error('Wallet not connected');

      setIsExecuting(true);
      try {
        const res = await fetch(`${API_URL}/trade/swap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            route: { inMint: 'So11111111111111111111111111111111', outMint: signal.event.mint },
            userPublicKey: publicKey.toBase58(),
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error((errData as { error?: string }).error || `Trade failed: ${res.statusText}`);
        }

        const data = (await res.json()) as { result: TradeResult };
        return data.result;
      } finally {
        setIsExecuting(false);
      }
    },
    [publicKey]
  );

  return { executeTrade, isExecuting };
}
