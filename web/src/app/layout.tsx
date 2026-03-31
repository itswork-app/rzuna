import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "rzuna | Institutional Solana Scouting",
  description: "Advanced AI-driven alpha detection and real-time narrative analysis for Solana ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="animate-fade-in">
        <nav className="glass-nav">
          <div className="container" style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px' }}></div>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>rzuna</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <a href="#" className="nav-link" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</a>
              <a href="#" className="nav-link" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none' }}>VIP Alpha</a>
              <div style={{ height: '32px', width: '1px', background: 'var(--card-border)' }}></div>
              <button style={{ 
                background: 'var(--primary)', 
                color: '#fff', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '8px', 
                fontSize: '0.875rem', 
                fontWeight: 600,
                cursor: 'pointer'
              }}>
                Connect Wallet
              </button>
            </div>
          </div>
        </nav>
        <main className="container" style={{ paddingTop: '40px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
