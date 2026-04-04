'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { ReactNode } from 'react';

export default function PrivyWrapper({ children }: { children: ReactNode }) {
  // 🏛️ Canonical RZUNA B2B Auth (V22.1)
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cm2x8zu1a0000000000000000'}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
          logo: 'https://rzuna.io/logo.png',
        },
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
          ethereum: {
            createOnLogin: 'users-without-wallets',
          }
        }
      }}
    >
      {children}
    </PrivyProvider>
  );
}
