import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getApiUrl } from './env';

describe('getApiUrl Helper (Institutional)', () => {
  const originalEnv = { ...process.env };
  const originalWindow = global.window;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.window = originalWindow;
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('honors NEXT_PUBLIC_API_URL override (Priority 1)', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://custom-api.sh');
    expect(getApiUrl()).toBe('https://custom-api.sh');
  });

  it('resolves DEV_API_URL on localhost in browser (Priority 2)', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    // Mocking window.location.hostname
    global.window = {
      location: { hostname: 'localhost' }
    } as unknown as Window & typeof globalThis;

    expect(getApiUrl()).toBe('http://localhost:3001');
  });

  it('resolves PROD_API_URL on aivo.sh subdomain in browser (Priority 3)', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    global.window = {
      location: { hostname: 'trade.aivo.sh' }
    } as unknown as Window & typeof globalThis;

    expect(getApiUrl()).toBe('https://api.aivo.sh');
  });

  it('resolves PROD_API_URL on aivo.sh root domain in browser (Priority 3.1)', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    global.window = {
      location: { hostname: 'aivo.sh' }
    } as unknown as Window & typeof globalThis;

    expect(getApiUrl()).toBe('https://api.aivo.sh');
  });

  it('falls back to environment-based URL during SSR (Priority 4)', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    delete (global as unknown as { window?: unknown }).window;
    
    vi.stubEnv('NODE_ENV', 'production');
    expect(getApiUrl()).toBe('https://api.aivo.sh');

    vi.stubEnv('NODE_ENV', 'development');
    expect(getApiUrl()).toBe('http://localhost:3001');
  });
});
