'use client';

import React, { ReactNode } from 'react';
import { WalletContextProvider } from './WalletContextProvider';
import { SafeTelemetry } from './SafeTelemetry';
import { AuthProvider } from './AuthProvider';
import { GlobalErrorBoundary } from './GlobalErrorBoundary';
import { RefineProvider } from './RefineProvider';

/**
 * 🏛️ The Institutional Provider Bundle (v22.1)
 * Consolidates all necessary context providers for the RZUNA Terminal.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <GlobalErrorBoundary>
      <WalletContextProvider>
        <SafeTelemetry>
          <AuthProvider>
            <RefineProvider>{children}</RefineProvider>
          </AuthProvider>
        </SafeTelemetry>
      </WalletContextProvider>
    </GlobalErrorBoundary>
  );
}
