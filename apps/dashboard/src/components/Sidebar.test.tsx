import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';

// 🏛️ Mock Solana Wallet Adapter
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
    connected: true,
    publicKey: { toBase58: () => '0x1234567890abcdef' },
    disconnect: vi.fn(),
    sendTransaction: vi.fn(),
  }),
}));

vi.mock('@solana/wallet-adapter-react-ui', () => ({
  useWalletModal: () => ({
    setVisible: vi.fn(),
  }),
  WalletMultiButton: () => <button>Connect Wallet</button>,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Dashboard Sidebar', () => {
  it('renders the sidebar navigation items', () => {
    render(<Sidebar />);
    expect(screen.getByText(/RZUNA/i)).toBeInTheDocument();
    expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/API Keys/i)).toBeInTheDocument();
  });

  it('displays the truncated wallet address in the account section', () => {
    render(<Sidebar />);
    // Mock address: 0x1234567890abcdef -> 0x1234...cdef (slice(0,6)...slice(-4))
    expect(screen.getByText(/0x1234...cdef/i)).toBeInTheDocument();
  });

  it('renders the disconnect button', () => {
    render(<Sidebar />);
    expect(screen.getByText(/Disconnect/i)).toBeInTheDocument();
  });
});
