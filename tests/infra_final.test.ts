import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealtimeService } from '../src/infrastructure/supabase/realtime.service.js';
import { supabase } from '../src/infrastructure/supabase/client.js';
import { EventEmitter } from 'events';

vi.mock('@triton-one/yellowstone-grpc', () => ({
  default: class {
    endpoint: string;
    constructor(endpoint: string) {
      this.endpoint = endpoint;
    }
    connect = vi.fn().mockResolvedValue(undefined);
    subscribe = vi.fn().mockImplementation(() => {
      const stream = new EventEmitter() as any;
      stream.write = vi.fn().mockImplementation((r, cb) => cb(null));
      return Promise.resolve(stream);
    });
  },
}));

vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    channel: vi.fn(),
  },
}));

describe('🛡️ Infrastructure Branch Siege', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should cover RealtimeService error branch', async () => {
    const mockSend = vi.fn();
    (supabase.channel as any).mockReturnValue({
      send: mockSend,
    });

    // 1. Success path
    mockSend.mockResolvedValue('ok');
    const service = new RealtimeService();
    service.broadcastVipAlpha({ id: '1' } as any, { rationale: 'test' } as any);

    // 2. Error path (status !== ok)
    mockSend.mockResolvedValue('error');
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    service.broadcastVipAlpha({ id: '2' } as any, { rationale: 'test' } as any);

    // Wait for the fire-and-forget Promise
    await new Promise((r) => setTimeout(r, 10));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('VIP broadcast failed'), 'error');
  });
});
