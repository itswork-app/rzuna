'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || '', {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // Handled manually for SPA navigation
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet();

  useEffect(() => {
    if (publicKey) {
      posthog.identify(publicKey.toBase58(), {
        wallet: publicKey.toBase58(),
        type: 'institutional_user',
      });
    } else {
      posthog.reset();
    }
  }, [publicKey]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
