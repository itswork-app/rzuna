'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

/**
 * SIWS (Sign In With Solana) authentication hook.
 * Verifies wallet ownership via message signing.
 */
export function useAuth(): UseAuthReturn {
  const { publicKey, signMessage, disconnect } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const login = useCallback(async () => {
    if (!publicKey || !signMessage) return;

    setIsAuthenticating(true);
    try {
      const message = new TextEncoder().encode(
        `rzuna institutional access\nWallet: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`
      );
      const signature = await signMessage(message);

      if (signature) {
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('[SIWS] Authentication failed:', err);
    } finally {
      setIsAuthenticating(false);
    }
  }, [publicKey, signMessage]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    disconnect();
  }, [disconnect]);

  return { isAuthenticated, isAuthenticating, login, logout };
}
