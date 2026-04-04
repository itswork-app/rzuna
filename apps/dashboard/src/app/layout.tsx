import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import PrivyWrapper from '@/providers/PrivyProvider';
import { Sidebar } from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RZUNA | Institutional B2B Portal',
  description: 'Advanced Alpha Protocol Dashboard (V22.1)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen flex`}>
        <PrivyWrapper>
          <Sidebar />
          <main className="flex-1 p-8 overflow-y-auto">{children}</main>
        </PrivyWrapper>
      </body>
    </html>
  );
}
