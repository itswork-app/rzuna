import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WalletContextProvider } from '@/components/WalletContextProvider';
import { SafeTelemetry } from '@/components/SafeTelemetry';

import { AuthProvider } from '@/components/AuthProvider';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { RefineProvider } from '@/components/RefineProvider';
import { Toaster } from 'react-hot-toast';

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
            <SafeTelemetry>
              <AuthProvider>
                <RefineProvider>
                  {children}
                </RefineProvider>
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
            </SafeTelemetry>
          </WalletContextProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
