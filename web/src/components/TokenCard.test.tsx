import { render, screen } from '@testing-library/react';
import { TokenCard } from './TokenCard';
import { AlphaSignal } from '@/types';
import { describe, it, expect } from 'vitest';

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
      generatedByAI: true
    }
  };

  it('renders token symbol and score', () => {
    render(<TokenCard signal={mockSignal} isVIP={true} />);
    expect(screen.getByText('SOL')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
  });

  it('renders AI narrative for VIP users', () => {
    render(<TokenCard signal={mockSignal} isVIP={true} />);
    expect(screen.getByText('AI Narrative Logic')).toBeInTheDocument();
  });

  it('renders hidden message if narrative is obfuscated', () => {
    const obfuscatedSignal: AlphaSignal = {
      ...mockSignal,
      aiReasoning: {
        ...mockSignal.aiReasoning!,
        narrative: '[HIDDEN] Upgrade to VIP'
      }
    };
    render(<TokenCard signal={obfuscatedSignal} isVIP={false} />);
    expect(screen.getByText('[HIDDEN] Upgrade to VIP')).toBeInTheDocument();
  });

  it('renders fallback for missing aiReasoning', () => {
    const basicSignal: AlphaSignal = { ...mockSignal, aiReasoning: undefined };
    render(<TokenCard signal={basicSignal} isVIP={false} />);
    expect(screen.getByText('Analyzing token narrative and social sentiment...')).toBeInTheDocument();
  });

  it('renders without catalysts and risks', () => {
     const emptySignal: AlphaSignal = { 
       ...mockSignal, 
       aiReasoning: { narrative: 'None', generatedByAI: true, catalysts: [], riskFactors: [] } 
     };
     render(<TokenCard signal={emptySignal} isVIP={true} />);
     expect(screen.getByText('None')).toBeInTheDocument();
  });
});
