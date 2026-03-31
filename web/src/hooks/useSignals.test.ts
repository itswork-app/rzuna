import { renderHook, waitFor, act } from '@testing-library/react';
import { useSignals } from './useSignals';
import { supabase } from '@/lib/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn()
  }
}));

// Mock Fetch
global.fetch = vi.fn();

describe('useSignals Hook Institutional Siege', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let subCallback: (payload: { eventType: string; new: any }) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    subCallback = () => {};
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.channel as any).mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on: vi.fn().mockImplementation((_event: string, _filter: any, cb: any) => {
        subCallback = cb;
        return { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
      }),
      subscribe: vi.fn().mockReturnThis()
    });
  });

  it('initially has empty signals and is loading', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signals: [] })
    });

    const { result } = renderHook(() => useSignals());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('handles supabase UPDATE event (Auto-Down)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signals: [{ mint: '0x1', score: 90, symbol: 'S', isPremium: true, isNew: false, timestamp: Date.now() }] })
    });

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.signals).toHaveLength(1));

    act(() => {
      subCallback({
        eventType: 'UPDATE',
        new: { mint_address: '0x1', base_score: 50, is_active: false }
      });
    });

    await waitFor(() => expect(result.current.signals).toHaveLength(0));
  });

  it('handles supabase INSERT event (Valid)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signals: [] })
    });

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      subCallback({
        eventType: 'INSERT',
        new: { mint_address: '0x2', base_score: 85, is_active: true, id: '2' }
      });
    });

    await waitFor(() => expect(result.current.signals).toHaveLength(1));
    expect(result.current.signals[0].mint).toBe('0x2');
  });

  it('handles supabase INSERT event (Invalid < 85 or inactive)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signals: [] })
    });

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      subCallback({
        eventType: 'INSERT',
        new: { mint_address: '0x3', base_score: 84, is_active: true }
      });
    });

    expect(result.current.signals).toHaveLength(0);
  });

  it('handles API failure gracefully (Branch Coverage Line 21)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(global.fetch as any).mockRejectedValue(new Error('API Crash'));

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch signals:'), expect.any(Error));
    expect(result.current.signals).toHaveLength(0);
  });

  it('handles supabase UPDATE event (Score/Reasoning Update - Line 40)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        signals: [{ mint: '0x1', score: 90, symbol: 'S', isPremium: true, isNew: false, timestamp: Date.now() }] 
      })
    });

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.signals).toHaveLength(1));

    act(() => {
      subCallback({
        eventType: 'UPDATE',
        new: { 
          mint_address: '0x1', 
          base_score: 95, 
          is_active: true, 
          ai_reasoning: JSON.stringify({ narrative: 'Upgraded Alpha' }) 
        }
      });
    });

    await waitFor(() => expect(result.current.signals[0].score).toBe(95));
    expect(result.current.signals[0].aiReasoning?.narrative).toBe('Upgraded Alpha');
  });

  it('handles invalid JSON reasoning gracefully (Line 43)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        signals: [{ 
          mint: '0x1', 
          score: 90, 
          symbol: 'S', 
          isPremium: true, 
          isNew: false, 
          timestamp: Date.now(),
          aiReasoning: { narrative: 'Old' }
        }] 
      })
    });

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.signals).toHaveLength(1));

    act(() => {
      subCallback({
        eventType: 'UPDATE',
        new: { 
          mint_address: '0x1', 
          base_score: 90, 
          is_active: true, 
          ai_reasoning: '{ invalid json }' // Should fallback to old value
        }
      });
    });

    await waitFor(() => {
      expect(result.current.signals[0].aiReasoning?.narrative).toBe('Old');
    });
  });
});
