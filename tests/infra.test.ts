/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeyserService } from '../src/infrastructure/solana/geyser.service.js';
import { RealtimeService } from '../src/infrastructure/supabase/realtime.service.js';
import { supabase } from '../src/infrastructure/supabase/client.js';
import { env } from '../src/utils/env.js';
import { monitoringPlugin } from '../src/infrastructure/monitoring/monitoring.plugin.js';
import { EventEmitter } from 'events';
import bs58 from 'bs58';

const mockConnect = vi.fn();
const mockSubscribe = vi.fn();

vi.mock('@solana/web3.js', () => ({
  Connection: class {
    onLogs = vi.fn().mockReturnValue(123);
    removeOnLogsListener = vi.fn();
    getParsedTransaction = vi.fn();
    getLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: 'hash' });
    sendRawTransaction = vi.fn().mockResolvedValue('sig');
  },
  PublicKey: class {
    constructor(public key: string) {}
    toBase58 = () => this.key;
    static readonly findProgramAddressSync = vi.fn().mockReturnValue([Buffer.from('pda'), 255]);
    toBuffer = () => Buffer.from(this.key);
  },
}));

vi.mock('@triton-one/yellowstone-grpc', () => {
  return {
    default: class {
      endpoint: string;
      constructor(endpoint: string) {
        this.endpoint = endpoint;
      }
      connect() {
        if (this.endpoint && this.endpoint.includes('fail-conn'))
          return Promise.reject(new Error('Conn Fail'));
        return mockConnect();
      }
      subscribe() {
        if (this.endpoint && this.endpoint.includes('fail-subscribe'))
          return Promise.reject(new Error('Sub Fail'));
        return mockSubscribe();
      }
    },
  };
});

vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      send: vi.fn().mockResolvedValue('ok'),
      subscribe: vi.fn().mockImplementation((cb: (status: string) => void) => {
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

const REAL_GEYSER_URL = 'https://real';

describe('🛡️ Infrastructure Coverage Siege', () => {
  let stream: EventEmitter;

  beforeEach(() => {
    vi.clearAllMocks();
    stream = new EventEmitter() as any;
    // @ts-expect-error - Mocking write
    stream.write = vi.fn().mockImplementation((req, cb) => cb(null));

    mockConnect.mockResolvedValue(undefined);
    mockSubscribe.mockResolvedValue(stream);

    env.GEYSER_ENDPOINT = undefined;
    env.GEYSER_TOKEN = undefined;
    env.SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
  });

  describe('GeyserService (Production Stream Path)', () => {
    it('should map gRPC data correctly using bs58', async () => {
      const mockSig = '58J123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijk';
      const mockMint = 'Mint111111111111111111111111111111111111111';
      env.GEYSER_ENDPOINT = REAL_GEYSER_URL;
      env.GEYSER_TOKEN = 't';

      const service = new GeyserService();
      await service.start();

      let capturedEvent: any = null;
      service.on('mint', (e) => (capturedEvent = e));

      const mockGrpcData = {
        transaction: {
          transaction: {
            signatures: [bs58.decode(mockSig)],
            message: {
              accountKeys: [
                bs58.decode('6EF8rrecthR5Dkzon8Nwu78hRvfMX1NczvLA8nd6XMyC'),
                bs58.decode(mockMint),
              ],
            },
          },
        },
      };

      stream.emit('data', mockGrpcData);

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(capturedEvent).toBeDefined();
      expect(capturedEvent.mint).toBe(mockMint);
    });

    it('should handle zero signatures (Branch Ingest Skip)', async () => {
      env.GEYSER_ENDPOINT = REAL_GEYSER_URL;
      const service = new GeyserService();
      await service.start();
      const mintSpy = vi.fn();
      service.on('mint', mintSpy);

      stream.emit('data', { transaction: { transaction: { signatures: [] } } });

      expect(mintSpy).not.toHaveBeenCalled();
    });

    it('should switch to WebSocket Fallback after max retries failing', async () => {
      env.GEYSER_ENDPOINT = 'https://fail-subscribe';
      env.GEYSER_TOKEN = 't';
      const service = new GeyserService();
      // @ts-expect-error - Mocking static property
      GeyserService.MAX_RETRIES = 1;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await service.start();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Max retries reached. Switching to WebSocket Fallback.'),
      );
      // @ts-expect-error - Internal state check
      expect(service.isFallbackActive).toBe(true);
    });
  });

  describe('🛡️ Infrastructure Depth Infiltration', () => {
    it('GeyserService: should hit connection and stream error branches', async () => {
      env.GEYSER_ENDPOINT = REAL_GEYSER_URL;
      const service = new GeyserService();
      await service.start();

      try {
        stream.emit('error', new Error('Stream Crash'));
      } catch {
        // Expected re-throw handled internally
      }
      stream.emit('status', { details: 'Disconnected' });

      // VIP mode coverage
      const vip = new GeyserService('vip');
      await vip.start();
      expect((vip as any).priority).toBe(1);

      // NO-OP construction (missing credentials)
      const originalEndpoint = env.GEYSER_ENDPOINT;
      env.GEYSER_ENDPOINT = undefined;
      const noopGeyser = new GeyserService('public');
      expect((noopGeyser as any).isActive).toBe(false);
      env.GEYSER_ENDPOINT = originalEndpoint;
    });

    it('monitoringPlugin: should hit hook branches', async () => {
      // 🛡️ Hardened CI Environment: Ensure hooks register by setting temporary env
      const originalSentry = env.SENTRY_DSN;
      const originalAxiom = env.AXIOM_TOKEN;
      const originalDataset = env.AXIOM_DATASET;

      env.SENTRY_DSN = 'https://test@sentry.io/123';
      env.AXIOM_TOKEN = 'test-token';
      env.AXIOM_DATASET = 'test-dataset';

      const fastify: any = {
        decorate: vi.fn(),
        addHook: vi.fn(),
        register: vi.fn(),
        log: { info: vi.fn(), error: vi.fn() },
      };

      await monitoringPlugin(fastify, {});

      // Trigger OnError (Sentry fallback)
      const onErrorCall = fastify.addHook.mock.calls.find((c: any) => c[0] === 'onError');
      if (onErrorCall) {
        await onErrorCall[1]({}, {}, new Error('Test'));
      }

      // Trigger OnResponse (Axiom)
      const onResponseCall = fastify.addHook.mock.calls.find((c: any) => c[0] === 'onResponse');
      if (onResponseCall) {
        await onResponseCall[1](
          { method: 'GET', url: '/', query: {} },
          { statusCode: 200, elapsedTime: 10 },
        );
      }

      // Cleanup
      env.SENTRY_DSN = originalSentry;
      env.AXIOM_TOKEN = originalAxiom;
      env.AXIOM_DATASET = originalDataset;
    });

    it('GeyserService: should hit retry and fallback branches', async () => {
      env.GEYSER_ENDPOINT = 'https://fail-conn';
      const service = new GeyserService();
      // @ts-expect-error - Mocking static property
      GeyserService.MAX_RETRIES = 1;

      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await service.start();

      // Check if fallback was activated (which implies retry count exceeded)
      // @ts-expect-error - Internal
      expect(service.isFallbackActive).toBe(true);

      infoSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('RealtimeService infiltration', async () => {
      const service = new RealtimeService();
      service.broadcastVipAlpha({ id: 't' } as any, { narrative: 'v' } as any);
      expect(supabase.channel).toHaveBeenCalledWith('vip-alpha');
    });

    it('GeyserService stop and status branches', async () => {
      const service = new GeyserService();
      await service.start();
      await service.stop();
      expect((service as any).isActive).toBe(false);
    });
  });
});
