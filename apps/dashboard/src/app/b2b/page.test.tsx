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

// 🏛️ Mock Server Actions
vi.mock('./actions', () => ({
  syncUserAction: vi.fn().mockResolvedValue({ success: true, userId: 'mock-user-123' }),
  fetchDashboardStateAction: vi.fn().mockResolvedValue({
    success: true,
    state: {
      apiKeys: [{ name: 'Test Key', key: 'aivo_...123', status: 'Active' }],
      usageStats: { apiCalls: '1.2k', credits: '45,200', volume: '$840,291' },
    },
  }),
  generateApiKeyAction: vi.fn().mockResolvedValue({
    success: true,
    rawKey: 'aivo_live_testrawkey',
    key: { id: 'mock-key-1', name: 'New Test Key', status: 'Active' },
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

  it('simulates historical usage data rendering from Server Actions', async () => {
    render(<Page />);
    // Stats loaded from mocked fetchDashboardStateAction
    expect(await screen.findByText(/840,291/i)).toBeInTheDocument();
    expect(screen.getByText(/45,200/i)).toBeInTheDocument();
  });
});
