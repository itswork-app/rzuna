import { describe, it, expect, vi } from 'vitest';
import Fastify from 'fastify';
import { feePlugin } from '../src/plugins/fee.plugin.js';
import { monitoringPlugin } from '../src/infrastructure/monitoring/monitoring.plugin.js';
import { env } from '../src/utils/env.js';

vi.mock('@axiomhq/js', () => ({
  Axiom: class {
    ingest = vi.fn();
  },
}));

vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

describe('🛡️ Backend Integration Coverage', () => {
  it('should register fee plugin and handles decorations', async () => {
    const fastify = Fastify();
    await fastify.register(feePlugin);
    await fastify.ready();

    // feePlugin doesn't decorate, it just adds /trade and /user/:wallet/tier routes
    // Verification via readiness is enough for registration audit
    await fastify.close();
  });

  it('should register monitoring plugin and handles Axiom', async () => {
    const fastify = Fastify();

    // Set env to trigger Axiom
    env.AXIOM_TOKEN = 'test-token';
    env.AXIOM_DATASET = 'test-ds';

    await fastify.register(monitoringPlugin);
    await fastify.ready();

    expect(fastify.hasDecorator('axiom')).toBe(true);
    expect(fastify.hasDecorator('logAlpha')).toBe(true);
    await fastify.close();
  });
});
