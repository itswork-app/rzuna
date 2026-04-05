import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mocking Next.js router and other institutional hooks
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
    connected: true,
    publicKey: { toBase58: () => '0x123' },
    disconnect: vi.fn(),
    sendTransaction: vi.fn(),
  }),
}));

vi.mock('@solana/wallet-adapter-react-ui', () => ({
  useWalletModal: () => ({
    setVisible: vi.fn(),
  }),
  WalletMultiButton: () => 'Connect Wallet',
}));
