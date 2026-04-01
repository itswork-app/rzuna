'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import posthog from 'posthog-js';
import * as Sentry from "@sentry/nextjs";
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  login: () => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, disconnect, connected } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // SIWS logic: Reset auth if wallet disconnects
  useEffect(() => {
    if (!connected) {
      setIsAuthenticated(false);
    }
  }, [connected]);

  // Route Guard: Eject from dashboard if not authenticated
  useEffect(() => {
    const isDashboard = pathname?.startsWith('/dashboard');
    if (isDashboard && !isAuthenticated && !isAuthenticating) {
      // In a real app, we might want to check if a valid session exists in cookies/storage
      // For PR 10, we enforce SIWS for dashboard access.
      console.warn('[SIWS] Guard: Ejecting unauthenticated user from dashboard');
      router.push('/');
    }
  }, [pathname, isAuthenticated, isAuthenticating, router]);

  const login = useCallback(async () => {
    if (!publicKey || !signMessage) return false;

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
        return true;
      }
      return false;
    } catch (err) {
      console.error('[SIWS] Authentication failed:', err);
      Sentry.captureException(err, {
        tags: { type: 'siws_auth_failure' },
        extra: { wallet: publicKey?.toBase58() }
      });
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [publicKey, signMessage]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    disconnect();
    router.push('/');
  }, [disconnect, router]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthenticating, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
