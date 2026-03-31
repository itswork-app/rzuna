import { renderHook, waitFor } from '@testing-library/react';
import { useSignals } from './useSignals';
import { supabase } from '@/lib/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis()
    }),
    removeChannel: vi.fn()
  }
}));

// Mock Fetch
global.fetch = vi.fn();

describe('useSignals Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initially has empty signals and is loading', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signals: [] })
    });

    const { result } = renderHook(() => useSignals());
    expect(result.current.loading).toBe(true);
    expect(result.current.signals).toEqual([]);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('updates signals after initial fetch', async () => {
    const mockSignals = [
      { mint: 'mint1', symbol: 'SOL', score: 90, isPremium: true }
    ];
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signals: mockSignals })
    });

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.signals).toHaveLength(1));
    expect(result.current.signals[0].symbol).toBe('SOL');
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useSignals());
    unmount();
    expect(supabase.removeChannel).toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.signals).toEqual([]);
  });

  it('handles supabase UPDATE event (Auto-Down)', async () => {
    let subCallback: (payload: { eventType: string; new: Record<string, unknown> }) => void = () => {};
    (supabase.channel as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      on: vi.fn().mockImplementation((_event, _filter, callback) => {
        subCallback = callback;
        return { on: vi.fn().mockReturnThis(), subscribe: vi.fn() };
      }),
      subscribe: vi.fn()
    });

    const mockInitial = [{ mint: 'mint1', symbol: 'SOL', score: 90, is_active: true }];
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signals: mockInitial })
    });

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.signals).toHaveLength(1));

    // Simulate UPDATE to inactive
    subCallback({
      eventType: 'UPDATE',
      new: { mint_address: 'mint1', is_active: false, base_score: 50 }
    });

    await waitFor(() => expect(result.current.signals).toHaveLength(0));
  });

  it('handles supabase UPDATE event (Score Change)', async () => {
    let subCallback: (payload: { eventType: string; new: Record<string, unknown> }) => void = () => {};
    (supabase.channel as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      on: vi.fn().mockImplementation((_event, _filter, callback) => {
        subCallback = callback;
        return { on: vi.fn().mockReturnThis(), subscribe: vi.fn() };
      }),
      subscribe: vi.fn()
    });

    const mockInitial = [{ mint: 'mint1', symbol: 'SOL', score: 90, is_active: true }];
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signals: mockInitial })
    });

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.signals).toHaveLength(1));

    // Simulate UPDATE to new score
    subCallback({
      eventType: 'UPDATE',
      new: { mint_address: 'mint1', is_active: true, base_score: 99, ai_reasoning: JSON.stringify({ narrative: 'New Narrative' }) }
    });

    await waitFor(() => expect(result.current.signals[0].score).toBe(99));
    expect(result.current.signals[0].aiReasoning?.narrative).toBe('New Narrative');
  });

  it('handles supabase INSERT event (Valid New Token)', async () => {
    let subCallback: (payload: { eventType: string; new: Record<string, unknown> }) => void = () => {};
    (supabase.channel as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      on: vi.fn().mockImplementation((_event, _filter, callback) => {
        subCallback = callback;
        return { on: vi.fn().mockReturnThis(), subscribe: vi.fn() };
      }),
      subscribe: vi.fn()
    });

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signals: [] })
    });

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // This is a placeholder for actual insertion logic if any
    subCallback({
      eventType: 'INSERT',
      new: { mint_address: 'new_mint', is_active: true, base_score: 95 }
    });
    
    // Currently the hook only has placeholder for INSERT, so we just verify it doesn't crash
    expect(result.current.signals).toHaveLength(0);
  });

  it('handles supabase INSERT event (Inactive or Low Score)', async () => {
    let subCallback: (payload: { eventType: string; new: Record<string, unknown> }) => void = () => {};
    (supabase.channel as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      on: vi.fn().mockImplementation((_event, _filter, callback) => {
        subCallback = callback;
        return { on: vi.fn().mockReturnThis(), subscribe: vi.fn() };
      }),
      subscribe: vi.fn()
    });

    const { result } = renderHook(() => useSignals());
    
    subCallback({
      eventType: 'INSERT',
      new: { mint_address: 'low_score', is_active: false, base_score: 40 }
    });

    expect(result.current.signals).toHaveLength(0);
  });
});
