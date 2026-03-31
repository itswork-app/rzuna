import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeyserService } from '../src/infrastructure/solana/geyser.service.js';
import { RealtimeService } from '../src/infrastructure/supabase/realtime.service.js';
import { supabase } from '../src/infrastructure/supabase/client.js';
import { env } from '../src/utils/env.js';
import { EventEmitter } from 'events';

vi.mock('@triton-one/yellowstone-grpc', () => ({
  default: class {
    endpoint: string;
    constructor(endpoint: string) {
      this.endpoint = endpoint;
    }
    connect = vi.fn().mockImplementation(() => {
      if (this.endpoint.includes('fail-conn')) return Promise.reject(new Error('Conn Fail'));
      return Promise.resolve();
    });
    subscribe = vi.fn().mockImplementation(() => {
      const stream = new EventEmitter() as any;
      stream.write = vi.fn().mockImplementation((req, cb) => {
        if (this.endpoint.includes('fail-write')) {
          cb(new Error('Write Fail'));
        } else {
          cb(null);
        }
      });
      return Promise.resolve(stream);
    });
  },
}));

vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      send: vi.fn().mockResolvedValue('ok'),
      subscribe: vi.fn().mockImplementation((cb) => {
        cb('SUBSCRIBED');
        return { unsubscribe: vi.fn() };
      }),
    }),
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    }),
  },
}));

describe('🛡️ Infrastructure Coverage Siege', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.GEYSER_ENDPOINT = undefined;
    env.GEYSER_TOKEN = undefined;
  });

  describe('GeyserService (Real Stream Path)', () => {
    it('should map gRPC data to MintEvent correctly', async () => {
      env.GEYSER_ENDPOINT = 'https://real-stream';
      env.GEYSER_TOKEN = 'test-token';

      const service = new GeyserService();
      await service.start();

      let capturedEvent: any = null;
      service.on('mint', (e) => {
        capturedEvent = e;
      });

      const mockGrpcData = {
        transaction: {
          transaction: {
            signatures: [Buffer.from('test_signature_bytes')],
          },
        },
      };

      // @ts-expect-error - Accessing private stream for test emission
      service.stream.emit('data', mockGrpcData);

      expect(capturedEvent).toBeDefined();
      expect(capturedEvent.mint).toBe('LIVE_GEYSER_MINT');
    });

    it('should handle zero signatures in Geyser data without emitting if not mock', async () => {
      env.GEYSER_ENDPOINT = 'https://real-stream';
      const service = new GeyserService();
      await service.start();

      // Force non-mock explicitly for this branch test
      // @ts-expect-error - Overriding private isMock for branch testing
      service.isMock = false;

      const localMintSpy = vi.fn();
      service.on('mint', localMintSpy);

      // @ts-expect-error - Accessing private stream for test emission
      service.stream.emit('data', {
        transaction: {
          transaction: {
            signatures: [], // Should not emit because not mock
          },
        },
      });

      expect(localMintSpy).not.toHaveBeenCalled();
    });

    it('should handle zero signatures in Geyser data logic (Branch Coverage)', async () => {
      env.GEYSER_ENDPOINT = 'https://real-stream-mock';
      const service = new GeyserService();
      await service.start();

      // Force mock behavior inside real handler
      // @ts-expect-error - Overriding private isMock for branch testing
      service.isMock = true;

      const localMintSpy = vi.fn();
      service.on('mint', localMintSpy);

      // @ts-expect-error - Accessing private stream for test emission
      service.stream.emit('data', {
        transaction: {
          transaction: {
            signatures: [],
          },
        },
      });

      expect(localMintSpy).toHaveBeenCalled();
    });
  });

  describe('GeyserService (Fallback Path)', () => {
    it('should handle Geyser connection failure and fallback to mock', async () => {
      env.GEYSER_ENDPOINT = 'https://fail-conn';
      const service = new GeyserService();
      await service.start();
      // @ts-expect-error - Accessing private isMock to verify fallback
      expect(service.isMock).toBe(true);
    });
  });

  describe('RealtimeService', () => {
    it('should broadcast VIP alpha signals', async () => {
      const service = new RealtimeService();
      const mockSignal = { id: 'test', mint: 'test', score: 95, metadata: {} };
      const mockReasoning = { rationale: 'test', confidence: 0.9 };

      service.broadcastVipAlpha(mockSignal as any, mockReasoning as any);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(supabase.channel).toHaveBeenCalledWith('vip-alpha');
    });
  });
});
