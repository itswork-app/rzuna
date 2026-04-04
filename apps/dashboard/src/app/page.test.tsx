import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Page from './page';

// 🏛️ Mock Privy Auth
vi.mock('@privy-io/react-auth', () => ({
  usePrivy: () => ({
    authenticated: true,
    user: { wallet: { address: '0x1234567890abcdef' } },
    login: vi.fn(),
    logout: vi.fn(),
    ready: true,
  }),
}));

describe('Institutional Dashboard (The Alpha)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the core dashboard components', async () => {
    render(<Page />);
    expect(await screen.findByText(/Developer Overview/i)).toBeInTheDocument();
  });

  it('shows the API key generation modal on click', async () => {
    render(<Page />);
    const generateBtn = await screen.findByText(/Generate API Key/i);
    fireEvent.click(generateBtn);

    expect(await screen.findByText(/Key Name/i)).toBeInTheDocument();
  });

  it('simulates historical usage data rendering', async () => {
    render(<Page />);
    // Stats loaded from default state in Task 4 mockup
    expect(await screen.findByText(/840,291/i)).toBeInTheDocument();
    expect(screen.getByText(/45,200/i)).toBeInTheDocument();
  });
});
