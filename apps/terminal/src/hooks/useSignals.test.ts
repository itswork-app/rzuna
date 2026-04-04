import { renderHook, waitFor, act } from '@testing-library/react';
import { useSignals } from './useSignals';
import { useWallet } from '@solana/wallet-adapter-react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the wallet adapter hook
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(),
}));

// Mock Fetch
global.fetch = vi.fn();

describe('useSignals Hook (Institutional)', () => {
  const mockSignals = [
    {
      id: '1',
      score: 95,
      aiReasoning: { narrative: 'Test alpha', confident: 'HIGH' },
      event: {
        mint: 'So11...112',
        signature: 'SIG123',
        timestamp: new Date().toISOString(),
        initialLiquidity: 1000,
        socialScore: 90,
        metadata: { name: 'Solana Coin', symbol: 'SOL' }
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useWallet).mockReturnValue({ publicKey: { toBase58: () => 'rzun...7p2v' }, connected: true } as unknown as ReturnType<typeof useWallet>);
  });

  it('initially has empty signals and starts loading', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signals: [] })
    } as Response);

    const { result } = renderHook(() => useSignals());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.signals).toEqual([]);
  });

  it('fetches signals correctly for a connected wallet', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signals: mockSignals })
    } as Response);

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    expect(result.current.signals).toHaveLength(1);
    expect(result.current.signals[0].event.mint).toBe('So11...112');
  });

  it('handles API fetch failure gracefully', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network Crash'));

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    expect(result.current.error).toBe('Network Crash');
    expect(result.current.signals).toEqual([]);
  });

  it('provides a refetch function to manually refresh', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signals: [] })
    } as Response);

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signals: mockSignals })
    } as Response);

    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.signals).toHaveLength(1));
  });

  it('returns immediately if publicKey is missing', async () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as unknown as ReturnType<typeof useWallet>);
    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles signals payload with missing signals array', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}) // Missing signals array
    } as Response);

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.signals).toEqual([]);
  });

  it('handles API failure with non-OK status code', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      statusText: 'Forbidden'
    } as Response);

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Signal fetch failed: Forbidden');
  });

  it('handles API failure with non-Error object during fetch', async () => {
    vi.mocked(global.fetch).mockRejectedValue('String Error'); // Not an Instance of Error

    const { result } = renderHook(() => useSignals());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Unknown error');
  });
});
