'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import posthog from 'posthog-js';
import * as Sentry from "@sentry/nextjs";

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

    posthog.capture('SIWS_SIGN_ATTEMPT', { wallet: publicKey.toBase58() });
    setIsAuthenticating(true);
    try {
      const message = new TextEncoder().encode(
        `rzuna institutional access\nWallet: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`
      );
      const signature = await signMessage(message);

      if (signature) {
        setIsAuthenticated(true);
        posthog.capture('SIWS_SIGN_SUCCESS', { wallet: publicKey.toBase58() });
      }
    } catch (err) {
      console.error('[SIWS] Authentication failed:', err);
      Sentry.captureException(err, {
        tags: { type: 'siws_auth_failure' },
        extra: { wallet: publicKey?.toBase58() }
      });
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
