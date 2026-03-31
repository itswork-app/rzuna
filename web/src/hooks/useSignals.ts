'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Signal {
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

interface UseSignalsReturn {
  signals: Signal[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches tier-filtered alpha signals from the backend /signals endpoint.
 */
export function useSignals(): UseSignalsReturn {
  const { publicKey } = useWallet();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/signals?wallet=${publicKey.toBase58()}`);
      if (!res.ok) throw new Error(`Signal fetch failed: ${res.statusText}`);

      const data = await res.json();
      setSignals(data.signals || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[SIGNALS]', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSignals();
  }, [publicKey]);

  return { signals, isLoading, error, refetch: fetchSignals };
}
