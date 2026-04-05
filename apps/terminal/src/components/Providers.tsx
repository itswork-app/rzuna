'use client';

import React, { ReactNode } from 'react';
import { WalletContextProvider } from './WalletContextProvider';
import { SafeTelemetry } from './SafeTelemetry';
import { GlobalErrorBoundary } from './GlobalErrorBoundary';

/**
 * 🏛️ The Institutional Provider Bundle (v22.1)
 * Consolidates all necessary context providers for the RZUNA Terminal.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <GlobalErrorBoundary>
      <WalletContextProvider>
        <SafeTelemetry>{children}</SafeTelemetry>
      </WalletContextProvider>
    </GlobalErrorBoundary>
  );
}
