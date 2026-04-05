import { vi } from 'vitest';

// 🏛️ Institutional CI: Global Infrastructure Mocks (V22.2 Refined)
// Purpose: Provide robust, spiable foundations for all tests.

// 1. Mock @solana/web3.js
vi.mock('@solana/web3.js', () => {
  const MockConnection = vi.fn();
  MockConnection.prototype.getParsedAccountInfo = vi.fn().mockResolvedValue({ value: null });
  MockConnection.prototype.getTokenLargestAccounts = vi.fn().mockResolvedValue({ value: [] });
  MockConnection.prototype.getLatestBlockhash = vi
    .fn()
    .mockResolvedValue({ blockhash: 'mock_hash' });
  MockConnection.prototype.sendRawTransaction = vi.fn().mockResolvedValue('mock_sig');
  MockConnection.prototype.onProgramAccountChange = vi.fn();
  MockConnection.prototype.removeProgramAccountChangeListener = vi.fn();

  class MockPublicKey {
    key: string;
    constructor(key: string) {
      this.key = key;
    }
    toString() {
      return this.key;
    }
    toBase58() {
      return this.key;
    }
    toBuffer() {
      return Buffer.from(this.key);
    }
    equals(other: any) {
      return other.toString() === this.key;
    }
  }

  return {
    Connection: MockConnection,
    PublicKey: MockPublicKey,
    Keypair: {
      generate: vi.fn().mockReturnValue({
        publicKey: new MockPublicKey('generated_pubkey'),
        secretKey: new Uint8Array(64),
      }),
      fromSecretKey: vi.fn().mockImplementation(() => ({
        publicKey: new MockPublicKey('mock_pubkey'),
        secretKey: new Uint8Array(64),
      })),
    },
    VersionedTransaction: {
      deserialize: vi.fn().mockReturnValue({
        sign: vi.fn(),
        serialize: vi.fn().mockReturnValue(Buffer.from('tx')),
      }),
    },
    SystemProgram: {
      transfer: vi.fn(),
    },
    Transaction: class MockTransaction {
      add = vi.fn().mockReturnThis();
      serialize = vi.fn().mockReturnValue(Buffer.from('tx'));
      sign = vi.fn();
    },
  };
});

// 2. Mock ioredis
vi.mock('ioredis', () => {
  const MockRedis = vi.fn();
  MockRedis.prototype.on = vi.fn();
  MockRedis.prototype.off = vi.fn();
  MockRedis.prototype.hgetall = vi.fn().mockResolvedValue({});
  MockRedis.prototype.hset = vi.fn().mockResolvedValue(1);
  MockRedis.prototype.quit = vi.fn().mockResolvedValue('OK');
  MockRedis.prototype.get = vi.fn().mockResolvedValue(null);
  MockRedis.prototype.set = vi.fn().mockResolvedValue('OK');
  MockRedis.prototype.lrange = vi.fn().mockResolvedValue([]);
  MockRedis.prototype.lpush = vi.fn().mockResolvedValue(1);
  MockRedis.prototype.ltrim = vi.fn().mockResolvedValue('OK');
  MockRedis.prototype.del = vi.fn().mockResolvedValue(1);
  MockRedis.prototype.incr = vi.fn().mockResolvedValue(1);
  MockRedis.prototype.expire = vi.fn().mockResolvedValue(1);

  return {
    default: MockRedis,
    Redis: MockRedis,
  };
});

// 3. Global fetch mock
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({}),
  text: async () => '',
});

// 4. Mock Sentry
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  Handlers: {
    requestHandler: () => (req: any, res: any, next: any) => next(),
    errorHandler: () => (err: any, req: any, res: any, next: any) => next(),
  },
}));
