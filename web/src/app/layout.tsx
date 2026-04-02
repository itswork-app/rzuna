import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WalletContextProvider } from '@/components/WalletContextProvider';
import { PostHogProvider } from '@/components/PostHogProvider';
import { AxiomWebVitals } from 'next-axiom';

import { AuthProvider } from '@/components/AuthProvider';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';

import { Toaster } from 'react-hot-toast';
import { Refine } from '@refinedev/core';
import routerProvider from '@refinedev/nextjs-router';
import { dataProvider } from '@/providers/dataProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'rzuna — Institutional AI Alpha',
  description: 'The narrative scarcity engine for the Solana high-stakes market.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GlobalErrorBoundary>
          <WalletContextProvider>
            <PostHogProvider>
              <AuthProvider>
                <Refine
                  dataProvider={dataProvider}
                  routerProvider={routerProvider}
                  options={{
                    syncWithLocation: true,
                    warnWhenUnsavedChanges: true,
                  }}
                >
                  {children}
                </Refine>
              </AuthProvider>
              <Toaster 
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: '#0a0a18',
                    color: '#fff',
                    border: '1px solid rgba(6,182,212,0.2)',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                  },
                }}
              />
              <AxiomWebVitals />
            </PostHogProvider>
          </WalletContextProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
