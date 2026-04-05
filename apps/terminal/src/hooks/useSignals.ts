'use client';

import { useState, useEffect } from 'react';
import { TokenSignal as Signal } from '@rzuna/contracts';
import { getApiUrl } from '@/lib/env';

interface UseSignalsReturn {
  signals: Signal[];
  isLoading: boolean;
  error: string | null;
}

/**
 * ⚡ Institutional Signal Stream (v22.3)
 * Consumes real-time Alpha signals via WebSocket for sub-100ms delivery.
 */
export function useSignals(): UseSignalsReturn {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let isMounted = true;

    const initializeSocket = () => {
      try {
        const wsUrl = getApiUrl().replace('http', 'ws') + '/ws/signals';
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          if (isMounted) {
            console.info('🛡️ [Signals] WebSocket Connected');
            setIsLoading(false);
          }
        };

        socket.onmessage = (event) => {
          if (isMounted) {
            const message = JSON.parse(event.data);
            if (message.type === 'SIGNAL_UPDATE') {
              setSignals((prev) => [message.data, ...prev].slice(0, 50));
            }
          }
        };

        socket.onerror = (err) => {
          if (isMounted) {
            console.error('🛡️ [Signals] WebSocket Error:', err);
            setError('Signal stream connection failed');
          }
        };

        socket.onclose = () => {
          if (isMounted) {
            console.info('🛡️ [Signals] WebSocket Disconnected');
          }
        };
      } catch (e) {
        if (isMounted) {
          console.error('🛡️ [Signals] Initialization failed:', e);
          setError('Failed to initialize signal stream');
          setIsLoading(false);
        }
      }
    };

    initializeSocket();

    return () => {
      isMounted = false;
      socket?.close();
    };
  }, []);

  return { signals, isLoading, error };
}
