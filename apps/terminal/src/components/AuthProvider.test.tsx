import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/vitest';
import { AuthProvider, useAuthContext } from './AuthProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter, usePathname } from 'next/navigation';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Institutional Mocking Strategy
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock('posthog-js', () => ({
  default: { capture: vi.fn() },
}));

const TestComponent = () => {
  const { isAuthenticated, login, logout } = useAuthContext();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Unauthenticated'}</div>
      <button onClick={login}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthProvider (Institutional)', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<
      typeof useRouter
    >);
    vi.mocked(usePathname).mockReturnValue('/dashboard');
  });

  it('provides authentication status to children', () => {
    vi.mocked(useWallet).mockReturnValue({ connected: false } as unknown as ReturnType<
      typeof useWallet
    >);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
  });

  it('performs SIWS login and sets institutional domain cookie', async () => {
    const signMessage = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      publicKey: { toBase58: () => 'WALLET123' },
      signMessage,
    } as unknown as ReturnType<typeof useWallet>);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });

    expect(signMessage).toHaveBeenCalled();
    expect(document.cookie).toContain('x-rzuna-authenticated=true');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
  });

  it('ejects unauthenticated users from dashboard', () => {
    vi.mocked(useWallet).mockReturnValue({ connected: false } as unknown as ReturnType<
      typeof useWallet
    >);
    vi.mocked(usePathname).mockReturnValue('/dashboard');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('performs logout and clears institutional session', () => {
    const disconnect = vi.fn();
    vi.mocked(useWallet).mockReturnValue({ connected: true, disconnect } as unknown as ReturnType<
      typeof useWallet
    >);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const logoutButton = screen.getByText('Logout');
    act(() => {
      logoutButton.click();
    });

    expect(disconnect).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/');
    expect(document.cookie).toContain('x-rzuna-authenticated=');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
  });
});
