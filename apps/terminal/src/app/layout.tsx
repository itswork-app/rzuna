import type { Metadata } from 'next';
import { Instrument_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Toaster } from 'react-hot-toast';

const instrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'RZUNA | Institutional Interface',
  description: 'The front-line terminal for the RZUNA Alpha Protocol.',
};

/**
 * 🏛️ Terminal Layout: The Constitutional Root (Institutional v22.1)
 * Standardized with Sentry, Axiom, and Solana Providers.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${instrument.variable} font-sans antialiased bg-slate-950 text-slate-100 h-full`}>
        <Providers>
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
