import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReasoningService } from '../agents/reasoning.service.js';

let mockWorkerBehavior: 'success' | 'error' | 'timeout' | 'exit1' = 'success';

// 🏛️ Mock the Worker so it doesn't throw ENOENT for missing JS file
vi.mock('worker_threads', () => {
  return {
    Worker: class MockWorker {
      listeners: Record<string, Function> = {};

      constructor() {
        if (mockWorkerBehavior === 'success') {
          setTimeout(() => {
            if (this.listeners['message']) {
              this.listeners['message']({
                verdict: 'ALPHA',
                narrative: 'High Potential Alpha Sensor triggered',
                catalysts: ['Viral Narrative'],
                riskFactors: ['Low Liquidity'],
                confidence: 'HIGH',
                generatedByAI: true,
              });
            }
          }, 10);
        } else if (mockWorkerBehavior === 'error') {
          setTimeout(() => {
            if (this.listeners['error']) {
              this.listeners['error'](new Error('Worker Crash'));
            }
          }, 10);
        } else if (mockWorkerBehavior === 'exit1') {
          setTimeout(() => {
            if (this.listeners['exit']) {
              this.listeners['exit'](1);
            }
          }, 10);
        }
        // 'timeout' behavior: do nothing, let the service timer handle it
      }

      on(event: string, callback: Function) {
        this.listeners[event] = callback;
      }

      terminate() {}
    },
  };
});

describe('ReasoningService (The Brain)', () => {
  let service: ReasoningService;

  beforeEach(() => {
    service = new ReasoningService();
    mockWorkerBehavior = 'success';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('SHOULD analyze a token and return consistent alpha narrative', async () => {
    const resultPromise = service.analyzeToken({ symbol: 'RZUNA' } as any);
    vi.advanceTimersByTime(100);
    const result = await resultPromise;
    expect(result.narrative).toBe('High Potential Alpha Sensor triggered');
  });

  it('SHOULD trigger rate limiting after MAX_CALLS', async () => {
    // Fill up the minute
    for (let i = 0; i < 20; i++) {
      const p = service.analyzeToken({ symbol: 'TEST' } as any);
      vi.advanceTimersByTime(100);
      await p;
    }

    // 21st call should be rate limited
    const limited = await service.analyzeToken({ symbol: 'LIMIT' } as any);
    expect(limited.narrative).toContain('[RATE LIMITED]');
    expect(limited.generatedByAI).toBe(false);

    // Advance 61 seconds
    vi.advanceTimersByTime(61_000);

    // Should be reset
    const resetPromise = service.analyzeToken({ symbol: 'RESET' } as any);
    vi.advanceTimersByTime(100);
    const reset = await resetPromise;
    expect(reset.narrative).toBe('High Potential Alpha Sensor triggered');
  });

  it('SHOULD handle worker timeout gracefully', async () => {
    mockWorkerBehavior = 'timeout';
    const resultPromise = service.analyzeToken({ symbol: 'SLOW' } as any);

    // Advance 11 seconds (timeout is 10s)
    vi.advanceTimersByTime(11_000);

    const result = await resultPromise;
    expect(result.narrative).toContain('[TIMEOUT]');
    expect(result.verdict).toBe('WATCH');
  });

  it('SHOULD handle worker errors', async () => {
    mockWorkerBehavior = 'error';
    const resultPromise = service.analyzeToken({ symbol: 'FAIL' } as any);
    vi.advanceTimersByTime(100);
    await expect(resultPromise).rejects.toThrow('Worker Crash');
  });

  it('SHOULD handle worker non-zero exit', async () => {
    mockWorkerBehavior = 'exit1';
    const resultPromise = service.analyzeToken({ symbol: 'EXIT' } as any);
    vi.advanceTimersByTime(100);
    await expect(resultPromise).rejects.toThrow('Worker stopped with code 1');
  });

  it('SHOULD return usage stats', () => {
    const stats = service.getUsageStats();
    expect(stats.maxPerMinute).toBe(20);
    expect(stats).toHaveProperty('callsThisMinute');
  });
});
