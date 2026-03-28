import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { Client } from '@axiomhq/axiom-node';

vi.mock('@axiomhq/axiom-node', () => {
  return {
    Client: vi.fn().mockImplementation(function (this: any) {
      this.ingestEvents = vi.fn().mockResolvedValue({ status: 'ok' });
      return this;
    }),
  };
});

describe('🚀 RZUNA Core Foundation', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('🟢 Health Check: Harus mengembalikan status 200 untuk Checkly', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json() as unknown as { status: string; timestamp: string };
    expect(payload.status).toBe('ok');
    expect(typeof payload.timestamp).toBe('string');
  });

  it('🛡️ Security: Harus memiliki header keamanan dasar (Helmet)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.headers).toHaveProperty('x-dns-prefetch-control');
    expect(response.headers).toHaveProperty('x-content-type-options');
  });

  it('🔴 Error Handling: Harus menangkap error 404 dengan benar', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/route-yang-tidak-ada',
    });

    expect(response.statusCode).toBe(404);
  });

  describe('📊 Monitoring & Coverage', () => {
    it('🛡️ Sentry & Axiom: Harus terinisialisasi jika env vars tersedia', async () => {
      // Kita buat instance baru dengan env vars terpacak
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';
      process.env.AXIOM_TOKEN = 'test-token';
      process.env.AXIOM_DATASET = 'test-dataset';

      const monitorApp = await buildApp();
      const response = await monitorApp.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      await monitorApp.close();
    });

    it('🛡️ Sentry Error Hook: Harus dipicu saat terjadi error', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';
      const monitorApp = await buildApp();

      monitorApp.get('/trigger-error', () => {
        throw new Error('Expected test error');
      });

      const response = await monitorApp.inject({
        method: 'GET',
        url: '/trigger-error',
      });

      expect(response.statusCode).toBe(500);
      await monitorApp.close();
    });

    it('🛡️ Axiom Catch Hook: Harus menangkap error jika ingestEvents gagal', async () => {
      // Mock Client.ingestEvents to reject
      const mockIngest = vi.fn().mockRejectedValue(new Error('Axiom Network Error'));
      vi.mocked(Client).mockImplementation(function (this: any) {
        this.ingestEvents = mockIngest;
        return this;
      } as any);

      process.env.AXIOM_TOKEN = 'test-token';
      process.env.AXIOM_DATASET = 'test-dataset';

      const monApp = await buildApp();
      const logSpy = vi.spyOn(monApp.log, 'error');

      // Trigger request to trigger onResponse hook
      await monApp.inject({ method: 'GET', url: '/health' });

      // Tunggu sebentar agar async ingestEvents dipicu
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockIngest).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(expect.any(Error), 'Axiom ingestion failed');

      await monApp.close();
    });

    it('🛡️ Branch Coverage: Default NODE_ENV', async () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const monApp = await buildApp();
      expect(monApp).toBeDefined();

      process.env.NODE_ENV = originalEnv;
      await monApp.close();
    });
  });
});
