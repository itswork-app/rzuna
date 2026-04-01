'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TokenSignal as Signal } from '@/types';
import '@solana/wallet-adapter-react-ui/styles.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';



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

  const fetchSignals = useCallback(async () => {
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
  }, [publicKey]);

  useEffect(() => {
    void fetchSignals();
  }, [publicKey, fetchSignals]);

  return { signals, isLoading, error, refetch: fetchSignals };
}
