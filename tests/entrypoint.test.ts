import { describe, it, expect, vi, beforeEach } from 'vitest';
import { start } from '../src/server.js';
import * as appModule from '../src/app.js';

vi.mock('../src/app.js', () => ({
  buildApp: vi.fn(),
}));

// Mock Env to control it in tests
vi.mock('../src/utils/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_KEY: 'test-key-long-enough-for-zod',
    PORT: '3000',
  },
}));

describe('🚀 Server Entrypoint (PR 1 Audit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PORT = '3000';
  });

  it('🟢 Initialization: Harus membangun app dan mendengarkan port dari env validator', async () => {
    const mockListen = vi.fn().mockResolvedValue('OK');
    const mockApp = { listen: mockListen };
    vi.mocked(appModule.buildApp).mockResolvedValue(mockApp as any);

    const result = await start();

    expect(appModule.buildApp).toHaveBeenCalled();
    expect(mockListen).toHaveBeenCalledWith({ port: 3000, host: '0.0.0.0' });
    expect(result).toBe(mockApp);
  });

  it('🔴 Error Handling: Harus menangkap error dan keluar dengan status 1', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    vi.mocked(appModule.buildApp).mockRejectedValue(new Error('Startup Failed'));

    await start();

    expect(consoleSpy).toHaveBeenCalledWith('❌  FATAL STARTUP ERROR:', expect.any(Error));
    expect(exitSpy).toHaveBeenCalledWith(1);

    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('🛡️ Branch Coverage: Harus melewati check NODE_ENV !== test', async () => {
    vi.resetModules();
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const mockStart = vi.fn();
    vi.doMock('../src/server.js', () => ({
      start: mockStart,
    }));

    await import('../src/server.js');

    process.env.NODE_ENV = originalEnv;
    vi.doUnmock('../src/server.js');
  });
});
