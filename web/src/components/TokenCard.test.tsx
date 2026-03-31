import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TokenCard } from './TokenCard';
import { AlphaSignal } from '@/types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Supabase client before any module import resolves it
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
}));

// Mock consumeQuota so tests don't make real fetch() calls
vi.mock('@/hooks/useSignals', async (original) => {
  const mod = await original<typeof import('@/hooks/useSignals')>();
  return { ...mod, consumeQuota: vi.fn().mockResolvedValue(true) };
});

describe('TokenCard Component', () => {
  const mockSignal: AlphaSignal = {
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    score: 95,
    isPremium: true,
    isNew: true,
    timestamp: Date.now(),
    aiReasoning: {
      narrative: 'AI Narrative Logic',
      riskFactors: ['Risk 1'],
      catalysts: ['Catalyst 1'],
      generatedByAI: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders token symbol and score', () => {
    render(<TokenCard signal={mockSignal} isVIP={true} />);
    expect(screen.getByText('SOL')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
  });

  it('AI Reasoning section is collapsed by default', () => {
    render(<TokenCard signal={mockSignal} isVIP={true} />);
    // Narrative is hidden until button is clicked
    expect(screen.queryByText('AI Narrative Logic')).not.toBeInTheDocument();
    expect(screen.getByText('AI Reasoning Oracle')).toBeInTheDocument();
  });

  it('expands AI narrative when reveal button is clicked (no wallet)', async () => {
    render(<TokenCard signal={mockSignal} isVIP={true} />);
    const revealBtn = screen.getByRole('button', { name: /AI Reasoning Oracle/i });
    fireEvent.click(revealBtn);
    await waitFor(() => expect(screen.getByText('AI Narrative Logic')).toBeInTheDocument());
  });

  it('calls consumeQuota when AI section is expanded with a walletAddress', async () => {
    const { consumeQuota } = await import('@/hooks/useSignals');
    render(<TokenCard signal={mockSignal} walletAddress="rzun...7p2v" />);
    const revealBtn = screen.getByRole('button', { name: /AI Reasoning Oracle/i });
    fireEvent.click(revealBtn);
    await waitFor(() => expect(consumeQuota).toHaveBeenCalledWith('rzun...7p2v'));
  });

  it('renders fallback for missing aiReasoning (after expand)', async () => {
    const basicSignal: AlphaSignal = { ...mockSignal, aiReasoning: undefined };
    render(<TokenCard signal={basicSignal} isVIP={false} />);
    fireEvent.click(screen.getByRole('button', { name: /AI Reasoning Oracle/i }));
    await waitFor(() =>
      expect(screen.getByText('Analyzing token narrative and social sentiment...')).toBeInTheDocument(),
    );
  });

  it('renders obfuscated narrative content after expand', async () => {
    const obfuscatedSignal: AlphaSignal = {
      ...mockSignal,
      aiReasoning: { ...mockSignal.aiReasoning!, narrative: '[HIDDEN] Upgrade to VIP' },
    };
    render(<TokenCard signal={obfuscatedSignal} isVIP={false} />);
    fireEvent.click(screen.getByRole('button', { name: /AI Reasoning Oracle/i }));
    await waitFor(() => expect(screen.getByText('[HIDDEN] Upgrade to VIP')).toBeInTheDocument());
  });

  it('renders without catalysts and risks', () => {
    const emptySignal: AlphaSignal = {
      ...mockSignal,
      aiReasoning: { narrative: 'None', generatedByAI: true, catalysts: [], riskFactors: [] },
    };
    render(<TokenCard signal={emptySignal} isVIP={true} />);
    expect(screen.getByText('SOL')).toBeInTheDocument();
  });
});
