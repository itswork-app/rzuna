import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { type Client } from '@axiomhq/axiom-node';
import { monitoringPlugin } from './infrastructure/monitoring/monitoring.plugin.js';
import { GeyserService, type AlphaSignal } from './infrastructure/solana/geyser.service.js';
import { ScoringService } from './core/scoring/scoring.service.js';
import { feePlugin } from './plugins/fee.plugin.js';
import { TierService } from './core/tiers/tier.service.js';
import { env } from './utils/env.js';
import { SubscriptionStatus } from './core/types/user.js';

/**
 * Fastify Application Factory: Blueprint v1.3 Refactored
 * Standar: WORLD-CLASS MODULAR
 */
export const buildApp = async () => {
  const fastify: FastifyInstance = Fastify({
    logger: env.NODE_ENV === 'development',
  });

  // Core Infrastructure Plugins
  await fastify.register(cors);
  await fastify.register(helmet);
  await fastify.register(monitoringPlugin);

  // Feature Plugins
  await fastify.register(feePlugin);

  // Initialize Services (Domain & Infrastructure)
  const scoringService = new ScoringService();
  const geyserService = new GeyserService(scoringService);
  const tierService = new TierService();

  // Unified Alpha Signal Consumer
  geyserService.on('alpha', (data: AlphaSignal) => {
    void (async () => {
      if (fastify.logAlpha) {
        await fastify.logAlpha({
          type: 'ALPHA-SIGNAL',
          score: data.score,
          latency: data.latency,
          token: data.event.metadata?.symbol,
          mint: data.event.mint,
          liquidity: data.event.initialLiquidity ?? 0,
        });
      }
    })();
  });

  await geyserService.start();

  fastify.decorate('geyserService', geyserService);

  // Health check for Checkly/Guardian
  fastify.get('/health', async (_request, reply) => {
    return await reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
    });
  });

  /**
   * Probability Engine Dashboard Integration
   * Standar: Canonical Master Blueprint v1.3 (Tier-based Filtering)
   */
  fastify.get('/signals', async (request, reply) => {
    const { wallet } = request.query as { wallet: string };

    if (!wallet) {
      return await reply.status(400).send({ error: 'Wallet address required' });
    }

    const profile = await tierService.getUserProfile(wallet);

    // Check Subscription status for gatekeeping
    const isStarlight =
      profile.status === SubscriptionStatus.STARLIGHT ||
      profile.status === SubscriptionStatus.STARLIGHT_PLUS;
    const isVIP = profile.status === SubscriptionStatus.VIP;

    const signals = geyserService.getTieredSignals(profile.rank, isStarlight, isVIP);

    return await reply.send({
      user: {
        wallet: profile.walletAddress,
        rank: profile.rank,
        status: profile.status,
        monthlyVolume: profile.volume.currentMonthVolume,
      },
      count: signals.length,
      signals,
    });
  });

  return fastify;
};

declare module 'fastify' {
  interface FastifyInstance {
    axiom?: Client;
    posthog?: import('posthog-node').PostHog;
    logAlpha?(data: Record<string, unknown>): Promise<void>;
    geyserService: GeyserService;
  }
}
