import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TokenCard } from './TokenCard';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTrade } from '@/hooks/useTrade';

// Mock the wallet adapter hook
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn().mockReturnValue({ connected: true }),
}));

// Mock the trade hook
vi.mock('@/hooks/useTrade', () => ({
  useTrade: vi.fn().mockReturnValue({ executeTrade: vi.fn().mockResolvedValue({ signature: 'SIG123' }), isExecuting: false }),
}));

describe('TokenCard Component (Institutional)', () => {
  const mockSignal = {
    id: '1',
    score: 95,
    aiReasoning: {
      narrative: 'High-conviction alpha detected in the Solana mempool.',
      confident: 'HIGH' as const,
    },
    event: {
      mint: 'So11111111111111111111111111111111111111112',
      signature: 'TRADEXY123',
      timestamp: new Date().toISOString(),
      initialLiquidity: 1250.50,
      socialScore: 88,
      metadata: {
        name: 'Solana Coin',
        symbol: 'SOL',
      },
    },
  };

  const mockOnConsumeQuota = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useWallet).mockReturnValue({ connected: true } as unknown as ReturnType<typeof useWallet>);
    vi.mocked(useTrade).mockReturnValue({ 
      executeTrade: vi.fn().mockResolvedValue({ signature: 'SIG123' }), 
      isExecuting: false 
    } as unknown as ReturnType<typeof useTrade>);
  });

  it('renders token metadata and score correctly', () => {
    render(<TokenCard signal={mockSignal} onConsumeQuota={mockOnConsumeQuota} />);
    expect(screen.getByText('Solana Coin')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('$1,250.5')).toBeInTheDocument();
  });

  it('AI Reasoning section is hidden initially and requires quota reveal', () => {
    render(<TokenCard signal={mockSignal} onConsumeQuota={mockOnConsumeQuota} />);
    expect(screen.queryByText(/High-conviction alpha/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Decrypt Intelligence Nexus/i)).toBeInTheDocument();
  });

  it('reveals AI reasoning and calls onConsumeQuota when button is clicked', async () => {
    render(<TokenCard signal={mockSignal} onConsumeQuota={mockOnConsumeQuota} />);
    const revealBtn = screen.getByText(/Decrypt Intelligence Nexus/i);
    fireEvent.click(revealBtn);

    await waitFor(() => {
      expect(screen.getByText(/High-conviction alpha/i)).toBeInTheDocument();
    });
    expect(mockOnConsumeQuota).toHaveBeenCalledTimes(1);
  });

  it('calls buy function when institutional buy button is clicked', async () => {
    render(<TokenCard signal={mockSignal} onConsumeQuota={mockOnConsumeQuota} />);
    const buyBtn = screen.getByText(/Institutional Buy/i);
    fireEvent.click(buyBtn);
    
    // Check if it renders properly as part of handleBuy trace log or similar logic
    // Actually the handleBuy uses alert, so we might need to mock alert or rely on interaction
    const oldAlert = window.alert;
    window.alert = vi.fn();
    fireEvent.click(buyBtn);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Institutional Trade Initialized'));
    });
    window.alert = oldAlert;
  });

  it('prevents buy action if wallet is not connected', async () => {
    vi.mocked(useWallet).mockReturnValue({ connected: false } as unknown as ReturnType<typeof useWallet>);
    
    const oldAlert = window.alert;
    window.alert = vi.fn();
    
    render(<TokenCard signal={mockSignal} onConsumeQuota={mockOnConsumeQuota} />);
    const buyBtn = screen.getByText(/Institutional Buy/i);
    fireEvent.click(buyBtn);
    
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Please connect wallet first'));
    window.alert = oldAlert;
  });

  it('handles trade errors that are not instances of Error', async () => {
    vi.mocked(useTrade).mockReturnValue({
      executeTrade: vi.fn().mockRejectedValue('Fatal Error String'),
      isExecuting: false
    } as unknown as ReturnType<typeof useTrade>);

    const oldAlert = window.alert;
    window.alert = vi.fn();

    render(<TokenCard signal={mockSignal} onConsumeQuota={mockOnConsumeQuota} />);
    const buyBtn = screen.getByText(/Institutional Buy/i);
    fireEvent.click(buyBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Trade failed: Fatal Error String');
    });
    window.alert = oldAlert;
  });

  it('handles objects that are neither Error nor string', async () => {
    vi.mocked(useTrade).mockReturnValue({
      executeTrade: vi.fn().mockRejectedValue({ something: 'else' }),
      isExecuting: false
    } as unknown as ReturnType<typeof useTrade>);

    const oldAlert = window.alert;
    window.alert = vi.fn();

    render(<TokenCard signal={mockSignal} onConsumeQuota={mockOnConsumeQuota} />);
    const buyBtn = screen.getByText(/Institutional Buy/i);
    fireEvent.click(buyBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Trade failed: Unknown error');
    });
    window.alert = oldAlert;
  });

  it('handles trade errors with standard Error object', async () => {
    vi.mocked(useTrade).mockReturnValue({
      executeTrade: vi.fn().mockRejectedValue(new Error('System Overload')),
      isExecuting: false
    } as unknown as ReturnType<typeof useTrade>);

    const oldAlert = window.alert;
    window.alert = vi.fn();

    render(<TokenCard signal={mockSignal} onConsumeQuota={mockOnConsumeQuota} />);
    const buyBtn = screen.getByText(/Institutional Buy/i);
    fireEvent.click(buyBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Trade failed: System Overload');
    });
    window.alert = oldAlert;
  });

  it('renders fallback name for missing metadata', () => {
    const signalNoMeta = { ...mockSignal, event: { ...mockSignal.event, metadata: undefined } };
    render(<TokenCard signal={signalNoMeta} onConsumeQuota={mockOnConsumeQuota} />);
    expect(screen.getByText('Unknown Token')).toBeInTheDocument();
  });
});
