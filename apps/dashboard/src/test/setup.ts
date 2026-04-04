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

vi.mock('@privy-io/react-auth', () => ({
  usePrivy: () => ({
    authenticated: true,
    user: { wallet: { address: '0x123' } },
    login: vi.fn(),
    logout: vi.fn(),
    ready: true,
  }),
}));
