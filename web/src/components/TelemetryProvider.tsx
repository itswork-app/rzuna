'use client';

import React, { useEffect, useMemo } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { AxiomWebVitals } from 'next-axiom';
import { useWallet } from '@solana/wallet-adapter-react';

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet();

  useMemo(() => {
    if (typeof window !== 'undefined') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || '', {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false,
      });
    }
  }, []);

  useEffect(() => {
    if (publicKey && typeof window !== 'undefined') {
      posthog.identify(publicKey.toBase58(), {
        wallet: publicKey.toBase58(),
        type: 'institutional_user',
      });
    } else if (typeof window !== 'undefined') {
      posthog.reset();
    }
  }, [publicKey]);

  return (
    <PHProvider client={posthog}>
      {/* 🏛️ PR 18: Safeguard Axiom Prerendering */}
      {typeof window !== 'undefined' && <AxiomWebVitals />}
      {children}
    </PHProvider>
  );
}
