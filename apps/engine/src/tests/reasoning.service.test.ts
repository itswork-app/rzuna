import { describe, it, expect, vi } from 'vitest';
import { ReasoningService } from '../agents/reasoning.service.js';

// 🏛️ Mock the Worker so it doesn't throw ENOENT for missing JS file
vi.mock('worker_threads', () => {
  return {
    Worker: class MockWorker {
      listeners: Record<string, Function> = {};

      constructor() {
        // Automatically simulate sending a success message back on the next tick
        setTimeout(() => {
          if (this.listeners['message']) {
            this.listeners['message']({
              narrative: 'High Potential Alpha Sensor triggered',
              catalysts: ['Viral Narrative'],
              riskFactors: ['Low Liquidity'],
              confidence: 'HIGH',
              generatedByAI: true,
            });
          }
        }, 10);
      }

      on(event: string, callback: Function) {
        this.listeners[event] = callback;
      }

      terminate() {}
    },
  };
});

describe('ReasoningService (The Brain)', () => {
  const service = new ReasoningService();

  it('SHOULD analyze a token and return consistent alpha narrative', async () => {
    const result = await service.analyzeToken({ symbol: 'RZUNA' } as any);
    expect(result.narrative).toBeDefined();
    expect(result.narrative).toBe('High Potential Alpha Sensor triggered');
  });
});
