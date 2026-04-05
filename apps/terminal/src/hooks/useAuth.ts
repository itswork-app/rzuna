'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

/**
 * 🔐 Institutional SIWS Auth Hook (v22.3)
 * Implements the Connect -> Sign -> Engine Signature flow.
 */
export function useAuth() {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const [user, setUser] = useState<{ publicKey: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async () => {
    if (!publicKey || !signMessage) return;

    try {
      setIsLoading(true);
      const message = `🛡️ RZUNA Institutional Authorization: ${new Date().toISOString()}`;
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);
      const signatureBase58 = bs58.encode(signature);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: publicKey.toBase58(),
          signature: signatureBase58,
          message,
        }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setUser({ publicKey: publicKey.toBase58() });
      } else {
        throw new Error('🛡️ Signature verification failed at Engine gateway');
      }
    } catch (error) {
      console.error('🛡️ [Auth] SIWS Login failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signMessage]);

  // Logout handles both wallet and session disposal
  const logout = useCallback(async () => {
    await disconnect();
    setIsAuthenticated(false);
    setUser(null);
  }, [disconnect]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    connected,
  };
}
