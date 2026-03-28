import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildApp } from './index.js';

describe('Server & Monitoring', () => {
  const env = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it('should respond to health check', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payload = response.json();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(payload.status).toBe('ok');
  });

  it('should initialize monitoring when env vars are present', async () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/123';
    process.env.AXIOM_TOKEN = 'test-token';
    process.env.AXIOM_DATASET = 'test-dataset';

    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(response.statusCode).toBe(200);
  });

  it('should handle errors and trigger Sentry hook', async () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/123';
    const app = await buildApp();

    app.get('/error', () => {
      throw new Error('Test Error');
    });

    const response = await app.inject({
      method: 'GET',
      url: '/error',
    });

    expect(response.statusCode).toBe(500);
  });
});
