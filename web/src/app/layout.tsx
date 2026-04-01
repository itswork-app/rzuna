import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WalletContextProvider } from '@/components/WalletContextProvider';
import { PostHogProvider } from '@/components/PostHogProvider';
import { AxiomWebVitals } from 'next-axiom';

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
        <WalletContextProvider>
          <PostHogProvider>
            {children}
            <AxiomWebVitals />
          </PostHogProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
